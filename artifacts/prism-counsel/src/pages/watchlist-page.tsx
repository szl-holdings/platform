import { AlertTriangle, Clock, FileWarning, Eye, TrendingDown, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { WATCHLIST_ITEMS } from "../data/ny-data";

const RISK_COLORS: Record<string, string> = {
  critical: "#c45a4a",
  high: "#c8953c",
  medium: "#d4a054",
  low: "#4a90b8",
};

const RISK_ICONS: Record<string, typeof AlertTriangle> = {
  deadline_breach: Clock,
  demand_readiness: FileWarning,
  evidence_gap: AlertTriangle,
  insurer_silence: Eye,
  strategy: TrendingDown,
  no_fault_clock: Shield,
};

export default function WatchlistPage() {
  const grouped = WATCHLIST_ITEMS.reduce((acc, item) => {
    if (!acc[item.riskLevel]) acc[item.riskLevel] = [];
    acc[item.riskLevel].push(item);
    return acc;
  }, {} as Record<string, typeof WATCHLIST_ITEMS>);

  const order = ["critical", "high", "medium", "low"];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Watchlist</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">
            {WATCHLIST_ITEMS.length} ACTIVE
          </span>
        </div>
        <p className="text-xs text-slate-500">Matters and signals requiring immediate attention — sorted by risk severity</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {order.map((level) => {
          const count = grouped[level]?.length || 0;
          return (
            <div key={level} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[level] }} />
                <span className="text-[10px] font-medium text-slate-400 uppercase">{level}</span>
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{count}</div>
            </div>
          );
        })}
      </div>

      {order.map((level) => {
        const items = grouped[level];
        if (!items?.length) return null;
        return (
          <div key={level} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[level] }} />
              <h2 className="text-sm font-semibold text-slate-200 uppercase">{level} Risk</h2>
            </div>
            {items.map((item, i) => {
              const Icon = RISK_ICONS[item.riskType] || AlertTriangle;
              return (
                <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-start gap-4" style={{ background: "#0c1220" }}>
                  <div className="mt-0.5">
                    <Icon className="w-4 h-4" style={{ color: RISK_COLORS[item.riskLevel] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-200">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <Link href={`/prism-counsel/matters/${item.matterId}`}>
                        <span className="text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1">
                          {item.matterTitle} <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </Link>
                      <span>{item.caseNumber}</span>
                      <span>Assigned: {item.assignedTo}</span>
                      {item.daysUntil !== null && (
                        <span className="font-mono" style={{ color: item.daysUntil <= 14 ? RISK_COLORS[item.riskLevel] : undefined }}>
                          {item.daysUntil}d remaining
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-600">{item.lastUpdated}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
