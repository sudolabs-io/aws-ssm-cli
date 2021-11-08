import _ from 'lodash'
import { SSMClient, paginateGetParametersByPath } from '@aws-sdk/client-ssm'
import { createClient } from './client.js'
import { ClientConfig, Parameters } from './types.js'

interface Pull extends ClientConfig {
  client?: SSMClient
  prefix: string
}

type Parameter = {
  name: string
  value: string
}

export async function pullParameters({ client, prefix, ...config }: Pull): Promise<Parameters> {
  const paginator = paginateGetParametersByPath(
    {
      client: client ?? createClient(config),
    },
    {
      Path: prefix,
      Recursive: true,
      WithDecryption: true,
    }
  )

  const parameterList: Parameter[] = []
  for await (const page of paginator) {
    if (!page.Parameters) {
      continue
    }

    for (const { Name, Value } of page.Parameters) {
      if (Name) {
        parameterList.push({ name: Name, value: Value ?? '' })
      }
    }
  }

  return _.sortBy(parameterList, (p) => p.name).reduce(
    (parameters, { name, value }) => ({
      ...parameters,
      [name.substr(prefix.length)]: value,
    }),
    {}
  )
}
