// The four inputs of an access review, checked record by record. A bad record stops the run with its position:
// an access review that silently skips a row can miss the one account that matters.

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// CSV with a header line -> list of objects keyed by the lower-cased header names.
export function parseCsv(text, required, name) {
  const rows = csvRows(text);
  if (!rows.length) throw new Error(`${name}: the file is empty`);
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = required.filter((r) => !head.includes(r));
  if (missing.length) throw new Error(`${name}: missing column(s) ${missing.join(', ')}`);
  return rows.slice(1).map((r, i) => {
    if (r.length !== head.length) throw new Error(`${name} line ${i + 2}: expected ${head.length} values, found ${r.length}`);
    return Object.fromEntries(head.map((h, k) => [h, r[k].trim()]));
  });
}

// roles: { "role": ["permission", ...] }
export function parseRoles(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('roles must be an object of role -> list of permissions');
  const errors = [];
  const out = new Map();
  for (const [role, perms] of Object.entries(obj)) {
    if (!Array.isArray(perms) || perms.some((p) => typeof p !== 'string' || !p.trim())) { errors.push(`role ${role}: permissions must be a list of names`); continue; }
    out.set(role, new Set(perms.map((p) => p.trim())));
  }
  if (errors.length) throw new Error(`invalid roles:\n  ${errors.join('\n  ')}`);
  return out;
}

// assignments.csv: user,role
export function parseAssignments(text, roles) {
  const rows = parseCsv(text, ['user', 'role'], 'assignments');
  const errors = [];
  rows.forEach((r, i) => {
    if (!r.user) errors.push(`assignments line ${i + 2}: user is empty`);
    if (!roles.has(r.role)) errors.push(`assignments line ${i + 2}: role ${r.role || '(empty)'} is not in the roles file`);
  });
  if (errors.length) throw new Error(`invalid assignments:\n  ${errors.join('\n  ')}`);
  return rows.map((r) => ({ user: r.user.toLowerCase(), role: r.role }));
}

// people.csv: user,status[,department] where status is active or left
export function parsePeople(text) {
  const rows = parseCsv(text, ['user', 'status'], 'people');
  const errors = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const s = r.status.toLowerCase();
    if (!['active', 'left'].includes(s)) errors.push(`people line ${i + 2}: status must be active or left, not "${r.status}"`);
    const u = r.user.toLowerCase();
    if (seen.has(u)) errors.push(`people line ${i + 2}: ${r.user} is listed twice`);
    seen.add(u);
  });
  if (errors.length) throw new Error(`invalid people list:\n  ${errors.join('\n  ')}`);
  return new Map(rows.map((r) => [r.user.toLowerCase(), { status: r.status.toLowerCase(), department: r.department || '' }]));
}

// rules: { "conflicts": [{ "name", "a": [perm...], "b": [perm...] }], "privileged": [perm...] }
export function parseRules(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('rules must be an object');
  const list = (v) => Array.isArray(v) && v.every((p) => typeof p === 'string' && p.trim());
  const conflicts = obj.conflicts ?? [];
  const privileged = obj.privileged ?? [];
  const errors = [];
  if (!Array.isArray(conflicts)) errors.push('conflicts must be a list');
  else conflicts.forEach((c, i) => {
    if (!c || typeof c.name !== 'string' || !c.name) errors.push(`conflicts[${i}]: name is required`);
    if (!list(c?.a) || !c.a.length) errors.push(`conflicts[${i}]: a must be a non-empty list of permissions`);
    if (!list(c?.b) || !c.b.length) errors.push(`conflicts[${i}]: b must be a non-empty list of permissions`);
  });
  if (!list(privileged)) errors.push('privileged must be a list of permissions');
  if (errors.length) throw new Error(`invalid rules:\n  ${errors.join('\n  ')}`);
  return { conflicts: conflicts.map((c) => ({ name: c.name, a: new Set(c.a), b: new Set(c.b) })), privileged: new Set(privileged) };
}
