import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Globe,
  Link2,
  Radio,
  Shield,
  Target,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';

type StixType =
  | 'indicator'
  | 'malware'
  | 'attack-pattern'
  | 'threat-actor'
  | 'campaign'
  | 'vulnerability'
  | 'course-of-action';

interface StixObject {
  id: string;
  type: StixType;
  name: string;
  description: string;
  created: string;
  modified: string;
  confidence?: number;
  labels?: string[];
  pattern?: string;
  stixId: string;
  tlpLevel: 'WHITE' | 'GREEN' | 'AMBER' | 'RED';
}

const STIX_OBJECTS: StixObject[] = [
  {
    id: 'IND-001',
    type: 'indicator',
    name: 'APT29 C2 IP Range',
    description:
      'Known C2 infrastructure associated with APT29 Cozy Bear — observed in SZL Corp intrusion',
    created: '2024-03-15T09:41:00Z',
    modified: '2024-03-29T14:22:00Z',
    confidence: 95,
    labels: ['malicious-activity', 'apt29'],
    pattern: "[ipv4-addr:value = '103.45.67.89']",
    stixId: 'indicator--e8098b1e-4f3c-4d7f-a54a-1c97d41fa432',
    tlpLevel: 'AMBER',
  },
  {
    id: 'MAL-001',
    type: 'malware',
    name: 'SUNBURST Backdoor',
    description:
      'Trojanized SolarWinds update — used for initial access and C2 beaconing. Identified in active incident INC-2846.',
    created: '2024-03-20T00:00:00Z',
    modified: '2024-03-28T11:00:00Z',
    confidence: 98,
    labels: ['backdoor', 'trojan', 'apt'],
    stixId: 'malware--c4e851fa-775f-11e7-8163-b774922098cd',
    tlpLevel: 'AMBER',
  },
  {
    id: 'ATK-001',
    type: 'attack-pattern',
    name: 'SMB/Windows Admin Shares (T1021.002)',
    description:
      'Adversary use of SMB and admin shares for lateral movement across SZL Corp network — observed on DC-PROD-03',
    created: '2024-03-15T10:00:00Z',
    modified: '2024-03-29T09:00:00Z',
    confidence: 94,
    labels: ['lateral-movement', 'mitre-attack'],
    stixId: 'attack-pattern--4f9ca633-9303-4f1d-9e79-ea7eb89765c7',
    tlpLevel: 'GREEN',
  },
  {
    id: 'TA-001',
    type: 'threat-actor',
    name: 'APT29 / Cozy Bear',
    description:
      'Russian SVR-affiliated threat actor. Known for spearphishing, supply chain attacks, and long-term persistence. Attributed to active SZL Corp intrusion.',
    created: '2020-01-01T00:00:00Z',
    modified: '2024-03-29T00:00:00Z',
    confidence: 87,
    labels: ['nation-state', 'russia', 'apt'],
    stixId: 'threat-actor--c5c25405-0a98-5860-8fb8-f25d6df41d3b',
    tlpLevel: 'AMBER',
  },
  {
    id: 'CAM-001',
    type: 'campaign',
    name: 'Operation SZL Darkwing',
    description:
      'Multi-stage intrusion campaign targeting SZL Corp financial systems. Initial phishing → credential harvest → lateral movement → data staging → exfiltration attempt.',
    created: '2024-03-12T00:00:00Z',
    modified: '2024-03-29T14:00:00Z',
    confidence: 91,
    labels: ['financial', 'apt', 'active'],
    stixId: 'campaign--721976f9-e68a-4a71-8619-6027b7d5d7c0',
    tlpLevel: 'RED',
  },
  {
    id: 'VUL-001',
    type: 'vulnerability',
    name: 'CVE-2024-3400',
    description:
      'Palo Alto Networks PAN-OS command injection vulnerability. CVSS 10.0. Exploited by APT in active campaign targeting SZL perimeter firewall.',
    created: '2024-04-12T00:00:00Z',
    modified: '2024-04-12T00:00:00Z',
    confidence: 100,
    labels: ['cve', 'critical', 'actively-exploited'],
    stixId: 'vulnerability--91c1b8d7-a2e0-4e02-aadc-2a5c4c4e07b1',
    tlpLevel: 'GREEN',
  },
  {
    id: 'COA-001',
    type: 'course-of-action',
    name: 'Block APT29 C2 Infrastructure',
    description:
      'Firewall rule to block all traffic to known APT29 C2 IP ranges. Deploy on FW-EDGE-01 and FW-DMZ-02 immediately.',
    created: '2024-03-29T14:00:00Z',
    modified: '2024-03-29T14:22:00Z',
    confidence: 100,
    labels: ['mitigation', 'network-defense'],
    stixId: 'course-of-action--65e8b4e5-e8c8-4a26-8e5d-2a4e2f1d8b41',
    tlpLevel: 'GREEN',
  },
];

