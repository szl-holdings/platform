import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Globe, Plus, CheckCircle, Clock, AlertCircle, Trash2, Shield, Copy, X } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import { toast } from "sonner";

interface CustomDomain {
  id: number;
  orgId: number;
  domain: string;
  status: string;
  verificationMethod: string;
  verificationToken: string;
  verificationRecord: string | null;
  sslStatus: string;
  isPrimary: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
}

interface DomainsResponse {
  domains: CustomDomain[];
  count: number;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending_verification: { icon: Clock, color: "text-yellow-400", label: "Pending Verification" },
  verified: { icon: CheckCircle, color: "text-blue-400", label: "Verified" },
  active: { icon: CheckCircle, color: "text-emerald-400", label: "Active" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
  disabled: { icon: AlertCircle, color: "text-slate-500", label: "Disabled" },
};

const sslConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "text-slate-500", label: "Pending" },
  provisioning: { color: "text-yellow-400", label: "Provisioning" },
  active: { color: "text-emerald-400", label: "Active" },
  failed: { color: "text-red-400", label: "Failed" },
  expired: { color: "text-orange-400", label: "Expired" },
};

function AddDomainModal({ orgId, onClose }: { orgId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [domain, setDomain] = useState("");
  const [method, setMethod] = useState("dns_txt");
  const [result, setResult] = useState<{ domain: CustomDomain; instructions: Record<string, string> } | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { domain: string; verificationMethod: string }) =>
      apiPost<{ domain: CustomDomain; instructions: Record<string, string> }>(`/orgs/${orgId}/custom-domains`, data),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["domains", orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Verification Instructions</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">Domain: <span className="text-white font-medium">{result.domain.domain}</span></p>
            <p className="text-xs text-slate-400 mb-3">{result.instructions.hint}</p>
            <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2">
              <code className="text-xs text-indigo-300 font-mono break-all">{result.instructions.record}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(result.instructions.record ?? ""); toast.success("Copied!"); }}
                className="ml-2 shrink-0 text-slate-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">DNS changes can take up to 48 hours to propagate. Use the verify button in the domains list once complete.</p>
          <button onClick={onClose} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Add Custom Domain</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="app.yourbrand.com"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Verification Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="dns_txt">DNS TXT Record</option>
              <option value="dns_cname">DNS CNAME Record</option>
              <option value="http_file">HTTP File Upload</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate({ domain, verificationMethod: method })}
            disabled={!domain || mutation.isPending}
            className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {mutation.isPending ? "Adding…" : "Add Domain"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DomainsPage() {
  const { orgId } = useParams<{ orgId?: string }>();
  const selectedOrgId = orgId ? parseInt(orgId, 10) : null;
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<DomainsResponse>({
    queryKey: ["domains", selectedOrgId],
    queryFn: () => apiGet(`/orgs/${selectedOrgId}/custom-domains`),
    enabled: !!selectedOrgId,
  });

  const verifyMutation = useMutation({
    mutationFn: (domainId: number) =>
      apiPost(`/orgs/${selectedOrgId}/custom-domains/${domainId}/verify`, {}),
    onSuccess: () => {
      toast.success("Domain verified");
      qc.invalidateQueries({ queryKey: ["domains", selectedOrgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (domainId: number) =>
      apiPost(`/orgs/${selectedOrgId}/custom-domains/${domainId}/activate`, {}),
    onSuccess: () => {
      toast.success("Domain activated — now live");
      qc.invalidateQueries({ queryKey: ["domains", selectedOrgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (domainId: number) =>
      apiDelete(`/orgs/${selectedOrgId}/custom-domains/${domainId}`),
    onSuccess: () => {
      toast.success("Domain removed");
      qc.invalidateQueries({ queryKey: ["domains", selectedOrgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!selectedOrgId) {
    return (
      <div className="p-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-white font-semibold mb-2">Select a Tenant</h2>
          <p className="text-slate-400 text-sm">Navigate to a tenant's domains from the Tenants page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {showModal && <AddDomainModal orgId={selectedOrgId} onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Custom Domains</h1>
          <p className="text-slate-400 text-sm mt-0.5">Org #{selectedOrgId} — Map your own domains to the platform</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !data?.domains.length ? (
          <div className="py-12 text-center">
            <Globe className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No custom domains</p>
            <p className="text-slate-400 text-sm">Add a domain to give your tenants a branded URL.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data.domains.map((d) => {
              const sc = statusConfig[d.status] ?? statusConfig.pending_verification;
              const ssl = sslConfig[d.sslStatus] ?? sslConfig.pending;
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{d.domain}</p>
                        {d.isPrimary && (
                          <span className="px-1.5 py-0.5 text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`flex items-center gap-1 text-xs ${sc.color}`}>
                          <sc.icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${ssl.color}`}>
                          <Shield className="w-3 h-3" />
                          SSL: {ssl.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(d.status === "pending_verification" || d.status === "failed") && (
                      <button
                        onClick={() => verifyMutation.mutate(d.id)}
                        disabled={verifyMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {d.status === "verified" && (
                      <button
                        onClick={() => activateMutation.mutate(d.id)}
                        disabled={activateMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(d.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
