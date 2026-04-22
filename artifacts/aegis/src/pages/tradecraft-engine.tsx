import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@szl-holdings/shared-ui/ui/select';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { Textarea } from '@szl-holdings/shared-ui/ui/textarea';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import { type LucideIcon, AlertTriangle, Archive, BarChart3, BookOpen, Brain, CheckCircle, ChevronDown, ChevronUp, Clock, Database, Edit3, Eye, FileText, Flame, FlaskConical, Lock, Minus, Network, Plus, Search, Server, Shield, Star, Target, TrendingDown, TrendingUp, Users, XCircle, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EvidenceIndexPanel } from '@/components/tradecraft-panel';
import { api } from '@/lib/api';

type DecisionType =
  | 'TriageDecision'
  | 'IncidentAssessment'
  | 'RiskDecision'
  | 'EscalationDecision'
  | 'ApprovalRecommendation'
  | 'ResponsePlan'
  | 'ExecutiveBrief'
  | 'ControlGapFinding';
type AnalyticMode =
  | 'triage'
  | 'incident_hypothesis'
  | 'adversary_threat_pattern'
  | 'executive_summary'
  | 'alternative_analysis'
  | 'confidence_challenge';

interface EvidenceRef {
  refId: string;
  source: string;
  sourceType: string;
  content: string;
  relevanceScore: number;
  freshness: 'current' | 'recent' | 'stale' | 'unknown';
  timestamp: string | null;
  objectId: string | null;
}

interface TradecraftDecision {
  id: number;
  objectId: string;
  tenantId: string;
  caseId: string | null;
  incidentId: string | null;
  decisionType: DecisionType;
  policyClass: string;
  schemaVersion: string;
  summary: string;
  issueStatement: string;
  evidenceRefs: EvidenceRef[];
  evidenceQuality: 'high' | 'medium' | 'low' | 'insufficient';
  assumptions: Array<{ assumption: string; basis: string; vulnerability: string }>;
  alternatives: Array<{
    hypothesis: string;
    likelihood: string;
    rationale: string;
    evidenceFor: string[];
    evidenceAgainst: string[];
  }>;
  confidence: string;
  confidenceLabel: 'high' | 'moderate' | 'low' | 'insufficient';
  confidenceStatement: string | null;
  gapsAndUnknowns: string[];
  impactLevel: string;
  urgency: string;
  recommendedAction: string;
  ownerSuggestion: string | null;
  approvalRequired: boolean;
  approvalReason: string | null;
  humanReviewRequired: boolean;
  humanReviewReason: string | null;
  modelRoute: string;
  status: 'active' | 'superseded' | 'archived';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  decisionPayload: Record<string, unknown>;
  createdAt: string;
}

interface AnalystNote {
  id: number;
  noteId: string;
  caseId: string | null;
  incidentId: string | null;
  content: string;
  author: string;
  noteType: string;
  tags: string[];
  isKey: boolean;
  createdAt: string;
}

const DECISION_TYPE_CONFIG: Record<
  DecisionType,
  { label: string; icon: LucideIcon; color: string; policyClass: string }
> = {
  TriageDecision: {
    label: 'Triage Decision',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    policyClass: 'triage_decision',
  },
  IncidentAssessment: {
    label: 'Incident Assessment',
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    policyClass: 'case_hypothesis',
  },
  RiskDecision: {
    label: 'Risk Decision',
    icon: Shield,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    policyClass: 'risk_assessment',
  },
  EscalationDecision: {
    label: 'Escalation Decision',
    icon: TrendingUp,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    policyClass: 'escalation_recommendation',
  },
  ApprovalRecommendation: {
    label: 'Approval Rec.',
    icon: CheckCircle,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    policyClass: 'approval_recommendation',
  },
  ResponsePlan: {
    label: 'Response Plan',
    icon: Target,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    policyClass: 'response_plan',
  },
  ExecutiveBrief: {
    label: 'Executive Brief',
    icon: BookOpen,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    policyClass: 'executive_brief',
  },
  ControlGapFinding: {
    label: 'Control Gap',
    icon: Lock,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    policyClass: 'control_gap_summary',
  },
};

