import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { ChevronDown, Loader2, Shield, ShieldCheck, UserCheck, UserCog, UserX, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { adminFetch, Badge, EmptyState, Modal, SearchInput, SectionHeader } from './shared';
import type { AdminUser, AuditEntry, PlatformRole, UserDetail } from './types';

function UserDetailModal({ userId, onClose }: { userId: number | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: detail, isLoading } = useStandardQuery<UserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminFetch<UserDetail>(`/admin/users/${userId}/detail`),
    enabled: userId != null,
  });
  const { data: rolesData } = useStandardQuery<{ roles: PlatformRole[] }>({
    queryKey: ['admin-roles'],
    queryFn: () => adminFetch<{ roles: PlatformRole[] }>('/admin/roles'),
    enabled: userId != null,
  });
  const { data: roleHistoryData, isLoading: roleHistoryLoading } = useStandardQuery<{ logs: AuditEntry[]; total: number }>({
    queryKey: ['admin-user-role-history', userId],
    queryFn: () => adminFetch<{ logs: AuditEntry[]; total: number }>(`/admin/audit-log?entityType=user&entityId=${userId}&action=user.role.&limit=50`),
    enabled: userId != null,
  });
  const roleMutation = useStandardMutation({
    mutationFn: ({ roleId, action }: { roleId: number; action: 'add' | 'remove' }) =>
      adminFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ roleId, action }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-role-history', userId] });
    },
  });
  const userRoleIds = new Set((detail?.roles ?? []).map((r) => r.id));

  return (
    <Modal open={userId != null} onClose={onClose} title="User Profile">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !detail ? null : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {(detail.displayName ?? detail.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{detail.displayName ?? detail.email}</div>
              <div className="text-xs text-muted-foreground">{detail.email}</div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <Badge label={detail.isActive ? 'active' : 'inactive'} variant={detail.isActive ? 'green' : 'red'} />
                {detail.roles.map((r) => <Badge key={r.id} label={r.name} variant="blue" />)}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">User ID</span><span className="font-mono text-foreground">{detail.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-foreground">{new Date(detail.createdAt).toLocaleDateString()}</span></div>
            {detail.lastLoginAt && <div className="flex justify-between"><span className="text-muted-foreground">Last Login</span><span className="text-foreground">{new Date(detail.lastLoginAt).toLocaleString()}</span></div>}
          </div>

          {detail.organizations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Organizations</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {detail.organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">{org.name}</span>
                    <Badge label={org.role} variant="neutral" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {rolesData && rolesData.roles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Platform Roles</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {rolesData.roles.map((role) => {
                  const hasRole = userRoleIds.has(role.id);
                  return (
                    <div key={role.id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-foreground capitalize">{role.name}</div>
                        {role.description && <div className="text-[10px] text-muted-foreground">{role.description}</div>}
                      </div>
                      <button
                        onClick={() => roleMutation.mutate({ roleId: role.id, action: hasRole ? 'remove' : 'add' })}
                        disabled={roleMutation.isPending}
                        className={cn('text-xs px-2.5 py-1 rounded-md font-medium transition-colors', hasRole ? 'bg-blue-500/10 text-blue-600 hover:bg-red-500/10 hover:text-red-500' : 'bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600')}
                      >
                        {hasRole ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Role History
            </h4>
            {roleHistoryLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : !roleHistoryData?.logs?.length ? (
              <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-3 text-center">No role changes recorded</div>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {roleHistoryData.logs.map((entry) => {
                  const isAssigned = entry.action === 'user.role.assigned';
                  const parsed = entry.details ? (() => { try { return JSON.parse(entry.details!) as Record<string, unknown>; } catch { return null; } })() : null;
                  const roleName = (parsed?.roleName as string) ?? 'unknown';
                  return (
                    <div key={entry.id} className="px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', isAssigned ? 'bg-emerald-500' : 'bg-red-500')} />
                        <span className="font-medium text-foreground capitalize">{roleName}</span>
                        <Badge label={isAssigned ? 'assigned' : 'removed'} variant={isAssigned ? 'green' : 'red'} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground pl-3.5">
                        <span>by {entry.actor}</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ChangeRoleModal({ userId, userName, onClose }: { userId: number | null; userName: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: detailData, isLoading: detailLoading } = useStandardQuery<UserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminFetch<UserDetail>(`/admin/users/${userId}/detail`),
    enabled: userId != null,
  });
  const { data: rolesData, isLoading: rolesLoading } = useStandardQuery<{ roles: PlatformRole[] }>({
    queryKey: ['admin-roles'],
    queryFn: () => adminFetch<{ roles: PlatformRole[] }>('/admin/roles'),
    enabled: userId != null,
  });
  const roleMutation = useStandardMutation({
    mutationFn: ({ roleId, action }: { roleId: number; action: 'add' | 'remove' }) =>
      adminFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ roleId, action }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
  const userRoleIds = new Set((detailData?.roles ?? []).map((r) => r.id));
  const isLoading = detailLoading || rolesLoading;

  return (
    <Modal open={userId != null} onClose={onClose} title={`Change Role — ${userName}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Current Roles</div>
            {detailData && detailData.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detailData.roles.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
                    {r.name}
                    <button onClick={() => roleMutation.mutate({ roleId: r.id, action: 'remove' })} disabled={roleMutation.isPending} className="text-blue-400 hover:text-red-500 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No roles assigned.</p>
            )}
          </div>
          <div className="border-t border-border/50 pt-4">
            <div className="text-xs font-semibold text-foreground mb-2">Assign Role</div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {(rolesData?.roles ?? []).map((role) => {
                const hasRole = userRoleIds.has(role.id);
                return (
                  <div key={role.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <div className="text-xs font-medium text-foreground capitalize">{role.name}</div>
                      {role.description && <div className="text-[10px] text-muted-foreground">{role.description}</div>}
                    </div>
                    <button
                      onClick={() => roleMutation.mutate({ roleId: role.id, action: hasRole ? 'remove' : 'add' })}
                      disabled={roleMutation.isPending}
                      className={cn('text-xs px-2.5 py-1 rounded-md font-medium transition-colors min-w-[60px] text-center', hasRole ? 'bg-blue-500/10 text-blue-600 hover:bg-red-500/10 hover:text-red-500' : 'bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600')}
                    >
                      {roleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : hasRole ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function UsersPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users'],
    queryFn: () => adminFetch('/admin/users'),
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => {
      const numId = id.replace('usr_', '');
      return adminFetch(`/admin/users/${numId}/deactivate`, { method: 'PATCH', body: JSON.stringify({ active }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const allUsers = data?.users ?? [];
  const availableRoles = Array.from(new Set(allUsers.flatMap((u) => u.roles))).sort();
  const users = allUsers.filter((u) => {
    const matchesSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || (roleFilter === '__none__' ? u.roles.length === 0 : u.roles.includes(roleFilter));
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5">
      <SectionHeader title="User Management" subtitle={`${data?.total ?? 0} platform users`} onRefresh={() => refetch()} loading={isLoading} />
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by email or name..." />
        </div>
        <div className="relative">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-full pl-3 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer">
            <option value="">All roles</option>
            <option value="__none__">No role</option>
            {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : users.length === 0 ? (
        <EmptyState message={search || roleFilter ? 'No users match your filters.' : 'No users found.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {users.map((u) => {
            const numId = parseInt(u.id.replace('usr_', ''), 10);
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{(u.name ?? u.email ?? '?')[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{u.name ?? u.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.roles.map((r) => <Badge key={r} label={r} variant={r === 'admin' || r === 'super_admin' ? 'blue' : 'neutral'} />)}
                  <Badge label={u.status} variant={u.status === 'active' ? 'green' : 'red'} />
                  <button onClick={() => setChangeRoleUser({ id: numId, name: u.name ?? u.email ?? 'User' })} className="p-1.5 rounded-md text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors" title="Change role">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setSelectedUserId(numId)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View profile & manage roles">
                    <UserCog className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: u.id, active: u.status !== 'active' })}
                    disabled={toggleMutation.isPending}
                    className={cn('p-1.5 rounded-md transition-colors', u.status === 'active' ? 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10')}
                    title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      <ChangeRoleModal userId={changeRoleUser?.id ?? null} userName={changeRoleUser?.name ?? ''} onClose={() => setChangeRoleUser(null)} />
    </div>
  );
}
