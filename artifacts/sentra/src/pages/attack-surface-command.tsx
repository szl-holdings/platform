import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Cloud,
  Eye,
  Globe,
  Key,
  Layers,
  Network,
  Search,
  Server,
  Shield,
  ShieldAlert,
  TrendingUp,
  Wifi,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type DiscoveredAsset = {
  id: string;
  domain: string;
  type: 'web' | 'api' | 'rdp' | 'ssh' | 'database' | 'cloud' | 'iot' | 'email';
  ip: string;
  port: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isKnown: boolean;
  isShadowIT: boolean;
  lastSeen: string;
  org: string;
  cves: number;
  risk: number;
};

const DISCOVERED_ASSETS: DiscoveredAsset[] = [
  { id: 'da-1', domain: 'legacy-erp.corp.io', type: 'web', ip: '203.45.67.12', port: 443, severity: 'critical', isKnown: false, isShadowIT: true, lastSeen: '2m ago', org: 'Finance', cves: 4, risk: 97 },
  { id: 'da-2', domain: 'dev-api.staging.corp.io', type: 'api', ip: '52.14.89.201', port: 8080, severity: 'critical', isKnown: false, isShadowIT: true, lastSeen: '5m ago', org: 'Engineering', cves: 2, risk: 94 },
  { id: 'da-3', domain: 'rdp.branch-office.corp.io', type: 'rdp', ip: '10.4.5.88', port: 3389, severity: 'critical', isKnown: true, isShadowIT: false, lastSeen: '1m ago', org: 'Operations', cves: 1, risk: 92 },
  { id: 'da-4', domain: 'backup-db.internal.corp.io', type: 'database', ip: '172.16.4.55', port: 5432, severity: 'high', isKnown: false, isShadowIT: true, lastSeen: '12m ago', org: 'IT', cves: 3, risk: 87 },
  { id: 'da-5', domain: 'contractor-vpn.corp.io', type: 'ssh', ip: '198.51.100.44', port: 22, severity: 'high', isKnown: true, isShadowIT: false, lastSeen: '8m ago', org: 'Vendors', cves: 0, risk: 78 },
  { id: 'da-6', domain: 'cloud-app.corp.io', type: 'cloud', ip: '34.127.44.89', port: 443, severity: 'high', isKnown: true, isShadowIT: false, lastSeen: '3m ago', org: 'Product', cves: 1, risk: 74 },
  { id: 'da-7', domain: 'iot-gateway.mfg.corp.io', type: 'iot', ip: '10.8.12.100', port: 502, severity: 'high', isKnown: false, isShadowIT: true, lastSeen: '22m ago', org: 'Manufacturing', cves: 5, risk: 85 },
  { id: 'da-8', domain: 'mail-relay.corp.io', type: 'email', ip: '192.168.1.50', port: 25, severity: 'medium', isKnown: true, isShadowIT: false, lastSeen: '15m ago', org: 'IT', cves: 0, risk: 62 },
];

type SupplyChainVendor = {
  id: string;
  name: string;
  exposedAssets: number;
  risk: 'critical' | 'high' | 'medium' | 'low';
  lastAssessment: string;
  breachHistory: number;
};

const SUPPLY_CHAIN_VENDORS: SupplyChainVendor[] = [
  { id: 'sc-1', name: 'CloudStack Solutions', exposedAssets: 12, risk: 'critical', lastAssessment: '3 months ago', breachHistory: 2 },
  { id: 'sc-2', name: 'DataPipe Analytics', exposedAssets: 8, risk: 'high', lastAssessment: '1 month ago', breachHistory: 1 },
  { id: 'sc-3', name: 'NetSecure VPN', exposedAssets: 5, risk: 'high', lastAssessment: '2 weeks ago', breachHistory: 0 },
  { id: 'sc-4', name: 'BuildForge CI/CD', exposedAssets: 3, risk: 'medium', lastAssessment: '1 week ago', breachHistory: 0 },
  { id: 'sc-5', name: 'MonitorPro SaaS', exposedAssets: 2, risk: 'medium', lastAssessment: '2 months ago', breachHistory: 1 },
];

type ResponsePlaybook = {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  autoExecute: boolean;
  lastRun: string;
};

const RESPONSE_PLAYBOOKS: ResponsePlaybook[] = [
  { id: 'pb-1', name: 'Exposed RDP Lockdown', trigger: 'RDP port 3389 externally accessible', actions: ['Block inbound RDP at edge FW', 'Enable NLA requirement', 'Alert SOC team', 'Scan for brute force attempts'], autoExecute: true, lastRun: '4h ago' },
  { id: 'pb-2', name: 'Shadow IT Quarantine', trigger: 'Unknown asset discovered with high risk', actions: ['Isolate from production VLAN', 'Run vulnerability scan', 'Identify asset owner', 'Generate compliance exception'], autoExecute: false, lastRun: '2d ago' },
  { id: 'pb-3', name: 'Exposed API Remediation', trigger: 'API endpoint without auth on internet', actions: ['Deploy API gateway', 'Enable rate limiting', 'Add OAuth2 requirement', 'Scan for data exposure'], autoExecute: true, lastRun: '1h ago' },
  { id: 'pb-4', name: 'SSH Key Rotation', trigger: 'SSH service with default or weak credentials', actions: ['Force key rotation', 'Disable password auth', 'Update authorized_keys', 'Enable fail2ban'], autoExecute: true, lastRun: '6h ago' },
];

