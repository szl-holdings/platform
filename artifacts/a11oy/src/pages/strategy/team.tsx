import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Check, Edit2, Key, Search, Shield, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { OpsLayout } from '../../components/command/ops-layout';

interface ApiTeamResponse {
  members: TeamMember[];
  teams: Array<{ name: string; count: number; color: string }>;
  summary: { total: number; active: number };
  generatedAt: string;
  dataSource: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'active' | 'invited' | 'suspended';
  lastSeen: string;
  apps: string[];
  avatar: string;
}

const APPS = [
  'PARAGON',
  'SEXTANT',
  'DOMAINE',
  'KORA',
  'PRAXIS',
  'Carlota Jo',
  'SZL Holdings',
  'Command',
];

const FALLBACK_MEMBERS: TeamMember[] = [
  {
    id: 'u1',
    name: 'Stephen Lutar',
    email: 'stephen@szlholdings.com',
    role: 'Super Admin',
    team: 'Executive',
    status: 'active',
    lastSeen: 'Now',
    apps: APPS,
    avatar: 'SL',
  },
  {
    id: 'u2',
    name: 'Marcus Chen',
    email: 'm.chen@szlholdings.com',
    role: 'Operations Lead',
    team: 'Maritime Ops',
    status: 'active',
    lastSeen: '5m ago',
    apps: ['SEXTANT', 'Command', 'SZL Holdings'],
    avatar: 'MC',
  },
  {
    id: 'u3',
    name: 'Priya Nair',
    email: 'p.nair@szlholdings.com',
    role: 'Legal Counsel',
    team: 'Legal',
    status: 'active',
    lastSeen: '1h ago',
    apps: ['PRAXIS', 'Command', 'PARAGON'],
    avatar: 'PN',
  },
  {
    id: 'u4',
    name: 'James Okafor',
    email: 'j.okafor@szlholdings.com',
    role: 'Security Analyst',
    team: 'PARAGON SOC',
    status: 'active',
    lastSeen: '2h ago',
    apps: ['PARAGON', 'Command'],
    avatar: 'JO',
  },
  {
    id: 'u5',
    name: 'Sofia Reyes',
    email: 's.reyes@szlholdings.com',
    role: 'Real Estate Analyst',
    team: 'DOMAINE',
    status: 'active',
    lastSeen: 'Yesterday',
    apps: ['DOMAINE', 'Command'],
    avatar: 'SR',
  },
  {
    id: 'u6',
    name: 'Tom Hartley',
    email: 't.hartley@szlholdings.com',
    role: 'Fleet Engineer',
    team: 'Maritime Ops',
    status: 'active',
    lastSeen: '3h ago',
    apps: ['SEXTANT', 'PARAGON'],
    avatar: 'TH',
  },
  {
    id: 'u7',
    name: 'Aisha Kamara',
    email: 'a.kamara@szlholdings.com',
    role: 'Financial Analyst',
    team: 'Finance',
    status: 'active',
    lastSeen: 'Today',
    apps: ['SZL Holdings', 'Command', 'DOMAINE'],
    avatar: 'AK',
  },
  {
    id: 'u8',
    name: 'New Hire',
    email: 'hire@szlholdings.com',
    role: 'Analyst',
    team: 'TBD',
    status: 'invited',
    lastSeen: '—',
    apps: [],
    avatar: 'NH',
  },
  {
    id: 'u9',
    name: 'Legacy User',
    email: 'legacy@external.com',
    role: 'Read Only',
    team: 'External',
    status: 'suspended',
    lastSeen: '3 months ago',
    apps: ['SEXTANT'],
    avatar: 'LU',
  },
];

const FALLBACK_TEAMS = [
  { name: 'Executive', count: 1, color: '#f59e0b' },
  { name: 'Maritime Ops', count: 2, color: '#4d8fcc' },
  { name: 'PARAGON SOC', count: 1, color: '#ef4444' },
  { name: 'Legal', count: 1, color: '#a855f7' },
  { name: 'DOMAINE', count: 1, color: '#22c55e' },
  { name: 'Finance', count: 1, color: '#f97316' },
  { name: 'External', count: 1, color: '#6b7280' },
];

const ROLES = [
  { name: 'Super Admin', description: 'Full access to all apps and settings', count: 1 },
  { name: 'Operations Lead', description: 'Manage domain operations, no billing access', count: 2 },
  { name: 'Legal Counsel', description: 'PRISM full access, read-only on others', count: 1 },
  { name: 'Security Analyst', description: 'PARAGON full access, read-only on others', count: 1 },
  { name: 'Analyst', description: 'Read-only access to assigned domains', count: 3 },
  { name: 'Read Only', description: 'View-only, no actions', count: 1 },
];

