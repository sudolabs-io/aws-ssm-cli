import { SSMClient } from '@aws-sdk/client-ssm'
import { ClientConfig } from './types'

export function createClient({ region, accessKeyId, secretAccessKey }: ClientConfig) {
  const credentials =
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined

  return new SSMClient({ region, credentials })
}

async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

type ThrottleConfig = {
  batchSize: number
  wait: number
}

export function addThrottleMiddleware(client: SSMClient, { batchSize, wait }: ThrottleConfig) {
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
