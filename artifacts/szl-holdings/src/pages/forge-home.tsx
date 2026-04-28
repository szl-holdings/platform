import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lock,
  Network,
  Package,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

const FORGE_MODULES = [
  {
    id: 'portfolio',
    title: 'Portfolio Manager',
    description:
      'Track all SZL Holdings portfolio companies, performance metrics, health scores, and strategic alignment.',
    icon: BarChart3,
    accent: '#d4a054',
    href: '/forge/portfolio',
    detail: [
      { label: 'SEXTANT', status: 'Operational', score: '98%', trend: '+2%' },
      { label: 'PARAGON', status: 'Scaling', score: '94%', trend: '+5%' },
      { label: 'DOMAINE', status: 'Operational', score: '96%', trend: '+1%' },
      { label: 'KORA', status: 'Operational', score: '99%', trend: '+0.5%' },
      { label: 'IMPERIUM', status: 'Beta', score: '87%', trend: '+8%' },
      { label: 'Carlota Jo', status: 'Active', score: '91%', trend: '+3%' },
    ],
  },
  {
    id: 'assets',
    title: 'Asset Inventory',
    description:
      'Unified registry of all platform assets, infrastructure, codebases, and operational dependencies across the ecosystem.',
    icon: Package,
    accent: '#4a90b8',
    href: '/forge/assets',
    detail: [
      { label: 'Web Artifacts', status: 'Active', score: '18', trend: '+2' },
      { label: 'Mobile Apps', status: 'Active', score: '8', trend: '+1' },
      { label: 'Database Tables', status: 'Synced', score: '446', trend: '0' },
      { label: 'API Endpoints', status: 'Online', score: '312', trend: '+14' },
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding Console',
    description:
      'Client and partner onboarding flows, provisioning status, and activation tracking across all platforms.',
    icon: Users,
    accent: '#4ade80',
    href: '/forge/onboarding',
    detail: [
      { label: 'Pending Onboards', status: 'Active', score: '3', trend: '-1' },
      { label: 'In Progress', status: 'Running', score: '5', trend: '+2' },
      { label: 'Completed This Month', status: 'Done', score: '12', trend: '+4' },
      { label: 'Avg. Time to Activate', status: 'Metric', score: '3.2d', trend: '-0.5d' },
    ],
  },
  {
    id: 'proposals',
    title: 'Proposals & Engagements',
    description:
      'Active proposals, partnership agreements, and engagement pipelines — with version tracking and approval workflows.',
    icon: Network,
    accent: '#a78bfa',
    href: '/forge/proposals',
    detail: [
      { label: 'Open Proposals', status: 'Active', score: '4', trend: '+1' },
      { label: 'Awaiting Approval', status: 'Pending', score: '2', trend: '0' },
      { label: 'Signed This Quarter', status: 'Done', score: '7', trend: '+3' },
      { label: 'Pipeline Value', status: 'Metric', score: '$2.4M', trend: '+$400K' },
    ],
  },
  {
    id: 'comms',
    title: 'Communications Log',
    description:
      'Structured record of all stakeholder communications across investors, clients, design partners, and media.',
    icon: Shield,
    accent: '#f472b6',
    href: '/forge/comms',
    detail: [
      { label: 'Investor Updates', status: 'Sent', score: '6', trend: '+1' },
      { label: 'Client Check-ins', status: 'Logged', score: '22', trend: '+6' },
      { label: 'Media Mentions', status: 'Tracked', score: '11', trend: '+3' },
      { label: 'Partner Syncs', status: 'Logged', score: '14', trend: '+2' },
    ],
  },
  {
    id: 'ops',
    title: 'Operations Config',
    description:
      'System configuration, environment management, deployment settings, and infrastructure controls.',
    icon: Settings,
    accent: '#94a3b8',
    href: '/forge/ops',
    detail: [
      { label: 'Environments', status: 'Active', score: '3', trend: '0' },
      { label: 'Deployments Today', status: 'Done', score: '8', trend: '+2' },
      { label: 'Error Rate', status: 'Healthy', score: '0.02%', trend: '-0.01%' },
      { label: 'Uptime (30d)', status: 'Healthy', score: '99.97%', trend: '+0.01%' },
    ],
  },
];

const QUICK_STATS = [
  { label: 'Portfolio Companies', value: '6' },
  { label: 'Active Engagements', value: '12' },
  { label: 'Open Proposals', value: '4' },
  { label: 'Pending Onboards', value: '3' },
];

export default function ForgeHomePage() {
  const [location] = useLocation();
  const moduleSlug = location.replace(/^\/forge\/?/, '').split('/')[0];
  const activeModule = FORGE_MODULES.find((m) => m.id === moduleSlug);

  if (activeModule) {
    const Icon = activeModule.icon;
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'var(--gi-bg-base)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="mb-6">
            <Link href="/forge">
              <button
                className="flex items-center gap-1.5 text-[12px] mb-4 transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Forge
              </button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: `${activeModule.accent}12`,
                  border: `1px solid ${activeModule.accent}25`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: activeModule.accent }} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">{activeModule.title}</h1>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {activeModule.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {activeModule.detail.map((item) => (
              <div
                key={item.label}
                className="rounded-lg p-4 border"
                style={{ background: '#0c1220', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="text-[10px] uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {item.label}
                </div>
                <div className="text-xl font-semibold font-mono text-white">{item.score}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${activeModule.accent}15`, color: activeModule.accent }}
                  >
                    {item.status}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg border p-5"
            style={{ background: '#0c1220', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <h2 className="text-sm font-semibold text-white mb-4">Module Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['View Full Report', 'Export Data', 'Configure Settings'].map((action) => (
                <button
                  key={action}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all"
                  style={{
                    background: '#0e1526',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  {action}
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: activeModule.accent }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--gi-bg-base)',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{
                  background: 'rgba(212,160,84,0.1)',
                  border: '1px solid rgba(212,160,84,0.2)',
                }}
              >
                <Lock className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
              </div>
              <span
                className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                style={{ color: '#d4a054' }}
              >
                Forge — Admin Portal
              </span>
            </div>
            <h1 className="text-xl font-semibold text-white">SZL Holdings Operations</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Portfolio management, asset tracking, and system administration
            </p>
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-px mb-8 rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {QUICK_STATS.map((stat) => (
            <div key={stat.label} className="py-4 px-5" style={{ background: '#0c1220' }}>
              <div className="text-2xl font-semibold font-mono text-white">{stat.value}</div>
              <div
                className="text-[10px] tracking-wide uppercase mt-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div>
          <p
            className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-4"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Admin Modules
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FORGE_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link key={mod.id} href={mod.href}>
                  <div
                    className="rounded-lg p-5 cursor-pointer transition-all border"
                    style={{
                      background: '#0c1220',
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${mod.accent}30`;
                      (e.currentTarget as HTMLElement).style.background = '#0e1526';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.background = '#0c1220';
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${mod.accent}12`,
                          border: `1px solid ${mod.accent}25`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: mod.accent }} />
                      </div>
                      <ChevronRight
                        className="w-4 h-4 mt-1"
                        style={{ color: 'rgba(255,255,255,0.15)' }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{mod.title}</div>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {mod.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div
          className="mt-8 rounded-lg border p-5"
          style={{ background: '#0c1220', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-0">
            {[
              {
                action: 'Portfolio health review',
                detail: 'SEXTANT Q1 metrics updated',
                time: '2h ago',
                color: '#22d3ee',
              },
              {
                action: 'New design partner onboarded',
                detail: 'KORA — TechCorp engagement activated',
                time: '5h ago',
                color: '#d4a054',
              },
              {
                action: 'Proposal approved',
                detail: 'PARAGON enterprise tier — Northgate Capital',
                time: '1d ago',
                color: '#ef4444',
              },
              {
                action: 'Asset registry sync',
                detail: 'Infrastructure inventory updated — 446 tables confirmed',
                time: '2d ago',
                color: '#4a90b8',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white">{item.action}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {item.detail}
                  </div>
                </div>
                <div
                  className="text-[10px] font-mono flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
