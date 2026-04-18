import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, TrendingUp, BarChart3, Activity, RefreshCw, Building2,
  ChevronRight, DollarSign, Target, Clock, CheckCircle2, AlertTriangle,
  Link2, Layers, Zap, Globe, Plus, ArrowUpRight
} from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { motion } from "framer-motion";

interface SalesforceOpportunity {
  id: string;
  name: string;
  accountName: string;
  amount: number | null;
  stageName: string;
  closeDate: string;
  probability: number | null;
  forecastCategory: string;
  isClosed: boolean;
  isWon: boolean;
  type: string | null;
}

interface SalesforceAccount {
  id: string;
  name: string;
  industry: string;
  annualRevenue: number | null;
  numberOfEmployees: number | null;
  billingCity: string | null;
  lastActivityDate: string | null;
}

interface SalesforceLead {
  id: string;
  firstName: string | null;
  lastName: string;
  company: string;
  status: string;
  isConverted: boolean;
}

interface DynamicsOpportunity {
  id: string;
  name: string;
  accountName: string | null;
  stage: string;
  probability: number;
  estimatedRevenue: number;
  estimatedCloseDate: string;
}

interface HubSpotDeal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
}

interface CrmStatus {
  salesforce: { live: boolean; source: string };
  hubspot: { live: boolean; source: string };
  dynamics365: { live: boolean; source: string };
}

