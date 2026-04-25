import { ingestVesselsInsuranceException, type DocumentPipelineResult } from '@szl-holdings/document-intelligence';
import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  FileSearch,
  Filter,
  Link2,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFleetExceptions } from '@/hooks/use-vessels-data';

type FleetException = ReturnType<typeof useFleetExceptions>['fleetExceptions'][number];

const ACCENT = 'hsl(205 70% 50%)';

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#f87171', bg: '#9b1c1c08', border: '#9b1c1c35' },
  high: { color: '#c04a2a', bg: '#c04a2a08', border: '#c04a2a25' },
  medium: { color: '#c08a2c', bg: '#c08a2c08', border: '#c08a2c20' },
  low: {
    color: 'rgba(255,255,255,0.45)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
  },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: '#c04a2a', bg: '#c04a2a20' },
  investigating: { color: '#c08a2c', bg: '#c08a2c20' },
  resolved: { color: '#40856a', bg: '#40856a20' },
  escalated: { color: '#a855f7', bg: '#a855f720' },
};

const TYPE_LABELS: Record<string, string> = {
  ais_gap: 'AIS Gap',
  route_deviation: 'Route Deviation',
  sanctions_exposure: 'Sanctions Exposure',
  psc_deficiency: 'PSC Deficiency',
  cert_expired: 'Certificate Expired',
  port_detention: 'Port Detention',
  weather_diversion: 'Weather Diversion',
  cargo_discrepancy: 'Cargo Discrepancy',
};

