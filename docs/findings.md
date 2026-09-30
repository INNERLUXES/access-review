# How each finding is worked out

A user's permissions are the union of the permissions of every role they hold. User names are compared without regard to letter case.

## Segregation of duties conflicts

A rule has a name and two lists of permissions, `a` and `b`. A user is in conflict when they hold at least one permission from `a` and at least one from `b`. The report names the permissions on each side and the roles that give them, and says when a single role gives both sides: that role needs to be split, not just unassigned.

The tool has no built-in rules. Which duties must be kept apart depends on the process and on the controls your auditors test; `examples/rules.json` shows the shape for a purchase-to-pay process.

## People who left but still have access

A user whose status in the people list is `left` and who still holds at least one role.

## Accounts not in the people list

A user who holds a role but does not appear in the people list at all: a service account, a test account, a contractor recorded elsewhere, or someone the HR export missed. Each one needs an owner.

## Privileged users

Users who hold any permission listed under `privileged` in the rules file, with the roles that give it.

## Roles nobody holds

Roles in the roles file that no assignment uses. Often left over from an old process; each one is a way to grant access that nobody reviews.

## Redundant role assignments

A role a user holds whose permissions are all contained in another role the same user holds. Removing it changes nothing the user can do today, and it stops the user keeping access if the larger role is later reduced. When two roles have exactly the same permissions, the one later in alphabetical order is reported.

## Checks that were not run

Without a people list, leavers and unknown accounts are "not checked". Without conflict rules or privileged permissions, those sections are "not checked". A check that was not run is never reported as clean.
