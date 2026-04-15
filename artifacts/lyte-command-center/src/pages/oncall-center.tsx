import { useState } from "react";
import { Bell, Phone, Calendar, Plus } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface OnCallEngineer {
  name: string;
  initials: string;
  email: string;
  color: string;
}

interface Rotation {
  id: string;
  team: string;
  primary: OnCallEngineer;
  secondary: OnCallEngineer;
  escalation: string;
  shiftEnd: number;
  pagerdutyId: string;
  color: string;
  pagesThisWeek: number;
  mtta: string;
  mttr: string;
}

interface EscalationPolicy {
  id: string;
  name: string;
  team: string;
  steps: { delay: number; action: string; label: string }[];
  sla: string;
}

interface PageRecord {
  id: string;
  incident: string;
  team: string;
  paged: string;
  ackTime: string;
  resolveTime: string;
  time: string;
  severity: "critical" | "high" | "medium";
}

interface Override {
  id: string;
  team: string;
  originalEngineer: string;
  coveringEngineer: string;
  start: string;
  end: string;
  reason: string;
}

const ROTATIONS: Rotation[] = [
  { id: "r1", team: "Platform SRE", primary: { name: "Sarah Park", initials: "SP", email: "s.park@szl.com", color: "#60a5fa" }, secondary: { name: "James Chen", initials: "JC", email: "j.chen@szl.com", color: "#34d399" }, escalation: "Kim Wilson (Director)", shiftEnd: Date.now() + 86400000 * 2.5, pagerdutyId: "PD-SRE-001", color: "#60a5fa", pagesThisWeek: 8, mtta: "1m 52s", mttr: "14m 07s" },
  { id: "r2", team: "Backend Engineering", primary: { name: "Miguel Rodriguez", initials: "MR", email: "m.rodriguez@szl.com", color: "#a78bfa" }, secondary: { name: "Alice Thompson", initials: "AT", email: "a.thompson@szl.com", color: GOLD }, escalation: "T. Lee (VP Eng)", shiftEnd: Date.now() + 86400000 * 4.1, pagerdutyId: "PD-BE-002", color: "#a78bfa", pagesThisWeek: 5, mtta: "2m 14s", mttr: "18m 34s" },
  { id: "r3", team: "Infrastructure", primary: { name: "Brian Kim", initials: "BK", email: "b.kim@szl.com", color: "#f97316" }, secondary: { name: "Leila Patel", initials: "LP", email: "l.patel@szl.com", color: "#38bdf8" }, escalation: "Kim Wilson (Director)", shiftEnd: Date.now() + 86400000 * 1.8, pagerdutyId: "PD-INFRA-003", color: "#f97316", pagesThisWeek: 12, mtta: "3m 45s", mttr: "22m 18s" },
  { id: "r4", team: "Security", primary: { name: "Rosa Santos", initials: "RS", email: "r.santos@szl.com", color: "#ef4444" }, secondary: { name: "Frank Nguyen", initials: "FN", email: "f.nguyen@szl.com", color: "#10b981" }, escalation: "C. Martinez (CISO)", shiftEnd: Date.now() + 86400000 * 3.2, pagerdutyId: "PD-SEC-004", color: "#ef4444", pagesThisWeek: 3, mtta: "0m 58s", mttr: "31m 02s" },
];

const ESCALATION_POLICIES: EscalationPolicy[] = [
  { id: "ep1", name: "Standard 5-Minute Escalation", team: "All teams", steps: [{ delay: 0, action: "page_primary", label: "Page Primary On-Call" }, { delay: 5, action: "page_secondary", label: "Page Secondary On-Call" }, { delay: 10, action: "page_manager", label: "Page Engineering Manager" }, { delay: 15, action: "page_director", label: "Page VP / Director" }], sla: "15 min max to director" },
  { id: "ep2", name: "P0 Critical — Simultaneous Escalation", team: "Platform SRE, Infrastructure", steps: [{ delay: 0, action: "page_all", label: "Page Primary + Secondary simultaneously" }, { delay: 2, action: "notify_manager", label: "Notify Engineering Manager" }, { delay: 5, action: "create_bridge", label: "Auto-create incident bridge call" }, { delay: 5, action: "notify_exec", label: "Notify VP if revenue-impacting" }], sla: "5 min escalation to exec" },
  { id: "ep3", name: "Security Incident — Rapid Response", team: "Security", steps: [{ delay: 0, action: "page_primary", label: "Page Security On-Call" }, { delay: 2, action: "page_ciso", label: "Notify CISO" }, { delay: 5, action: "create_bridge", label: "Create secure incident channel" }], sla: "CISO notified within 5 min" },
];

