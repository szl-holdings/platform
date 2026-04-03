import { useState } from "react";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Clock, Ship, Loader2, Eye } from "lucide-react";
import { useSanctions, useSanctionsSummary } from "@/hooks/use-vessels-data";
import { cn } from "@szl-holdings/shared-ui/utils";

type OfacDistEntry = { status: string; count: number };
type PscDistEntry = { result: string; count: number; avgDeficiencies: number };

const ofacColors: Record<string, string> = {
  clear: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  match: "text-red-400 bg-red-500/10 border-red-500/20",
  partial_match: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const pscColors: Record<string, string> = {
  passed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  deficiency: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  detained: "text-red-400 bg-red-500/10 border-red-500/20",
  no_inspection: "text-sky-400/50 bg-sky-500/5 border-sky-500/10",
};

const SANCTION_LISTS = [
  { name: "OFAC SDN", region: "USA", entities: "12,847", lastUpdated: "2h ago" },
  { name: "EU Consolidated", region: "European Union", entities: "8,234", lastUpdated: "6h ago" },
  { name: "UK OFSI", region: "United Kingdom", entities: "4,521", lastUpdated: "1d ago" },
  { name: "UN Security Council", region: "Global", entities: "2,183", lastUpdated: "3d ago" },
];

function RiskGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/20" :
                score >= 60 ? "text-sky-400 bg-sky-500/20" :
                score >= 40 ? "text-amber-400 bg-amber-500/20" :
                "text-red-400 bg-red-500/20";
  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0", color)}>
      {score ? Math.round(score) : "—"}
    </div>
  );
}

