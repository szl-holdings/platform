/**
 * PER — Governance Console
 *
 * Fetches from live endpoints (/evolution/candidates, /evolution/promotions, /evolution/audit).
 * When EVOLUTION_MODE=simulation the API returns simulated:true — a SIMULATED badge is shown.
 * In live mode, the Approve and Reject buttons call the real /approve endpoint.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';

const PER_ACCENT = '#d4a054';

interface Candidate {
  candidateId: string;
  displayName: string;
  state: string;
  simulated: boolean;
}

interface PromotionDecision {
  decisionId?: string;
  candidateId: string;
  outcome?: string;
  fromState?: string;
  toState?: string;
  rewardScore?: number;
  driftScore?: number;
  governancePassedAll?: boolean;
  humanApprovalRequired?: boolean;
  eligible?: boolean;
  reasons?: string[];
  blockers?: string[];
  createdAt?: string;
  simulated?: boolean;
}

interface AuditEvent {
  id?: number;
  type: string;
  candidateId?: string;
  detail?: string;
  domain?: string;
  outcome: string;
  riskLevel: string;
  timestamp?: string;
  simulated: boolean;
}

function ModeBadge({ simulated }: { simulated: boolean }) {
  if (simulated) {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: '#f59e0b18', padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b40', letterSpacing: 1 }}>
        SIMULATED
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', background: '#22c55e18', padding: '2px 8px', borderRadius: 4, border: '1px solid #22c55e40', letterSpacing: 1 }}>
      LIVE
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };
  const color = colors[level] ?? '#6b7280';
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, padding: '2px 8px', borderRadius: 4 }}>
      {level.toUpperCase()}
    </span>
  );
}

export default function PERGovernanceConsole() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [promotions, setPromotions] = useState<PromotionDecision[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'approval' | 'audit'>('approval');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string; isError: boolean } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [candResp, promResp, auditResp] = await Promise.all([
        fetchJson<{ ok: boolean; data: Candidate[]; simulated: boolean }>(apiUrl('/evolution/candidates')),
        fetchJson<{ ok: boolean; data: PromotionDecision[]; simulated: boolean }>(apiUrl('/evolution/promotions')),
        fetchJson<{ ok: boolean; data: AuditEvent[]; simulated: boolean }>(apiUrl('/evolution/audit')),
      ]);
      setCandidates(candResp.data ?? []);
      setPromotions(promResp.data ?? []);
      setAuditEvents(auditResp.data ?? []);
      setIsSimulated(candResp.simulated ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleApproveReject = useCallback(async (decision: PromotionDecision, action: 'approved' | 'rejected') => {
    const key = decision.candidateId + action;
    setActionLoading(key);
    setActionMessage(null);
    try {
      await fetchJson(apiUrl(`/evolution/candidates/${decision.candidateId}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: action, reason: action === 'rejected' ? 'Rejected via governance console' : undefined }),
      });
      setActionMessage({ id: decision.candidateId, text: `Decision ${action} successfully.`, isError: false });
      await loadData();
    } catch (e) {
      setActionMessage({ id: decision.candidateId, text: e instanceof Error ? e.message : `Failed to ${action}`, isError: true });
    } finally {
      setActionLoading(null);
    }
  }, [loadData]);

  const candidateMap = Object.fromEntries(candidates.map((c) => [c.candidateId, c]));
  const pendingPromotions = promotions.filter((p) => p.outcome === 'pending_review' || p.eligible === true);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading governance data…</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 32, background: '#080a0d', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', margin: 0 }}>Governance Console</h1>
        <ModeBadge simulated={isSimulated} />
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, margin: '0 0 24px' }}>
        Approval queue · Policy violations · Evidence bundles · Promotion decisions · Rollback history
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {(['approval', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
              color: activeTab === tab ? '#f9fafb' : '#6b7280',
              background: activeTab === tab ? PER_ACCENT : '#0f1015',
            }}
          >
            {tab === 'approval' ? `Approval Queue${pendingPromotions.length > 0 ? ` (${pendingPromotions.length})` : ''}` : 'Audit Timeline'}
          </button>
        ))}
      </div>

      {activeTab === 'approval' && (
        <div>
          {pendingPromotions.length === 0 && (
            <div style={{ color: '#6b7280', padding: 32, textAlign: 'center', background: '#0f1015', borderRadius: 10, border: '1px solid #1e2028' }}>
              No pending promotions — all decisions resolved or no candidates in review
            </div>
          )}
          {pendingPromotions.map((item) => {
            const candidate = candidateMap[item.candidateId];
            const actionKey = item.candidateId;
            const msg = actionMessage?.id === item.candidateId ? actionMessage : null;
            return (
              <div key={item.decisionId ?? item.candidateId} style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>
                      {candidate?.displayName ?? item.candidateId}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {item.decisionId ? `Decision: ${item.decisionId}` : `Candidate: ${item.candidateId}`}
                      {item.rewardScore != null && ` · Reward: ${(item.rewardScore * 100).toFixed(1)}`}
                      {item.driftScore != null && ` · Drift: ${(item.driftScore * 100).toFixed(1)}%`}
                    </div>
                    {item.fromState && item.toState && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        Transition: {item.fromState} → {item.toState}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#f59e0b', background: '#f59e0b18',
                    padding: '4px 12px', borderRadius: 6, border: '1px solid #f59e0b30',
                  }}>
                    PENDING REVIEW
                  </span>
                </div>

                {(item.reasons ?? []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>PASSING CRITERIA</div>
                      {(item.reasons ?? []).map((r, j) => (
                        <div key={j} style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>✓ {r}</div>
                      ))}
                    </div>
                    {(item.blockers ?? []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>BLOCKERS</div>
                        {(item.blockers ?? []).map((b, j) => (
                          <div key={j} style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>✕ {b}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: '10px 14px', background: '#d4a05408', border: `1px solid ${PER_ACCENT}30`, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: PER_ACCENT, fontWeight: 600, marginBottom: 10 }}>
                    Human approval required for production activation
                  </div>
                  {msg && (
                    <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 4, background: msg.isError ? '#ef444410' : '#22c55e10', fontSize: 12, color: msg.isError ? '#ef4444' : '#22c55e' }}>
                      {msg.text}
                    </div>
                  )}
                  {!isSimulated ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={actionLoading === actionKey + 'approved'}
                        onClick={() => void handleApproveReject(item, 'approved')}
                        style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer', background: '#22c55e', color: '#fff', opacity: actionLoading === actionKey + 'approved' ? 0.6 : 1 }}
                      >
                        {actionLoading === actionKey + 'approved' ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        disabled={actionLoading === actionKey + 'rejected'}
                        onClick={() => void handleApproveReject(item, 'rejected')}
                        style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 5, border: '1px solid #374151', cursor: 'pointer', background: 'transparent', color: '#9ca3af', opacity: actionLoading === actionKey + 'rejected' ? 0.6 : 1 }}
                      >
                        {actionLoading === actionKey + 'rejected' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'not-allowed', background: '#22c55e', color: '#fff', opacity: 0.5 }}>
                        Approve
                      </button>
                      <button style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 5, border: '1px solid #374151', cursor: 'not-allowed', background: 'transparent', color: '#9ca3af', opacity: 0.5 }}>
                        Reject
                      </button>
                      <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
                        (set EVOLUTION_MODE=live to enable actions)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, overflow: 'hidden' }}>
          {auditEvents.length === 0 ? (
            <div style={{ padding: 32, color: '#6b7280', textAlign: 'center' }}>No audit events recorded</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#090c10' }}>
                  {['Event Type', 'Candidate / Detail', 'Risk', 'Outcome', 'Timestamp'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((ev, i) => (
                  <tr key={ev.id ?? i} style={{ borderTop: '1px solid #1a1d24' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#f9fafb' }}>
                      {ev.type.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#9ca3af' }}>
                      {ev.candidateId ? (candidateMap[ev.candidateId]?.displayName?.split('—')[0].trim() ?? ev.candidateId) : (ev.detail ?? '—')}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <RiskBadge level={ev.riskLevel} />
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: ev.outcome === 'success' ? '#22c55e' : '#ef4444' }}>
                      {ev.outcome}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: '#6b7280' }}>
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
