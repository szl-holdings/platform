import { useStandardQuery } from '@szl-holdings/api-client-react';
import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  FileText,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { AccessDeniedNotice, HttpError, isAccessDenied } from '../components/AccessDeniedNotice';
import { CognitiveBreadcrumbs } from '../components/CognitiveBreadcrumbs';
import { CopyLinkButton } from '../components/CopyLinkButton';

const API = import.meta.env.VITE_API_URL ?? '/api';

const DS = {
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  text: {
    primary: 'rgba(255,255,255,0.9)',
    secondary: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.28)',
  },
};

const EVENT_COLORS: Record<string, string> = {
  'initial-detection': '#3b82f6',
  'alert-correlation': '#8b5cf6',
  'lateral-movement': '#ef4444',
  'credential-access': '#f97316',
  containment: '#10b981',
};

const SEV_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.08)' },
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
};

function CitationBadge({
  cit,
}: {
  cit: { id: string; source: string; ref: string; confidence: number };
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg text-[10px]"
      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
    >
      <FileText className="w-3 h-3 text-blue-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: DS.text.primary }}>
          {cit.source}
        </p>
        <p className="font-mono truncate" style={{ color: DS.text.muted }}>
          {cit.ref}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className="font-bold"
          style={{
            color: cit.confidence > 95 ? '#10b981' : cit.confidence > 85 ? '#f59e0b' : '#ef4444',
          }}
        >
          {cit.confidence}%
        </p>
        <p style={{ color: DS.text.muted }}>conf</p>
      </div>
    </div>
  );
}

