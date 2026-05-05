/**
 * PER — Runtime Overview
 *
 * Fetches from live endpoints (/evolution/candidates + /evolution/diagnostics).
 * When EVOLUTION_MODE=simulation the API returns simulated data with simulated:true;
 * the SIMULATED badge is shown in that case. In live mode the badge shows LIVE.
 */

import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';

const PER_ACCENT = '#d4a054';

interface Candidate {
  candidateId: string;
  displayName: string;
  state: string;
  precisionProfile: string;
  policyVersion: string;
  simulated: boolean;
}

interface DriftReport {
  reportId?: string;
  candidateId: string;
  overallDriftScore?: number;
  driftScore?: number;
  severity?: string;
  status?: string;
  simulated: boolean;
}

interface Diagnostics {
  profile?: string;
  precisionProfile?: string;
  environmentMode: string;
  inferenceBackend: string;
  activeJobCount: number;
  queueDepth: number;
  remoteBackendHealthy?: boolean;
  driftGuardActive: boolean;
  evolutionMode: string;
  simulated: boolean;
}

const STATE_COLORS: Record<string, string> = {
  active: '#22c55e',
  review: PER_ACCENT,
  shadow: '#60a5fa',
  draft: '#6b7280',
  rolled_back: '#ef4444',
  archived: '#374151',
};

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

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#f9fafb', letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function PERRuntimeOverview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [driftReports, setDriftReports] = useState<DriftReport[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isSimulated, setIsSimulated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [candResp, diagResp] = await Promise.all([
          fetchJson<{ ok: boolean; data: Candidate[]; simulated: boolean }>(apiUrl('/evolution/candidates')),
          fetchJson<{ ok: boolean; data: Diagnostics; simulated: boolean }>(apiUrl('/evolution/diagnostics')),
        ]);
        setCandidates(candResp.data ?? []);
        setDiagnostics(diagResp.data);
        setIsSimulated(candResp.simulated ?? diagResp.simulated ?? true);

        if (candResp.simulated) {
          const simResp = await fetchJson<{ ok: boolean; data: { driftReports?: DriftReport[] }; simulated: boolean }>(apiUrl('/evolution/simulation'));
          setDriftReports(simResp.data?.driftReports ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load runtime state');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading runtime state…</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error}</div>;

  const d = diagnostics;
  const activeCandidate = candidates.find((c) => c.state === 'active');
  const reviewCandidates = candidates.filter((c) => c.state === 'review');
  const profile = d?.profile ?? d?.precisionProfile ?? '—';

  return (
    <div style={{ padding: 32, background: '#080a0d', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', margin: 0 }}>
          Precision Evolution Runtime
        </h1>
        <ModeBadge simulated={isSimulated} />
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 32, margin: '0 0 32px' }}>
        Runtime Overview — Active policy health, candidate queue, calibration status, drift alerts
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        <Stat label="Active Policy" value={activeCandidate?.displayName?.split('—')[0].trim() ?? '—'} sub={activeCandidate?.precisionProfile} />
        <Stat label="Pending Review" value={reviewCandidates.length} sub="candidates in review gate" />
        <Stat label="Queue Depth" value={d?.queueDepth ?? 0} sub="rollout jobs queued" />
        <Stat label="Total Candidates" value={candidates.length} sub="all states" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Candidate Policies
          </div>
          {candidates.length === 0 && <div style={{ color: '#6b7280', fontSize: 13 }}>No candidates registered</div>}
          {candidates.map((c) => (
            <div key={c.candidateId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1d24' }}>
              <div>
                <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{c.displayName}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>v{c.policyVersion} · {c.precisionProfile}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: STATE_COLORS[c.state] ?? '#6b7280', background: `${STATE_COLORS[c.state] ?? '#6b7280'}18`, padding: '3px 10px', borderRadius: 4 }}>
                {c.state.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Drift Status
          </div>
          {driftReports.length === 0 && (
            <div style={{ color: '#6b7280', fontSize: 13 }}>No drift reports available</div>
          )}
          {driftReports.map((r) => {
            const score = r.overallDriftScore ?? r.driftScore ?? 0;
            const status = r.severity ?? r.status ?? 'healthy';
            const colors: Record<string, string> = { healthy: '#22c55e', none: '#22c55e', low: '#22c55e', medium: '#f59e0b', degraded: '#f59e0b', high: '#f97316', critical: '#ef4444' };
            const color = colors[status] ?? '#6b7280';
            return (
              <div key={r.reportId ?? r.candidateId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1d24' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{r.candidateId}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Drift score: {(score * 100).toFixed(1)}%</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: '3px 10px', borderRadius: 4 }}>
                  {status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {d && (
        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Runtime Profile
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Precision Profile</div>
              <div style={{ fontSize: 13, color: PER_ACCENT, fontWeight: 600 }}>{profile}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Environment</div>
              <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{d.environmentMode}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Inference Backend</div>
              <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{d.inferenceBackend}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Drift Guard</div>
              <div style={{ fontSize: 13, color: d.driftGuardActive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {d.driftGuardActive ? 'ACTIVE' : 'DISABLED'}
              </div>
            </div>
          </div>
          {d.simulated && (
            <div style={{ marginTop: 16, padding: '8px 12px', background: '#f59e0b08', border: '1px solid #f59e0b20', borderRadius: 6, fontSize: 11, color: '#f59e0b' }}>
              ⚠ All values above are simulated synthetic telemetry. Set EVOLUTION_MODE=live and configure a real inference backend to enable live data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
