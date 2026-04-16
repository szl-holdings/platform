import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
  Building2, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2,
  Copy, Check, Eye, EyeOff, X, Settings, Globe, RefreshCw, Plus,
  Shield, Cloud, Key, UserCheck, LinkIcon, Database, HardDrive, Activity,
  ExternalLink, Edit3, Trash2, Save, FileText, Mail, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, apiFetchAdmin } from "./api";
import { StatusBadge } from "./CmsTablePanel";

// ─── Azure Tenant Management Panel ───────────────────────────────────────────

interface AzureTenant {
  id: number;
  azureTenantId: string;
  displayName: string;
  domain: string;
  status: string;
  adminConsentGranted: string;
  organizationId: number | null;
  provisionedAt: string;
  updatedAt: string;
}

function AzureTenantsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ azureTenantId: "", displayName: "", domain: "", status: "active" });
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [consentCopied, setConsentCopied] = useState<number | null>(null);
  const [expandedTenant, setExpandedTenant] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["azure-tenants"],
    queryFn: () => apiFetch<{ count: number; tenants: AzureTenant[] }>("/admin/tenants"),
  });

  const tenants: AzureTenant[] = data?.tenants ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.azureTenantId.trim() || !form.displayName.trim() || !form.domain.trim()) {
      setFormError("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/admin/tenants", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ azureTenantId: "", displayName: "", domain: "", status: "active" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to provision tenant");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    setActionError("");
    try {
      await apiFetch(`/admin/tenants/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update tenant status");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deprovision and delete this tenant? This cannot be undone.")) return;
    setActionError("");
    try {
      await apiFetch(`/admin/tenants/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete tenant");
    }
  }

  async function copyConsentUrl(id: number) {
    setActionError("");
    try {
      const result = await apiFetch<{ adminConsentUrl: string }>(`/admin/tenants/${id}/admin-consent-url`);
      await navigator.clipboard.writeText(result.adminConsentUrl);
      setConsentCopied(id);
      setTimeout(() => setConsentCopied(null), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to copy consent URL");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" /> Azure AD Tenant Provisioning
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage enterprise customer tenants provisioned for multi-tenant Azure AD SSO and Dynamics 365 access.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Provision Tenant
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <m.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">New Azure AD Tenant</span>
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Azure Tenant ID (GUID)</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.azureTenantId}
                  onChange={e => setForm(f => ({ ...f, azureTenantId: e.target.value.trim() }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoso Corporation"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Primary Domain</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="contoso.onmicrosoft.com"
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value.trim() }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Status</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Provisioning…" : "Provision Tenant"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </m.form>
        )}
      </AnimatePresence>

      {actionError && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading tenants…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load tenants. Ensure you have admin access.
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Cloud className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">No tenants provisioned</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Provision Tenant" to register your first Azure AD customer tenant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{tenant.displayName}</span>
                      <StatusBadge status={tenant.status} />
                      {tenant.adminConsentGranted === "granted" && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" /> Consent
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{tenant.domain} · {tenant.azureTenantId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedTenant === tenant.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedTenant === tenant.id && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Admin Consent</div>
                          <div className="font-medium text-foreground capitalize mt-0.5">{tenant.adminConsentGranted?.replace("_", " ") ?? "not_requested"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Org ID</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.organizationId ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Provisioned</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.provisionedAt ? new Date(tenant.provisionedAt).toLocaleDateString() : "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Updated</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : "—"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => copyConsentUrl(tenant.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 border border-violet-500/20 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                        >
                          {consentCopied === tenant.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                          {consentCopied === tenant.id ? "Copied!" : "Copy Admin Consent URL"}
                        </button>
                        {tenant.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "suspended")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" /> Suspend
                          </button>
                        ) : tenant.status === "suspended" ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "active")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Deprovision
                        </button>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-primary" /> Setup Guide
        </h3>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Register an Azure AD multi-tenant application in your Microsoft Entra portal.</li>
          <li>Add the tenant GUID, display name, and domain here to provision access.</li>
          <li>Copy the Admin Consent URL and share it with the customer's Azure AD Global Administrator.</li>
          <li>Once consent is granted, the tenant can sign in via the Azure AD SSO endpoint.</li>
          <li>Configure a Dataverse connection for the tenant through the API to enable CRM sync.</li>
        </ol>
      </div>
    </div>
  );
}


export { AzureTenantsPanel };
