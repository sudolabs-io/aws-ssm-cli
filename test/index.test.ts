import fs from 'fs'
import os from 'os'
import path from 'path'
import { DeleteParametersCommand } from '@aws-sdk/client-ssm'
import { createClient, delay } from '../src/client'
import { pushParameters } from '../src/push'
import { pullParameters } from '../src/pull'

const prefix = process.env.SSM_TEST_PREFIX || '/cli/test/'

function readCredentialsFromFile(): { accessKeyId: string; secretAccessKey: string } | undefined {
  try {
    const credsPath = path.resolve(__dirname, 'aws-access-key.txt')
    const text = fs.readFileSync(credsPath, 'utf8')
    const accessKeyId = text.match(/Access Key:\s*(\S+)/)?.[1]
    const secretAccessKey = text.match(/Secret Access Key:\s*(\S+)/)?.[1]
    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey }
    }
  } catch (_) {
    // ignore
  }
  return undefined
}

function getAwsConfig(): { region: string; accessKeyId: string; secretAccessKey: string } | undefined {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (region && accessKeyId && secretAccessKey) {
    return { region, accessKeyId, secretAccessKey }
  }

  const fileCreds = readCredentialsFromFile()
  if (region && fileCreds) {
    return { region, ...fileCreds }
  }

  return undefined
}

describe('pushParameters() and pullParameters()', () => {
  const awsConfig = getAwsConfig()
  const itOrSkip = awsConfig ? it : it.skip

  itOrSkip('Save and get parameters from Parameter Store', async () => {
    const tempEnvFile = path.join(os.tmpdir(), `aws-ssm-cli-test-${Date.now()}.env`)
    fs.writeFileSync(tempEnvFile, 'DBNAME=postgres\nDBUSER=postgres\n')

    try {
      await pushParameters({ prefix, file: tempEnvFile, ...awsConfig! })

      // Wait for parameters to be available
      await delay(5_000)

      const parameters = await pullParameters({ prefix, ...awsConfig! })

      expect(parameters).toEqual({ DBNAME: 'postgres', DBUSER: 'postgres' })
    } finally {
      try {
        fs.unlinkSync(tempEnvFile)
      } catch (_) {
        // ignore
      }
    }
  }, 10_000)

  afterEach(async () => {
    if (!awsConfig) return
    const names = ['DBNAME', 'DBUSER'].map((name) => prefix + name)

    const client = createClient(awsConfig)
    await client.send(new DeleteParametersCommand({ Names: names }))
  })
})
