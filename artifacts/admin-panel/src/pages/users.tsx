import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { UserPlus, Shield, Eye, Code, Settings, X, Search, Users as UsersIcon } from "lucide-react";

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  admin: { icon: <Shield className="w-3 h-3" />, color: "text-red-400 bg-red-500/10 border-red-500/30", bg: "bg-red-500" },
  developer: { icon: <Code className="w-3 h-3" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", bg: "bg-blue-500" },
  ops: { icon: <Settings className="w-3 h-3" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", bg: "bg-amber-500" },
  viewer: { icon: <Eye className="w-3 h-3" />, color: "text-green-400 bg-green-500/10 border-green-500/30", bg: "bg-green-500" },
};

const AVATAR_COLORS = [
  "from-blue-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-36 bg-muted rounded animate-pulse" />
          <div className="h-4 w-40 bg-muted/60 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-48 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <UsersIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No users yet</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">Add your first team member to get started with role-based access control.</p>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ email: "", name: "", role: "viewer" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: api.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreate(false);
      setForm({ email: "", name: "", role: "viewer" });
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  const filteredUsers = data?.users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.users.length ?? 0} users registered</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-lg shadow-primary/5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">New User</span>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer transition-all"
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="ops">Ops</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => form.email && form.name && createMutation.mutate(form)}
                disabled={!form.email || !form.name}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const roleConf = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["viewer"]!;
                const avatarGradient = getAvatarColor(user.name);
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-semibold text-white shadow-lg transition-transform group-hover:scale-105`}>
                          {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${roleConf.color}`}>
                        {roleConf.icon}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-2 text-xs ${user.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`}>
                        <span className="relative">
                          <span className={`block w-2 h-2 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                          {user.status === "active" && <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />}
                        </span>
                        <span className="capitalize font-medium">{user.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : <span className="italic">Never</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
