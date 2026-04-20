import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Anchor,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Link2,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#0ea5e9';
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const KNOWN_VESSELS = [
  { imo: '9234567', name: 'Pacific Guardian', flag: 'LR', type: 'VLCC Tanker' },
  { imo: '9456789', name: 'Liberty Wave', flag: 'PA', type: 'Container' },
  { imo: '9678901', name: 'Meridian Bulk', flag: 'MH', type: 'Capesize Bulker' },
  { imo: '9890123', name: 'Arctic Breeze', flag: 'NO', type: 'LNG Carrier' },
  { imo: '9012345', name: 'Cape Resolute', flag: 'PA', type: 'Panamax Bulk' },
  { imo: '9135791', name: 'Horizon Star', flag: 'AE', type: 'Chemical Tanker' },
];

const ENTITY_ICONS: Record<string, React.FC<any>> = {
  vessel: Anchor,
  registered_owner: Building2,
  beneficial_owner: Building2,
  ubi: Building2,
};

interface ChainHop {
  hopIndex: number;
  entityType: string;
  entityName: string;
  entityId: string;
  country: string;
  registeredAt: string;
  sanctioned: boolean;
  sanctionListMatches?: string[];
  evidence: string[];
  confidence: number;
}

interface ChainData {
  vesselImo: string;
  vesselName: string;
  vesselFlag: string;
  vesselType: string;
  chain: ChainHop[];
  analysis: {
    totalHops: number;
    sanctionedHops: number;
    overallRisk: string;
    sanctionListExposure: string[];
    ultimateBeneficialOwnerFound: boolean;
    averageConfidence: number;
  };
  recommendation: string;
  provenance: {
    confidence: number;
    verifierApproved: boolean;
    attestation: string;
    freshness: { fetchedAt: string };
  };
}

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    label: 'Critical',
  },
  high: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.20)',
    label: 'High',
  },
  medium: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.20)',
    label: 'Medium',
  },
  low: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.20)',
    label: 'Low',
  },
};

