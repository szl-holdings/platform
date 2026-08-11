import { useState } from 'react';
import { Layout } from '../components/layout';
import {
  PageHeader,
  Card,
  SectionTitle,
  KpiCard,
  ActionButton,
  TraceStep,
  VerdictBadge,
  VerticalBadge,
} from '../components/ui';
import { SEED_DEMO_SCENARIOS, SEED_WORKCELLS, SEED_SIGNALS } from '@workspace/a11oy-fabric';

const SCENARIO_COLORS = ['#8a8a8a', '#c9b787', '#8a8a8a', '#f5f5f5', '#c9b787'];
const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787',
  'vessels-maritime': '#8a8a8a',
  'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5',
  'prism-counsel': '#8a8a8a',
  'carlota-jo': '#c9b787',
  'alloy-core': '#8a8a8a',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue',
  'vessels-maritime': 'Vessels Maritime',
  'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense',
  'prism-counsel': 'Counsel',
  'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core',
};

export function Demo() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(-1);

  const scenario = activeScenario ? SEED_DEMO_SCENARIOS.find((s) => s.id === activeScenario) : null;
  const linkedWC = scenario
    ? SEED_WORKCELLS.filter((w) => scenario.workcellIds.includes(w.id))
    : [];
  const linkedSignals = scenario
    ? SEED_SIGNALS.filter((s) => scenario.initialSignals.includes(s.id))
    : [];

  const steps = scenario
    ? [
        {
          step: 'Signal Mesh: initial signals ingested',
          status: 'completed',
          note: scenario.initialSignals.join(', '),
        },
        {
          step: 'Causal Core: evidence graph assembled',
          status: 'completed',
          note: `${linkedSignals.length} signals correlated`,
        },
        {
          step: 'Context Engine: context packs built',
          status: 'completed',
          note: `${linkedWC.length} workcells provisioned`,
        },
        ...linkedWC.slice(0, 3).map((wc) => ({
          step: `Workcell: ${wc.name}`,
          status:
            wc.status === 'completed'
              ? 'completed'
              : wc.status === 'running'
                ? 'running'
                : 'pending',
          note: wc.objective,
        })),
        {
          step: 'Covenant Layer: policy gates evaluated',
          status: 'completed',
          note: `${linkedWC.filter((w) => w.requiresApproval).length} approval gates triggered`,
        },
        {
          step: 'MirrorEval: recommendations scored',
          status: 'completed',
          note: `Verdicts: ${linkedWC.map((w) => w.mirrorEvalResult.verdict).join(', ')}`,
        },
        {
          step: 'Demo Proof Ledger: seed PCE contracts referenced',
          status: 'completed',
          note: 'Fixture receipt fields assembled for inspection',
        },
      ]
    : [];

  const startDemo = (id: string) => {
    setActiveScenario(id);
    setStepIdx(-1);
  };

  const advanceStep = () => {
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
  };

  const resetDemo = () => setStepIdx(-1);

  return (
    <Layout>
      <PageHeader
        label="DEMO CENTER"
        title="Interactive Demo Scenarios"
        subtitle="Step through repository-seeded scenarios that model how A11oy is designed to sense, reason, recommend, and preserve receipts."
        status="DEMO"
      />

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Demo only:</strong> scenarios, signals,
        Workcells, decisions, and receipt fields come from repository fixtures. No connector,
        approval authority, external action, or production ledger is invoked.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="SEED SCENARIOS"
          value={SEED_DEMO_SCENARIOS.length}
          sub="repository fixtures"
          accent="#c9b787"
        />
        <KpiCard
          label="SEED WORKCELLS"
          value={SEED_WORKCELLS.length}
          sub="repository fixtures"
          accent="#c9b787"
        />
        <KpiCard
          label="SEED SIGNALS"
          value={SEED_SIGNALS.length}
          sub="repository fixtures"
          accent="#c9b787"
        />
        <KpiCard label="EVIDENCE STATE" value="DEMO" sub="not operational" accent="#8a8a8a" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scenario selector */}
        <div>
          <SectionTitle>Select a Scenario</SectionTitle>
          <div className="flex flex-col gap-3">
            {SEED_DEMO_SCENARIOS.map((s, i) => {
              const color = SCENARIO_COLORS[i % SCENARIO_COLORS.length];
              const isActive = s.id === activeScenario;
              const wcs = SEED_WORKCELLS.filter((w) => s.workcellIds.includes(w.id));
              const primaryVertical = wcs[0]?.vertical ?? 'alloy-core';
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => startDemo(s.id)}
                  aria-pressed={isActive}
                  className="text-left rounded-lg border p-4 transition-all"
                  style={{
                    backgroundColor: isActive ? `${color}08` : 'var(--color-a11oy-card)',
                    borderColor: isActive ? color : 'var(--color-a11oy-border)',
                    borderLeft: `3px solid ${color}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="font-semibold text-sm mb-1"
                    style={{ color: 'var(--color-a11oy-text)' }}
                  >
                    {s.name}
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {s.description}
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <VerticalBadge
                      vertical={VERTICAL_LABELS[primaryVertical] ?? primaryVertical}
                      color={VERTICAL_COLORS[primaryVertical] ?? color}
                    />
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {wcs.length} workcells
                    </span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {s.initialSignals.length} signals
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active scenario */}
        <div className="lg:col-span-2">
          {!scenario ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
              <div className="text-3xl mb-3" style={{ color: 'var(--color-a11oy-border)' }}>
                ▶
              </div>
              <div
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--color-a11oy-text)' }}
              >
                Select a scenario to begin
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Each scenario walks through A11oy's full pipeline — from signal detection to proof.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div
                  className="font-semibold text-lg mb-1"
                  style={{ color: 'var(--color-a11oy-text)' }}
                >
                  {scenario.name}
                </div>
                <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  {scenario.description}
                </p>
              </div>

              {/* Step Walkthrough */}
              <SectionTitle>Execution Pipeline ({steps.length} steps)</SectionTitle>
              <Card className="mb-4">
                <div className="flex flex-col gap-1 mb-4">
                  {steps.map((step, i) => {
                    const visible = stepIdx === -1 || i <= stepIdx;
                    return (
                      <div
                        key={step.step}
                        className="transition-all"
                        style={{ opacity: stepIdx === -1 ? 0.5 : visible ? 1 : 0.3 }}
                      >
                        <TraceStep
                          step={step.step}
                          status={
                            stepIdx === -1
                              ? 'pending'
                              : i < stepIdx
                                ? 'completed'
                                : i === stepIdx
                                  ? 'running'
                                  : 'pending'
                          }
                          note={visible ? step.note : undefined}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Controls */}
                <div
                  className="flex items-center gap-3 border-t pt-3"
                  style={{ borderColor: 'var(--color-a11oy-border)' }}
                >
                  <ActionButton
                    variant="primary"
                    onClick={stepIdx >= steps.length - 1 ? resetDemo : advanceStep}
                  >
                    {stepIdx < 0
                      ? '▶ Start'
                      : stepIdx >= steps.length - 1
                        ? '↩ Reset'
                        : '→ Next Step'}
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={resetDemo}>
                    Reset
                  </ActionButton>
                  <div
                    className="ml-auto text-xs font-mono"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    {Math.max(0, stepIdx + 1)} / {steps.length}
                  </div>
                </div>

                {/* Progress */}
                <div
                  className="mt-3 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-a11oy-muted)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stepIdx < 0 ? 0 : ((stepIdx + 1) / steps.length) * 100}%`,
                      backgroundColor: stepIdx >= steps.length - 1 ? '#c9b787' : '#c9b787',
                    }}
                  />
                </div>
              </Card>

              {stepIdx >= steps.length - 1 && (
                <div
                  className="mb-4 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(201,183,135,0.08)',
                    border: '1px solid rgba(201,183,135,0.2)',
                  }}
                >
                  <div className="text-sm font-semibold mb-1" style={{ color: '#c9b787' }}>
                    Scenario Complete
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    All pipeline stages complete. Every step governed, traced, and proof-recorded.
                  </div>
                </div>
              )}

              {/* Linked Workcells */}
              <SectionTitle>Linked Workcells ({linkedWC.length})</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {linkedWC.map((wc) => (
                  <Card key={wc.id} className="text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                        {wc.name}
                      </span>
                      <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
                    </div>
                    <div
                      className="truncate mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      {wc.objective}
                    </div>
                    <span
                      className="font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          wc.status === 'completed'
                            ? 'rgba(201,183,135,0.12)'
                            : wc.status === 'running'
                              ? 'rgba(201,183,135,0.12)'
                              : 'rgba(155,172,196,0.1)',
                        color:
                          wc.status === 'completed'
                            ? '#c9b787'
                            : wc.status === 'running'
                              ? '#c9b787'
                              : '#5e5e5e',
                      }}
                    >
                      {wc.status}
                    </span>
                  </Card>
                ))}
              </div>

              {/* Initial Signals */}
              <SectionTitle>Initial Signals ({linkedSignals.length})</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {linkedSignals.map((sig) => (
                  <span
                    key={sig.id}
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-a11oy-muted)',
                      color: 'var(--color-a11oy-text-ghost)',
                      border: '1px solid var(--color-a11oy-border)',
                    }}
                  >
                    {sig.id} — {sig.title.slice(0, 40)}
                  </span>
                ))}
                {linkedSignals.length === 0 &&
                  scenario.initialSignals.map((id) => (
                    <span
                      key={id}
                      className="text-xs font-mono px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--color-a11oy-muted)',
                        color: 'var(--color-a11oy-text-ghost)',
                        border: '1px solid var(--color-a11oy-border)',
                      }}
                    >
                      {id}
                    </span>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
