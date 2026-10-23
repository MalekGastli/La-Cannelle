import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { ACTIONS, RESOURCES, isAction, isResource, resolveGrants, grantsToList } from '../utils/permissions';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type PermissionInput = { resource: string; action: string };

function cleanPermissions(input: unknown): PermissionInput[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: PermissionInput[] = [];
  for (const item of input) {
    const resource = (item as any)?.resource;
    const action = (item as any)?.action;
    if (!isResource(resource) || !isAction(action)) continue;
    const key = `${resource}.${action}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ resource, action });
  }
  return out;
}

const memberSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  roleId: true,
  teamRole: { select: { id: true, name: true } },
  permissions: { select: { resource: true, action: true, allow: true } },
} as const;

export const teamService = {
  catalogue() {
    return { resources: RESOURCES, actions: ACTIONS };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true,
        teamRole: { select: { name: true, permissions: { select: { resource: true, action: true } } } },
        permissions: { select: { resource: true, action: true, allow: true } },
      },
    });
    if (!user || !user.isActive) throw new AppError('Not allowed', 403);
    const grants = resolveGrants({
      isOwner: user.role === 'ADMIN',
      rolePermissions: user.teamRole?.permissions ?? [],
      overrides: user.permissions,
    });
    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      roleName: user.role === 'ADMIN' ? 'Owner' : user.teamRole?.name ?? null,
      isOwner: grants.isOwner,
      permissions: grantsToList(grants),
    };
  },

  // ----- members -----
  async listMembers() {
    return prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: memberSelect,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async updateMember(
    actorId: number,
    id: number,
    data: { roleId?: number | null; isActive?: boolean; overrides?: { resource: string; action: string; allow: boolean }[] }
  ) {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target || (target.role !== 'ADMIN' && target.role !== 'STAFF')) throw new AppError('Member not found', 404);
    if (target.role === 'ADMIN') throw new AppError('The owner account cannot be changed here', 400);
    if (id === actorId && data.isActive === false) throw new AppError('You cannot deactivate yourself', 400);

    const update: Record<string, unknown> = {};
    if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);
    if (data.roleId !== undefined) {
      if (data.roleId !== null) {
        const role = await prisma.role.findUnique({ where: { id: Number(data.roleId) } });
        if (!role) throw new AppError('Role not found', 404);
      }
      update.roleId = data.roleId === null ? null : Number(data.roleId);
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(update).length) await tx.user.update({ where: { id }, data: update });
      if (Array.isArray(data.overrides)) {
        await tx.userPermission.deleteMany({ where: { userId: id } });
        const rows = cleanPermissions(data.overrides).map((p) => {
          const original = data.overrides!.find((o) => o.resource === p.resource && o.action === p.action)!;
          return { userId: id, resource: p.resource, action: p.action, allow: Boolean(original.allow) };
        });
        if (rows.length) await tx.userPermission.createMany({ data: rows });
      }
    });
    return prisma.user.findUnique({ where: { id }, select: memberSelect });
  },

  async removeMember(actorId: number, id: number) {
    if (id === actorId) throw new AppError('You cannot remove yourself', 400);
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } });
    if (!target || target.role !== 'STAFF') throw new AppError('Only staff members can be removed', 400);
    // Keep the row (orders, audit trail) but end the access: back to a plain inactive client record
    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId: id } }),
      prisma.user.update({ where: { id }, data: { role: 'CLIENT', roleId: null, isActive: false } }),
    ]);
    return target;
  },

  // ----- roles -----
  async listRoles() {
    const roles = await prisma.role.findMany({
      include: { permissions: { select: { resource: true, action: true } }, _count: { select: { users: true } } },
      orderBy: { id: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      members: r._count.users,
      permissions: r.permissions,
    }));
  },

  async createRole(data: { name: string; description?: string; permissions?: unknown }) {
    const name = String(data.name || '').trim();
    if (!name) throw new AppError('Role name is required', 400);
    if (await prisma.role.findUnique({ where: { name } })) throw new AppError('A role with this name exists', 400);
    const role = await prisma.role.create({
      data: {
        name,
        description: String(data.description || ''),
        permissions: { create: cleanPermissions(data.permissions) },
      },
    });
    return role;
  },

  async updateRole(id: number, data: { name?: string; description?: string; permissions?: unknown }) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new AppError('Role not found', 404);
    const name = data.name !== undefined ? String(data.name).trim() : role.name;
    if (!name) throw new AppError('Role name is required', 400);
    if (name !== role.name) {
      if (role.isSystem) throw new AppError('System roles cannot be renamed', 400);
      if (await prisma.role.findUnique({ where: { name } })) throw new AppError('A role with this name exists', 400);
    }
    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name, description: data.description !== undefined ? String(data.description) : role.description },
      });
      if (data.permissions !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        const rows = cleanPermissions(data.permissions).map((p) => ({ roleId: id, ...p }));
        if (rows.length) await tx.rolePermission.createMany({ data: rows });
      }
    });
    return { id, name };
  },

  async deleteRole(id: number) {
    const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true, invites: true } } } });
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem) throw new AppError('System roles cannot be deleted', 400);
    if (role._count.users > 0) throw new AppError('Move the members of this role first', 400);
    await prisma.role.delete({ where: { id } });
    return role;
  },

  // ----- invites (invite-only access, like Exam Lab) -----
  async listInvites() {
    return prisma.invite.findMany({
      where: { acceptedAt: null },
      select: { id: true, email: true, expiresAt: true, createdAt: true, role: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createInvite(actorId: number, data: { email: string; roleId: number }) {
    const email = String(data.email || '').trim().toLowerCase();
    if (!isEmail(email)) throw new AppError('Enter a valid email address', 400);
    const role = await prisma.role.findUnique({ where: { id: Number(data.roleId) } });
    if (!role) throw new AppError('Choose a role', 400);
    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing && (existing.role === 'ADMIN' || existing.role === 'STAFF')) {
      throw new AppError('This person is already on the team', 400);
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const data2 = {
      email,
      roleId: role.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      acceptedAt: null,
      invitedById: actorId,
    };
    await prisma.invite.upsert({ where: { email }, create: data2, update: data2 });
    return { email, role: role.name, token, expiresAt: data2.expiresAt };
  },

  async revokeInvite(id: number) {
    const invite = await prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new AppError('Invite not found', 404);
    await prisma.invite.delete({ where: { id } });
    return invite;
  },

  async inspectInvite(token: string) {
    const invite = await prisma.invite.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { email: true, expiresAt: true, acceptedAt: true, role: { select: { name: true } } },
    });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new AppError('This invitation is invalid or has expired', 404);
    }
    return { email: invite.email, role: invite.role.name };
  },

  async acceptInvite(token: string, data: { firstName: string; lastName: string; password: string }) {
    const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new AppError('This invitation is invalid or has expired', 404);
    }
    const firstName = String(data.firstName || '').trim();
    const lastName = String(data.lastName || '').trim();
    const password = String(data.password || '');
    if (!firstName || !lastName) throw new AppError('Please enter your name', 400);
    if (password.length < 10) throw new AppError('Use a password of at least 10 characters', 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: invite.email } });
      const created = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { password: hashed, firstName, lastName, role: 'STAFF', roleId: invite.roleId, isActive: true },
          })
        : await tx.user.create({
            data: { email: invite.email, password: hashed, firstName, lastName, role: 'STAFF', roleId: invite.roleId },
          });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return created;
    });
    return { id: user.id, email: user.email };
  },

  // ----- audit -----
  async audit(limit = 100) {
    return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 300) });
  },
};
