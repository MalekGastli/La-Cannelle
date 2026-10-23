import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { teamService } from '../services/teamService';
import { audit } from '../utils/audit';
import { AppError } from '../middleware/errorHandler';

const idParam = (req: AuthRequest) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('Invalid id', 400);
  return id;
};
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export const teamController = {
  async me(req: AuthRequest, res: Response) {
    res.json(await teamService.me(req.user!.id));
  },
  catalogue(_req: AuthRequest, res: Response) {
    res.json(teamService.catalogue());
  },

  async listMembers(_req: AuthRequest, res: Response) {
    res.json(await teamService.listMembers());
  },
  async updateMember(req: AuthRequest, res: Response) {
    const id = idParam(req);
    const member = await teamService.updateMember(req.user!.id, id, req.body || {});
    await audit(req.user, 'team.member.update', member?.email ?? String(id), req.body);
    res.json(member);
  },
  async removeMember(req: AuthRequest, res: Response) {
    const removed = await teamService.removeMember(req.user!.id, idParam(req));
    await audit(req.user, 'team.member.remove', removed.email);
    res.json({ ok: true });
  },

  async listRoles(_req: AuthRequest, res: Response) {
    res.json(await teamService.listRoles());
  },
  async createRole(req: AuthRequest, res: Response) {
    const role = await teamService.createRole(req.body || {});
    await audit(req.user, 'team.role.create', role.name);
    res.status(201).json(role);
  },
  async updateRole(req: AuthRequest, res: Response) {
    const role = await teamService.updateRole(idParam(req), req.body || {});
    await audit(req.user, 'team.role.update', role.name);
    res.json(role);
  },
  async deleteRole(req: AuthRequest, res: Response) {
    const role = await teamService.deleteRole(idParam(req));
    await audit(req.user, 'team.role.delete', role.name);
    res.json({ ok: true });
  },

  async listInvites(_req: AuthRequest, res: Response) {
    res.json(await teamService.listInvites());
  },
  async createInvite(req: AuthRequest, res: Response) {
    const invite = await teamService.createInvite(req.user!.id, req.body || {});
    await audit(req.user, 'team.invite.create', invite.email, { role: invite.role });
    // The link is shown once; only a hash of the token is stored. Send it yourself (mail or chat).
    res.status(201).json({
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl: `${frontendUrl()}/invite/${invite.token}`,
    });
  },
  async revokeInvite(req: AuthRequest, res: Response) {
    const invite = await teamService.revokeInvite(idParam(req));
    await audit(req.user, 'team.invite.revoke', invite.email);
    res.json({ ok: true });
  },

  async inspectInvite(req: AuthRequest, res: Response) {
    res.json(await teamService.inspectInvite(String(req.params.token)));
  },
  async acceptInvite(req: AuthRequest, res: Response) {
    const user = await teamService.acceptInvite(String(req.params.token), req.body || {});
    await audit({ id: user.id, email: user.email }, 'team.invite.accept');
    res.status(201).json({ ok: true });
  },

  async audit(req: AuthRequest, res: Response) {
    res.json(await teamService.audit(Number(req.query.limit) || 100));
  },
};
