jest.mock('@aws-sdk/client-ssm', () => {
  class SSMClient {
    config: any
    constructor(config: any) {
      this.config = config
    }
  }
  return { SSMClient }
})

import { createClient, addThrottleMiddleware, delay } from '../src/client'

describe('client helpers', () => {
  it('createClient passes region and credentials', () => {
    const client: any = createClient({ region: 'us-east-1', accessKeyId: 'A', secretAccessKey: 'S' })
    expect(client.config).toEqual({ region: 'us-east-1', credentials: { accessKeyId: 'A', secretAccessKey: 'S' } })
  })

  it('addThrottleMiddleware registers middleware and returns same client', () => {
    const add = jest.fn()
    const client: any = { middlewareStack: { add } }
    const returned = addThrottleMiddleware(client, { batchSize: 2, wait: 1 })
    expect(returned).toBe(client)
    expect(add).toHaveBeenCalled()
    const options = add.mock.calls[0][1]
    expect(options).toEqual({ step: 'initialize' })
  })

  it('delay resolves after roughly the specified time', async () => {
    const start = Date.now()
    await delay(10)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(8)
  })
})