export default function SanctionsScreeningPage() {
  const { screenings, isLoading, isLive } = useSanctions();
  const { data: summary, isLoading: summaryLoading } = useSanctionsSummary();
  const [search, setSearch] = useState("");
  const [ofacFilter, setOfacFilter] = useState<string>("all");

  const filtered = screenings.filter(s => {
    const name = (s.vesselName ?? "").toLowerCase();
    const imo = (s.vesselImo ?? "").toLowerCase();
    const owner = (s.knownOwner ?? "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || imo.includes(search.toLowerCase()) || owner.includes(search.toLowerCase());
    const matchesFilter = ofacFilter === "all" || s.ofacStatus === ofacFilter;
    return matchesSearch && matchesFilter;
  });

  const hits = screenings.filter(s => s.ofacStatus === "match").length;
  const partialMatches = screenings.filter(s => s.ofacStatus === "partial_match").length;
  const cleared = screenings.filter(s => s.ofacStatus === "clear").length;
  const detained = screenings.filter(s => s.pscResult === "detained").length;
  const opaque = screenings.filter(s => s.ownershipOpaque).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Sanctions & Compliance Screening
          </h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            {isLive ? `${screenings.length} vessels screened — live database` : "Vessel, owner, and beneficial owner screening against global sanctions lists"}
          </p>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "OFAC Matches", value: hits, color: "text-red-400", icon: AlertTriangle },
          { label: "Partial Matches", value: partialMatches, color: "text-orange-400", icon: Clock },
          { label: "Clear", value: cleared, color: "text-emerald-400", icon: CheckCircle },
          { label: "PSC Detained", value: detained, color: "text-red-400", icon: Ship },
          { label: "Opaque Ownership", value: opaque, color: "text-amber-400", icon: Eye },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">OFAC Status Distribution</h3>
            <div className="space-y-2">
              {(summary.ofacDistribution as OfacDistEntry[]).map((d) => (
                <div key={d.status} className="flex items-center gap-3">
                  <span className="text-[10px] text-sky-400/50 w-24 capitalize">{d.status.replace("_", " ")}</span>
                  <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", d.status === "clear" ? "bg-emerald-400" : d.status === "match" ? "bg-red-400" : d.status === "partial_match" ? "bg-orange-400" : "bg-amber-400")}
                      style={{ width: `${screenings.length > 0 ? (d.count / screenings.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
            {summary.stats && (
              <div className="mt-3 pt-3 border-t border-sky-500/10 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-sky-400/30">Avg Score</p>
                  <p className="text-xs font-mono text-sky-200">{Math.round(summary.stats.avgScore ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-sky-400/30">Min Score</p>
                  <p className="text-xs font-mono text-red-400">{Math.round(summary.stats.minScore ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-sky-400/30">Max Score</p>
                  <p className="text-xs font-mono text-emerald-400">{Math.round(summary.stats.maxScore ?? 0)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">PSC Inspection Results</h3>
            <div className="space-y-2">
              {(summary.pscDistribution as PscDistEntry[]).filter((d) => d.result).map((d) => (
                <div key={d.result} className="flex items-center gap-3">
                  <Badge variant="outline" className={cn("text-[9px] shrink-0", pscColors[d.result] ?? "")}>
                    {d.result?.replace("_", " ")}
                  </Badge>
                  <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", d.result === "passed" ? "bg-emerald-400" : d.result === "detained" ? "bg-red-400" : "bg-amber-400")}
                      style={{ width: `${screenings.length > 0 ? (d.count / screenings.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 w-8 text-right">{d.count}</span>
                  {d.avgDeficiencies > 0 && (
                    <span className="text-[9px] text-amber-400 font-mono">{d.avgDeficiencies.toFixed(1)} avg defic.</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-500/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vessel, IMO, or owner..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0a1628]/80 text-sky-200 placeholder:text-sky-500/30 rounded-lg border border-sky-500/20 focus:outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>
        {["all", "match", "partial_match", "clear", "pending"].map(filter => (
          <button
            key={filter}
            onClick={() => setOfacFilter(filter)}
            className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all capitalize", ofacFilter === filter ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}
          >
            {filter === "all" ? `All (${screenings.length})` : filter.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Vessel Screening Queue</span>
          <span className="ml-auto text-[10px] text-sky-400/40">{filtered.length} records</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin mr-2" />
            <span className="text-sm text-sky-400/50">Loading sanctions data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShieldAlert className="w-8 h-8 text-sky-400/20 mx-auto mb-2" />
            <p className="text-sm text-sky-400/40">No vessels match current filters</p>
          </div>
        ) : (
          <div className="divide-y divide-sky-500/5">
            {filtered.slice(0, 50).map(s => (
              <div key={s.id} className={cn("px-4 py-3 hover:bg-sky-500/5 transition-colors", s.ofacStatus === "match" ? "border-l-2 border-red-500/40" : s.ofacStatus === "partial_match" ? "border-l-2 border-orange-500/40" : "border-l-2 border-transparent")}>
                <div className="flex items-center gap-3">
                  <RiskGauge score={parseFloat(s.complianceScore ?? "0")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-sky-100">{s.vesselName ?? `Vessel #${s.vesselId}`}</span>
                      {s.vesselImo && <span className="text-[10px] font-mono text-sky-400/50">IMO {s.vesselImo}</span>}
                      <Badge variant="outline" className={cn("text-[9px]", ofacColors[s.ofacStatus] ?? "")}>
                        OFAC: {s.ofacStatus?.replace("_", " ")}
                      </Badge>
                      {s.pscResult && s.pscResult !== "no_inspection" && (
                        <Badge variant="outline" className={cn("text-[9px]", pscColors[s.pscResult] ?? "")}>
                          PSC: {s.pscResult?.replace("_", " ")}
                        </Badge>
                      )}
                      {s.ownershipOpaque && (
                        <Badge variant="outline" className="text-[9px] text-amber-400 bg-amber-500/10 border-amber-500/20">
                          Opaque Ownership
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-sky-400/50">
                        {s.vesselType ?? "—"} · Flag: {s.flagState ?? s.vesselFlag ?? "—"}
                      </span>
                      {s.knownOwner && <span className="text-[10px] text-sky-400/40">Owner: {s.knownOwner}</span>}
                      {s.knownManager && <span className="text-[10px] text-sky-400/30">Mgr: {s.knownManager}</span>}
                    </div>
                    {(s.matchedLists?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.matchedLists!.map(l => (
                          <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{l}</span>
                        ))}
                        {s.matchConfidence && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">{parseFloat(s.matchConfidence).toFixed(0)}% confidence</span>
                        )}
                      </div>
                    )}
                    {s.pscDeficiencies != null && s.pscDeficiencies > 0 && (
                      <p className="text-[9px] text-orange-400 mt-1">{s.pscDeficiencies} PSC deficiencies recorded</p>
                    )}
                    {s.notes && (
                      <p className="text-[9px] text-sky-400/40 mt-1 italic">{s.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[9px] font-mono text-sky-400/30">
                        Screened {new Date(s.screeningDate).toLocaleDateString()}
                      </span>
                      {s.euStatus !== "clear" && (
                        <Badge variant="outline" className={cn("text-[9px]", ofacColors[s.euStatus] ?? "")}>
                          EU: {s.euStatus?.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length > 50 && (
              <div className="px-4 py-3 text-center text-[10px] text-sky-400/30">
                Showing 50 of {filtered.length} vessels
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Sanctions Lists Monitored</span>
        </div>
        <div className="divide-y divide-sky-500/5">
          {SANCTION_LISTS.map(list => (
            <div key={list.name} className="px-4 py-3 flex items-center justify-between hover:bg-sky-500/5 transition-colors">
              <div>
                <p className="text-xs font-semibold text-sky-100">{list.name}</p>
                <p className="text-[10px] text-sky-400/50">{list.region} · {list.entities} entities</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[9px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20">Active</Badge>
                <p className="text-[9px] text-sky-400/30 mt-1">Updated {list.lastUpdated}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
