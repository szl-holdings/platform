/**
 * IncidentCommander — canonical shared incident management module.
 *
 * Displays the incident timeline, severity, containment steps,
 * active agents, approvals queue, and evidence chain.
 *
 * Consumed by: Sentra (security incidents), Vessels (maritime incidents),
 * Terra (property/legal incidents), Command (platform incidents).
 *
 * Domain-specific data is passed via props; the UI and interaction model
 * are shared across all surfaces.
 */
import React, { useState } from 'react';
import { cn } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus =
  | 'active'
  | 'contained'
  | 'investigating'
  | 'resolved'
  | 'false_positive';

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'human' | 'agent' | 'system';
  action: string;
  detail?: string;
  evidenceId?: string;
  automated?: boolean;
}

export interface IncidentContainmentStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  assignedTo?: string;
  completedAt?: string;
  automatedBy?: string;
}

export interface IncidentEvidenceItem {
  id: string;
  label: string;
  type: string;
  sourceSystem: string;
  confidence?: number;
  timestamp: string;
  href?: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  openedAt: string;
  resolvedAt?: string;
  summary: string;
  affectedEntities: Array<{ id: string; label: string; type: string }>;
  surface: string;
  surfaceLabel: string;
  assignedTo?: string;
  timeline: IncidentTimelineEvent[];
  containmentSteps: IncidentContainmentStep[];
  evidence: IncidentEvidenceItem[];
  runbookUrl?: string;
  tags?: string[];
}

export interface IncidentCommanderProps {
  incident: IncidentRecord;
  accentColor?: string;
  onContainmentStepAction?: (
    step: IncidentContainmentStep,
    action: 'complete' | 'skip' | 'fail',
  ) => void;
  onEscalate?: (incident: IncidentRecord) => void;
  onResolve?: (incident: IncidentRecord) => void;
  className?: string;
}

// ─── Internal tokens ─────────────────────────────────────────────────────

const SEVERITY_CFG: Record<IncidentSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  low: { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  info: { label: 'Info', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
};

const STATUS_CFG: Record<IncidentStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#ef4444' },
  contained: { label: 'Contained', color: '#f59e0b' },
  investigating: { label: 'Investigating', color: '#3b82f6' },
  resolved: { label: 'Resolved', color: '#22c55e' },
  false_positive: { label: 'False Positive', color: '#6b7280' },
};

const STEP_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#6b7280' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
  failed: { label: 'Failed', color: '#ef4444' },
  skipped: { label: 'Skipped', color: '#6b7280' },
};

