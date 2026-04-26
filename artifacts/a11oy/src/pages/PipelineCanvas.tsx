import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, KpiCard, ActionButton } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)', text: '#f5f5f5', dim: '#8a8a8a',
  muted: '#5e5e5e', accent: '#c9b787', accentDim: 'rgba(201,183,135,0.15)',
};

const LAYERS = [
  { id: 1, name: 'Intent Capture', abbr: 'IC', desc: 'Natural language parsed, domain classified, entities extracted, priority assigned.', color: '#c9b787' },
  { id: 2, name: 'Signal Mesh',    abbr: 'SM', desc: 'Cross-domain signals correlated, evidence weight scored, causal graph seeded.', color: '#b08d52' },
  { id: 3, name: 'Context Engine', abbr: 'CE', desc: 'Historical context assembled, operator memory injected, domain schema applied.', color: '#c9b787' },
  { id: 4, name: 'Planner Agent',  abbr: 'PA', desc: 'Objective decomposed into sub-tasks, dependencies mapped, agents assigned.', color: '#8a8a8a' },
  { id: 5, name: 'Executor Ring',  abbr: 'ER', desc: 'Domain operators invoked in parallel, tool calls dispatched, handoffs managed.', color: '#c9b787' },
  { id: 6, name: 'Covenant Gate',  abbr: 'CG', desc: 'Every action checked against policy clauses, approval tiers enforced, no bypass.', color: '#b08d52' },
  { id: 7, name: 'MirrorEval',     abbr: 'ME', desc: 'Counterfactual checked, confidence delta scored, recommendation validated.', color: '#8a8a8a' },
  { id: 8, name: 'Approval Rail',  abbr: 'AR', desc: 'Human-in-the-loop gate: approve, defer, or reject before any material action.', color: '#c9b787' },
  { id: 9, name: 'Executor',       abbr: 'EX', desc: 'Action dispatched to real-world systems with PCE contract bound.', color: '#c9b787' },
  { id: 10, name: 'Proof Ledger',  abbr: 'PL', desc: 'Immutable proof entry appended — SHA-256 hash chain, tamper-evident.', color: '#b08d52' },
  { id: 11, name: 'Learning Loop', abbr: 'LL', desc: 'Outcome fed back to calibration engine, model weights nudged, policy refined.', color: '#c9b787' },
];

