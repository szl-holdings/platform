import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type InsightDomain =
  | 'vessels'
  | 'aegis'
  | 'terra'
  | 'prism'
  | 'lyte'
  | 'nexus'
  | 'forge'
  | 'inca';

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  severity: InsightSeverity;
  domain: InsightDomain;
  recommendedAction?: string;
  relatedEntities?: string[];
  generatedAt: Date;
  isStale?: boolean;
  agentId?: string;
}

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { bg: string; border: string; color: string; label: string }
> = {
  critical: {
    bg: 'hsla(0,80%,50%,0.1)',
    border: 'hsla(0,80%,50%,0.3)',
    color: 'hsl(0,80%,65%)',
    label: 'Critical',
  },
  high: {
    bg: 'hsla(32,88%,52%,0.1)',
    border: 'hsla(32,88%,52%,0.3)',
    color: 'hsl(32,88%,60%)',
    label: 'High',
  },
  medium: {
    bg: 'hsla(45,85%,52%,0.1)',
    border: 'hsla(45,85%,52%,0.3)',
    color: 'hsl(45,85%,60%)',
    label: 'Medium',
  },
  low: {
    bg: 'hsla(160,65%,42%,0.1)',
    border: 'hsla(160,65%,42%,0.3)',
    color: 'hsl(160,65%,55%)',
    label: 'Low',
  },
  info: {
    bg: 'hsla(210,80%,50%,0.1)',
    border: 'hsla(210,80%,50%,0.3)',
    color: 'hsl(210,80%,65%)',
    label: 'Info',
  },
};

