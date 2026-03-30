import { motion } from "framer-motion";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Building2, MapPin, Users, DollarSign, TrendingUp, Calendar, Wrench, User, AlertTriangle } from "lucide-react";
import { properties, tenants, alerts } from "@/data/portfolio";
import { cn } from "@workspace/shared-ui/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  performing: { label: "Performing", color: "bg-terra-emerald/10 text-terra-emerald border-terra-emerald/20" },
  watch: { label: "Watch List", color: "bg-terra-amber/10 text-terra-amber border-terra-amber/20" },
  critical: { label: "Critical", color: "bg-terra-rose/10 text-terra-rose border-terra-rose/20" },
};

const tenantStatusColors: Record<string, string> = {
  active: "bg-terra-emerald/10 text-terra-emerald",
  expiring: "bg-terra-amber/10 text-terra-amber",
  delinquent: "bg-terra-rose/10 text-terra-rose",
};

const maintenanceItems = [
  { id: "m-001", task: "HVAC System Inspection", priority: "high", dueDate: "2026-04-05", status: "overdue", cost: 12500 },
  { id: "m-002", task: "Elevator Modernization Phase 2", priority: "medium", dueDate: "2026-04-15", status: "scheduled", cost: 85000 },
  { id: "m-003", task: "Roof Membrane Replacement (Bldg B)", priority: "medium", dueDate: "2026-05-01", status: "scheduled", cost: 42000 },
  { id: "m-004", task: "Parking Lot Resurfacing", priority: "low", dueDate: "2026-06-15", status: "planned", cost: 28000 },
  { id: "m-005", task: "Fire Suppression System Test", priority: "high", dueDate: "2026-04-01", status: "scheduled", cost: 4500 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-terra-bg-tertiary border border-terra-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-terra-text mb-2">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-terra-text-secondary">{item.name}:</span>
          <span className="text-terra-text font-medium">{typeof item.value === "number" ? formatCurrency(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function PropertyDetailPage() {
  const [, params] = useRoute("/property/:id");
  const property = properties.find(p => p.id === params?.id);

  if (!property) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-terra-text-muted mx-auto mb-4" />
          <p className="text-terra-text-secondary">Property not found</p>
          <Link href="/dashboard"><span className="text-terra-primary text-sm mt-2 inline-block cursor-pointer hover:underline">Back to Dashboard</span></Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[property.status];
  const propertyTenants = tenants.filter(t => t.propertyId === property.id);
  const propertyAlerts = alerts.filter(a => a.propertyId === property.id);
  const appreciation = ((property.value - property.purchasePrice) / property.purchasePrice * 100).toFixed(1);

  const seedMultipliers = [0.94, 0.97, 1.0, 0.96, 1.02, 1.04, 1.01, 0.98, 1.05, 1.03, 1.06, 1.08];
  const expenseRatios = [0.62, 0.60, 0.61, 0.63, 0.59, 0.60, 0.64, 0.62, 0.61, 0.63, 0.60, 0.59];
  const financialHistory = seedMultipliers.map((mult, i) => {
    const rev = Math.round(property.monthlyRevenue * mult);
    const exp = Math.round(rev * expenseRatios[i]);
    return {
      month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
      revenue: rev,
      expenses: exp,
      noi: rev - exp,
    };
  });

  const occupancyData = [
    { name: "Occupied", value: property.occupancy },
    { name: "Vacant", value: 100 - property.occupancy },
  ];
  const OCCI_COLORS = ["#10b981", "#1e293b"];

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-sm text-terra-text-muted hover:text-terra-primary transition-colors mb-4 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </span>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">{property.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-terra-text-secondary"><MapPin className="w-3.5 h-3.5" />{property.address}, {property.city}, {property.state}</span>
              <span className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide border", status.color)}>{status.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Property Value", value: formatCurrency(property.value), icon: Building2 },
          { label: "Monthly Revenue", value: formatCurrency(property.monthlyRevenue), icon: DollarSign },
          { label: "Annual NOI", value: formatCurrency(property.annualNOI), icon: TrendingUp },
          { label: "Cap Rate", value: `${property.capRate}%`, icon: TrendingUp },
          { label: "Occupancy", value: `${property.occupancy}%`, icon: Users },
          { label: "Appreciation", value: `+${appreciation}%`, icon: TrendingUp },
        ].map((metric, i) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 rounded-xl border border-terra-border bg-terra-surface/50">
            <metric.icon className="w-4 h-4 text-terra-text-muted mb-2" />
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{metric.label}</p>
            <p className="text-lg font-display font-bold text-terra-text">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Financial Performance (12 mo)</h3>
          <div className="h-64">
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e3).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="noi" name="NOI" stroke="#10b981" fill="url(#noiGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Occupancy</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {occupancyData.map((_, idx) => (<Cell key={idx} fill={OCCI_COLORS[idx]} />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-2">
            <p className="text-3xl font-display font-bold text-terra-text">{property.occupancy}%</p>
            <p className="text-xs text-terra-text-muted">{property.units} total units · {Math.round(property.units * (1 - property.occupancy / 100))} vacant</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-terra-primary" />
            <h3 className="font-display font-bold text-terra-text">Tenants</h3>
            <span className="text-xs text-terra-text-muted">({propertyTenants.length})</span>
          </div>
          {propertyTenants.length > 0 ? (
            <div className="space-y-3">
              {propertyTenants.map(tenant => (
                <div key={tenant.id} className="p-3 rounded-lg border border-terra-border bg-terra-bg-secondary">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-terra-text">{tenant.name}</p>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", tenantStatusColors[tenant.status])}>{tenant.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-terra-text-secondary">
                    <span>{tenant.unit}</span>
                    <span>{formatCurrency(tenant.monthlyRent)}/mo</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires {new Date(tenant.leaseEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-terra-text-muted text-center py-6">No tenant data available</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-terra-accent" />
            <h3 className="font-display font-bold text-terra-text">Maintenance Schedule</h3>
          </div>
          <div className="space-y-3">
            {maintenanceItems.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-terra-border bg-terra-bg-secondary">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-terra-text">{item.task}</p>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    item.status === "overdue" ? "bg-terra-rose/10 text-terra-rose" :
                    item.status === "scheduled" ? "bg-terra-amber/10 text-terra-amber" :
                    "bg-terra-text-muted/10 text-terra-text-muted"
                  )}>{item.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-terra-text-secondary">
                  <span className={cn("uppercase font-semibold", item.priority === "high" ? "text-terra-rose" : item.priority === "medium" ? "text-terra-amber" : "text-terra-text-muted")}>{item.priority}</span>
                  <span>Due {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {propertyAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-terra-amber" />
            <h3 className="font-display font-bold text-terra-text">Property Alerts</h3>
          </div>
          <div className="space-y-2">
            {propertyAlerts.map(alert => (
              <div key={alert.id} className={cn("p-3 rounded-lg border border-terra-border", alert.severity === "high" ? "border-l-2 border-l-terra-rose" : alert.severity === "medium" ? "border-l-2 border-l-terra-amber" : "border-l-2 border-l-terra-text-muted")}>
                <p className="text-sm text-terra-text-secondary">{alert.message}</p>
                <p className="text-[10px] text-terra-text-muted mt-1">{new Date(alert.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