function ExceptionCard({
  exc,
  onResolve,
}: {
  exc: FleetException;
  onResolve: (id: string) => void;
}) {
  const ss = SEVERITY_STYLE[exc.severity];
  const ts = STATUS_STYLE[exc.status];
  return (
    <div className="rounded-xl border p-4" style={{ background: ss.bg, borderColor: ss.border }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: ss.color, flexShrink: 0 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {TYPE_LABELS[exc.type] ?? exc.type.replace(/_/g, ' ')}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {exc.vesselName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: ts.bg, color: ts.color }}
          >
            {exc.status}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}
          >
            {exc.severity}
          </span>
        </div>
      </div>
      <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {exc.description}
      </p>
      <div
        className="flex items-center gap-3 text-xs mb-3"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <span className="flex items-center gap-1">
          <Clock size={10} />
          Detected {relTime(exc.detectedAt)}
        </span>
        {exc.owner && exc.owner !== '—' && (
          <span className="flex items-center gap-1">
            <User size={10} />
            {exc.owner}
          </span>
        )}
      </div>
      {exc.status !== 'resolved' && (
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(exc.id)}
            className="text-xs px-3 py-1 rounded-md font-medium"
            style={{ background: 'hsl(205 70% 38%)', color: 'white' }}
          >
            <CheckCircle size={12} className="inline mr-1" />
            Resolve
          </button>
          <button
            className="text-xs px-3 py-1 rounded-md hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            Escalate
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExceptionQueue() {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('open');
  const [pipelineResult, setPipelineResult] = useState<DocumentPipelineResult | null>(null);

  useEffect(() => {
    ingestVesselsInsuranceException({
      fileName: 'pi_cert_atlantic_condor_2026.pdf',
      exceptionType: 'p_and_i',
      vesselId: 'MV-ATLANTIC-CONDOR',
      claimRef: 'CLM-2026-0041',
    })
      .then(setPipelineResult)
      .catch(() => {});
  }, []);

  const { fleetExceptions } = useFleetExceptions();

  const exceptions = fleetExceptions.map((e: FleetException) => ({
    ...e,
    status: resolved.has(e.id) ? ('resolved' as const) : e.status,
  }));

  const displayed = exceptions.filter(
    (e: FleetException) =>
      filter === 'all' || (filter === 'open' && e.status !== 'resolved') || e.status === filter,
  );

  const openCount = exceptions.filter((e: FleetException) => e.status !== 'resolved').length;
  const criticalCount = exceptions.filter(
    (e: FleetException) => e.severity === 'critical' && e.status !== 'resolved',
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Exception Queue
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Fleet-wide exception management — AIS gaps, deviations, detentions, cert issues
          </p>
        </div>
        {criticalCount > 0 && (
          <span
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: '#9b1c1c20', color: '#f87171', border: '1px solid #9b1c1c40' }}
          >
            <AlertTriangle size={12} />
            {criticalCount} critical
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open', value: openCount, color: '#c04a2a' },
          { label: 'Critical', value: criticalCount, color: '#f87171' },
          {
            label: 'Acknowledged',
            value: exceptions.filter((e: FleetException) => e.status === 'acknowledged').length,
            color: '#c08a2c',
          },
          {
            label: 'Resolved',
            value: exceptions.filter((e) => e.status === 'resolved').length,
            color: '#40856a',
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-4"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {m.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {['open', 'investigating', 'resolved', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-lg capitalize transition-colors"
            style={{
              background: filter === f ? 'hsl(205 70% 38% / 0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? ACCENT : 'rgba(255,255,255,0.4)',
              border: `1px solid ${filter === f ? 'hsl(205 70% 38% / 0.35)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-4 mb-5" style={{ background: 'rgba(6,182,212,0.03)', borderColor: 'rgba(6,182,212,0.12)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <FileSearch size={14} style={{ color: '#06b6d4' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>Insurance Document Intelligence</p>
            <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {pipelineResult
                ? `v${pipelineResult.provenance.pipelineVersion} · ${pipelineResult.provenance.stages.length} stages · ${pipelineResult.provenance.fileName} · lane: ${pipelineResult.provenance.lane}`
                : 'document-intelligence · OCR → layout → QA · v0.1.0 · lane: vessels'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
            <Cpu size={9} />
            {pipelineResult ? 'pipeline complete' : 'pipeline active'}
          </div>
        </div>
        <div className="space-y-2">
          {[
            {
              chunkId: 'chk-ins-001',
              stage: 'ocr',
              label: 'P&I Certificate — MV Atlantic Condor',
              fileName: 'pi_cert_atlantic_condor_2026.pdf',
              text: 'P&I Club certificate valid 2026-02-20 to 2027-02-20. Coverage limit USD 1B. Deductible USD 50,000. Club: Gard P&I (Bermuda) Ltd.',
              confidence: 0.96,
              evidenceRefs: ['ev-ins-801', 'ev-ins-802'],
              proofHash: '0x4a1b2c…d830',
            },
            {
              chunkId: 'chk-ins-002',
              stage: 'table',
              label: 'War Risk endorsement schedule — fleet Q1 2026',
              fileName: 'war_risk_schedule_q1_2026.xlsx',
              text: 'Table extracted: 14 rows. Columns: Vessel, IMO, War Risk Zone, Endorsement Date, Additional Premium Rate. 3 vessels operating in designated high-risk zones.',
              confidence: 0.93,
              evidenceRefs: ['ev-ins-803'],
              proofHash: '0x7f4e91…2a44',
            },
            {
              chunkId: 'chk-ins-003',
              stage: 'qa',
              label: 'Cargo coverage exception — MV Nordic Star',
              fileName: 'cargo_coverage_exception_nordic_star.pdf',
              text: 'QA answer: "Is the cargo discrepancy at Port Santos covered?" → "Coverage disputed under Cargo Policy §7.3 — dangerous goods exclusion applies to misdeclared cargo manifest." Refer to ev-ins-805.',
              confidence: 0.88,
              evidenceRefs: ['ev-ins-804', 'ev-ins-805'],
              proofHash: '0x2c9f3e…8b01',
            },
          ].map((chunk) => (
            <div key={chunk.chunkId} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase mt-0.5"
                  style={{
                    background: chunk.stage === 'ocr' ? 'rgba(14,165,233,0.15)' : chunk.stage === 'table' ? 'rgba(234,179,8,0.15)' : 'rgba(16,185,129,0.15)',
                    color: chunk.stage === 'ocr' ? '#38bdf8' : chunk.stage === 'table' ? '#fbbf24' : '#34d399',
                  }}>
                  {chunk.stage}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.80)' }}>{chunk.label}</p>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{chunk.text}</p>
                  <div className="flex items-center gap-x-3 flex-wrap text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    <span>{chunk.fileName}</span>
                    <span className="flex items-center gap-0.5"><Link2 size={8} />{chunk.evidenceRefs.join(', ')}</span>
                    <span>{chunk.proofHash}</span>
                    <span style={{ color: chunk.confidence >= 0.95 ? '#34d399' : chunk.confidence >= 0.90 ? '#fbbf24' : '#fb923c' }}>conf {Math.round(chunk.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] font-mono mt-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {pipelineResult
            ? `${pipelineResult.chunks.length} live chunks · ${pipelineResult.provenance.stages.map(s => s.adapterProvider).join('→')} · ingested ${new Date(pipelineResult.provenance.ingestedAt).toLocaleTimeString()}`
            : '3 example chunks · 7 evidence refs · lane: vessels-insurance · pipeline: ocr→layout→table→qa'}
        </p>
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          exceptions.length === 0 || openCount === 0 ? (
            <EmptyState
              icon={CheckCircle}
              headline="Fleet is exception-free"
              description="No AIS gaps, deviations, detentions, or cert issues are open across the fleet."
              accentColor="#10b981"
            />
          ) : (
            <EmptyState
              icon={Filter}
              headline={`No ${filter} exceptions`}
              description="Switch filters to see exceptions in other states."
              accentColor={ACCENT}
              action={{ label: 'Show all', onClick: () => setFilter('all') }}
            />
          )
        ) : (
          displayed.map((e) => (
            <ExceptionCard
              key={e.id}
              exc={e}
              onResolve={(id) => setResolved((prev) => new Set([...prev, id]))}
            />
          ))
        )}
      </div>
    </div>
  );
}
