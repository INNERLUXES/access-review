// The findings of an access review. Each finding names the user, what is wrong and which roles cause it,
// so the fix (remove a role, close an account) is clear from the report.

export function permissionsOf(user, assignments, roles) {
  const byRole = new Map();
  for (const a of assignments) if (a.user === user) byRole.set(a.role, roles.get(a.role));
  const all = new Set();
  for (const set of byRole.values()) for (const p of set) all.add(p);
  return { roles: [...byRole.keys()].sort(), permissions: all, byRole };
}

const users = (assignments) => [...new Set(assignments.map((a) => a.user))].sort();

// Segregation of duties: a user holds at least one permission from side a AND one from side b of a rule.
export function conflicts(assignments, roles, rules) {
  const out = [];
  for (const user of users(assignments)) {
    const { permissions, byRole } = permissionsOf(user, assignments, roles);
    for (const rule of rules.conflicts) {
      const a = [...rule.a].filter((p) => permissions.has(p));
      const b = [...rule.b].filter((p) => permissions.has(p));
      if (!a.length || !b.length) continue;
      const cause = [...byRole].filter(([, set]) => [...set].some((p) => rule.a.has(p) || rule.b.has(p))).map(([r]) => r).sort();
      out.push({ user, rule: rule.name, a, b, roles: cause, withinOneRole: cause.length === 1 });
    }
  }
  return out;
}

// People marked as left who still hold a role, and accounts that are not in the people list at all.
export function leaversAndUnknown(assignments, people) {
  const leavers = [], unknown = [];
  for (const user of users(assignments)) {
    const roles = [...new Set(assignments.filter((a) => a.user === user).map((a) => a.role))].sort();
    const p = people.get(user);
    if (!p) unknown.push({ user, roles });
    else if (p.status === 'left') leavers.push({ user, roles });
  }
  return { leavers, unknown };
}

export function privilegedUsers(assignments, roles, rules) {
  if (!rules.privileged.size) return [];
  return users(assignments).map((user) => {
    const { permissions, byRole } = permissionsOf(user, assignments, roles);
    const held = [...rules.privileged].filter((p) => permissions.has(p));
    const via = [...byRole].filter(([, set]) => held.some((p) => set.has(p))).map(([r]) => r).sort();
    return { user, permissions: held, roles: via };
  }).filter((x) => x.permissions.length);
}

export function unusedRoles(assignments, roles) {
  const used = new Set(assignments.map((a) => a.role));
  return [...roles.keys()].filter((r) => !used.has(r)).sort();
}

// Roles whose permissions are fully contained in another role that the same user also holds.
export function redundantAssignments(assignments, roles) {
  const out = [];
  for (const user of users(assignments)) {
    const held = [...new Set(assignments.filter((a) => a.user === user).map((a) => a.role))];
    for (const r of held) {
      const covering = held.find((o) => o !== r && [...roles.get(r)].every((p) => roles.get(o).has(p)) && (roles.get(o).size > roles.get(r).size || o < r));
      if (covering) out.push({ user, role: r, coveredBy: covering });
    }
  }
  return out;
}

export function review({ roles, assignments, people = null, rules = { conflicts: [], privileged: new Set() } }) {
  const sod = conflicts(assignments, roles, rules);
  const lu = people ? leaversAndUnknown(assignments, people) : { leavers: null, unknown: null };
  return {
    users: users(assignments).length,
    roles: roles.size,
    assignments: assignments.length,
    conflicts: sod,
    leavers: lu.leavers,
    unknownAccounts: lu.unknown,
    privileged: privilegedUsers(assignments, roles, rules),
    unusedRoles: unusedRoles(assignments, roles),
    redundant: redundantAssignments(assignments, roles),
    checked: { conflicts: rules.conflicts.length, privileged: rules.privileged.size > 0, people: !!people }
  };
}

export function findingCount(r) {
  return r.conflicts.length + (r.leavers?.length ?? 0) + (r.unknownAccounts?.length ?? 0);
}
