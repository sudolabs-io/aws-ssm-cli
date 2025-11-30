import fs from 'fs'
import os from 'os'
import path from 'path'

jest.mock('@aws-sdk/client-ssm', () => {
  class PutParameterCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  const ParameterType = { STRING: 'String' }
  return { PutParameterCommand, ParameterType }
})

const sendMock = jest.fn()

jest.mock('../src/client', () => {
  return {
    createClient: jest.fn(() => ({ send: sendMock })),
    addThrottleMiddleware: jest.fn(),
    delay: jest.fn(async () => {}),
  }
})

jest.mock('../src/pull', () => ({
  pullParameters: jest.fn(async () => ({ DBNAME: 'postgres', DBUSER: 'old' })),
}))

import { pushParameters } from '../src/push'

describe('pushParameters', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('sends updates for changed and new parameters', async () => {
    const tmp = path.join(os.tmpdir(), `push-${Date.now()}.env`)
    fs.writeFileSync(tmp, 'DBNAME=postgres\nDBUSER=new\nNEWKEY=val\n')
    try {
      await pushParameters({ prefix: '/x/', file: tmp })

      expect(sendMock).toHaveBeenCalledTimes(2)
      const inputs = sendMock.mock.calls.map((args) => args[0].input)
      expect(inputs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Name: '/x/DBUSER', Value: 'new', Overwrite: true }),
          expect.objectContaining({ Name: '/x/NEWKEY', Value: 'val', Overwrite: true }),
        ])
      )
    } finally {
      fs.unlinkSync(tmp)
    }
  })
})


