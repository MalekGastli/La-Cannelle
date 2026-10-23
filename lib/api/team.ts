import { apiClient } from '../api';

export type Permission = { resource: string; action: string };
export type Override = Permission & { allow: boolean };

export type Me = {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  roleName: string | null;
  isOwner: boolean;
  permissions: string[];
};

export type Member = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleId: number | null;
  teamRole: { id: number; name: string } | null;
  permissions: Override[];
};

export type Role = {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  members: number;
  permissions: Permission[];
};

export type Invite = { id: number; email: string; expiresAt: string; createdAt: string; role: { id: number; name: string } };
export type AuditEntry = { id: number; userEmail: string; action: string; target: string; createdAt: string };

async function unwrap<T>(promise: Promise<{ data?: T; error?: string }>): Promise<T> {
  const res = await promise;
  if (res.error !== undefined) throw new Error(res.error);
  return res.data as T;
}

export const teamApi = {
  me: () => unwrap<Me>(apiClient.get('/team/me')),
  catalogue: () => unwrap<{ resources: string[]; actions: string[] }>(apiClient.get('/team/catalogue')),
  members: () => unwrap<Member[]>(apiClient.get('/team/members')),
  updateMember: (id: number, data: { roleId?: number | null; isActive?: boolean; overrides?: Override[] }) =>
    unwrap<Member>(apiClient.patch(`/team/members/${id}`, data)),
  removeMember: (id: number) => unwrap<{ ok: boolean }>(apiClient.delete(`/team/members/${id}`)),
  roles: () => unwrap<Role[]>(apiClient.get('/team/roles')),
  createRole: (data: { name: string; description?: string; permissions: Permission[] }) =>
    unwrap<Role>(apiClient.post('/team/roles', data)),
  updateRole: (id: number, data: { name?: string; description?: string; permissions?: Permission[] }) =>
    unwrap<Role>(apiClient.put(`/team/roles/${id}`, data)),
  deleteRole: (id: number) => unwrap<{ ok: boolean }>(apiClient.delete(`/team/roles/${id}`)),
  invites: () => unwrap<Invite[]>(apiClient.get('/team/invites')),
  createInvite: (data: { email: string; roleId: number }) =>
    unwrap<{ email: string; role: string; expiresAt: string; inviteUrl: string }>(apiClient.post('/team/invites', data)),
  revokeInvite: (id: number) => unwrap<{ ok: boolean }>(apiClient.delete(`/team/invites/${id}`)),
  audit: (limit = 100) => unwrap<AuditEntry[]>(apiClient.get(`/team/audit?limit=${limit}`)),
  inspectInvite: (token: string) => unwrap<{ email: string; role: string }>(apiClient.get(`/team/invites/${encodeURIComponent(token)}`)),
  acceptInvite: (token: string, data: { firstName: string; lastName: string; password: string }) =>
    unwrap<{ ok: boolean }>(apiClient.post(`/team/invites/${encodeURIComponent(token)}/accept`, data)),
};