const DOMAIN_FALLBACK_INSIGHTS: Record<InsightDomain, AIInsight[]> = {
  vessels: [
    {
      id: 'vessels-1',
      title: 'Fleet Route Optimization Opportunity',
      summary:
        'AI analysis indicates 3 vessels on Pacific routes could reduce fuel costs by 12% through minor course adjustments. Weather window opens in 6 hours.',
      confidence: 0.87,
      severity: 'medium',
      domain: 'vessels',
      recommendedAction:
        'Review route suggestions for MV Pacific Star, MV Aurora, and MV Horizon in the route planning console.',
      relatedEntities: ['MV Pacific Star', 'Pacific Route Alpha', 'Fuel Budget Q2'],
      generatedAt: new Date(Date.now() - 12 * 60000),
      agentId: 'helmsman',
    },
    {
      id: 'vessels-2',
      title: 'AIS Dark Pattern — Hormuz Corridor',
      summary:
        'Anomaly detection flagged a 4-hour AIS signal gap for MV Aurora Star in the Strait of Hormuz. Pattern matches known sanctions evasion behavior.',
      confidence: 0.91,
      severity: 'high',
      domain: 'vessels',
      recommendedAction:
        'Initiate sanctions compliance review. Cross-reference ownership records with updated OFAC list.',
      relatedEntities: ['MV Aurora Star', 'Strait of Hormuz', 'OFAC Watchlist'],
      generatedAt: new Date(Date.now() - 25 * 60000),
      agentId: 'helmsman',
    },
  ],
  aegis: [
    {
      id: 'aegis-1',
      title: 'Lateral Movement Pattern — Endpoint Cluster',
      summary:
        'Behavioral analytics detected APT-29-style lateral movement across 4 endpoints. Credential reuse pattern matches recent threat intelligence.',
      confidence: 0.89,
      severity: 'critical',
      domain: 'aegis',
      recommendedAction:
        'Isolate affected endpoints. Force password resets on compromised credentials. Escalate to IR team.',
      relatedEntities: ['Endpoint-04', 'Endpoint-07', 'AD-SRVR-02', 'APT-29'],
      generatedAt: new Date(Date.now() - 8 * 60000),
      agentId: 'sentinel',
    },
    {
      id: 'aegis-2',
      title: 'CVE-2024-XXXX Unpatched — Critical Exposure',
      summary:
        '3 production systems remain unpatched for a critical RCE vulnerability. Exploitation proof-of-concept published 48 hours ago.',
      confidence: 0.95,
      severity: 'critical',
      domain: 'aegis',
      recommendedAction:
        'Emergency patch deployment required within 24 hours. Review compensating controls.',
      relatedEntities: ['WebServer-01', 'API-GW-02', 'DB-Prod-03'],
      generatedAt: new Date(Date.now() - 45 * 60000),
      agentId: 'sentinel',
    },
  ],
  terra: [
    {
      id: 'terra-1',
      title: 'Distress Signal — Miami-Dade Portfolio',
      summary:
        'Predictive model scored 4 properties in Miami-Dade with >85% distress probability. Owner network graph shows financial stress correlation.',
      confidence: 0.83,
      severity: 'high',
      domain: 'terra',
      recommendedAction:
        'Initiate acquisition outreach for top 2 properties. Market window estimated at 45-60 days.',
      relatedEntities: ['1234 Brickell Ave', '456 Collins Dr', 'Owner: Apex Realty LLC'],
      generatedAt: new Date(Date.now() - 30 * 60000),
      agentId: 'beacon',
    },
    {
      id: 'terra-2',
      title: 'Cap Rate Compression — Commercial Sector',
      summary:
        'Market intelligence shows 0.8% cap rate compression in the commercial sector over 90 days. Portfolio exposure requires revaluation.',
      confidence: 0.78,
      severity: 'medium',
      domain: 'terra',
      recommendedAction:
        'Update portfolio valuations. Review exit strategies for 3 assets approaching 5-year hold.',
      relatedEntities: ['Commercial Portfolio A', 'Cap Rate Tracker'],
      generatedAt: new Date(Date.now() - 90 * 60000),
      agentId: 'beacon',
    },
  ],
  prism: [
    {
      id: 'prism-1',
      title: 'Critical Deadline — Apex Mutual Filing',
      summary:
        'Response brief for Apex Mutual litigation is due in 14 days. DocMiner identified 3 missing exhibits and 2 unresolved citations.',
      confidence: 0.97,
      severity: 'critical',
      domain: 'prism',
      recommendedAction:
        'Assign drafting team immediately. Review exhibit checklist in the Matter Twin for Apex Mutual.',
      relatedEntities: ['Apex Mutual v. Holdings', 'Brief-2024-Q2', 'Exhibit 14A'],
      generatedAt: new Date(Date.now() - 60 * 60000),
      agentId: 'compass',
    },
    {
      id: 'prism-2',
      title: 'Settlement Window — Zhao Maritime',
      summary:
        "Case outcome model scores 67% win probability. Opposing counsel's recent motions pattern suggests settlement openness. Estimated settlement range: $2.1M–$3.4M.",
      confidence: 0.74,
      severity: 'medium',
      domain: 'prism',
      recommendedAction:
        'Schedule strategy session with lead counsel to evaluate settlement timing.',
      relatedEntities: ['Zhao Maritime Ltd', 'Settlement Reserve Fund'],
      generatedAt: new Date(Date.now() - 3 * 60 * 60000),
      agentId: 'compass',
    },
  ],
  lyte: [
    {
      id: 'lyte-1',
      title: 'Operational Bottleneck — Payment Processing',
      summary:
        'AI workload analysis identified a P99 latency spike in payment processing at 94ms vs 42ms baseline. Correlates with recent deployment.',
      confidence: 0.92,
      severity: 'high',
      domain: 'lyte',
      recommendedAction:
        'Review recent deployment diff. Consider rollback or hot-fix of payment processing service.',
      relatedEntities: ['payment-service-v2.4', 'Checkout Flow', 'P99 Latency SLO'],
      generatedAt: new Date(Date.now() - 15 * 60000),
      agentId: 'beacon',
    },
    {
      id: 'lyte-2',
      title: 'Efficiency Gain — Alert Deduplication',
      summary:
        'Pattern analysis shows 34% of current alerts are duplicates from 3 overlapping monitoring rules. Estimated noise reduction: 280 alerts/day.',
      confidence: 0.88,
      severity: 'low',
      domain: 'lyte',
      recommendedAction:
        'Review and consolidate alert rules 14, 17, and 23 in the alert config panel.',
      relatedEntities: ['Alert Rule 14', 'Alert Rule 17', 'Alert Rule 23'],
      generatedAt: new Date(Date.now() - 120 * 60000),
      agentId: 'beacon',
    },
  ],
  nexus: [
    {
      id: 'nexus-1',
      title: 'Cross-Domain Compound Signal — Sanctions & AIS',
      summary:
        'Maritime AIS gap correlated with counterparty appearing in PRISM matter. Same ownership structure flagged in 2 active legal cases.',
      confidence: 0.86,
      severity: 'high',
      domain: 'nexus',
      recommendedAction:
        'Initiate cross-domain investigation. Escalate to compliance and legal simultaneously.',
      relatedEntities: ['MV Aurora Star', 'Apex Holdings LLC', 'Case PRX-2024-0847'],
      generatedAt: new Date(Date.now() - 20 * 60000),
      agentId: 'alloy',
    },
  ],
  forge: [
    {
      id: 'forge-1',
      title: 'Portfolio Risk Alert — Vessels Concentration',
      summary:
        'Maritime portfolio concentration at 42% exceeds strategic target of 35%. Recent route risk elevation compounds exposure.',
      confidence: 0.81,
      severity: 'medium',
      domain: 'forge',
      recommendedAction:
        'Review rebalancing options with relationship manager. Consider Terra allocation increase.',
      relatedEntities: ['Maritime Portfolio', 'Q2 Rebalancing Plan'],
      generatedAt: new Date(Date.now() - 45 * 60000),
      agentId: 'beacon',
    },
  ],
  inca: [
    {
      id: 'inca-1',
      title: 'Agent Performance Degradation — Prospector',
      summary:
        'Prospector agent success rate dropped from 96% to 89% over 48 hours. Token efficiency reduced 22%. Prompt drift suspected.',
      confidence: 0.84,
      severity: 'medium',
      domain: 'inca',
      recommendedAction:
        'Review recent prompt changes. Run eval suite against baseline. Consider rollback to v2.3.',
      relatedEntities: ['Prospector Agent', 'Real Estate Domain', 'Eval Suite v4'],
      generatedAt: new Date(Date.now() - 35 * 60000),
      agentId: 'inca',
    },
  ],
};

