import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, CheckCircle, Clock, AlertCircle, Palette, Globe, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import { toast } from "sonner";

interface ManagedOrg {
  id: number;
  name: string;
  slug: string;
  plan: string;
  status: string;
  accessLevel: string;
  assignedAt: string;
}

interface PartnerProfile {
  partner: { id: number; maxManagedTenants: number; status: string };
  managedOrgs: ManagedOrg[];
  managedOrgCount: number;
}

const planColors: Record<string, string> = {
  enterprise: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  professional: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  starter: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  free: "bg-slate-600/30 text-slate-400 border-slate-600/30",
};

function statusIcon(status: string) {
  if (status === "active") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "suspended") return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
}

function ProvisionModal({ partnerId, onClose }: { partnerId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", slug: "", plan: "starter" });
  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiPost(`/partner/accounts/${partnerId}/tenants`, data),
    onSuccess: () => {
      toast.success("Tenant provisioned successfully");
      qc.invalidateQueries({ queryKey: ["partner-me"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Provision New Tenant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Organization Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Slug (URL identifier)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="acme-corp"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || !form.slug || mutation.isPending}
            className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {mutation.isPending ? "Provisioning…" : "Provision"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PartnerProfile>({
    queryKey: ["partner-me"],
    queryFn: () => apiGet("/partner/me"),
    retry: false,
  });

  const removeMutation = useMutation({
    mutationFn: ({ partnerId, orgId }: { partnerId: number; orgId: number }) =>
      apiDelete(`/partner/accounts/${partnerId}/tenants/${orgId}`),
    onSuccess: () => {
      toast.success("Tenant unassigned");
      qc.invalidateQueries({ queryKey: ["partner-me"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const orgs = data?.managedOrgs ?? [];
  const filtered = orgs.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl">
      {showModal && data?.partner && (
        <ProvisionModal partnerId={data.partner.id} onClose={() => setShowModal(false)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Managed Tenants</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {orgs.length} of {data?.partner?.maxManagedTenants ?? "—"} tenants provisioned
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!data?.partner || data.partner.status !== "active"}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Provision Tenant
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants…"
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{search ? "No matching tenants" : "No tenants provisioned yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Organization</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Access</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((org) => (
                <tr key={org.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {statusIcon(org.status)}
                      <div>
                        <p className="font-medium text-white">{org.name}</p>
                        <p className="text-xs text-slate-500">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-xs rounded border font-medium capitalize ${planColors[org.plan] ?? planColors.free}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-300 capitalize text-xs">{org.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-400 capitalize text-xs">{org.accessLevel}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/branding/${org.id}`}>
                        <a className="text-slate-400 hover:text-indigo-400 transition-colors" title="Configure branding">
                          <Palette className="w-4 h-4" />
                        </a>
                      </Link>
                      <Link href={`/domains/${org.id}`}>
                        <a className="text-slate-400 hover:text-cyan-400 transition-colors" title="Manage domains">
                          <Globe className="w-4 h-4" />
                        </a>
                      </Link>
                      {data?.partner && (
                        <button
                          onClick={() => removeMutation.mutate({ partnerId: data.partner.id, orgId: org.id })}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Unassign tenant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
