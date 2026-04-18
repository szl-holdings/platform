import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@szl-holdings/shared-ui/utils";
import { AmbientBar, type AmbientSignal } from "@szl-holdings/shared-ui/ambient-intelligence";
import { Leaf, Radio, RefreshCw, AlertTriangle, CheckCircle2, Database, PlusCircle, X } from "lucide-react";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

type TrackSource = "ais-live-track" | "ais-speed-estimate" | "user-provided";

interface VoyageEmissionRecord {
  id: string;
  vesselName: string;
  imo: string;
  grossTonnage: number;
  voyageId: string;
  origin: string;
  destination: string;
  distanceNm: number;
  fuelType: string;
  fuelConsumedMt: number;
  co2EmissionsMt: number;
  co2PerNm: number;
  fleetAvgCo2PerNm: number;
  aer: number;
  ciiRating: "A" | "B" | "C" | "D" | "E";
  efficiencyScore: number;
  weatherAdjustedScore: number;
  portCongestionWasteHours: number;
  carbonCostUsd: number;
  euEtsLiability: number;
  status: "in-progress" | "completed";
  departedAt: string;
  arrivedAt: string | null;
  passportHash: string;
  dataSource: "ais-live" | "ais-cached";
  trackSource?: TrackSource;
  trackSampledPoints?: number;
  mmsi?: string;
}

interface EmissionsApiResponse {
  voyages: VoyageEmissionRecord[];
  totals: {
    totalCo2Mt: number;
    totalCarbonCostUsd: number;
    totalEuEtsUsd: number;
    avgEfficiencyScore: number;
    fleetAvgCo2PerNm: number;
  };
}

const CII_COLORS: Record<string, string> = {
  A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", E: "#ef4444",
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function DataSourceBadge({ source }: { source: "ais-live" | "ais-cached" }) {
  if (source === "ais-live") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
        <Radio className="w-2.5 h-2.5" /> AIS LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 text-amber-400">
      <Database className="w-2.5 h-2.5" /> AIS CACHED
    </span>
  );
}

interface ComputeFormData {
  mmsi: string;
  vesselName: string;
  imo: string;
  grossTonnage: string;
  voyageId: string;
  origin: string;
  destination: string;
  distanceNm: string;
  fuelType: string;
  fuelConsumedMt: string;
  departedAt: string;
}

const EMPTY_COMPUTE: ComputeFormData = {
  mmsi: "", vesselName: "", imo: "", grossTonnage: "",
  voyageId: "", origin: "", destination: "", distanceNm: "",
  fuelType: "VLSFO", fuelConsumedMt: "", departedAt: "",
};