const _ANALYTIC_MODES: Array<{
  value: AnalyticMode;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: 'triage',
    label: 'Triage',
    description: 'Rapid classification and priority routing',
    icon: Zap,
  },
  {
    value: 'incident_hypothesis',
    label: 'Incident Hypothesis',
    description: 'Structured hypothesis with ACH methodology',
    icon: FlaskConical,
  },
  {
    value: 'adversary_threat_pattern',
    label: 'Adversary Pattern',
    description: 'TTPs, diamond model, attribution',
    icon: Network,
  },
  {
    value: 'executive_summary',
    label: 'Executive Brief',
    description: 'Decision-ready executive communication',
    icon: BookOpen,
  },
  {
    value: 'alternative_analysis',
    label: 'Alternative Analysis',
    description: "Devil's advocacy and stress-testing",
    icon: Brain,
  },
  {
    value: 'confidence_challenge',
    label: 'Confidence Challenge',
    description: 'Calibrated confidence audit',
    icon: BarChart3,
  },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  insufficient: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const IMPACT_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-blue-400',
  negligible: 'text-zinc-400',
};

const FRESHNESS_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  current: { icon: CheckCircle, color: 'text-emerald-400' },
  recent: { icon: Clock, color: 'text-amber-400' },
  stale: { icon: TrendingDown, color: 'text-orange-400' },
  unknown: { icon: Minus, color: 'text-zinc-500' },
};

const SOURCE_TYPE_ICONS: Record<string, LucideIcon> = {
  alert: Flame,
  incident: AlertTriangle,
  playbook: BookOpen,
  approval: CheckCircle,
  analyst_note: Edit3,
  asset_metadata: Server,
  user_metadata: Users,
  control_doc: Lock,
  retention_policy: Archive,
  incident_timeline: Clock,
  prior_decision: Brain,
  retrieval: Database,
};

