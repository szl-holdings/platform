import { useState } from "react";
import { Shield, AlertTriangle, DollarSign, FileText, CheckCircle2, Clock, Ship, TrendingUp, Activity } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

interface Claim {
  id: string;
  vessel: string;
  type: "H&M" | "P&I" | "War Risk" | "Cargo";
  description: string;
  dateReported: string;
  estimatedAmount: number;
  status: "open" | "under_review" | "settled" | "denied";
  insurer: string;
  adjustor: string;
  correspondence: { date: string; party: string; summary: string }[];
}

interface VesselInsurance {
  vessel: string;
  imo: string;
  underwritingScore: number;
  hmInsurer: string;
  hmValue: number;
  hmPremium: number;
  piClub: string;
  piDeductible: number;
  warRiskZones: string[];
  claimHistory12m: number;
  openClaims: number;
  nextRenewal: string;
  flags: string[];
}

const POLICIES: VesselInsurance[] = [
  {
    vessel: "Pacific Navigator", imo: "9234567",
    underwritingScore: 42,
    hmInsurer: "Lloyd's of London — Syndicate 4472", hmValue: 48_000_000, hmPremium: 384_000,
    piClub: "UK P&I Club", piDeductible: 50_000,
    warRiskZones: ["Persian Gulf", "Black Sea", "Red Sea"],
    claimHistory12m: 2, openClaims: 1, nextRenewal: "2026-12-01",
    flags: ["PSC detention increases H&M premium at renewal", "War risk additional premium due for Persian Gulf transit"],
  },
  {
    vessel: "Arctic Breeze", imo: "9876543",
    underwritingScore: 88,
    hmInsurer: "Norwegian Hull Club", hmValue: 62_000_000, hmPremium: 434_000,
    piClub: "Gard P&I", piDeductible: 25_000,
    warRiskZones: [],
    claimHistory12m: 0, openClaims: 0, nextRenewal: "2026-08-01",
    flags: [],
  },
  {
    vessel: "Meridian Bulk", imo: "9456789",
    underwritingScore: 71,
    hmInsurer: "Britannia P&I / Tokio Marine", hmValue: 35_000_000, hmPremium: 262_500,
    piClub: "Britannia P&I Club", piDeductible: 30_000,
    warRiskZones: ["Red Sea"],
    claimHistory12m: 1, openClaims: 0, nextRenewal: "2027-01-01",
    flags: ["Cargo claim settled Jan 2026 — watch for repeat on similar routes"],
  },
  {
    vessel: "Cape Resolute", imo: "9123456",
    underwritingScore: 59,
    hmInsurer: "West of England P&I Club", hmValue: 41_000_000, hmPremium: 328_000,
    piClub: "West of England P&I Club", piDeductible: 40_000,
    warRiskZones: ["Black Sea", "Red Sea"],
    claimHistory12m: 1, openClaims: 1, nextRenewal: "2026-11-01",
    flags: ["Sewage treatment plant repair — potential P&I MARPOL exposure", "Black Sea war risk additional premium not yet agreed for upcoming voyage"],
  },
];

