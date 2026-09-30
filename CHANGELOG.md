# Changes

## 1.0.0

First release.

- Segregation of duties conflicts from your own rules, with the roles that cause each one and a flag when one role gives both sides.
- People who left but keep access, and accounts that are not in the people list.
- Privileged users, roles nobody holds, and roles already covered by another role of the same user.
- Reports as text, Markdown, JSON and CSV; `--fail-on-findings` for use in a pipeline.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
