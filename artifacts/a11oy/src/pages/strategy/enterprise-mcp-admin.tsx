/**
 * Enterprise MCP Administration
 *
 * Manage enterprise IdP configurations, view provisioned users, and audit
 * enterprise SSO access events for the ID-JAG authorization flow.
 *
 * Uses the admin API routes at /admin/tenants/:id/enterprise-mcp/.
 */

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Key,
  RefreshCw,
  Shield,
  ToggleLeft,
  ToggleRight,
  User,
  XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { OpsLayout } from '../../components/command/ops-layout';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnterpriseIdp {
  id: number;
  tenantId: number;
  name: string;
  issuerUrl: string;
  jwksUri: string;
  expectedAudience: string;
  autoProvisionUsers: boolean;
  defaultRole: string;
  enabled: boolean;
  jwksCacheTtlSeconds: number;
  requireEmailVerified: boolean;
  claimsToRoleMapping: ClaimsToRoleMapping | Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditEvent {
  id: number;
  eventType: string;
  issuer: string | null;
  subject: string | null;
  email: string | null;
  mappedRole: string | null;
  errorCode: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface ProvisionedUser {
  userId: number | null;
  subject: string | null;
  email: string | null;
  mappedRole: string | null;
  mcpScope: string | null;
  issuer: string | null;
  lastAccessAt: string | null;
  revoked: boolean;
}

// ── Claims Mapping Types ──────────────────────────────────────────────────────

interface ClaimsToRoleMapping {
  groups?: Record<string, string>;
  roles?: Record<string, string>;
  customClaims?: Array<{ claim: string; value: string; role: string }>;
}

const MCP_ROLES = ['mcp_admin', 'operator', 'viewer'] as const;

// ── Tenant Support ────────────────────────────────────────────────────────────

interface TenantSummary {
  id: number;
  azureTenantId: string;
  displayName: string;
}

async function fetchTenants(): Promise<TenantSummary[]> {
  const r = await fetch(`${BASE}/api/admin/tenants`, { credentials: 'include' });
  if (!r.ok) return [];
  const d = await r.json() as { tenants?: TenantSummary[]; data?: { tenants?: TenantSummary[] } };
  return d.tenants ?? d.data?.tenants ?? [];
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchIdps(tenantId: number): Promise<EnterpriseIdp[]> {
  const r = await fetch(`${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/idps`, {
    credentials: 'include',
  });
  if (!r.ok) return [];
  const d = await r.json() as { idps: EnterpriseIdp[] };
  return d.idps ?? [];
}

async function fetchAudit(tenantId: number, idpId?: number): Promise<AuditEvent[]> {
  const url = idpId
    ? `${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/audit?idpId=${idpId}&limit=30`
    : `${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/audit?limit=30`;
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) return [];
  const d = await r.json() as { events: AuditEvent[] };
  return d.events ?? [];
}

async function fetchUsers(tenantId: number): Promise<ProvisionedUser[]> {
  const r = await fetch(`${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/users`, {
    credentials: 'include',
  });
  if (!r.ok) return [];
  const d = await r.json() as { provisionedUsers: ProvisionedUser[] };
  return d.provisionedUsers ?? [];
}

async function toggleIdp(tenantId: number, idpId: number, enabled: boolean): Promise<boolean> {
  const r = await fetch(
    `${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/idps/${idpId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  );
  return r.ok;
}

async function createIdp(tenantId: number, body: Record<string, unknown>): Promise<EnterpriseIdp | null> {
  const r = await fetch(`${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/idps`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  const d = await r.json() as { idp?: EnterpriseIdp };
  return d.idp ?? null;
}

async function updateIdp(tenantId: number, idpId: number, body: Record<string, unknown>): Promise<EnterpriseIdp | null> {
  const r = await fetch(`${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/idps/${idpId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  const d = await r.json() as { idp?: EnterpriseIdp };
  return d.idp ?? null;
}

async function deleteIdp(tenantId: number, idpId: number): Promise<boolean> {
  const r = await fetch(`${BASE}/api/admin/tenants/${tenantId}/enterprise-mcp/idps/${idpId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return r.ok;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function eventColor(eventType: string): string {
  if (eventType.includes('error') || eventType.includes('failed') || eventType.includes('invalid')) {
    return 'text-red-400';
  }
  if (eventType.includes('revoked')) return 'text-orange-400';
  if (eventType.includes('linked') || eventType.includes('provisioned')) return 'text-emerald-400';
  if (eventType.includes('issued') || eventType.includes('validated')) return 'text-blue-400';
  return 'text-slate-300';
}

// ── Claims Mapping Editor ─────────────────────────────────────────────────────

function ClaimsMappingEditor({
  value,
  onChange,
}: {
  value: ClaimsToRoleMapping;
  onChange: (v: ClaimsToRoleMapping) => void;
}) {
  const [section, setSection] = useState<'groups' | 'roles' | 'custom'>('groups');
  const [newKey, setNewKey] = useState('');
  const [newRole, setNewRole] = useState<string>('viewer');
  const [newClaim, setNewClaim] = useState('');
  const [newClaimVal, setNewClaimVal] = useState('');

  const addGroupRule = () => {
    if (!newKey) return;
    onChange({ ...value, groups: { ...(value.groups ?? {}), [newKey]: newRole } });
    setNewKey(''); setNewRole('viewer');
  };

  const removeGroupRule = (k: string) => {
    const next = { ...(value.groups ?? {}) };
    delete next[k];
    onChange({ ...value, groups: next });
  };

  const addRoleRule = () => {
    if (!newKey) return;
    onChange({ ...value, roles: { ...(value.roles ?? {}), [newKey]: newRole } });
    setNewKey(''); setNewRole('viewer');
  };

  const removeRoleRule = (k: string) => {
    const next = { ...(value.roles ?? {}) };
    delete next[k];
    onChange({ ...value, roles: next });
  };

  const addCustomRule = () => {
    if (!newClaim || !newClaimVal) return;
    const existing = value.customClaims ?? [];
    onChange({ ...value, customClaims: [...existing, { claim: newClaim, value: newClaimVal, role: newRole }] });
    setNewClaim(''); setNewClaimVal(''); setNewRole('viewer');
  };

  const removeCustomRule = (i: number) => {
    const next = (value.customClaims ?? []).filter((_, idx) => idx !== i);
    onChange({ ...value, customClaims: next });
  };

  const inputCls = 'rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none';
  const sectionBtnCls = (s: typeof section) =>
    `px-3 py-1.5 text-xs rounded-md transition-colors ${section === s ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button type="button" className={sectionBtnCls('groups')} onClick={() => { setSection('groups'); setNewKey(''); setNewRole('viewer'); }}>Groups</button>
        <button type="button" className={sectionBtnCls('roles')} onClick={() => { setSection('roles'); setNewKey(''); setNewRole('viewer'); }}>App Roles</button>
        <button type="button" className={sectionBtnCls('custom')} onClick={() => { setSection('custom'); setNewClaim(''); setNewClaimVal(''); setNewRole('viewer'); }}>Custom Claims</button>
      </div>

      {(section === 'groups' || section === 'roles') && (
        <div className="space-y-2">
          {Object.entries(section === 'groups' ? (value.groups ?? {}) : (value.roles ?? {})).map(([k, r]) => (
            <div key={k} className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2">
              <span className="flex-1 text-xs font-mono text-slate-300">{k}</span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">{r}</span>
              <button type="button" onClick={() => section === 'groups' ? removeGroupRule(k) : removeRoleRule(k)} className="text-slate-600 hover:text-red-400 text-xs ml-1">×</button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input className={`${inputCls} flex-1`} placeholder={section === 'groups' ? 'Group name' : 'App role name'} value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <select className={inputCls} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {MCP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" onClick={section === 'groups' ? addGroupRule : addRoleRule} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500">Add</button>
          </div>
        </div>
      )}

      {section === 'custom' && (
        <div className="space-y-2">
          {(value.customClaims ?? []).map((cc, i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2">
              <span className="text-xs font-mono text-slate-400">{cc.claim}={cc.value}</span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">{cc.role}</span>
              <button type="button" onClick={() => removeCustomRule(i)} className="text-slate-600 hover:text-red-400 text-xs ml-auto">×</button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input className={`${inputCls} w-24`} placeholder="claim" value={newClaim} onChange={(e) => setNewClaim(e.target.value)} />
            <input className={`${inputCls} flex-1`} placeholder="value" value={newClaimVal} onChange={(e) => setNewClaimVal(e.target.value)} />
            <select className={inputCls} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {MCP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" onClick={addCustomRule} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IdP Form Panel ────────────────────────────────────────────────────────────

function IdpFormPanel({
  tenantId,
  idp,
  onSave,
  onClose,
}: {
  tenantId: number;
  idp: EnterpriseIdp | null;
  onSave: (saved: EnterpriseIdp) => void;
  onClose: () => void;
}) {
  const isEdit = idp !== null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(idp?.name ?? '');
  const [issuerUrl, setIssuerUrl] = useState(idp?.issuerUrl ?? '');
  const [jwksUri, setJwksUri] = useState(idp?.jwksUri ?? '');
  const [expectedAudience, setExpectedAudience] = useState(idp?.expectedAudience ?? '');
  const [defaultRole, setDefaultRole] = useState(idp?.defaultRole ?? 'viewer');
  const [autoProvisionUsers, setAutoProvisionUsers] = useState(idp?.autoProvisionUsers ?? false);
  const [requireEmailVerified, setRequireEmailVerified] = useState(idp?.requireEmailVerified ?? true);
  const [jwksCacheTtlSeconds, setJwksCacheTtlSeconds] = useState(idp?.jwksCacheTtlSeconds ?? 3600);
  const [notes, setNotes] = useState(idp?.notes ?? '');
  const [claimsMapping, setClaimsMapping] = useState<ClaimsToRoleMapping>(
    (idp?.claimsToRoleMapping as ClaimsToRoleMapping | null) ?? {},
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const commonFields = {
      name, jwksUri, expectedAudience, defaultRole,
      autoProvisionUsers, requireEmailVerified,
      jwksCacheTtlSeconds: Number(jwksCacheTtlSeconds),
      notes: notes || null,
      claimsToRoleMapping: claimsMapping,
    };
    const body = isEdit ? commonFields : { ...commonFields, issuerUrl };
    const saved = isEdit
      ? await updateIdp(tenantId, idp.id, body)
      : await createIdp(tenantId, body);
    setSaving(false);
    if (!saved) { setError('Save failed. Check all fields and try again.'); return; }
    onSave(saved);
  };

  const inputCls = 'w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none';
  const labelCls = 'block text-xs text-slate-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-lg overflow-y-auto bg-slate-900 border-l border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">
            {isEdit ? 'Edit Identity Provider' : 'Register Identity Provider'}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:text-slate-200">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-5 py-6">
          <div>
            <label className={labelCls}>Display Name *</label>
            <input className={inputCls} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp — Azure AD" />
          </div>

          <div>
            <label className={labelCls}>Issuer URL {idp ? '' : '*'}</label>
            <input
              className={`${inputCls} ${idp ? 'cursor-not-allowed opacity-60' : ''}`}
              type="url"
              required={!idp}
              readOnly={!!idp}
              value={issuerUrl}
              onChange={(e) => { if (!idp) setIssuerUrl(e.target.value); }}
              placeholder="https://login.microsoftonline.com/{tenant-id}/v2.0"
            />
            <p className="mt-1 text-xs text-slate-600">
              {idp ? 'Issuer URL cannot be changed after registration.' : 'Must be globally unique across all tenants.'}
            </p>
          </div>

          <div>
            <label className={labelCls}>JWKS URI *</label>
            <input className={inputCls} required type="url" value={jwksUri} onChange={(e) => setJwksUri(e.target.value)} placeholder="https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys" />
          </div>

          <div>
            <label className={labelCls}>Expected Audience *</label>
            <input className={inputCls} required value={expectedAudience} onChange={(e) => setExpectedAudience(e.target.value)} placeholder="api://your-app-client-id" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Default Role</label>
              <select className={inputCls} value={defaultRole} onChange={(e) => setDefaultRole(e.target.value)}>
                {MCP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>JWKS Cache TTL (seconds)</label>
              <input className={inputCls} type="number" min={60} max={86400} value={jwksCacheTtlSeconds} onChange={(e) => setJwksCacheTtlSeconds(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={autoProvisionUsers} onChange={(e) => setAutoProvisionUsers(e.target.checked)} />
              <span className="text-sm text-slate-300">Auto-provision users</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={requireEmailVerified} onChange={(e) => setRequireEmailVerified(e.target.checked)} />
              <span className="text-sm text-slate-300">Require email verified</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Claims → Role Mapping</label>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
              <ClaimsMappingEditor value={claimsMapping} onChange={setClaimsMapping} />
            </div>
            <p className="mt-1 text-xs text-slate-600">Map IdP groups, app roles, or custom claims to MCP access roles.</p>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this IdP" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Register IdP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── IdP Card ──────────────────────────────────────────────────────────────────

function IdpCard({
  idp,
  onToggle,
  onEdit,
  onDelete,
}: {
  idp: EnterpriseIdp;
  onToggle: (id: number, enabled: boolean) => Promise<void>;
  onEdit: (idp: EnterpriseIdp) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(idp.id, !idp.enabled);
    setToggling(false);
  };

  return (
    <div className={`rounded-lg border ${idp.enabled ? 'border-slate-700 bg-slate-800/60' : 'border-slate-700/50 bg-slate-800/30 opacity-60'}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${idp.enabled ? 'bg-blue-500/10' : 'bg-slate-600/20'}`}>
          <Shield className={`h-5 w-5 ${idp.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-100 truncate">{idp.name}</span>
            {idp.enabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-600/20 px-2 py-0.5 text-xs text-slate-500">
                <XCircle className="h-3 w-3" /> Disabled
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">{idp.issuerUrl}</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-slate-700 disabled:opacity-40"
            aria-label={idp.enabled ? 'Disable IdP' : 'Enable IdP'}
          >
            {idp.enabled ? (
              <ToggleRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => onEdit(idp)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-blue-400"
            title="Edit IdP"
          >
            <Eye className="h-4 w-4" />
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-400"
              title="Delete IdP"
            >
              <XCircle className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400">Delete?</span>
              <button onClick={() => onDelete(idp.id)} className="rounded px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-300">No</button>
            </div>
          )}

          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-slate-500">JWKS URI</span>
            <p className="mt-0.5 text-slate-300 truncate font-mono">{idp.jwksUri}</p>
          </div>
          <div>
            <span className="text-slate-500">Expected Audience</span>
            <p className="mt-0.5 text-slate-300 font-mono">{idp.expectedAudience}</p>
          </div>
          <div>
            <span className="text-slate-500">Default Role</span>
            <p className="mt-0.5 text-slate-300 capitalize">{idp.defaultRole}</p>
          </div>
          <div>
            <span className="text-slate-500">Auto-Provision Users</span>
            <p className={`mt-0.5 ${idp.autoProvisionUsers ? 'text-emerald-400' : 'text-slate-400'}`}>
              {idp.autoProvisionUsers ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Require Email Verified</span>
            <p className={`mt-0.5 ${idp.requireEmailVerified ? 'text-amber-400' : 'text-slate-400'}`}>
              {idp.requireEmailVerified ? 'Required' : 'Not required'}
            </p>
          </div>
          <div>
            <span className="text-slate-500">JWKS Cache TTL</span>
            <p className="mt-0.5 text-slate-300">{idp.jwksCacheTtlSeconds}s</p>
          </div>
          {idp.notes && (
            <div className="col-span-2">
              <span className="text-slate-500">Notes</span>
              <p className="mt-0.5 text-slate-400">{idp.notes}</p>
            </div>
          )}
          <div className="col-span-2 text-slate-600">
            Last updated {fmtTime(idp.updatedAt)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

function AuditLog({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">No audit events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-slate-800/40">
          <div className="mt-0.5 flex-shrink-0">
            <div className={`text-xs font-mono font-medium ${eventColor(ev.eventType)}`}>
              {ev.eventType}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-xs text-slate-400">
            {ev.email && <span className="text-slate-300">{ev.email}</span>}
            {ev.mappedRole && <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">{ev.mappedRole}</span>}
            {ev.errorCode && (
              <span className="ml-2 text-red-400">[{ev.errorCode}]</span>
            )}
          </div>
          <div className="flex-shrink-0 text-xs text-slate-600">{fmtTime(ev.createdAt)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersPanel({ users }: { users: ProvisionedUser[] }) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <User className="mb-2 h-8 w-8" />
        <p className="text-sm">No enterprise users provisioned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u, idx) => (
        <div
          key={`${u.issuer}|${u.subject}|${idx}`}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${u.revoked ? 'border-red-500/20 bg-red-500/5 opacity-60' : 'border-slate-700/50 bg-slate-800/40'}`}
        >
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${u.revoked ? 'bg-red-900/30 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
            {(u.email ?? u.subject ?? '?')[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-slate-200 truncate">{u.email ?? u.subject ?? '—'}</div>
              {u.revoked && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                  <XCircle className="mr-1 h-3 w-3" /> Revoked
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-xs text-slate-600 truncate">{u.subject}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-slate-400 capitalize">{u.mappedRole ?? '—'}</div>
            {u.lastAccessAt && (
              <div className="text-xs text-slate-600">{fmtTime(u.lastAccessAt)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'idps' | 'audit' | 'users';

export default function EnterpriseMcpAdminPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [idps, setIdps] = useState<EnterpriseIdp[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<ProvisionedUser[]>([]);
  const [tab, setTab] = useState<Tab>('idps');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIdp, setEditingIdp] = useState<EnterpriseIdp | null>(null);

  useEffect(() => {
    fetchTenants().then((ts) => {
      setTenants(ts);
      if (ts.length > 0 && tenantId === null) {
        setTenantId(ts[0].id);
      }
    }).catch(() => {
      setTenants([]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (tid: number, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [idpData, auditData, userData] = await Promise.all([
        fetchIdps(tid),
        fetchAudit(tid),
        fetchUsers(tid),
      ]);
      setIdps(idpData);
      setAuditEvents(auditData);
      setUsers(userData);
    } catch {
      setError('Failed to load enterprise MCP data. Verify admin permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (tenantId !== null) {
      void load(tenantId);
    }
  }, [tenantId, load]);

  const handleToggle = useCallback(async (idpId: number, enabled: boolean) => {
    if (tenantId === null) return;
    const ok = await toggleIdp(tenantId, idpId, enabled);
    if (ok) {
      setIdps((prev) => prev.map((idp) => idp.id === idpId ? { ...idp, enabled } : idp));
    }
  }, [tenantId]);

  const handleEdit = useCallback((idp: EnterpriseIdp) => {
    setEditingIdp(idp);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (idpId: number) => {
    if (tenantId === null) return;
    const ok = await deleteIdp(tenantId, idpId);
    if (ok) {
      setIdps((prev) => prev.filter((idp) => idp.id !== idpId));
    }
  }, [tenantId]);

  const handleSave = useCallback((saved: EnterpriseIdp) => {
    setIdps((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditingIdp(null);
  }, []);

  const tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'idps', label: 'Identity Providers', icon: <Key className="h-4 w-4" />, count: idps.length },
    { id: 'audit', label: 'Audit Log', icon: <Eye className="h-4 w-4" />, count: auditEvents.length },
    { id: 'users', label: 'Provisioned Users', icon: <User className="h-4 w-4" />, count: users.length },
  ];

  return (
    <OpsLayout title="Enterprise MCP Authorization">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-100">Enterprise MCP Authorization</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage corporate SSO identity providers, view provisioned users, and audit access events for the ID-JAG enterprise authorization flow.
            </p>
            {tenants.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-slate-500">Tenant:</label>
                <select
                  value={tenantId ?? ''}
                  onChange={(e) => setTenantId(Number(e.target.value))}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tenants.length === 1 && tenants[0] && (
              <p className="mt-1 text-xs text-slate-600">Tenant: {tenants[0].displayName}</p>
            )}
          </div>
          <button
            onClick={() => tenantId !== null && void load(tenantId, true)}
            disabled={refreshing || tenantId === null}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
              <div className="text-xs text-slate-500">Active IdPs</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {idps.filter((i) => i.enabled).length}
                <span className="ml-1 text-sm font-normal text-slate-500">/ {idps.length}</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
              <div className="text-xs text-slate-500">Provisioned Users</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">{users.length}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
              <div className="text-xs text-slate-500">Audit Events (recent)</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">{auditEvents.length}</div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.icon}
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === t.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div>
            {tab === 'idps' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => { setEditingIdp(null); setShowForm(true); }}
                    disabled={tenantId === null}
                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-40"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Register IdP
                  </button>
                </div>
                {idps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Shield className="mb-2 h-10 w-10" />
                    <p className="text-sm">No enterprise identity providers configured</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Click "Register IdP" to add your first corporate SSO identity provider.
                    </p>
                  </div>
                ) : (
                  idps.map((idp) => (
                    <IdpCard
                      key={idp.id}
                      idp={idp}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={(id) => void handleDelete(id)}
                    />
                  ))
                )}
              </div>
            )}

            {tab === 'audit' && <AuditLog events={auditEvents} />}

            {tab === 'users' && <UsersPanel users={users} />}
          </div>
        )}
      </div>

      {showForm && tenantId !== null && (
        <IdpFormPanel
          tenantId={tenantId}
          idp={editingIdp}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingIdp(null); }}
        />
      )}
    </OpsLayout>
  );
}
