import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  GitBranch,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { type PolicyRule, policyEvaluationLog, policyRules } from '@/data/seed';

const EFFECT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> =
  {
    allow: {
      label: 'ALLOW',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/20',
    },
    require_approval: {
      label: 'REQUIRE APPROVAL',
      color: 'text-amber-400',
      bg: 'bg-amber-500/8',
      border: 'border-amber-500/20',
    },
    escalate: {
      label: 'ESCALATE',
      color: 'text-orange-400',
      bg: 'bg-orange-500/8',
      border: 'border-orange-500/20',
    },
    block: {
      label: 'BLOCK',
      color: 'text-red-400',
      bg: 'bg-red-500/8',
      border: 'border-red-500/25',
    },
    audit_only: {
      label: 'AUDIT ONLY',
      color: 'text-sky-400',
      bg: 'bg-sky-500/8',
      border: 'border-sky-500/20',
    },
  };

const OUTCOME_CONFIG: Record<string, { color: string; label: string }> = {
  allowed: { color: 'text-emerald-400', label: 'ALLOWED' },
  blocked: { color: 'text-red-400', label: 'BLOCKED' },
  escalated: { color: 'text-orange-400', label: 'ESCALATED' },
  pending_approval: { color: 'text-amber-400', label: 'PENDING' },
};

const SCOPE_CONFIG: Record<string, string> = {
  domain: 'text-amber-400/60',
  action: 'text-sky-400/60',
  tenant: 'text-purple-400/60',
  platform: 'text-[#c9a85c]/60',
};