const BG = { card: '#0c1018', elevated: '#0f1420', surface: '#080c14' } as const;
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.52)',
  muted: 'rgba(255,255,255,0.28)',
} as const;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function elapsed(from: string, to?: string): string {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function IncidentHeader({ incident }: { incident: IncidentRecord }) {
  const sev = SEVERITY_CFG[incident.severity];
  const stat = STATUS_CFG[incident.status];

  return (
    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}30` }}
            >
              {sev.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: stat.color }}>
              ● {stat.label}
            </span>
            {incident.tags?.map((t) => (
              <span
                key={t}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', color: TEXT.muted }}
              >
                {t}
              </span>
            ))}
          </div>
          <h2 className="text-[15px] font-semibold leading-tight" style={{ color: TEXT.primary }}>
            {incident.title}
          </h2>
          <div
            className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] font-mono"
            style={{ color: TEXT.muted }}
          >
            <span>{incident.id}</span>
            <span>·</span>
            <span>{incident.surfaceLabel}</span>
            <span>·</span>
            <span>Open {elapsed(incident.openedAt)}</span>
            {incident.assignedTo && (
              <>
                <span>·</span>
                <span>{incident.assignedTo}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed" style={{ color: TEXT.secondary }}>
        {incident.summary}
      </p>
      {incident.affectedEntities.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px]" style={{ color: TEXT.muted }}>
            Affected:
          </span>
          {incident.affectedEntities.map((e) => (
            <span
              key={e.id}
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: TEXT.primary,
                border: `1px solid ${BORDER}`,
              }}
            >
              {e.label}
              <span style={{ color: TEXT.muted }}> ({e.type})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ContainmentPanel({
  steps,
  onAction,
}: {
  steps: IncidentContainmentStep[];
  onAction?: (step: IncidentContainmentStep, action: 'complete' | 'skip' | 'fail') => void;
}) {
  return (
    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div
        className="text-[10px] font-mono uppercase tracking-widest mb-3"
        style={{ color: TEXT.muted }}
      >
        Containment Steps
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const cfg = STEP_CFG[step.status]!;
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{
                  background:
                    step.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : String(i + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium" style={{ color: TEXT.primary }}>
                  {step.label}
                </p>
                <div
                  className="text-[10px] font-mono flex gap-2 mt-0.5"
                  style={{ color: TEXT.muted }}
                >
                  {step.automatedBy && <span>🤖 {step.automatedBy}</span>}
                  {step.assignedTo && !step.automatedBy && <span>👤 {step.assignedTo}</span>}
                  {step.completedAt && <span>· {timeAgo(step.completedAt)}</span>}
                </div>
              </div>
              {step.status === 'in_progress' && onAction && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onAction(step, 'complete')}
                    className="px-2 py-0.5 rounded text-[10px] transition-colors hover:opacity-80"
                    style={{
                      background: 'rgba(34,197,94,0.12)',
                      color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.25)',
                    }}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => onAction(step, 'skip')}
                    className="px-2 py-0.5 rounded text-[10px] transition-colors hover:opacity-80"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: TEXT.muted,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    Skip
                  </button>
                </div>
              )}
              {step.status === 'pending' && onAction && (
                <button
                  onClick={() => onAction({ ...step, status: 'in_progress' }, 'complete')}
                  className="px-2 py-0.5 rounded text-[10px] transition-colors hover:opacity-80"
                  style={{
                    background: 'rgba(59,130,246,0.10)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  Start
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelinePanel({ events }: { events: IncidentTimelineEvent[] }) {
  return (
    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div
        className="text-[10px] font-mono uppercase tracking-widest mb-3"
        style={{ color: TEXT.muted }}
      >
        Timeline
      </div>
      <div className="relative flex flex-col gap-0">
        <div className="absolute left-[6px] top-2 bottom-2 w-px" style={{ background: BORDER }} />
        {events.map((event, i) => (
          <div key={event.id} className="flex gap-3 pb-3 relative">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 z-10"
              style={{
                background:
                  event.actorType === 'agent'
                    ? '#8b5cf620'
                    : event.actorType === 'system'
                      ? '#3b82f620'
                      : '#6b728020',
                border: `1px solid ${event.actorType === 'agent' ? '#8b5cf650' : event.actorType === 'system' ? '#3b82f650' : '#6b728050'}`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                  {event.action}
                </span>
                {event.automated && (
                  <span
                    className="text-[9px] font-mono px-1 py-0.5 rounded"
                    style={{ background: 'rgba(139,92,246,0.10)', color: '#8b5cf6' }}
                  >
                    automated
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-2 mt-0.5 text-[10px] font-mono"
                style={{ color: TEXT.muted }}
              >
                <span>{event.actor}</span>
                <span>·</span>
                <span>{timeAgo(event.timestamp)}</span>
              </div>
              {event.detail && (
                <p className="text-[11px] mt-1 leading-snug" style={{ color: TEXT.secondary }}>
                  {event.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidencePanel({ evidence }: { evidence: IncidentEvidenceItem[] }) {
  if (evidence.length === 0) return null;

  return (
    <div className="px-5 py-4">
      <div
        className="text-[10px] font-mono uppercase tracking-widest mb-3"
        style={{ color: TEXT.muted }}
      >
        Evidence — {evidence.length} item{evidence.length !== 1 ? 's' : ''}
      </div>
      <div className="flex flex-col gap-1.5">
        {evidence.map((item) => (
          <a
            key={item.id}
            href={item.href ?? '#'}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${BORDER}` }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = BORDER;
            }}
          >
            <span
              className="text-[10px] font-mono uppercase tracking-wider w-20 flex-shrink-0"
              style={{ color: TEXT.muted }}
            >
              {item.type}
            </span>
            <span
              className="text-[12px] font-medium flex-1 truncate"
              style={{ color: TEXT.primary }}
            >
              {item.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
              {item.sourceSystem}
            </span>
            {item.confidence !== undefined && (
              <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                {Math.round(item.confidence * 100)}%
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

type IcTab = 'overview' | 'timeline' | 'evidence';

export function IncidentCommander({
  incident,
  accentColor = '#ef4444',
  onContainmentStepAction,
  onEscalate,
  onResolve,
  className,
}: IncidentCommanderProps) {
  const [tab, setTab] = useState<IcTab>('overview');

  const tabs: Array<{ id: IcTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: `Timeline (${incident.timeline.length})` },
    { id: 'evidence', label: `Evidence (${incident.evidence.length})` },
  ];

  return (
    <div
      className={cn('rounded-xl overflow-hidden flex flex-col', className)}
      style={{ background: BG.card, border: `1px solid ${BORDER}` }}
    >
      <IncidentHeader incident={incident} />

      {/* Tab bar */}
      <div
        className="flex gap-0 px-3 pt-2"
        style={{ borderBottom: `1px solid ${BORDER}` }}
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2 text-[11px] font-medium transition-colors"
            style={{
              color: tab === t.id ? TEXT.primary : TEXT.muted,
              borderBottom: tab === t.id ? `2px solid ${accentColor}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Action buttons */}
        {incident.status === 'active' && (
          <div className="flex items-center gap-2 pb-2">
            {incident.runbookUrl && (
              <a
                href={incident.runbookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: TEXT.secondary,
                }}
              >
                Runbook ↗
              </a>
            )}
            {onEscalate && (
              <button
                onClick={() => onEscalate(incident)}
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(245,158,11,0.10)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#f59e0b',
                }}
              >
                Escalate
              </button>
            )}
            {onResolve && (
              <button
                onClick={() => onResolve(incident)}
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(34,197,94,0.10)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  color: '#22c55e',
                }}
              >
                Resolve
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <ContainmentPanel
            steps={incident.containmentSteps}
            {...(onContainmentStepAction !== undefined
              ? { onAction: onContainmentStepAction }
              : {})}
          />
        )}
        {tab === 'timeline' && <TimelinePanel events={incident.timeline} />}
        {tab === 'evidence' && <EvidencePanel evidence={incident.evidence} />}
      </div>
    </div>
  );
}