function HopCard({ hop, isLast }: { hop: ChainHop; isLast: boolean }) {
  const Icon = ENTITY_ICONS[hop.entityType] ?? Building2;
  const isSanctioned = hop.sanctioned;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0',
            isSanctioned ? 'border-red-500/40 bg-red-500/10' : 'border-sky-500/20 bg-sky-500/05',
          )}
          style={{ background: isSanctioned ? 'rgba(239,68,68,0.08)' : 'rgba(14,165,233,0.06)' }}
        >
          <Icon className={cn('w-3.5 h-3.5', isSanctioned ? 'text-red-400' : 'text-sky-400')} />
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1 mb-1"
            style={{ background: isSanctioned ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.15)' }}
          />
        )}
      </div>
      <div
        className={cn(
          'flex-1 rounded-xl p-3.5 border mb-2 transition-all',
          isSanctioned ? 'border-red-500/25' : 'border-sky-500/10',
        )}
        style={{ background: isSanctioned ? 'rgba(239,68,68,0.05)' : 'rgba(10,22,40,0.7)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] uppercase tracking-wider text-sky-400/50">
                {hop.entityType.replace(/_/g, ' ')}
              </span>
              <span className="text-[9px] text-sky-400/30">Hop {hop.hopIndex}</span>
            </div>
            <div
              className={cn(
                'text-[12px] font-semibold',
                isSanctioned ? 'text-red-200' : 'text-sky-100',
              )}
            >
              {hop.entityName}
            </div>
            <div className="text-[10px] text-sky-400/50 mt-0.5">
              {hop.entityId} · {hop.country} · Reg. {hop.registeredAt}
            </div>
          </div>
          {isSanctioned ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/25 flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[9px] text-red-300 font-medium">SANCTIONED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-300">Clear</span>
            </div>
          )}
        </div>
        {isSanctioned && hop.sanctionListMatches && hop.sanctionListMatches.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {hop.sanctionListMatches.map((list) => (
              <span
                key={list}
                className="text-[9px] px-2 py-0.5 rounded-full border border-red-500/30 text-red-300 bg-red-500/10"
              >
                {list}
              </span>
            ))}
          </div>
        )}
        {hop.evidence.length > 0 && (
          <div className="mt-2">
            <div className="text-[9px] text-sky-400/40 mb-1">Evidence Sources</div>
            <div className="flex flex-wrap gap-1">
              {hop.evidence.map((ev) => (
                <span
                  key={ev}
                  className="text-[9px] px-1.5 py-0.5 rounded border border-sky-500/15 text-sky-400/50"
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-1">
          <div className="h-1 rounded-full flex-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-1 rounded-full"
              style={{
                width: `${hop.confidence * 100}%`,
                background: isSanctioned ? '#f87171' : '#38bdf8',
              }}
            />
          </div>
          <span className="text-[9px] text-sky-400/40">
            {Math.round(hop.confidence * 100)}% conf.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SanctionsChainExplorerPage() {
  const [selectedImo, setSelectedImo] = useState<string>(KNOWN_VESSELS[0].imo);
  const [data, setData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(imo: string) {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/vessels/cognitive/sanctions-chain/${imo}`);
      if (r.ok) setData((await r.json()) as ChainData);
    } catch {}
    setLoading(false);
  }

  function select(imo: string) {
    setSelectedImo(imo);
    void load(imo);
  }

  const overallRisk = data?.analysis.overallRisk ?? 'low';
  const riskCfg = RISK_CONFIG[overallRisk] ?? RISK_CONFIG.low;

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Sanctions Chain Explorer</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">
              COGNITIVE RUNTIME
            </Badge>
          </div>
          <p className="text-xs text-sky-400/60">
            Walks ownership and control chains hop-by-hop with evidence on each link. Detects
            beneficial owner sanction exposure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <div
            className="rounded-xl border border-sky-500/10 p-3 mb-4"
            style={{ background: 'rgba(10,22,40,0.8)' }}
          >
            <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-3 h-3" /> Select Vessel
            </div>
            <div className="space-y-1.5">
              {KNOWN_VESSELS.map((v) => (
                <button
                  key={v.imo}
                  onClick={() => select(v.imo)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg border transition-all',
                    selectedImo === v.imo
                      ? 'bg-sky-500/10 border-sky-500/25 text-sky-200'
                      : 'border-sky-500/08 text-sky-400/60 hover:text-sky-300 hover:border-sky-500/15',
                  )}
                >
                  <div className="text-[11px] font-medium">{v.name}</div>
                  <div className="text-[9px] text-sky-400/40 mt-0.5">
                    IMO {v.imo} · {v.flag} · {v.type}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {data && (
            <div
              className="rounded-xl border p-4"
              style={{ background: riskCfg.bg, borderColor: riskCfg.border }}
            >
              <div
                className="text-[10px] uppercase tracking-wider mb-2"
                style={{ color: riskCfg.color }}
              >
                Overall Risk
              </div>
              <div className="text-2xl font-bold capitalize mb-3" style={{ color: riskCfg.color }}>
                {overallRisk}
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Chain Depth</span>
                  <span className="text-sky-200">{data.analysis.totalHops} hops</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Sanctioned Hops</span>
                  <span style={{ color: data.analysis.sanctionedHops > 0 ? '#f87171' : '#34d399' }}>
                    {data.analysis.sanctionedHops}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">UBO Found</span>
                  <span
                    style={{
                      color: data.analysis.ultimateBeneficialOwnerFound ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {data.analysis.ultimateBeneficialOwnerFound ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Avg Confidence</span>
                  <span className="text-sky-200">
                    {Math.round(data.analysis.averageConfidence * 100)}%
                  </span>
                </div>
              </div>
              {data.analysis.sanctionListExposure.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <div className="text-[9px] text-red-400/70 mb-1.5">Sanction List Exposure</div>
                  {data.analysis.sanctionListExposure.map((list) => (
                    <div
                      key={list}
                      className="flex items-center gap-1.5 text-[10px] text-red-300/80 mb-1"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> {list}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data && (
            <div
              className="rounded-xl border border-sky-500/10 p-3 mt-3"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="text-[10px] text-sky-400/50 mb-2">Provenance</div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-sky-300/60">{data.provenance.attestation}</span>
              </div>
              <div className="text-[10px] text-sky-400/40">
                {Math.round(data.provenance.confidence * 100)}% confidence ·{' '}
                {new Date(data.provenance.freshness.fetchedAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-8">
          {!data && !loading && (
            <div
              className="flex flex-col items-center justify-center h-64 text-center rounded-xl border border-sky-500/10"
              style={{ background: 'rgba(10,22,40,0.5)' }}
            >
              <Eye className="w-8 h-8 text-sky-400/20 mb-3" />
              <p className="text-sky-400/40 text-sm">
                Select a vessel to explore its ownership chain
              </p>
              <button
                onClick={() => select(selectedImo)}
                className="mt-4 px-4 py-2 rounded-lg text-xs text-sky-400 border border-sky-500/25 hover:border-sky-500/40 transition-colors flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5" /> Load Chain
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64 text-sky-400/40 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Building ownership chain…
            </div>
          )}

          {data && !loading && (
            <div>
              <div
                className="flex items-center gap-3 mb-5 p-3 rounded-xl border"
                style={{ background: 'rgba(10,22,40,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <Anchor className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-sm font-semibold text-sky-100">{data.vesselName}</div>
                  <div className="text-[10px] text-sky-400/50">
                    IMO {data.vesselImo} · {data.vesselFlag} · {data.vesselType}
                  </div>
                </div>
                {data.analysis.sanctionedHops > 0 && (
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] text-red-300 font-medium">DO NOT ENGAGE</span>
                  </div>
                )}
              </div>

              <div>
                {data.chain.map((hop, i) => (
                  <HopCard key={hop.hopIndex} hop={hop} isLast={i === data.chain.length - 1} />
                ))}
              </div>

              <div
                className="mt-4 p-3.5 rounded-xl border"
                style={{
                  background:
                    data.analysis.sanctionedHops > 0
                      ? 'rgba(239,68,68,0.06)'
                      : 'rgba(52,211,153,0.05)',
                  borderColor:
                    data.analysis.sanctionedHops > 0
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(52,211,153,0.15)',
                }}
              >
                <div className="flex items-start gap-2">
                  {data.analysis.sanctionedHops > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div
                      className="text-[11px] font-medium mb-0.5"
                      style={{ color: data.analysis.sanctionedHops > 0 ? '#fca5a5' : '#6ee7b7' }}
                    >
                      Compliance Recommendation
                    </div>
                    <div className="text-[11px] text-sky-300/70">{data.recommendation}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