const CLAIMS: Claim[] = [
  {
    id: "CLM-001", vessel: "Pacific Navigator", type: "H&M",
    description: "Cargo hold flooding — water ingress via compromised hatch seal during South Atlantic transit",
    dateReported: "2026-02-18", estimatedAmount: 780_000, status: "under_review",
    insurer: "Lloyd's Syndicate 4472", adjustor: "J. Morgan & Associates",
    correspondence: [
      { date: "2026-02-18", party: "Owner → Insurer", summary: "Initial notification of incident and survey request" },
      { date: "2026-02-22", party: "Adjustor", summary: "Average adjustor appointed — attending Rotterdam survey" },
      { date: "2026-03-10", party: "Insurer → Owner", summary: "Survey report received — causation review in progress. Liability not yet admitted" },
      { date: "2026-04-01", party: "Owner → Insurer", summary: "Submitted repair invoices $542,000 + consequential loss claim $238,000" },
    ],
  },
  {
    id: "CLM-002", vessel: "Cape Resolute", type: "P&I",
    description: "MARPOL potential violation — sewage treatment plant overboard valve (now repaired). Port Authority in Houston filed notice",
    dateReported: "2026-04-03", estimatedAmount: 120_000, status: "open",
    insurer: "West of England P&I Club", adjustor: "P&I Club Correspondent — Houston",
    correspondence: [
      { date: "2026-04-03", party: "Master → Owner", summary: "USCG notice of potential MARPOL violation filed post-inspection" },
      { date: "2026-04-04", party: "Owner → P&I Club", summary: "Club notified, correspondent appointed in Houston" },
      { date: "2026-04-08", party: "P&I Club Correspondent", summary: "Preliminary review — repair documentation reviewed. Penalty estimate $80-120K" },
    ],
  },
  {
    id: "CLM-003", vessel: "Meridian Bulk", type: "Cargo",
    description: "Wet damage — soybeans cargo contamination due to condensation in cargo holds during Santos → Ningbo voyage",
    dateReported: "2025-12-14", estimatedAmount: 210_000, status: "settled",
    insurer: "Tokio Marine (Cargo)", adjustor: "China P&I Bureau",
    correspondence: [
      { date: "2025-12-14", party: "Charterer → Owner", summary: "Formal cargo damage claim received for 2,400MT soybeans" },
      { date: "2026-01-10", party: "Adjustor", summary: "Survey completed Ningbo — confirmed 2,200MT damaged, moisture cause" },
      { date: "2026-01-28", party: "Insurer", summary: "Settlement agreed: $198,000 — claim closed" },
    ],
  },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Open" },
  under_review: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Under Review" },
  settled: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Settled" },
  denied: { color: "text-sky-400/50 bg-sky-500/5 border-sky-500/10", label: "Denied" },
};

const scoreColor = (score: number) =>
  score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : score >= 40 ? "text-orange-400" : "text-red-400";

