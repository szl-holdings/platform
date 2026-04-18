import { useState, useEffect, useCallback } from "react";
import type { ComponentType, CSSProperties } from "react";
import { motion } from "framer-motion";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Building2, MapPin, Users, DollarSign, TrendingUp, Calendar,
  Wrench, User, AlertTriangle, Download, Loader2, CheckCircle, Clock,
  FileText, Shield, Activity, Target, Tag, LayoutDashboard
} from "lucide-react";
import { AtlasScenePanel } from "@/components/atlas-scene-panel";
import { CommentThread, ActivityFeed } from "@szl-holdings/shared-ui/collaboration";
import { OperationalQueueRow, type OperationalEntity } from "@szl-holdings/shared-ui";
import { properties, tenants, alerts } from "@/data/portfolio";
import { cn } from "@szl-holdings/shared-ui/utils";
import { gqlFetch, type GqlTerraActionItem } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

async function downloadPropertyPDF(
  property: Record<string, unknown>,
  extras: { distressScore?: number; investmentThesis?: string; distressFactors?: string[] } = {}
): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "terra-property-report",
      data: { property, ...extras },
    }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `terra-${(property.id as string) || "property"}-report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const statusConfig: Record<string, { label: string; color: string; border: string }> = {
  performing: { label: "Performing", color: "text-emerald-400", border: "border-emerald-500/30" },
  watch: { label: "Watch List", color: "text-amber-400", border: "border-amber-500/30" },
  critical: { label: "Critical", color: "text-rose-400", border: "border-rose-500/30" },
};

const tenantStatusColors: Record<string, string> = {
  active: "text-emerald-400",
  expiring: "text-amber-400",
  delinquent: "text-rose-400",
};

const maintenanceItems = [
  { id: "m-001", task: "HVAC System Inspection", priority: "high", dueDate: "2026-04-05", status: "overdue", cost: 12500, assignee: "Facilities — R. Torres" },
  { id: "m-002", task: "Elevator Modernization Phase 2", priority: "medium", dueDate: "2026-04-15", status: "scheduled", cost: 85000, assignee: "Capital Projects — M. Singh" },
  { id: "m-003", task: "Roof Membrane Replacement (Bldg B)", priority: "medium", dueDate: "2026-05-01", status: "scheduled", cost: 42000, assignee: "Capital Projects — M. Singh" },
  { id: "m-004", task: "Parking Lot Resurfacing", priority: "low", dueDate: "2026-06-15", status: "planned", cost: 28000, assignee: "Facilities — R. Torres" },
  { id: "m-005", task: "Fire Suppression System Test", priority: "high", dueDate: "2026-04-01", status: "scheduled", cost: 4500, assignee: "Life Safety — J. Okafor" },
];

const OWNERSHIP_RECORDS = {
  "prop-001": {
    entity: "Meridian Capital Holdings LLC",
    type: "LLC",
    jurisdiction: "Delaware",
    principals: ["S. Lutar (GP — 60%)", "Pacific Arbor Partners (LP — 25%)", "Management Carry (15%)"],
    lender: "Wells Fargo Real Estate Capital",
    loanBalance: "$41.2M",
    maturityDate: "2028-06-15",
    ltv: "57%",
    dscr: "1.38x",
    counsel: "Morrison Foerster LLP",
    lastTransfer: "2021-06-15",
    sourceLabel: "County Recorder · ACRIS",
    freshness: "Verified 2 days ago",
  },
  "prop-002": {
    entity: "PHPlaza Investors LP",
    type: "Limited Partnership",
    jurisdiction: "California",
    principals: ["SZL Holdings (GP — 55%)", "Sovereign Capital Partners (LP — 30%)", "Pacific Pension Trust (LP — 15%)"],
    lender: "JPMorgan Chase Real Estate",
    loanBalance: "$63.8M",
    maturityDate: "2027-03-20",
    ltv: "59%",
    dscr: "1.22x",
    counsel: "Latham & Watkins LLP",
    lastTransfer: "2020-03-20",
    sourceLabel: "County Assessor · Title Report",
    freshness: "Verified 5 days ago",
  },
  "prop-007": {
    entity: "Skyline Lofts Chicago LLC",
    type: "LLC",
    jurisdiction: "Illinois",
    principals: ["S. Lutar (GP — 70%)", "Midwest RE Fund II (LP — 30%)"],
    lender: "Signature Bank RE Division",
    loanBalance: "$16.8M",
    maturityDate: "2026-09-14",
    ltv: "78%",
    dscr: "0.94x",
    counsel: "Kirkland & Ellis LLP",
    lastTransfer: "2023-02-14",
    sourceLabel: "Cook County Recorder",
    freshness: "Verified 1 day ago",
  },
};

const DILIGENCE_CHECKLISTS: Record<string, {
  item: string;
  status: "complete" | "in-progress" | "pending" | "flagged";
  assignee: string;
  due?: string;
  note?: string;
}[]> = {
  "prop-001": [
    { item: "Title report reviewed", status: "complete", assignee: "Legal — M. Osei", note: "Clear title, no liens" },
    { item: "Phase I Environmental", status: "complete", assignee: "Environmental — K. Walsh", note: "No RECs identified" },
    { item: "Structural inspection", status: "complete", assignee: "Engineering — B. Park", note: "Minor deferred maintenance only" },
    { item: "Rent roll verification", status: "in-progress", assignee: "Asset Mgmt — D. Kim", due: "2026-04-10" },
    { item: "Lease abstract review", status: "in-progress", assignee: "Legal — M. Osei", due: "2026-04-12" },
    { item: "HVAC/MEP assessment", status: "flagged", assignee: "Engineering — B. Park", note: "HVAC replacement may require $500K capex" },
    { item: "Insurance review", status: "complete", assignee: "Risk — T. Allen" },
    { item: "Lender estoppel", status: "pending", assignee: "Legal — M. Osei", due: "2026-04-20" },
  ],
  "prop-007": [
    { item: "Title report reviewed", status: "complete", assignee: "Legal — M. Osei" },
    { item: "Phase I Environmental", status: "in-progress", assignee: "Environmental — K. Walsh", due: "2026-04-08" },
    { item: "Structural inspection", status: "pending", assignee: "Engineering — B. Park", due: "2026-04-15" },
    { item: "Rent roll verification", status: "flagged", assignee: "Asset Mgmt — D. Kim", note: "Delinquency cluster in units 4B–4F" },
    { item: "Operating statements (T12)", status: "in-progress", assignee: "Finance — J. Okafor", due: "2026-04-05" },
    { item: "Loan payoff quote", status: "complete", assignee: "Capital Markets — R. Torres", note: "Maturity 9/14/26 — refinance urgency high" },
    { item: "Lender approval / consent", status: "pending", assignee: "Legal — M. Osei", due: "2026-04-25" },
    { item: "Remediation cost estimate", status: "flagged", assignee: "Engineering — B. Park", note: "Deferred maintenance: ~$2.1M estimate" },
  ],
};

const ACTION_ITEMS: Record<string, {
  id: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  owner: string;
  ownerRole: string;
  due: string;
  status: "open" | "in-progress" | "resolved";
  action: string;
}[]> = {
  "prop-007": [
    { id: "act-001", issue: "Occupancy at 68.4% — 30 units vacant", severity: "critical", owner: "D. Kim", ownerRole: "Asset Mgmt", due: "2026-04-15", status: "in-progress", action: "Activate leasing incentive program; engage Compass multifamily team" },
    { id: "act-002", issue: "Sterling Design Studio — 45 days past due, $6,400", severity: "critical", owner: "T. Allen", ownerRole: "Risk & Collections", due: "2026-04-07", status: "open", action: "Demand letter sent; escalate to eviction counsel if unpaid by Apr 7" },
    { id: "act-003", issue: "Loan maturity Sept 2026 — DSCR at 0.94x", severity: "critical", owner: "R. Torres", ownerRole: "Capital Markets", due: "2026-05-01", status: "open", action: "Engage lender for maturity extension; simultaneously market for refi" },
    { id: "act-004", issue: "Deferred maintenance estimate $2.1M", severity: "high", owner: "B. Park", ownerRole: "Engineering", due: "2026-04-30", status: "open", action: "Complete scope + bid by Apr 30; include in lender remediation plan" },
  ],
  "prop-005": [
    { id: "act-005", issue: "Retail occupancy 78.1% — 7 units vacant", severity: "high", owner: "D. Kim", ownerRole: "Asset Mgmt", due: "2026-04-20", status: "open", action: "Tenant incentive program — 3 months free rent for 5+ year leases" },
    { id: "act-006", issue: "Luna Boutique lease expiring Jun 2026", severity: "medium", owner: "M. Osei", ownerRole: "Legal", due: "2026-05-01", status: "open", action: "Send renewal proposal with updated market terms" },
  ],
  "prop-001": [
    { id: "act-007", issue: "HVAC Building B overdue maintenance", severity: "medium", owner: "R. Torres", ownerRole: "Facilities", due: "2026-04-05", status: "in-progress", action: "Vendor contracted; work order #WO-2026-0847 active" },
    { id: "act-008", issue: "Horizon Tech Labs lease expires May 2026", severity: "medium", owner: "M. Osei", ownerRole: "Legal", due: "2026-04-15", status: "open", action: "Schedule renewal conversation; assess market rate delta" },
  ],
};

const SOURCE_LABELS: Record<string, { source: string; freshness: string; confidence: string }> = {
  "prop-001": { source: "Internal → Asset Management System", freshness: "Updated 2h ago", confidence: "High" },
  "prop-002": { source: "Internal → Asset Management System", freshness: "Updated 3h ago", confidence: "High" },
  "prop-003": { source: "Internal → Asset Management System", freshness: "Updated 5h ago", confidence: "High" },
  "prop-004": { source: "Internal → Asset Management System", freshness: "Updated 1h ago", confidence: "High" },
  "prop-005": { source: "Internal → Asset Management System", freshness: "Updated 4h ago", confidence: "Medium" },
  "prop-006": { source: "Internal → Asset Management System", freshness: "Updated 2h ago", confidence: "High" },
  "prop-007": { source: "Internal → Asset Management System", freshness: "Updated 30m ago", confidence: "High" },
  "prop-008": { source: "Internal → Asset Management System", freshness: "Updated 6h ago", confidence: "High" },
};

interface TooltipPayloadEntry {
  name: string;
  value: number | string;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-xl text-xs" style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-semibold text-white/90 mb-2">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span style={{ color: "rgba(255,255,255,0.4)" }}>{item.name}:</span>
          <span className="text-white/80 font-medium">{typeof item.value === "number" ? formatCurrency(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

function FreshnessTag({ label, confidence }: { label: string; confidence?: string }) {
  const confColor = confidence === "High" ? "#10b981" : confidence === "Medium" ? "#f59e0b" : "rgba(255,255,255,0.3)";
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
      <Clock className="w-2.5 h-2.5" style={{ color: confColor }} />
      {label}
      {confidence && <span style={{ color: confColor, marginLeft: 2 }}>{confidence}</span>}
    </span>
  );
}

function ProvenanceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: "rgba(200,160,96,0.04)", border: "1px solid rgba(200,160,96,0.1)", color: "rgba(200,160,96,0.5)" }}>
      <Tag className="w-2.5 h-2.5" />
      {source}
    </span>
  );
}

function DiligenceStatus({ status }: { status: "complete" | "in-progress" | "pending" | "flagged" }) {
  const configs = {
    complete: { label: "Complete", icon: CheckCircle, color: "#10b981" },
    "in-progress": { label: "In Progress", icon: Activity, color: "#3b82f6" },
    pending: { label: "Pending", icon: Clock, color: "rgba(255,255,255,0.3)" },
    flagged: { label: "Flagged", icon: AlertTriangle, color: "#ef4444" },
  };
  const c = configs[status];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
      style={{ color: c.color, background: `${c.color}12` }}>
      <c.icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function ActionSeverityBadge({ severity }: { severity: string }) {
  const colors = {
    critical: { text: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    high: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    medium: { text: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    low: { text: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.04)" },
  };
  const c = colors[severity as keyof typeof colors] || colors.low;
  return (
    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
      style={{ color: c.text, background: c.bg }}>
      {severity}
    </span>
  );
}

type DetailTab = "overview" | "ownership" | "diligence" | "actions" | "atlas";

const GQL_ACTION_ITEMS = `
  query TerraActionItems($propertyId: String) {
    terraActionItems(propertyId: $propertyId, limit: 20) {
      id externalId propertyId issue severity ownerName ownerRole dueDate status recommendedAction resolvedAt updatedAt
    }
  }
