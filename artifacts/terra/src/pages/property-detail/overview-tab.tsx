import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Calculator,
  Calendar,
  ChevronRight,
  Eye,
  FileText,
  Flame,
  Layers,
  Thermometer,
  User,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'wouter';
import { cn, ActivityFeed, CommentThread } from '@szl-holdings/shared-ui';
import { CustomTooltip, OCCI_COLORS } from './shared';
import { formatCurrency, tenantStatusColors } from './utils';
import { maintenanceItems } from './data';

interface Tenant {
  id: string;
  name: string;
  unit: string;
  monthlyRent: number;
  leaseEnd: string;
  status: string;
}

interface Alert {
  id: string;
  message: string;
  severity: string;
  timestamp: string;
}

interface FinancialHistory {
  month: string;
  revenue: number;
  noi: number;
}

interface Property {
  id: string;
  occupancy: number;
  units: number;
}

interface Props {
  property: Property;
  propertyTenants: Tenant[];
  propertyAlerts: Alert[];
  financialHistory: FinancialHistory[];
  occupancyData: { name: string; value: number }[];
}

export function OverviewTab({
  property,
  propertyTenants,
  propertyAlerts,
  financialHistory,
  occupancyData,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
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
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e3).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="noi" name="NOI" stroke="#10b981" fill="url(#noiGrad2)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h3 className="font-bold text-white mb-4 text-sm">Occupancy</h3>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={4} dataKey="value">
                  {occupancyData.map((_, idx) => <Cell key={idx} fill={OCCI_COLORS[idx]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-2">
            <p className="text-3xl font-bold text-white">{property.occupancy}%</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {property.units} units · {Math.round(property.units * (1 - property.occupancy / 100))} vacant
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" style={{ color: '#3b82f6' }} />
            <h3 className="font-bold text-white text-sm">Tenants</h3>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>({propertyTenants.length})</span>
          </div>
          {propertyTenants.length > 0 ? (
            <div className="space-y-2">
              {propertyTenants.map((tenant) => (
                <div key={tenant.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white/80">{tenant.name}</p>
                    <span className={cn('text-[10px] font-bold uppercase', tenantStatusColors[tenant.status])}>{tenant.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>{tenant.unit}</span>
                    <span>{formatCurrency(tenant.monthlyRent)}/mo</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires {new Date(tenant.leaseEnd).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>No tenant data available</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h3 className="font-bold text-white text-sm">Maintenance Schedule</h3>
          </div>
          <div className="space-y-2">
            {maintenanceItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white/80">{item.task}</p>
                  <span className={cn('text-[10px] font-bold uppercase', item.status === 'overdue' ? 'text-rose-400' : item.status === 'scheduled' ? 'text-amber-400' : 'text-white/30')}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className={cn('uppercase font-semibold text-[10px]', item.priority === 'high' ? 'text-rose-400' : item.priority === 'medium' ? 'text-amber-400' : 'text-white/30')}>
                    {item.priority}
                  </span>
                  <span>Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.assignee}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4" style={{ color: '#b8943c' }} />
          <h3 className="font-bold text-white text-sm">Lease Abstraction</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: '#b8943c', background: 'rgba(184,148,60,0.08)', border: '1px solid rgba(184,148,60,0.2)' }}>
            AI-Extracted
          </span>
          <Link href="/lease-abstraction" className="ml-auto text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Full Module <Activity className="w-3 h-3" />
          </Link>
        </div>
        {propertyTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  {['Tenant', 'Suite', 'Base Rent/Mo', 'Lease Expiry'].map((h) => (
                    <th key={h} className="text-left pb-2 font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propertyTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <td className="py-2 font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{tenant.name}</td>
                    <td className="py-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{tenant.unit}</td>
                    <td className="py-2 font-mono font-bold" style={{ color: '#b8943c' }}>{formatCurrency(tenant.monthlyRent)}</td>
                    <td className="py-2" style={{ color: new Date(tenant.leaseEnd) < new Date(Date.now() + 365 * 86400000) ? '#f59e0b' : 'rgba(255,255,255,0.6)' }}>
                      {new Date(tenant.leaseEnd).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>No lease documents abstracted — upload via Lease Abstraction module</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.29 }}
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4" style={{ color: '#40856a' }} />
          <h3 className="font-bold text-white text-sm">Intelligence Modules</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: '#40856a', background: 'rgba(64,133,106,0.08)', border: '1px solid rgba(64,133,106,0.2)' }}>
            AI-Powered
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: `/climate-risk-enhanced/${property.id}`, icon: Thermometer, label: 'Climate Risk Enhanced', desc: '30-yr flood, fire, heat & seismic scoring', badge: 'FEMA · NOAA', color: '#f97316' },
            { href: `/zoning-intelligence/${property.id}`, icon: Layers, label: 'Zoning Intelligence', desc: 'FAR utilization, density scenarios & variance history', badge: 'Municipal Records', color: '#60a5fa' },
            { href: `/waterfall-calculator/${property.id}`, icon: Calculator, label: 'Waterfall Calculator', desc: 'Preferred return, catch-up & promote tiers', badge: 'GP / LP', color: '#b8943c' },
            { href: `/spatial-walkthrough/${property.id}`, icon: Eye, label: 'Spatial Walkthrough', desc: 'Room-by-room metrics, renovation options & staging', badge: 'Computer Vision', color: '#a78bfa' },
            { href: `/neighborhood-momentum/${property.id}`, icon: BarChart3, label: 'Neighborhood Momentum', desc: 'Gentrification trajectory & institutional capital flows', badge: 'MLS · Public Records', color: '#34d399' },
            { href: `/seller-motivation/${property.id}`, icon: Brain, label: 'Seller Motivation', desc: 'AI acceptance scoring across distress & equity signals', badge: 'Distress Engine', color: '#40856a' },
            { href: `/why-this-property/${property.id}`, icon: Flame, label: 'Why This Property Now', desc: 'Explainable distress score · ownership chain · financing stress · investment memo', badge: 'HPD · ACRIS · ECB · DOB', color: '#ef4444' },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href}>
                <div
                  className="group rounded-xl p-3.5 cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${mod.color}30`; (e.currentTarget as HTMLDivElement).style.background = `${mod.color}08`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: mod.color }} />
                    <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: mod.color }} />
                  </div>
                  <p className="text-xs font-semibold text-white mb-0.5">{mod.label}</p>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{mod.desc}</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: mod.color, background: `${mod.color}12`, border: `1px solid ${mod.color}20` }}>
                    {mod.badge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <CommentThread entityType="property" entityId={property.id} title="Property Discussion" collapsible={false} />
        <ActivityFeed entityType="property" title="Portfolio Activity" limit={6} compact />
      </motion.div>

      {propertyAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h3 className="font-bold text-white text-sm">Property Alerts</h3>
          </div>
          <div className="space-y-2">
            {propertyAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn('p-3 rounded-lg border border-l-2', alert.severity === 'high' ? 'border-l-rose-500' : alert.severity === 'medium' ? 'border-l-amber-500' : 'border-l-white/10')}
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{alert.message}</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {new Date(alert.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
