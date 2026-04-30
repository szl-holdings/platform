import { useState } from 'react';
import { Sparkles, Play, Shield, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Zap, Lock, History } from 'lucide-react';
import { ALLOY_SKILLS, SKILL_RUNS, RISK_CONFIG, SOURCE_LABELS, formatRelativeWG, type A11oySkill, type SkillRun } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

const CATEGORY_COLORS: Record<string, string> = {
  Meetings: '#06b6d4',
  Finance: '#10b981',
  Revenue: '#4B8BDB',
  Governance: '#8b5cf6',
  Projects: '#f59e0b',
  Executive: '#f97316',
  Legal: '#a855f7',
  Vendor: '#6b7280',
  Security: '#ef4444',
};

const APPROVAL_LABELS: Record<string, string> = {
  auto: 'Auto-approve',
  review: 'Owner review',
  finance: 'Finance approval',
  legal: 'Legal review',
  security: 'Security review',
  executive: 'Executive approval',
};

function ApprovalBadge({ cls }: { cls: string }) {
  const label = APPROVAL_LABELS[cls] ?? cls;
  const colors: Record<string, string> = {
    auto: '#10b981',
    review: '#4B8BDB',
    finance: '#10b981',
    legal: '#8b5cf6',
    security: '#ef4444',
    executive: '#f97316',
  };
  const c = colors[cls] ?? '#6b7280';
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded font-medium"
      style={{ color: c, background: `${c}12`, border: `1px solid ${c}20` }}>
      {label}
    </span>
  );
}

function MirrorEvalMeter({ score }: { score: number }) {
  const color = score >= 90 ? '#10b981' : score >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono font-medium shrink-0" style={{ color }}>{score}%</span>
    </div>
  );
}