const TYPE_ICONS: Record<string, typeof Server> = {
  web: Globe, api: Network, rdp: Server, ssh: Key,
  database: Layers, cloud: Cloud, iot: Wifi, email: Activity,
};

const TYPE_COLORS: Record<string, string> = {
  web: '#8a8a8a', api: '#c9b787', rdp: '#f5f5f5', ssh: '#c9b787',
  database: '#c9b787', cloud: '#8a8a8a', iot: '#f5f5f5', email: '#c9b787',
};

export default function AttackSurfaceCommand() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'shadow' | 'critical'>('all');

  const totalAssets = DISCOVERED_ASSETS.length;
  const unknownAssets = DISCOVERED_ASSETS.filter((a) => !a.isKnown).length;
  const shadowIT = DISCOVERED_ASSETS.filter((a) => a.isShadowIT).length;
  const criticalExposed = DISCOVERED_ASSETS.filter((a) => a.severity === 'critical').length;
  const discoveryRate = Math.round((unknownAssets / totalAssets) * 100);

  const filtered = filter === 'shadow'
    ? DISCOVERED_ASSETS.filter((a) => a.isShadowIT)
    : filter === 'critical'
      ? DISCOVERED_ASSETS.filter((a) => a.severity === 'critical')
      : DISCOVERED_ASSETS;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-[#8a8a8a]" />
            <h1 className="text-lg font-semibold text-white">Attack Surface Command</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#8a8a8a]/30 bg-[#8a8a8a]/10 text-[#8a8a8a] font-mono uppercase">
              Xpanse-Style
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Continuous external asset discovery — shadow IT detection, supply-chain exposure, automated response playbooks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-[#c9b787]">
            <Search className="w-3 h-3" />
            Scanning continuously
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Assets Discovered', value: totalAssets.toString(), sub: 'across all segments', color: '#8a8a8a', icon: Globe },
          { label: 'Unknown Assets', value: unknownAssets.toString(), sub: `${discoveryRate}% discovery rate`, color: '#f5f5f5', icon: AlertTriangle },
          { label: 'Shadow IT Detected', value: shadowIT.toString(), sub: 'unmanaged services', color: '#c9b787', icon: Eye },
          { label: 'Critical Exposures', value: criticalExposed.toString(), sub: 'internet-facing risk', color: '#f5f5f5', icon: ShieldAlert },
          { label: 'Vendor Exposure', value: SUPPLY_CHAIN_VENDORS.length.toString(), sub: 'third-party risk vectors', color: '#c9b787', icon: Network },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#8a8a8a]" />
              External Asset Discovery
            </h2>
            <div className="flex items-center gap-1">
              {(['all', 'shadow', 'critical'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn(
                  'text-[10px] px-2 py-1 rounded border transition-colors',
                  filter === f ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300',
                )}>
                  {f === 'all' ? 'All' : f === 'shadow' ? 'Shadow IT' : 'Critical'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map((asset) => {
              const Icon = TYPE_ICONS[asset.type] ?? Server;
              const isSelected = selectedAsset === asset.id;
              return (
                <button key={asset.id} onClick={() => setSelectedAsset(isSelected ? null : asset.id)} className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  isSelected ? 'border-[#8a8a8a]/40 bg-[#8a8a8a]/5' :
                  asset.severity === 'critical' ? 'border-[#f5f5f5]/15 bg-white/3 hover:bg-white/5' :
                  'border-white/8 bg-white/3 hover:bg-white/5',
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLORS[asset.type]}15`, border: `1px solid ${TYPE_COLORS[asset.type]}30` }}>
                      <Icon className="w-4 h-4" style={{ color: TYPE_COLORS[asset.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium text-white">{asset.domain}</span>
                        {asset.isShadowIT && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10">Shadow IT</span>
                        )}
                        {!asset.isKnown && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10">Unknown</span>
                        )}
                        <span className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded border',
                          asset.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' :
                          asset.severity === 'high' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                          'text-zinc-400 border-zinc-700 bg-zinc-800/50',
                        )}>
                          {asset.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                        <span className="font-mono">{asset.ip}:{asset.port}</span>
                        <span>{asset.org}</span>
                        <span>{asset.cves} CVEs</span>
                        <span>Last: {asset.lastSeen}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn('text-sm font-bold font-mono', asset.risk >= 90 ? 'text-[#f5f5f5]' : asset.risk >= 75 ? 'text-[#c9b787]' : 'text-zinc-400')}>
                        {asset.risk}
                      </span>
                      <span className="text-[9px] text-zinc-500 block">risk</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-[#c9b787]" />
              Supply Chain Exposure
            </h2>
            <div className="space-y-2">
              {SUPPLY_CHAIN_VENDORS.map((vendor) => (
                <div key={vendor.id} className={cn(
                  'rounded-xl border p-3',
                  vendor.risk === 'critical' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{vendor.name}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      vendor.risk === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' :
                      vendor.risk === 'high' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                      'text-zinc-400 border-zinc-700 bg-zinc-800/50',
                    )}>
                      {vendor.risk}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{vendor.exposedAssets} exposed assets</span>
                    <span>{vendor.breachHistory} prior breaches</span>
                    <span>Assessed: {vendor.lastAssessment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#c9b787]" />
              Active Response Playbooks
            </h2>
            <div className="space-y-2">
              {RESPONSE_PLAYBOOKS.map((pb) => (
                <div key={pb.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{pb.name}</span>
                    {pb.autoExecute && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10">Auto</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-1.5">{pb.trigger}</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>{pb.actions.length} actions</span>
                    <span>Last run: {pb.lastRun}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
