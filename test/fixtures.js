// A small organization whose findings can be worked out by hand.
//   ann  clerk + approver       -> can create AND approve invoices (conflict across two roles)
//   bob  admin                  -> the same conflict inside one role, and a privileged permission (user.manage)
//   cara clerk + viewer         -> viewer adds nothing clerk does not already give (redundant)
//   dan  approver, has left     -> leaver with access
//   eve  viewer, not in HR list -> unknown account
//   vendor_admin and auditor are held by nobody

export const roles = () => ({
  clerk: ['invoice.create', 'vendor.read'],
  approver: ['invoice.approve'],
  vendor_admin: ['vendor.create', 'vendor.read'],
  admin: ['user.manage', 'invoice.create', 'invoice.approve', 'vendor.read'],
  viewer: ['vendor.read'],
  auditor: ['report.read']
});

export const assignments = () => [
  'user,role',
  'ann,clerk',
  'Ann,approver',
  'bob,admin',
  'cara,clerk',
  'cara,viewer',
  'dan,approver',
  'eve,viewer'
].join('\n');

export const people = () => [
  'user,status,department',
  'ann,active,Finance',
  'bob,active,IT',
  'cara,active,Finance',
  'dan,left,Finance',
  'fin,active,Sales'
].join('\n');

export const rules = () => ({
  conflicts: [
    { name: 'create and approve invoices', a: ['invoice.create'], b: ['invoice.approve'] },
    { name: 'create vendors and approve invoices', a: ['vendor.create'], b: ['invoice.approve'] }
  ],
  privileged: ['user.manage']
});