function PolicyCard({ rule }: { rule: PolicyRule }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = EFFECT_CONFIG[rule.effect]!;
  const recent = policyEvaluationLog.filter((e) => e.policyId === rule.id);

  return (
    <div
      className={`cockpit-panel border ${cfg.border} ${rule.effect === 'block' ? 'border-l-2' : ''}`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}
        >
          {rule.effect === 'block' ? (
            <Lock className={`w-4 h-4 ${cfg.color}`} />
          ) : rule.effect === 'require_approval' ? (
            <AlertTriangle className={`w-4 h-4 ${cfg.color}`} />
          ) : rule.effect === 'escalate' ? (
            <Zap className={`w-4 h-4 ${cfg.color}`} />
          ) : (
            <CheckCircle2 className={`w-4 h-4 ${cfg.color}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-100">{rule.name}</p>
              <p className="text-[10px] text-amber-100/50 mt-0.5 leading-snug">
                {rule.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}
              >
                {cfg.label}
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className={`text-[10px] font-mono ${SCOPE_CONFIG[rule.scope]}`}>
              {rule.scope}
            </span>
            {rule.complianceFramework && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-sky-400 bg-sky-500/5 border-sky-500/15">
                {rule.complianceFramework}
              </span>
            )}
            <span className="text-[10px] font-mono text-amber-400/40">P{rule.priority}</span>
            {rule.triggerCount > 0 && (
              <span className="text-[10px] font-mono text-amber-400/40">
                {rule.triggerCount} triggers
              </span>
            )}
            {!rule.isActive && (
              <span className="text-[9px] font-mono text-amber-400/30 px-1.5 py-0.5 rounded border border-amber-500/10">
                INACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-amber-500/10 pt-3 space-y-3">
          {/* Conditions */}
          <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
            <p className="text-[9px] font-mono text-amber-400/40 mb-2">CONDITIONS</p>
            {rule.conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <span className="text-[9px] font-mono text-amber-400/30 mt-0.5">{i + 1}.</span>
                <code className="text-[10px] text-amber-300/70 font-mono leading-snug">{c}</code>
              </div>
            ))}
          </div>

          {/* Required approver / escalate to */}
          {(rule.requiredApproverRole || rule.escalateTo) && (
            <div className="flex items-center gap-4 text-[11px]">
              {rule.requiredApproverRole && (
                <div>
                  <span className="text-amber-400/40">Required approver: </span>
                  <span className="text-amber-300/70 font-mono">{rule.requiredApproverRole}</span>
                </div>
              )}
              {rule.escalateTo && (
                <div>
                  <span className="text-amber-400/40">Escalate to: </span>
                  <span className="text-amber-300/70 font-mono">{rule.escalateTo}</span>
                </div>
              )}
            </div>
          )}

          {/* Recent evaluations */}
          {recent.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-amber-400/40 mb-2">RECENT EVALUATIONS</p>
              {recent.map((log) => {
                const outCfg = OUTCOME_CONFIG[log.outcome]!;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 border-b border-amber-500/5 last:border-0"
                  >
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${outCfg.color} bg-opacity-10 border-current/20`}
                    >
                      {outCfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-amber-100/60 truncate">
                        {log.entityLabel}
                      </p>
                      <p className="text-[10px] text-amber-100/40 leading-snug mt-0.5">
                        {log.reason}
                      </p>
                    </div>
                    <span className="proof-badge text-[9px] shrink-0">
                      <Shield className="w-2 h-2" />
                      {log.proofRef}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-3">
              {rule.lastTriggered && (
                <span className="text-amber-400/30 font-mono">
                  Last triggered:{' '}
                  {new Date(rule.lastTriggered).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              <span className="text-amber-400/30 font-mono">ID: {rule.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PolicyCenterPage() {
  const blocking = policyRules.filter((r) => r.effect === 'block');
  const gating = policyRules.filter(
    (r) => r.effect === 'require_approval' || r.effect === 'escalate',
  );
  const other = policyRules.filter(
    (r) => r.effect !== 'block' && r.effect !== 'require_approval' && r.effect !== 'escalate',
  );

  const totalTriggers = policyRules.reduce((sum, r) => sum + r.triggerCount, 0);
  const recentBlocks = policyEvaluationLog.filter((e) => e.outcome === 'blocked').length;

  const BASE_COMMAND = `${window.location.origin}/command`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Policy Center</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">
            {policyRules.length} active policies — governing all agent actions and approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${BASE_COMMAND}/operations/alloy/policy-compiler`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-amber-500/20 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/35"
          >
            <Code2 className="w-3 h-3" />
            Compile New Policy
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          <div className="proof-badge">
            <GitBranch className="w-2.5 h-2.5" />
            FORGE-POLICY
          </div>
        </div>
      </div>

      {/* Policy Compiler CTA banner */}
      <div className="cockpit-panel border border-amber-500/15 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Code2 className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-100">Policy Compiler — Counsel</p>
          <p className="text-[10px] text-amber-400/50 mt-0.5 leading-snug">
            Write operating rules in plain English and compile them into validated, versioned,
            rollback-able policy objects. The Policy Compiler is Counsel's signature innovation.
          </p>
        </div>
        <a
          href={`${BASE_COMMAND}/operations/alloy/policy-compiler`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium shrink-0 transition-all border border-amber-500/20 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15"
        >
          Open Compiler
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cockpit-panel p-4">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Active Policies</p>
          <p className="text-xl font-mono font-bold text-amber-300">
            {policyRules.filter((r) => r.isActive).length}
          </p>
        </div>
        <div className="cockpit-panel p-4 border border-red-500/15">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Recent Blocks</p>
          <p className="text-xl font-mono font-bold text-red-400">{recentBlocks}</p>
        </div>
        <div className="cockpit-panel p-4">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Total Triggers</p>
          <p className="text-xl font-mono font-bold text-amber-300">{totalTriggers}</p>
        </div>
      </div>

      {blocking.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-red-400/40 uppercase tracking-widest">
            Blocking Policies
          </p>
          {blocking
            .sort((a, b) => b.priority - a.priority)
            .map((r) => (
              <PolicyCard key={r.id} rule={r} />
            ))}
        </div>
      )}

      {gating.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest">
            Gating Policies
          </p>
          {gating
            .sort((a, b) => b.priority - a.priority)
            .map((r) => (
              <PolicyCard key={r.id} rule={r} />
            ))}
        </div>
      )}

      {other.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-emerald-400/20 uppercase tracking-widest">
            Permissive Policies
          </p>
          {other
            .sort((a, b) => b.priority - a.priority)
            .map((r) => (
              <PolicyCard key={r.id} rule={r} />
            ))}
        </div>
      )}
    </div>
  );
}
