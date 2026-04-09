import { useState } from "react";
import { ArrowRight, X, AlertTriangle, Clock, TrendingUp, DollarSign, Building2, ShieldOff, Shield, FileText, MapPin, MessageSquare, Scale } from "lucide-react";
import { NY_DEMO_MATTERS, type NyMatter } from "../data/ny-demo-matters";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const SIDEBAR_BG = "#0a0f18";

const NY_NAV = [
  { label: "Overview", icon: Scale, active: true },
  { label: "Dashboard", icon: AlertTriangle },
  { label: "Watchlist", icon: AlertTriangle },
  { label: "Deadlines", icon: Clock },
  { label: "No-Fault", icon: FileText },
  { label: "Coverage", icon: ShieldOff },
  { label: "Mediation", icon: TrendingUp },
  { label: "Forecast", icon: TrendingUp },
  { label: "Insurer Intel", icon: Building2 },
  { label: "Venue Intel", icon: MapPin },
  { label: "Copilot", icon: MessageSquare },
  { label: "Trust", icon: Shield },
];

const totalClocks = NY_DEMO_MATTERS.flatMap((m: NyMatter) => m.clocks).length;

const DEMO_STATS = [
  { label: "Active Matters", value: NY_DEMO_MATTERS.length.toString(), sub: "NYC portfolio" },
  { label: "Statute Clocks", value: totalClocks.toString(), sub: "Across all matters" },
  { label: "Avg Settlement Mid", value: "$248K", sub: "Practice median" },
  { label: "Portfolio Health", value: "82%", sub: "Avg health score" },
];

const SAMPLE_MATTERS = NY_DEMO_MATTERS.slice(0, 5);

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", label: "Active" },
    discovery: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", label: "Discovery" },
    mediation: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", label: "Mediation" },
    critical: { bg: "rgba(239,68,68,0.12)", text: "#f87171", label: "Critical" },
    settled: { bg: "rgba(148,163,184,0.08)", text: "#94a3b8", label: "Settled" },
    pre_suit: { bg: "rgba(251,191,36,0.10)", text: "#fbbf24", label: "Pre-Suit" },
    litigation: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", label: "Litigation" },
  };
  const s = map[status] ?? map.active;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function PrismDemoPage() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Demo Banner */}
      {!dismissed && (
        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-medium shrink-0" style={{ background: "rgba(200,169,110,0.10)", borderBottom: "1px solid rgba(200,169,110,0.20)", color: ACCENT }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            <span>You are viewing the PRISM Counsel demo — New York Plaintiff Command. All data is illustrative.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/prism-counsel/marketing" className="text-[11px] underline hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
              Learn more →
            </a>
            <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden" style={{ height: dismissed ? "100vh" : "calc(100vh - 42px)" }}>
        {/* Sidebar */}
        <aside className="w-[200px] flex-shrink-0 flex flex-col border-r" style={{ background: SIDEBAR_BG, borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded" style={{ background: `rgba(200,169,110,0.10)` }}>
                <Scale className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">PRISM Counsel</div>
                <div className="text-[9px]" style={{ color: "rgba(200,169,110,0.6)" }}>NY Command · Demo</div>
              </div>
            </div>
            <a href="/szl-holdings/" className="text-[9px] font-medium tracking-wide hover:opacity-80 transition-opacity block mt-1.5" style={{ color: "rgba(200,169,110,0.5)" }}>SZL HOLDINGS ↗</a>
          </div>

          <div className="px-2 py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest px-1 mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>New York Practice</div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {NY_NAV.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded mx-1 text-[11px] transition-colors text-left"
                style={{
                  background: item.active ? `rgba(200,169,110,0.08)` : "transparent",
                  color: item.active ? ACCENT : "rgba(255,255,255,0.35)",
                  width: "calc(100% - 8px)",
                }}
              >
                <item.icon className="w-3 h-3 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <a
              href="/prism-counsel/marketing"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: ACCENT, color: "#080c14" }}
            >
              Request Full Access <ArrowRight size={11} />
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(200,169,110,0.5)" }}>New York Plaintiff Practice · Demo</div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">NY Command Overview</h1>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Preloaded with illustrative NYC personal injury and commercial litigation matters.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {DEMO_STATS.map((s) => (
              <div key={s.label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-[1.5rem] font-extrabold font-mono mb-0.5" style={{ color: ACCENT }}>{s.value}</div>
                <div className="text-[11px] font-semibold text-white">{s.label}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Matter list */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="text-[12px] font-bold text-white">Active Matters — NYC Portfolio</h2>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Demo data</span>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {["Matter", "Status", "Stat. Clock (days)", "Settlement Mid", "Insurer"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_MATTERS.map((m: NyMatter, i: number) => {
                  const clock = m.clocks[0];
                  const daysLeft = clock ? Math.ceil((new Date(clock.deadline).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <tr key={m.id} className="transition-colors" style={{ borderBottom: i < SAMPLE_MATTERS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white truncate max-w-[220px]">{m.title}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)" }}>{m.caseNumber}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {daysLeft !== null ? (
                          <span className="font-mono" style={{ color: daysLeft < 30 ? "#f87171" : "rgba(255,255,255,0.5)" }}>
                            {daysLeft}d
                          </span>
                        ) : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {formatCurrency(m.settlementMid)}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {m.insurerProfile.carrierName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Demo CTA */}
          <div className="p-6 rounded-xl" style={{ background: "rgba(200,169,110,0.04)", border: "1px solid rgba(200,169,110,0.10)" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-white mb-1">Ready to run your practice on PRISM?</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Every demo is configured to your practice type and docket. We walk through live matter intelligence — not a generic product tour.</p>
              </div>
              <a
                href="/prism-counsel/marketing"
                className="inline-flex items-center gap-2 text-[13px] font-semibold px-6 py-3 rounded-lg transition-all shrink-0"
                style={{ background: ACCENT, color: "#080c14" }}
              >
                Request a Private Demo <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
