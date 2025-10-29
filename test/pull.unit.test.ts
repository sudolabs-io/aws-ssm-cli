import { pullParameters } from '../src/pull'

jest.mock('@aws-sdk/client-ssm', () => {
  return {
    paginateGetParametersByPath: () => ({
      async *[Symbol.asyncIterator]() {
        yield { Parameters: [{ Name: '/p/DBZ', Value: 'z' }, { Name: '/p/DBA', Value: 'a' }] }
        yield { Parameters: [{ Name: '/p/API', Value: 'k' }] }
        yield {}
      },
    }),
  }
})

describe('pullParameters', () => {
  it('returns mapping without prefix and sorted by name', async () => {
    const result = await pullParameters({ client: ({} as any), prefix: '/p/' })
    expect(result).toEqual({ API: 'k', DBA: 'a', DBZ: 'z' })
  })
})