const DOMAIN_TO_VENTURE: Record<InsightDomain, string> = {
  vessels: 'vessels',
  aegis: 'aegis',
  terra: 'terra',
  prism: 'prism',
  lyte: 'lyte',
  nexus: 'nexus',
  forge: 'forge',
  inca: 'inca',
};

async function fetchLiveInsights(domain: InsightDomain): Promise<AIInsight[] | null> {
  try {
    const venture = DOMAIN_TO_VENTURE[domain] ?? domain;
    const res = await fetch(`${API_BASE}/intelligence-mesh/insights?domain=${venture}&limit=3`, {
      credentials: 'include',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items: unknown[] = Array.isArray(data?.insights)
      ? data.insights
      : Array.isArray(data?.events)
        ? data.events
        : [];
    if (items.length === 0) return null;
    return items.map((item: unknown, idx: number) => {
      const r = item as Record<string, unknown>;
      return {
        id: String(r.id ?? `live-${idx}`),
        title: String(r.title ?? 'AI Insight'),
        summary: String(r.summary ?? r.enrichmentContext ?? r.description ?? ''),
        confidence: Number(r.confidence ?? r.confidenceScore ?? 0.75),
        severity: (r.severity ?? 'info') as InsightSeverity,
        domain,
        ...(r.recommendedAction ? { recommendedAction: String(r.recommendedAction) } : {}),
        relatedEntities: Array.isArray(r.entities) ? r.entities.map(String) : [],
        generatedAt: new Date(String(r.generatedAt ?? r.enrichedAt ?? r.detectedAt ?? Date.now())),
        ...(r.agentId ? { agentId: String(r.agentId) } : {}),
      };
    });
  } catch {
    return null;
  }
}

function formatAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${confidence * 100}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          fontFamily: 'monospace',
          color,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}

export interface AIInsightCardProps {
  domain: InsightDomain;
  accentColor?: string;
  maxInsights?: number;
  compact?: boolean;
  title?: string;
}

export function AIInsightCard({
  domain,
  accentColor = 'hsl(258, 80%, 62%)',
  maxInsights = 3,
  compact = false,
  title,
}: AIInsightCardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    const live = await fetchLiveInsights(domain);
    if (live && live.length > 0) {
      setInsights(live.slice(0, maxInsights));
      setIsStale(false);
    } else {
      const fallbacks = DOMAIN_FALLBACK_INSIGHTS[domain] ?? [];
      setInsights(fallbacks.slice(0, maxInsights).map((i) => ({ ...i, isStale: true })));
      setIsStale(true);
    }
    setLastRefreshed(new Date());
    setIsLoading(false);
  }, [domain, maxInsights]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const cardTitle = title ?? `AI Insights — ${domain.charAt(0).toUpperCase() + domain.slice(1)}`;

  return (
    <>
      <style>{`
        .ai-insight-item:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>
      <div
        style={{
          background: 'hsla(0,0%,100%,0.02)',
          border: '1px solid hsla(0,0%,100%,0.06)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: compact ? '10px 14px' : '12px 16px',
            borderBottom: '1px solid hsla(0,0%,100%,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb' }}>
              {cardTitle}
            </span>
            {isStale && (
              <span
                style={{
                  fontSize: '0.6rem',
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'hsla(38,88%,52%,0.15)',
                  color: 'hsl(38,88%,60%)',
                  border: '1px solid hsla(38,88%,52%,0.3)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Cached
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastRefreshed && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                {formatAge(lastRefreshed)}
              </span>
            )}
            <span
              style={{
                fontSize: '0.6rem',
                color: accentColor,
                fontFamily: 'monospace',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              ✦ AI
            </span>
          </div>
        </div>

        <div>
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: compact ? '10px 14px' : '12px 16px',
                  borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    height: 10,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 4,
                    width: '70%',
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    height: 8,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    width: '90%',
                  }}
                />
              </div>
            ))
          ) : insights.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem',
              }}
            >
              No AI insights available
            </div>
          ) : (
            insights.map((insight, idx) => {
              const sev = SEVERITY_STYLES[insight.severity];
              const isExpanded = expandedId === insight.id;
              return (
                <div
                  key={insight.id}
                  className="ai-insight-item"
                  style={{
                    padding: compact ? '10px 14px' : '12px 16px',
                    borderBottom:
                      idx < insights.length - 1 ? '1px solid hsla(0,0%,100%,0.04)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: 'transparent',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            fontSize: '0.58rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: sev.bg,
                            color: sev.color,
                            border: `1px solid ${sev.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            flexShrink: 0,
                          }}
                        >
                          {sev.label}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#d1d5db',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {insight.title}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: 'rgba(255,255,255,0.55)',
                          margin: 0,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: isExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {insight.summary}
                      </p>
                      {!compact && (
                        <div style={{ marginTop: 6 }}>
                          <ConfidenceBar confidence={insight.confidence} color={sev.color} />
                        </div>
                      )}
                    </div>
                    <div
                      style={{ flexShrink: 0, color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {insight.recommendedAction && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: '0.58rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255,255,255,0.3)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom: 3,
                            }}
                          >
                            Recommended Action
                          </div>
                          <p
                            style={{
                              fontSize: '0.72rem',
                              color: accentColor,
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            → {insight.recommendedAction}
                          </p>
                        </div>
                      )}
                      {insight.relatedEntities && insight.relatedEntities.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <div
                            style={{
                              fontSize: '0.58rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255,255,255,0.3)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom: 4,
                            }}
                          >
                            Related Entities
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {insight.relatedEntities.map((e) => (
                              <span
                                key={e}
                                style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.5)',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        {insight.agentId && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              color: 'rgba(255,255,255,0.2)',
                              fontFamily: 'monospace',
                            }}
                          >
                            Agent: {insight.agentId}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.2)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatAge(insight.generatedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
