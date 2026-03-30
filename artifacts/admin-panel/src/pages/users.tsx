import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, UserPlus, CheckCircle2, XCircle, Shield, Mail } from "lucide-react";
import { useState } from "react";

export default function UsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: api.getUsers });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "viewer" });

  const createMut = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowForm(false);
      setForm({ email: "", name: "", role: "viewer" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users and access control</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Create New User</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <input
                className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select
                className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMut.mutate(form)}
              disabled={createMut.isPending || !form.email || !form.name}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMut.isPending ? "Creating..." : "Create User"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
          {createMut.isError && (
            <p className="text-xs text-red-400 mt-2">Failed to create user. Please try again.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || "(unnamed)"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      <Shield className="w-3 h-3" />
                      {u.role || "viewer"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.isActive ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Active</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" />Inactive</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
