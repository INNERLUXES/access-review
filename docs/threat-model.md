# Threat model

The tool reads exports that list people and what they can do, which are sensitive in themselves, and prints findings that may lead to access being removed. The risks are a missed finding, a wrong finding, and the data going where it should not.

| Threat | Response |
|---|---|
| A malformed row is skipped and a real conflict is missed | Every row is checked; the run stops and names each bad row. An assignment to a role that is not in the roles file is refused. |
| A check that was not run is read as "nothing found" | Without its input, a section says "not checked", in every output format. |
| Differences in letter case hide a leaver (`Dan` against `dan`) | User names are compared without regard to case. |
| The review data leaves the machine | The tool opens no network connection and writes a file only when `--output` is given. |
| A report shared widely exposes who holds privileged access | The report lists only findings, not every user's permissions. Share it with the people who act on it. |
| The example rules are used as if they were your controls | The example file says it is an example, and docs/findings.md says the tool has no built-in rules. |

## Outside this model

- Whether the exports are complete and taken on the same day.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
