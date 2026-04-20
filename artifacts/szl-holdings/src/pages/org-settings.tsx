import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useProductionConfirm } from '@szl-holdings/shared-ui/production-confirm';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';

const API = '/api';

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const method = (opts.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
      ...((opts.headers as Record<string, string>) ?? {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? 'Request failed');
  }
  if (res.status === 204) return null as T;
  const json = await res.json();
  return json.data ?? json;
}

type OrgProfile = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  orgType: string | null;
  plan: string;
  status: string;
};

type Member = {
  memberId: number;
  userId: number;
  role: string;
  joinedAt: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

type NotifPrefs = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  inAppEnabled: boolean;
};

const TABS = [
  { id: 'profile', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'My Account', icon: User },
];

export default function OrgSettingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const qc = useQueryClient();
  const { confirm: productionConfirm } = useProductionConfirm();

  const resolvedOrgQuery = useStandardQuery<{ orgs?: { slug: string }[] }>({
    queryKey: ['me-orgs'],
    queryFn: () => apiFetch('/auth/me'),
    enabled: !orgSlug,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!orgSlug && resolvedOrgQuery.data) {
      const firstSlug = resolvedOrgQuery.data.orgs?.[0]?.slug;
      if (firstSlug) navigate(`/settings/${firstSlug}`);
    }
  }, [orgSlug, resolvedOrgQuery.data, navigate]);

  const slug = orgSlug ?? resolvedOrgQuery.data?.orgs?.[0]?.slug ?? '';

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const orgQuery = useStandardQuery<OrgProfile>({
    queryKey: ['org-profile', slug],
    queryFn: () => apiFetch(`/orgs/${slug}/profile`),
    enabled: !!slug,
  });

  const membersQuery = useStandardQuery<{ members: Member[]; total: number }>({
    queryKey: ['org-members', slug],
    queryFn: () => apiFetch(`/orgs/${slug}/members`),
    enabled: !!slug,
  });

  const notifQuery = useStandardQuery<NotifPrefs>({
    queryKey: ['org-notif-prefs', slug],
    queryFn: () => apiFetch(`/orgs/${slug}/notification-prefs`),
    enabled: !!slug && activeTab === 'notifications',
  });

  const userNotifQuery = useStandardQuery<NotifPrefs>({
    queryKey: ['user-notif-prefs'],
    queryFn: () => apiFetch(`/user/notification-preferences`),
    enabled: activeTab === 'account',
  });

  const userProfileQuery = useStandardQuery<{
    id: number;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
    bio: string | null;
  }>({
    queryKey: ['user-profile'],
    queryFn: () => apiFetch(`/user/profile`),
    enabled: activeTab === 'account',
  });

  const [orgForm, setOrgForm] = useState<Partial<OrgProfile>>({});
  const updateOrgMutation = useStandardMutation({
    mutationFn: (data: Partial<OrgProfile>) =>
      apiFetch(`/orgs/${slug}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-profile', slug] });
      showSuccess('Organization profile updated');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const removeMemberMutation = useStandardMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/orgs/${slug}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members', slug] });
      setRemovingUserId(null);
      showSuccess('Member removed');
    },
    onError: (err: Error) => {
      showError(err.message);
      setRemovingUserId(null);
    },
  });

  const updateRoleMutation = useStandardMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiFetch(`/orgs/${slug}/members/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members', slug] });
      showSuccess('Role updated');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [notifForm, setNotifForm] = useState<Partial<NotifPrefs>>({});
  const updateNotifMutation = useStandardMutation({
    mutationFn: (data: Partial<NotifPrefs>) =>
      apiFetch(`/orgs/${slug}/notification-prefs`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-notif-prefs', slug] });
      showSuccess('Notification preferences saved');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [userNotifForm, setUserNotifForm] = useState<Partial<NotifPrefs>>({});
  const updateUserNotifMutation = useStandardMutation({
    mutationFn: (data: Partial<NotifPrefs>) =>
      apiFetch(`/user/notification-preferences`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-notif-prefs'] });
      showSuccess('Your notification preferences saved');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [userForm, setUserForm] = useState<{ displayName: string; bio: string }>({
    displayName: '',
    bio: '',
  });
  const updateUserMutation = useStandardMutation({
    mutationFn: (data: typeof userForm) =>
      apiFetch(`/user/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      showSuccess('Profile updated');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [pwResetSent, setPwResetSent] = useState(false);
  const pwResetMutation = useStandardMutation({
    mutationFn: (email: string) =>
      apiFetch('/user/password-reset', { method: 'POST', body: JSON.stringify({ email }) }),
    onSuccess: () => {
      setPwResetSent(true);
      showSuccess('Password reset link sent to your email');
    },
    onError: (err: Error) => showError(err.message),
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const inviteMutation = useStandardMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      apiFetch(`/orgs/${slug}/invite`, { method: 'POST', body: JSON.stringify({ email, role }) }),
    onSuccess: () => {
      setInviteEmail('');
      qc.invalidateQueries({ queryKey: ['org-members', slug] });
      showSuccess('Invitation sent');
    },
    onError: (err: Error) => showError(err.message),
  });

  const org = orgQuery.data;
  const members = membersQuery.data?.members ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
          <Settings size={16} className="text-[#c9a84c]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">{org?.name ?? 'Organization'} — Settings</h1>
          <p className="text-xs text-white/40">
            {org?.plan ? `${org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} plan` : ''}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-sm text-emerald-300">{successMsg}</span>
          </m.div>
        )}
        {errorMsg && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-sm text-red-300">{errorMsg}</span>
          </m.div>
        )}
      </AnimatePresence>

      <div className="flex max-w-5xl mx-auto gap-8 px-6 py-8">
        <div className="w-48 shrink-0 flex flex-col gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-white/8 text-white border border-white/10'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <m.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">Organization Profile</h2>
                {orgQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">
                        Organization Name
                      </label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                        defaultValue={org?.name}
                        onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">
                        Domain
                      </label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                        defaultValue={org?.domain ?? ''}
                        placeholder="yourdomain.com"
                        onChange={(e) =>
                          setOrgForm((f) => ({ ...f, domain: e.target.value || null }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">
                        Logo URL
                      </label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                        defaultValue={org?.logoUrl ?? ''}
                        placeholder="https://..."
                        onChange={(e) =>
                          setOrgForm((f) => ({ ...f, logoUrl: e.target.value || null }))
                        }
                      />
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                      onClick={() => updateOrgMutation.mutate(orgForm)}
                      disabled={updateOrgMutation.isPending || !Object.keys(orgForm).length}
                    >
                      {updateOrgMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-1">Plan & Billing</h2>
                <p className="text-xs text-white/40 mb-4">Your current subscription and usage</p>
                <div className="flex items-center justify-between p-4 bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold capitalize">{org?.plan ?? '—'} Plan</p>
                    <p className="text-xs text-white/40">Status: {org?.status ?? '—'}</p>
                  </div>
                  <button
                    className="text-xs px-3 py-1.5 border border-white/15 rounded-lg text-white/60 hover:text-white transition-colors"
                    onClick={async () => {
                      const origin = window.location.origin;
                      const data = await apiFetch<{ data?: { url?: string }; url?: string }>(
                        '/billing/portal-session',
                        {
                          method: 'POST',
                          body: JSON.stringify({ returnUrl: `${origin}/settings` }),
                        },
                      );
                      const url = data?.data?.url ?? data?.url;
                      if (url) window.location.href = url;
                    }}
                  >
                    Manage Billing
                  </button>
                </div>
              </div>
            </m.div>
          )}

          {activeTab === 'team' && (
            <m.div
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">Invite Member</h2>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                    placeholder="team@example.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                    onClick={() =>
                      inviteEmail && inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
                    }
                    disabled={!inviteEmail || inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Plus size={13} />
                    )}
                    Invite
                  </button>
                </div>
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">
                  Team Members
                  <span className="ml-2 text-xs font-normal text-white/40">({members.length})</span>
                </h2>
                {membersQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold shrink-0">
                          {m.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.displayName}</p>
                          <p className="text-xs text-white/40 truncate">{m.email ?? '—'}</p>
                        </div>
                        <select
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                          value={m.role}
                          disabled={m.role === 'owner'}
                          onChange={(e) =>
                            updateRoleMutation.mutate({ userId: m.userId, role: e.target.value })
                          }
                        >
                          <option value="owner" disabled>
                            Owner
                          </option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        {m.role !== 'owner' && (
                          <button
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                            onClick={async () => {
                              const confirmed = await productionConfirm({
                                action: 'Remove Organization Member',
                                title: `Remove member from organization?`,
                                description:
                                  'This member will lose access to all organization resources immediately.',
                                confirmText: 'REMOVE',
                              });
                              if (!confirmed) return;
                              setRemovingUserId(m.userId);
                              removeMemberMutation.mutate(m.userId);
                            }}
                            disabled={removingUserId === m.userId}
                          >
                            {removingUserId === m.userId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-sm text-white/30 text-center py-4">
                        No members found. Invite someone above.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </m.div>
          )}

          {activeTab === 'notifications' && (
            <m.div
              key="notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-1">Notification Channels</h2>
                <p className="text-xs text-white/40 mb-5">
                  Configure how your organization receives alerts and updates.
                </p>
                {notifQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      {
                        key: 'inAppEnabled',
                        label: 'In-App Notifications',
                        icon: Bell,
                        desc: 'Real-time alerts within the platform',
                      },
                      {
                        key: 'emailEnabled',
                        label: 'Email Notifications',
                        icon: Mail,
                        desc: 'Alerts and digests via email',
                      },
                      {
                        key: 'smsEnabled',
                        label: 'SMS Notifications',
                        icon: Phone,
                        desc: 'Critical alerts via text message',
                      },
                      {
                        key: 'slackEnabled',
                        label: 'Slack Notifications',
                        icon: MessageSquare,
                        desc: 'Alerts in your connected Slack workspace',
                      },
                    ].map(({ key, label, icon: Icon, desc }) => {
                      const current =
                        notifForm[key as keyof NotifPrefs] ??
                        notifQuery.data?.[key as keyof NotifPrefs] ??
                        false;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <Icon size={14} className="text-white/50" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-xs text-white/40">{desc}</p>
                            </div>
                          </div>
                          <button
                            className={`w-11 h-6 rounded-full transition-colors relative ${current ? 'bg-[#c9a84c]' : 'bg-white/15'}`}
                            onClick={() => setNotifForm((f) => ({ ...f, [key]: !current }))}
                          >
                            <span
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${current ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                      onClick={() => updateNotifMutation.mutate(notifForm)}
                      disabled={updateNotifMutation.isPending || !Object.keys(notifForm).length}
                    >
                      {updateNotifMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      Save Preferences
                    </button>
                  </div>
                )}
              </div>
            </m.div>
          )}

          {activeTab === 'account' && (
            <m.div
              key="account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">My Profile</h2>
                {userProfileQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">
                        Display Name
                      </label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                        defaultValue={userProfileQuery.data?.displayName ?? ''}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, displayName: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">Bio</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors resize-none"
                        rows={3}
                        defaultValue={userProfileQuery.data?.bio ?? ''}
                        onChange={(e) => setUserForm((f) => ({ ...f, bio: e.target.value }))}
                      />
                    </div>
                    <div className="p-3 bg-white/3 rounded-lg">
                      <p className="text-xs text-white/40">
                        Email: {userProfileQuery.data?.email ?? '—'}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                      onClick={() => updateUserMutation.mutate(userForm)}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      Save Profile
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-1">My Notification Preferences</h2>
                <p className="text-xs text-white/40 mb-4">
                  Personal preferences override org-level defaults.
                </p>
                {userNotifQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: 'inAppEnabled', label: 'In-App', icon: Bell },
                      { key: 'emailEnabled', label: 'Email', icon: Mail },
                      { key: 'smsEnabled', label: 'SMS', icon: Phone },
                      { key: 'slackEnabled', label: 'Slack', icon: MessageSquare },
                    ].map(({ key, label, icon: Icon }) => {
                      const current =
                        userNotifForm[key as keyof NotifPrefs] ??
                        userNotifQuery.data?.[key as keyof NotifPrefs] ??
                        false;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl"
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-white/40" />
                            <span className="text-sm">{label}</span>
                          </div>
                          <button
                            className={`w-11 h-6 rounded-full transition-colors relative ${current ? 'bg-[#c9a84c]' : 'bg-white/15'}`}
                            onClick={() => setUserNotifForm((f) => ({ ...f, [key]: !current }))}
                          >
                            <span
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${current ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                      onClick={() => updateUserNotifMutation.mutate(userNotifForm)}
                      disabled={
                        updateUserNotifMutation.isPending || !Object.keys(userNotifForm).length
                      }
                    >
                      {updateUserNotifMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white/4 border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-red-400 mb-1">Danger Zone</h2>
                <p className="text-xs text-white/40 mb-4">
                  Actions here are irreversible. Proceed with caution.
                </p>
                <div className="space-y-2">
                  <a
                    href="/api/gdpr/export"
                    className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl text-sm hover:border-white/15 transition-colors"
                  >
                    <span>Export My Data (GDPR)</span>
                    <ChevronRight size={14} className="text-white/30" />
                  </a>
                  <button
                    className="w-full flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl text-sm hover:border-white/15 transition-colors disabled:opacity-50"
                    disabled={pwResetMutation.isPending || pwResetSent}
                    onClick={() => {
                      const email = userProfileQuery.data?.email;
                      if (!email) {
                        showError('No email address on file');
                        return;
                      }
                      pwResetMutation.mutate(email);
                    }}
                  >
                    <span>{pwResetSent ? 'Reset email sent' : 'Reset Password'}</span>
                    <ChevronRight size={14} className="text-white/30" />
                  </button>
                  <button
                    className="w-full flex items-center justify-between p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-sm text-red-400 hover:border-red-500/30 transition-colors"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to deactivate your account? This will log you out.',
                        )
                      ) {
                        apiFetch('/user/deactivate', { method: 'POST', body: JSON.stringify({}) })
                          .then(() => {
                            window.location.href = '/';
                          })
                          .catch((e: Error) => showError(e.message));
                      }
                    }}
                  >
                    <span>Deactivate Account</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
