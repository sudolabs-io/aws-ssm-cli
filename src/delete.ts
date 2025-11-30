import _ from 'lodash'
import { DeleteParametersCommand, SSMClient, paginateGetParametersByPath } from '@aws-sdk/client-ssm'
import { createClient, delay } from './client'
import { ClientConfig } from './types'

export interface Delete extends ClientConfig {
  prefix: string
}

export async function deleteParameters({ prefix, ...config }: Delete): Promise<void> {
  const client = createClient(config)

  const paginator = paginateGetParametersByPath(
    { client },
    {
      Path: prefix,
      Recursive: true,
      WithDecryption: false,
    }
  )

  const names: string[] = []
  for await (const page of paginator) {
    for (const p of page.Parameters ?? []) {
      if (p.Name) names.push(p.Name)
    }
  }

  if (names.length === 0) {
    console.log('No parameters to delete')
    return
  }

  const batches = _.chunk(names, 10)
  const startedAt = Date.now()

  let deleted = 0
  let invalid = 0
  let throttles = 0

  for (const batch of batches) {
    const result = await sendDeleteWithBackoff(client, batch, () => {
      throttles++
    })
    deleted += result.deleted
    invalid += result.invalid
    await delay(100)
  }

  const durationMs = Date.now() - startedAt
  console.log(
    [
      'Delete summary:',
      `- total found: ${names.length}`,
      `- deleted: ${deleted}`,
      `- invalid: ${invalid}`,
      `- throttles: ${throttles}`,
      `- duration: ${durationMs} ms`,
    ].join('\n')
  )
}

async function sendDeleteWithBackoff(
  client: SSMClient,
  names: string[],
  onThrottle: () => void
): Promise<{ deleted: number; invalid: number }> {
  const maxRetries = 7
  const baseDelayMs = 100
  const maxDelayMs = 2_000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await client.send(new DeleteParametersCommand({ Names: names }))
      return {
        deleted: res.DeletedParameters?.length ?? 0,
        invalid: res.InvalidParameters?.length ?? 0,
      }
    } catch (error: any) {
      const isThrottle = error?.name === 'ThrottlingException' || error?.__type === 'ThrottlingException'
      if (!isThrottle || attempt === maxRetries) {
        throw error
      }

      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      const jitter = Math.floor(Math.random() * backoff)
      onThrottle()
      await delay(jitter)
    }
  }

  throw new Error('Failed to delete parameters: unexpected fallthrough')
}


