# access-review

Reviews who can do what in an enterprise system, from four exported files: the roles and their permissions, who holds which role, the people list from HR, and your own rules.

It answers the questions an access review or an audit asks:

- Who can do two things that should be kept apart, such as creating and approving the same invoice?
- Who has left but still has access?
- Which accounts belong to nobody in the people list?
- Who holds privileged permissions, and through which role?
- Which roles does nobody hold, and which role assignments add nothing?

Plain JavaScript, no dependencies. It reads the files you give it and fetches nothing; the exports stay on your machine.

```
npm test
```

```
# tests 21
# pass 21
# fail 0
```

## Try it

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/access-review.git
cd access-review
npm run example
```

```
Access review: 8 users, 8 roles, 12 role assignments

Segregation of duties conflicts: 3
  b.baker: approve invoices and release payments (invoice.approve with payment.release) via accounts_payable_approver, payment_runner
  c.chen: change vendors and approve invoices (vendor.create, vendor.update with invoice.approve) via accounts_payable_approver, vendor_master_admin
  e.evans: change bank details and release payments (bank.update with payment.release) via treasury - inside one role
People who left but still have access: 1
  d.diaz: accounts_payable_clerk
Accounts not in the people list: 1
  svc.integration: finance_viewer
Users with privileged permissions: 1
  e.evans: user.manage, role.manage, bank.update via system_admin, treasury
Roles nobody holds: 1 (old_reporting)
Roles already covered by another role of the same user: 0
```

The organization and the rules in `examples/` are made up. Your conflict rules come from your own controls; the tool has none built in.

## Your own data

| File | Shape |
|---|---|
| `--roles roles.json` | `{ "role": ["permission", ...] }` |
| `--assignments assignments.csv` | columns `user`, `role` |
| `--people people.csv` | columns `user`, `status` (`active` or `left`), optional `department` |
| `--rules rules.json` | `{ "conflicts": [{ "name", "a": [...], "b": [...] }], "privileged": [...] }` |

[docs/inputs.md](docs/inputs.md) says where each file usually comes from, and [docs/findings.md](docs/findings.md) gives the exact rule behind each finding.

## Options

| Option | What it does |
|---|---|
| `--format text\|markdown\|json\|csv` | CSV has one line per finding, ready to turn into tickets |
| `--output <file>` | Write the report to a file |
| `--fail-on-findings` | Exit 1 when there is a conflict, a leaver with access or an unknown account |

Exit codes: 0 done, 1 findings with `--fail-on-findings`, 2 wrong usage or invalid input.

## Rules that keep the review honest

- Every row is checked; a bad one stops the run with its line number instead of being skipped.
- A check without its input says "not checked", never "none found".
- Every finding names the roles behind it, and says when one role gives both sides of a conflict.
- No conflict rules are built in. [docs/limits.md](docs/limits.md) lists what a file-based review cannot see.

## As a library

```js
import { parseRoles, parseAssignments, parsePeople, parseRules, review, toMarkdown } from './src/index.js';

const roles = parseRoles(rolesJson);
const result = review({ roles, assignments: parseAssignments(assignmentsCsv, roles), people: parsePeople(peopleCsv), rules: parseRules(rulesJson) });
console.log(toMarkdown(result));
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials and leftovers.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind [enterprise software development at INNERLUXES](https://innerluxes.dev/software-development/enterprise).

## License

MIT
