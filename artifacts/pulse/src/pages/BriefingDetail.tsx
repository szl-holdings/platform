import { Building2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import AgentBadge from '../components/AgentBadge';
import ConfidenceChip from '../components/ConfidenceChip';
import { PublicationHistory } from '../components/PublicationHistory';
import { PublishDialog } from '../components/PublishDialog';
import { isDemoMode, useBriefing, usePublications, usePublishBriefing, usePublishPermission } from '../lib/api';
import { PULSE_SYNTHESIZED_LABEL } from '../lib/claims';
import { AGENTS, getRiskColor } from '../lib/data';

type RetrievalSource = 'adapter' | 'synthetic' | 'inline' | 'dry-run';
const RETRIEVAL_STYLE: Record<
  RetrievalSource,
  { label: string; color: string; bg: string; border: string; tip: string }
> = {
  adapter: {
    label: 'RETRIEVAL · LIVE INDEX',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.40)',
    tip: 'This briefing was assembled from a live retriever adapter.',
  },
  synthetic: {
    label: 'RETRIEVAL · SYNTHETIC',
    color: '#c8a84b',
    bg: 'rgba(200,168,75,0.10)',
    border: 'rgba(200,168,75,0.45)',
    tip: 'This briefing was assembled from a synthesized fixture corpus, not live evidence.',
  },
  inline: {
    label: 'RETRIEVAL · INLINE CORPUS',
    color: '#7dd3fc',
    bg: 'rgba(125,211,252,0.10)',
    border: 'rgba(125,211,252,0.40)',
    tip: 'This briefing was assembled from a caller-supplied inline corpus.',
  },
  'dry-run': {
    label: 'RETRIEVAL · DRY-RUN',
    color: '#7dd3fc',
    bg: 'rgba(125,211,252,0.10)',
    border: 'rgba(125,211,252,0.40)',
    tip: 'Dry-run brief — no retrieval was performed.',
  },
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/pulse';

export default function BriefingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: brief, isLoading, error } = useBriefing(id);
  const { data: publications, isLoading: pubsLoading } = usePublications(id);
  const publishMutation = usePublishBriefing(id);
  const { data: canPublish } = usePublishPermission();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isRepublish, setIsRepublish] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: '60px 28px', textAlign: 'center', color: 'var(--pulse-text-muted)' }}>
        Loading briefing…
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div style={{ padding: '60px 28px', textAlign: 'center' }}>
        <p style={{ color: 'var(--pulse-text-muted)', marginBottom: 12 }}>Briefing not found</p>
        <Link href={`${BASE}/library`}>
          <a style={{ color: 'var(--pulse-gold)', fontSize: '0.85rem' }}>← Back to Library</a>
        </Link>
      </div>
    );
  }

  if (brief.sections.length === 0) {
    return (
      <div style={{ padding: '28px 28px 40px' }}>
        <Link href={`${BASE}/library`}>
          <a
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--pulse-text-muted)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              marginBottom: 20,
            }}
          >
            <ChevronLeft size={14} /> Back to Library
          </a>
        </Link>
        <div
          className="font-serif"
          style={{ fontSize: '1.4rem', color: 'var(--pulse-text)', marginBottom: 8 }}
        >
          {brief.headline}
        </div>
        <p style={{ color: 'var(--pulse-text-muted)', fontSize: '0.9rem' }}>
          Full section content for this archived brief is not available in this preview. Sections
          for older briefs are shown in summary form only.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {showPublishDialog && brief && (
        <PublishDialog
          briefingId={brief.id}
          briefingHeadline={brief.headline}
          forceRepublish={isRepublish}
          onClose={() => { setShowPublishDialog(false); setIsRepublish(false); }}
          onPublish={(input) => publishMutation.mutateAsync(input)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Link href={`${BASE}/library`}>
          <a
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--pulse-text-muted)',
              fontSize: '0.8rem',
              textDecoration: 'none',
            }}
          >
            <ChevronLeft size={14} /> Back to Library
          </a>
        </Link>
        {!isDemoMode() && canPublish && (
          <button
            onClick={() => setShowPublishDialog(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid rgba(200,168,75,0.4)',
              background: 'rgba(200,168,75,0.1)',
              color: 'var(--pulse-gold)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Building2 size={13} />
            Publish to Organization
          </button>
        )}
      </div>

      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          borderBottom: '1px solid var(--pulse-border)',
          paddingBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
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
          </span>
          {isDemoMode() && (
            <span
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
              }}
            >
              {PULSE_SYNTHESIZED_LABEL}
            </span>
          )}
          {(() => {
            const src: RetrievalSource | null =
              brief.retrievalSource ?? (isDemoMode() ? 'synthetic' : null);
            if (!src) return null;
            const s = RETRIEVAL_STYLE[src];
            return (
              <span
                className="font-mono"
                title={s.tip}
                style={{
                  fontSize: '0.62rem',
                  color: s.color,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '1px 6px',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 3,
                }}
              >
                {s.label}
                {brief.retrievalAdapterId && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>· {brief.retrievalAdapterId}</span>
                )}
              </span>
            );
          })()}
        </div>
        <h1
          className="font-serif"
          style={{
            fontSize: '1.5rem',
            fontWeight: 500,
            color: 'var(--pulse-text)',
            lineHeight: 1.35,
            marginBottom: 10,
          }}
        >
          {brief.headline}
        </h1>
        <p
          className="font-serif"
          style={{ fontSize: '0.95rem', color: 'var(--pulse-text-dim)', lineHeight: 1.6 }}
        >
          {brief.leadSentence}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.68rem',
              fontWeight: 700,
              color: getRiskColor(brief.overallRisk),
              background: `${getRiskColor(brief.overallRisk)}18`,
              border: `1px solid ${getRiskColor(brief.overallRisk)}40`,
            }}
          >
            {brief.overallRisk}
          </span>
          <ConfidenceChip score={brief.overallConfidence} />
        </div>
      </div>

      {/* Sections */}
      {brief.sections.map((section) => {
        const agent = AGENTS[section.agentId];
        return (
          <div key={section.id} className="section-card" style={{ marginBottom: 20 }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--pulse-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 3,
                    height: 28,
                    borderRadius: 2,
                    background: agent?.color ?? '#c8a84b',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--pulse-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    {section.title}
                  </div>
                  <div
                    className="font-serif"
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--pulse-text)',
                      lineHeight: 1.4,
                      maxWidth: 580,
                    }}
                  >
                    {section.keyJudgment}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                <AgentBadge agentId={section.agentId} />
                <ConfidenceChip score={section.confidence} />
              </div>
            </div>
            <div style={{ padding: '16px 20px 16px 35px' }}>
              <div className="prose-brief">
                {section.narrative.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Publication history */}
      {!isDemoMode() && (
        <PublicationHistory
          publications={publications ?? []}
          loading={pubsLoading}
          onRepublish={() => { setIsRepublish(true); setShowPublishDialog(true); }}
        />
      )}
    </div>
  );
}
