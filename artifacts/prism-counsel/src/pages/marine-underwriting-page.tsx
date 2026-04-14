import { useState, useEffect, useCallback } from "react";
import {
  Anchor, Shield, AlertTriangle, CheckCircle, FileText,
  Plus, RefreshCw, ChevronDown, ChevronUp, X, DollarSign,
  Ship, Waves, BarChart3, Clock,
} from "lucide-react";

const GOLD = "#c8a96e";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const BG = { page: "#080c14", surface: "#0c1018", card: "#101620", elevated: "#141e2c" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)", gold: `${GOLD}25` } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.28)" } as const;

function fmt(n: number | null | undefined, dec = 2): string {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `$${fmt(n / 1000, 0)}K`;
  return `$${fmt(n, 0)}`;
}

interface Quote {
  id: number; quoteRef: string; vesselName: string; vesselType?: string;
  coverageType: string; coverageLimitUsd: number; premiumUsd: number;
  riskRating: string; riskScore: number; status: string;
  voyageOrigin?: string; voyageDestination?: string; createdAt: string;
  riskFactors?: Record<string, any>; premiumBreakdown?: Record<string, any>;
  routeChokepoints?: string[]; cargoHazardClass?: string; vesselAge?: number;
  vesselFlag?: string; finalRatePercent?: number; deductibleUsd?: number;
  coveragePeriodDays?: number;
}

interface Policy {
  id: number; policyNumber: string; vesselName: string; coverageType: string;
  coverageLimitUsd: number; premiumUsd: number; status: string;
  effectiveAt: string; expiresAt: string; carrier?: string;
  claimsCount: number; totalClaimsUsd: number; boundAt: string;
}

interface Claim {
  id: number; claimRef: string; policyId: number; vesselName: string;
  incidentType: string; incidentDescription?: string; incidentAt: string;
  claimedAmountUsd: number; status: string; reserveAmountUsd: number;
  filedAt: string; adjustorNotes?: string;
}

interface PortfolioSummary {
  activePolicies: number; totalPolicies: number; pendingQuotes: number;
  totalGrossWrittenPremium: number; totalExposure: number; openClaims: number;
  totalClaims: number; totalReserves: number; totalPaidClaims: number;
  lossRatioPercent: number; combinedRatio: number;
}

const RISK_COLOR: Record<string, string> = {
  low: GREEN, moderate: AMBER, high: "#f97316", very_high: RED, uninsurable: "#dc2626",
};

const STATUS_COLOR: Record<string, string> = {
  quote: AMBER, bound: GOLD, active: GREEN, expired: TEXT.muted, cancelled: RED,
  claim_in_progress: "#f97316",
};

const CLAIM_STATUS_COLOR: Record<string, string> = {
  filed: AMBER, under_review: "#f97316", investigation: "#f97316",
  negotiation: GOLD, settled: GREEN, rejected: RED, closed: TEXT.muted,
};

const COVERAGE_TYPES = [
  { value: "marine_cargo", label: "Marine Cargo" },
  { value: "hull_machinery", label: "Hull & Machinery" },
  { value: "protection_indemnity", label: "Protection & Indemnity" },
  { value: "freight_demurrage", label: "Freight & Demurrage" },
  { value: "war_risk", label: "War Risk" },
  { value: "pollution_liability", label: "Pollution Liability" },
];

const CHOKEPOINTS = [
  "Strait of Hormuz", "Strait of Malacca", "Bab-el-Mandeb",
  "Suez Canal", "Panama Canal", "Danish Straits",
  "Cape of Good Hope", "South China Sea", "Gulf of Guinea", "Arctic Route",
];

const HAZARD_CLASSES = [
  "Non-hazardous", "Class 1 - Explosives", "Class 2 - Gases",
  "Class 3 - Flammable Liquids", "Class 4 - Flammable Solids",
  "Class 5 - Oxidizers", "Class 6 - Toxic", "Class 7 - Radioactive",
  "Class 8 - Corrosive", "Perishable Goods",
];

const FLAG_STATES = ["US", "GB", "NO", "DE", "JP", "FR", "NL", "DK", "IT", "GR", "SG", "CN", "IN", "HK", "PA", "LR", "MH", "BM", "BS", "KH", "TZ"];

