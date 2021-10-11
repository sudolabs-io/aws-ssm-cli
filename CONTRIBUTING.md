# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue before making a change.

## Pull Request Process

This NPM package is published by [semantic-release][semantic]. In order to make it work you need to follow [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format when writing your commit messages. To make this process easier you can use interactive CLI tool [commitizen][commitizen].

### Commitizen

Install [commitizen][commitizen]:

```
npm install -g commitizen
```

Commit your changes with [commitizen][commitizen]. Instead of running `git commit` start [commitizen][commitizen]:

```
cz
```

### Release

[semantic-release][semantic] uses the commit messages to determine the consumer impact of changes in the codebase. Following formalized conventions for commit messages, [semantic-release][semantic] automatically determines the next semantic version number, generates a changelog and publishes the release.

By default, [semantic-release][semantic] uses [Angular Commit Message Conventions](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format). The commit message format can be changed with the preset or config options of the [`@semantic-release/commit-analyzer`](https://github.com/semantic-release/commit-analyzer) and [`@semantic-release/release-notes-generator`](https://github.com/semantic-release/release-notes-generator) plugins.

The table below shows which commit message gets you which release type when [semantic-release][semantic] runs (using the default configuration):

| Commit message                                                                                              | Release type               |
| ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| fix(pencil): stop graphite breaking when too much pressure applied                                          | ~~Patch~~ Fix Release      |
| feat(pencil): add 'graphiteWidth' option                                                                    | ~~Minor~~ Feature Release  |
| perf(pencil): remove graphiteWidth option<br><br>BREAKING CHANGE: The graphiteWidth option has been removed | ~~Major~~ Breaking Release |
| chore(pencil): don't bother publishing                                                                      | Release not triggered      |

[semantic]: https://semantic-release.gitbook.io/semantic-release/
[commitizen]: https://commitizen.github.io/cz-cli/
