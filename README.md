# AWS SSM CLI

![main workflow](https://github.com/sudolabs-io/aws-ssm-cli/actions/workflows/release.yml/badge.svg) ![npm](https://img.shields.io/npm/v/@sudolabs-io/aws-ssm-cli) ![npm](https://img.shields.io/npm/dm/@sudolabs-io/aws-ssm-cli)

```
Usage:
  $ ssm pull --prefix='/<PROJECT>/<ENVIRONMENT>/'
  $ ssm push --file=.env

Options:
  --region             AWS Region
  --access-key-id      AWS Access Key ID
  --secret-access-key  AWS Secret Access Key

Pull Options:
  --prefix, -p         Pull variables starting with prefix
  --json               Format pull output as JSON

Push Options:
  --prefix, -p         Push variables with prefix
  --file, -f           Dotenv file to upload variables from
```
