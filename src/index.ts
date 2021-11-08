#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { Options } from 'yargs'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { Pull, pullParameters } from './pull'
import { Push, pushParameters } from './push'
import { toDotenvString } from './dotenv'

const clientOptions: Record<string, Options> = {
  region: {
    type: 'string',
    describe: 'AWS Region',
  },
  'access-key-id': {
    type: 'string',
    describe: 'AWS Access Key ID',
  },
  'secret-access-key': {
    type: 'string',
    describe: 'AWS Secret Access Key',
  },
}

yargs(hideBin(process.argv))
  .command({
    command: 'push',
    describe: 'Push environment variables to AWS SSM Parameter Store',
    builder: (y) =>
      y.options({
        ...clientOptions,
        prefix: {
          alias: 'p',
          type: 'string',
          describe: 'Push variables with prefix',
          demandOption: true,
        },
        file: {
          alias: 'f',
          type: 'string',
          describe: 'Dotenv file with variables',
          coerce: (file) => path.resolve(process.cwd(), file),
          demandOption: true,
        },
      }),
    handler: async (pushArgs: Push) => {
      await pushParameters(pushArgs)
    },
  })
  .command({
    command: 'pull',
    describe: 'Pull environment variables from AWS SSM Parameter Store',
    builder: (y) =>
      y.options({
        ...clientOptions,
        prefix: {
          alias: 'p',
          type: 'string',
          describe: 'Pull variables starting with prefix',
          demandOption: true,
        },
        json: {
          type: 'boolean',
          describe: 'Format `pull` output as JSON',
        },
        group: {
          type: 'string',
          describe: 'Group environment variables as keys of an object',
          implies: 'json',
        },
      }),
    handler: async ({ json, group, ...pullArgs }: Pull & { json?: boolean; group?: string }) => {
      const parameters = await pullParameters(pullArgs)

      if (json) {
        const jsonParameters = group ? { [group]: parameters } : parameters
        console.log(jsonParameters)
      } else {
        console.log(toDotenvString(parameters))
      }
    },
  })
  .check(({ prefix, file }) => {
    if (prefix) {
      if (!prefix.startsWith('/')) {
        throw new Error('prefix must start with slash "/"')
      }
      if (!prefix.endsWith('/')) {
        throw new Error('prefix must end with slash "/"')
      }
    }

    if (file && !fs.existsSync(file)) {
      throw new Error(`file ${file} does not exist`)
    }

    return true
  })
  .alias({ h: 'help', v: 'version' })
  .group(['help', 'version'], '')
  .group(Object.keys(clientOptions), 'Client Options:')
  .example([
    [
      'push --prefix="/<project>/<environment>/" --file=".env"',
      'Push environment variables stored in .env file with prefix',
    ],
    ['pull --prefix="/<project>/<environment>/" --json', 'Pull environment variables by prefix'],
  ])
  .demandCommand()
  .strictCommands()
  .strictOptions().argv
