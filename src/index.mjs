#!/usr/bin/env node
import meow from 'meow'
import { pullParameters } from './pull.mjs'
import { pushParameters } from './push.mjs'
import { toDotenvString } from './dotenv.mjs'

const COMMANDS = {
  pull: 'pull',
  push: 'push',
}

const cli = meow(
  `
	Usage:
    $ ssm pull --prefix='/<PROJECT>/<ENVIRONMENT>/'
    $ ssm push --file=.env

	Options:
    --region             AWS Region
    --access-key-id      AWS Access Key ID
    --secret-access-key  AWS Secret Access Key

  Pull Options:
    --prefix, -p         Pull variables starting with prefix
    --json               Format \`pull\` output as JSON

    Push Options:
    --prefix, -p         Push variables with prefix
    --file, -f           Dotenv file to upload variables from
`,
  {
    importMeta: import.meta,
    input: Object.values(COMMANDS),
    flags: {
      region: {
        type: 'string',
      },
      accessKeyId: {
        type: 'string',
        isRequired: (flags) => Boolean(flags.secretAccessKey),
      },
      secretAccessKey: {
        type: 'string',
        isRequired: (flags) => Boolean(flags.accessKeyId),
      },
      prefix: {
        type: 'string',
        alias: 'p',
        isRequired: true,
      },
      // Pull flags
      json: {
        type: 'boolean',
        default: false,
      },
      // Push flags
      file: {
        type: 'string',
        alias: 'f',
        isRequired: (_, [command]) => command === COMMANDS.push,
      },
    },
  }
)

const {
  input: [command],
  flags,
} = cli

if (command === COMMANDS.pull) {
  const parameters = await pullParameters(flags)

  if (flags.json) {
    console.log(JSON.stringify(parameters))
  } else {
    console.log(toDotenvString(parameters))
  }
} else if (command === COMMANDS.push) {
  await pushParameters(flags)
} else {
  cli.showHelp()
}
