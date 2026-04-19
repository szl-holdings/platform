import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Plus, Pencil, Trash2, RefreshCw, AlertTriangle, Check, X, Save, Power, PowerOff } from "lucide-react";

const ACCENT = "#d4a054";

const GUARDRAIL_TYPES = [
  "rate_limit",
  "cost_cap",
  "pii_redaction",
  "schema_validation",
  "content_filter",
  "tool_allowlist",
  "model_allowlist",
  "environment_lock",
  "approval_threshold",
] as const;

const ENFORCEMENT_MODES = ["enforce", "monitor", "advise"] as const;

const TIERS = [
  "advisory",
  "supervised",
  "operator-approved",
  "dual-approved",
  "regulated",
  "sovereign",
] as const;

interface GuardrailConfig {
  id: number;
  orgId: number | null;
  guardrailId: string;
  name: string;
  description?: string;
  guardrailType: string;
  config: Record<string, unknown>;
  appliesToTier?: string | null;
  enforcement: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  data: T;
  total?: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

interface FormState {
  guardrailId: string;
  name: string;
  description: string;
  guardrailType: string;
  appliesToTier: string;
  enforcement: string;
  enabled: boolean;
  configText: string;
}

function emptyForm(): FormState {
  return {
    guardrailId: "",
    name: "",
    description: "",
    guardrailType: GUARDRAIL_TYPES[0],
    appliesToTier: "",
    enforcement: "enforce",
    enabled: true,
    configText: "{}",
  };
}

function formFromConfig(c: GuardrailConfig): FormState {
  return {
    guardrailId: c.guardrailId,
    name: c.name,
    description: c.description ?? "",
    guardrailType: c.guardrailType,
    appliesToTier: c.appliesToTier ?? "",
    enforcement: c.enforcement,
    enabled: c.enabled,
    configText: JSON.stringify(c.config ?? {}, null, 2),
  };
}

interface GuardrailFormProps {
  initial: FormState;
  onSubmit: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  isCreate: boolean;
  busy: boolean;
  errorMessage?: string;
}

function GuardrailForm({ initial, onSubmit, onCancel, isCreate, busy, errorMessage }: GuardrailFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [parseError, setParseError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    let parsedConfig: Record<string, unknown> = {};
    if (form.configText.trim().length > 0) {
      try {
        const j = JSON.parse(form.configText);
        if (!j || typeof j !== "object" || Array.isArray(j)) {
          setParseError("Config must be a JSON object.");
          return;
        }
        parsedConfig = j as Record<string, unknown>;
      } catch (err) {
        setParseError(`Config JSON invalid: ${(err as Error).message}`);
        return;
      }
    }
    setParseError(null);
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      config: parsedConfig,
      appliesToTier: form.appliesToTier === "" ? null : form.appliesToTier,
      enforcement: form.enforcement,
      enabled: form.enabled,
    };
    if (isCreate) {
      body["guardrailId"] = form.guardrailId;
      body["guardrailType"] = form.guardrailType;
    }
    onSubmit(body);
  }

  const valid = isCreate
    ? form.guardrailId.trim().length > 0 && form.name.trim().length > 0
    : form.name.trim().length > 0;

