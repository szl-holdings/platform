import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Target, Plus, Edit2, Trash2, Check, X, TrendingUp, Clock,
  ChevronDown, ChevronUp, AlertCircle, ToggleLeft, ToggleRight,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Goal {
  id: number;
  name: string;
  description: string | null;
  triggerEvent: string;
  urlMatch: string | null;
  propertyConditions: Record<string, unknown>;
  active: boolean;
  value: number | null;
  currency: string | null;
  createdAt: string;
}

interface GoalPerformance {
  goal: Goal;
  totalConversions: number;
  completionRate: string;
  avgTimeToConversionSeconds: number;
  byDay: Record<string, number>;
}

const TRIGGER_EVENTS = [
  "demo_requested", "demo_request", "contact_submitted", "form_submit",
  "checkout_completed", "page_view", "cta_click", "scroll_depth",
];

function GoalForm({ initial, onSave, onCancel }: {
  initial?: Partial<Goal>;
  onSave: (data: Partial<Goal>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerEvent, setTriggerEvent] = useState(initial?.triggerEvent ?? "demo_requested");
  const [urlMatch, setUrlMatch] = useState(initial?.urlMatch ?? "");
  const [value, setValue] = useState(initial?.value?.toString() ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");

  const inp = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setter(e.target.value);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "10px", marginBottom: "1.5rem" }}
    >
      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1.25rem" }}>
        {initial?.id ? "Edit Goal" : "New Conversion Goal"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.6875rem", color: "#6b6560", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Goal Name *</label>
          <input
            value={name}
            onChange={inp(setName)}
            placeholder="e.g. Demo Request"
            style={{ width: "100%", padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.6875rem", color: "#6b6560", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trigger Event *</label>
          <select
            value={triggerEvent}
            onChange={inp(setTriggerEvent)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", background: "hsla(0,0%,0%,0.6)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }}
          >
            {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.6875rem", color: "#6b6560", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>URL Match (optional)</label>
          <input
            value={urlMatch}
            onChange={inp(setUrlMatch)}
            placeholder="/contact, /demo/*"
            style={{ width: "100%", padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.6875rem", color: "#6b6560", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Value (optional)</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={value}
              onChange={inp(setValue)}
              type="number"
              placeholder="0.00"
              style={{ flex: 1, padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem" }}
            />
            <select
              value={currency}
              onChange={inp(setCurrency)}
              style={{ padding: "0.5rem", background: "hsla(0,0%,0%,0.6)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#8b8579", fontSize: "0.75rem" }}
            >
              <option>USD</option><option>EUR</option><option>GBP</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.6875rem", color: "#6b6560", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description (optional)</label>
        <textarea
          value={description}
          onChange={inp(setDescription)}
          rows={2}
          placeholder="Describe what this conversion goal tracks…"
          style={{ width: "100%", padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#8b8579", fontSize: "0.8125rem", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => onSave({ name, description: description || null, triggerEvent, urlMatch: urlMatch || null, value: value ? parseFloat(value) : null, currency })}
          disabled={!name || !triggerEvent}
          style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.8125rem", cursor: "pointer", background: "#4a90b8", border: "none", color: "#fff", fontWeight: 600, opacity: !name || !triggerEvent ? 0.5 : 1 }}
        >
          <Check size={13} style={{ display: "inline", marginRight: "0.375rem" }} />
          Save Goal
        </button>
        <button onClick={onCancel} style={{ padding: "0.5rem 0.875rem", borderRadius: "6px", fontSize: "0.8125rem", cursor: "pointer", background: "transparent", border: "1px solid hsla(0,0%,100%,0.08)", color: "#6b6560" }}>
          Cancel
        </button>
      </div>
    </m.div>
  );
}

function GoalCard({ goal, onToggle, onDelete, onEdit }: { goal: Goal; onToggle: () => void; onDelete: () => void; onEdit: () => void; }) {
  const [perf, setPerf] = useState<GoalPerformance | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadPerf = useCallback(async () => {
    if (!expanded) return;
    try {
      const res = await fetch(`${API}/api/analytics-lake/goals/${goal.id}/performance?days=30`);
      if (res.ok) setPerf(await res.json() as GoalPerformance);
    } catch {}
  }, [goal.id, expanded]);

  useEffect(() => { loadPerf(); }, [loadPerf]);

  return (
    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", opacity: goal.active ? 1 : 0.6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
            <Target size={14} style={{ color: goal.active ? "#5a9c5a" : "#4a4540" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{goal.name}</span>
            {!goal.active && <span style={{ fontSize: "0.625rem", color: "#4a4540", padding: "0.125rem 0.375rem", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "3px" }}>inactive</span>}
          </div>
          {goal.description && <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "0.5rem" }}>{goal.description}</p>}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>trigger: <span style={{ color: "#8b8579" }}>{goal.triggerEvent}</span></span>
            {goal.urlMatch && <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>url: <span style={{ color: "#8b8579" }}>{goal.urlMatch}</span></span>}
            {goal.value && <span style={{ fontSize: "0.6875rem", color: "#5a9c5a" }}>${goal.value} {goal.currency}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <button onClick={() => { setExpanded(e => !e); }} style={{ padding: "0.375rem", background: "transparent", border: "none", color: "#4a4540", cursor: "pointer" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onEdit} style={{ padding: "0.375rem", background: "transparent", border: "none", color: "#4a4540", cursor: "pointer" }}>
            <Edit2 size={13} />
          </button>
          <button onClick={onToggle} style={{ padding: "0.375rem", background: "transparent", border: "none", color: goal.active ? "#5a9c5a" : "#4a4540", cursor: "pointer" }}>
            {goal.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <button onClick={onDelete} style={{ padding: "0.375rem", background: "transparent", border: "none", color: "#c45a4a", cursor: "pointer" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ paddingTop: "1rem", borderTop: "1px solid hsla(0,0%,100%,0.05)", marginTop: "1rem" }}>
              {!perf ? (
                <div style={{ fontSize: "0.75rem", color: "#4a4540" }}>Loading performance…</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                  <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.25rem" }}>Conversions (30d)</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e8e4de" }}>{perf.totalConversions}</div>
                  </div>
                  <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.25rem" }}>Completion Rate</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#5a9c5a" }}>{perf.completionRate}%</div>
                  </div>
                  <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Clock size={9} /> Avg Time to Convert</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d4a054" }}>
                      {perf.avgTimeToConversionSeconds < 60 ? `${perf.avgTimeToConversionSeconds}s` : `${Math.floor(perf.avgTimeToConversionSeconds / 60)}m`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConversionGoalsPage() {
  const [location] = useLocation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/analytics-lake/goals`);
      if (res.ok) {
        const data = await res.json() as { goals: Goal[] };
        setGoals(data.goals);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createGoal = useCallback(async (data: Partial<Goal>) => {
    try {
      const res = await fetch(`${API}/api/analytics-lake/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) { await load(); setShowForm(false); }
    } catch {}
  }, [load]);

  const updateGoal = useCallback(async (id: number, data: Partial<Goal>) => {
    try {
      const res = await fetch(`${API}/api/analytics-lake/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) { await load(); setEditGoal(null); }
    } catch {}
  }, [load]);

  const toggleGoal = useCallback(async (goal: Goal) => {
    await updateGoal(goal.id, { active: !goal.active });
  }, [updateGoal]);

  const deleteGoal = useCallback(async (id: number) => {
    if (!window.confirm("Delete this conversion goal?")) return;
    try {
      await fetch(`${API}/api/analytics-lake/goals/${id}`, { method: "DELETE" });
      await load();
    } catch {}
  }, [load]);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Conversion Goals</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
              Define and track meaningful visitor actions · {goals.filter(g => g.active).length} active goal{goals.filter(g => g.active).length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditGoal(null); }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "#4a90b8", border: "none", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} /> Add Goal
          </button>
        </div>

        {(showForm || editGoal) && (
          <GoalForm
            initial={editGoal ?? undefined}
            onSave={data => editGoal ? updateGoal(editGoal.id, data) : createGoal(data)}
            onCancel={() => { setShowForm(false); setEditGoal(null); }}
          />
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540", fontSize: "0.875rem" }}>Loading goals…</div>
        ) : goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#4a4540" }}>
            <Target size={32} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <div style={{ fontSize: "0.875rem" }}>No conversion goals defined yet</div>
            <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Goals automatically track when visitors fire matching events
            </div>
            <button onClick={() => setShowForm(true)} style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", color: "#8b8579", fontSize: "0.8125rem", cursor: "pointer" }}>
              Create your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggle={() => toggleGoal(goal)}
                onDelete={() => deleteGoal(goal.id)}
                onEdit={() => { setEditGoal(goal); setShowForm(false); }}
              />
            ))}
          </div>
        )}

        {goals.length > 0 && (
          <div style={{ marginTop: "2rem", padding: "1rem", background: "hsla(0,0%,100%,0.01)", border: "1px solid hsla(0,0%,100%,0.04)", borderRadius: "8px" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <AlertCircle size={13} style={{ color: "#4a4540", flexShrink: 0, marginTop: "0.125rem" }} />
              <p style={{ fontSize: "0.75rem", color: "#4a4540", margin: 0 }}>
                Goals are evaluated server-side when events arrive at the ingestion pipeline. Ad pixels (Google Ads, Meta) automatically fire on{" "}
                <code style={{ color: "#8b8579" }}>demo_requested</code>, <code style={{ color: "#8b8579" }}>contact_submitted</code>, and <code style={{ color: "#8b8579" }}>checkout_completed</code> events regardless of goal configuration.
                Respect for Do Not Track and cookie consent is enforced at the pixel layer.
              </p>
            </div>
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
