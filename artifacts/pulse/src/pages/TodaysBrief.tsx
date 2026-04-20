import { type AutonomyMode, ProofEnvelope } from '@szl-holdings/design-system';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import AgentBadge from '../components/AgentBadge';
import ConfidenceChip from '../components/ConfidenceChip';
import MeshCard from '../components/MeshCard';
import { exportBriefingPdf, isDemoMode, useGenerateBriefing, useTodaysBrief } from '../lib/api';
import { PULSE_SYNTHESIZED_LABEL } from '../lib/claims';
import { AGENTS, type BriefingSection, getRiskColor, type RiskLevel } from '../lib/data';

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const color = getRiskColor(risk);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {risk === 'CRITICAL' && <AlertTriangle size={11} />}
      {risk}
    </span>
  );
}

function SectionCard({ section }: { section: BriefingSection }) {
  const [expanded, setExpanded] = useState(false);
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');
  const agent = AGENTS[section.agentId];

  const riskToPolicy = (r: RiskLevel): 'allowed' | 'requires-approval' | 'blocked' =>
    r === 'CRITICAL' ? 'requires-approval' : r === 'HIGH' ? 'requires-approval' : 'allowed';

  const proofEvidence = section.keyFindings.slice(0, 3).map((f, i) => ({
    id: `${section.id}-f-${i}`,
    label: `Key Finding ${i + 1} — ${section.agentId}`,
    type: 'signal' as const,
    excerpt: f.finding,
    timestamp: section.lastUpdated,
  }));

  return (
    <ProofEnvelope
      title={section.keyJudgment}
      timestamp={section.lastUpdated}
      confidence={section.confidence}
      policyState={riskToPolicy(section.riskLevel)}
      policyReason={
        section.riskLevel === 'CRITICAL' || section.riskLevel === 'HIGH'
          ? 'High-risk intelligence requires principal review before autonomous action'
          : undefined
      }
      autonomyMode={autonomyMode}
      onAutonomyChange={setAutonomyMode}
      accentColor={agent?.color ?? '#c8a84b'}
      evidence={proofEvidence}
    >
      <div className="section-card animate-fadeIn" style={{ marginBottom: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: expanded ? '1px solid var(--pulse-border)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 3,
                height: 32,
                borderRadius: 2,
                background: agent?.color ?? '#c8a84b',
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--pulse-text-muted)',
                  marginBottom: 3,
                }}
              >
                {section.title}
              </div>
              <div
                className="font-serif"
                style={{
                  fontSize: '1rem',
                  color: 'var(--pulse-text)',
                  lineHeight: 1.4,
                  maxWidth: 620,
                }}
              >
                {section.keyJudgment}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
              marginLeft: 16,
            }}
          >
            <AgentBadge agentId={section.agentId} />
            <ConfidenceChip score={section.confidence} label={section.confidenceLabel} />
            <RiskBadge risk={section.riskLevel} />
            {expanded ? (
              <ChevronUp size={14} color="var(--pulse-text-muted)" />
            ) : (
              <ChevronDown size={14} color="var(--pulse-text-muted)" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div style={{ padding: '20px 20px 20px 35px' }}>
            {/* Narrative */}
            <div className="prose-brief" style={{ marginBottom: 20 }}>
              {section.narrative.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Key Findings */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 6,
                  padding: 14,
                  border: '1px solid var(--pulse-border)',
                }}
              >
                <div className="prose-brief" style={{ marginBottom: 10 }}>
                  <h3>Key Findings</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {section.keyFindings.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: getRiskColor(f.severity),
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ fontSize: '0.82rem', color: 'var(--pulse-text)', lineHeight: 1.5 }}
                      >
                        {f.finding}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps & Assumptions */}
              <div>
                {section.assumptions.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(200,168,75,0.05)',
                      borderRadius: 6,
                      padding: 14,
                      border: '1px solid rgba(200,168,75,0.15)',
                      marginBottom: 8,
                    }}
                  >
                    <div className="prose-brief" style={{ marginBottom: 8 }}>
                      <h3>Key Assumptions</h3>
                    </div>
                    {section.assumptions.map((a, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--pulse-text-dim)',
                          lineHeight: 1.5,
                          marginBottom: 4,
                          paddingLeft: 10,
                          borderLeft: '2px solid rgba(200,168,75,0.3)',
                        }}
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                )}
                {section.gaps.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(224,80,80,0.04)',
                      borderRadius: 6,
                      padding: 14,
                      border: '1px solid rgba(224,80,80,0.12)',
                    }}
                  >
                    <div className="prose-brief" style={{ marginBottom: 8 }}>
                      <h3>Gaps & Unknowns</h3>
                    </div>
                    {section.gaps.map((g, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--pulse-text-dim)',
                          lineHeight: 1.5,
                          marginBottom: 4,
                          paddingLeft: 10,
                          borderLeft: '2px solid rgba(224,80,80,0.3)',
                        }}
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Source Provenance Strip — inspired by Govini structured decision brief */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(200,168,75,0.04)',
                border: '1px solid rgba(200,168,75,0.1)',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(200,168,75,0.4)',
                }}
              >
                Sources
              </span>
              {['Sentra', 'Vessels', 'Terra', 'Lyte']
                .slice(0, 2 + (section.agentId.charCodeAt(0) % 3))
                .map((src) => (
                  <span
                    key={src}
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: 'rgba(200,168,75,0.06)',
                      border: '1px solid rgba(200,168,75,0.12)',
                      color: 'rgba(200,168,75,0.5)',
                    }}
                  >
                    {src}
                  </span>
                ))}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.15)',
                  marginLeft: 'auto',
                }}
              >
                Agent: {agent?.name ?? section.agentId} · Confidence:{' '}
                {Math.round(section.confidence * 100)}%
              </span>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--pulse-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.7rem',
                  color: 'var(--pulse-text-muted)',
                }}
              >
                <Clock size={12} />
                <span>
                  Updated{' '}
                  {new Date(section.lastUpdated).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  UTC · {agent?.name}
                </span>
              </div>
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid var(--pulse-border-bright)',
                  color: 'var(--pulse-text-dim)',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                File Dissent
              </button>
            </div>
          </div>
        )}
      </div>
    </ProofEnvelope>
  );
}

