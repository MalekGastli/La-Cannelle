/**
 * Permission model (same idea as the BDX CRM): roles grant, a per-person override decides.
 * resource x action, resolved on the server for every request; the UI only mirrors the answer.
 */
export const RESOURCES = [
  'orders',
  'customers',
  'menus',
  'products',
  'services',
  'accessories',
  'reports',
  'system',
  'team',
] as const;
export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}.${Action}`;

export const isResource = (value: unknown): value is Resource => RESOURCES.includes(value as Resource);
export const isAction = (value: unknown): value is Action => ACTIONS.includes(value as Action);

export const ALL_PERMISSIONS: Permission[] = RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}.${a}` as Permission));

export type Grants = { isOwner: boolean; set: Set<string> };

/** Owners (role ADMIN) hold everything and cannot be stripped: someone must always be able to repair the table. */
export function resolveGrants(input: {
  isOwner: boolean;
  rolePermissions: { resource: string; action: string }[];
  overrides: { resource: string; action: string; allow: boolean }[];
}): Grants {
  const set = new Set<string>();
  for (const p of input.rolePermissions) set.add(`${p.resource}.${p.action}`);
  for (const o of input.overrides) {
    const key = `${o.resource}.${o.action}`;
    if (o.allow) set.add(key);
    else set.delete(key); // an explicit deny beats every role
  }
  return { isOwner: input.isOwner, set };
}

export function can(grants: Grants | null | undefined, permission: Permission): boolean {
  if (!grants) return false;
  if (grants.isOwner) return true;
  return grants.set.has(permission);
}

export function grantsToList(grants: Grants): Permission[] {
  return grants.isOwner ? ALL_PERMISSIONS : (Array.from(grants.set) as Permission[]).sort();
}

/** Roles created on first deploy. System roles can be edited but not deleted. */
export const SYSTEM_ROLES: { name: string; description: string; permissions: Permission[] }[] = [
  {
    name: 'Manager',
    description: 'Runs day-to-day operations: orders, customers and the whole catalogue. No team management.',
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('team.') && !p.startsWith('system.delete')),
  },
  {
    name: 'Kitchen',
    description: 'Sees and updates orders and can look at dishes and menus.',
    permissions: ['orders.view', 'orders.edit', 'menus.view', 'products.view', 'accessories.view'],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to everything except the team.',
    permissions: ALL_PERMISSIONS.filter((p) => p.endsWith('.view') && !p.startsWith('team.')),
  },
];
