// Output as text, Markdown, JSON or CSV (one line per finding). A check that was not run says so,
// instead of reporting nothing found.

const notRun = (what) => `not checked (${what})`;

export function toText(r) {
  const out = [`Access review: ${r.users} users, ${r.roles} roles, ${r.assignments} role assignments`, ''];
  out.push(`Segregation of duties conflicts: ${r.checked.conflicts ? r.conflicts.length : notRun('no conflict rules given')}`);
  for (const c of r.conflicts) out.push(`  ${c.user}: ${c.rule} (${c.a.join(', ')} with ${c.b.join(', ')}) via ${c.roles.join(', ')}${c.withinOneRole ? ' - inside one role' : ''}`);
  out.push(`People who left but still have access: ${r.leavers ? r.leavers.length : notRun('no people list given')}`);
  for (const x of r.leavers ?? []) out.push(`  ${x.user}: ${x.roles.join(', ')}`);
  out.push(`Accounts not in the people list: ${r.unknownAccounts ? r.unknownAccounts.length : notRun('no people list given')}`);
  for (const x of r.unknownAccounts ?? []) out.push(`  ${x.user}: ${x.roles.join(', ')}`);
  out.push(`Users with privileged permissions: ${r.checked.privileged ? r.privileged.length : notRun('no privileged permissions given')}`);
  for (const x of r.privileged) out.push(`  ${x.user}: ${x.permissions.join(', ')} via ${x.roles.join(', ')}`);
  out.push(`Roles nobody holds: ${r.unusedRoles.length}${r.unusedRoles.length ? ` (${r.unusedRoles.join(', ')})` : ''}`);
  out.push(`Roles already covered by another role of the same user: ${r.redundant.length}`);
  for (const x of r.redundant) out.push(`  ${x.user}: ${x.role} is inside ${x.coveredBy}`);
  return out.join('\n');
}

export function toMarkdown(r) {
  const out = ['## Access review', '', `${r.users} users, ${r.roles} roles, ${r.assignments} role assignments.`, ''];
  const table = (title, head, rows) => {
    out.push(`### ${title}`, '');
    if (rows === null) { out.push('Not checked.', ''); return; }
    if (!rows.length) { out.push('None.', ''); return; }
    out.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((x) => `| ${x.join(' | ')} |`), '');
  };
  table('Segregation of duties conflicts', ['User', 'Rule', 'Permissions', 'Roles'], r.checked.conflicts ? r.conflicts.map((c) => [c.user, c.rule, `${c.a.join(', ')} with ${c.b.join(', ')}`, c.roles.join(', ')]) : null);
  table('People who left but still have access', ['User', 'Roles'], r.leavers && r.leavers.map((x) => [x.user, x.roles.join(', ')]));
  table('Accounts not in the people list', ['User', 'Roles'], r.unknownAccounts && r.unknownAccounts.map((x) => [x.user, x.roles.join(', ')]));
  table('Users with privileged permissions', ['User', 'Permissions', 'Roles'], r.checked.privileged ? r.privileged.map((x) => [x.user, x.permissions.join(', '), x.roles.join(', ')]) : null);
  table('Roles nobody holds', ['Role'], r.unusedRoles.map((x) => [x]));
  return out.join('\n').trimEnd();
}

export function toJson(r) {
  return JSON.stringify(r, null, 2);
}

const cell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(r) {
  const rows = [['finding', 'user', 'detail', 'roles']];
  for (const c of r.conflicts) rows.push(['conflict', c.user, `${c.rule}: ${c.a.join(' ')} with ${c.b.join(' ')}`, c.roles.join(' ')]);
  for (const x of r.leavers ?? []) rows.push(['left, still has access', x.user, '', x.roles.join(' ')]);
  for (const x of r.unknownAccounts ?? []) rows.push(['not in people list', x.user, '', x.roles.join(' ')]);
  for (const x of r.privileged) rows.push(['privileged', x.user, x.permissions.join(' '), x.roles.join(' ')]);
  for (const x of r.redundant) rows.push(['redundant role', x.user, `${x.role} inside ${x.coveredBy}`, x.role]);
  return rows.map((row) => row.map(cell).join(',')).join('\n');
}
