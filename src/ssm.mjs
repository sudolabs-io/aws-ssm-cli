import { SSMClient, paginateGetParametersByPath, PutParameterCommand, ParameterType } from '@aws-sdk/client-ssm'
import { parseDotenv } from './dotenv.mjs'

function createClient({ region, accessKeyId, secretAccessKey }) {
  const credentials =
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined

  return new SSMClient({ region, credentials })
}

async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function addThrottleMiddleware(client, { batchSize, wait }) {
  let currentBatchSize = 0

  // https://aws.amazon.com/blogs/developer/middleware-stack-modular-aws-sdk-js/
  client.middlewareStack.add(
    (next) => async (args) => {
      if (currentBatchSize > batchSize) {
        currentBatchSize = 0

        await delay(wait)
      }

      currentBatchSize++

      return await next(args)
    },
    {
      step: 'initialize',
    }
  )

  return client
}

export async function pullParameters({ prefix, ...config }) {
  const paginator = paginateGetParametersByPath(
    {
      client: createClient(config),
    },
    {
      Path: prefix,
      Recursive: true,
      WithDecryption: true,
    }
  )

  const parameterList = []
  for await (const page of paginator) {
    parameterList.push(...page.Parameters)
  }

  return parameterList.reduce(
    (parameters, { Name, Value }) => ({
      ...parameters,
      [Name.substr(prefix.length)]: Value,
    }),
    {}
  )
}

/**
 * Parameters are sent one by one with 1 second delay after each 10 requests to avoid `ThrottlingException: Rate exceeded`.
 * See docs:
 * https://aws.amazon.com/premiumsupport/knowledge-center/ssm-parameter-store-rate-exceeded/
 * https://docs.aws.amazon.com/general/latest/gr/ssm.html#limits_ssm
 */
export async function pushParameters({ prefix, file, ...config }) {
  const parameters = parseDotenv(file)
  const client = addThrottleMiddleware(createClient(config), { batchSize: 10, wait: 1000 })

  const putCommands = Object.entries(parameters).map(
    ([name, value]) =>
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
}
