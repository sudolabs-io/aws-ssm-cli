# AWS SSM CLI

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
