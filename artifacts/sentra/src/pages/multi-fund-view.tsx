import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Eye,
  FileText,
  Globe,
  Layers,
  Lock,
  MoreHorizontal,
  Percent,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface FundView {
  id: string;
  name: string;
  strategy: string;
  vintage: number;
  aum: number;
  nav: number;
  irr: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  callRate: number;
  distributionRate: number;
  investmentCount: number;
  activeIncidents: number;
  complianceScore: number;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  gpAccess: boolean;
  lpAccess: boolean;
  lastNav: string;
  currency: string;
  positions: FundPosition[];
}

interface FundPosition {
  id: string;
  name: string;
  type: string;
  nav: number;
  irr: number;
  riskScore: number;
  status: 'active' | 'exited' | 'watchlist';
}

const FUNDS: FundView[] = [
  {
    id: 'fund-alpha',
    name: 'Sentra Alpha Fund I',
    strategy: 'Cyber Resilience Equity',
    vintage: 2022,
    aum: 480000000,
    nav: 612000000,
    irr: 22.4,
    tvpi: 1.84,
    dpi: 0.42,
    rvpi: 1.42,
    callRate: 68,
    distributionRate: 24,
    investmentCount: 12,
    activeIncidents: 0,
    complianceScore: 98,
    riskRating: 'low',
    gpAccess: true,
    lpAccess: false,
    lastNav: 'Apr 1, 2026',
    currency: 'USD',
    positions: [
      { id: 'p1', name: 'CyberGuard Systems', type: 'Equity', nav: 84000000, irr: 31.2, riskScore: 22, status: 'active' },
      { id: 'p2', name: 'ThreatStack AI', type: 'Equity', nav: 112000000, irr: 44.8, riskScore: 18, status: 'active' },
      { id: 'p3', name: 'SecureVault Inc', type: 'Convertible', nav: 67000000, irr: 18.1, riskScore: 31, status: 'active' },
    ],
  },
  {
    id: 'fund-beta',
    name: 'Sentra Beta Fund II',
    strategy: 'Defense Technology Growth',
    vintage: 2024,
    aum: 280000000,
    nav: 298000000,
    irr: 14.7,
    tvpi: 1.12,
    dpi: 0.08,
    rvpi: 1.04,
    callRate: 45,
    distributionRate: 7,
    investmentCount: 8,
    activeIncidents: 1,
    complianceScore: 94,
    riskRating: 'medium',
    gpAccess: true,
    lpAccess: false,
    lastNav: 'Apr 1, 2026',
    currency: 'USD',
    positions: [
      { id: 'p4', name: 'QuantumShield Labs', type: 'Equity', nav: 52000000, irr: 19.4, riskScore: 44, status: 'active' },
      { id: 'p5', name: 'Sentinel AI Corp', type: 'Equity', nav: 88000000, irr: 12.1, riskScore: 38, status: 'watchlist' },
      { id: 'p6', name: 'EdgeDefense Systems', type: 'Preferred', nav: 34000000, irr: 9.8, riskScore: 55, status: 'watchlist' },
    ],
  },
  {
    id: 'fund-gamma',
    name: 'Sentra Infrastructure SPV',
    strategy: 'Critical Infrastructure Credit',
    vintage: 2023,
    aum: 175000000,
    nav: 191000000,
    irr: 9.8,
    tvpi: 1.22,
    dpi: 0.31,
    rvpi: 0.91,
    callRate: 92,
    distributionRate: 28,
    investmentCount: 5,
    activeIncidents: 0,
    complianceScore: 100,
    riskRating: 'low',
    gpAccess: true,
    lpAccess: true,
    lastNav: 'Apr 1, 2026',
    currency: 'USD',
    positions: [
      { id: 'p7', name: 'GridSafe Networks', type: 'Senior Debt', nav: 62000000, irr: 8.4, riskScore: 14, status: 'active' },
      { id: 'p8', name: 'SecureComm Rail', type: 'Mezzanine', nav: 45000000, irr: 11.2, riskScore: 22, status: 'active' },
    ],
  },
];

