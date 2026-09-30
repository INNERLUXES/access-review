# 2. Every finding names the roles that cause it

## Context

A list of users in conflict is not enough to act on. The person fixing it needs to know which role to remove, and whether removing one role is enough or the role itself grants both sides of the conflict.

## Decision

- Each conflict lists the permissions on each side and the roles that give them, and says when a single role gives both sides.
- Leavers, unknown accounts and privileged users are listed with their roles.
- Redundant assignments name the role that already covers them.

## Consequences

- The report is longer than a count, but each line can be turned into a ticket without looking anything up.
