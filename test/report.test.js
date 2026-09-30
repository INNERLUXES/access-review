import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoles, parseAssignments, parsePeople, parseRules } from '../src/input.js';
import { review } from '../src/review.js';
import { toText, toMarkdown, toJson, toCsv } from '../src/report.js';
import { roles, assignments, people, rules } from './fixtures.js';

function full() {
  const r = parseRoles(roles());
  return review({ roles: r, assignments: parseAssignments(assignments(), r), people: parsePeople(people()), rules: parseRules(rules()) });
}

test('text report lists every finding with its cause', () => {
  const t = toText(full());
  assert.match(t, /^Access review: 5 users, 6 roles, 7 role assignments/);
  assert.match(t, /ann: create and approve invoices \(invoice\.create with invoice\.approve\) via approver, clerk/);
  assert.match(t, /bob: .* via admin - inside one role/);
  assert.match(t, /People who left but still have access: 1\n  dan: approver/);
  assert.match(t, /Roles nobody holds: 2 \(auditor, vendor_admin\)/);
  assert.match(t, /cara: viewer is inside clerk/);
});

test('a check without its input says not checked', () => {
  const r = parseRoles(roles());
  const t = toText(review({ roles: r, assignments: parseAssignments(assignments(), r) }));
  assert.match(t, /Segregation of duties conflicts: not checked \(no conflict rules given\)/);
  assert.match(t, /People who left but still have access: not checked/);
  assert.match(toMarkdown(review({ roles: r, assignments: parseAssignments(assignments(), r) })), /### People who left but still have access\n\nNot checked\./);
});

test('markdown tables, json and csv', () => {
  const r = full();
  assert.match(toMarkdown(r), /\| ann \| create and approve invoices \| invoice\.create with invoice\.approve \| approver, clerk \|/);
  assert.equal(JSON.parse(toJson(r)).conflicts.length, 2);
  const csv = toCsv(r).split('\n');
  assert.equal(csv[0], 'finding,user,detail,roles');
  assert.equal(csv.length, 1 + 2 + 1 + 1 + 1 + 1);
});