const TAXII_FEEDS = [
  {
    id: 'FEED-001',
    name: 'CISA AIS (Automated Indicator Sharing)',
    url: 'https://ais.cisa.gov/taxii2/',
    status: 'active',
    lastSync: '5m ago',
    objects: 1847,
    type: 'government',
    tlp: 'WHITE',
  },
  {
    id: 'FEED-002',
    name: 'DHS NCCIC Threat Feed',
    url: 'https://nccic.cisa.gov/taxii/',
    status: 'active',
    lastSync: '12m ago',
    objects: 932,
    type: 'government',
    tlp: 'GREEN',
  },
  {
    id: 'FEED-003',
    name: 'ISH ISAC Financial Sector',
    url: 'https://fs-isac.org/taxii2/',
    status: 'active',
    lastSync: '1h ago',
    objects: 2104,
    type: 'isac',
    tlp: 'AMBER',
  },
  {
    id: 'FEED-004',
    name: 'AlienVault OTX TAXII',
    url: 'https://otx.alienvault.com/taxii/',
    status: 'active',
    lastSync: '3m ago',
    objects: 5622,
    type: 'commercial',
    tlp: 'GREEN',
  },
  {
    id: 'FEED-005',
    name: 'MISP Community Feed',
    url: 'https://misp.circl.lu/taxii/',
    status: 'syncing',
    lastSync: 'Syncing...',
    objects: 3211,
    type: 'community',
    tlp: 'WHITE',
  },
  {
    id: 'FEED-006',
    name: 'BSI DE-Cert Intel Feed',
    url: 'https://www.bsi.bund.de/taxii/',
    status: 'error',
    lastSync: '2h ago',
    objects: 441,
    type: 'government',
    tlp: 'AMBER',
  },
];

const typeIcons: Record<StixType, typeof Shield> = {
  indicator: Target,
  malware: Bug,
  'attack-pattern': Activity,
  'threat-actor': Shield,
  campaign: Radio,
  vulnerability: AlertTriangle,
  'course-of-action': CheckCircle,
};

const typeColors: Record<StixType, string> = {
  indicator: '#f5f5f5',
  malware: '#c9b787',
  'attack-pattern': '#8a8a8a',
  'threat-actor': '#c9b787',
  campaign: '#c9b787',
  vulnerability: '#c9b787',
  'course-of-action': '#c9b787',
};

const tlpColors: Record<string, string> = {
  WHITE: 'text-white/60 bg-white/5 border-white/10',
  GREEN: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20',
  AMBER: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20',
  RED: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/20',
};

const feedStatusColors: Record<string, string> = {
  active: 'text-[#c9b787]',
  syncing: 'text-[#c9b787]',
  error: 'text-[#f5f5f5]',
};

const feedTypeColors: Record<string, string> = {
  government: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20',
  isac: 'text-[#8a8a8a] bg-[#8a8a8a]/10 border-[#8a8a8a]/20',
  commercial: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20',
  community: 'text-white/50 bg-white/5 border-white/10',
};

