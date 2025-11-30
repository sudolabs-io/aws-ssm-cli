jest.mock('@aws-sdk/client-ssm', () => {
  class DeleteParametersCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  return {
    DeleteParametersCommand,
    paginateGetParametersByPath: () => ({
      async *[Symbol.asyncIterator]() {
        const names = Array.from({ length: 23 }, (_, i) => ({ Name: `/x/N${i + 1}`, Value: String(i + 1) }))
        yield { Parameters: names }
      },
    }),
  }
})

const sendMock = jest.fn(async (cmd: any) => ({ DeletedParameters: cmd.input.Names }))

jest.mock('../src/client', () => ({
  createClient: jest.fn(() => ({ send: sendMock })),
  delay: jest.fn(async () => {}),
}))

import { deleteParameters } from '../src/delete'

describe('deleteParameters', () => {
  beforeEach(() => {
    sendMock.mockClear()
  })

  it('deletes in batches of 10', async () => {
    await deleteParameters({ prefix: '/x/' })
    expect(sendMock).toHaveBeenCalledTimes(3)

    const batchSizes = sendMock.mock.calls.map((args) => args[0].input.Names.length)
    expect(batchSizes).toEqual([10, 10, 3])
  })
})


