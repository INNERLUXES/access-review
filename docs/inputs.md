# Inputs

| File | Required | Shape |
|---|---|---|
| roles.json | yes | `{ "role": ["permission", ...] }` |
| assignments.csv | yes | columns `user`, `role` |
| people.csv | no | columns `user`, `status` (`active` or `left`), optional `department` |
| rules.json | no | `{ "conflicts": [{ "name", "a": [...], "b": [...] }], "privileged": [...] }` |

## Where the files usually come from

- **Roles and assignments:** the application's own admin export, or the identity provider's group memberships when roles are granted through groups. Export both on the same day.
- **People:** the HR system's list of employees and contractors with their status. Use the same user name the application uses, or map it before the review.
- **Rules:** your control framework. The duties that must be kept apart are usually written in the internal control documents your auditors test against.

All four files are read as text. CSV files may carry a byte order mark and quoted values with commas.