export default function InsurancePanelPage() {
  const [tab, setTab] = useState<"policies" | "claims">("policies");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(CLAIMS[0]);

  const totalOpenClaims = CLAIMS.filter(c => c.status !== "settled" && c.status !== "denied").length;
  const totalExposure = CLAIMS.filter(c => c.status !== "settled").reduce((a, c) => a + c.estimatedAmount, 0);
  const totalPremium = POLICIES.reduce((a, p) => a + p.hmPremium, 0);
  const avgScore = Math.round(POLICIES.reduce((a, p) => a + p.underwritingScore, 0) / POLICIES.length);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-400" />
          Insurance & P&I Panel
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Hull & machinery claims, P&I club correspondence, and underwriting risk scores feeding from the vessel risk engine</p>
        <Badge variant="outline" className="text-[9px] mt-1 text-sky-400/30 border-sky-500/15">Simulated data — for demonstration purposes</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open Claims", value: totalOpenClaims, color: "text-red-400", icon: AlertTriangle },
          { label: "Claim Exposure", value: `$${(totalExposure / 1000).toFixed(0)}K`, color: "text-orange-400", icon: DollarSign },
          { label: "Annual Premium", value: `$${(totalPremium / 1000).toFixed(0)}K`, color: "text-sky-300", icon: TrendingUp },
          { label: "Avg Underwriting Score", value: avgScore, color: scoreColor(avgScore), icon: Activity },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {(["policies", "claims"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
              tab === t ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-sky-400/50 hover:text-sky-300")}>
            {t === "policies" ? "Policy Overview" : "Claim Tracker"}
          </button>
        ))}
      </div>

      {tab === "policies" && (
        <div className="space-y-3">
          {POLICIES.map(p => (
            <div key={p.vessel} className={cn("bg-[#0a1628]/80 border rounded-xl p-4",
              p.underwritingScore < 50 ? "border-red-500/20" :
              p.underwritingScore < 65 ? "border-amber-500/20" : "border-sky-500/10")}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-sky-100">{p.vessel}</p>
                  <p className="text-[10px] text-sky-400/50">IMO {p.imo}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xl font-bold font-mono", scoreColor(p.underwritingScore))}>{p.underwritingScore}</p>
                  <p className="text-[9px] text-sky-400/40">underwriting score</p>
                  {p.openClaims > 0 && <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-500/20 mt-1">{p.openClaims} open claim</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "H&M Insurer", value: p.hmInsurer.split("—")[0].trim() },
                  { label: "Insured Value", value: `$${(p.hmValue / 1e6).toFixed(0)}M` },
                  { label: "Annual Premium", value: `$${(p.hmPremium / 1000).toFixed(0)}K` },
                  { label: "P&I Club", value: p.piClub },
                ].map(f => (
                  <div key={f.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                    <p className="text-xs text-sky-200 font-medium mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              {p.warRiskZones.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] text-amber-400/50 uppercase tracking-wider">War risk:</span>
                  {p.warRiskZones.map(z => (
                    <span key={z} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">{z}</span>
                  ))}
                </div>
              )}
              {p.flags.length > 0 && (
                <div className="mt-3 space-y-1">
                  {p.flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-300/70">{flag}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "claims" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {CLAIMS.map(c => (
              <button key={c.id} onClick={() => setSelectedClaim(c)}
                className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all",
                  selectedClaim?.id === c.id ? "border-sky-500/30 ring-1 ring-sky-500/15" :
                  c.status === "open" ? "border-red-500/20" :
                  c.status === "under_review" ? "border-amber-500/20" : "border-sky-500/10 hover:border-sky-500/20")}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    c.status === "settled" ? "bg-emerald-500/10" :
                    c.status === "open" ? "bg-red-500/10" : "bg-amber-500/10")}>
                    <FileText className={cn("w-3.5 h-3.5",
                      c.status === "settled" ? "text-emerald-400" :
                      c.status === "open" ? "text-red-400" : "text-amber-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-sky-100">{c.id}</span>
                      <Badge variant="outline" className="text-[9px] text-sky-400/40 border-sky-500/10">{c.type}</Badge>
                      <Badge variant="outline" className={cn("text-[9px]", statusConfig[c.status].color)}>
                        {statusConfig[c.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-sky-300">{c.vessel}</p>
                    <p className="text-[10px] text-sky-400/50 mt-0.5 line-clamp-2">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold font-mono",
                      c.status === "settled" ? "text-sky-300" : "text-orange-400")}>
                      ${(c.estimatedAmount / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[9px] text-sky-400/40">{c.dateReported}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedClaim && (
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-100">{selectedClaim.id} — {selectedClaim.type} Claim</p>
                  <p className="text-[10px] text-sky-400/50">{selectedClaim.vessel} · Reported {selectedClaim.dateReported}</p>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", statusConfig[selectedClaim.status].color)}>
                  {statusConfig[selectedClaim.status].label}
                </Badge>
              </div>
              <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-sky-200">{selectedClaim.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Insurer", value: selectedClaim.insurer },
                  { label: "Adjustor", value: selectedClaim.adjustor },
                  { label: "Estimated Amount", value: `$${selectedClaim.estimatedAmount.toLocaleString()}` },
                  { label: "Reported", value: selectedClaim.dateReported },
                ].map(f => (
                  <div key={f.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                    <p className="text-xs text-sky-200 mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">Correspondence Log</p>
                <div className="space-y-2">
                  {selectedClaim.correspondence.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-sky-500/3 rounded-lg border border-sky-500/8">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400/30 shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-mono text-sky-400/50">{entry.date}</span>
                          <span className="text-[9px] text-sky-400/30">·</span>
                          <span className="text-[9px] text-sky-400">{entry.party}</span>
                        </div>
                        <p className="text-[11px] text-sky-300/80">{entry.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
