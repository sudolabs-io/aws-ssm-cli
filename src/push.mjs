import _ from 'lodash'
import { PutParameterCommand, ParameterType } from '@aws-sdk/client-ssm'
import { parseDotenv } from './dotenv.mjs'
import { createClient, addThrottleMiddleware } from './client.mjs'
import { pullParameters } from './pull.mjs'

async function analyze({ client, prefix, file }) {
  const parsedParameters = parseDotenv(file)

  const remoteParameters = await pullParameters({ client, prefix })

  let skipped = 0
  let updated = 0
  let created = 0

  const parametersToUpdate = _.reduce(
    parsedParameters,
    (toUpdate, value, name) => {
      if (_.has(remoteParameters, name)) {
        if (remoteParameters[name] === value) {
          skipped++
        } else {
          updated++
          toUpdate[name] = value
        }
      } else {
        created++
        toUpdate[name] = value
      }

      return toUpdate
    },
    {}
  )

  return {
    total: _.size(parsedParameters),
    skipped,
    updated,
    created,
    parameters: parametersToUpdate,
  }
}

function printStat({ total, skipped, updated, created }) {
  const padSize = _.max([skipped, updated, created]).toString().length

  console.log(
    [
      `Total ${total} of parameters:`,
      `  ${_.padStart(skipped, padSize)} up-to-date`,
      `~ ${_.padStart(updated, padSize)} updated`,
      `+ ${_.padStart(created, padSize)} created`,
    ].join('\n')
  )
}

/**
 * Parameters are sent one by one with 1 second delay after each 10 requests to avoid `ThrottlingException: Rate exceeded`.
 * See docs:
 * https://aws.amazon.com/premiumsupport/knowledge-center/ssm-parameter-store-rate-exceeded/
 * https://docs.aws.amazon.com/general/latest/gr/ssm.html#limits_ssm
 */
export async function pushParameters({ prefix, file, ...config }) {
  const client = createClient(config)

  const { parameters, ...stat } = await analyze({ client, prefix, file })

  addThrottleMiddleware(client, { batchSize: 10, wait: 1000 })

  const putCommands = _.map(
    parameters,
    (value, name) =>
      new PutParameterCommand({
        Type: ParameterType.STRING,
        Overwrite: true,
        Name: `${prefix}${name}`,
        Value: value,
      })
  )

  for (const putCommand of putCommands) {
    await client.send(putCommand)
  }

  printStat(stat)
}
