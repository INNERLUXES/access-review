# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Adding or changing a finding

1. Describe the rule in docs/findings.md first.
2. Add a test with a small, made-up organization where the expected result can be worked out by hand.
3. A finding names the user and the roles that cause it.
4. A check whose input is missing reports "not checked", never an empty result.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the files it is given and writes only when `--output` is given. It opens no network connection.
- No built-in conflict rules. Examples are marked as examples.
- Never commit a real export of users, even as a test fixture.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
