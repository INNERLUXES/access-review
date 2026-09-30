import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, parseRoles, parseAssignments, parsePeople, parseRules } from '../src/input.js';
import { roles, assignments, people, rules } from './fixtures.js';

test('csv with quotes, a byte order mark and blank lines', () => {
  const rows = parseCsv('﻿User,Role\r\n"smith, j",clerk\r\n\r\n"a ""quoted"" name",viewer\r\n', ['user', 'role'], 'x');
  assert.deepEqual(rows, [{ user: 'smith, j', role: 'clerk' }, { user: 'a "quoted" name', role: 'viewer' }]);
  assert.throws(() => parseCsv('', ['user'], 'x'), /empty/);
  assert.throws(() => parseCsv('name\nann', ['user'], 'x'), /missing column\(s\) user/);
  assert.throws(() => parseCsv('user,role\nann', ['user', 'role'], 'x'), /line 2: expected 2 values, found 1/);
});

test('roles are sets of permissions', () => {
  const r = parseRoles(roles());
  assert.equal(r.size, 6);
  assert.ok(r.get('admin').has('user.manage'));
  assert.throws(() => parseRoles([]), /must be an object/);
  assert.throws(() => parseRoles({ x: 'read' }), /role x: permissions must be a list/);
});

test('assignments: user names lower-cased, unknown roles refused', () => {
  const a = parseAssignments(assignments(), parseRoles(roles()));
  assert.equal(a.length, 7);
  assert.deepEqual(a[1], { user: 'ann', role: 'approver' });
  assert.throws(() => parseAssignments('user,role\nann,ghost\n,clerk', parseRoles(roles())),
    (e) => /line 2: role ghost is not in the roles file/.test(e.message) && /line 3: user is empty/.test(e.message));
});

test('people: active or left, no duplicates', () => {
  const p = parsePeople(people());
  assert.equal(p.get('dan').status, 'left');
  assert.equal(p.get('ann').department, 'Finance');
  assert.throws(() => parsePeople('user,status\nann,gone'), /status must be active or left/);
  assert.throws(() => parsePeople('user,status\nann,active\nANN,left'), /listed twice/);
});

test('rules are checked', () => {
  const r = parseRules(rules());
  assert.equal(r.conflicts.length, 2);
  assert.ok(r.privileged.has('user.manage'));
  assert.deepEqual(parseRules({}).conflicts, []);
  assert.throws(() => parseRules({ conflicts: [{ a: ['x'], b: [] }] }), (e) => /name is required/.test(e.message) && /b must be a non-empty list/.test(e.message));
  assert.throws(() => parseRules({ privileged: 'admin' }), /privileged must be a list/);
});
