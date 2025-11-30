import { SSMClient } from '@aws-sdk/client-ssm'
import { ClientConfig } from './types'

export function createClient({ region, accessKeyId, secretAccessKey }: ClientConfig = {}) {
  const credentials =
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined

  return new SSMClient({ region, credentials })
}

export async function delay(time: number) {
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
      const maxRetries = 7
      const baseDelayMs = 30
      const maxDelayMs = 2_000

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt === 0) {
            if (currentBatchSize >= batchSize) {
              currentBatchSize = 0
              await delay(wait)
            }
            currentBatchSize++
          }

          return await next(args)
        } catch (error: any) {
          const isThrottle = error?.name === 'ThrottlingException' || error?.__type === 'ThrottlingException'
          if (!isThrottle || attempt === maxRetries) {
            throw error
          }

          const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
          const jitter = Math.floor(Math.random() * backoff)
          await delay(jitter)
        }
      }

      throw new Error('Unexpected fallthrough in throttle middleware')
    },
    {
      step: 'initialize',
    }
  )

  return client
}
