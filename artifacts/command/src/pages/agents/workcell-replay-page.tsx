import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronRight,
  Bot,
  Wrench,
  ShieldCheck,
  FileCheck,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { WORKCELL_MAP } from '@szl/a11oy-runtime';
import type { TraceStep } from '@szl/a11oy-runtime';

const STATUS_COLOR: Record<string, string> = {
  success: '#22c55e',
  warning: '#d4a054',
  failure: '#ef4444',
  blocked: '#ef4444',
  pending: '#64748b',
};

export function WorkcellReplayPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wc = params.id ? WORKCELL_MAP[params.id] : null;
  const steps = wc?.executionTrace.steps ?? [];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  const reset = () => { setPlaying(false); setCurrentStep(-1); };

  if (!wc) {
    return <div style={{ background: '#080c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Workcell not found</div>;
  }

  const visibleSteps = currentStep === -1 ? [] : steps.slice(0, currentStep + 1);
  const activeStep = currentStep >= 0 ? steps[currentStep] : null;
  const progress = currentStep < 0 ? 0 : ((currentStep + 1) / steps.length) * 100;

  const typeIcon = (t: string) => {
    if (t === 'agent_call') return Bot;
    if (t === 'tool_call') return Wrench;
    if (t === 'approval_gate') return ShieldCheck;
    if (t === 'eval') return FileCheck;
    return Zap;
  };

  return (
    <div style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(`/agents/workcells/${wc.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          <ArrowLeft size={14} />
        </button>
        <ChevronRight size={12} color="#334155" />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Failure Replay — {wc.title}</div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
          Step {Math.max(0, currentStep + 1)} / {steps.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 3, background: '#0f172a' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8b7ac8, #a78bfa)', transition: 'width 0.4s' }} />
      </div>

      {/* Playback Controls */}
      <div style={{ padding: '14px 24px', background: '#0a0f1a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={reset} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <RotateCcw size={12} />
          Reset
        </button>
        <button
          onClick={() => {
            if (currentStep >= steps.length - 1) { setCurrentStep(-1); setPlaying(false); return; }
            setPlaying(!playing);
          }}
          style={{ background: playing ? 'rgba(212,160,84,0.15)' : 'rgba(139,122,200,0.15)', border: `1px solid ${playing ? 'rgba(212,160,84,0.3)' : 'rgba(139,122,200,0.3)'}`, borderRadius: 6, padding: '6px 16px', cursor: 'pointer', color: playing ? '#d4a054' : '#8b7ac8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? 'Pause' : currentStep >= steps.length - 1 ? 'Replay' : 'Play'}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{ background: speed === s ? 'rgba(139,122,200,0.15)' : 'transparent', border: `1px solid ${speed === s ? 'rgba(139,122,200,0.3)' : '#1e293b'}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', color: speed === s ? '#8b7ac8' : '#64748b', fontSize: 11 }}>
              {s}×
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
          <span>Total steps: {steps.length}</span>
          <span>Total cost: ${wc.totalCostUsd.toFixed(3)}</span>
          <span>Tokens: {wc.executionTrace.totalTokens.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: 'calc(100vh - 130px)' }}>
        {/* Timeline */}
        <div style={{ overflow: 'auto', padding: 24 }}>
          {currentStep === -1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#475569', gap: 12 }}>
              <Play size={32} color="#8b7ac8" />
              <div style={{ fontSize: 14, color: '#64748b' }}>Press Play to replay the execution trace</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{steps.length} steps · {wc.title}</div>
            </div>
          )}

          {visibleSteps.map((step, i) => {
            const isActive = i === currentStep;
            const color = STATUS_COLOR[step.status];
            const Icon = typeIcon(step.type);
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '12px 0',
                  opacity: isActive ? 1 : 0.7,
                  transition: 'opacity 0.3s',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? `${color}22` : `${color}10`, border: `1px solid ${isActive ? color : color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s', boxShadow: isActive ? `0 0 12px ${color}44` : 'none' }}>
                    <Icon size={14} color={color} />
                  </div>
                  {i < visibleSteps.length - 1 && <div style={{ width: 1, flex: 1, background: '#1e293b', marginTop: 4, minHeight: 20 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? '#f1f5f9' : '#94a3b8' }}>{step.label}</div>
                    <div style={{ fontSize: 10, color, background: `${color}10`, border: `1px solid ${color}28`, borderRadius: 10, padding: '1px 7px' }}>{step.status}</div>
                    {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b7ac8', animation: 'pulse 1s infinite' }} />}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{step.detail}</div>
                  {(step.tokens || step.latencyMs) && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                      {step.tokens && <span style={{ fontSize: 10, color: '#334155' }}>{step.tokens.toLocaleString()} tokens</span>}
                      {step.costUsd && <span style={{ fontSize: 10, color: '#334155' }}>${step.costUsd.toFixed(4)}</span>}
                      <span style={{ fontSize: 10, color: '#334155' }}>{(step.latencyMs / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#334155', paddingTop: 3 }}>{step.type.replace(/_/g, ' ')}</div>
              </div>
            );
          })}
        </div>

        {/* Active Step Detail Panel */}
        <div style={{ borderLeft: '1px solid #1e293b', background: '#080c14', overflow: 'auto', padding: 20 }}>
          {activeStep ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Active Step</div>
                <div style={{ background: '#0f172a', borderRadius: 8, border: `1px solid ${STATUS_COLOR[activeStep.status]}28`, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{activeStep.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{activeStep.detail}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div style={{ fontSize: 10, color: '#64748b' }}>Type</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{activeStep.type.replace(/_/g, ' ')}</div></div>
                    <div><div style={{ fontSize: 10, color: '#64748b' }}>Status</div><div style={{ fontSize: 12, color: STATUS_COLOR[activeStep.status] }}>{activeStep.status}</div></div>
                    {activeStep.tokens && <div><div style={{ fontSize: 10, color: '#64748b' }}>Tokens</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{activeStep.tokens.toLocaleString()}</div></div>}
                    <div><div style={{ fontSize: 10, color: '#64748b' }}>Latency</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{(activeStep.latencyMs / 1000).toFixed(1)}s</div></div>
                    {activeStep.operatorId && <div><div style={{ fontSize: 10, color: '#64748b' }}>Operator</div><div style={{ fontSize: 12, color: '#8b7ac8' }}>{activeStep.operatorId}</div></div>}
                    {activeStep.toolId && <div><div style={{ fontSize: 10, color: '#64748b' }}>Tool</div><div style={{ fontSize: 12, color: '#d4a054' }}>{activeStep.toolId}</div></div>}
                  </div>
                </div>
              </div>

              {/* Progress summary */}
              <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Progress</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{currentStep + 1} of {steps.length} steps</span>
                  <span style={{ fontSize: 12, color: '#8b7ac8', fontWeight: 600 }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8b7ac8, #a78bfa)', borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Steps Done</div><div style={{ fontSize: 14, color: '#22c55e', fontWeight: 700 }}>{visibleSteps.filter(s => s.status === 'success').length}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Warnings</div><div style={{ fontSize: 14, color: '#d4a054', fontWeight: 700 }}>{visibleSteps.filter(s => s.status === 'warning').length}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Tokens</div><div style={{ fontSize: 14, color: '#8b7ac8', fontWeight: 700 }}>{visibleSteps.reduce((s, t) => s + (t.tokens ?? 0), 0).toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Cost</div><div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>${visibleSteps.reduce((s, t) => s + (t.costUsd ?? 0), 0).toFixed(4)}</div></div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#475569', gap: 8 }}>
              <Zap size={24} color="#334155" />
              <div style={{ fontSize: 13 }}>No step selected</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkcellReplayPage;