const RISK_COLORS: Record<string, string> = {
  low: '#c9b787',
  medium: '#c9b787',
  high: '#c9b787',
  critical: '#f5f5f5',
};

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MultiFundView() {
  const [viewMode, setViewMode] = useState<'gp' | 'fund'>('gp');
  const [selectedFund, setSelectedFund] = useState<FundView | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  const totalAum = FUNDS.reduce((s, f) => s + f.aum, 0);
  const totalNav = FUNDS.reduce((s, f) => s + f.nav, 0);
  const weightedIrr = FUNDS.reduce((s, f) => s + f.irr * (f.aum / totalAum), 0);
  const totalIncidents = FUNDS.reduce((s, f) => s + f.activeIncidents, 0);
  const avgCompliance = FUNDS.reduce((s, f) => s + f.complianceScore / FUNDS.length, 0);

  return (
    <div className="h-full overflow-auto bg-[#080510] text-[#f5f5f5]" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20">
                <Layers className="w-5 h-5 text-[#f5f5f5]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f5f5f5]">Multi-Fund View</h1>
                <p className="text-xs text-[#f5f5f5]/60 mt-0.5">Sentra GP · {FUNDS.length} funds · Separate fund access controls + consolidated GP roll-up</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg">
              <button
                onClick={() => setViewMode('gp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'gp' ? 'bg-[#f5f5f5]/20 text-[#f5f5f5]' : 'text-[#f5f5f5]/50 hover:text-[#f5f5f5]/80'}`}
              >
                <Globe className="w-3 h-3" /> GP Roll-up
              </button>
              <button
                onClick={() => setViewMode('fund')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'fund' ? 'bg-[#f5f5f5]/20 text-[#f5f5f5]' : 'text-[#f5f5f5]/50 hover:text-[#f5f5f5]/80'}`}
              >
                <Layers className="w-3 h-3" /> Fund Views
              </button>
            </div>
          </div>
        </div>

        {/* GP Roll-up view */}
        {viewMode === 'gp' && (
          <div className="space-y-6">
            {/* Consolidated KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total AUM', value: fmt(totalAum), icon: DollarSign, color: '#c9b787' },
                { label: 'Total NAV', value: fmt(totalNav), icon: TrendingUp, color: '#c9b787' },
                { label: 'Weighted IRR', value: `${weightedIrr.toFixed(1)}%`, icon: Percent, color: '#c9b787' },
                { label: 'Active Incidents', value: String(totalIncidents), icon: AlertTriangle, color: totalIncidents > 0 ? '#c9b787' : '#c9b787' },
                { label: 'Avg Compliance', value: `${avgCompliance.toFixed(0)}%`, icon: Shield, color: '#8a8a8a' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    <p className="text-[10px] text-[#f5f5f5]/50">{kpi.label}</p>
                  </div>
                  <p className="text-lg font-bold text-[#f5f5f5]">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Fund Comparison Table */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/[0.06]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5f5f5]/60">Fund Comparison — GP View</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Fund', 'Strategy', 'Vintage', 'AUM', 'NAV', 'IRR', 'TVPI', 'DPI', 'Risk', 'Compliance'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[#f5f5f5]/40 font-normal whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FUNDS.map((fund) => (
                      <tr
                        key={fund.id}
                        onClick={() => { setSelectedFund(fund); setViewMode('fund'); }}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <p className="text-[#f5f5f5] font-semibold whitespace-nowrap">{fund.name}</p>
                          {fund.activeIncidents > 0 && (
                            <span className="text-[9px] text-[#f5f5f5]">⚠ {fund.activeIncidents} incident</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#f5f5f5]/60 whitespace-nowrap">{fund.strategy}</td>
                        <td className="px-4 py-3 text-[#f5f5f5]/70">{fund.vintage}</td>
                        <td className="px-4 py-3 text-[#f5f5f5] font-mono">{fmt(fund.aum)}</td>
                        <td className="px-4 py-3 text-[#f5f5f5] font-mono">{fmt(fund.nav)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${fund.irr >= 20 ? 'text-[#c9b787]' : fund.irr >= 10 ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}>
                            {fund.irr.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#f5f5f5]">{fund.tvpi.toFixed(2)}x</td>
                        <td className="px-4 py-3 text-[#f5f5f5]">{fund.dpi.toFixed(2)}x</td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded"
                            style={{ background: `${RISK_COLORS[fund.riskRating]}18`, color: RISK_COLORS[fund.riskRating] }}
                          >
                            {fund.riskRating}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${fund.complianceScore}%`, background: fund.complianceScore >= 95 ? '#c9b787' : '#c9b787' }}
                              />
                            </div>
                            <span className="text-[#f5f5f5]/60">{fund.complianceScore}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Fund Detail View */}
        {viewMode === 'fund' && (
          <div className="space-y-5">
            {/* Fund Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FUNDS.map((fund) => (
                <button
                  key={fund.id}
                  onClick={() => setSelectedFund(fund)}
                  className={`flex-shrink-0 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    selectedFund?.id === fund.id
                      ? 'border-[#f5f5f5]/40 bg-[#f5f5f5]/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-[#f5f5f5]/20'
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-semibold text-[#f5f5f5] whitespace-nowrap">{fund.name}</p>
                    <p className="text-[9px] text-[#f5f5f5]/50 mt-0.5">{fund.strategy}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold" style={{ color: fund.irr >= 20 ? '#c9b787' : fund.irr >= 10 ? '#c9b787' : '#f5f5f5' }}>
                      {fund.irr.toFixed(1)}% IRR
                    </span>
                    {fund.activeIncidents > 0 && <AlertTriangle className="w-3 h-3 text-[#f5f5f5]" />}
                    {!fund.activeIncidents && <CheckCircle className="w-3 h-3 text-[#c9b787]/60" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedFund ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFund.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5"
                >
                  {/* Access Badge */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20">
                      <Shield className="w-3 h-3 text-[#f5f5f5]" />
                      <span className="text-[10px] text-[#f5f5f5]">GP Access</span>
                    </div>
                    {selectedFund.lpAccess && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#c9b787]/10 border border-[#c9b787]/20">
                        <Eye className="w-3 h-3 text-[#c9b787]" />
                        <span className="text-[10px] text-[#c9b787]">LP Access Enabled</span>
                      </div>
                    )}
                    {!selectedFund.lpAccess && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <Lock className="w-3 h-3 text-[#f5f5f5]/40" />
                        <span className="text-[10px] text-[#f5f5f5]/40">LP Access Restricted</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5f5f5]/60 mb-4">Performance — {selectedFund.name}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'AUM', value: fmt(selectedFund.aum) },
                        { label: 'NAV', value: fmt(selectedFund.nav) },
                        { label: 'IRR (Net)', value: `${selectedFund.irr.toFixed(1)}%` },
                        { label: 'TVPI', value: `${selectedFund.tvpi.toFixed(2)}x` },
                        { label: 'DPI', value: `${selectedFund.dpi.toFixed(2)}x` },
                        { label: 'RVPI', value: `${selectedFund.rvpi.toFixed(2)}x` },
                        { label: 'Called %', value: `${selectedFund.callRate}%` },
                        { label: 'Distributed %', value: `${selectedFund.distributionRate}%` },
                      ].map((m) => (
                        <div key={m.label}>
                          <p className="text-[10px] text-[#f5f5f5]/40">{m.label}</p>
                          <p className="text-sm font-bold text-[#f5f5f5] mt-0.5 font-mono">{m.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#f5f5f5]/30 mt-3">NAV as of {selectedFund.lastNav} · Currency: {selectedFund.currency}</p>
                  </div>

                  {/* Portfolio Positions */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5f5f5]/60 mb-4">Portfolio Positions</h3>
                    <div className="space-y-2">
                      {selectedFund.positions.map((pos) => (
                        <div key={pos.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-3.5 h-3.5 text-[#f5f5f5]/40" />
                            <div>
                              <p className="text-[12px] font-semibold text-[#f5f5f5]">{pos.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-[#f5f5f5]/50">{pos.type}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                                  pos.status === 'active' ? 'bg-[#c9b787]/10 text-[#c9b787]' :
                                  pos.status === 'watchlist' ? 'bg-[#c9b787]/10 text-[#c9b787]' :
                                  'bg-white/[0.04] text-[#f5f5f5]/40'
                                }`}>{pos.status}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="text-[11px] font-bold text-[#f5f5f5]">{fmt(pos.nav)}</p>
                              <p className="text-[9px] text-[#f5f5f5]/40">NAV</p>
                            </div>
                            <div>
                              <p className={`text-[11px] font-bold ${pos.irr >= 20 ? 'text-[#c9b787]' : pos.irr >= 10 ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}>
                                {pos.irr.toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-[#f5f5f5]/40">IRR</p>
                            </div>
                            <div>
                              <p className={`text-[11px] font-bold ${pos.riskScore < 30 ? 'text-[#c9b787]' : pos.riskScore < 50 ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}>
                                {pos.riskScore}
                              </p>
                              <p className="text-[9px] text-[#f5f5f5]/40">Risk</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <Layers className="w-8 h-8 text-[#f5f5f5]/20 mx-auto mb-3" />
                <p className="text-sm text-[#f5f5f5]/40">Select a fund to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
