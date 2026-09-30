import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoles, parseAssignments, parsePeople, parseRules } from '../src/input.js';
import { permissionsOf, conflicts, leaversAndUnknown, privilegedUsers, unusedRoles, redundantAssignments, review, findingCount } from '../src/review.js';
import { roles, assignments, people, rules } from './fixtures.js';

function input() {
  const r = parseRoles(roles());
  return { roles: r, assignments: parseAssignments(assignments(), r), people: parsePeople(people()), rules: parseRules(rules()) };
}

test('permissions of a user come from all their roles', () => {
  const x = input();
  const p = permissionsOf('ann', x.assignments, x.roles);
  assert.deepEqual(p.roles, ['approver', 'clerk']);
  assert.deepEqual([...p.permissions].sort(), ['invoice.approve', 'invoice.create', 'vendor.read']);
});

test('segregation of duties: across two roles and inside one', () => {
  const x = input();
  const c = conflicts(x.assignments, x.roles, x.rules);
  assert.deepEqual(c.map((f) => [f.user, f.rule, f.roles, f.withinOneRole]), [
    ['ann', 'create and approve invoices', ['approver', 'clerk'], false],
    ['bob', 'create and approve invoices', ['admin'], true]
  ]);
});

test('leavers with access and accounts nobody knows', () => {
  const x = input();
  assert.deepEqual(leaversAndUnknown(x.assignments, x.people), {
    leavers: [{ user: 'dan', roles: ['approver'] }],
    unknown: [{ user: 'eve', roles: ['viewer'] }]
  });
});

test('privileged users, unused roles and redundant roles', () => {
  const x = input();
  assert.deepEqual(privilegedUsers(x.assignments, x.roles, x.rules), [{ user: 'bob', permissions: ['user.manage'], roles: ['admin'] }]);
  assert.deepEqual(unusedRoles(x.assignments, x.roles), ['auditor', 'vendor_admin']);
  assert.deepEqual(redundantAssignments(x.assignments, x.roles), [{ user: 'cara', role: 'viewer', coveredBy: 'clerk' }]);
});

test('two roles with the same permissions: only one is reported as redundant', () => {
  const r = parseRoles({ a: ['p'], b: ['p'] });
  const a = parseAssignments('user,role\nx,a\nx,b', r);
  assert.deepEqual(redundantAssignments(a, r), [{ user: 'x', role: 'b', coveredBy: 'a' }]);
});

test('the whole review, and the count that decides --fail-on-findings', () => {
  const r = review(input());
  assert.equal(r.users, 5);
  assert.equal(r.roles, 6);
  assert.equal(r.assignments, 7);
  assert.equal(findingCount(r), 4);
  assert.deepEqual(r.checked, { conflicts: 2, privileged: true, people: true });
});

test('checks without their input are marked as not run, not as clean', () => {
  const x = input();
  const r = review({ roles: x.roles, assignments: x.assignments });
  assert.equal(r.leavers, null);
  assert.equal(r.unknownAccounts, null);
  assert.equal(r.checked.conflicts, 0);
  assert.equal(findingCount(r), 0);
});
