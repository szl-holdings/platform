import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { UserPlus, Shield, Eye, Code, Settings, X } from "lucide-react";

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  admin: { icon: <Shield className="w-3 h-3" />, color: "text-red-400 bg-red-500/10 border-red-500/30" },
  developer: { icon: <Code className="w-3 h-3" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  operator: { icon: <Settings className="w-3 h-3" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  viewer: { icon: <Eye className="w-3 h-3" />, color: "text-green-400 bg-green-500/10 border-green-500/30" },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.users.length ?? 0} users registered</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">New User</span>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => form.email && form.name && createMutation.mutate(form)}
                disabled={!form.email || !form.name}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => {
              const roleConf = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["viewer"]!;
              return (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${roleConf.color}`}>
                      {roleConf.icon}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
