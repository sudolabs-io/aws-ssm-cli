import _ from 'lodash'
import { paginateGetParametersByPath } from '@aws-sdk/client-ssm'
import { createClient } from './client.mjs'

export async function pullParameters({ client, prefix, ...config }) {
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

  const parameterList = []
  for await (const page of paginator) {
    parameterList.push(...page.Parameters)
  }

  return _.sortBy(parameterList, 'Name').reduce(
    (parameters, { Name, Value }) => ({
      ...parameters,
      [Name.substr(prefix.length)]: Value,
    }),
    {}
  )
}
