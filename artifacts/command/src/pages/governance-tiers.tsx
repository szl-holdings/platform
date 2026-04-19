import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Pencil, RefreshCw, AlertTriangle, Check, X, Save } from "lucide-react";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

const ACCENT = "#d4a054";

interface TierApi {
  tier: string;
  tierNumber: number;
  description: string;
  riskLevel: number;
  controls: Record<string, unknown>;
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

const RISK_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: "Minimal", color: "#7c8a9a" },
  2: { label: "Low", color: "#22c55e" },
  3: { label: "Moderate", color: "#0ea5e9" },
  4: { label: "Elevated", color: "#d4a054" },
  5: { label: "High", color: "#f97316" },
  6: { label: "Critical", color: "#ef4444" },
};

interface TierEditorProps {
  tier: TierApi;
  onCancel: () => void;
  onSave: (patch: { description: string; riskLevel: number; controls: Record<string, unknown> }) => void;
  busy: boolean;
  errorMessage?: string;
}

function TierEditor({ tier, onCancel, onSave, busy, errorMessage }: TierEditorProps) {
  const [description, setDescription] = useState(tier.description);
  const [riskLevel, setRiskLevel] = useState(tier.riskLevel);
  const [controlsText, setControlsText] = useState(() => JSON.stringify(tier.controls, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  function handleSave() {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(controlsText) as Record<string, unknown>;
    } catch (err) {
      setParseError(`Controls JSON invalid: ${(err as Error).message}`);
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setParseError("Controls must be a JSON object.");
      return;
    }
    setParseError(null);
    onSave({ description, riskLevel, controls: parsed });
  }

  return (
    <div className="rounded border p-3 flex flex-col gap-3" style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}06` }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Description</label>
          <textarea
            data-testid={`tier-description-${tier.tier}`}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", minHeight: 80 }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Risk Level (1–6)</label>
          <select
            data-testid={`tier-risk-${tier.tier}`}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{ background: "#0c1420", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
            value={riskLevel}
            onChange={e => setRiskLevel(parseInt(e.target.value, 10))}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} — {RISK_LABEL[n]?.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>
          Controls (JSON object)
        </label>
        <textarea
          data-testid={`tier-controls-${tier.tier}`}
          className="w-full text-[10px] font-mono px-2 py-2 rounded outline-none"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", minHeight: 240 }}
          spellCheck={false}
          value={controlsText}
          onChange={e => setControlsText(e.target.value)}
        />
      </div>
      {(parseError || errorMessage) && (
        <div className="rounded p-2 text-[11px] flex items-center gap-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" /> {parseError ?? errorMessage}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          data-testid={`tier-save-${tier.tier}`}
          disabled={busy}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold disabled:opacity-50"
          style={{ color: "#22c55e", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}
        >
          <Save className="w-3 h-3" /> Save tier
        </button>
        <button
          data-testid={`tier-cancel-${tier.tier}`}
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

export default function GovernanceTiersPage() {
  const qc = useQueryClient();
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [savedTier, setSavedTier] = useState<string | null>(null);

  const tiersQ = useStandardQuery<ApiResponse<TierApi[]>>({
    queryKey: ["governance-tiers"],
    queryFn: () => fetchJson<ApiResponse<TierApi[]>>("/api/guardian/policies/tiers"),
  });

  const updateMut = useStandardMutation({
    mutationFn: ({ tier, body }: { tier: string; body: object }) =>
      fetchJson(`/api/guardian/policies/tiers/${tier}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["governance-tiers"] });
      setEditingTier(null);
      setSavedTier(vars.tier);
    },
  });

  useEffect(() => {
    if (!savedTier) return;
    const t = setTimeout(() => setSavedTier(null), 2500);
    return () => clearTimeout(t);
  }, [savedTier]);

  const tiers = useMemo(() => tiersQ.data?.data ?? [], [tiersQ.data]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" data-testid="governance-tiers-page">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.95)" }}>
              Governance Tiers
            </h1>
            <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              Edit description, risk level, and control set for each Guardian tier (T0 – T5)
            </div>
          </div>
        </div>
        <button
          onClick={() => tiersQ.refetch()}
          data-testid="governance-tiers-refresh"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className={`w-3 h-3 ${tiersQ.isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {tiersQ.error && (
        <div className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed to load governance tiers: {(tiersQ.error as Error).message}
        </div>
      )}
      {savedTier && (
        <div className="rounded p-2 mb-3 flex items-center gap-2 text-[11px]" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.30)", color: "#22c55e" }}>
          <Check className="w-3.5 h-3.5" /> Tier <span className="font-mono">{savedTier}</span> saved.
        </div>
      )}

      {tiersQ.isLoading ? (
        <div className="text-[11px] font-mono py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Loading tiers…</div>
      ) : tiers.length === 0 ? (
        <div className="text-[11px] font-mono py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>No tiers returned.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {tiers.map(tier => {
            const risk = RISK_LABEL[tier.riskLevel] ?? { label: `level ${tier.riskLevel}`, color: ACCENT };
            const isEditing = editingTier === tier.tier;
            return (
              <div
                key={tier.tier}
                data-testid={`tier-row-${tier.tier}`}
                className="rounded border"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
              >
                <div className="flex items-start gap-3 px-3 py-3">
                  <div
                    className="w-9 h-9 rounded flex items-center justify-center text-[12px] font-bold font-mono"
                    style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, color: ACCENT }}
                  >
                    T{tier.tierNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold font-mono" style={{ color: "rgba(255,255,255,0.9)" }}>
                        {tier.tier}
                      </span>
                      <span
                        className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
                        style={{ color: risk.color, background: `${risk.color}15`, border: `1px solid ${risk.color}40` }}
                      >
                        risk {tier.riskLevel} · {risk.label}
                      </span>
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {tier.description}
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      data-testid={`tier-edit-${tier.tier}`}
                      onClick={() => setEditingTier(tier.tier)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
                      style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="px-3 pb-3">
                    <TierEditor
                      tier={tier}
                      busy={updateMut.isPending}
                      errorMessage={updateMut.isError ? (updateMut.error as Error).message : undefined}
                      onCancel={() => setEditingTier(null)}
                      onSave={(patch) => updateMut.mutate({ tier: tier.tier, body: patch })}
                    />
                  </div>
                ) : (
                  <div className="px-3 pb-3">
                    <pre
                      className="text-[10px] font-mono p-2 rounded overflow-x-auto"
                      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", maxHeight: 200 }}
                    >
{JSON.stringify(tier.controls, null, 2)}
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
