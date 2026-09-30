# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "access-review security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include files that show the problem (made-up names are best), what you expected and what happened. Do not send real exports of your users.

## Scope

In scope:

- input that passes validation but produces a missing or wrong finding
- input that makes the tool hang or use unbounded memory
- anything that makes the tool open a network connection, or read or write a file it was not given

Out of scope: access that is not in the exported files; docs/limits.md lists those cases.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
