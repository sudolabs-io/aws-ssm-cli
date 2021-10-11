import { SSMClient } from '@aws-sdk/client-ssm'

export function createClient({ region, accessKeyId, secretAccessKey }) {
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

export function addThrottleMiddleware(client, { batchSize, wait }) {
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
