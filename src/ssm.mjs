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