const SCENARIOS = [
  {
    id: 'maritime',
    label: 'Maritime Risk',
    color: '#8a8a8a',
    intent: '"Flag Horizon Star — delayed ETA and fuel anomaly. Recommend port alternatives."',
    steps: [
      'Parse: vessel=Horizon Star, signals=[eta_delay, fuel_anomaly]',
      'Correlate AIS + weather + port congestion — 3 signals fused',
      'Assemble vessel history, charter party terms, port capacity',
      'Decompose: [vessel_lookup, eta_calc, port_alt, fuel_check]',
      'Cascade Navigator → 4 tool calls parallel — 840ms',
      'Policy: fuel_anomaly triggers SOLAS check — PASS',
      'Counterfactual: "No action" outcome 38% worse. Confidence: 0.91',
      'Approval tier: VP-Operations — awaiting response',
      'Port standy notification dispatched to Port Klang ops',
      'Proof #PL-0821 appended — sha256:7f3a...e2b1',
      'Fuel anomaly pattern → +0.04 weight in Maritime causal model',
    ],
  },
  {
    id: 'cyber',
    label: 'Cyber Incident',
    color: '#f5f5f5',
    intent: '"TG-Ember C2 traffic detected on 8080. Escalate and contain."',
    steps: [
      'Parse: threat_actor=TG-Ember, ioc=[c2_8080, dns_over_https]',
      'Correlate SIEM + endpoint + threat intel — STIX match confirmed',
      'Assemble TG-Ember TTPs, prior incidents, affected asset map',
      'Decompose: [isolate_host, block_ioc, notify_soc, draft_report]',
      'Guardian → isolation API + YARA deploy — 1.2s',
      'Policy: C2 traffic → auto-isolate AUTHORIZED, no approval needed',
      'MirrorEval: "Quarantine now" vs "Observe 30m" — quarantine +67% success',
      'Auto-approved by Covenant (threshold: critical threat, auto-tier)',
      'Host isolated, IOC pushed to all endpoints, SOC notified',
      'Proof #PL-0822 — chain entry: Guardian/isolate/TG-Ember/sha256:2c91',
      'TG-Ember pattern → incident playbook updated, detection rule refined',
    ],
  },
  {
    id: 'legal',
    label: 'Legal Escalation',
    color: '#c9b787',
    intent: '"Talbot matter filing deadline in 48h. Opposing counsel late pattern detected."',
    steps: [
      'Parse: matter=Talbot, deadline=48h, signal=opposing_late_pattern',
      'Correlate case history + docket feed + counsel patterns — 5 precedents',
      'Assemble: Talbot docket, prior filings, judge preferences, deadlines',
      'Decompose: [deadline_alert, draft_motion, notify_partner, prepare_ext]',
      'Counsel Sentinel → Clio API + calendar block — 320ms',
      'Policy: deadline<72h triggers mandatory partner notification — TRIGGERED',
      'MirrorEval: "File now" vs "Wait for opp" — early filing +82% success rate',
      'Approval tier: Managing Partner — escalated via Slack',
      'Calendar blocked, motion draft started, partner alerted',
      'Proof #PL-0823 — Talbot/deadline_alert/sha256:9d12...7b4e',
      'Late-counsel pattern → weight +0.12 in Legal escalation model',
    ],
  },
  {
    id: 'revenue',
    label: 'Revenue Friction',
    color: '#b08d52',
    intent: '"Pipeline velocity down 22%. Identify friction and surface top 3 interventions."',
    steps: [
      'Parse: metric=pipeline_velocity, delta=-22%, domain=revenue',
      'Correlate CRM stage data + call sentiment + market signals',
      'Assemble: Q2 baseline, deal stage breakdown, rep performance',
      'Decompose: [stage_analysis, churn_risk, coach_surface, forecast_adj]',
      'Pipeline Oracle → Salesforce + Gong + forecast model — 1.8s',
      'Policy: forecast_adj >15% requires CFO notification — triggered',
      'MirrorEval: 3 interventions scored — deal velocity coaching ranked #1',
      'Approval tier: VP-Revenue + CFO notification auto-sent',
      'Coaching recommendations surfaced to rep managers, forecast adjusted',
      'Proof #PL-0824 — Revenue/pipeline_friction/sha256:4e87...1c3d',
      'Velocity pattern → Q2 friction model updated, early-warning threshold -3%',
    ],
  },
];

