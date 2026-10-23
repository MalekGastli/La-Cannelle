"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Package,
  Menu,
  Briefcase,
  Clock,
  Users,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  UserPlus,
  Copy,
  Check,
  Trash2,
  X,
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { L } from '@/lib/i18n/inline';
import {
  teamApi,
  type AuditEntry,
  type Invite,
  type Member,
  type Override,
  type Permission,
  type Role,
} from '@/lib/api/team';
import { useAdminSession } from '@/lib/hooks/useAdminSession';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonSecondary,
  adminCard,
  adminCardBody,
  adminCardHeader,
  adminInput,
  adminPill,
  adminSelect,
} from '../components/adminStyles';

type Tab = 'members' | 'roles' | 'invites' | 'activity';
const RESOURCES = ['orders', 'customers', 'menus', 'products', 'services', 'accessories', 'reports', 'system', 'team'];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

const permKey = (p: Permission) => `${p.resource}.${p.action}`;

// System roles are seeded in English; show the German text while the description is unedited.
const SYSTEM_ROLE_DE: Record<string, string> = {
  'Runs day-to-day operations: orders, customers and the whole catalogue. No team management.':
    'Führt den Tagesbetrieb: Bestellungen, Kunden und der gesamte Katalog. Keine Teamverwaltung.',
  'Sees and updates orders and can look at dishes and menus.':
    'Sieht und aktualisiert Bestellungen und kann Gerichte und Menüs einsehen.',
  'Read-only access to everything except the team.':
    'Nur Lesezugriff auf alles außer dem Team.',
};
const roleDescription = (description: string | null | undefined, t: (de: string, en: string) => string) => {
  if (!description) return '–';
  return t(SYSTEM_ROLE_DE[description] ?? description, description);
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-500 hover:bg-stone-100"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default function AdminTeam() {
  const { language, toggleLanguage } = useTranslation('admin');
  const session = useAdminSession();
  const locale = language === 'DE' ? 'de-DE' : 'en-US';
  const t = (de: string, en: string) => L(language, de, en);

  const navigation = useMemo(
    () => [
      { id: 'dashboard', name: t('Übersicht', 'Dashboard'), icon: TrendingUp, path: '/dashboard' },
      { id: 'orders', name: t('Bestellungen', 'Orders'), icon: Package, path: '/orders' },
      { id: 'menu', name: t('Menüverwaltung', 'Menu Management'), icon: Menu, path: '/menu_management' },
      { id: 'services', name: 'Services', icon: Briefcase, path: '/services_management' },
      { id: 'accessories', name: t('Zubehör', 'Accessories'), icon: ShoppingBag, path: '/accessories' },
      { id: 'system', name: t('Systemsteuerung', 'System Control'), icon: Clock, path: '/system_control' },
      { id: 'customers', name: t('Kunden', 'Customers'), icon: Users, path: '/customers' },
      { id: 'reports', name: t('Berichte', 'Reports'), icon: BarChart3, path: '/reports' },
      { id: 'team', name: 'Team', icon: ShieldCheck, path: '/team' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<number | ''>('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [roleEditor, setRoleEditor] = useState<{ id?: number; name: string; description: string; perms: Set<string>; isSystem: boolean } | null>(null);
  const [memberEditor, setMemberEditor] = useState<{ member: Member; roleId: number | null; overrides: Map<string, boolean> } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => Promise<void> } | null>(null);

  const canEdit = session.can('team.edit');
  const canCreate = session.can('team.create');
  const canDelete = session.can('team.delete');

  const load = useCallback(async () => {
    try {
      setError('');
      const [m, r, i, a] = await Promise.all([teamApi.members(), teamApi.roles(), teamApi.invites(), teamApi.audit(80)]);
      setMembers(m);
      setRoles(r);
      setInvites(i);
      setAudit(a);
    } catch (err: any) {
      setError(err?.message || t('Team konnte nicht geladen werden.', 'Could not load the team.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!session.loading && session.can('team.view')) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading, session.me]);

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setError('');
    try {
      await action();
      if (success) setNotice(success);
      await load();
    } catch (err: any) {
      setError(err?.message || t('Aktion fehlgeschlagen.', 'Action failed.'));
    } finally {
      setBusy(false);
    }
  }

  const fmt = (value?: string | null) =>
    value ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '–';

  // ---------- invite ----------
  async function sendInvite() {
    if (!inviteRole) return setError(t('Bitte eine Rolle wählen.', 'Please choose a role.'));
    setBusy(true);
    setError('');
    try {
      const res = await teamApi.createInvite({ email: inviteEmail.trim(), roleId: Number(inviteRole) });
      setInviteLink(res.inviteUrl);
      setInviteEmail('');
      await load();
    } catch (err: any) {
      setError(err?.message || t('Einladung fehlgeschlagen.', 'Invitation failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the link stays selectable */
    }
  }

  // ---------- role editor ----------
  const openRole = (role?: Role) =>
    setRoleEditor({
      id: role?.id,
      name: role?.name ?? '',
      description: role?.description ?? '',
      perms: new Set((role?.permissions ?? []).map(permKey)),
      isSystem: role?.isSystem ?? false,
    });

  async function saveRole() {
    if (!roleEditor) return;
    const permissions: Permission[] = Array.from(roleEditor.perms).map((k) => {
      const [resource, action] = k.split('.');
      return { resource, action };
    });
    await run(async () => {
      if (roleEditor.id) {
        await teamApi.updateRole(roleEditor.id, { name: roleEditor.name, description: roleEditor.description, permissions });
      } else {
        await teamApi.createRole({ name: roleEditor.name, description: roleEditor.description, permissions });
      }
      setRoleEditor(null);
    }, t('Rolle gespeichert.', 'Role saved.'));
  }

  // ---------- member editor ----------
  const openMember = (member: Member) =>
    setMemberEditor({
      member,
      roleId: member.roleId,
      overrides: new Map(member.permissions.map((o) => [`${o.resource}.${o.action}`, o.allow])),
    });

  async function saveMember() {
    if (!memberEditor) return;
    const overrides: Override[] = Array.from(memberEditor.overrides.entries()).map(([k, allow]) => {
      const [resource, action] = k.split('.');
      return { resource, action, allow };
    });
    await run(async () => {
      await teamApi.updateMember(memberEditor.member.id, { roleId: memberEditor.roleId, overrides });
      setMemberEditor(null);
    }, t('Mitglied gespeichert.', 'Member saved.'));
  }

  const roleGrants = (roleId: number | null) => {
    const role = roles.find((r) => r.id === roleId);
    return new Set((role?.permissions ?? []).map(permKey));
  };

  const resourceLabel = (r: string) =>
    ({
      orders: t('Bestellungen', 'Orders'),
      customers: t('Kunden', 'Customers'),
      menus: t('Menüs', 'Menus'),
      products: t('Gerichte', 'Dishes'),
      services: 'Services',
      accessories: t('Zubehör', 'Accessories'),
      reports: t('Berichte', 'Reports'),
      system: t('System', 'System'),
      team: 'Team',
    } as Record<string, string>)[r] ?? r;
  const actionLabel = (a: string) =>
    ({ view: t('Ansehen', 'View'), create: t('Anlegen', 'Create'), edit: t('Ändern', 'Edit'), delete: t('Löschen', 'Delete') } as Record<string, string>)[a] ?? a;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'members', label: t('Mitglieder', 'Members') },
    { id: 'roles', label: t('Rollen', 'Roles') },
    { id: 'invites', label: `${t('Einladungen', 'Invitations')}${invites.length ? ` (${invites.length})` : ''}` },
    { id: 'activity', label: t('Aktivität', 'Activity') },
  ];

  const content = (() => {
    if (session.loading) return <p className="text-sm text-gray-600">{t('Lade…', 'Loading…')}</p>;
    if (!session.can('team.view'))
      return (
        <div className={`${adminCard} ${adminCardBody} text-sm text-gray-700`}>
          {t('Für diesen Bereich fehlt Ihnen die Berechtigung.', 'You do not have permission to see this area.')}
        </div>
      );
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === item.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-stone-200 bg-white text-gray-700 hover:bg-stone-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {canCreate && (
            <button type="button" className={adminButtonPrimary} onClick={() => { setInviteLink(''); setInviteOpen(true); }}>
              <UserPlus size={16} /> {t('Person einladen', 'Invite someone')}
            </button>
          )}
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
        {notice && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Close"><X size={16} /></button>
          </div>
        )}

        {tab === 'members' && (
          <div className={adminCard}>
            <div className={adminCardHeader}>
              <h2 className="text-lg font-semibold">{t('Teammitglieder', 'Team members')}</h2>
              <p className="text-sm text-gray-600">
                {t('Der Zugang ist nur per Einladung möglich. Rechte kommen aus der Rolle, ein persönlicher Override entscheidet zuletzt.',
                  'Access is invite-only. Rights come from the role; a personal override decides last.')}
              </p>
            </div>
            <div className="divide-y divide-stone-200/70">
              {members.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{`${m.firstName} ${m.lastName}`.trim() || m.email}</p>
                    <p className="truncate text-sm text-gray-600">{m.email}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('Letzte Anmeldung', 'Last sign-in')}: {fmt(m.lastLoginAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${adminPill} ${m.role === 'ADMIN' ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-stone-200 bg-stone-50 text-gray-700'}`}>
                      {m.role === 'ADMIN' ? t('Inhaber', 'Owner') : m.teamRole?.name ?? t('Keine Rolle', 'No role')}
                    </span>
                    {!m.isActive && <span className={`${adminPill} border-red-200 bg-red-50 text-red-700`}>{t('Deaktiviert', 'Deactivated')}</span>}
                    {m.role === 'STAFF' && canEdit && (
                      <>
                        <button type="button" className={adminButtonSecondary} onClick={() => openMember(m)}>{t('Bearbeiten', 'Edit')}</button>
                        <button
                          type="button"
                          className={adminButtonSecondary}
                          disabled={busy || m.id === session.me?.id}
                          onClick={() => run(() => teamApi.updateMember(m.id, { isActive: !m.isActive }))}
                        >
                          {m.isActive ? t('Deaktivieren', 'Deactivate') : t('Aktivieren', 'Activate')}
                        </button>
                      </>
                    )}
                    {m.role === 'STAFF' && canDelete && m.id !== session.me?.id && (
                      <button
                        type="button"
                        className={adminButtonSecondary}
                        aria-label={t('Entfernen', 'Remove')}
                        onClick={() =>
                          setConfirm({
                            title: t('Mitglied entfernen?', 'Remove member?'),
                            message: t(`${m.email} verliert sofort den Zugang.`, `${m.email} loses access immediately.`),
                            run: () => run(() => teamApi.removeMember(m.id), t('Mitglied entfernt.', 'Member removed.')),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="px-6 py-6 text-sm text-gray-600">{t('Noch keine Mitglieder.', 'No members yet.')}</p>}
            </div>
          </div>
        )}

        {tab === 'roles' && (
          <div className={adminCard}>
            <div className={`${adminCardHeader} flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <h2 className="text-lg font-semibold">{t('Rollen', 'Roles')}</h2>
                <p className="text-sm text-gray-600">{t('Eine Rolle bündelt Rechte pro Bereich und Aktion.', 'A role bundles rights per area and action.')}</p>
              </div>
              {canCreate && <button type="button" className={adminButtonSecondary} onClick={() => openRole()}>{t('Neue Rolle', 'New role')}</button>}
            </div>
            <div className="divide-y divide-stone-200/70">
              {roles.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {r.name} {r.isSystem && <span className={`${adminPill} ml-2 border-stone-200 bg-stone-50 text-gray-600`}>{t('System', 'System')}</span>}
                    </p>
                    <p className="text-sm text-gray-600">{roleDescription(r.description, t)}</p>
                    <p className="mt-1 text-xs text-gray-500">{r.members} {t('Mitglieder', 'members')} · {r.permissions.length} {t('Rechte', 'permissions')}</p>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && <button type="button" className={adminButtonSecondary} onClick={() => openRole(r)}>{t('Bearbeiten', 'Edit')}</button>}
                    {canDelete && !r.isSystem && (
                      <button
                        type="button"
                        className={adminButtonSecondary}
                        aria-label={t('Löschen', 'Delete')}
                        onClick={() =>
                          setConfirm({
                            title: t('Rolle löschen?', 'Delete role?'),
                            message: r.name,
                            run: () => run(() => teamApi.deleteRole(r.id), t('Rolle gelöscht.', 'Role deleted.')),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'invites' && (
          <div className={adminCard}>
            <div className={adminCardHeader}>
              <h2 className="text-lg font-semibold">{t('Offene Einladungen', 'Open invitations')}</h2>
              <p className="text-sm text-gray-600">{t('Links sind 7 Tage gültig und werden nur einmal angezeigt.', 'Links are valid for 7 days and are shown only once.')}</p>
            </div>
            <div className="divide-y divide-stone-200/70">
              {invites.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div>
                    <p className="font-semibold text-gray-900">{i.email}</p>
                    <p className="text-sm text-gray-600">{i.role.name} · {t('gültig bis', 'valid until')} {fmt(i.expiresAt)}</p>
                  </div>
                  {canDelete && (
                    <button type="button" className={adminButtonSecondary} disabled={busy} onClick={() => run(() => teamApi.revokeInvite(i.id), t('Einladung zurückgezogen.', 'Invitation revoked.'))}>
                      {t('Zurückziehen', 'Revoke')}
                    </button>
                  )}
                </div>
              ))}
              {invites.length === 0 && <p className="px-6 py-6 text-sm text-gray-600">{t('Keine offenen Einladungen.', 'No open invitations.')}</p>}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className={adminCard}>
            <div className={adminCardHeader}>
              <h2 className="text-lg font-semibold">{t('Aktivität', 'Activity')}</h2>
              <p className="text-sm text-gray-600">{t('Anmeldungen und Änderungen am Team.', 'Sign-ins and changes to the team.')}</p>
            </div>
            <div className="divide-y divide-stone-200/70">
              {audit.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm sm:px-6">
                  <span><span className="font-semibold text-gray-900">{a.userEmail}</span> · <code className="text-xs text-gray-700">{a.action}</code>{a.target ? ` · ${a.target}` : ''}</span>
                  <span className="text-xs text-gray-500">{fmt(a.createdAt)}</span>
                </div>
              ))}
              {audit.length === 0 && <p className="px-6 py-6 text-sm text-gray-600">{t('Noch keine Einträge.', 'No entries yet.')}</p>}
            </div>
          </div>
        )}
      </div>
    );
  })();

  return (
    <AdminLayout
      navigation={navigation}
      title={t('Team & Rollen', 'Team & roles')}
      adminUserLabel={session.me?.name || 'Admin'}
      adminRoleLabel={session.me?.roleName || ''}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={locale}
    >
      {content}

      {inviteOpen && (
        <Modal title={t('Person einladen', 'Invite someone')} onClose={() => setInviteOpen(false)}>
          {inviteLink ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                {t('Schicken Sie diesen Link an die eingeladene Person. Er wird nur jetzt angezeigt.', 'Send this link to the person you invited. It is shown only now.')}
              </p>
              <input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} className={adminInput} aria-label="Invitation link" />
              <div className="flex gap-2">
                <button type="button" className={adminButtonPrimary} onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('Kopiert', 'Copied') : t('Link kopieren', 'Copy link')}
                </button>
                <button type="button" className={adminButtonSecondary} onClick={() => setInviteOpen(false)}>{t('Fertig', 'Done')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="invite-email">E-Mail</label>
                <input id="invite-email" type="email" className={adminInput} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="invite-role">{t('Rolle', 'Role')}</label>
                <select id="invite-role" className={adminSelect} value={inviteRole} onChange={(e) => setInviteRole(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{t('Rolle wählen…', 'Choose a role…')}</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={adminButtonSecondary} onClick={() => setInviteOpen(false)}>{t('Abbrechen', 'Cancel')}</button>
                <button type="button" className={adminButtonPrimary} disabled={busy || !inviteEmail} onClick={sendInvite}>{t('Einladung erstellen', 'Create invitation')}</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {roleEditor && (
        <Modal title={roleEditor.id ? t('Rolle bearbeiten', 'Edit role') : t('Neue Rolle', 'New role')} onClose={() => setRoleEditor(null)}>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="role-name">Name</label>
                <input id="role-name" className={adminInput} value={roleEditor.name} disabled={roleEditor.isSystem} onChange={(e) => setRoleEditor({ ...roleEditor, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="role-desc">{t('Beschreibung', 'Description')}</label>
                <input id="role-desc" className={adminInput} value={roleEditor.description} onChange={(e) => setRoleEditor({ ...roleEditor, description: e.target.value })} />
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="px-3 py-2">{t('Bereich', 'Area')}</th>
                    {ACTIONS.map((a) => <th key={a} className="px-3 py-2 text-center">{actionLabel(a)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {RESOURCES.map((r) => (
                    <tr key={r}>
                      <td className="px-3 py-2 font-medium text-gray-900">{resourceLabel(r)}</td>
                      {ACTIONS.map((a) => {
                        const key = `${r}.${a}`;
                        return (
                          <td key={a} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-amber-700"
                              aria-label={`${resourceLabel(r)} ${actionLabel(a)}`}
                              checked={roleEditor.perms.has(key)}
                              onChange={(e) => {
                                const next = new Set(roleEditor.perms);
                                if (e.target.checked) next.add(key); else next.delete(key);
                                setRoleEditor({ ...roleEditor, perms: next });
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={adminButtonSecondary} onClick={() => setRoleEditor(null)}>{t('Abbrechen', 'Cancel')}</button>
              <button type="button" className={adminButtonPrimary} disabled={busy || !roleEditor.name.trim()} onClick={saveRole}>{t('Speichern', 'Save')}</button>
            </div>
          </div>
        </Modal>
      )}

      {memberEditor && (
        <Modal title={`${memberEditor.member.firstName} ${memberEditor.member.lastName}`.trim() || memberEditor.member.email} onClose={() => setMemberEditor(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="member-role">{t('Rolle', 'Role')}</label>
              <select
                id="member-role"
                className={adminSelect}
                value={memberEditor.roleId ?? ''}
                onChange={(e) => setMemberEditor({ ...memberEditor, roleId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('Keine Rolle', 'No role')}</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-gray-800">{t('Persönliche Overrides', 'Personal overrides')}</p>
              <p className="mb-2 text-xs text-gray-600">
                {t('„Rolle“ übernimmt das Recht der Rolle, „Erlauben“ gewährt es zusätzlich, „Verbieten“ entzieht es trotz Rolle.',
                  '"Role" follows the role, "Allow" grants it on top, "Deny" removes it even if the role grants it.')}
              </p>
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-gray-600">
                    <tr>
                      <th className="px-3 py-2">{t('Bereich', 'Area')}</th>
                      {ACTIONS.map((a) => <th key={a} className="px-3 py-2 text-center">{actionLabel(a)}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {RESOURCES.map((r) => (
                      <tr key={r}>
                        <td className="px-3 py-2 font-medium text-gray-900">{resourceLabel(r)}</td>
                        {ACTIONS.map((a) => {
                          const key = `${r}.${a}`;
                          const value = memberEditor.overrides.has(key) ? (memberEditor.overrides.get(key) ? 'allow' : 'deny') : 'role';
                          const inherited = roleGrants(memberEditor.roleId).has(key);
                          return (
                            <td key={a} className="px-2 py-2 text-center">
                              <select
                                aria-label={`${resourceLabel(r)} ${actionLabel(a)}`}
                                className="rounded-lg border border-stone-200 bg-white px-1.5 py-1 text-xs"
                                value={value}
                                onChange={(e) => {
                                  const next = new Map(memberEditor.overrides);
                                  if (e.target.value === 'role') next.delete(key);
                                  else next.set(key, e.target.value === 'allow');
                                  setMemberEditor({ ...memberEditor, overrides: next });
                                }}
                              >
                                <option value="role">{inherited ? '✓' : '–'} {t('Rolle', 'Role')}</option>
                                <option value="allow">{t('Erlauben', 'Allow')}</option>
                                <option value="deny">{t('Verbieten', 'Deny')}</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={adminButtonSecondary} onClick={() => setMemberEditor(null)}>{t('Abbrechen', 'Cancel')}</button>
              <button type="button" className={adminButtonPrimary} disabled={busy} onClick={saveMember}>{t('Speichern', 'Save')}</button>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          description={confirm.message}
          confirmText={t('Bestätigen', 'Confirm')}
          cancelText={t('Abbrechen', 'Cancel')}
          isDanger
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const job = confirm.run;
            setConfirm(null);
            await job();
          }}
        />
      )}
    </AdminLayout>
  );
}
