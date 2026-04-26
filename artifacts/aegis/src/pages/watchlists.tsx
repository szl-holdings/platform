import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Globe,
  Hash,
  Plus,
  Shield,
  Target,
} from 'lucide-react';
import { useState } from 'react';

interface WatchlistItem {
  id: string;
  indicator: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  source: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hits: number;
  lastSeen: string;
  status: 'active' | 'expired' | 'investigating';
  notes: string;
}

const watchlistItems: WatchlistItem[] = [
  {
    id: 'WL-001',
    indicator: '185.220.101.34',
    type: 'ip',
    source: 'Threat Grid',
    severity: 'critical',
    hits: 47,
    lastSeen: '5m ago',
    status: 'active',
    notes: 'Known C2 server — APT28',
  },
  {
    id: 'WL-002',
    indicator: 'malware-cdn.evil.net',
    type: 'domain',
    source: 'AlienVault',
    severity: 'critical',
    hits: 12,
    lastSeen: '1h ago',
    status: 'active',
    notes: 'Malware distribution domain',
  },
  {
    id: 'WL-003',
    indicator: 'e99a18c428cb38d5f260853678922e03',
    type: 'hash',
    source: 'VirusTotal',
    severity: 'high',
    hits: 3,
    lastSeen: '3h ago',
    status: 'investigating',
    notes: 'Suspected ransomware payload',
  },
  {
    id: 'WL-004',
    indicator: 'phish@spoofed-bank.com',
    type: 'email',
    source: 'Internal',
    severity: 'medium',
    hits: 89,
    lastSeen: '30m ago',
    status: 'active',
    notes: 'Phishing campaign sender',
  },
  {
    id: 'WL-005',
    indicator: '45.33.32.156',
    type: 'ip',
    source: 'MITRE',
    severity: 'high',
    hits: 22,
    lastSeen: '2h ago',
    status: 'active',
    notes: 'Port scanning source',
  },
  {
    id: 'WL-006',
    indicator: 'https://fakeupdater.xyz/chrome.exe',
    type: 'url',
    source: 'Abuse.ch',
    severity: 'critical',
    hits: 5,
    lastSeen: '15m ago',
    status: 'active',
    notes: 'Fake browser update payload',
  },
  {
    id: 'WL-007',
    indicator: 'data-harvest.info',
    type: 'domain',
    source: 'Internal',
    severity: 'medium',
    hits: 0,
    lastSeen: 'Never',
    status: 'active',
    notes: 'Suspected data exfiltration endpoint',
  },
];

const typeIcons: Record<string, typeof Globe> = {
  ip: Globe,
  domain: Globe,
  hash: Hash,
  email: Target,
  url: Globe,
};
const sevColors: Record<string, string> = {
  critical: 'bg-[#f5f5f5]/10 text-[#f5f5f5]',
  high: 'bg-[#c9b787]/10 text-[#c9b787]',
  medium: 'bg-[#c9b787]/10 text-[#c9b787]',
  low: 'bg-[#c9b787]/10 text-[#c9b787]',
};

export default function Watchlists() {
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered =
    typeFilter === 'all' ? watchlistItems : watchlistItems.filter((w) => w.type === typeFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Alert Watchlists</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitored indicators of compromise (IOCs) and threat artifacts
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Indicator
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Indicators',
            value: watchlistItems.length,
            icon: Eye,
            color: 'text-[#c9b787]',
          },
          {
            label: 'Active Hits Today',
            value: watchlistItems.reduce((a, w) => a + w.hits, 0),
            icon: Target,
            color: 'text-[#f5f5f5]',
          },
          {
            label: 'Critical',
            value: watchlistItems.filter((w) => w.severity === 'critical').length,
            icon: AlertTriangle,
            color: 'text-[#f5f5f5]',
          },
          {
            label: 'Investigating',
            value: watchlistItems.filter((w) => w.status === 'investigating').length,
            icon: Shield,
            color: 'text-[#c9b787]',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {['all', 'ip', 'domain', 'hash', 'email', 'url'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {t === 'all' ? 'All Types' : t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            watchlistItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                headline="No indicators on watch"
                description="Threat intel feeds are quiet — no IOCs are being monitored right now."
                accentColor="#c9b787"
                compact
              />
            ) : (
              <EmptyState
                icon={Filter}
                headline={`No ${typeFilter.toUpperCase()} indicators on watch`}
                description="Switch to another indicator type to inspect what's being monitored."
                accentColor="#8b7ac8"
                action={{ label: 'Show all types', onClick: () => setTypeFilter('all') }}
                compact
              />
            )
          ) : (
            filtered.map((item) => {
              const TypeIcon = typeIcons[item.type] || Globe;
              return (
                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm font-mono font-medium">{item.indicator}</code>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sevColors[item.severity]}`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.hits} hits</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.lastSeen}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.notes} · Source: {item.source}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
