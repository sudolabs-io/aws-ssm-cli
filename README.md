# AWS SSM CLI

Command line utility for managing environment variables in AWS Systems Manager Parameter Store.

[npm]: https://npmjs.com/@sudolabs-io/aws-ssm-cli

![release workflow](https://github.com/sudolabs-io/aws-ssm-cli/actions/workflows/release.yml/badge.svg) [![npm](https://img.shields.io/npm/v/@sudolabs-io/aws-ssm-cli)][npm] [![npm](https://img.shields.io/npm/dm/@sudolabs-io/aws-ssm-cli)][npm]

## Examples

### Push

Imagine having `.env` file with content:

```
DBNAME=postgres
DBUSER=postgres
```

To push environment variables into AWS SSM Parameter Store run:

```
$ ssm push --prefix="/<project>/<environment>/" --file=".env"
   0 up-to-date
 ~ 0 updated
 + 2 created
```

### Pull

Pull environment variables from AWS SSM Parameter Store:

```
$ ssm pull --prefix="/<project>/<environment>/"
DBNAME=postgres
DBUSER=postgres
```

Pull environment variables from AWS SSM Parameter Store as JSON:

```
$ ssm pull --prefix="/<project>/<environment>/" --json
{ "DBNAME": "postgres", "DBUSER": "postgres" }
```

Pull environment variables from AWS SSM Parameter Store as JSON object with predefined key:

```
$ ssm pull --prefix="/<project>/<environment>/" --json --group="environment_variables"
{ "environment_variables": { "DBNAME": "postgres", "DBUSER": "postgres" } }
```

### More

Show help:

```
$ ssm --help
```

Show version:

```
$ ssm --version
```
