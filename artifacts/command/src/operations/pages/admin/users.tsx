import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, History, LogOut, Mail, Shield, UserPlus, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRoute } from 'wouter';

type PageRoleFilter = 'recipient' | 'actor' | 'both';

interface PagingActor {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}
interface UserPageEntry {
  id: number;
  team: string;
  urgency: 'info' | 'warning' | 'critical';
  message: string | null;
  inAppDelivered: boolean;
  createdAt: string;
  actor: PagingActor | null;
  recipient: PagingActor | null;
  role: 'received' | 'sent';
}
interface UserPagesResponse {
  user: { id: number; displayName: string };
  role: PageRoleFilter;
  count: number;
  pages: UserPageEntry[];
}

const URGENCY_COLOR: Record<UserPageEntry['urgency'], string> = {
  info: '#7dd3fc',
  warning: '#f59e0b',
  critical: '#ef4444',
};

function formatPageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)}h ago`;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

const roleColors: Record<string, string> = {
  admin: 'text-[#c45a4a] bg-[#c45a4a]/10',
  editor: 'text-[#4a90b8] bg-[#4a90b8]/10',
  viewer: 'text-[#6b8f71] bg-[#6b8f71]/10',
  developer: 'text-violet-400 bg-violet-500/10',
};

export default function AdminUsers() {
  const [, params] = useRoute<{ id: string }>('/admin/users/:id');
  const focusId = params?.id ?? null;
  const [search, setSearch] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const focusedRowRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, error } = useStandardQuery<{ users: UserInfo[] }>({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch('/admin/users'),
  });

  const extractNumericId = (id: string): string => id.replace(/^usr_/, '');

  const forceLogout = useStandardMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/admin/users/${extractNumericId(userId)}/revoke-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }) as Promise<{ revokedSessionCount: number }>,
    onSuccess: (result, userId) => {
      const user = users.find((u) => u.id === userId);
      const label = user?.name || user?.email || `user ${userId}`;
      toast.success(
        `Signed out ${label} (${result.revokedSessionCount} session${result.revokedSessionCount === 1 ? '' : 's'} revoked)`,
      );
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to sign user out';
      toast.error(message);
      setConfirmingId(null);
    },
  });

  const [pageRoleFilter, setPageRoleFilter] = useState<PageRoleFilter>('both');
  const numericFocusId = focusId ? extractNumericId(focusId) : null;
  const pagesQuery = useStandardQuery<UserPagesResponse>({
    queryKey: ['admin-user-pages', numericFocusId, pageRoleFilter],
    queryFn: () => apiFetch(`/users/${numericFocusId}/pages?role=${pageRoleFilter}`),
    enabled: !!numericFocusId,
  });

  const users = data?.users ?? [];
  const matchesFocus = (u: UserInfo): boolean => {
    if (!focusId) return false;
    return u.id === focusId || u.id === `usr_${focusId}` || u.id.replace(/^usr_/, '') === focusId;
  };
  const filtered = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;
  const focusedUser = focusId ? (users.find(matchesFocus) ?? null) : null;
  const focusMissing = !!focusId && !isLoading && !focusedUser;

  useEffect(() => {
    if (focusedRowRef.current) {
      focusedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedUser?.id]);

  if (error)
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Users
        </h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>User management requires API connection</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Users
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          <UserPlus className="w-3.5 h-3.5" /> Invite User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-foreground' },
          {
            label: 'Admins',
            value: users.filter((u) => u.role === 'admin').length,
            color: 'text-[#c45a4a]',
          },
          {
            label: 'Active (30d)',
            value: users.filter((u) => u.status === 'active').length,
            color: 'text-[#6b8f71]',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl font-bold font-display ${color}`}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {focusMissing && (
        <div className="rounded-xl border border-[#d4a054]/40 bg-[#d4a054]/10 px-4 py-2 text-xs text-[#d4a054] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          User <span className="font-mono">{focusId}</span> not found in the directory.
        </div>
      )}

      {focusedUser && (
        <div className="rounded-xl border border-border bg-card" data-testid="card-paging-history">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Paging history
              <span className="text-xs font-normal text-muted-foreground">
                — {focusedUser.name}
                {pagesQuery.data?.count != null && (
                  <span className="opacity-60"> ({pagesQuery.data.count})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/40">
              {(['recipient', 'actor', 'both'] as const).map((r) => {
                const label = r === 'recipient' ? 'Received' : r === 'actor' ? 'Sent' : 'Both';
                const active = pageRoleFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setPageRoleFilter(r)}
                    data-testid={`button-page-role-${r}`}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4">
            {pagesQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pagesQuery.isError ? (
              <div className="flex items-center gap-2 text-xs text-[#c45a4a]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Failed to load paging history.
              </div>
            ) : !pagesQuery.data || pagesQuery.data.pages.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No pages recorded for this user yet.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {pagesQuery.data.pages.map((p) => {
                  const color = URGENCY_COLOR[p.urgency];
                  const actorName = p.actor?.displayName ?? 'unknown actor';
                  const recipientName = p.recipient?.displayName ?? 'unknown recipient';
                  return (
                    <div
                      key={p.id}
                      className="px-2.5 py-2 rounded-md text-[11px] bg-muted/30"
                      style={{ borderLeft: `3px solid ${color}` }}
                      title={new Date(p.createdAt).toLocaleString()}
                      data-testid={`row-page-${p.id}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color,
                            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                          }}
                        >
                          {p.urgency}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                          {p.role}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {p.team}
                        </span>
                        <span className="font-semibold">{actorName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold">{recipientName}</span>
                        <span className="font-mono ml-auto text-muted-foreground">
                          {formatPageTime(p.createdAt)}
                        </span>
                      </div>
                      {p.message && <div className="mt-1 italic">“{p.message}”</div>}
                      {!p.inAppDelivered && (
                        <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                          in-app opt-out — external channels attempted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((user) => {
              const isFocused = matchesFocus(user);
              return (
                <div
                  key={user.id}
                  ref={isFocused ? focusedRowRef : undefined}
                  data-testid={isFocused ? 'row-focused-user' : undefined}
                  className={`px-4 py-3 flex items-center justify-between gap-4 transition-colors ${isFocused ? 'bg-primary/10 ring-1 ring-inset ring-primary/40' : 'hover:bg-muted/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white">
                      {user.name?.slice(0, 2).toUpperCase() ?? '??'}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleColors[user.role] ?? 'text-muted-foreground bg-muted'}`}
                    >
                      <Shield className="w-2.5 h-2.5 inline mr-1" />
                      {user.role}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                    {confirmingId === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => forceLogout.mutate(user.id)}
                          disabled={forceLogout.isPending}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-[#c45a4a] text-white hover:bg-[#b04a3a] disabled:opacity-60"
                          data-testid={`button-confirm-force-logout-${user.id}`}
                        >
                          {forceLogout.isPending ? 'Signing out…' : 'Confirm sign-out'}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          disabled={forceLogout.isPending}
                          className="px-2 py-1 rounded text-[10px] font-semibold border border-border text-muted-foreground hover:bg-muted"
                          data-testid={`button-cancel-force-logout-${user.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(user.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-border text-[#c45a4a] hover:bg-[#c45a4a]/10"
                        title="Force this user's active sessions to sign out immediately"
                        data-testid={`button-force-logout-${user.id}`}
                      >
                        <LogOut className="w-3 h-3" /> Force sign-out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