export default function StixTaxii() {
  const [activeTab, setActiveTab] = useState<'objects' | 'feeds' | 'export'>('objects');
  const [selectedType, setSelectedType] = useState<StixType | 'all'>('all');
  const [selectedObject, setSelectedObject] = useState<StixObject | null>(STIX_OBJECTS[0]);
  const [_selectedForExport, _setSelectedForExport] = useState<Set<string>>(new Set());

  const { data: stixData } = useStandardQuery({
    queryKey: ['stix-objects'],
    queryFn: () => api.stix.objects(),
    staleTime: 120_000,
    retry: false,
  });

  const { data: taxiiData } = useStandardQuery({
    queryKey: ['taxii-feeds'],
    queryFn: () => api.taxii.feeds(),
    staleTime: 60_000,
    retry: false,
  });

  const exportMutation = useStandardMutation({
    mutationFn: (objectIds: string[]) => api.stix.export(objectIds, 'Sentra Intelligence Bundle'),
    onSuccess: (data) => {
      toast.success(`STIX bundle exported — ID: ${data?.data?.bundle?.id?.slice(0, 30) ?? 'N/A'}`);
    },
    onError: () => {
      toast.error('Export failed — authentication required');
    },
  });

  const apiObjects = stixData?.data?.objects;
  const apiFeeds = taxiiData?.data?.feeds;
  const filteredObjects =
    selectedType === 'all' ? STIX_OBJECTS : STIX_OBJECTS.filter((o) => o.type === selectedType);
  const displayFeedCount = apiFeeds?.length ?? TAXII_FEEDS.length;
  const totalObjects = apiObjects ? apiObjects.length + STIX_OBJECTS.length : STIX_OBJECTS.length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#8a8a8a]" />
            STIX/TAXII Protocol Layer
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            STIX 2.1 threat intelligence objects · TAXII 2.1 bidirectional sharing · NSA/CISA-grade
            interoperability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[#c9b787] bg-[#c9b787]/10 px-2.5 py-1 rounded-lg border border-[#c9b787]/20">
            <Radio className="w-3 h-3 animate-pulse" /> TAXII Server Active
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 hover:bg-[#8a8a8a]/20 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Ingest Feed
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'STIX Objects', value: totalObjects.toString(), color: '#8a8a8a' },
          { label: 'TAXII Feeds', value: displayFeedCount.toString(), color: '#c9b787' },
          {
            label: 'Objects Ingested',
            value: taxiiData?.data?.totalObjects?.toLocaleString() ?? '13,657',
            color: '#8a8a8a',
          },
          {
            label: 'Sharing Partners',
            value: taxiiData?.data?.sharingPartners?.toString() ?? '6',
            color: '#c9b787',
          },
          { label: 'Last Bundle Export', value: '2h ago', color: '#c9b787' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/6 bg-white/[0.015] p-3">
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/6">
        {(
          [
            ['objects', 'STIX Object Library'],
            ['feeds', 'TAXII Feeds'],
            ['export', 'Bundle Export'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-[#8a8a8a] text-[#8a8a8a]'
                : 'border-transparent text-white/40 hover:text-white/70',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'objects' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="space-y-2">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(
                [
                  'all',
                  'indicator',
                  'malware',
                  'attack-pattern',
                  'threat-actor',
                  'campaign',
                  'vulnerability',
                  'course-of-action',
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-all',
                    selectedType === t
                      ? t === 'all'
                        ? 'bg-white/10 text-white'
                        : `text-white`
                      : 'text-white/30 hover:text-white/60',
                  )}
                  style={
                    selectedType === t && t !== 'all'
                      ? { background: `${typeColors[t]}15`, color: typeColors[t] }
                      : {}
                  }
                >
                  {t === 'all' ? 'All' : t.replace('-', ' ')}
                </button>
              ))}
            </div>
            {filteredObjects.map((obj) => {
              const Icon = typeIcons[obj.type];
              return (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObject(obj)}
                  className={cn(
                    'rounded-xl border p-3 cursor-pointer transition-all',
                    selectedObject?.id === obj.id
                      ? 'border-[#8a8a8a]/30 bg-[#8a8a8a]/5'
                      : 'border-white/6 bg-white/[0.015] hover:border-white/10',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${typeColors[obj.type]}12` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: typeColors[obj.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-white/80 truncate">
                          {obj.name}
                        </span>
                        <span
                          className={cn(
                            'text-[8px] px-1 py-0.5 rounded border uppercase font-bold shrink-0',
                            tlpColors[obj.tlpLevel],
                          )}
                        >
                          TLP:{obj.tlpLevel}
                        </span>
                      </div>
                      <div className="text-[9px] text-white/30 mt-0.5 capitalize">
                        {obj.type.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedObject && (
            <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const Icon = typeIcons[selectedObject.type];
                      return (
                        <Icon
                          className="w-4 h-4"
                          style={{ color: typeColors[selectedObject.type] }}
                        />
                      );
                    })()}
                    <h2 className="text-sm font-bold text-white">{selectedObject.name}</h2>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed max-w-[500px]">
                    {selectedObject.description}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0',
                    tlpColors[selectedObject.tlpLevel],
                  )}
                >
                  TLP:{selectedObject.tlpLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'STIX Type', value: selectedObject.type.replace(/-/g, ' ') },
                  { label: 'Confidence', value: `${selectedObject.confidence}%` },
                  { label: 'Created', value: selectedObject.created.slice(0, 10) },
                  { label: 'Modified', value: selectedObject.modified.slice(0, 10) },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5"
                  >
                    <div className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">
                      {f.label}
                    </div>
                    <div className="text-[11px] font-medium text-white/70 capitalize">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              {selectedObject.labels && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-2">
                    Labels
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedObject.labels.map((l) => (
                      <span
                        key={l}
                        className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/8"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedObject.pattern && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-2">
                    Detection Pattern (STIX 2.1)
                  </div>
                  <div className="rounded-lg bg-black/30 border border-white/8 p-3 font-mono text-[11px] text-[#8a8a8a]">
                    {selectedObject.pattern}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[9px] uppercase tracking-wider text-white/25 mb-2">
                  STIX ID
                </div>
                <div className="rounded-lg bg-black/30 border border-white/8 p-2 font-mono text-[10px] text-white/40 break-all">
                  {selectedObject.stixId}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => selectedObject && exportMutation.mutate([selectedObject.stixId])}
                  disabled={exportMutation.isPending || !selectedObject}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 hover:bg-[#8a8a8a]/20 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />{' '}
                  {exportMutation.isPending ? 'Exporting...' : 'Export as STIX Bundle'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Add to Watchlist
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feeds' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/6 overflow-hidden">
            <div className="divide-y divide-white/4">
              {TAXII_FEEDS.map((feed) => (
                <div key={feed.id} className="p-4 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          feed.status === 'active'
                            ? 'bg-[#c9b787] animate-pulse'
                            : feed.status === 'syncing'
                              ? 'bg-[#c9b787] animate-pulse'
                              : 'bg-[#f5f5f5]',
                        )}
                      />
                      <Globe className="w-4 h-4 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white/80">{feed.name}</span>
                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold',
                            feedTypeColors[feed.type],
                          )}
                        >
                          {feed.type}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold',
                            tlpColors[feed.tlp],
                          )}
                        >
                          TLP:{feed.tlp}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/25 mt-0.5 font-mono">{feed.url}</div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div
                        className={cn('text-[10px] font-semibold', feedStatusColors[feed.status])}
                      >
                        {feed.status.toUpperCase()}
                      </div>
                      <div className="text-[9px] text-white/25">
                        {feed.objects.toLocaleString()} objects
                      </div>
                      <div className="text-[9px] text-white/20">{feed.lastSync}</div>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-white/40 hover:bg-white/10 transition-colors shrink-0">
                      Sync Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#8a8a8a]/15 bg-[#8a8a8a]/5 p-4">
            <div className="text-[10px] font-bold text-[#8a8a8a]/70 uppercase tracking-wider mb-2">
              TAXII 2.1 Server Configuration
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
              {[
                { label: 'Server URL', value: 'https://aegis.szlholdings.com/taxii/', mono: true },
                { label: 'API Root', value: '/taxii/default/', mono: true },
                { label: 'Collections', value: '3 (indicators, malware, campaigns)', mono: false },
              ].map((c) => (
                <div key={c.label}>
                  <div className="text-white/30 mb-0.5">{c.label}</div>
                  <div className={cn('text-white/70', c.mono && 'font-mono')}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5 space-y-4">
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Generate STIX Bundle
            </div>
            <div className="space-y-3">
              {[
                { label: 'Bundle Name', placeholder: 'SZL Corp — Operation Darkwing Bundle' },
                {
                  label: 'Description',
                  placeholder: 'Threat intelligence bundle from active APT29 campaign',
                },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                    {f.label}
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/8 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-[#8a8a8a]/40"
                    placeholder={f.placeholder}
                    defaultValue={f.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">
                  Include Object Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'indicator',
                      'malware',
                      'attack-pattern',
                      'threat-actor',
                      'campaign',
                      'vulnerability',
                      'course-of-action',
                    ] as StixType[]
                  ).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-3 h-3 rounded accent-cyan-500"
                      />
                      <span className="text-[10px] text-white/50 capitalize">
                        {t.replace(/-/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                  TLP Marking
                </label>
                <select className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/8 text-xs text-white/70 focus:outline-none">
                  <option>TLP:AMBER (default)</option>
                  <option>TLP:GREEN</option>
                  <option>TLP:WHITE</option>
                  <option>TLP:RED (restricted)</option>
                </select>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#8a8a8a]/15 text-[#8a8a8a] border border-[#8a8a8a]/25 hover:bg-[#8a8a8a]/25 transition-colors text-xs font-semibold">
                <Download className="w-4 h-4" /> Export STIX 2.1 Bundle (JSON)
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5 space-y-4">
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Recent Exports
            </div>
            <div className="space-y-2">
              {[
                {
                  name: 'APT29 Campaign Bundle',
                  objects: 7,
                  exported: '2h ago',
                  tlp: 'AMBER',
                  size: '48 KB',
                },
                {
                  name: 'SZL IOC Export — Weekly',
                  objects: 24,
                  exported: '1d ago',
                  tlp: 'GREEN',
                  size: '182 KB',
                },
                {
                  name: 'ISAC Sharing Package',
                  objects: 12,
                  exported: '3d ago',
                  tlp: 'AMBER',
                  size: '96 KB',
                },
                {
                  name: 'NIS2 Incident Report Bundle',
                  objects: 18,
                  exported: '1w ago',
                  tlp: 'AMBER',
                  size: '134 KB',
                },
              ].map((exp) => (
                <div
                  key={exp.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.03] transition-colors group"
                >
                  <FileText className="w-4 h-4 text-[#8a8a8a]/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-white/70">{exp.name}</div>
                    <div className="text-[9px] text-white/30 mt-0.5">
                      {exp.objects} objects · {exp.size} · TLP:{exp.tlp}
                    </div>
                  </div>
                  <div className="text-[9px] text-white/25 shrink-0">{exp.exported}</div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Download className="w-3.5 h-3.5 text-[#8a8a8a]" />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/6 bg-black/20 p-3">
              <div className="text-[9px] uppercase tracking-wider text-white/25 mb-2">
                Sample STIX 2.1 Bundle Format
              </div>
              <pre className="text-[9px] text-[#8a8a8a]/70 font-mono leading-relaxed overflow-x-auto">{`{
  "type": "bundle",
  "id": "bundle--ae47a22c-...",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--e8098b1e-...",
      "pattern": "[ipv4-addr:value = '103.45.67.89']",
      "pattern_type": "stix",
      "valid_from": "2024-03-15T09:41:00Z",
      "confidence": 95
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