const PAGES: PageRecord[] = [
  { id: "PAGE-001", incident: "payment-service: Latency spike P99 >5s", team: "Platform SRE", paged: "Sarah Park", ackTime: "2m 14s", resolveTime: "14m 07s", time: "2h ago", severity: "critical" },
  { id: "PAGE-002", incident: "auth-service: Error rate >5%", team: "Backend Engineering", paged: "Miguel Rodriguez", ackTime: "1m 02s", resolveTime: "8m 34s", time: "5h ago", severity: "high" },
  { id: "PAGE-003", incident: "DB: Replication lag critical (8.4s)", team: "Infrastructure", paged: "Brian Kim", ackTime: "3m 45s", resolveTime: "22m 18s", time: "8h ago", severity: "critical" },
  { id: "PAGE-004", incident: "Security: Anomalous access from 195.218.x", team: "Security", paged: "Rosa Santos", ackTime: "0m 58s", resolveTime: "31m 02s", time: "12h ago", severity: "high" },
  { id: "PAGE-005", incident: "ml-inference: Queue depth exceeded 50k", team: "Infrastructure", paged: "Brian Kim", ackTime: "4m 12s", resolveTime: "18m 44s", time: "Yesterday", severity: "medium" },
  { id: "PAGE-006", incident: "api-gateway: Anomaly — 5xx rate 8.2%", team: "Platform SRE", paged: "James Chen", ackTime: "1m 48s", resolveTime: "11m 22s", time: "Yesterday", severity: "high" },
];

const OVERRIDES: Override[] = [
  { id: "ov1", team: "Infrastructure", originalEngineer: "Brian Kim", coveringEngineer: "Leila Patel", start: "Apr 17 09:00", end: "Apr 19 09:00", reason: "Conference attendance" },
  { id: "ov2", team: "Platform SRE", originalEngineer: "Sarah Park", coveringEngineer: "James Chen", start: "Apr 22 00:00", end: "Apr 23 00:00", reason: "Doctor appointment" },
];

const ANALYTICS = [
  { team: "Platform SRE", pagesWeek: 8, pagesMonth: 32, mtta: "1m 52s", mttr: "14m 07s", fatigueScore: 42 },
  { team: "Backend Engineering", pagesWeek: 5, pagesMonth: 18, mtta: "2m 14s", mttr: "18m 34s", fatigueScore: 28 },
  { team: "Infrastructure", pagesWeek: 12, pagesMonth: 48, mtta: "3m 45s", mttr: "22m 18s", fatigueScore: 71 },
  { team: "Security", pagesWeek: 3, pagesMonth: 11, mtta: "0m 58s", mttr: "31m 02s", fatigueScore: 18 },
];

const SEV_COLOR = { critical: "#ef4444", high: "#f97316", medium: GOLD };