export function PipelineCanvas() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [runningStep, setRunningStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS.find(s => s.id === activeScenario);

  function startScenario(id: string) {
    setActiveScenario(id);
    setRunningStep(-1);
    setCompletedSteps(new Set());
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function play() {
    if (playing) {
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setPlaying(true);
    let step = runningStep < 0 ? 0 : runningStep + 1;
    if (step >= 11) { step = 0; setCompletedSteps(new Set()); }

    const tick = () => {
      setRunningStep(step);
      setCompletedSteps(prev => {
        const next = new Set(prev);
        if (step > 0) next.add(step - 1);
        return next;
      });
      step++;
      if (step > 11) {
        setPlaying(false);
        setCompletedSteps(new Set([0,1,2,3,4,5,6,7,8,9,10]));
        setRunningStep(11);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 900);
  }

  function reset() {
    setRunningStep(-1);
    setCompletedSteps(new Set());
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <Layout>
      <PageHeader
        label="PIPELINE CANVAS"
        title="Live Orchestration Pipeline"
        subtitle="Watch a governed intent flow through all 11 layers — from natural language capture to proof-carrying execution and outcome learning."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PIPELINE LAYERS" value={11} sub="all operational" accent={T.accent} />
        <KpiCard label="AVG END-TO-END" value="3.4s" sub="demo scenario" accent={T.accent} />
        <KpiCard label="PROOF INTEGRITY" value="100%" sub="chain intact" accent={T.accent} />
        <KpiCard label="ACTIVE SCENARIOS" value={SCENARIOS.length} sub="pre-scripted" accent={T.dim} />
      </div>

      {/* Scenario selector */}
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Select Demo Scenario</div>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => startScenario(s.id)}
              className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
              style={{
                background: activeScenario === s.id ? `${s.color}18` : T.surface,
                border: `1px solid ${activeScenario === s.id ? s.color + '40' : T.border}`,
                color: activeScenario === s.id ? s.color : T.dim,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {scenario && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-xs font-mono mb-1" style={{ color: T.muted }}>INCOMING INTENT</div>
          <div className="text-sm italic" style={{ color: T.accent }}>{scenario.intent}</div>
          <div className="flex gap-2 mt-3">
            <ActionButton variant="primary" size="sm" onClick={play}>
              {playing ? '⏸ Pause' : runningStep >= 11 ? '↺ Replay' : runningStep < 0 ? '▶ Run' : '▶ Continue'}
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={reset}>Reset</ActionButton>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline visualization */}
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.muted }}>11-Layer Orchestration Pipeline</span>
              {playing && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.accent }} />
                  <span className="text-[9px] font-mono" style={{ color: T.accent }}>Running</span>
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              {LAYERS.map((layer, idx) => {
                const isRunning = runningStep === idx;
                const isDone = completedSteps.has(idx);
                const isPending = !isRunning && !isDone;
                return (
                  <div key={layer.id}>
                    <motion.div
                      className="rounded-lg p-3 flex items-center gap-3 relative overflow-hidden"
                      style={{
                        background: isRunning ? `${layer.color}12` : isDone ? `${layer.color}08` : 'rgba(255,255,255,0.015)',
                        border: `1px solid ${isRunning ? layer.color + '50' : isDone ? layer.color + '25' : T.border}`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isRunning && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          style={{ background: `linear-gradient(90deg, transparent, ${layer.color}08, transparent)` }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold"
                        style={{
                          background: isRunning ? `${layer.color}30` : isDone ? `${layer.color}15` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isRunning ? layer.color : isDone ? layer.color + '60' : T.border}`,
                          color: isRunning ? layer.color : isDone ? layer.color : T.muted,
                        }}
                      >
                        {isDone ? '✓' : layer.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: isRunning ? layer.color : isDone ? T.dim : T.muted }}>
                            {layer.name}
                          </span>
                          <span className="text-[9px] font-mono" style={{ color: T.muted }}>{layer.abbr}</span>
                        </div>
                        <AnimatePresence>
                          {(isRunning || isDone) && scenario && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-[10px] mt-0.5 truncate"
                              style={{ color: isRunning ? T.dim : T.muted }}
                            >
                              {scenario.steps[idx]}
                            </motion.div>
                          )}
                          {isPending && !scenario && (
                            <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{layer.desc.slice(0, 60)}…</div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex-shrink-0">
                        {isRunning && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: layer.color }} />}
                        {isDone && <span className="text-[9px] font-mono" style={{ color: layer.color }}>done</span>}
                      </div>
                    </motion.div>
                    {idx < LAYERS.length - 1 && (
                      <div className="flex justify-center my-0.5">
                        <div
                          className="w-px h-2"
                          style={{ background: isDone ? `${layer.color}40` : T.border }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: layer detail */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Layer Reference</div>
            <div className="flex flex-col gap-2">
              {LAYERS.map(layer => (
                <Card key={layer.id} style={{ borderLeft: `2px solid ${layer.color}40` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono w-5" style={{ color: T.muted }}>{layer.id}</span>
                    <span className="text-xs font-medium" style={{ color: layer.color }}>{layer.name}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{layer.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
