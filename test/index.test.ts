import path from 'path'
import { DeleteParametersCommand } from '@aws-sdk/client-ssm'
import { createClient, delay } from '../src/client'
import { pushParameters } from '../src/push'
import { pullParameters } from '../src/pull'

const prefix = '/cli/test/'
const file = path.resolve(__dirname, '.env.test')

describe('pushParameters() and pullParameters()', () => {
  it('Save and get parameters from Parameter Store', async () => {
    await pushParameters({ prefix, file })

    // Wait for parameters to be available
    await delay(5_000)

    const parameters = await pullParameters({ prefix })

    expect(parameters).toEqual({ DBNAME: 'postgres', DBUSER: 'postgres' })
  }, 10_000)

  afterEach(async () => {
    const names = ['DBNAME', 'DBUSER'].map((name) => prefix + name)

    const client = createClient()
    await client.send(new DeleteParametersCommand({ Names: names }))
  })
})
