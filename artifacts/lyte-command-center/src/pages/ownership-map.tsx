import { AlertTriangle, CheckCircle2, HelpCircle, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { ownershipMap, severityColors, type OwnershipRecord } from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const statusConfig = {
  clear: {
    label: "Clear",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  ambiguous: {
    label: "Ambiguous",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    icon: HelpCircle,
    dot: "bg-amber-500",
  },
  missing: {
    label: "Missing",
    color: "text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    icon: AlertTriangle,
    dot: "bg-red-500 animate-pulse",
  },
};

function OwnerCard({ record }: { record: OwnershipRecord }) {
  const s = statusConfig[record.status];
  const Icon = s.icon;

  return (
    <div className={cn("rounded-xl p-4 border transition-all hover:bg-white/[0.04]", s.border, s.bg)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", s.dot)} />
          <div>
            <h3 className="text-sm font-medium text-white/90 leading-tight mb-0.5">{record.area}</h3>
            <div className="text-[11px] text-slate-500">{record.team}</div>
          </div>
        </div>
        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide flex items-center gap-1", s.color, s.border)}>
          <Icon className="w-2.5 h-2.5" />
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-slate-600 mb-0.5">Owner</div>
          <div className={cn("font-medium", record.owner ? "text-white" : "text-red-400")}>{record.owner || "Unassigned"}</div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5">Open Items</div>
          <div className="text-white font-mono">{record.openItems}</div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5">Stalled</div>
          <div className={cn("font-mono font-semibold", record.stalledItems > 0 ? s.color : "text-emerald-400")}>
            {record.stalledItems}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Value at risk</span>
        <span className={cn("font-mono font-semibold", s.color)}>{formatCurrency(record.valueAtRisk)}</span>
      </div>
    </div>
  );
}

export default function OwnershipMapPage() {
  const missing = ownershipMap.filter(r => r.status === "missing");
  const ambiguous = ownershipMap.filter(r => r.status === "ambiguous");
  const clear = ownershipMap.filter(r => r.status === "clear");

  const totalVaRAtRisk = [...missing, ...ambiguous].reduce((sum, r) => sum + r.valueAtRisk, 0);
  const totalMissingItems = missing.reduce((sum, r) => sum + r.stalledItems, 0);

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Ownership Map</h1>
        <p className="text-sm text-slate-400 mt-1">Where accountability is clear, ambiguous, or missing across your business</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Missing Owner", value: missing.length, color: "text-red-400", bg: "border-red-500/20 bg-red-500/5" },
          { label: "Ambiguous", value: ambiguous.length, color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
          { label: "Clear Ownership", value: clear.length, color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "VaR Without Owner", value: formatCurrency(totalVaRAtRisk), color: "text-red-300", bg: "border-red-500/20 bg-red-500/5" },
        ].map(stat => (
          <div key={stat.label} className={cn("rounded-xl p-4 border", stat.bg)}>
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn("font-display font-bold text-xl", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {missing.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="font-display font-semibold text-sm text-red-300">Missing Owner — Immediate Risk</h2>
                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{missing.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {missing.map(r => <OwnerCard key={r.id} record={r} />)}
              </div>
            </div>
          )}

          {ambiguous.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h2 className="font-display font-semibold text-sm text-amber-300">Ambiguous — Clarity Required</h2>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{ambiguous.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ambiguous.map(r => <OwnerCard key={r.id} record={r} />)}
              </div>
            </div>
          )}

          {clear.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-semibold text-sm text-emerald-300">Clear Ownership</h2>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{clear.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {clear.map(r => <OwnerCard key={r.id} record={r} />)}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="font-display font-semibold text-sm text-white mb-4">Ownership Health</h3>
            <div className="space-y-3">
              {[
                { label: "Clear", count: clear.length, color: "bg-emerald-500", pct: (clear.length / ownershipMap.length) * 100 },
                { label: "Ambiguous", count: ambiguous.length, color: "bg-amber-500", pct: (ambiguous.length / ownershipMap.length) * 100 },
                { label: "Missing", count: missing.length, color: "bg-red-500", pct: (missing.length / ownershipMap.length) * 100 },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">{bar.label}</span>
                    <span className="text-white font-mono">{bar.count} ({bar.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", bar.color)} style={{ width: `${bar.pct}%`, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="font-display font-semibold text-sm text-red-300">Top Risk Areas</h3>
            </div>
            <div className="space-y-2">
              {[...missing, ...ambiguous]
                .sort((a, b) => b.valueAtRisk - a.valueAtRisk)
                .slice(0, 4)
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate flex-1 mr-2">{r.area}</span>
                    <span className={cn("font-mono shrink-0", r.status === "missing" ? "text-red-400" : "text-amber-400")}>
                      {formatCurrency(r.valueAtRisk)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="font-display font-semibold text-sm text-white mb-3">Stalled Items</h3>
            <div className="space-y-2">
              {ownershipMap
                .filter(r => r.stalledItems > 0)
                .sort((a, b) => b.stalledItems - a.stalledItems)
                .map(r => {
                  const s = statusConfig[r.status];
                  return (
                    <div key={r.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 truncate flex-1 mr-2">{r.area}</span>
                      <span className={cn("font-mono font-semibold shrink-0", s.color)}>{r.stalledItems} stalled</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