function shiftTimeLeft(ts: number) {
  const s = Math.floor((ts - Date.now()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function FatigueBar({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 30 ? GOLD : "#10b981";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono w-6 text-right shrink-0" style={{ color }}>{score}</span>
    </div>
  );
}

export default function OnCallCenter() {
  const [tab, setTab] = useState<"rotations" | "policies" | "overrides" | "analytics">("rotations");

  const totalPages = PAGES.length;
  const avgMtta = "2m 04s";
  const avgMttr = "18m 40s";

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-5" style={{ background: "#080c14" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>On-Call Management</h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Rotation scheduling, escalation policies, override management, and on-call analytics. PagerDuty-native.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium shrink-0"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}>
          <Plus className="w-3.5 h-3.5" /> Schedule Override
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Rotations", value: ROTATIONS.length, color: GOLD },
          { label: "Pages This Week", value: totalPages, color: "#f97316" },
          { label: "Avg MTTA", value: avgMtta, color: "#10b981" },
          { label: "Avg MTTR", value: avgMttr, color: "#3b82f6" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-3" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>{k.label}</div>
            <div className="text-[18px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: DS.border }}>
        {(["rotations", "policies", "overrides", "analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-[10px] px-4 py-2 capitalize font-medium transition-all"
            style={{ color: tab === t ? GOLD : DS.text.muted, borderBottom: `2px solid ${tab === t ? GOLD : "transparent"}` }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "rotations" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROTATIONS.map(r => (
              <div key={r.id} className="rounded-xl border p-4" style={{ borderColor: `${r.color}20`, background: `${r.color}04` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[11px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{r.team}</div>
                    <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{r.pagerdutyId} · Shift ends in {shiftTimeLeft(r.shiftEnd)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                    <span className="text-[8px]" style={{ color: "#10b981" }}>ACTIVE</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: `${r.primary.color}20`, color: r.primary.color, border: `1px solid ${r.primary.color}30` }}>{r.primary.initials}</div>
                      <div>
                        <div className="text-[10px] font-medium" style={{ color: DS.text.primary }}>{r.primary.name}</div>
                        <div className="text-[8px]" style={{ color: DS.text.muted }}>Primary</div>
                      </div>
                    </div>
                    <Phone className="w-3 h-3" style={{ color: r.primary.color }} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: `${r.secondary.color}20`, color: r.secondary.color, border: `1px solid ${r.secondary.color}30` }}>{r.secondary.initials}</div>
                      <div>
                        <div className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>{r.secondary.name}</div>
                        <div className="text-[8px]" style={{ color: DS.text.muted }}>Secondary</div>
                      </div>
                    </div>
                    <Bell className="w-3 h-3" style={{ color: DS.text.muted }} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>Escalation → {r.escalation}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 grid grid-cols-3 gap-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                  {[
                    { k: "Pages/wk", v: r.pagesThisWeek, c: r.pagesThisWeek > 10 ? "#f97316" : DS.text.secondary },
                    { k: "MTTA", v: r.mtta, c: "#10b981" },
                    { k: "MTTR", v: r.mttr, c: "#3b82f6" },
                  ].map(m => (
                    <div key={m.k} className="text-center">
                      <div className="text-[9px] font-mono font-bold" style={{ color: m.c }}>{m.v}</div>
                      <div className="text-[8px]" style={{ color: DS.text.muted }}>{m.k}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: DS.border }}>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>Recent Pages</span>
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>Last 48 hours</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["ID", "Incident", "Team", "Paged", "Ack Time", "Resolve Time", "When"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: DS.text.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAGES.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                      <td className="px-3 py-2 font-mono text-[9px]" style={{ color: DS.text.muted }}>{p.id}</td>
                      <td className="px-3 py-2" style={{ color: DS.text.primary }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 align-middle" style={{ background: SEV_COLOR[p.severity] }} />
                        {p.incident}
                      </td>
                      <td className="px-3 py-2" style={{ color: DS.text.secondary }}>{p.team}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: DS.text.primary }}>{p.paged}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: "#10b981" }}>{p.ackTime}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: "#3b82f6" }}>{p.resolveTime}</td>
                      <td className="px-3 py-2" style={{ color: DS.text.muted }}>{p.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "policies" && (
        <div className="space-y-4">
          {ESCALATION_POLICIES.map(policy => (
            <div key={policy.id} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[12px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{policy.name}</div>
                  <div className="text-[9px]" style={{ color: DS.text.muted }}>Teams: {policy.team} · SLA: <span style={{ color: GOLD }}>{policy.sla}</span></div>
                </div>
              </div>
              <div className="space-y-2">
                {policy.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 text-right shrink-0">
                      <span className="text-[9px] font-mono" style={{ color: step.delay === 0 ? "#10b981" : DS.text.muted }}>
                        {step.delay === 0 ? "NOW" : `+${step.delay}m`}
                      </span>
                    </div>
                    <div className="w-px h-5 shrink-0" style={{ background: DS.border }} />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}25` }}>{i + 1}</div>
                      <span className="text-[10px]" style={{ color: DS.text.secondary }}>{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "overrides" && (
        <div className="space-y-3">
          <div className="text-[10px]" style={{ color: DS.text.muted }}>Scheduled overrides — when engineers swap on-call coverage.</div>
          {OVERRIDES.length === 0 ? (
            <div className="text-center py-8" style={{ color: DS.text.muted }}>No overrides scheduled</div>
          ) : OVERRIDES.map(ov => (
            <div key={ov.id} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold mb-1" style={{ color: DS.text.primary }}>{ov.team}</div>
                  <div className="text-[10px] mb-2" style={{ color: DS.text.secondary }}>
                    <span style={{ color: DS.text.muted }}>Coverage: </span>{ov.originalEngineer} → <span style={{ color: "#10b981" }}>{ov.coveringEngineer}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px]" style={{ color: DS.text.muted }}>
                    <span><Calendar className="w-2.5 h-2.5 inline mr-1" />{ov.start} → {ov.end}</span>
                    <span>Reason: {ov.reason}</span>
                  </div>
                </div>
                <span className="text-[8px] px-2 py-1 rounded font-mono" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>APPROVED</span>
              </div>
            </div>
          ))}
          <button className="w-full py-3 rounded-xl border-dashed text-[10px] flex items-center justify-center gap-2 transition-all hover:bg-white/[0.02]"
            style={{ borderColor: DS.border, color: DS.text.muted }}>
            <Plus className="w-3 h-3" /> Add Override
          </button>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="p-3 border-b" style={{ borderColor: DS.border }}>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>On-Call Analytics by Team (Last 30 Days)</span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["Team", "Pages/Wk", "Pages/Mo", "Avg MTTA", "Avg MTTR", "Fatigue Score"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: DS.text.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ANALYTICS.map(a => (
                  <tr key={a.team} style={{ borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                    <td className="px-4 py-3 font-medium" style={{ color: DS.text.primary }}>{a.team}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: a.pagesWeek > 10 ? "#f97316" : DS.text.secondary }}>{a.pagesWeek}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: DS.text.secondary }}>{a.pagesMonth}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#10b981" }}>{a.mtta}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#3b82f6" }}>{a.mttr}</td>
                    <td className="px-4 py-3" style={{ minWidth: 120 }}>
                      <FatigueBar score={a.fatigueScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: DS.text.muted }}>Page Volume (Last 7 Days)</div>
              <div className="flex items-end gap-2 h-20">
                {[8, 4, 12, 3, 7, 6, 9].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${(v / 14) * 64}px`, background: v > 10 ? "rgba(239,68,68,0.4)" : `${GOLD}40`, border: `1px solid ${v > 10 ? "#ef4444" : GOLD}30` }} />
                    <span className="text-[7px]" style={{ color: DS.text.muted }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: DS.text.muted }}>MTTA Trend (Last 7 Days)</div>
              <div className="space-y-2">
                {ROTATIONS.map(r => {
                  const [min, sec] = r.mtta.split("m ");
                  const totalSec = parseInt(min) * 60 + parseInt(sec || "0");
                  const maxSec = 5 * 60;
                  const barWidth = Math.max(10, Math.min(90, 100 - (totalSec / maxSec) * 80));
                  return (
                    <div key={r.id}>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span style={{ color: DS.text.secondary }}>{r.team}</span>
                        <span className="font-mono" style={{ color: "#10b981" }}>{r.mtta}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: "#10b981" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
