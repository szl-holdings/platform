import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, Building2, Monitor, Ticket, AlertTriangle, TrendingUp, TrendingDown, ChevronRight, Plus, CheckCircle, Activity } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { clients as mockClients, type Client } from "@/data/mock-data";
import { ExportButton } from "@workspace/shared-ui/data-export";

function HealthBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-400 bg-emerald-500/10" : score >= 75 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", color)}>
      {score >= 90 ? <TrendingUp className="w-3 h-3" /> : score >= 75 ? null : <TrendingDown className="w-3 h-3" />}
      {score}
    </span>
  );
}

function ContractBadge({ status }: { status: Client["contractStatus"] }) {
  const styles = {
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    expiring: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    expired: "text-red-400 bg-red-500/10 border-red-500/20",
    pending: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", styles[status])}>{status}</span>;
}

function ClientRow({ client, index }: { client: Client; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
    >
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{client.name}</p>
          <p className="text-xs text-muted-foreground">{client.industry}</p>
        </div>
      </div>
      <div className="col-span-1 text-center"><HealthBadge score={client.healthScore} /></div>
      <div className="col-span-1 text-center">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Monitor className="w-3.5 h-3.5" /> {client.deviceCount}
        </div>
      </div>
      <div className="col-span-1 text-center">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Ticket className="w-3.5 h-3.5" /> {client.openTickets}
        </div>
      </div>
      <div className="col-span-1 text-center">
        {client.criticalAlerts > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" /> {client.criticalAlerts}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>
      <div className="col-span-1 text-center"><ContractBadge status={client.contractStatus} /></div>
      <div className="col-span-1 text-center text-sm font-semibold text-foreground">${client.mrr.toLocaleString()}</div>
      <div className="col-span-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full", client.slaCompliance >= 99 ? "bg-emerald-400" : client.slaCompliance >= 95 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${client.slaCompliance}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{client.slaCompliance}%</span>
        </div>
      </div>
      <div className="col-span-1 text-center text-xs text-muted-foreground">{client.sites}</div>
      <div className="col-span-1 text-right">
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors ml-auto" />
      </div>
    </motion.div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "health" | "mrr">("health");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = mockClients
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
    .filter(c => filterStatus === "all" || c.contractStatus === filterStatus)
    .sort((a, b) => {
      if (sortBy === "health") return b.healthScore - a.healthScore;
      if (sortBy === "mrr") return b.mrr - a.mrr;
      return a.name.localeCompare(b.name);
    });

  const totalDevices = mockClients.reduce((s, c) => s + c.deviceCount, 0);
  const totalTickets = mockClients.reduce((s, c) => s + c.openTickets, 0);
  const totalMRR = mockClients.reduce((s, c) => s + c.mrr, 0);
  const avgHealth = Math.round(mockClients.reduce((s, c) => s + c.healthScore, 0) / mockClients.length);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Client health, contract status, and endpoint coverage across all managed accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            filename="msp-clients"
            csvData={mockClients.map(c => ({
              Name: c.name,
              Industry: c.industry,
              "Contract Status": c.contractStatus,
              "Health Score": c.healthScore,
              Devices: c.deviceCount,
              "Open Tickets": c.openTickets,
              "MRR ($)": c.mrr,
            }))}
            pdfTitle="Client Management Report"
            accentColor="#3b82f6"
          />
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: mockClients.length.toString(), sub: `${mockClients.filter(c => c.contractStatus === "active").length} active`, color: "text-primary", icon: CheckCircle },
          { label: "Avg Health Score", value: avgHealth.toString(), sub: avgHealth >= 85 ? "Good" : "Needs Attention", color: avgHealth >= 85 ? "text-emerald-400" : "text-amber-400", icon: Activity },
          { label: "Total Devices", value: totalDevices.toLocaleString(), sub: `${mockClients.length} organizations`, color: "text-cyan-400", icon: Monitor },
          { label: "Monthly Revenue", value: `$${(totalMRR / 1000).toFixed(1)}K`, sub: `${totalTickets} open tickets`, color: "text-violet-400", icon: Building2 },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className={cn("text-2xl font-display font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "active", "expiring", "expired", "pending"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filterStatus === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            {(["health", "mrr", "name"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", sortBy === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                {s === "mrr" ? "MRR" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
          <div className="col-span-3">Client</div>
          <div className="col-span-1 text-center">Health</div>
          <div className="col-span-1 text-center">Devices</div>
          <div className="col-span-1 text-center">Tickets</div>
          <div className="col-span-1 text-center">Alerts</div>
          <div className="col-span-1 text-center">Contract</div>
          <div className="col-span-1 text-center">MRR</div>
          <div className="col-span-1 text-center">SLA</div>
          <div className="col-span-1 text-center">Sites</div>
          <div className="col-span-1"></div>
        </div>

        <div>
          {filtered.map((client, i) => (
            <ClientRow key={client.id} client={client} index={i} />
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground">No clients match your search criteria</div>
          )}
        </div>
      </div>
    </div>
  );
}