function SkillCard({ skill }: { skill: A11oySkill }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const catColor = CATEGORY_COLORS[skill.category] ?? ACCENT;
  const risk = RISK_CONFIG[skill.riskLevel];

  function handleRun() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
      setTimeout(() => setRan(false), 3000);
    }, 2000);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${catColor}20`, background: 'rgba(12,18,30,0.95)' }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${catColor}15`, border: `1px solid ${catColor}25` }}>
            <Sparkles className="w-4 h-4" style={{ color: catColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-0.5">
              <div className="text-xs font-bold text-white flex-1">{skill.name}</div>
              <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0"
                style={{ color: catColor, background: `${catColor}12` }}>
                {skill.category}
              </span>
            </div>
            <div className="text-[10px] mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {skill.description}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: risk.color, background: risk.bg }}>
                {risk.label} risk
              </span>
              <ApprovalBadge cls={skill.approvalClass} />
              {skill.proofRequired && (
                <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                  Proof required
                </span>
              )}
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                ~{skill.estimatedDuration}
              </span>
            </div>
            <div className="mb-2">
              <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                MirrorEval score
              </div>
              <MirrorEvalMeter score={skill.mirrorEvalScore} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span>{skill.runCount} runs</span>
                {skill.lastRun && (
                  <>
                    <span>·</span>
                    <span>Last: {formatRelativeWG(skill.lastRun)}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setExpanded(x => !x)}
                className="text-[9px] flex items-center gap-1 px-2 py-1 rounded border transition-all"
                style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)', background: 'transparent' }}>
                Details {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={handleRun}
                disabled={running || ran}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: ran ? 'rgba(16,185,129,0.15)' : running ? 'rgba(75,139,219,0.08)' : 'rgba(75,139,219,0.12)',
                  color: ran ? '#10b981' : running ? 'rgba(255,255,255,0.5)' : ACCENT,
                  border: `1px solid ${ran ? 'rgba(16,185,129,0.25)' : 'rgba(75,139,219,0.25)'}`,
                }}>
                {ran ? <><CheckCircle className="w-3 h-3" /> Done</> :
                  running ? <><Clock className="w-3 h-3" /> Running…</> :
                    <><Play className="w-3 h-3" /> Run (demo)</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Required Sources
            </div>
            <div className="flex flex-wrap gap-1">
              {skill.requiredSources.map(src => (
                <span key={src} className="text-[9px] px-2 py-0.5 rounded border"
                  style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  {SOURCE_LABELS[src] ?? src}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Demo Input
            </div>
            <div className="rounded p-2 font-mono text-[9px] space-y-0.5"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {Object.entries(skill.demoInput).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: 'rgba(75,139,219,0.8)' }}>{k}:</span>{' '}
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Demo Output Summary
            </div>
            <div className="text-[10px] p-2 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
              {skill.demoOutputSummary}
            </div>
          </div>
          {ran && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
              <div className="text-[10px]" style={{ color: '#10b981' }}>
                Demo run completed. Workcell created. Proof Packet generated. MirrorEval: {skill.mirrorEvalScore}%.
                {skill.approvalRequired && ' Approval request queued.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunHistoryPanel() {
  const statusColors: Record<string, string> = {
    complete: '#10b981',
    pending_approval: '#f59e0b',
    blocked: '#ef4444',
    running: ACCENT,
  };
  const statusLabels: Record<string, string> = {
    complete: 'Complete',
    pending_approval: 'Pending Approval',
    blocked: 'Blocked',
    running: 'Running',
  };
  const approvalColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  };

  return (
    <div className="space-y-2">
      {SKILL_RUNS.map((run: SkillRun) => {
        const sc = statusColors[run.status] ?? '#6b7280';
        return (
          <div key={run.id} className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${sc}12`, border: `1px solid ${sc}25` }}>
                {run.status === 'complete' ? <CheckCircle className="w-3.5 h-3.5" style={{ color: sc }} /> :
                  run.status === 'pending_approval' ? <Clock className="w-3.5 h-3.5" style={{ color: sc }} /> :
                  run.status === 'blocked' ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: sc }} /> :
                  <Play className="w-3.5 h-3.5" style={{ color: sc }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <div className="text-xs font-bold text-white flex-1">{run.skillName}</div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0 font-medium"
                    style={{ color: sc, background: `${sc}12` }}>
                    {statusLabels[run.status]}
                  </span>
                </div>
                <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {run.actionBriefSummary}
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <div className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>MirrorEval: <span className="font-mono font-bold" style={{ color: run.mirrorEvalScore >= 90 ? '#10b981' : run.mirrorEvalScore >= 80 ? '#f59e0b' : '#ef4444' }}>{run.mirrorEvalScore}%</span></span>
                  </div>
                  {run.approvalRequired && run.approvalStatus && (
                    <span className="px-1.5 py-0.5 rounded" style={{ color: approvalColors[run.approvalStatus] ?? '#6b7280', background: `${approvalColors[run.approvalStatus] ?? '#6b7280'}10` }}>
                      Approval: {run.approvalStatus}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Lock className="w-2 h-2" /> Proof: {run.proofPacketId}
                  </span>
                  <span>{formatRelativeWG(run.triggeredAt)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SkillsStudio() {
  const [activeTab, setActiveTab] = useState<'skills' | 'runs'>('skills');
  const [catFilter, setCatFilter] = useState('All');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const categories = ['All', ...Array.from(new Set(ALLOY_SKILLS.map(s => s.category)))];
  const triggers = ['all', 'manual', 'event', 'schedule', 'signal'];

  const filtered = ALLOY_SKILLS.filter(s => {
    const matchCat = catFilter === 'All' || s.category === catFilter;
    const matchTrig = triggerFilter === 'all' || s.triggerType === triggerFilter;
    return matchCat && matchTrig;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Skills Studio
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Skills Studio</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            10 governed workspace skills — each with MirrorEval scoring, approval gates, and Proof Packet creation.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'skills' as const, label: 'Skills Library', icon: <Sparkles className="w-3 h-3" /> },
          { id: 'runs' as const, label: `Run History (${SKILL_RUNS.length})`, icon: <History className="w-3 h-3" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium transition-all border-b-2 -mb-px"
            style={{
              color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
              borderBottomColor: activeTab === tab.id ? ACCENT : 'transparent',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'runs' ? <RunHistoryPanel /> : (<>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Skills', value: ALLOY_SKILLS.length, color: ACCENT },
          { label: 'Avg MirrorEval', value: `${Math.round(ALLOY_SKILLS.reduce((a, s) => a + s.mirrorEvalScore, 0) / ALLOY_SKILLS.length)}%`, color: '#10b981' },
          { label: 'Approval Required', value: ALLOY_SKILLS.filter(s => s.approvalRequired).length, color: '#f59e0b' },
          { label: 'Proof Required', value: ALLOY_SKILLS.filter(s => s.proofRequired).length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="px-2 py-1 rounded text-[9px] font-medium border transition-all"
              style={{
                background: catFilter === c ? `${CATEGORY_COLORS[c] ?? ACCENT}15` : 'transparent',
                borderColor: catFilter === c ? `${CATEGORY_COLORS[c] ?? ACCENT}35` : 'rgba(255,255,255,0.06)',
                color: catFilter === c ? (CATEGORY_COLORS[c] ?? ACCENT) : 'rgba(255,255,255,0.35)',
              }}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {triggers.map(t => (
            <button key={t} onClick={() => setTriggerFilter(t)}
              className="px-2 py-1 rounded text-[9px] font-medium border transition-all capitalize"
              style={{
                background: triggerFilter === t ? 'rgba(75,139,219,0.1)' : 'transparent',
                borderColor: triggerFilter === t ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                color: triggerFilter === t ? ACCENT : 'rgba(255,255,255,0.35)',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(skill => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Skills Studio governance:</strong> Every skill has a MirrorEval quality score, a declared approval class, and a proof requirement. No skill executes consequential actions without the appropriate human approval gate. All outputs are logged to the Proof Chain.
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
}