  return (
    <div className="rounded border p-3 flex flex-col gap-2" style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}06` }}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Guardrail ID {isCreate ? "*" : "(read-only)"}
          </label>
          <input
            data-testid="guardrail-form-id"
            disabled={!isCreate}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none disabled:opacity-60"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            placeholder="e.g. vessels-rate-limit-v1"
            value={form.guardrailId}
            onChange={e => set("guardrailId", e.target.value)}
          />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Name *</label>
          <input
            data-testid="guardrail-form-name"
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            placeholder="Display name"
            value={form.name}
            onChange={e => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Type {isCreate ? "*" : "(read-only)"}
          </label>
          <select
            data-testid="guardrail-form-type"
            disabled={!isCreate}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none disabled:opacity-60"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={form.guardrailType}
            onChange={e => set("guardrailType", e.target.value)}
          >
            {GUARDRAIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Applies to Tier</label>
          <select
            data-testid="guardrail-form-tier"
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={form.appliesToTier}
            onChange={e => set("appliesToTier", e.target.value)}
          >
            <option value="">— all tiers —</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Enforcement</label>
          <select
            data-testid="guardrail-form-enforcement"
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={form.enforcement}
            onChange={e => set("enforcement", e.target.value)}
          >
            {ENFORCEMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: "rgba(255,255,255,0.7)" }}>
            <input
              data-testid="guardrail-form-enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={e => set("enabled", e.target.checked)}
            />
            Enabled
          </label>
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Description</label>
        <input
          data-testid="guardrail-form-description"
          className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
          placeholder="What does this guardrail do?"
          value={form.description}
          onChange={e => set("description", e.target.value)}
        />
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Config (JSON object)</label>
        <textarea
          data-testid="guardrail-form-config"
          className="w-full text-[10px] font-mono px-2 py-2 rounded outline-none"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", minHeight: 140 }}
          spellCheck={false}
          value={form.configText}
          onChange={e => set("configText", e.target.value)}
        />
      </div>
      {(parseError || errorMessage) && (
        <div className="rounded p-2 text-[11px] flex items-center gap-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" /> {parseError ?? errorMessage}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          data-testid="guardrail-form-save"
          disabled={busy || !valid}
          onClick={submit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold disabled:opacity-50"
          style={{ color: "#22c55e", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}
        >
          {isCreate ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />} {isCreate ? "Create" : "Save"}
        </button>
        <button
          data-testid="guardrail-form-cancel"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold"
          style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function GuardrailConfigsPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [enabledFilter, setEnabledFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (typeFilter) p.set("guardrailType", typeFilter);
    if (enabledFilter) p.set("enabled", enabledFilter);
    p.set("limit", "100");
    return p.toString();
  }, [typeFilter, enabledFilter]);

  const listQ = useQuery<ApiResponse<GuardrailConfig[]>>({
    queryKey: ["guardrail-configs", typeFilter, enabledFilter],
    queryFn: () => fetchJson<ApiResponse<GuardrailConfig[]>>(`/api/guardian/guardrail-configs?${queryParams}`),
  });

  const createMut = useMutation({
    mutationFn: (body: object) => fetchJson("/api/guardian/guardrail-configs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guardrail-configs"] }); setCreating(false); setFlash("Guardrail created."); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      fetchJson(`/api/guardian/guardrail-configs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guardrail-configs"] }); setEditingId(null); setFlash("Guardrail updated."); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      fetchJson(`/api/guardian/guardrail-configs/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["guardrail-configs"] }); setFlash(vars.enabled ? "Guardrail enabled." : "Guardrail disabled."); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetchJson(`/api/guardian/guardrail-configs/${id}`, { method: "DELETE", body: JSON.stringify({}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guardrail-configs"] }); setConfirmDeleteId(null); setFlash("Guardrail deleted."); },
  });

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const items = listQ.data?.data ?? [];
  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending || toggleMut.isPending;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" data-testid="guardrail-configs-page">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.95)" }}>
              Guardrail Configurations
            </h1>
            <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              Create, edit, disable, or delete the guardrails that policy enforcement applies live
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => listQ.refetch()}
            data-testid="guardrail-configs-refresh"
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RefreshCw className={`w-3 h-3 ${listQ.isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            data-testid="guardrail-configs-add"
            onClick={() => { setCreating(true); setEditingId(null); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
            style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <Plus className="w-3 h-3" /> Add Guardrail
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[9px] uppercase tracking-widest font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Type</label>
          <select
            data-testid="guardrail-filter-type"
            className="text-[11px] px-2 py-1 rounded outline-none"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">all</option>
            {GUARDRAIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] uppercase tracking-widest font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Enabled</label>
          <select
            data-testid="guardrail-filter-enabled"
            className="text-[11px] px-2 py-1 rounded outline-none"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={enabledFilter}
            onChange={e => setEnabledFilter(e.target.value)}
          >
            <option value="">all</option>
            <option value="true">enabled</option>
            <option value="false">disabled</option>
          </select>
        </div>
        {(typeFilter || enabledFilter) && (
          <button
            onClick={() => { setTypeFilter(""); setEnabledFilter(""); }}
            data-testid="guardrail-filter-clear"
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded"
            style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
        <span className="text-[10px] font-mono ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
          {items.length} guardrail{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {flash && (
        <div className="rounded p-2 mb-3 flex items-center gap-2 text-[11px]" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.30)", color: "#22c55e" }}>
          <Check className="w-3.5 h-3.5" /> {flash}
        </div>
      )}

      {listQ.error && (
        <div className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed to load guardrails: {(listQ.error as Error).message}
        </div>
      )}

      {creating && (
        <div className="mb-3">
          <GuardrailForm
            initial={emptyForm()}
            isCreate
            busy={createMut.isPending}
            errorMessage={createMut.isError ? (createMut.error as Error).message : undefined}
            onCancel={() => setCreating(false)}
            onSubmit={(body) => createMut.mutate(body)}
          />
        </div>
      )}

      {listQ.isLoading ? (
        <div className="text-[11px] font-mono py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Loading guardrails…</div>
      ) : items.length === 0 ? (
        <div className="text-[11px] font-mono py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>No guardrails match these filters.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const isEditing = editingId === item.id;
            const isConfirming = confirmDeleteId === item.id;
            return (
              <div
                key={item.id}
                data-testid={`guardrail-row-${item.id}`}
                className="rounded border"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
              >
                <div className="flex items-start gap-3 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{item.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{item.guardrailId}</span>
                      <span
                        className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
                        style={{ color: ACCENT, background: `${ACCENT}10`, border: `1px solid ${ACCENT}30` }}
                      >
                        {item.guardrailType}
                      </span>
                      <span
                        className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
                        style={{
                          color: item.enforcement === "enforce" ? "#ef4444" : item.enforcement === "monitor" ? "#0ea5e9" : "#7c8a9a",
                          background: item.enforcement === "enforce" ? "rgba(239,68,68,0.10)" : item.enforcement === "monitor" ? "rgba(14,165,233,0.10)" : "rgba(124,138,154,0.10)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        {item.enforcement}
                      </span>
                      {item.appliesToTier && (
                        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                          tier: {item.appliesToTier}
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
                        style={{
                          color: item.enabled ? "#22c55e" : "#7c8a9a",
                          background: item.enabled ? "rgba(34,197,94,0.10)" : "rgba(124,138,154,0.10)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {item.enabled ? "enabled" : "disabled"}
                      </span>
                    </div>
                    {item.description && (
                      <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{item.description}</div>
                    )}
                  </div>
                  {!isEditing && !isConfirming && (
                    <div className="flex items-center gap-1.5">
                      <button
                        data-testid={`guardrail-toggle-${item.id}`}
                        disabled={busy}
                        onClick={() => toggleMut.mutate({ id: item.id, enabled: !item.enabled })}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                        style={{
                          color: item.enabled ? "#7c8a9a" : "#22c55e",
                          background: item.enabled ? "rgba(124,138,154,0.10)" : "rgba(34,197,94,0.10)",
                          border: `1px solid ${item.enabled ? "rgba(124,138,154,0.30)" : "rgba(34,197,94,0.30)"}`,
                        }}
                        title={item.enabled ? "Disable" : "Enable"}
                      >
                        {item.enabled ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        data-testid={`guardrail-edit-${item.id}`}
                        onClick={() => { setEditingId(item.id); setCreating(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                        style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        data-testid={`guardrail-delete-${item.id}`}
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                        style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                  {isConfirming && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono" style={{ color: "#ef4444" }}>Delete?</span>
                      <button
                        data-testid={`guardrail-delete-confirm-${item.id}`}
                        disabled={busy}
                        onClick={() => deleteMut.mutate(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                        style={{ color: "#ef4444", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)" }}
                      >
                        <Check className="w-3 h-3" /> Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                        style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <X className="w-3 h-3" /> No
                      </button>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="px-3 pb-3">
                    <GuardrailForm
                      initial={formFromConfig(item)}
                      isCreate={false}
                      busy={updateMut.isPending}
                      errorMessage={updateMut.isError ? (updateMut.error as Error).message : undefined}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(body) => updateMut.mutate({ id: item.id, body })}
                    />
                  </div>
                )}
                {!isEditing && (
                  <div className="px-3 pb-3">
                    <pre
                      className="text-[10px] font-mono p-2 rounded overflow-x-auto"
                      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", maxHeight: 160 }}
                    >
{JSON.stringify(item.config ?? {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