function ConfidenceMeter({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color =
    label === 'high'
      ? 'bg-emerald-500'
      : label === 'moderate'
        ? 'bg-amber-500'
        : label === 'low'
          ? 'bg-orange-500'
          : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Confidence
        </span>
        <span
          className={cn(
            'text-[10px] font-mono font-bold uppercase',
            CONFIDENCE_COLORS[label]?.split(' ')[0],
          )}
        >
          {label} — {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceDrawer({
  decision,
  onClose,
}: {
  decision: TradecraftDecision;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'assumptions' | 'alternatives' | 'gaps'>(
    'evidence',
  );
  const refs = Array.isArray(decision.evidenceRefs) ? decision.evidenceRefs : [];
  const assumptions = Array.isArray(decision.assumptions) ? decision.assumptions : [];
  const alternatives = Array.isArray(decision.alternatives) ? decision.alternatives : [];
  const gaps = Array.isArray(decision.gapsAndUnknowns) ? decision.gapsAndUnknowns : [];

  const tabs = [
    { id: 'evidence' as const, label: `Evidence (${refs.length})`, icon: Database },
    { id: 'assumptions' as const, label: `Assumptions (${assumptions.length})`, icon: Brain },
    {
      id: 'alternatives' as const,
      label: `Alternatives (${alternatives.length})`,
      icon: FlaskConical,
    },
    { id: 'gaps' as const, label: `Gaps (${gaps.length})`, icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <div>
          <div className="text-sm font-semibold text-zinc-100">{decision.decisionType}</div>
          <div className="text-[10px] font-mono text-muted-foreground">{decision.objectId}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
          <XCircle className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-5 py-3 border-b border-zinc-800 space-y-2">
        <p className="text-xs text-zinc-300 leading-relaxed">{decision.issueStatement}</p>
        <ConfidenceMeter score={parseFloat(decision.confidence)} label={decision.confidenceLabel} />
        {decision.confidenceStatement && (
          <p className="text-[10px] text-muted-foreground italic">{decision.confidenceStatement}</p>
        )}
        {decision.approvalRequired && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20">
            <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] text-amber-300">
              {decision.approvalReason || 'Approval required before action'}
            </span>
          </div>
        )}
        {decision.humanReviewRequired && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-blue-500/10 border border-blue-500/20">
            <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[10px] text-blue-300">
              {decision.humanReviewReason || 'Human analyst review required'}
            </span>
          </div>
        )}
      </div>

      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors',
              activeTab === tab.id
                ? 'text-zinc-100 border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-zinc-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {activeTab === 'evidence' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                Evidence Quality
              </span>
              <Badge
                variant="outline"
                className={cn('text-[9px]', CONFIDENCE_COLORS[decision.evidenceQuality] || '')}
              >
                {decision.evidenceQuality}
              </Badge>
            </div>
            {refs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No evidence references attached
              </div>
            ) : (
              refs.map((ref, idx) => {
                const FreshnessIcon = FRESHNESS_ICONS[ref.freshness]?.icon || Minus;
                const SourceIcon = SOURCE_TYPE_ICONS[ref.sourceType] || Database;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SourceIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-semibold text-zinc-200 truncate">
                          {ref.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <FreshnessIcon
                          className={cn('w-3 h-3', FRESHNESS_ICONS[ref.freshness]?.color)}
                        />
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {Math.round(ref.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {ref.content.slice(0, 300)}
                      {ref.content.length > 300 ? '…' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                        {ref.sourceType}
                      </Badge>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {ref.freshness}
                      </span>
                      {ref.timestamp && (
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(ref.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'assumptions' &&
          (assumptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No assumptions documented
            </div>
          ) : (
            assumptions.map((a, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg border space-y-1.5',
                  a.vulnerability === 'critical'
                    ? 'bg-red-500/5 border-red-500/20'
                    : a.vulnerability === 'high'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-zinc-900 border-zinc-800',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold text-zinc-200">
                    Assumption {idx + 1}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] px-1.5 py-0 shrink-0',
                      a.vulnerability === 'critical'
                        ? 'text-red-400 border-red-500/30'
                        : a.vulnerability === 'high'
                          ? 'text-orange-400 border-orange-500/30'
                          : '',
                    )}
                  >
                    {a.vulnerability} vulnerability
                  </Badge>
                </div>
                <p className="text-[10px] text-zinc-300">{a.assumption}</p>
                {a.basis && (
                  <p className="text-[9px] text-muted-foreground">
                    <span className="text-zinc-500">Basis:</span> {a.basis}
                  </p>
                )}
              </div>
            ))
          ))}

        {activeTab === 'alternatives' &&
          (alternatives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No alternative hypotheses documented
            </div>
          ) : (
            alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold text-zinc-200">
                    Alternative {idx + 1}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] px-1.5 py-0 shrink-0',
                      alt.likelihood === 'high'
                        ? 'text-red-400 border-red-500/30'
                        : alt.likelihood === 'medium'
                          ? 'text-amber-400 border-amber-500/30'
                          : 'text-zinc-400 border-zinc-700',
                    )}
                  >
                    {alt.likelihood} likelihood
                  </Badge>
                </div>
                <p className="text-[10px] text-zinc-300">{alt.hypothesis}</p>
                {alt.rationale && (
                  <p className="text-[9px] text-muted-foreground">{alt.rationale}</p>
                )}
                {Array.isArray(alt.evidenceFor) && alt.evidenceFor.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono text-emerald-400/70 uppercase">For:</span>
                    <ul className="mt-0.5 space-y-0.5">
                      {alt.evidenceFor.map((e: string, i: number) => (
                        <li key={i} className="text-[9px] text-muted-foreground">
                          + {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(alt.evidenceAgainst) && alt.evidenceAgainst.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono text-red-400/70 uppercase">Against:</span>
                    <ul className="mt-0.5 space-y-0.5">
                      {alt.evidenceAgainst.map((e: string, i: number) => (
                        <li key={i} className="text-[9px] text-muted-foreground">
                          - {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ))}

        {activeTab === 'gaps' &&
          (gaps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">No gaps documented</div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">
                The following unknowns limit the confidence of this assessment:
              </p>
              {gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-zinc-300">{gap}</span>
                </div>
              ))}
            </div>
          ))}
      </div>

      <div className="px-5 py-3 border-t border-zinc-800">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Recommended Action
        </div>
        <p className="text-xs text-zinc-200 font-medium">{decision.recommendedAction}</p>
        {decision.ownerSuggestion && (
          <div className="flex items-center gap-1.5 mt-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Suggested owner: <span className="text-zinc-300">{decision.ownerSuggestion}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  onViewEvidence,
}: {
  decision: TradecraftDecision;
  onViewEvidence: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = DECISION_TYPE_CONFIG[decision.decisionType];
  const Icon = config?.icon || FileText;
  const confScore = parseFloat(decision.confidence);
  const refs = Array.isArray(decision.evidenceRefs) ? decision.evidenceRefs : [];
  const gaps = Array.isArray(decision.gapsAndUnknowns) ? decision.gapsAndUnknowns : [];

  return (
    <div
      className={cn(
        'rounded-xl border bg-zinc-900/60 transition-all',
        decision.status === 'superseded' ? 'opacity-50' : '',
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg border shrink-0',
                config?.color,
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-100 truncate">{config?.label}</div>
              <div className="text-[9px] font-mono text-muted-foreground">
                {decision.objectId.slice(0, 18)}…
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {decision.approvalRequired && (
              <div
                className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                title="Approval Required"
              />
            )}
            <Badge
              variant="outline"
              className={cn('text-[8px] px-1.5 py-0', CONFIDENCE_COLORS[decision.confidenceLabel])}
            >
              {decision.confidenceLabel}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[8px] px-1.5 py-0',
                IMPACT_COLORS[decision.impactLevel] || 'text-zinc-400',
              )}
            >
              {decision.impactLevel}
            </Badge>
          </div>
        </div>

        <p className="text-[10px] text-zinc-300 leading-relaxed">{decision.summary}</p>

        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full',
              decision.confidenceLabel === 'high'
                ? 'bg-emerald-500'
                : decision.confidenceLabel === 'moderate'
                  ? 'bg-amber-500'
                  : decision.confidenceLabel === 'low'
                    ? 'bg-orange-500'
                    : 'bg-red-500',
            )}
            style={{ width: `${Math.round(confScore * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
          <span>{Math.round(confScore * 100)}% confidence</span>
          <span>
            {refs.length} evidence ref{refs.length !== 1 ? 's' : ''} · {gaps.length} gap
            {gaps.length !== 1 ? 's' : ''}
          </span>
          <span>{new Date(decision.createdAt).toLocaleString()}</span>
        </div>

        {expanded && (
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                Issue Statement
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{decision.issueStatement}</p>
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                Recommended Action
              </div>
              <p className="text-[10px] text-zinc-300 font-medium">{decision.recommendedAction}</p>
            </div>
            {decision.confidenceStatement && (
              <div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Confidence Basis
                </div>
                <p className="text-[10px] text-zinc-400 italic">{decision.confidenceStatement}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center border-t border-zinc-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground hover:text-zinc-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Collapse
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Expand
            </>
          )}
        </button>
        <div className="w-px h-4 bg-zinc-800" />
        <button
          onClick={onViewEvidence}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Eye className="w-3 h-3" /> Evidence Drawer
        </button>
      </div>
    </div>
  );
}

function SourceTimeline({ decisions }: { decisions: TradecraftDecision[] }) {
  const sorted = [...decisions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (sorted.length === 0)
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">No decisions in timeline</div>
    );

  return (
    <div className="relative pl-4">
      <div className="absolute left-1.5 top-0 bottom-0 w-px bg-zinc-800" />
      <div className="space-y-4">
        {sorted.map((d, _idx) => {
          const config = DECISION_TYPE_CONFIG[d.decisionType];
          const Icon = config?.icon || FileText;
          return (
            <div key={d.objectId} className="relative flex items-start gap-3">
              <div
                className={cn(
                  'absolute left-[-13px] w-5 h-5 rounded-full border flex items-center justify-center',
                  config?.color,
                )}
              >
                <Icon className="w-2.5 h-2.5" />
              </div>
              <div className="pl-2 space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-zinc-200">{config?.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{d.summary}</p>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn('text-[8px] px-1 py-0', CONFIDENCE_COLORS[d.confidenceLabel])}
                  >
                    {d.confidenceLabel}
                  </Badge>
                  <span className={cn('text-[9px]', IMPACT_COLORS[d.impactLevel])}>
                    {d.impactLevel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotebookPanel({ caseId, incidentId }: { caseId?: string; incidentId?: string }) {
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [author, setAuthor] = useState('Analyst');
  const [noteType, setNoteType] = useState('general');
  const [isKey, setIsKey] = useState(false);

  const params = new URLSearchParams();
  if (caseId) params.set('caseId', caseId);
  if (incidentId) params.set('incidentId', incidentId);
  params.set('limit', '50');

  const { data: notesData } = useStandardQuery({
    queryKey: ['tradecraft-notebook', caseId, incidentId],
    queryFn: () => api.tradecraft.notebook(params.toString()),
    refetchInterval: 30000,
  });

  const notes: AnalystNote[] = Array.isArray(notesData) ? notesData : [];

  const createNote = useStandardMutation({
    mutationFn: (data: unknown) => api.tradecraft.createNote(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tradecraft-notebook'] });
      setNewNote('');
      toast.success('Note saved');
    },
    onError: () => toast.error('Failed to save note'),
  });

  const NOTE_TYPE_COLORS: Record<string, string> = {
    observation: 'text-blue-400',
    hypothesis: 'text-purple-400',
    assumption: 'text-amber-400',
    gap: 'text-orange-400',
    dissent: 'text-red-400',
    key_judgment: 'text-emerald-400',
    evidence_note: 'text-cyan-400',
    general: 'text-zinc-400',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No analytic notes yet
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.noteId}
              className={cn(
                'p-3 rounded-lg border',
                note.isKey
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-800',
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {note.isKey && <Star className="w-3 h-3 text-emerald-400" />}
                  <span
                    className={cn(
                      'text-[9px] font-mono uppercase tracking-wider font-bold',
                      NOTE_TYPE_COLORS[note.noteType] || 'text-zinc-400',
                    )}
                  >
                    {note.noteType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground">{note.author}</span>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="h-7 text-xs flex-1 bg-zinc-900 border-zinc-700"
          />
          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger className="h-7 text-xs w-36 bg-zinc-900 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'general',
                'observation',
                'hypothesis',
                'assumption',
                'gap',
                'dissent',
                'key_judgment',
                'evidence_note',
              ].map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isKey}
              onChange={(e) => setIsKey(e.target.checked)}
              className="w-3 h-3"
            />
            Key
          </label>
        </div>
        <Textarea
          placeholder="Add analytic note, key judgment, assumption, gap, or dissent…"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="text-xs min-h-[60px] bg-zinc-900 border-zinc-700 resize-none"
        />
        <Button
          size="sm"
          onClick={() => {
            if (!newNote.trim()) return;
            createNote.mutate({
              content: newNote.trim(),
              author,
              noteType,
              isKey,
              caseId: caseId || null,
              incidentId: incidentId || null,
            });
          }}
          disabled={!newNote.trim() || createNote.isPending}
          className="w-full h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" /> Save Note
        </Button>
      </div>
    </div>
  );
}

export default function TradecraftEnginePage() {
  const [activeView, setActiveView] = useState<
    'decisions' | 'timeline' | 'notebook' | 'evidence-index' | 'prompt-library'
  >('decisions');
  const [selectedDecision, setSelectedDecision] = useState<TradecraftDecision | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCase, setFilterCase] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const params = new URLSearchParams();
  if (filterType !== 'all') params.set('decisionType', filterType);
  if (filterCase) params.set('caseId', filterCase);
  params.set('limit', '100');

  const { data: decisionsData, isLoading } = useStandardQuery({
    queryKey: ['tradecraft-decisions', filterType, filterCase],
    queryFn: () => api.tradecraft.decisions(params.toString()),
    refetchInterval: 30000,
  });

  const decisions: TradecraftDecision[] = Array.isArray(decisionsData) ? decisionsData : [];

  const filtered = useMemo(() => {
    if (!searchQuery) return decisions;
    const q = searchQuery.toLowerCase();
    return decisions.filter(
      (d) =>
        d.summary.toLowerCase().includes(q) ||
        d.issueStatement.toLowerCase().includes(q) ||
        d.decisionType.toLowerCase().includes(q) ||
        d.recommendedAction.toLowerCase().includes(q),
    );
  }, [decisions, searchQuery]);

  const stats = useMemo(
    () => ({
      total: decisions.length,
      highConfidence: decisions.filter((d) => d.confidenceLabel === 'high').length,
      approvalRequired: decisions.filter((d) => d.approvalRequired).length,
      humanReview: decisions.filter((d) => d.humanReviewRequired).length,
      critical: decisions.filter((d) => d.impactLevel === 'critical').length,
    }),
    [decisions],
  );

  const VIEWS = [
    { id: 'decisions' as const, label: 'Decisions', icon: Shield },
    { id: 'timeline' as const, label: 'Source Timeline', icon: Clock },
    { id: 'notebook' as const, label: 'Analyst Notebook', icon: BookOpen },
    { id: 'evidence-index' as const, label: 'Evidence Index', icon: Database },
    { id: 'prompt-library' as const, label: 'Prompt Library', icon: Brain },
  ];

  const ANALYTIC_MODES_DISPLAY = [
    {
      mode: 'triage',
      label: 'Triage Analysis',
      description: 'Rapid classification and priority routing with explicit confidence bounds',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      mode: 'incident_hypothesis',
      label: 'Incident Hypothesis (ACH)',
      description: 'Analysis of Competing Hypotheses with evidence-for/against for each',
      icon: FlaskConical,
      color: 'text-purple-400',
    },
    {
      mode: 'adversary_threat_pattern',
      label: 'Adversary Threat Pattern',
      description: 'Diamond model, TTP mapping, attribution confidence with explicit uncertainty',
      icon: Network,
      color: 'text-red-400',
    },
    {
      mode: 'executive_summary',
      label: 'Executive Brief',
      description: 'Decision-ready brief with key findings, sourced recommendations, risk summary',
      icon: BookOpen,
      color: 'text-cyan-400',
    },
    {
      mode: 'alternative_analysis',
      label: 'Alternative Analysis',
      description:
        "Devil's advocacy: stress-test assumptions, surface mindset biases, rate assessment resilience",
      icon: Brain,
      color: 'text-blue-400',
    },
    {
      mode: 'confidence_challenge',
      label: 'Confidence Challenge',
      description:
        'Independent confidence audit: score evidence quality, source diversity, logical coherence',
      icon: BarChart3,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {selectedDecision && (
        <div className="fixed inset-0 z-40" onClick={() => setSelectedDecision(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <EvidenceDrawer decision={selectedDecision} onClose={() => setSelectedDecision(null)} />
          </div>
        </div>
      )}

      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Brain className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">Tradecraft Engine</h1>
              <p className="text-xs text-muted-foreground">
                Structured Analytic Tradecraft — Decision Objects & Evidence System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {VIEWS.map((v) => (
              <Button
                key={v.id}
                size="sm"
                variant={activeView === v.id ? 'default' : 'ghost'}
                onClick={() => setActiveView(v.id)}
                className="h-8 text-xs gap-1.5"
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Decisions', value: stats.total, color: 'text-zinc-100' },
            { label: 'High Confidence', value: stats.highConfidence, color: 'text-emerald-400' },
            { label: 'Critical Impact', value: stats.critical, color: 'text-red-400' },
            { label: 'Approval Required', value: stats.approvalRequired, color: 'text-amber-400' },
            { label: 'Human Review', value: stats.humanReview, color: 'text-blue-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800"
            >
              <div className={cn('text-2xl font-bold tabular-nums', stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {activeView === 'decisions' && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search decisions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs bg-zinc-900 border-zinc-700"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs w-44 bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Types
                  </SelectItem>
                  {Object.entries(DECISION_TYPE_CONFIG).map(([type, cfg]) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by case ID…"
                value={filterCase}
                onChange={(e) => setFilterCase(e.target.value)}
                className="h-8 text-xs w-44 bg-zinc-900 border-zinc-700"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Loading decisions…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tradecraft decisions found</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Decisions are created when the AI engine generates validated structured outputs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filtered.map((d) => (
                  <DecisionCard
                    key={d.objectId}
                    decision={d}
                    onViewEvidence={() => setSelectedDecision(d)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeView === 'timeline' && (
          <div className="max-w-2xl">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">Decision Source Timeline</h3>
              <p className="text-xs text-muted-foreground">
                Chronological view of all tradecraft decisions and evidence evolution
              </p>
            </div>
            <SourceTimeline decisions={decisions} />
          </div>
        )}

        {activeView === 'notebook' && (
          <div className="max-w-2xl h-[600px] flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">Analyst Notebook</h3>
              <p className="text-xs text-muted-foreground">
                Key judgments, hypotheses, assumptions, gaps, and dissents
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <NotebookPanel />
            </div>
          </div>
        )}

        {activeView === 'evidence-index' && (
          <div className="max-w-2xl space-y-4">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-zinc-100">Evidence Index Query</h3>
              <p className="text-xs text-muted-foreground">
                Hybrid keyword retrieval with freshness scoring and confidence downgrade. Search
                across all ingested alerts, incidents, cases, analyst notes, and prior decisions.
              </p>
            </div>
            <EvidenceIndexPanel caseId={filterCase || null} incidentId={null} />
          </div>
        )}

        {activeView === 'prompt-library' && (
          <div className="max-w-3xl space-y-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">Tradecraft Prompt Library</h3>
              <p className="text-xs text-muted-foreground">
                Six analytic modes implementing CIA-inspired structured analytic tradecraft
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {ANALYTIC_MODES_DISPLAY.map((mode) => (
                <div
                  key={mode.mode}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <mode.icon className={cn('w-4 h-4', mode.color)} />
                    <span className="text-xs font-semibold text-zinc-100">{mode.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-100 mb-3">Confidence Rubric</h4>
              <div className="space-y-2">
                {[
                  {
                    label: 'High Confidence',
                    range: '75–100%',
                    color: 'bg-emerald-500',
                    desc: 'Strong, diverse, consistent evidence. Well-grounded assumptions. Alternatives considered and found less compelling.',
                  },
                  {
                    label: 'Moderate Confidence',
                    range: '50–74%',
                    color: 'bg-amber-500',
                    desc: 'Adequate but not exhaustive evidence. Some uncertain assumptions. Notable gaps. Alternatives possible but less likely.',
                  },
                  {
                    label: 'Low Confidence',
                    range: '25–49%',
                    color: 'bg-orange-500',
                    desc: 'Limited or fragmented evidence. Key assumptions questionable. Significant gaps. Multiple alternatives remain plausible.',
                  },
                  {
                    label: 'Insufficient Evidence',
                    range: '0–24%',
                    color: 'bg-red-500',
                    desc: 'Too sparse or poor quality. Assessment largely speculative. Should not drive consequential decisions.',
                  },
                ].map((lvl) => (
                  <div key={lvl.label} className="flex items-start gap-3">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', lvl.color)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-zinc-200">{lvl.label}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {lvl.range}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                        {lvl.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-100 mb-3">
                Required Analytic Output Fields (All Modes)
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {[
                  'issueStatement',
                  'keyAssumptions',
                  'evidenceSummary',
                  'evidenceQuality',
                  'alternativeHypotheses',
                  'confidenceStatement',
                  'confidenceScore',
                  'gapsAndUnknowns',
                  'recommendedNextAction',
                  'humanReviewRequired',
                  'humanReviewReason',
                  'sourceReferences',
                ].map((field) => (
                  <div
                    key={field}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground"
                  >
                    <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-100 mb-3">
                Decision Object Schema Classes
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DECISION_TYPE_CONFIG).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-2 text-[10px]">
                    <cfg.icon className={cn('w-3 h-3 shrink-0', cfg.color.split(' ')[0])} />
                    <div>
                      <span className="text-zinc-300 font-mono">{type}</span>
                      <span className="text-muted-foreground ml-1">→ {cfg.policyClass}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
