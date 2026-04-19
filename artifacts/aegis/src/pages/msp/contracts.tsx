import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, AlertTriangle, CheckCircle2, Clock, DollarSign, Shield, Search, Filter, RefreshCw } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardQuery } from "@szl-holdings/api-client-react";

interface Contract {
  id: number;
  name: string;
  clientName: string;
  type: "managed-services" | "break-fix" | "project" | "security" | "cloud";
  status: "active" | "expiring" | "expired" | "pending-renewal";
  value: number;
  mrr: number;
  startDate: string;
  endDate: string;
  slaTarget: number;
  slaActual: number;
  renewalProbability: number;
  notes: string;
}

interface ContractsResponse {
  contracts: Contract[];
  total: number;
}

const typeLabels: Record<string, string> = {
  "managed-services": "Managed Services",
  "break-fix": "Break/Fix",
  project: "Project",
  security: "Security",
  cloud: "Cloud",
};

const statusConfig = {
  active: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  expiring: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  expired: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  "pending-renewal": { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: FileText },
};

function SLAGauge({ target, actual }: { target: number; actual: number }) {
  const met = actual >= target;
  const pct = Math.min((actual / target) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", met ? "bg-emerald-400" : "bg-red-400")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-mono", met ? "text-emerald-400" : "text-red-400")}>{actual}%</span>
      <span className="text-xs text-muted-foreground">/ {target}%</span>
    </div>
  );
}

function ContractCard({ contract, index }: { contract: Contract; index: number }) {
  const status = statusConfig[contract.status] || statusConfig.active;
  const StatusIcon = status.icon;
  const daysUntilEnd = contract.endDate ? Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{contract.name}</h3>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", status.color)}>
              <StatusIcon className="w-3 h-3" /> {contract.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{contract.clientName}</p>
        </div>
        <span className="px-2 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">{typeLabels[contract.type] || contract.type}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Contract Value</p>
          <p className="text-lg font-display font-bold text-foreground">${contract.value.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Renewal Probability</p>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", contract.renewalProbability >= 80 ? "bg-emerald-400" : contract.renewalProbability >= 50 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${contract.renewalProbability}%` }} />
            </div>
            <span className="text-sm font-semibold text-foreground">{contract.renewalProbability}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">SLA Compliance</p>
          <SLAGauge target={contract.slaTarget} actual={contract.slaActual} />
        </div>
      </div>

      {contract.mrr > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">MRR</p>
          <p className="text-sm font-semibold text-emerald-400">${contract.mrr.toLocaleString()}/mo</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {contract.startDate} — {contract.endDate}</span>
        </div>
        <div className="text-xs">
          {daysUntilEnd > 0 ? (
            <span className={cn(daysUntilEnd <= 90 ? "text-amber-400" : "text-muted-foreground")}>{daysUntilEnd} days remaining</span>
          ) : (
            <span className="text-red-400">Expired</span>
          )}
        </div>
      </div>

      {contract.notes && <p className="text-xs text-muted-foreground mt-3 italic">{contract.notes}</p>}
    </motion.div>
  );
}

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch } = useStandardQuery<ContractsResponse>({
    queryKey: ["msp-contracts", statusFilter],
    queryFn: () => apiFetch<ContractsResponse>(`/msp/contracts${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
    staleTime: 60_000,
  });

  const allContracts = data?.contracts ?? [];
  const filtered = allContracts.filter(c =>
    (c.clientName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = allContracts.filter(c => c.status !== "expired").reduce((s, c) => s + (c.value || 0), 0);
  const expiringCount = allContracts.filter(c => c.status === "expiring").length;
  const activeContracts = allContracts.filter(c => c.status !== "expired");
  const avgCompliance = activeContracts.length > 0
    ? Math.round(activeContracts.reduce((s, c) => s + (c.slaActual || 0), 0) / activeContracts.length * 10) / 10
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Contracts & SLAs</h1>
          <p className="text-sm text-muted-foreground mt-1">MSAs, SLA attainment, renewal timelines, and contract value by tier</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          [
            { label: "Active Contracts", value: allContracts.filter(c => c.status === "active").length.toString(), color: "text-emerald-400", icon: FileText },
            { label: "Total Contract Value", value: `$${(totalValue / 1000).toFixed(0)}K`, color: "text-primary", icon: DollarSign },
            { label: "Expiring Soon", value: expiringCount.toString(), color: "text-amber-400", icon: Clock },
            { label: "Avg SLA Compliance", value: `${avgCompliance}%`, color: avgCompliance >= 97 ? "text-emerald-400" : "text-amber-400", icon: Shield },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className={cn("text-3xl font-display font-bold mt-2", stat.color)}>{stat.value}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "active", "expiring", "expired", "pending-renewal"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No contracts found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((contract, i) => (
            <ContractCard key={contract.id} contract={contract} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
