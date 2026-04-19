import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, DollarSign, FileText, TrendingUp, Activity } from "lucide-react";
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

interface ApiPolicy {
  id: number;
  policyNumber?: string;
  vesselName?: string;
  vesselImo?: string;
  vesselMmsi?: string;
  carrier?: string;
  syndicateCode?: string;
  coverageType?: string;
  coverageLimitUsd?: number | string;
  deductibleUsd?: number | string;
  premiumUsd?: number | string;
  status?: string;
  effectiveAt?: string;
  expiresAt?: string;
  claimsCount?: number;
  totalClaimsUsd?: number | string;
}

interface ApiClaim {
  id: number;
  claimRef?: string;
  policyId?: number;
  vesselName?: string;
  incidentType?: string;
  incidentDescription?: string;
  incidentLocation?: string;
  incidentAt?: string;
  filedAt?: string;
  claimedAmountUsd?: number | string;
  reserveAmountUsd?: number | string;
  status?: string;
  adjustorNotes?: string;
}

interface PortfolioSummary {
  activePolicies: number;
  totalPolicies: number;
  totalGrossWrittenPremium: number;
  totalExposure: number;
  openClaims: number;
  totalClaims: number;
  totalReserves: number;
  totalPaidClaims: number;
  lossRatioPercent: number;
}

