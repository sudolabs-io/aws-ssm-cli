import { SSMClient, GetParametersByPathCommand, PutParameterCommand, ParameterType } from '@aws-sdk/client-ssm'
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

export async function pullParameters({ prefix, ...config }) {
  const client = createClient(config)

  const command = new GetParametersByPathCommand({
    Path: prefix,
    Recursive: true,
    WithDecryption: true,
  })

  const { Parameters } = await client.send(command)
  const parameterList = Parameters ?? []

  return parameterList.reduce(
    (parameters, { Name, Value }) => ({
      ...parameters,
      [Name.substr(prefix.length)]: Value,
    }),
    {}
  )
}

export async function pushParameters({ prefix, file, ...config }) {
  const parameters = parseDotenv(file)
  const client = createClient(config)

  const putCommands = Object.entries(parameters).map(
    ([name, value]) =>
      new PutParameterCommand({
        Type: ParameterType.STRING,
        Overwrite: true,
        Name: `${prefix}${name}`,
        Value: value,
      })
  )

  await Promise.all(putCommands.map((putCommand) => client.send(putCommand)))
}
