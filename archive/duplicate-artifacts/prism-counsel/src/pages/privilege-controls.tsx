import { AlertTriangle, CheckCircle, Loader2, Lock, Play, Shield } from 'lucide-react';
import { useState } from 'react';
import { getPrivilegeColor, useMatters } from '@/data/matters';

const ACCENT = '#a78bfa';

type PolicyCheckResult = {
  allowed: boolean;
  effect: string;
  requiresApproval: boolean;
  requiredApproverRole: string | null;
  reasoning: string;
  violations: Array<{ policyId: string; policyName: string; reason: string }>;
  policyEngine: string;
  evaluatedAt: number;
};

export default function PrivilegeControls() {
  const { matters, isLoading } = useMatters();
  const [selectedMatterId, setSelectedMatterId] = useState<string>('');
  const [checkRole, setCheckRole] = useState('associate');
  const [checkAction, setCheckAction] = useState<
    'prism-counsel:access' | 'prism-counsel:export' | 'prism-counsel:view'
  >('prism-counsel:export');
  const [checking, setChecking] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicyCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const matter = matters.find((m) => m.id === selectedMatterId) ?? matters[0];
  const wallMatters = matters.filter((m) => m.wall.enabled);

  if (!matter) {
    return (
      <div className="p-6 text-xs text-white/30">
        {isLoading ? 'Loading matters…' : 'No matters available.'}
      </div>
    );
  }

  const runPolicyCheck = async () => {
    setChecking(true);
    setPolicyResult(null);
    setCheckError(null);
    try {
      const res = await fetch('/api/prism-counsel/privilege/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterId: matter.id,
          action: checkAction,
          userRole: checkRole,
          privilegeLevel: matter.privilegeLevel,
          wallEnabled: matter.wall.enabled,
          userApproved: matter.wall.approvedUsers.includes(checkRole),
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setPolicyResult(json.data as PolicyCheckResult);
      } else {
        setCheckError(json.error ?? 'Policy check failed');
      }
    } catch (err) {
      setCheckError('Could not reach policy engine — API server may be offline');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4" style={{ color: ACCENT }} />
        <h1 className="text-lg font-semibold font-display text-white/90">Privilege Controls</h1>
      </div>
      <p className="text-xs text-white/30">
        Matter walls · Redaction workflow · Role-aware access · Ethics screens
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Matter Walls Active', value: String(wallMatters.length), color: '#ef4444' },
          {
            label: 'Restricted Matters',
            value: String(matters.filter((m) => m.privilegeLevel === 'restricted').length),
            color: '#ef4444',
          },
          {
            label: 'Privileged Matters',
            value: String(matters.filter((m) => m.privilegeLevel === 'privileged').length),
            color: '#f97316',
          },
          { label: 'Total Matters', value: String(matters.length), color: ACCENT },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-mono" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {wallMatters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Active Matter Walls
          </h2>
          {wallMatters.map((m) => (
            <div
              key={m.id}
              className="rounded-xl p-4 border privilege-glow"
              style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-white/80">{m.name}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">{m.matterNumber}</p>
                    <p className="text-[11px] text-red-400/60 mt-1.5">{m.wall.reason}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] mt-2">
                      <span className="text-white/30">
                        Approved: {m.wall.approvedUsers.join(', ')}
                      </span>
                      <span className="text-red-400/50">
                        Blocked: {m.wall.blockedRoles.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className="text-[9px] font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  WALL ACTIVE
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Privilege Level Overview
        </h2>
        <div
          className="rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Matter
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Privilege Level
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Wall
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Lead Counsel
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Parties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matters.map((m) => {
                const privColor = getPrivilegeColor(m.privilegeLevel);
                return (
                  <tr key={m.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-medium text-white/70">{m.name}</p>
                      <p className="text-[9px] text-white/25 font-mono">{m.matterNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ background: `${privColor}18`, color: privColor }}
                      >
                        {m.privilegeLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.wall.enabled ? (
                        <span className="flex items-center gap-1 text-[10px] text-red-400">
                          <Lock className="w-2.5 h-2.5" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/50">{m.leadCounsel}</td>
                    <td className="px-4 py-3 text-[11px] text-white/40">
                      {m.parties.length} parties
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="rounded-2xl border border-white/5 p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Live Policy Engine Check
          </h2>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(167,139,250,0.1)', color: ACCENT }}
          >
            prism-counsel.matter-wall@1.0
          </span>
        </div>
        <p className="text-[11px] text-white/30">
          Submit an access request to the backend policy engine and see the real-time decision.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider block">
              Matter
            </label>
            <select
              value={selectedMatterId || matter.id}
              onChange={(e) => {
                setSelectedMatterId(e.target.value);
                setPolicyResult(null);
              }}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
            >
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.split(' — ')[0]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider block">Role</label>
            <select
              value={checkRole}
              onChange={(e) => {
                setCheckRole(e.target.value);
                setPolicyResult(null);
              }}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
            >
              {['gc', 'partner', 'associate', 'paralegal'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider block">
              Action
            </label>
            <select
              value={checkAction}
              onChange={(e) => {
                setCheckAction(e.target.value as typeof checkAction);
                setPolicyResult(null);
              }}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
            >
              <option value="prism-counsel:export">export</option>
              <option value="prism-counsel:access">access</option>
              <option value="prism-counsel:view">view</option>
            </select>
          </div>
        </div>

        <button
          onClick={runPolicyCheck}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: checking ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.12)',
            color: checking ? 'rgba(167,139,250,0.4)' : ACCENT,
            border: '1px solid rgba(167,139,250,0.2)',
            cursor: checking ? 'not-allowed' : 'pointer',
          }}
        >
          {checking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {checking ? 'Checking policy…' : 'Run Policy Check'}
        </button>

        {checkError && (
          <div
            className="p-3 rounded-xl border text-[11px]"
            style={{
              background: 'rgba(249,115,22,0.05)',
              borderColor: 'rgba(249,115,22,0.15)',
              color: 'rgba(249,115,22,0.8)',
            }}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1.5" />
            {checkError}
          </div>
        )}

        {policyResult && (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: policyResult.allowed ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
              borderColor: policyResult.allowed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              {policyResult.allowed ? (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className="text-xs font-semibold"
                  style={{ color: policyResult.allowed ? '#22c55e' : '#ef4444' }}
                >
                  {policyResult.allowed ? 'Access allowed' : 'Access denied'} · Effect:{' '}
                  <span className="font-mono">{policyResult.effect}</span>
                </p>
                {policyResult.requiresApproval && (
                  <p className="text-[11px] text-orange-400 mt-0.5">
                    Requires approval from: {policyResult.requiredApproverRole}
                  </p>
                )}
              </div>
              <span className="text-[9px] font-mono text-white/20">
                {policyResult.policyEngine}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">{policyResult.reasoning}</p>
            {policyResult.violations.length > 0 && (
              <div className="space-y-1">
                {policyResult.violations.map((v) => (
                  <div
                    key={v.policyId}
                    className="text-[10px] text-red-400/70 font-mono bg-red-400/5 px-2 py-1 rounded"
                  >
                    {v.policyName}: {v.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
