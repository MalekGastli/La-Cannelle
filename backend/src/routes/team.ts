import express from 'express';
import { teamController } from '../controllers/teamController';
import { authenticate, requirePermission, requireStaff } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public: opening and accepting an invitation (the token is the credential)
router.get('/invites/:token', asyncHandler(teamController.inspectInvite));
router.post('/invites/:token/accept', asyncHandler(teamController.acceptInvite));

router.use(authenticate);

// Any active team member: who am I and what may I do
router.get('/me', requireStaff, asyncHandler(teamController.me));

router.get('/catalogue', requirePermission('team.view'), teamController.catalogue);
router.get('/members', requirePermission('team.view'), asyncHandler(teamController.listMembers));
router.patch('/members/:id', requirePermission('team.edit'), asyncHandler(teamController.updateMember));
router.delete('/members/:id', requirePermission('team.delete'), asyncHandler(teamController.removeMember));

router.get('/roles', requirePermission('team.view'), asyncHandler(teamController.listRoles));
router.post('/roles', requirePermission('team.create'), asyncHandler(teamController.createRole));
router.put('/roles/:id', requirePermission('team.edit'), asyncHandler(teamController.updateRole));
router.delete('/roles/:id', requirePermission('team.delete'), asyncHandler(teamController.deleteRole));

router.get('/invites', requirePermission('team.view'), asyncHandler(teamController.listInvites));
router.post('/invites', requirePermission('team.create'), asyncHandler(teamController.createInvite));
router.delete('/invites/:id', requirePermission('team.delete'), asyncHandler(teamController.revokeInvite));

router.get('/audit', requirePermission('team.view'), asyncHandler(teamController.audit));

export default router;