const STAGE_COLORS: Record<string, string> = {
  "Prospecting": "bg-slate-500/20 text-slate-300",
  "Qualification": "bg-blue-500/20 text-blue-300",
  "Proposal/Price Quote": "bg-purple-500/20 text-purple-300",
  "Negotiation/Review": "bg-amber-500/20 text-amber-300",
  "Closed Won": "bg-green-500/20 text-green-300",
  "Closed Lost": "bg-red-500/20 text-red-300",
  "Proposal": "bg-purple-500/20 text-purple-300",
  "Negotiation": "bg-amber-500/20 text-amber-300",
  "Closed": "bg-green-500/20 text-green-300",
  "contractsent": "bg-purple-500/20 text-purple-300",
  "qualifiedtobuy": "bg-blue-500/20 text-blue-300",
};

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function ConnectorStatus({ name, status, icon }: { name: string; status: { live: boolean; source: string }; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="text-xs text-slate-400">{status.source}</div>
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${status.live ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status.live ? "bg-green-400" : "bg-amber-400"}`} />
        {status.live ? "Live" : "Demo Mode"}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, sub, color = "blue" }: { label: string; value: string | number; icon: React.FC<{ className?: string }>; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = { blue: "text-blue-400", green: "text-green-400", amber: "text-amber-400", purple: "text-purple-400", red: "text-red-400" };
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorMap[color] ?? "text-blue-400"}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`text-xl font-bold ${colorMap[color] ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CrmIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "accounts" | "leads" | "sync">("pipeline");
  const queryClient = useQueryClient();

  const { data: sfOppsData, isLoading: sfOppsLoading } = useQuery({
    queryKey: ["crm-sf-opps"],
    queryFn: () => apiFetch<{ data: SalesforceOpportunity[] }>("/salesforce/opportunities"),
    refetchInterval: 60000,
  });

  const { data: sfAccountsData } = useQuery({
    queryKey: ["crm-sf-accounts"],
    queryFn: () => apiFetch<{ data: SalesforceAccount[] }>("/salesforce/accounts"),
    enabled: activeTab === "accounts",
  });

  const { data: sfLeadsData } = useQuery({
    queryKey: ["crm-sf-leads"],
    queryFn: () => apiFetch<{ data: SalesforceLead[] }>("/salesforce/leads"),
    enabled: activeTab === "leads",
  });

  const { data: dynOppsData } = useQuery({
    queryKey: ["crm-dyn-opps"],
    queryFn: () => apiFetch<{ data: DynamicsOpportunity[] }>("/dynamics/opportunities"),
    refetchInterval: 60000,
  });

  const { data: hsDealsData } = useQuery({
    queryKey: ["crm-hs-deals"],
    queryFn: () => apiFetch<{ data: HubSpotDeal[] }>("/hubspot/deals"),
    refetchInterval: 60000,
  });

  const syncMutation = useMutation({
    mutationFn: (crmType: string) =>
      apiFetch(`/crm/sync/${crmType}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-sf-opps"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dyn-opps"] });
      queryClient.invalidateQueries({ queryKey: ["crm-hs-deals"] });
    },
  });

  const sfOpps = sfOppsData?.data ?? [];
  const dynOpps = dynOppsData?.data ?? [];
  const hsDeals = hsDealsData?.data ?? [];
  const sfAccounts = sfAccountsData?.data ?? [];
  const sfLeads = sfLeadsData?.data ?? [];

  const allOpps = [
    ...sfOpps.filter(o => !o.isClosed).map(o => ({ ...o, source: "salesforce", value: o.amount, stage: o.stageName, closeDate: o.closeDate, weighted: (o.amount ?? 0) * ((o.probability ?? 0) / 100) })),
    ...dynOpps.map(o => ({ ...o, source: "dynamics365", value: o.estimatedRevenue, stage: o.stage, closeDate: o.estimatedCloseDate, probability: o.probability, weighted: o.estimatedRevenue * (o.probability / 100) })),
    ...hsDeals.map(d => ({ ...d, source: "hubspot", value: d.amount, stage: d.stage, accountName: "HubSpot Contact", weighted: d.amount })),
  ].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const totalPipeline = allOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);
  const weightedForecast = allOpps.reduce((sum, o) => sum + (o.weighted ?? 0), 0);
  const wonRevenue = sfOpps.filter(o => o.isWon).reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const crmStatus: CrmStatus = {
    salesforce: { live: false, source: sfOpps.length > 0 ? "Connected" : "Demo Mode" },
    hubspot: { live: false, source: hsDeals.length > 0 ? "Connected" : "Demo Mode" },
    dynamics365: { live: false, source: dynOpps.length > 0 ? "Connected" : "Demo Mode" },
  };

  const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
    salesforce: { label: "SF", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    dynamics365: { label: "DYN", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    hubspot: { label: "HS", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  };

  const tabs = [
    { id: "pipeline", label: "Unified Pipeline", icon: BarChart3 },
    { id: "accounts", label: "Accounts", icon: Building2 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "sync", label: "Sync Status", icon: RefreshCw },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070A10] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">CRM Intelligence Command</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Unified CRM Intelligence</h1>
            <p className="text-slate-400 text-sm mt-1">Salesforce · HubSpot · Dynamics 365 — Merged pipeline, deal velocity, contact engagement</p>
          </div>
          <button
            onClick={() => syncMutation.mutate("all")}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync All CRMs
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Pipeline Value" value={formatCurrency(totalPipeline)} icon={DollarSign} sub={`${allOpps.length} open deals`} color="blue" />
          <MetricCard label="Weighted Forecast" value={formatCurrency(weightedForecast)} icon={Target} sub="Probability-adjusted" color="green" />
          <MetricCard label="Closed Won (FY)" value={formatCurrency(wonRevenue)} icon={CheckCircle2} sub="From connected CRMs" color="amber" />
          <MetricCard label="CRM Sources Active" value={`${Object.values(crmStatus).filter(s => s.live).length}/3`} icon={Link2} sub="Salesforce · HubSpot · Dynamics" color="purple" />
        </div>

        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-blue-500/20 text-blue-300 shadow" : "text-slate-400 hover:text-white"}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "pipeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Merged Pipeline — All CRMs</h2>
              <div className="flex gap-2">
                {Object.entries(SOURCE_BADGE).map(([key, badge]) => (
                  <span key={key} className={`text-xs px-2 py-0.5 rounded border font-mono ${badge.color}`}>{badge.label}</span>
                ))}
              </div>
            </div>
            {sfOppsLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading pipeline...
              </div>
            ) : (
              <div className="space-y-2">
                {allOpps.map((opp, idx) => {
                  const badge = SOURCE_BADGE[opp.source];
                  const stageName = opp.stage;
                  return (
                    <motion.div
                      key={`${opp.source}-${opp.id}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                    >
                      {badge && (
                        <span className={`text-xs px-2 py-1 rounded border font-mono shrink-0 ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{opp.name}</div>
                        <div className="text-xs text-slate-400">{opp.accountName}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${STAGE_COLORS[stageName] ?? "bg-slate-500/20 text-slate-300"}`}>
                          {stageName}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">{formatCurrency(opp.value)}</div>
                          {(opp as { probability?: number | null }).probability != null && (
                            <div className="text-xs text-slate-400">{(opp as { probability?: number | null }).probability}% prob</div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 w-20 text-right">
                          {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {allOpps.length === 0 && (
                  <div className="flex items-center justify-center h-48 text-slate-400 border border-white/10 rounded-xl">
                    No pipeline data available
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Salesforce Accounts</h2>
            <div className="space-y-2">
              {sfAccounts.map(account => (
                <div key={account.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{account.name}</div>
                    <div className="text-xs text-slate-400">{account.industry} · {account.billingCity ?? "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {account.annualRevenue != null && (
                      <div className="text-sm font-semibold text-white">{formatCurrency(account.annualRevenue)}</div>
                    )}
                    {account.numberOfEmployees != null && (
                      <div className="text-xs text-slate-400">{account.numberOfEmployees.toLocaleString()} employees</div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 text-right shrink-0 w-28">
                    {account.lastActivityDate ? `Last activity ${new Date(account.lastActivityDate).toLocaleDateString()}` : "No activity"}
                  </div>
                </div>
              ))}
              {sfAccounts.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400 border border-white/10 rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading accounts...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">CRM Leads</h2>
              <div className="text-xs text-slate-400">{sfLeads.length} leads from Salesforce</div>
            </div>
            <div className="space-y-2">
              {sfLeads.map(lead => (
                <div key={lead.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{lead.firstName ?? ""} {lead.lastName}</div>
                    <div className="text-xs text-slate-400">{lead.company}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${lead.isConverted ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-300"}`}>
                      {lead.isConverted ? "Converted" : lead.status}
                    </span>
                  </div>
                </div>
              ))}
              {sfLeads.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400 border border-white/10 rounded-xl">
                  No leads loaded — expand Salesforce tab to view
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sync" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">CRM Connector Status & Sync</h2>
            <div className="space-y-3">
              <ConnectorStatus
                name="Salesforce"
                status={crmStatus.salesforce}
                icon={<Globe className="w-4 h-4 text-blue-400" />}
              />
              <ConnectorStatus
                name="HubSpot"
                status={crmStatus.hubspot}
                icon={<Globe className="w-4 h-4 text-orange-400" />}
              />
              <ConnectorStatus
                name="Microsoft Dynamics 365"
                status={crmStatus.dynamics365}
                icon={<Globe className="w-4 h-4 text-purple-400" />}
              />
            </div>

            <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Bidirectional Sync Pipeline
              </h3>
              <div className="space-y-2 text-sm text-slate-400">
                {[
                  { dir: "→", from: "External CRM", to: "Internal DB", detail: "Contact/Deal/Lead upsert" },
                  { dir: "→", from: "Terra CRM Leads", to: "Salesforce", detail: "Auto-push on lead creation" },
                  { dir: "→", from: "Compliance Engine", to: "Supervision Queue", detail: "Suitability concerns routed automatically" },
                  { dir: "→", from: "Market Data (FRED/EDGAR)", to: "Intelligence Pipeline", detail: "Cap rate alerts, comparable transactions" },
                ].map((flow, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                    <span className="font-mono text-blue-400">{flow.dir}</span>
                    <span className="font-medium text-white text-xs">{flow.from}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                    <span className="text-xs">{flow.to}</span>
                    <span className="ml-auto text-xs text-slate-500">{flow.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Manual Sync Triggers</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["salesforce", "hubspot", "dynamics365"] as const).map(crmType => (
                  <button
                    key={crmType}
                    onClick={() => syncMutation.mutate(crmType)}
                    disabled={syncMutation.isPending}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    {crmType === "salesforce" ? "Salesforce" : crmType === "hubspot" ? "HubSpot" : "Dynamics 365"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
