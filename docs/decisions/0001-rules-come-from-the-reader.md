# 1. The conflict rules come from the reader

## Context

Segregation of duties rules look universal (whoever creates an invoice should not approve it), but the real list depends on the process, the size of the team and the controls an auditor tests. A small team may accept a conflict with a compensating control; a bank may need rules a retailer never would.

## Decision

- The tool has no built-in conflict rules and no built-in list of privileged permissions. Both come from the rules file.
- The example rules for a purchase-to-pay process show the shape and are marked as an example.

## Consequences

- A review without a rules file finds no conflicts, and says "not checked" rather than "none".
- The rules file becomes a document in its own right, which can be versioned and reviewed next to the controls it implements.
