import { ArrowRight } from 'lucide-react';

interface NavProps {
  onNavigate: (page: string) => void;
}

const LAYERS = [
  {
    id: 'input',
    number: 1,
    name: 'Input Layer',
    description:
      'Accepts and receives data from all connected systems — API signals, webhook payloads, form submissions, file uploads, and manual operator inputs.',
    components: [
      'API signal ingestion',
      'Webhook receivers',
      'Form & file inputs',
      'System event streams',
    ],
    products: ['KORA', 'SEXTANT', 'Carlota Jo', 'External APIs'],
    accent: '#4B8BDB',
    icon: '📥',
  },
  {
    id: 'normalisation',
    number: 2,
    name: 'Normalisation Layer',
    description:
      'Transforms raw inputs into consistent, structured data objects. Applies classification tags, extracts entities, and prepares data for downstream reasoning.',
    components: [
      'Schema normalisation',
      'Classification engine',
      'Entity extraction',
      'Priority scoring',
    ],
    products: ['Intake Agent', 'Routing Agent'],
    accent: '#3b82f6',
    icon: '⚙️',
  },
  {
    id: 'reasoning',
    number: 3,
    name: 'Reasoning and Logic Layer',
    description:
      'Applies AI reasoning, anomaly detection, and knowledge base retrieval to produce structured insights with confidence scores and explainable rationale.',
    components: [
      'AI reasoning engine',
      'Knowledge base retrieval',
      'Anomaly detection',
      'Confidence scoring',
    ],
    products: ['Monitoring Agent', 'Research Agent', 'Summary Agent'],
    accent: '#8b5cf6',
    icon: '🧠',
  },
  {
    id: 'orchestration',
    number: 4,
    name: 'Orchestration Layer',
    description:
      'Coordinates multi-agent workflows, manages sequencing and handoffs between agents, and ensures correct execution of complex compound tasks.',
    components: [
      'Workflow coordinator',
      'Agent sequencing',
      'Handoff management',
      'State tracking',
    ],
    products: ['Workflow Coordinator', 'Routing Agent', 'Exception Agent'],
    accent: '#a78bfa',
    icon: '🎯',
  },
  {
    id: 'output',
    number: 5,
    name: 'Output Layer',
    description:
      'Produces structured, human-readable outputs — summaries, alerts, documents, proposals, and action queues — from fully reasoned workflow results.',
    components: [
      'Document generation',
      'Summary synthesis',
      'Alert formatting',
      'Action queue management',
    ],
    products: ['Summary Agent', 'Document Agent', 'All output types'],
    accent: '#10b981',
    icon: '📤',
  },
  {
    id: 'governance',
    number: 6,
    name: 'Governance Layer',
    description:
      'Wraps the entire pipeline in accountability controls — human approval flows, audit trails, confidence gates, escalation logic, and role-based access.',
    components: ['Approval flows', 'Audit trail logging', 'Confidence gates', 'Escalation rules'],
    products: ['Approval Agent', 'Exception Agent', 'All workflows'],
    accent: '#f59e0b',
    icon: '🔐',
  },
];

const PRODUCT_INTEGRATIONS = [
  {
    name: 'Command',
    icon: '⚡',
    accent: '#f59e0b',
    description:
      'Command feeds service health streams, alert data, and operational metrics into Alloy. Counsel returns structured insights, prioritised incidents, and recommended actions.',
    dataIn: ['Service health metrics', 'Alert feeds', 'Performance data', 'Incident history'],
    dataOut: [
      'Structured insight briefs',
      'Prioritised alerts',
      'Recommended responses',
      'Trend analysis',
    ],
  },
  {
    name: 'SEXTANT',
    icon: '🚢',
    accent: '#3b82f6',
    description:
      'SEXTANT provides AIS signal data, fleet status, and voyage information. Counsel interprets signals, detects deviations, and generates fleet intelligence briefings.',
    dataIn: ['AIS position signals', 'Vessel status', 'Voyage data', 'Weather conditions'],
    dataOut: [
      'Fleet intelligence briefs',
      'Deviation alerts',
      'Voyage summaries',
      'Operator notifications',
    ],
  },
  {
    name: 'Carlota Jo',
    icon: '✨',
    accent: '#f472b6',
    description:
      'Carlota Jo passes client requests, engagement data, and document requirements to Alloy. Counsel generates documents, manages approval flows, and routes operational tasks.',
    dataIn: ['Client requests', 'Engagement history', 'Document requirements', 'Templates'],
    dataOut: ['Draft documents', 'Approval-ready outputs', 'Workflow routing', 'Task assignments'],
  },
];

