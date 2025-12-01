import fs from 'fs'
import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
import { delay } from '../src/client'
import { deleteParameters } from '../src/delete'
import { pushParameters } from '../src/push'
import { pullParameters } from '../src/pull'

interface TestEnv {
  AWS_REGION?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  SSM_TEST_PREFIX?: string
}

function loadRunEnv(): TestEnv {
  try {
    const envPath = path.resolve(__dirname, '.env.run.test')
    if (!fs.existsSync(envPath)) return {}
    return dotenv.parse(fs.readFileSync(envPath)) as TestEnv
  } catch (_) {
    return {}
  }
}

const testEnv = loadRunEnv()
const prefix = testEnv.SSM_TEST_PREFIX || process.env.SSM_TEST_PREFIX || '/cli/test/'

function getAwsConfig() {
  const region = testEnv.AWS_REGION || process.env.AWS_REGION
  const accessKeyId = testEnv.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = testEnv.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  
  return region && accessKeyId && secretAccessKey 
    ? { region, accessKeyId, secretAccessKey }
    : undefined
}

describe('pushParameters() and pullParameters()', () => {
  const hasAwsConfig = (() => {
    const region = testEnv.AWS_REGION || process.env.AWS_REGION
    const accessKeyId = testEnv.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = testEnv.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
    return !!(region && accessKeyId && secretAccessKey)
  })()

  const testFn = hasAwsConfig ? it : it.skip
  testFn('Save and get parameters from Parameter Store', async () => {
    const awsConfig = getAwsConfig()
    if (!awsConfig) {
      return
    }

    const tempEnvFile = path.join(os.tmpdir(), `aws-ssm-cli-test-${Date.now()}.env`)
    fs.writeFileSync(tempEnvFile, 'DBNAME=postgres\nDBUSER=postgres\n')

    try {
      await pushParameters({ prefix, file: tempEnvFile, ...awsConfig })

      // Wait for parameters to be available
      await delay(5_000)

      const parameters = await pullParameters({ prefix, ...awsConfig })

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
    const awsConfig = getAwsConfig()
    if (!awsConfig) return
    await deleteParameters({ prefix, ...awsConfig })
  })
})