type Tab = "quote" | "policies" | "claims" | "portfolio";

function RiskMeter({ score, rating }: { score: number; rating: string }) {
  const color = RISK_COLOR[rating] ?? AMBER;
  const w = Math.min(Math.max(score, 5), 98);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: TEXT.muted }}>Risk Score</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] font-bold font-mono" style={{ color }}>{score}</span>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: color + "20", color }}>{rating.replace("_", " ")}</span>
        </div>
      </div>
      <div className="rounded-full overflow-hidden h-2" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${GREEN}, ${color})` }} />
      </div>
      <div className="flex justify-between text-[9px] mt-1" style={{ color: TEXT.muted }}>
        <span>Low</span><span>Moderate</span><span>High</span><span>Very High</span>
      </div>
    </div>
  );
}

function FactorRow({ label, value, impact }: { label: string; value: number; impact?: string }) {
  const impactColor = impact === "Critical" ? RED : impact === "High" ? "#f97316" : impact === "Medium" ? AMBER : GREEN;
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <span className="text-[11px]" style={{ color: TEXT.secondary }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono" style={{ color: TEXT.primary }}>×{value.toFixed(3)}</span>
        {impact && <span className="rounded px-1 text-[9px]" style={{ background: impactColor + "18", color: impactColor }}>{impact}</span>}
      </div>
    </div>
  );
}

function BadgeStatus({ status, map }: { status: string; map: Record<string, string> }) {
  const color = map[status] ?? TEXT.muted;
  return (
    <span className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase" style={{ background: color + "18", color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function MarineUnderwritingPage() {
  const [tab, setTab] = useState<Tab>("quote");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [binding, setBinding] = useState<number | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPolicy, setClaimPolicy] = useState<Policy | null>(null);

  const [form, setForm] = useState({
    vesselName: "", vesselType: "Tanker", vesselAge: "10",
    vesselGrossTonnage: "50000", vesselFlag: "PA", vesselMmsi: "", vesselImo: "",
    cargoType: "Crude Oil", cargoValueUsd: "10000000", cargoHazardClass: "Non-hazardous",
    voyageOrigin: "Houston, USA", voyageDestination: "Rotterdam, Netherlands",
    coverageType: "marine_cargo", coverageLimitUsd: "10000000", coveragePeriodDays: "30",
    chokepoints: [] as string[],
  });

  const [claimForm, setClaimForm] = useState({
    incidentType: "", incidentDescription: "", incidentLocation: "",
    incidentAt: new Date().toISOString().split("T")[0], claimedAmountUsd: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, pRes, cRes, sRes] = await Promise.allSettled([
        fetch("/api/vessels/insurance/quotes", { credentials: "include" }).then(r => r.json()),
        fetch("/api/vessels/insurance/policies", { credentials: "include" }).then(r => r.json()),
        fetch("/api/vessels/insurance/claims", { credentials: "include" }).then(r => r.json()),
        fetch("/api/vessels/insurance/portfolio-summary", { credentials: "include" }).then(r => r.json()),
      ]);
      if (qRes.status === "fulfilled") setQuotes(qRes.value?.data?.quotes ?? []);
      if (pRes.status === "fulfilled") setPolicies(pRes.value?.data?.policies ?? []);
      if (cRes.status === "fulfilled") setClaims(cRes.value?.data?.claims ?? []);
      if (sRes.status === "fulfilled") setSummary(sRes.value?.data ?? null);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/vessels/insurance/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          vesselAge: parseInt(form.vesselAge),
          vesselGrossTonnage: parseFloat(form.vesselGrossTonnage),
          cargoValueUsd: parseFloat(form.cargoValueUsd),
          coverageLimitUsd: parseFloat(form.coverageLimitUsd),
          coveragePeriodDays: parseInt(form.coveragePeriodDays),
          routeChokepoints: form.chokepoints,
        }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json?.error ?? "Quote failed", "error"); return; }
      setSelectedQuote(json.data?.quote ?? null);
      fetchAll();
      showToast(`Quote ${json.data?.quote?.quoteRef} generated`, "success");
    } catch { showToast("Network error", "error"); } finally { setSubmitting(false); }
  };

  const handleBind = async (quoteId: number) => {
    setBinding(quoteId);
    try {
      const res = await fetch(`/api/vessels/insurance/quotes/${quoteId}/bind`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const json = await res.json();
      if (!res.ok) { showToast(json?.error ?? "Bind failed", "error"); return; }
      showToast(`Policy ${json.data?.policy?.policyNumber} bound`, "success");
      setSelectedQuote(null);
      fetchAll();
      setTab("policies");
    } catch { showToast("Network error", "error"); } finally { setBinding(null); }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPolicy) return;
    try {
      const res = await fetch("/api/vessels/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policyId: claimPolicy.id,
          vesselName: claimPolicy.vesselName,
          ...claimForm,
          claimedAmountUsd: parseFloat(claimForm.claimedAmountUsd),
          incidentAt: new Date(claimForm.incidentAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json?.error ?? "Claim failed", "error"); return; }
      showToast(`Claim ${json.data?.claim?.claimRef} filed`, "success");
      setShowClaimModal(false);
      setClaimForm({ incidentType: "", incidentDescription: "", incidentLocation: "", incidentAt: new Date().toISOString().split("T")[0], claimedAmountUsd: "" });
      fetchAll();
      setTab("claims");
    } catch { showToast("Network error", "error"); }
  };

  const toggleChokepoint = (cp: string) => {
    setForm(f => ({
      ...f,
      chokepoints: f.chokepoints.includes(cp) ? f.chokepoints.filter(c => c !== cp) : [...f.chokepoints, cp],
    }));
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "quote", label: "New Quote", icon: Plus },
    { key: "policies", label: "Policies", icon: Shield },
    { key: "claims", label: "Claims", icon: AlertTriangle },
    { key: "portfolio", label: "Portfolio", icon: BarChart3 },
  ];

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: TEXT.muted }}>{children}</label>
  );

  const Input = ({ value, onChange, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input value={value} onChange={onChange} {...rest}
      className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary }} />
  );

  const Select = ({ value, onChange, children }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) => (
    <select value={value} onChange={onChange}
      className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
      style={{ background: "#0c1018", border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}>
      {children}
    </select>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 shadow-2xl text-[12px]"
          style={{ background: toast.type === "success" ? `${GREEN}15` : `${RED}15`, border: `1px solid ${toast.type === "success" ? GREEN + "40" : RED + "40"}`, color: toast.type === "success" ? GREEN : RED }}>
          {toast.msg}
        </div>
      )}

      {showClaimModal && claimPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: BG.card, border: `1px solid ${BORDER.gold}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>File Insurance Claim</p>
                <p className="text-[11px]" style={{ color: TEXT.muted }}>{claimPolicy.policyNumber} · {claimPolicy.vesselName}</p>
              </div>
              <button onClick={() => setShowClaimModal(false)}><X className="w-4 h-4" style={{ color: TEXT.muted }} /></button>
            </div>
            <form onSubmit={handleClaim} className="space-y-3">
              <div>
                <Label>Incident Type</Label>
                <Input value={claimForm.incidentType} onChange={e => setClaimForm(f => ({ ...f, incidentType: e.target.value }))} placeholder="e.g. Cargo Damage, Machinery Breakdown" required />
              </div>
              <div>
                <Label>Description</Label>
                <textarea value={claimForm.incidentDescription} onChange={e => setClaimForm(f => ({ ...f, incidentDescription: e.target.value }))}
                  placeholder="Describe the incident…" rows={3} className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Incident Date</Label>
                  <Input type="date" value={claimForm.incidentAt} onChange={e => setClaimForm(f => ({ ...f, incidentAt: e.target.value }))} required />
                </div>
                <div>
                  <Label>Claimed Amount (USD)</Label>
                  <Input type="number" value={claimForm.claimedAmountUsd} onChange={e => setClaimForm(f => ({ ...f, claimedAmountUsd: e.target.value }))} placeholder="e.g. 500000" required min="1" />
                </div>
              </div>
              <div>
                <Label>Incident Location</Label>
                <Input value={claimForm.incidentLocation} onChange={e => setClaimForm(f => ({ ...f, incidentLocation: e.target.value }))} placeholder="e.g. North Atlantic, 42°N 35°W" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowClaimModal(false)} className="flex-1 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}>Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-[12px] font-semibold" style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>File Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3">
          <Anchor className="w-4 h-4" style={{ color: GOLD }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>Marine Insurance Underwriting</span>
          <span className="rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: `${GOLD}15`, color: GOLD }}>Lloyd's Syndicate · P&I Club</span>
        </div>
        <div className="flex items-center gap-3">
          {summary && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px]" style={{ color: TEXT.muted }}>Active Policies</p>
                <p className="text-[13px] font-bold" style={{ color: GREEN }}>{summary.activePolicies}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px]" style={{ color: TEXT.muted }}>GWP</p>
                <p className="text-[13px] font-bold" style={{ color: GOLD }}>{fmtUsd(summary.totalGrossWrittenPremium)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px]" style={{ color: TEXT.muted }}>Loss Ratio</p>
                <p className="text-[13px] font-bold" style={{ color: summary.lossRatioPercent < 60 ? GREEN : summary.lossRatioPercent < 80 ? AMBER : RED }}>{summary.lossRatioPercent}%</p>
              </div>
            </div>
          )}
          <button onClick={fetchAll} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} style={{ color: TEXT.muted }} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-5 py-2 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style={{ background: tab === t.key ? `${GOLD}15` : "transparent", color: tab === t.key ? GOLD : TEXT.muted }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "quote" && (
          <div className="grid grid-cols-[360px_1fr] h-full overflow-hidden">
            <div className="overflow-y-auto p-5 space-y-4" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
              <form onSubmit={handleQuote} className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold mb-3" style={{ color: GOLD }}>Vessel Information</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Vessel Name *</Label>
                      <Input value={form.vesselName} onChange={e => setForm(f => ({ ...f, vesselName: e.target.value }))} placeholder="e.g. PACIFIC GUARDIAN" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Vessel Type</Label>
                        <Select value={form.vesselType} onChange={e => setForm(f => ({ ...f, vesselType: e.target.value }))}>
                          {["Tanker", "Container", "Bulk Carrier", "LNG Carrier", "RoRo", "General Cargo", "Passenger", "Chemical"].map(t => <option key={t}>{t}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label>Flag State</Label>
                        <Select value={form.vesselFlag} onChange={e => setForm(f => ({ ...f, vesselFlag: e.target.value }))}>
                          {FLAG_STATES.map(f => <option key={f} value={f}>{f}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Age (years)</Label>
                        <Input type="number" min="0" max="50" value={form.vesselAge} onChange={e => setForm(f => ({ ...f, vesselAge: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Gross Tonnage</Label>
                        <Input type="number" min="100" value={form.vesselGrossTonnage} onChange={e => setForm(f => ({ ...f, vesselGrossTonnage: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>MMSI (optional)</Label>
                        <Input value={form.vesselMmsi} onChange={e => setForm(f => ({ ...f, vesselMmsi: e.target.value }))} placeholder="9 digits" />
                      </div>
                      <div>
                        <Label>IMO (optional)</Label>
                        <Input value={form.vesselImo} onChange={e => setForm(f => ({ ...f, vesselImo: e.target.value }))} placeholder="7 digits" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold mb-3" style={{ color: GOLD }}>Cargo & Voyage</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Cargo Type</Label>
                      <Input value={form.cargoType} onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))} placeholder="e.g. Iron Ore, Crude Oil" />
                    </div>
                    <div>
                      <Label>Cargo Hazard Class</Label>
                      <Select value={form.cargoHazardClass} onChange={e => setForm(f => ({ ...f, cargoHazardClass: e.target.value }))}>
                        {HAZARD_CLASSES.map(h => <option key={h} value={h}>{h}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label>Cargo Value (USD)</Label>
                      <Input type="number" value={form.cargoValueUsd} onChange={e => setForm(f => ({ ...f, cargoValueUsd: e.target.value }))} placeholder="e.g. 10000000" />
                    </div>
                    <div>
                      <Label>Voyage Origin</Label>
                      <Input value={form.voyageOrigin} onChange={e => setForm(f => ({ ...f, voyageOrigin: e.target.value }))} placeholder="Port of loading" />
                    </div>
                    <div>
                      <Label>Voyage Destination</Label>
                      <Input value={form.voyageDestination} onChange={e => setForm(f => ({ ...f, voyageDestination: e.target.value }))} placeholder="Port of discharge" />
                    </div>
                    <div>
                      <Label>Route Chokepoints</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {CHOKEPOINTS.map(cp => {
                          const sel = form.chokepoints.includes(cp);
                          return (
                            <button key={cp} type="button" onClick={() => toggleChokepoint(cp)}
                              className="rounded-full px-2 py-1 text-[9px] transition-colors"
                              style={{ background: sel ? `${GOLD}20` : "rgba(255,255,255,0.04)", color: sel ? GOLD : TEXT.muted, border: `1px solid ${sel ? GOLD + "40" : BORDER.muted}` }}>
                              {cp}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold mb-3" style={{ color: GOLD }}>Coverage</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Coverage Type *</Label>
                      <Select value={form.coverageType} onChange={e => setForm(f => ({ ...f, coverageType: e.target.value }))}>
                        {COVERAGE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Coverage Limit (USD) *</Label>
                        <Input type="number" value={form.coverageLimitUsd} onChange={e => setForm(f => ({ ...f, coverageLimitUsd: e.target.value }))} required />
                      </div>
                      <div>
                        <Label>Period (days)</Label>
                        <Input type="number" min="1" max="365" value={form.coveragePeriodDays} onChange={e => setForm(f => ({ ...f, coveragePeriodDays: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl text-[12px] font-semibold uppercase tracking-wide transition-all disabled:opacity-50"
                  style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>
                  {submitting ? "Generating…" : "Generate Quote"}
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-5">
              {selectedQuote ? (
                <div className="space-y-4">
                  <div className="rounded-2xl p-5" style={{ background: BG.card, border: `1px solid ${BORDER.gold}` }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[12px] font-mono mb-0.5" style={{ color: GOLD }}>{selectedQuote.quoteRef}</p>
                        <p className="text-[18px] font-bold" style={{ color: TEXT.primary }}>{selectedQuote.vesselName}</p>
                        <p className="text-[11px]" style={{ color: TEXT.muted }}>
                          {COVERAGE_TYPES.find(ct => ct.value === selectedQuote.coverageType)?.label} · {selectedQuote.coveragePeriodDays}d coverage
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>Premium</p>
                        <p className="text-[26px] font-bold font-mono" style={{ color: GOLD }}>{fmtUsd(selectedQuote.premiumUsd)}</p>
                        <p className="text-[10px]" style={{ color: TEXT.muted }}>Rate: {((selectedQuote.finalRatePercent ?? 0) * 100).toFixed(4)}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <RiskMeter score={selectedQuote.riskScore} rating={selectedQuote.riskRating} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "Coverage Limit", value: fmtUsd(selectedQuote.coverageLimitUsd) },
                        { label: "Deductible", value: fmtUsd(selectedQuote.deductibleUsd) },
                        { label: "Annual Premium", value: fmtUsd(selectedQuote.premiumUsd) },
                      ].map(f => (
                        <div key={f.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.subtle}` }}>
                          <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{f.label}</p>
                          <p className="text-[13px] font-bold font-mono" style={{ color: TEXT.primary }}>{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedQuote.premiumBreakdown && (
                      <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
                        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: TEXT.muted }}>Premium Breakdown</p>
                        {Object.entries(selectedQuote.premiumBreakdown).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                            <span className="text-[11px] capitalize" style={{ color: TEXT.secondary }}>{k.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className="text-[11px] font-mono" style={{ color: k === "totalPremium" ? GOLD : TEXT.primary }}>{fmtUsd(v as number)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedQuote.riskFactors && (
                      <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
                        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>Risk Factors</p>
                        {Object.entries(selectedQuote.riskFactors).map(([k, v]: [string, any]) => (
                          <FactorRow key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v.value ?? 1} impact={v.impact} />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setSelectedQuote(null)} className="flex-1 py-2.5 rounded-xl text-[12px]" style={{ border: `1px solid ${BORDER.muted}`, color: TEXT.muted }}>
                        Discard
                      </button>
                      <button
                        onClick={() => handleBind(selectedQuote.id)}
                        disabled={selectedQuote.riskRating === "uninsurable" || binding === selectedQuote.id}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold disabled:opacity-50 transition-all"
                        style={{ background: `${GREEN}20`, color: GREEN, border: `1px solid ${GREEN}40` }}>
                        {binding === selectedQuote.id ? "Binding…" : "Bind Policy"}
                      </button>
                    </div>
                    {selectedQuote.riskRating === "uninsurable" && (
                      <p className="text-[11px] text-center mt-2" style={{ color: RED }}>This risk is rated uninsurable and cannot be bound.</p>
                    )}
                  </div>

                  {quotes.length > 1 && (
                    <div>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: TEXT.muted }}>Recent Quotes</p>
                      <div className="space-y-2">
                        {quotes.slice(0, 5).filter(q => q.id !== selectedQuote?.id).map(q => (
                          <button key={q.id} onClick={() => setSelectedQuote(q)} className="w-full text-left rounded-xl px-4 py-3 hover:bg-white/[0.02] transition-colors" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{q.vesselName}</p>
                                <p className="text-[10px]" style={{ color: TEXT.muted }}>{q.quoteRef} · {COVERAGE_TYPES.find(c => c.value === q.coverageType)?.label}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[12px] font-bold" style={{ color: GOLD }}>{fmtUsd(q.premiumUsd)}</p>
                                <BadgeStatus status={q.status} map={STATUS_COLOR} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Anchor className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: GOLD }} />
                      <p className="text-[14px] font-semibold mb-1" style={{ color: TEXT.secondary }}>No Quote Generated</p>
                      <p className="text-[12px]" style={{ color: TEXT.muted }}>Fill in vessel, cargo, and voyage details to generate a premium quote.</p>
                    </div>
                  </div>
                  {quotes.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: TEXT.muted }}>Recent Quotes</p>
                      <div className="space-y-2">
                        {quotes.slice(0, 5).map(q => (
                          <button key={q.id} onClick={() => setSelectedQuote(q)} className="w-full text-left rounded-xl px-4 py-3 hover:bg-white/[0.02] transition-colors" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[12px] font-semibold" style={{ color: TEXT.primary }}>{q.vesselName}</p>
                                <p className="text-[10px]" style={{ color: TEXT.muted }}>{q.quoteRef} · {COVERAGE_TYPES.find(c => c.value === q.coverageType)?.label}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[13px] font-bold" style={{ color: GOLD }}>{fmtUsd(q.premiumUsd)}</p>
                                <BadgeStatus status={q.status} map={STATUS_COLOR} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "policies" && (
          <div className="p-5">
            <div className="space-y-3">
              {policies.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: GOLD }} />
                  <p className="text-[13px]" style={{ color: TEXT.muted }}>No policies yet — bind a quote to create a policy</p>
                </div>
              ) : policies.map(pol => (
                <div key={pol.id} className="rounded-2xl p-5" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12px] font-bold font-mono" style={{ color: GOLD }}>{pol.policyNumber}</p>
                        <BadgeStatus status={pol.status} map={STATUS_COLOR} />
                      </div>
                      <p className="text-[14px] font-semibold" style={{ color: TEXT.primary }}>{pol.vesselName}</p>
                      <p className="text-[11px]" style={{ color: TEXT.muted }}>{COVERAGE_TYPES.find(c => c.value === pol.coverageType)?.label} · {pol.carrier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold font-mono" style={{ color: GOLD }}>{fmtUsd(pol.premiumUsd)}</p>
                      <p className="text-[10px]" style={{ color: TEXT.muted }}>premium</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[
                      { label: "Limit", value: fmtUsd(pol.coverageLimitUsd) },
                      { label: "Effective", value: new Date(pol.effectiveAt).toLocaleDateString() },
                      { label: "Expires", value: new Date(pol.expiresAt).toLocaleDateString() },
                      { label: "Claims", value: String(pol.claimsCount) },
                    ].map(f => (
                      <div key={f.label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px]" style={{ color: TEXT.muted }}>{f.label}</p>
                        <p className="text-[11px] font-semibold font-mono" style={{ color: TEXT.primary }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {pol.status === "active" && (
                    <button
                      onClick={() => { setClaimPolicy(pol); setShowClaimModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                      style={{ background: `${RED}10`, color: RED, border: `1px solid ${RED}25` }}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      File Claim
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "claims" && (
          <div className="p-5">
            {claims.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: AMBER }} />
                <p className="text-[13px]" style={{ color: TEXT.muted }}>No claims filed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map(claim => (
                  <div key={claim.id} className="rounded-2xl p-5" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-bold font-mono" style={{ color: GOLD }}>{claim.claimRef}</p>
                          <BadgeStatus status={claim.status} map={CLAIM_STATUS_COLOR} />
                        </div>
                        <p className="text-[14px] font-semibold" style={{ color: TEXT.primary }}>{claim.vesselName}</p>
                        <p className="text-[11px] font-medium mb-0.5" style={{ color: "#f97316" }}>{claim.incidentType}</p>
                        {claim.incidentDescription && <p className="text-[11px]" style={{ color: TEXT.secondary }}>{claim.incidentDescription}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-bold font-mono" style={{ color: RED }}>{fmtUsd(claim.claimedAmountUsd)}</p>
                        <p className="text-[10px]" style={{ color: TEXT.muted }}>claimed</p>
                        <p className="text-[10px] mt-1 font-mono" style={{ color: AMBER }}>Reserve: {fmtUsd(claim.reserveAmountUsd)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Incident", value: new Date(claim.incidentAt).toLocaleDateString() },
                        { label: "Filed", value: new Date(claim.filedAt).toLocaleDateString() },
                        { label: "Policy ID", value: `POL #${claim.policyId}` },
                      ].map(f => (
                        <div key={f.label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[9px]" style={{ color: TEXT.muted }}>{f.label}</p>
                          <p className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                    {claim.adjustorNotes && (
                      <div className="mt-3 rounded-lg px-3 py-2.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <p className="text-[10px] font-semibold mb-1" style={{ color: AMBER }}>Adjustor Notes</p>
                        <p className="text-[11px]" style={{ color: TEXT.secondary }}>{claim.adjustorNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "portfolio" && summary && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Active Policies", value: String(summary.activePolicies), color: GREEN, icon: Shield },
                { label: "Gross Written Premium", value: fmtUsd(summary.totalGrossWrittenPremium), color: GOLD, icon: DollarSign },
                { label: "Total Exposure", value: fmtUsd(summary.totalExposure), color: TEXT.primary, icon: Waves },
                { label: "Open Claims", value: String(summary.openClaims), color: summary.openClaims > 0 ? RED : TEXT.muted, icon: AlertTriangle },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <p className="text-[10px]" style={{ color: TEXT.muted }}>{s.label}</p>
                  </div>
                  <p className="text-[22px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Loss Ratio", value: `${summary.lossRatioPercent}%`, color: summary.lossRatioPercent < 60 ? GREEN : summary.lossRatioPercent < 80 ? AMBER : RED, note: "Paid claims / GWP" },
                { label: "Combined Ratio", value: `${summary.combinedRatio}%`, color: summary.combinedRatio < 100 ? GREEN : RED, note: "Loss + Expense ratios" },
                { label: "Total Reserves", value: fmtUsd(summary.totalReserves), color: AMBER, note: "Open claim reserves" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                  <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{s.label}</p>
                  <p className="text-[26px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: TEXT.muted }}>{s.note}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5" style={{ background: BG.card, border: `1px solid ${BORDER.gold}` }}>
              <p className="text-[11px] font-semibold mb-2" style={{ color: GOLD }}>Underwriting Basis</p>
              <p className="text-[11px]" style={{ color: TEXT.secondary }}>
                Premiums calculated under the Institute Cargo Clauses (A) / Institute Hull Clauses framework with Lloyd's market rates.
                Risk scoring uses AIS vessel data, flag state risk profiles, IMO hazard classifications, and route choke-point analysis
                based on JWC Listed Areas and Oslo Group war risk ratings. All figures are illustrative for platform demonstration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