export default function ArchitecturePage({ onNavigate }: NavProps) {
  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: '#4B8BDB' }}
        >
          Architecture
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Six-layer intelligence system</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          Every input enters Counsel at the top and passes through normalisation, reasoning,
          orchestration, and output layers before reaching the governance layer that wraps the
          entire pipeline in accountability controls.
        </p>
      </div>

      {/* Layer Stack */}
      <div className="mb-20">
        <div className="space-y-3">
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="group rounded-xl border transition-all hover:border-white/15"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="p-5 md:p-7">
                <div className="md:flex md:items-start md:gap-8">
                  <div className="flex items-center gap-4 mb-4 md:mb-0 md:w-72 shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{
                        background: `${layer.accent}15`,
                        border: `1px solid ${layer.accent}30`,
                      }}
                    >
                      {layer.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono" style={{ color: layer.accent }}>
                          L{layer.number}
                        </span>
                        <h3 className="text-sm font-bold text-white/90">{layer.name}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-white/55 leading-relaxed mb-4">
                      {layer.description}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                          Components
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {layer.components.map((c) => (
                            <span
                              key={c}
                              className="text-[11px] px-2 py-0.5 rounded border"
                              style={{
                                borderColor: `${layer.accent}25`,
                                background: `${layer.accent}08`,
                                color: `${layer.accent}99`,
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                          Connected To
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {layer.products.map((p) => (
                            <span
                              key={p}
                              className="text-[11px] px-2 py-0.5 rounded border"
                              style={{
                                borderColor: 'rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.5)',
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flow indicator */}
        <div className="mt-6 flex items-center gap-2 text-sm text-white/30">
          <div
            className="flex-1 h-px"
            style={{
              background: 'linear-gradient(to right, rgba(75,139,219,0.3), rgba(245,158,11,0.3))',
            }}
          />
          <span className="text-xs uppercase tracking-widest px-3">
            Execution flows from Input → Governance
          </span>
          <div
            className="flex-1 h-px"
            style={{
              background: 'linear-gradient(to right, rgba(75,139,219,0.3), rgba(245,158,11,0.3))',
            }}
          />
        </div>
      </div>

      {/* Product Integration Map */}
      <div className="mb-20">
        <div className="mb-10">
          <div
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: '#4B8BDB' }}
          >
            Product Integrations
          </div>
          <h2 className="text-2xl font-bold mb-3">
            How connected products interact with the layers
          </h2>
          <p className="text-white/50 max-w-xl">
            Each product integrates at specific layers, providing inputs and receiving structured
            outputs from Counsel's pipeline.
          </p>
        </div>

        <div className="space-y-4">
          {PRODUCT_INTEGRATIONS.map((prod) => (
            <div
              key={prod.name}
              className="rounded-xl border p-6 md:p-8"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="md:flex md:gap-8">
                <div className="md:w-64 shrink-0 mb-5 md:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{
                        background: `${prod.accent}15`,
                        border: `1px solid ${prod.accent}30`,
                      }}
                    >
                      {prod.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{prod.name}</div>
                      <div
                        className="text-[11px] px-1.5 py-0.5 rounded inline-flex mt-0.5 font-medium"
                        style={{ background: `${prod.accent}15`, color: prod.accent }}
                      >
                        Powered by Counsel
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">{prod.description}</p>
                </div>

                <div className="flex-1 grid md:grid-cols-2 gap-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5">
                      Data Into Counsel
                    </div>
                    <div className="space-y-1.5">
                      {prod.dataIn.map((d) => (
                        <div key={d} className="flex items-center gap-2 text-xs text-white/55">
                          <div
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{ background: prod.accent }}
                          />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5">
                      Counsel Outputs Back
                    </div>
                    <div className="space-y-1.5">
                      {prod.dataOut.map((d) => (
                        <div key={d} className="flex items-center gap-2 text-xs text-white/55">
                          <div
                            className="w-1 h-1 rounded-full shrink-0 opacity-60"
                            style={{ background: '#4B8BDB' }}
                          />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA to Workflows */}
      <div
        className="rounded-2xl border p-8 text-center"
        style={{
          borderColor: 'rgba(75,139,219,0.15)',
          background: 'linear-gradient(135deg, rgba(75,139,219,0.04), rgba(99,102,241,0.04))',
        }}
      >
        <h3 className="text-xl font-bold mb-3">See the architecture in action</h3>
        <p className="text-white/50 mb-6">
          Explore the workflow patterns that run across these layers.
        </p>
        <button
          onClick={() => onNavigate('workflows')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black"
          style={{ background: '#4B8BDB' }}
        >
          View Workflows <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