export default function VoyageCarbonPassport() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ComputeFormData>(EMPTY_COMPUTE);

  const { data, isLoading, isError, refetch } = useQuery<EmissionsApiResponse>({
    queryKey: ["vessels-voyages-emissions"],
    queryFn: () =>
      fetch(`${API_BASE}/vessels/modules/voyages-emissions`, { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error("Failed to fetch voyage emissions");
        return r.json().then(d => d.data ?? d);
      }),
    staleTime: 60_000,
    // Poll every 2 minutes while any voyage is in-progress so AIS-derived
    // distance and emissions stay current. Completed voyages are immutable
    // server-side, so we stop polling when none are in flight.
    refetchInterval: (query) => {
      const resp = query.state.data as EmissionsApiResponse | undefined;
      const hasInProgress = resp?.voyages?.some(v => v.status === "in-progress") ?? true;
      return hasInProgress ? 120_000 : false;
    },
    refetchIntervalInBackground: false,
  });

  const computeMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetch(`${API_BASE}/vessels/modules/voyages-emissions`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Failed to compute passport"); }
        return r.json().then(d => d.data ?? d);
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vessels-voyages-emissions"] });
      setShowCreate(false);
      setForm(EMPTY_COMPUTE);
    },
  });

  const ambientSignals: AmbientSignal[] = [
    {
      id: "sig-1", domain: "vessels", title: "Carbon Below Target",
      summary: "Fleet carbon intensity trending 12% below IMO 2026 target",
      severity: "info", score: 0.45, timestamp: Date.now(),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-sky-400/40 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading voyage carbon data…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <p className="text-sm text-sky-400/50">Failed to load emission records</p>
        <button onClick={() => refetch()} className="text-xs text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/5">
          Retry
        </button>
      </div>
    );
  }

  const { voyages, totals } = data;
  const selected = voyages.find(v => v.id === selectedId);

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="vessels" accentColor="#3b82f6" compact />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white/90">Voyage Carbon Passport</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">
            Per-voyage emissions computed from AIS tracks + vessel specs · IMO 2026 CII ratings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 text-xs text-emerald-400/70 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/5 transition-colors"
          >
            <PlusCircle className="w-3 h-3" /> New Passport
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-sky-400/50 hover:text-sky-300 border border-sky-500/10 px-3 py-1.5 rounded-lg hover:bg-sky-500/5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl bg-white/[0.03] border border-emerald-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-200 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Compute Carbon Passport from AIS
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                Enter MMSI to auto-fill vessel name/IMO from live AIS · provide voyage + bunker data to compute CII rating
              </p>
            </div>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-white/20 hover:text-white/50" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { key: "mmsi", label: "MMSI (AIS track)", hint: "Optional — derives distance from AIS + fills vessel name/IMO" },
              { key: "vesselName", label: "Vessel Name", hint: "Overridden by live AIS when MMSI given" },
              { key: "voyageId", label: "Voyage ID *", hint: "e.g. VOY-2026-031" },
              { key: "imo", label: "IMO Number", hint: "7–9 digits" },
              { key: "grossTonnage", label: "Gross Tonnage (GT) *", hint: "GT for AER calculation" },
              { key: "origin", label: "Port of Origin *", hint: "e.g. Rotterdam" },
              { key: "destination", label: "Destination Port *", hint: "e.g. Singapore" },
              { key: "distanceNm", label: "Distance (nm)", hint: "Derived from AIS track when MMSI given; required otherwise" },
              { key: "fuelConsumedMt", label: "Fuel Consumed (MT) *", hint: "From bunker / fuel log" },
              { key: "departedAt", label: "Departure (UTC) *", hint: "ISO: 2026-04-18T00:00:00Z" },
            ] as { key: keyof ComputeFormData; label: string; hint: string }[]).map(({ key, label, hint }) => (
              <div key={key}>
                <label className="text-[10px] text-emerald-400/50 uppercase tracking-wider block mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-[#060d1a] border border-emerald-500/15 rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/15 focus:outline-none focus:border-emerald-500/35"
                  placeholder={hint}
                />
              </div>
            ))}
            <div>
              <label className="text-[10px] text-emerald-400/50 uppercase tracking-wider block mb-1">Fuel Type *</label>
              <select
                value={form.fuelType}
                onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                className="w-full bg-[#060d1a] border border-emerald-500/15 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-emerald-500/35"
              >
                {["VLSFO", "HFO", "MGO", "LNG", "METHANOL"].map(ft => <option key={ft} value={ft}>{ft}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const payload: Record<string, unknown> = {
                  voyageId: form.voyageId,
                  grossTonnage: Number(form.grossTonnage),
                  origin: form.origin,
                  destination: form.destination,
                  fuelType: form.fuelType,
                  fuelConsumedMt: Number(form.fuelConsumedMt),
                  departedAt: form.departedAt,
                };
                // MMSI triggers AIS track derivation (derives distance server-side)
                if (form.mmsi) {
                  payload.mmsi = form.mmsi;
                  // Include distanceNm as fallback if AIS track returns nothing
                  if (form.distanceNm) payload.distanceNm = Number(form.distanceNm);
                } else {
                  payload.vesselName = form.vesselName;
                  payload.distanceNm = Number(form.distanceNm);
                }
                if (form.imo) payload.imo = form.imo;
                computeMutation.mutate(payload);
              }}
              disabled={computeMutation.isPending || !form.voyageId || !form.grossTonnage || !form.origin || !form.destination || !form.fuelConsumedMt || !form.departedAt || (!form.mmsi && (!form.vesselName || !form.distanceNm))}
              className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {computeMutation.isPending ? "Computing via AIS…" : "Compute & Issue Passport"}
            </button>
            {computeMutation.isError && (
              <span className="text-xs text-red-400">{computeMutation.error?.message ?? "Error"}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fleet CO₂ Emissions", value: `${formatNum(totals.totalCo2Mt)} MT`, color: "#ef4444" },
          { label: "Total Carbon Cost", value: `$${formatNum(totals.totalCarbonCostUsd)}`, color: "#f59e0b" },
          { label: "Avg Efficiency Score", value: `${totals.avgEfficiencyScore}/100`, color: "#10b981" },
          { label: "EU ETS Liability", value: `$${formatNum(totals.totalEuEtsUsd)}`, color: "#8b5cf6" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {voyages.map(voyage => (
          <div
            key={voyage.id}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-all",
              selectedId === voyage.id
                ? "bg-white/[0.06] border-white/15"
                : "bg-white/[0.02] border-white/5 hover:border-white/10",
            )}
            onClick={() => setSelectedId(selectedId === voyage.id ? null : voyage.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: CII_COLORS[voyage.ciiRating] }}
                >
                  {voyage.ciiRating}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-white/85">{voyage.vesselName}</div>
                    <DataSourceBadge source={voyage.dataSource} />
                    <Badge variant="outline" className={cn("text-[9px]", voyage.status === "completed" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-sky-400 border-sky-500/20 bg-sky-500/5")}>
                      {voyage.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-white/40">
                    {voyage.origin} → {voyage.destination} · {voyage.voyageId} · {voyage.fuelType}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-white/40">CO₂/nm</div>
                  <div className={cn("text-sm font-mono font-medium", voyage.co2PerNm < voyage.fleetAvgCo2PerNm ? "text-emerald-400" : "text-red-400")}>
                    {voyage.co2PerNm.toFixed(3)} MT
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">Efficiency</div>
                  <div
                    className="text-sm font-mono font-medium"
                    style={{ color: voyage.efficiencyScore >= 85 ? "#10b981" : voyage.efficiencyScore >= 70 ? "#f59e0b" : "#ef4444" }}
                  >
                    {voyage.efficiencyScore}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">Carbon Cost</div>
                  <div className="text-sm font-mono font-medium text-amber-400">${formatNum(voyage.carbonCostUsd)}</div>
                </div>
              </div>
            </div>

            {selectedId === voyage.id && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase mb-2">Fuel & Emissions</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-white/50">Fuel Type</span><span className="text-white/70 font-mono">{voyage.fuelType}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Fuel Consumed</span><span className="text-white/70 font-mono">{voyage.fuelConsumedMt} MT</span></div>
                      <div className="flex justify-between"><span className="text-white/50">CO₂ Emissions</span><span className="text-white/70 font-mono">{voyage.co2EmissionsMt} MT</span></div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-white/50 shrink-0">Distance</span>
                        <div className="text-right">
                          <span className="text-white/70 font-mono">{voyage.distanceNm} nm</span>
                          {voyage.trackSource && (
                            <div className={cn("text-[9px] mt-0.5 font-mono",
                              voyage.trackSource === "ais-live-track" ? "text-emerald-400" :
                              voyage.trackSource === "ais-speed-estimate" ? "text-amber-400" : "text-white/30"
                            )}>
                              {voyage.trackSource === "ais-live-track"
                                ? `AIS track · ${voyage.trackSampledPoints} pts`
                                : voyage.trackSource === "ais-speed-estimate"
                                ? `AIS speed estimate`
                                : "user-provided"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase mb-2">Performance vs Fleet</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-white/50">Your CO₂/nm</span><span className="font-mono" style={{ color: voyage.co2PerNm < voyage.fleetAvgCo2PerNm ? "#10b981" : "#ef4444" }}>{voyage.co2PerNm.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Fleet Avg</span><span className="text-white/70 font-mono">{voyage.fleetAvgCo2PerNm.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">AER</span><span className="text-white/70 font-mono">{voyage.aer.toFixed(6)}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Weather-Adj Score</span><span className="text-white/70 font-mono">{voyage.weatherAdjustedScore}%</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase mb-2">Financial Impact</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-white/50">Carbon Cost</span><span className="text-amber-400 font-mono">${formatNum(voyage.carbonCostUsd)}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">EU ETS Liability</span><span className="text-white/70 font-mono">${formatNum(voyage.euEtsLiability)}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Port Waste</span><span className="text-white/70 font-mono">{voyage.portCongestionWasteHours}h</span></div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-300/80">Carbon Passport Hash</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/60 break-all">{voyage.passportHash}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-[11px] text-white/30 flex items-center gap-2">
        <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        Emissions computed using IMO 2023 fuel emission factors (VLSFO 3.151, HFO 3.114, MGO 3.206, LNG 2.75 MT CO₂/MT fuel).
        CII ratings derived from Annual Efficiency Ratio (AER = CO₂ / GT·nm). Carbon cost at $72/MT, EU ETS at €65/MT.
      </div>
    </div>
  );
}
