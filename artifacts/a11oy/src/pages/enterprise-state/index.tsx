import { useCallback, useEffect, useState } from 'react';
import { BASE, POLL_INTERVAL_MS } from './constants';
import { LiveCtx } from './shared';
import { StateBoardSection } from './state-board-section';
import { CausalTimelineSection } from './causal-timeline-section';
import { RecommendationQueueSection } from './recommendation-queue-section';
import { RiskOpportunityHeatmapSection } from './risk-heatmap-section';
import { ActionControlSection } from './action-control-section';
import { DecisionLogSection } from './decision-log-section';
import { CrossDomainImpactMap } from './cross-domain-impact-map';
import { ValueWidgets } from './value-widgets';
import type { LiveEnterpriseState } from './types';
import { useActionStore } from './action-store';

export default function EnterpriseStatePage() {
  const [live, setLive] = useState<LiveEnterpriseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const store = useActionStore();

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/v1/os/enterprise-state`);
      if (res.ok) {
        const data = await res.json();
        setLive(data);
        setError(null);
      }
    } catch {
      setError('Using demo data');
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchLive]);

  return (
    <LiveCtx.Provider value={live}>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1440, margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-fg-primary)',
                margin: 0,
              }}
            >
              Enterprise State
            </h1>
            {error && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                  color: 'var(--color-fg-muted)',
                }}
              >
                Demo
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0 }}>
            Unified view of business health, causal signals, risks, opportunities, and governed actions.
          </p>
        </header>

        <ValueWidgets />

        <div style={{ marginTop: '1.25rem' }}>
          <StateBoardSection />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginTop: '1.25rem',
          }}
        >
          <CausalTimelineSection />
          <RiskOpportunityHeatmapSection />
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <RecommendationQueueSection />
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <CrossDomainImpactMap />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginTop: '1.25rem',
          }}
        >
          <ActionControlSection />
          <DecisionLogSection />
        </div>
      </div>
    </LiveCtx.Provider>
  );
}
