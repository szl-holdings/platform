import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Mail, Shield, Clock, AlertTriangle, LogOut } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

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
  admin: "text-[#c45a4a] bg-[#c45a4a]/10",
  editor: "text-[#4a90b8] bg-[#4a90b8]/10",
  viewer: "text-[#6b8f71] bg-[#6b8f71]/10",
  developer: "text-violet-400 bg-violet-500/10",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<{ users: UserInfo[] }>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/admin/users"),
  });

  const extractNumericId = (id: string): string => id.replace(/^usr_/, "");

  const forceLogout = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/admin/users/${extractNumericId(userId)}/revoke-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }) as Promise<{ revokedSessionCount: number }>,
    onSuccess: (result, userId) => {
      const user = users.find(u => u.id === userId);
      const label = user?.name || user?.email || `user ${userId}`;
      toast.success(`Signed out ${label} (${result.revokedSessionCount} session${result.revokedSessionCount === 1 ? "" : "s"} revoked)`);
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to sign user out";
      toast.error(message);
      setConfirmingId(null);
    },
  });

  const users = data?.users ?? [];
  const filtered = search ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : users;

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Users</h1>
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
          <h1 className="text-xl font-display font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Users</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage platform users, roles, and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          <UserPlus className="w-3.5 h-3.5" /> Invite User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "text-foreground" },
          { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "text-[#c45a4a]" },
          { label: "Active (30d)", value: users.filter(u => u.status === "active").length, color: "text-[#6b8f71]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl font-bold font-display ${color}`}>{isLoading ? "—" : value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((user) => (
              <div key={user.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white">
                    {user.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleColors[user.role] ?? "text-muted-foreground bg-muted"}`}>
                    <Shield className="w-2.5 h-2.5 inline mr-1" />{user.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</span>
                  {confirmingId === user.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => forceLogout.mutate(user.id)}
                        disabled={forceLogout.isPending}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-[#c45a4a] text-white hover:bg-[#b04a3a] disabled:opacity-60"
                        data-testid={`button-confirm-force-logout-${user.id}`}
                      >
                        {forceLogout.isPending ? "Signing out…" : "Confirm sign-out"}
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
            ))}
            {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