const numericValue = (v: number | string | null | undefined, fallback = 0) => {
  if (v == null) return fallback;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const claimTypeFor = (t?: string): Claim["type"] => {
  const k = (t ?? "").toLowerCase();
  if (k.includes("p&i") || k.includes("pi") || k.includes("pollution") || k.includes("liability")) return "P&I";
  if (k.includes("war") || k.includes("piracy")) return "War Risk";
  if (k.includes("cargo")) return "Cargo";
  return "H&M";
};

const claimStatusFor = (s?: string): Claim["status"] => {
  const k = (s ?? "").toLowerCase();
  if (k === "settled" || k === "closed") return "settled";
  if (k === "denied" || k === "rejected") return "denied";
  if (k === "under_review" || k === "in_review" || k === "investigating") return "under_review";
  return "open";
};

const policyToVesselInsurance = (p: ApiPolicy): VesselInsurance => {
  const limit = numericValue(p.coverageLimitUsd);
  const premium = numericValue(p.premiumUsd);
  const ratio = limit > 0 ? premium / limit : 0.005;
  const baseScore = Math.min(98, Math.max(20, Math.round(95 - ratio * 8000)));
  const claimPenalty = Math.min(25, (p.claimsCount ?? 0) * 12);
  const score = Math.max(15, baseScore - claimPenalty);
  const flags: string[] = [];
  if ((p.claimsCount ?? 0) > 0) flags.push(`${p.claimsCount} claim${p.claimsCount === 1 ? "" : "s"} on policy ${p.policyNumber ?? p.id} — review at next renewal`);
  if (p.status && p.status !== "active") flags.push(`Policy status: ${p.status}`);
  return {
    vessel: p.vesselName ?? `Vessel ${p.id}`,
    imo: p.vesselImo ?? p.vesselMmsi ?? "—",
    underwritingScore: score,
    hmInsurer: p.carrier ?? "Lloyd's of London",
    hmValue: limit,
    hmPremium: premium,
    piClub: p.syndicateCode ?? p.carrier ?? "P&I Club",
    piDeductible: numericValue(p.deductibleUsd),
    warRiskZones: [],
    claimHistory12m: p.claimsCount ?? 0,
    openClaims: p.claimsCount ?? 0,
    nextRenewal: (p.expiresAt ?? "").slice(0, 10) || "—",
    flags,
  };
};

const apiClaimToClaim = (c: ApiClaim, policies: ApiPolicy[]): Claim => {
  const policy = policies.find((p) => p.id === c.policyId);
  return {
    id: c.claimRef ?? `CLM-${c.id}`,
    vessel: c.vesselName ?? policy?.vesselName ?? "—",
    type: claimTypeFor(c.incidentType),
    description: c.incidentDescription ?? c.incidentType ?? "—",
    dateReported: (c.filedAt ?? c.incidentAt ?? "").slice(0, 10) || "—",
    estimatedAmount: numericValue(c.claimedAmountUsd ?? c.reserveAmountUsd),
    status: claimStatusFor(c.status),
    insurer: policy?.carrier ?? "—",
    adjustor: c.adjustorNotes ? "Adjustor assigned" : "Pending appointment",
    correspondence: [
      { date: (c.filedAt ?? "").slice(0, 10) || "—", party: "Owner → Insurer", summary: `Claim ${c.claimRef ?? c.id} filed for ${c.incidentType ?? "incident"} at ${c.incidentLocation ?? "unknown location"}` },
      ...(c.adjustorNotes ? [{ date: (c.filedAt ?? "").slice(0, 10) || "—", party: "Adjustor", summary: c.adjustorNotes }] : []),
    ],
  };
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Open" },
  under_review: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Under Review" },
  settled: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Settled" },
  denied: { color: "text-sky-400/50 bg-sky-500/5 border-sky-500/10", label: "Denied" },
};

const scoreColor = (score: number) =>
  score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : score >= 40 ? "text-orange-400" : "text-red-400";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function InsurancePanelPage() {
  const [tab, setTab] = useState<"policies" | "claims">("policies");

  const policiesQuery = useQuery({
    queryKey: ["vessels-insurance-policies"],
    queryFn: () => fetchJson<{ policies: ApiPolicy[] }>("/api/vessels/insurance/policies"),
    staleTime: 60_000,
  });
  const claimsQuery = useQuery({
    queryKey: ["vessels-insurance-claims"],
    queryFn: () => fetchJson<{ claims: ApiClaim[] }>("/api/vessels/insurance/claims"),
    staleTime: 60_000,
  });
  const summaryQuery = useQuery({
    queryKey: ["vessels-insurance-summary"],
    queryFn: () => fetchJson<PortfolioSummary>("/api/vessels/insurance/portfolio-summary"),
    staleTime: 60_000,
  });

  const apiPolicies = policiesQuery.data?.policies ?? [];
  const apiClaims = claimsQuery.data?.claims ?? [];
  const POLICIES = useMemo(() => apiPolicies.map(policyToVesselInsurance), [apiPolicies]);
  const CLAIMS = useMemo(() => apiClaims.map((c) => apiClaimToClaim(c, apiPolicies)), [apiClaims, apiPolicies]);

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  useEffect(() => {
    if (!selectedClaim && CLAIMS.length > 0) setSelectedClaim(CLAIMS[0]);
  }, [CLAIMS, selectedClaim]);

  const summary = summaryQuery.data;
  const totalOpenClaims = summary?.openClaims ?? CLAIMS.filter(c => c.status !== "settled" && c.status !== "denied").length;
  const totalExposure = summary?.totalReserves ?? CLAIMS.filter(c => c.status !== "settled").reduce((a, c) => a + c.estimatedAmount, 0);
  const totalPremium = summary?.totalGrossWrittenPremium ?? POLICIES.reduce((a, p) => a + p.hmPremium, 0);
  const avgScore = POLICIES.length > 0 ? Math.round(POLICIES.reduce((a, p) => a + p.underwritingScore, 0) / POLICIES.length) : 0;

  const isLoading = policiesQuery.isLoading || claimsQuery.isLoading;
  const loadError = policiesQuery.error || claimsQuery.error;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-400" />
          Insurance & P&I Panel
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Hull & machinery claims, P&I club correspondence, and underwriting risk scores feeding from the vessel risk engine</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="text-[9px] text-sky-400/40 border-sky-500/15">
            Live · /api/vessels/insurance · {apiPolicies.length} polic{apiPolicies.length === 1 ? "y" : "ies"} · {apiClaims.length} claim{apiClaims.length === 1 ? "" : "s"}
          </Badge>
          {isLoading && <Badge variant="outline" className="text-[9px] text-amber-300/70 border-amber-500/20">Loading…</Badge>}
          {loadError && <Badge variant="outline" className="text-[9px] text-red-300 border-red-500/30">API error — showing whatever loaded</Badge>}
        </div>
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