const STATUS_COLORS = {
  active: 'var(--color-low)',
  invited: 'var(--color-medium)',
  suspended: 'var(--color-critical)',
};

export default function TeamPage() {
  const [tab, setTab] = useState<'members' | 'teams' | 'roles' | 'sso'>('members');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: apiData } = useStandardQuery<ApiTeamResponse>({
    queryKey: ['command-team'],
    queryFn: async () => {
      const res = await fetch('/api/command/team', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load team');
      const json = await res.json();
      return (json?.data ?? json) as ApiTeamResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const MEMBERS: TeamMember[] = apiData?.members ?? FALLBACK_MEMBERS;
  const TEAMS = apiData?.teams ?? FALLBACK_TEAMS;

  const filtered = MEMBERS.filter((m) => {
    const s = search.toLowerCase();
    if (
      s &&
      !(m.name ?? '').toLowerCase().includes(s) &&
      !(m.email ?? '').toLowerCase().includes(s)
    )
      return false;
    if (teamFilter !== 'all' && m.team !== teamFilter) return false;
    return true;
  });

  return (
    <OpsLayout title="Team & Users">
      <div className="flex flex-col gap-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Users',
              value: MEMBERS.filter((m) => m.status !== 'suspended').length,
              icon: Users,
              color: '#8b7ac8',
            },
            { label: 'Active Now', value: 4, icon: Check, color: 'var(--color-low)' },
            { label: 'Pending Invites', value: 1, icon: UserPlus, color: 'var(--color-medium)' },
            { label: 'App Integrations', value: 8, icon: Key, color: 'var(--color-high)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl flex items-center gap-3"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color }}>
                  {value}
                </div>
                <div
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{
            backgroundColor: 'var(--color-surface-base)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          {(['members', 'teams', 'roles', 'sso'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                backgroundColor: tab === t ? 'var(--color-bg-elevated)' : 'transparent',
                color: tab === t ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
              }}
            >
              {t === 'sso' ? 'SSO Config' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'members' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--color-fg-muted)' }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    border: '1px solid var(--color-surface-border)',
                    color: 'var(--color-fg-primary)',
                  }}
                />
              </div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-2 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                  color: 'var(--color-fg-muted)',
                }}
              >
                <option value="all">All Teams</option>
                {TEAMS.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ml-auto"
                style={{ backgroundColor: '#8b7ac8', color: '#fff' }}
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite User
              </button>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="grid px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest"
                style={{
                  gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 2fr auto',
                  color: 'var(--color-fg-muted)',
                  borderBottom: '1px solid var(--color-surface-border)',
                }}
              >
                <span>User</span>
                <span>Role</span>
                <span>Team</span>
                <span>Last Seen</span>
                <span>App Access</span>
                <span>Status</span>
              </div>
              {filtered.map((member) => {
                const isEditing = editingId === member.id;
                return (
                  <div
                    key={member.id}
                    className="grid items-center px-5 py-3.5 transition-colors hover:bg-[var(--color-bg-elevated)]"
                    style={{
                      gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 2fr auto',
                      borderBottom: '1px solid var(--color-surface-border)',
                      opacity: member.status === 'suspended' ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: '#8b7ac820',
                          border: '1px solid #8b7ac840',
                          color: '#8b7ac8',
                        }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <div
                          className="text-sm font-semibold"
                          style={{ color: 'var(--color-fg-primary)' }}
                        >
                          {member.name}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--color-fg-muted)' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-fg-secondary)' }}>
                      {member.role}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      {member.team}
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                      {member.lastSeen}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.apps.slice(0, 3).map((app) => (
                        <span
                          key={app}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-surface-border)',
                            color: 'var(--color-fg-muted)',
                          }}
                        >
                          {app}
                        </span>
                      ))}
                      {member.apps.length > 3 && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-surface-border)',
                            color: 'var(--color-fg-muted)',
                          }}
                        >
                          +{member.apps.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold capitalize"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[member.status]} 12%, transparent)`,
                          color: STATUS_COLORS[member.status],
                        }}
                      >
                        {member.status}
                      </span>
                      <button
                        onClick={() => setEditingId(isEditing ? null : member.id)}
                        className="p-1 rounded"
                        style={{ color: 'var(--color-fg-muted)' }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {isEditing && (
                      <div
                        className="col-span-6 mt-3 pt-3 flex flex-col gap-3"
                        style={{ borderTop: '1px solid var(--color-surface-border)' }}
                      >
                        <div
                          className="text-[10px] font-mono uppercase tracking-widest"
                          style={{ color: 'var(--color-fg-muted)' }}
                        >
                          App Permissions
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {APPS.map((app) => {
                            const hasAccess = member.apps.includes(app);
                            return (
                              <label key={app} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  defaultChecked={hasAccess}
                                  className="rounded"
                                  style={{ accentColor: '#8b7ac8' }}
                                />
                                <span
                                  className="text-xs"
                                  style={{
                                    color: hasAccess
                                      ? 'var(--color-fg-secondary)'
                                      : 'var(--color-fg-muted)',
                                  }}
                                >
                                  {app}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: '#8b7ac8', color: '#fff' }}
                          >
                            Save Changes
                          </button>
                          {member.status !== 'suspended' && (
                            <button
                              className="px-3 py-1.5 rounded-lg text-xs"
                              style={{
                                backgroundColor: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-surface-border)',
                                color: 'var(--color-critical)',
                              }}
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAMS.map((team) => {
              const members = MEMBERS.filter((m) => m.team === team.name);
              return (
                <div
                  key={team.name}
                  className="rounded-xl p-5 flex flex-col gap-3"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    border: `1px solid color-mix(in srgb, ${team.color} 20%, var(--color-surface-border))`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span
                        className="font-bold text-sm"
                        style={{ color: 'var(--color-fg-primary)' }}
                      >
                        {team.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                      {team.count} member{team.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{ backgroundColor: '#8b7ac820', color: '#8b7ac8' }}
                        >
                          {m.avatar}
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-fg-secondary)' }}
                          >
                            {m.name}
                          </div>
                          <div className="text-[9px]" style={{ color: 'var(--color-fg-muted)' }}>
                            {m.role}
                          </div>
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[m.status] }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div
              className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed var(--color-surface-border)',
              }}
            >
              <Users className="w-6 h-6" style={{ color: 'var(--color-fg-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                Create New Team
              </span>
            </div>
          </div>
        )}

        {tab === 'roles' && (
          <div className="flex flex-col gap-3">
            {ROLES.map((role) => (
              <div
                key={role.name}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#8b7ac820', border: '1px solid #8b7ac840' }}
                >
                  <Shield className="w-4 h-4" style={{ color: '#8b7ac8' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-fg-primary)' }}>
                    {role.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                    {role.description}
                  </div>
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                  {role.count} user{role.count > 1 ? 's' : ''}
                </div>
                <button
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-surface-border)',
                    color: 'var(--color-fg-muted)',
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'sso' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-6 flex flex-col gap-4"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                SAML 2.0 Configuration
              </div>
              <div
                className="text-xs p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-surface-border)',
                  color: 'var(--color-fg-muted)',
                }}
              >
                SSO is configured via your identity provider. Contact your IDP administrator to
                configure SAML endpoints.
              </div>
              {[
                { label: 'Entity ID', value: 'https://szlholdings.com/saml/metadata' },
                { label: 'ACS URL', value: 'https://szlholdings.com/saml/acs' },
                { label: 'SLO URL', value: 'https://szlholdings.com/saml/slo' },
                { label: 'Provider', value: 'Not configured' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    {label}
                  </div>
                  <div
                    className="text-xs font-mono p-2 rounded-md"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      color: 'var(--color-fg-secondary)',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
              <button
                className="px-4 py-2 rounded-lg text-xs font-bold w-fit"
                style={{ backgroundColor: '#8b7ac8', color: '#fff' }}
              >
                Configure SSO
              </button>
            </div>
            <div
              className="rounded-xl p-6 flex flex-col gap-4"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Auth Policies
              </div>
              {[
                { label: 'Enforce MFA', enabled: true },
                { label: 'SSO Required for Admin Roles', enabled: false },
                { label: 'Session Timeout (8h)', enabled: true },
                { label: 'IP Allowlist Enforcement', enabled: false },
                { label: 'Audit Login Events', enabled: true },
              ].map(({ label, enabled }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--color-surface-border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--color-fg-secondary)' }}>
                    {label}
                  </span>
                  <button
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{
                      backgroundColor: enabled ? '#8b7ac8' : 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-surface-border)',
                    }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full w-4 h-4 transition-all"
                      style={{ backgroundColor: '#fff', left: enabled ? '20px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
