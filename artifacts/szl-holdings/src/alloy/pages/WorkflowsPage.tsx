import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ALLOY_WORKFLOWS } from '../data/workflows';
import { trackEvent } from '../lib/track-event';

interface NavProps {
  onNavigate: (page: string) => void;
}

const CATEGORY_ACCENT: Record<string, string> = {
  Intelligence: '#4B8BDB',
  Documents: '#a78bfa',
  Operations: '#f59e0b',
  Governance: '#10b981',
  Advanced: '#f472b6',
};

export default function WorkflowsPage({ onNavigate }: NavProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedWorkflow = ALLOY_WORKFLOWS.find((w) => w.id === selected);

  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: '#4B8BDB' }}
        >
          Workflows
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Real workflow patterns</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          These are the structured patterns Alloy executes across the ecosystem — not abstract
          templates, but the actual sequences that move operational data from signal to action.
        </p>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Workflow List */}
        <div className="lg:w-80 shrink-0 mb-6 lg:mb-0">
          <div className="space-y-2">
            {ALLOY_WORKFLOWS.map((workflow) => {
              const accent = CATEGORY_ACCENT[workflow.category] ?? '#4B8BDB';
              const isSelected = selected === workflow.id;
              return (
                <button
                  key={workflow.id}
                  onClick={() => {
                    if (!isSelected)
                      trackEvent('workflow_click', {
                        workflow_id: workflow.id,
                        workflow_name: workflow.name,
                        category: workflow.category,
                      });
                    setSelected(isSelected ? null : workflow.id);
                  }}
                  className="w-full text-left p-4 rounded-xl border transition-all"
                  style={{
                    borderColor: isSelected ? `${accent}40` : 'rgba(255,255,255,0.08)',
                    background: isSelected ? `${accent}08` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{workflow.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white/90">{workflow.name}</span>
                      </div>
                      <div className="text-xs text-white/40 leading-relaxed line-clamp-2">
                        {workflow.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          {workflow.category}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {workflow.steps.length} steps
                        </span>
                        {workflow.approvalPoints > 0 && (
                          <span className="text-[10px] text-white/30">
                            {workflow.approvalPoints} approval
                            {workflow.approvalPoints > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workflow Detail */}
        <div className="flex-1">
          {selectedWorkflow ? (
            <WorkflowDetail workflow={selectedWorkflow} onNavigate={onNavigate} />
          ) : (
            <div
              className="rounded-xl border p-10 text-center"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="text-4xl mb-4">🔀</div>
              <div className="text-white/50 text-sm">
                Select a workflow to see its steps, agents, and outputs in detail.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowDetail({
  workflow,
  onNavigate,
}: {
  workflow: (typeof ALLOY_WORKFLOWS)[number];
  onNavigate: (page: string) => void;
}) {
  const accent = CATEGORY_ACCENT[workflow.category] ?? '#4B8BDB';

  return (
    <div
      className="rounded-xl border p-6 md:p-8"
      style={{ borderColor: `${accent}25`, background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-start gap-4 mb-6">
        <span className="text-3xl">{workflow.icon}</span>
        <div>
          <h2 className="text-xl font-bold mb-1">{workflow.name}</h2>
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: `${accent}15`, color: accent }}
            >
              {workflow.category}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded border text-white/40"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              ~{workflow.estimatedDuration}
            </span>
            {workflow.approvalPoints > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded border text-amber-400"
                style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}
              >
                {workflow.approvalPoints} human approval point
                {workflow.approvalPoints > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-white/30 mb-2">Trigger</div>
        <div
          className="text-sm text-white/65 p-3 rounded-lg border"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
        >
          {workflow.trigger}
        </div>
      </div>

      <p className="text-sm text-white/60 leading-relaxed mb-8">{workflow.description}</p>

      {/* Steps */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-white/30 mb-4">Workflow Steps</div>
        <div className="space-y-2">
          {workflow.steps.map((step) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="flex-col flex items-center mt-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: step.approvalPoint ? 'rgba(245,158,11,0.15)' : `${accent}15`,
                    border: `1.5px solid ${step.approvalPoint ? 'rgba(245,158,11,0.4)' : `${accent}30`}`,
                    color: step.approvalPoint ? '#f59e0b' : accent,
                  }}
                >
                  {step.step}
                </div>
                {step.step < workflow.steps.length && (
                  <div className="w-px h-4 mt-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white/90">{step.name}</span>
                  {step.approvalPoint && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                    >
                      Approval Required
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40">{step.description}</div>
                <div className="mt-1 text-[10px] text-white/25">Agent: {step.agentId}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-white/30 mb-3">Outputs</div>
        <div className="flex flex-wrap gap-2">
          {workflow.outputs.map((o) => (
            <span
              key={o}
              className="text-xs px-2.5 py-1 rounded-lg border"
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              {o}
            </span>
          ))}
        </div>
      </div>

      {/* Connected Products */}
      <div className="border-t pt-5 mt-5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/30">
            Connected to: {workflow.connectedProducts.join(', ')}
          </div>
          <button
            onClick={() => onNavigate('agents')}
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: accent }}
          >
            View agents <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
