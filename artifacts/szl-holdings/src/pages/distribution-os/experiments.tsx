import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { FlaskConical, Plus, Play, Pause, Trophy, TrendingUp, Users, RefreshCw, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Variant {
  id: number;
  experimentId: number;
  key: string;
  name: string;
  description: string | null;
  weight: number;
  isControl: boolean;
  sampleSize: number;
  conversions: number;
  totalValue: number;
  conversionRate?: number;
  lift?: number;
  ciLower?: number;
  ciUpper?: number;
  pValue?: number;
  significant?: boolean;
}

interface Experiment {
  id: number;
  key: string;
  name: string;
  hypothesis: string | null;
  description: string | null;
  status: string;
  primaryMetricEvent: string;
  metricType: string;
  mutualExclusionGroup: string | null;
  trafficAllocation: number;
  startedAt: string | null;
  endedAt: string | null;
  winnerVariantId: number | null;
  variants: Variant[];
}

interface Results {
  experiment: Experiment;
  results: Variant[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "rgba(255,255,255,0.3)",
  running: "#5a9c5a",
  paused: "#d4a054",
  completed: "#4a7cc4",
  archived: "rgba(255,255,255,0.2)",
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Results>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", hypothesis: "", primaryMetricEvent: "", trafficAllocation: 100, variants: [{ name: "Control", key: "control", weight: 50, isControl: true }, { name: "Variant B", key: "variant_b", weight: 50, isControl: false }] });

  useEffect(() => { loadExperiments(); }, []);

  async function loadExperiments() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/analytics/experiments`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { experiments: Experiment[] };
      setExperiments(d.experiments || []);
    } catch {}
    setLoading(false);
  }

  async function loadResults(expId: number) {
    try {
      const r = await fetch(`${API}/api/analytics/experiments/${expId}/results`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { data: Results };
      setResults(prev => ({ ...prev, [expId]: d.data || d as unknown as Results }));
    } catch {}
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch(`${API}/api/analytics/experiments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadExperiments();
    } catch {}
  }

  async function declareWinner(expId: number, variantId: number) {
    try {
      await fetch(`${API}/api/analytics/experiments/${expId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", winnerVariantId: variantId }),
      });
      await loadExperiments();
    } catch {}
  }

  async function createExperiment() {
    if (!form.name || !form.key || !form.primaryMetricEvent) return;
    try {
      await fetch(`${API}/api/analytics/experiments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", key: "", hypothesis: "", primaryMetricEvent: "", trafficAllocation: 100, variants: [{ name: "Control", key: "control", weight: 50, isControl: true }, { name: "Variant B", key: "variant_b", weight: 50, isControl: false }] });
      await loadExperiments();
    } catch {}
  }

  function toggleExpand(id: number) {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!results[id]) loadResults(id);
    }
  }

  const inputStyle = { padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "#e8e4de", fontSize: "0.8125rem", width: "100%", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.375rem", display: "block" };

  return (
    <DistributionOsLayout>
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#e8e4de" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FlaskConical size={22} style={{ color: "#d4a054" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>A/B Experiments</h1>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>Deterministic bucketing · chi-squared significance · flag-based delivery</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={loadExperiments} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", cursor: "pointer" }}>
              <RefreshCw size={13} />
            </button>
            <button onClick={() => setShowCreate(!showCreate)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.3)", borderRadius: "0.375rem", color: "#d4a054", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Experiment
            </button>
          </div>
        </div>

        {showCreate && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,84,0.2)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>New Experiment</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Experiment Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Homepage CTA Test" />
              </div>
              <div>
                <label style={labelStyle}>Key (slug) *</label>
                <input style={inputStyle} value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} placeholder="e.g. homepage_cta_test" />
              </div>
              <div>
                <label style={labelStyle}>Primary Metric Event *</label>
                <input style={inputStyle} value={form.primaryMetricEvent} onChange={e => setForm(f => ({ ...f, primaryMetricEvent: e.target.value }))} placeholder="e.g. checkout_completed" />
              </div>
              <div>
                <label style={labelStyle}>Traffic Allocation (%)</label>
                <input style={inputStyle} type="number" min={1} max={100} value={form.trafficAllocation} onChange={e => setForm(f => ({ ...f, trafficAllocation: Number(e.target.value) }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Hypothesis</label>
                <input style={inputStyle} value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} placeholder="We believe that… will result in… for… because…" />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Variants</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.variants.map((v, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "0.5rem", alignItems: "center" }}>
                    <input style={{ ...inputStyle, width: "auto" }} value={v.name} onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], name: e.target.value }; setForm(f => ({ ...f, variants: vs })); }} placeholder="Variant name" />
                    <input style={{ ...inputStyle, width: "auto" }} value={v.key} onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], key: e.target.value }; setForm(f => ({ ...f, variants: vs })); }} placeholder="key" />
                    <input style={{ ...inputStyle, width: "70px" }} type="number" value={v.weight} onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], weight: Number(e.target.value) }; setForm(f => ({ ...f, variants: vs })); }} />
                    {!v.isControl && (
                      <button onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))} style={{ padding: "0.4rem 0.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { name: `Variant ${String.fromCharCode(67 + f.variants.length - 2)}`, key: `variant_${String.fromCharCode(99 + f.variants.length - 2)}`, weight: 50, isControl: false }] }))} style={{ padding: "0.375rem 0.75rem", background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "0.25rem", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: "0.75rem", width: "fit-content" }}>
                  + Add Variant
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: "0.8125rem" }}>Cancel</button>
              <button onClick={createExperiment} style={{ padding: "0.5rem 1.25rem", background: "rgba(212,160,84,0.15)", border: "1px solid rgba(212,160,84,0.4)", borderRadius: "0.375rem", color: "#d4a054", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 700 }}>Create Experiment</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>Loading experiments…</div>
        ) : experiments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.3)" }}>
            <FlaskConical size={32} style={{ marginBottom: "1rem", opacity: 0.3 }} />
            <p>No experiments yet. Create your first A/B test above.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {experiments.map(exp => {
              const expResults = results[exp.id];
              const isExpanded = expanded === exp.id;
              const totalSample = exp.variants.reduce((s, v) => s + v.sampleSize, 0);
              return (
                <div key={exp.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", overflow: "hidden" }}>
                  <div
                    onClick={() => toggleExpand(exp.id)}
                    style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto", alignItems: "center", gap: "1.25rem", padding: "1.125rem 1.5rem", cursor: "pointer" }}
                  >
                    <FlaskConical size={16} style={{ color: STATUS_COLORS[exp.status] || "#d4a054" }} />
                    <div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{exp.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.125rem" }}>
                        <code style={{ fontFamily: "monospace", marginRight: "0.5rem" }}>{exp.key}</code>
                        · {exp.primaryMetricEvent} · {exp.variants.length} variants · {totalSample.toLocaleString()} participants
                      </div>
                    </div>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, background: `${STATUS_COLORS[exp.status]}22`, border: `1px solid ${STATUS_COLORS[exp.status]}44`, color: STATUS_COLORS[exp.status], borderRadius: "0.25rem", padding: "0.2rem 0.5rem" }}>
                      {exp.status.toUpperCase()}
                    </span>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      {exp.status === "draft" && (
                        <button onClick={e => { e.stopPropagation(); updateStatus(exp.id, "running"); }} style={{ padding: "0.3rem 0.6rem", background: "rgba(90,156,90,0.1)", border: "1px solid rgba(90,156,90,0.3)", borderRadius: "0.25rem", color: "#5a9c5a", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700 }}>
                          <Play size={10} style={{ display: "inline" }} /> Start
                        </button>
                      )}
                      {exp.status === "running" && (
                        <button onClick={e => { e.stopPropagation(); updateStatus(exp.id, "paused"); }} style={{ padding: "0.3rem 0.6rem", background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.3)", borderRadius: "0.25rem", color: "#d4a054", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700 }}>
                          <Pause size={10} style={{ display: "inline" }} /> Pause
                        </button>
                      )}
                      {exp.status === "paused" && (
                        <button onClick={e => { e.stopPropagation(); updateStatus(exp.id, "running"); }} style={{ padding: "0.3rem 0.6rem", background: "rgba(90,156,90,0.1)", border: "1px solid rgba(90,156,90,0.3)", borderRadius: "0.25rem", color: "#5a9c5a", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700 }}>
                          Resume
                        </button>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "1.25rem 1.5rem" }}>
                      {exp.hypothesis && (
                        <div style={{ marginBottom: "1.25rem", padding: "0.875rem", background: "rgba(212,160,84,0.05)", border: "1px solid rgba(212,160,84,0.12)", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                          Hypothesis: {exp.hypothesis}
                        </div>
                      )}

                      {expResults ? (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: `repeat(${expResults.results.length}, 1fr)`, gap: "1rem", marginBottom: "1.25rem" }}>
                            {expResults.results.map(variant => (
                              <div key={variant.id} style={{ padding: "1rem", background: variant.isControl ? "rgba(255,255,255,0.04)" : "rgba(212,160,84,0.05)", border: `1px solid ${variant.significant ? "rgba(90,156,90,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#e8e4de" }}>{variant.name}</span>
                                  <div style={{ display: "flex", gap: "0.375rem" }}>
                                    {variant.isControl && <span style={{ fontSize: "0.625rem", background: "rgba(255,255,255,0.08)", borderRadius: "0.25rem", padding: "0.1rem 0.4rem", color: "rgba(255,255,255,0.4)" }}>Control</span>}
                                    {variant.significant && <span style={{ fontSize: "0.625rem", background: "rgba(90,156,90,0.15)", border: "1px solid rgba(90,156,90,0.3)", borderRadius: "0.25rem", padding: "0.1rem 0.4rem", color: "#5a9c5a", fontWeight: 700 }}>Significant</span>}
                                  </div>
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e8e4de" }}>{variant.conversionRate?.toFixed(1)}%</div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0" }}>Conversion Rate</div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                                  <Users size={10} style={{ display: "inline", marginRight: "0.25rem" }} />{variant.sampleSize.toLocaleString()} participants
                                </div>
                                {!variant.isControl && variant.lift !== undefined && (
                                  <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: variant.lift >= 0 ? "#5a9c5a" : "#c45a4a" }}>
                                    <TrendingUp size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
                                    {variant.lift >= 0 ? "+" : ""}{variant.lift?.toFixed(1)}% lift
                                  </div>
                                )}
                                {variant.pValue !== undefined && (
                                  <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", marginTop: "0.375rem" }}>p={variant.pValue?.toFixed(3)} · CI [{variant.ciLower?.toFixed(1)}%, {variant.ciUpper?.toFixed(1)}%]</div>
                                )}
                                {exp.status === "running" && !exp.winnerVariantId && variant.significant && !variant.isControl && (
                                  <button onClick={() => declareWinner(exp.id, variant.id)} style={{ marginTop: "0.75rem", width: "100%", padding: "0.4rem", background: "rgba(90,156,90,0.1)", border: "1px solid rgba(90,156,90,0.3)", borderRadius: "0.25rem", color: "#5a9c5a", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700 }}>
                                    <Trophy size={10} style={{ display: "inline", marginRight: "0.25rem" }} /> Declare Winner
                                  </button>
                                )}
                                {exp.winnerVariantId === variant.id && (
                                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#5a9c5a", fontWeight: 700 }}>
                                    <CheckCircle size={12} /> Winner
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)" }}>
                          <button onClick={() => loadResults(exp.id)} style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.8125rem" }}>
                            Load Results
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DistributionOsLayout>
  );
}