`;

const GQL_SEED_ACTIONS = `
  mutation SeedTerraActionItems($propertyId: String!) {
    seedTerraActionItems(propertyId: $propertyId) {
      id externalId propertyId issue severity ownerName ownerRole dueDate status recommendedAction resolvedAt updatedAt
    }
  }
`;

const GQL_UPDATE_ACTION = `
  mutation UpdateTerraActionItem($id: ID!, $status: String) {
    updateTerraActionItem(id: $id, status: $status) {
      id status resolvedAt updatedAt
    }
  }
`;

export default function PropertyDetailPage() {
  const [, params] = useRoute("/property/:id");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [liveActionItems, setLiveActionItems] = useState<GqlTerraActionItem[] | null>(null);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null);
  const property = properties.find(p => p.id === params?.id);

  const loadActionItems = useCallback(async (propertyId: string) => {
    setActionItemsLoading(true);
    try {
      const data = await gqlFetch<{ terraActionItems: GqlTerraActionItem[] }>(GQL_ACTION_ITEMS, { propertyId });
      if (data.terraActionItems.length === 0) {
        const seeded = await gqlFetch<{ seedTerraActionItems: GqlTerraActionItem[] }>(GQL_SEED_ACTIONS, { propertyId });
        setLiveActionItems(seeded.seedTerraActionItems);
      } else {
        setLiveActionItems(data.terraActionItems);
      }
    } catch {
      setLiveActionItems(null);
    } finally {
      setActionItemsLoading(false);
    }
  }, []);

  const updateActionStatus = useCallback(async (id: string, status: string, propertyId: string) => {
    setUpdatingActionId(id);
    try {
      await gqlFetch<{ updateTerraActionItem: GqlTerraActionItem }>(GQL_UPDATE_ACTION, { id, status });
      await loadActionItems(propertyId);
    } catch {
      // Silently fail — UI reflects optimistic local update
    } finally {
      setUpdatingActionId(null);
    }
  }, [loadActionItems]);

  useEffect(() => {
    if (params?.id && activeTab === "actions") {
      loadActionItems(params.id);
    }
  }, [params?.id, activeTab, loadActionItems]);

  if (!property) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Property not found</p>
          <Link href="/dashboard">
            <span className="text-sm mt-2 inline-block cursor-pointer hover:underline" style={{ color: "#40856a" }}>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[property.status];
  const propertyTenants = tenants.filter(t => t.propertyId === property.id);
  const propertyAlerts = alerts.filter(a => a.propertyId === property.id);
  const appreciation = ((property.value - property.purchasePrice) / property.purchasePrice * 100).toFixed(1);
  const ownership = OWNERSHIP_RECORDS[property.id as keyof typeof OWNERSHIP_RECORDS];
  const diligence = DILIGENCE_CHECKLISTS[property.id as keyof typeof DILIGENCE_CHECKLISTS] || [];
  const staticActionItems = ACTION_ITEMS[property.id as keyof typeof ACTION_ITEMS] || [];
  const isLiveData = liveActionItems !== null;
  const actionItems: GqlTerraActionItem[] = liveActionItems ?? staticActionItems.map(a => ({
    id: a.id,
    externalId: a.id,
    propertyId: property.id,
    issue: a.issue,
    severity: a.severity,
    ownerName: a.owner,
    ownerRole: a.ownerRole,
    dueDate: a.due,
    status: a.status.replace("-", "_"),
    recommendedAction: a.action,
    resolvedAt: null,
    createdAt: "",
    updatedAt: "",
  }));
  const sourceInfo = SOURCE_LABELS[property.id as keyof typeof SOURCE_LABELS];

  const seedMultipliers = [0.94, 0.97, 1.0, 0.96, 1.02, 1.04, 1.01, 0.98, 1.05, 1.03, 1.06, 1.08];
  const expenseRatios = [0.62, 0.60, 0.61, 0.63, 0.59, 0.60, 0.64, 0.62, 0.61, 0.63, 0.60, 0.59];
  const financialHistory = seedMultipliers.map((mult, i) => {
    const rev = Math.round(property.monthlyRevenue * mult);
    const exp = Math.round(rev * expenseRatios[i]);
    return {
      month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
      revenue: rev, expenses: exp, noi: rev - exp,
    };
  });

  const occupancyData = [
    { name: "Occupied", value: property.occupancy },
    { name: "Vacant", value: 100 - property.occupancy },
  ];
  const OCCI_COLORS = ["#10b981", "#1e293b"];

  type LucideIcon = ComponentType<{ className?: string; style?: CSSProperties }>;
  const tabs: { id: DetailTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "ownership", label: "Ownership & Debt", icon: Shield },
    { id: "diligence", label: "Diligence", icon: FileText, count: diligence.filter(d => d.status === "flagged").length || undefined },
    { id: "actions", label: "Action Routing", icon: Target, count: actionItems.filter(a => a.status !== "resolved").length || undefined },
    { id: "atlas", label: "ATLAS Scene", icon: Activity },
  ];

  return (
    <div className="space-y-4 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-sm mb-4 cursor-pointer transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </span>
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{property.name}</h1>
              <span className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide border", status.color, status.border)}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <MapPin className="w-3.5 h-3.5" />{property.address}, {property.city}, {property.state}
              </span>
              {sourceInfo && (
                <>
                  <ProvenanceTag source={sourceInfo.source} />
                  <FreshnessTag label={sourceInfo.freshness} confidence={sourceInfo.confidence} />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/lender-report">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "rgba(64,133,106,0.1)", border: "1px solid rgba(64,133,106,0.2)", color: "#40856a" }}>
                <FileText className="w-3.5 h-3.5" />
                Reporting Pack
              </button>
            </Link>
            <button
              onClick={async () => {
                setDownloading(true);
                const distressScore = property.status === "critical" ? 78 : property.status === "watch" ? 45 : 18;
                const tenantDelinquency = propertyTenants.filter(t => t.status === "delinquent").length;
                const leaseExpiring = propertyTenants.filter(t => t.status === "expiring").length;
                const investmentThesis = property.status === "critical"
                  ? `${property.name} exhibits elevated distress signals. Below-market occupancy (${property.occupancy}%), ${tenantDelinquency > 0 ? `${tenantDelinquency} delinquent tenant(s), ` : ""}and a cap rate of ${property.capRate}% imply repricing opportunity.`
                  : `${property.name} is a ${property.status} asset with ${property.occupancy}% occupancy and ${property.capRate}% cap rate generating ${formatCurrency(property.annualNOI)} annual NOI.`;
                const distressFactors = [
                  `Occupancy rate: ${property.occupancy}%`,
                  `Cap rate: ${property.capRate}%`,
                  ...(tenantDelinquency > 0 ? [`${tenantDelinquency} delinquent tenant(s)`] : []),
                  ...(leaseExpiring > 0 ? [`${leaseExpiring} expiring lease(s)`] : []),
                ];
                try {
                  await downloadPropertyPDF(property as unknown as Record<string, unknown>, { distressScore, investmentThesis, distressFactors });
                } catch { setDownloadError("PDF generation failed."); } finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloading ? "Generating..." : "Export PDF"}
            </button>
          </div>
        </div>
        {downloadError && <p className="text-[10px] text-rose-400 mt-1">{downloadError}</p>}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Property Value", value: formatCurrency(property.value), icon: Building2 },
          { label: "Monthly Revenue", value: formatCurrency(property.monthlyRevenue), icon: DollarSign },
          { label: "Annual NOI", value: formatCurrency(property.annualNOI), icon: TrendingUp },
          { label: "Cap Rate", value: `${property.capRate}%`, icon: TrendingUp },
          { label: "Occupancy", value: `${property.occupancy}%`, icon: Users },
          { label: "Appreciation", value: `+${appreciation}%`, icon: TrendingUp },
        ].map((metric, i) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <metric.icon className="w-4 h-4 mb-2" style={{ color: "rgba(255,255,255,0.25)" }} />
            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{metric.label}</p>
            <p className="text-lg font-bold text-white">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative"
            style={{
              color: activeTab === tab.id ? "#40856a" : "rgba(255,255,255,0.4)",
              borderBottom: activeTab === tab.id ? "2px solid #40856a" : "2px solid transparent",
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-4 text-sm">Financial Performance (12 mo)</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialHistory}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="noiGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1e3).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="noi" name="NOI" stroke="#10b981" fill="url(#noiGrad2)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-4 text-sm">Occupancy</h3>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={4} dataKey="value">
                      {occupancyData.map((_, idx) => (<Cell key={idx} fill={OCCI_COLORS[idx]} />))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-2">
                <p className="text-3xl font-bold text-white">{property.occupancy}%</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {property.units} units · {Math.round(property.units * (1 - property.occupancy / 100))} vacant
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: "#3b82f6" }} />
                <h3 className="font-bold text-white text-sm">Tenants</h3>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>({propertyTenants.length})</span>
              </div>
              {propertyTenants.length > 0 ? (
                <div className="space-y-2">
                  {propertyTenants.map(tenant => (
                    <div key={tenant.id} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-white/80">{tenant.name}</p>
                        <span className={cn("text-[10px] font-bold uppercase", tenantStatusColors[tenant.status])}>{tenant.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>{tenant.unit}</span>
                        <span>{formatCurrency(tenant.monthlyRent)}/mo</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {new Date(tenant.leaseEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.3)" }}>No tenant data available</p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <h3 className="font-bold text-white text-sm">Maintenance Schedule</h3>
              </div>
              <div className="space-y-2">
                {maintenanceItems.map(item => (
                  <div key={item.id} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white/80">{item.task}</p>
                      <span className={cn("text-[10px] font-bold uppercase",
                        item.status === "overdue" ? "text-rose-400" : item.status === "scheduled" ? "text-amber-400" : "text-white/30"
                      )}>{item.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <span className={cn("uppercase font-semibold text-[10px]",
                        item.priority === "high" ? "text-rose-400" : item.priority === "medium" ? "text-amber-400" : "text-white/30"
                      )}>{item.priority}</span>
                      <span>Due {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span>{formatCurrency(item.cost)}</span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{item.assignee}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{ color: "#b8943c" }} />
              <h3 className="font-bold text-white text-sm">Lease Abstraction</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#b8943c", background: "rgba(184,148,60,0.08)", border: "1px solid rgba(184,148,60,0.2)" }}>AI-Extracted</span>
              <Link href="/lease-abstraction" className="ml-auto text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Full Module <Activity className="w-3 h-3" />
              </Link>
            </div>
            {propertyTenants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      {["Tenant", "Suite", "Base Rent/Mo", "Lease Expiry", "Escalation", "AI Confidence"].map(h => (
                        <th key={h} className="text-left pb-2 font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {propertyTenants.map((tenant, i) => {
                      const mockConfidence = 88 + (i * 4 % 12);
                      const mockEscalation = ["3% annual", "2.5% annual", "CPI capped 3%"][i % 3];
                      const confColor = mockConfidence >= 90 ? "#40856a" : "#b8943c";
                      return (
                        <tr key={tenant.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                          <td className="py-2 font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{tenant.name}</td>
                          <td className="py-2" style={{ color: "rgba(255,255,255,0.4)" }}>{tenant.unit}</td>
                          <td className="py-2 font-mono font-bold" style={{ color: "#b8943c" }}>{formatCurrency(tenant.monthlyRent)}</td>
                          <td className="py-2" style={{ color: new Date(tenant.leaseEnd) < new Date(Date.now() + 365 * 86400000) ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>
                            {new Date(tenant.leaseEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </td>
                          <td className="py-2" style={{ color: "rgba(255,255,255,0.4)" }}>{mockEscalation}</td>
                          <td className="py-2">
                            <span className="font-mono font-bold" style={{ color: confColor }}>{mockConfidence}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>No lease documents abstracted — upload via Lease Abstraction module</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CommentThread entityType="property" entityId={property.id} title="Property Discussion" collapsible={false} />
            <ActivityFeed entityType="property" title="Portfolio Activity" limit={6} compact />
          </motion.div>

          {propertyAlerts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <h3 className="font-bold text-white text-sm">Property Alerts</h3>
              </div>
              <div className="space-y-2">
                {propertyAlerts.map(alert => (
                  <div key={alert.id} className={cn("p-3 rounded-lg border border-l-2",
                    alert.severity === "high" ? "border-l-rose-500" : alert.severity === "medium" ? "border-l-amber-500" : "border-l-white/10"
                  )} style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{alert.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{new Date(alert.timestamp).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {activeTab === "ownership" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {ownership ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: "#40856a" }} />
                    <h3 className="font-bold text-white text-sm">Ownership Entity</h3>
                    <ProvenanceTag source={ownership.sourceLabel} />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Legal Entity</p>
                      <p className="text-sm font-semibold text-white">{ownership.entity}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{ownership.type} · {ownership.jurisdiction}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Principals</p>
                      <div className="space-y-1.5">
                        {ownership.principals.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#40856a" }} />
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Last Transfer</p>
                        <p className="text-xs text-white/70">{new Date(ownership.lastTransfer).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Counsel</p>
                        <p className="text-xs text-white/70">{ownership.counsel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <FreshnessTag label={ownership.freshness} confidence="High" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#3b82f6" }} />
                    <h3 className="font-bold text-white text-sm">Debt & Capital Stack</h3>
                    <ProvenanceTag source="Lender Report · DSCR Model" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Senior Lender</p>
                      <p className="text-sm font-semibold text-white">{ownership.lender}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Loan Balance", value: ownership.loanBalance },
                        { label: "Maturity Date", value: new Date(ownership.maturityDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                        { label: "LTV", value: ownership.ltv, alert: parseFloat(ownership.ltv) > 70 },
                        { label: "DSCR", value: ownership.dscr, alert: parseFloat(ownership.dscr) < 1.0 },
                      ].map(m => (
                        <div key={m.label} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</p>
                          <p className="text-sm font-bold" style={{ color: m.alert ? "#ef4444" : "white" }}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                    {parseFloat(ownership.dscr) < 1.0 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                        <p className="text-[10px]" style={{ color: "rgba(239,68,68,0.8)" }}>
                          DSCR below 1.0x — debt service not covered by NOI. Lender covenant breach risk. Immediate capital plan required.
                        </p>
                      </div>
                    )}
                    {new Date(ownership.maturityDate).getTime() - new Date("2026-04-02").getTime() < 1000 * 60 * 60 * 24 * 180 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                        <p className="text-[10px]" style={{ color: "rgba(245,158,11,0.8)" }}>
                          Loan matures within 6 months. Begin refi/extension process immediately.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Ownership data not available for this asset</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Request title search to populate ownership context</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "diligence" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {diligence.length > 0 ? (
            <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: "#3b82f6" }} />
                  <h3 className="font-bold text-white text-sm">Diligence Checklist</h3>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <span>{diligence.filter(d => d.status === "complete").length}/{diligence.length} complete</span>
                  {diligence.filter(d => d.status === "flagged").length > 0 && (
                    <span className="font-semibold" style={{ color: "#ef4444" }}>
                      {diligence.filter(d => d.status === "flagged").length} flagged
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {diligence.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                    <DiligenceStatus status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{item.item}</p>
                      {item.note && (
                        <p className="text-[10px] mt-0.5" style={{ color: item.status === "flagged" ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.3)" }}>
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.assignee}</p>
                      {item.due && (
                        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                          Due {new Date(item.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No active diligence process for this asset</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Diligence checklists are created when an asset enters underwriting</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "actions" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {actionItemsLoading ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#40856a" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading action items…</p>
            </div>
          ) : actionItems.length > 0 ? (
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {actionItems.map(item => {
                const isUpdating = updatingActionId === item.id;
                const statusNorm = (item.status ?? "open").replace("-", "_") as OperationalEntity["status"];
                const entity: OperationalEntity & { entityType: string } = {
                  id: item.id,
                  entityType: `${item.severity.toUpperCase()} · ${item.ownerRole}`,
                  title: item.issue,
                  status: statusNorm,
                  riskLevel: (item.severity === "critical" || item.severity === "high" ? item.severity : item.severity === "medium" ? "medium" : "low") as OperationalEntity["riskLevel"],
                  owner: { name: item.ownerName, role: item.ownerRole },
                  nextAction: item.recommendedAction ? { label: item.recommendedAction, actionType: "resolve", dueAt: item.dueDate ?? undefined } : undefined,
                  updatedAt: item.updatedAt,
                };
                return (
                  <div key={item.id} className="border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <OperationalQueueRow entity={entity} />
                    {isLiveData && (
                      <div className="flex items-center gap-2 px-3 pb-2.5 justify-end">
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
                        ) : statusNorm !== "resolved" ? (
                          <>
                            {statusNorm === "open" && (
                              <button
                                onClick={() => updateActionStatus(String(item.id), "in_progress", property.id)}
                                className="text-[10px] px-2 py-1 rounded transition-colors"
                                style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => updateActionStatus(String(item.id), "resolved", property.id)}
                              className="text-[10px] px-2 py-1 rounded transition-colors"
                              style={{ background: "rgba(64,133,106,0.1)", color: "#40856a", border: "1px solid rgba(64,133,106,0.25)" }}>
                              Resolve
                            </button>
                          </>
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: "#40856a" }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Target className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No open action items for this asset</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "atlas" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4">
          <AtlasScenePanel propertyId={params?.id} isDemo={true} />
        </motion.div>
      )}
    </div>
  );
}