export default function TodaysBrief() {
  const { data: brief, isLoading, error } = useTodaysBrief();
  const generate = useGenerateBriefing();
  const [exporting, setExporting] = useState(false);
  const handleGenerate = async () => {
    try {
      await generate.mutateAsync();
    } catch (e) {
      alert(`Live generation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const handleExport = async () => {
    if (!brief) return;
    setExporting(true);
    try {
      await exportBriefingPdf(brief.id, brief.date);
    } catch (e) {
      alert(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--pulse-text-muted)', fontSize: '0.9rem' }}>
        Loading today's brief…
      </div>
    );
  }
  if (error || !brief) {
    return (
      <div style={{ padding: 40, color: '#e05050', fontSize: '0.9rem' }}>
        Failed to load today's brief{error instanceof Error ? `: ${error.message}` : ''}.
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Brief header */}
      <div
        style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--pulse-border)',
          background: 'linear-gradient(180deg, rgba(200,168,75,0.04) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--pulse-gold)',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {brief.edition}
              </div>
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--pulse-border-bright)',
                }}
              />
              <div
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--pulse-text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                {new Date(brief.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              {isDemoMode() && (
                <>
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--pulse-border-bright)',
                    }}
                  />
                  <div
                    className="font-mono"
                    title="This briefing is rendered from a synthesized fixture, not a freshly produced live agent response."
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--pulse-gold)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      padding: '1px 6px',
                      border: '1px solid var(--pulse-border-bright)',
                      borderRadius: 3,
                      textTransform: 'none',
                    }}
                  >
                    {PULSE_SYNTHESIZED_LABEL}
                  </div>
                </>
              )}
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: '1.6rem',
                fontWeight: 500,
                color: 'var(--pulse-text)',
                lineHeight: 1.35,
                maxWidth: 700,
                marginBottom: 10,
              }}
            >
              {brief.headline}
            </h1>
            <p
              className="font-serif"
              style={{
                fontSize: '1rem',
                color: 'var(--pulse-text-dim)',
                lineHeight: 1.6,
                maxWidth: 640,
              }}
            >
              {brief.leadSentence}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
              marginLeft: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <RiskBadge risk={brief.overallRisk} />
              <ConfidenceChip score={brief.overallConfidence} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!isDemoMode() && (
                <button
                  onClick={handleGenerate}
                  disabled={generate.isPending}
                  title="Synthesize a fresh briefing from the agent collective"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: 'rgba(120,180,255,0.10)',
                    border: '1px solid rgba(120,180,255,0.35)',
                    color: '#9bc4ff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: generate.isPending ? 'wait' : 'pointer',
                  }}
                >
                  <Sparkles size={13} />
                  {generate.isPending ? 'Generating…' : 'Generate Live Briefing'}
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={exporting}
                title="Download a branded PDF of this briefing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 6,
                  background: 'rgba(200,168,75,0.10)',
                  border: '1px solid rgba(200,168,75,0.45)',
                  color: 'var(--pulse-gold)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: exporting ? 'wait' : 'pointer',
                }}
              >
                <Download size={13} />
                {exporting ? 'Preparing PDF…' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Domain pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {brief.domains.map((d) => (
            <span
              key={d}
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                background: 'var(--pulse-card)',
                border: '1px solid var(--pulse-border)',
                fontSize: '0.68rem',
                color: 'var(--pulse-text-dim)',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {d.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {/* Recommended Actions */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={14} color="var(--pulse-gold)" />
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
              }}
            >
              Recommended Actions — Today
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.recommendedActions.map((action, i) => {
              const pColor =
                action.priority === 'P0'
                  ? '#e05050'
                  : action.priority === 'P1'
                    ? '#e08c40'
                    : action.priority === 'P2'
                      ? '#c8a84b'
                      : '#4eca8b';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '12px 16px',
                    borderRadius: 6,
                    background: 'var(--pulse-card)',
                    border: `1px solid ${pColor}25`,
                    borderLeft: `3px solid ${pColor}`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      color: pColor,
                      background: `${pColor}18`,
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontFamily: 'JetBrains Mono, monospace',
                      flexShrink: 0,
                    }}
                  >
                    {action.priority}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: 'var(--pulse-text)',
                        marginBottom: 3,
                      }}
                    >
                      {action.action}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--pulse-text-dim)',
                        lineHeight: 1.5,
                      }}
                    >
                      {action.rationale}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginTop: 6,
                        fontSize: '0.7rem',
                        color: 'var(--pulse-text-muted)',
                      }}
                    >
                      <span>Owner: {action.owner}</span>
                      <span>·</span>
                      <span>Due: {action.dueBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Mesh Status */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Shield size={14} color="#e05050" />
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
              }}
            >
              Agent Mesh · AI Supply Chain Status
            </h2>
          </div>
          <MeshCard />
        </div>

        {/* Domain sections */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Shield size={14} color="var(--pulse-text-muted)" />
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
              }}
            >
              Domain Intelligence · {brief.sections.length} Sections
            </h2>
          </div>
          {brief.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Brief footer */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 6,
            background: 'var(--pulse-card)',
            border: '1px solid var(--pulse-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
            <strong style={{ color: 'var(--pulse-text-dim)' }}>Brief ID:</strong> {brief.id} ·
            Generated{' '}
            {new Date(brief.generatedAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}{' '}
            UTC · <strong style={{ color: 'var(--pulse-text-dim)' }}>Alloy</strong> Multi-Agent
            Synthesis
          </div>
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.72rem',
              color: 'var(--pulse-text-dim)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            View in Library
          </a>
        </div>
      </div>
    </div>
  );
}