export default function IncidentProofChain() {
  const search = useSearch();
  const initialIncidentId = useMemo(() => {
    const params = new URLSearchParams(search);
    const raw = params.get('id');
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [search]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(initialIncidentId);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIncidentId(initialIncidentId);
  }, [initialIncidentId]);

  // Live backend route — /firestorm/* path is an active api-server endpoint.
  // Follow-up task #1715 will rename it to /aegis/* once the server migration lands.
  const { data, isLoading, error, refetch, dataUpdatedAt } = useStandardQuery({
    queryKey: ['incident-proof-chain', selectedIncidentId],
    queryFn: async () => {
      const qs = selectedIncidentId ? `?incidentId=${selectedIncidentId}` : '';
      const r = await fetch(`${API}/firestorm/cognitive/incident-proof-chain${qs}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new HttpError(r.status, 'Failed to load incident proof chain');
      return r.json();
    },
    staleTime: 30_000,
    retry: (failureCount, err) => !isAccessDenied(err) && failureCount < 1,
  });

  const denied = isAccessDenied(error);

  const result = data?.data ?? {};
  const incident = result.incident ?? null;
  const chain: Array<{
    seq: number;
    eventType: string;
    timestamp: string;
    title: string;
    description: string;
    citations: Array<{ id: string; source: string; ref: string; confidence: number }>;
    mitreTag: string | null;
    technique: string;
    verifiedBy: string;
    traceRef: string;
  }> = result.chain ?? [];
  const summary = result.summary ?? {};
  const provenance = result.provenance ?? {};

  const sevConf = incident
    ? (SEV_CONFIG[incident.severity as string] ?? SEV_CONFIG.medium)
    : SEV_CONFIG.medium;

  return (
    <div className="p-6 space-y-6" style={{ maxWidth: 1280, margin: '0 auto' }}>
      <CognitiveBreadcrumbs accent="#3b82f6" />
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: DS.text.primary }}
          >
            <Link2 className="w-5 h-5 text-blue-400" />
            Incident Proof Chain
            <HelpTip
              tipId="aegis.incident-proof-chain"
              platform="aegis"
              title="Incident Proof Chain"
              content="A citation-backed timeline for each incident. Every detection, enrichment, model output, and analyst decision is recorded with its source, confidence, and verifier approval — so the response is fully auditable."
              accentColor="#3b82f6"
              iconSize={13}
            />
          </h1>
          <p className="text-sm mt-1" style={{ color: DS.text.secondary }}>
            Citation-backed timeline per incident through the cognitive trace-graph with verifier
            approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CopyLinkButton accent="#3b82f6" />
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: 'rgba(59,130,246,0.08)',
              color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {denied ? (
        <AccessDeniedNotice
          status={(error as HttpError).status}
          accent="#3b82f6"
          resourceLabel="this incident proof chain"
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : !incident ? (
        <div
          className="flex items-center justify-center py-16 text-sm"
          style={{ color: DS.text.muted }}
        >
          No incidents found. Create incidents to build proof chains.
        </div>
      ) : (
        <>
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: DS.surface, border: `1px solid ${sevConf.color}30` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: sevConf.bg, border: `1px solid ${sevConf.color}30` }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: sevConf.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold" style={{ color: DS.text.primary }}>
                    {incident.title}
                  </h2>
                  <Badge
                    className={cn('text-[9px]')}
                    style={{
                      background: sevConf.bg,
                      color: sevConf.color,
                      borderColor: `${sevConf.color}30`,
                    }}
                  >
                    {incident.severity}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-[9px]',
                      incident.status === 'closed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                    )}
                  >
                    {incident.status}
                  </Badge>
                </div>
                <div
                  className="flex items-center gap-4 text-[10px]"
                  style={{ color: DS.text.muted }}
                >
                  <span>INC-{incident.id}</span>
                  {incident.assignedAnalyst && <span>Analyst: {incident.assignedAnalyst}</span>}
                  {incident.createdAt && (
                    <span>{new Date(incident.createdAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center shrink-0">
                {[
                  { label: 'Events', value: summary.totalEvents },
                  { label: 'Citations', value: summary.totalCitations },
                  {
                    label: 'Avg Confidence',
                    value: summary.avgConfidence != null ? `${summary.avgConfidence}%` : '—',
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-base font-bold text-blue-400">{value ?? '—'}</p>
                    <p className="text-[10px]" style={{ color: DS.text.muted }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {summary.chainIntegrity === 'verified' && (
              <div
                className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  color: '#10b981',
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Chain integrity: VERIFIED · Verified by {summary.verifiedBy}
              </div>
            )}
          </div>

          <div className="relative space-y-0">
            {chain.map((event, idx) => {
              const color = EVENT_COLORS[event.eventType] ?? '#94a3b8';
              const isExpanded = expandedEvent === event.seq;
              const isLast = idx === chain.length - 1;
              return (
                <div key={event.seq} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{
                        background: `${color}18`,
                        border: `2px solid ${color}`,
                        boxShadow: `0 0 8px ${color}40`,
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color }}>
                        {event.seq}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 my-1"
                        style={{ background: `${color}30`, minHeight: 16 }}
                      />
                    )}
                  </div>

                  <div className="flex-1 mb-3">
                    <button
                      className="w-full rounded-xl p-4 text-left transition-all hover:bg-white/[0.02]"
                      style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                      onClick={() => setExpandedEvent(isExpanded ? null : event.seq)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: `${color}15`,
                                color,
                                border: `1px solid ${color}30`,
                              }}
                            >
                              {event.eventType.replace(/-/g, ' ')}
                            </span>
                            {event.mitreTag && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                              >
                                {event.mitreTag}
                              </span>
                            )}
                            <span
                              className="text-[9px] font-mono ml-auto"
                              style={{ color: DS.text.muted }}
                            >
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p
                            className="text-sm font-medium mb-1"
                            style={{ color: DS.text.primary }}
                          >
                            {event.title}
                          </p>
                          <p className="text-[11px]" style={{ color: DS.text.secondary }}>
                            {event.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px]" style={{ color: DS.text.muted }}>
                            {event.citations.length} citations
                          </span>
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                            style={{ color: DS.text.muted }}
                          />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        className="mx-0 mt-2 p-4 rounded-xl space-y-3"
                        style={{
                          background: 'rgba(59,130,246,0.03)',
                          border: `1px solid ${color}20`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" style={{ color }} />
                          <h4
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: DS.text.muted }}
                          >
                            Evidence Citations
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {event.citations.map((cit) => (
                            <CitationBadge key={cit.id} cit={cit} />
                          ))}
                        </div>
                        <div
                          className="flex items-center justify-between text-[9px] pt-1"
                          style={{ color: DS.text.muted }}
                        >
                          <span>Technique: {event.technique}</span>
                          <span className="font-mono">{event.traceRef}</span>
                          <span>Verified: {event.verifiedBy}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center gap-6 text-[10px] pt-2" style={{ color: DS.text.muted }}>
        <Activity className="w-3 h-3" />
        <span>Verified by: {provenance.verifiedBy ?? 'Cognitive Runtime'}</span>
        <span>Runtime: {provenance.cognitiveRuntime ?? 'v2.1.0'}</span>
        {dataUpdatedAt > 0 && <span>Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}
