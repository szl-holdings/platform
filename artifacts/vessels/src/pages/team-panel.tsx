import { useStandardQuery } from '@szl-holdings/api-client-react';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Crown,
  Eye,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

interface TeamMember {
  id: number;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  profileImageUrl?: string | null;
}

const ROLE_STYLES: Record<string, { label: string; cls: string; icon: typeof Shield }> = {
  admin: {
    label: 'Admin',
    cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: Crown,
  },
  ops: {
    label: 'Operations',
    cls: 'bg-[rgba(77,143,204,0.10)] text-[#4d8fcc] border-[rgba(77,143,204,0.20)]',
    icon: Shield,
  },
  compliance: {
    label: 'Compliance',
    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Shield,
  },
  maintenance: {
    label: 'Maintenance',
    cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: Wrench,
  },
  analyst: {
    label: 'Analyst',
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Eye,
  },
  viewer: { label: 'Viewer', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Eye },
};

const DEMO_MEMBERS: TeamMember[] = [
  {
    id: 1,
    displayName: 'Marcus Wentworth',
    email: 'm.wentworth@szlholdings.com',
    role: 'admin',
    lastSeenAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    displayName: 'Priya Chandrasekaran',
    email: 'p.chandrasekaran@szlholdings.com',
    role: 'ops',
    lastSeenAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    displayName: 'Nolan Ashford',
    email: 'n.ashford@szlholdings.com',
    role: 'compliance',
    lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    displayName: 'Serena Kowalski',
    email: 's.kowalski@szlholdings.com',
    role: 'analyst',
    lastSeenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    displayName: 'Rafael Oduya',
    email: 'r.oduya@szlholdings.com',
    role: 'maintenance',
    lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    displayName: 'Ingrid Halvorsen',
    email: 'i.halvorsen@szlholdings.com',
    role: 'ops',
    lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function relativeTime(dateStr?: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function onlineStatus(lastSeenAt?: string | null) {
  if (!lastSeenAt) return 'offline';
  const mins = (Date.now() - new Date(lastSeenAt).getTime()) / 60_000;
  if (mins < 10) return 'online';
  if (mins < 60) return 'away';
  return 'offline';
}

function RoleBadge({ role }: { role?: string | null }) {
  const r = ROLE_STYLES[role ?? ''] ?? {
    label: role ?? 'Member',
    cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: Shield,
  };
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', r.cls)}>
      {r.label}
    </span>
  );
}

function MemberAvatar({ member }: { member: TeamMember }) {
  const status = onlineStatus(member.lastSeenAt);
  return (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full bg-[rgba(77,143,204,0.10)] border border-[rgba(77,143,204,0.20)] flex items-center justify-center">
        <span className="text-[11px] font-bold text-[#4d8fcc]">
          {initials(member.displayName ?? member.username)}
        </span>
      </div>
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--gi-bg-base)]',
          status === 'online'
            ? 'bg-emerald-400'
            : status === 'away'
              ? 'bg-amber-400'
              : 'bg-zinc-600',
        )}
      />
    </div>
  );
}

export default function TeamPanelPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const {
    data: apiData,
    isLoading,
    refetch,
  } = useStandardQuery({
    queryKey: ['team-members'],
    queryFn: () => apiFetch<{ data?: TeamMember[] }>('/auth/users'),
    staleTime: 60_000,
  });

  const rawMembers: TeamMember[] = (apiData as { data?: TeamMember[] })?.data ?? [];
  const members = rawMembers.length > 0 ? rawMembers : DEMO_MEMBERS;

  const filtered = members.filter((m) => {
    const name = (m.displayName ?? m.username ?? '').toLowerCase();
    const email = (m.email ?? '').toLowerCase();
    const matchesSearch =
      !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = Array.from(new Set(members.map((m) => m.role).filter((r): r is string => !!r)));

  const onlineCount = members.filter((m) => onlineStatus(m.lastSeenAt) === 'online').length;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--gi-text-primary)]">Team</h1>
          <p className="text-xs text-[var(--gi-text-muted)] mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} · {onlineCount} online
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(77,143,204,0.08)] border border-[rgba(77,143,204,0.18)] text-[#4d8fcc] text-xs hover:bg-[rgba(77,143,204,0.14)] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total members', value: members.length, icon: Users, color: 'text-[#4d8fcc]' },
          { label: 'Online now', value: onlineCount, icon: UserCheck, color: 'text-emerald-400' },
          {
            label: 'Admins',
            value: members.filter((m) => m.role === 'admin').length,
            icon: Crown,
            color: 'text-violet-400',
          },
          { label: 'Pending invites', value: 2, icon: Mail, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-xl p-4">
            <s.icon className={cn('w-4 h-4 mb-2', s.color)} />
            <p className={cn('text-lg font-bold font-display', s.color)}>{s.value}</p>
            <p className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--gi-text-primary)] placeholder:text-[var(--gi-text-placeholder)] outline-none focus:border-[var(--gi-border-focus)] transition-colors"
        />
        <div className="flex items-center gap-1.5">
          {[null, ...roles].map((r) => (
            <button
              key={r ?? 'all'}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize',
                roleFilter === r
                  ? 'bg-[rgba(77,143,204,0.12)] border-[rgba(77,143,204,0.28)] text-[#4d8fcc]'
                  : 'bg-transparent border-[var(--gi-border-subtle)] text-[var(--gi-text-muted)] hover:border-[var(--gi-border-default)] hover:text-[var(--gi-text-secondary)]',
              )}
            >
              {r ?? 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Member list */}
      <div className="bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-[var(--gi-bg-raised)] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-[var(--gi-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--gi-text-muted)]">No members found</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-4 py-2 border-b border-[var(--gi-border-subtle)]">
              <span />
              <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Member</span>
              <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Role</span>
              <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">
                Last active
              </span>
              <span />
            </div>
            {filtered.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3 border-b border-[var(--gi-border-subtle)] last:border-0 hover:bg-[var(--gi-bg-hover)] transition-colors"
              >
                <MemberAvatar member={m} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--gi-text-primary)] truncate">
                    {m.displayName ?? m.username ?? `User #${m.id}`}
                  </p>
                  <p className="text-[11px] text-[var(--gi-text-muted)] truncate">{m.email ?? '—'}</p>
                </div>
                <RoleBadge role={m.role} />
                <span className="text-[11px] text-[var(--gi-text-muted)] whitespace-nowrap">
                  {relativeTime(m.lastSeenAt)}
                </span>
                <button className="text-[var(--gi-text-muted)] hover:text-[var(--gi-text-secondary)] transition-colors p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite CTA */}
      <div className="flex items-center justify-between bg-[rgba(77,143,204,0.05)] border border-[rgba(77,143,204,0.15)] rounded-xl px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--gi-text-primary)]">Invite team members</p>
          <p className="text-[11px] text-[var(--gi-text-muted)] mt-0.5">
            Add colleagues and assign fleet access roles
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(77,143,204,0.08)] border border-[rgba(77,143,204,0.20)] text-[#4d8fcc] text-xs font-medium hover:bg-[rgba(77,143,204,0.14)] transition-colors">
          <Mail className="w-3.5 h-3.5" />
          Send invite
        </button>
      </div>
    </div>
  );
}
