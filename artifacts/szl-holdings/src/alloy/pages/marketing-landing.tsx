import {
  Activity,
  ArrowRight,
  CheckCircle,
  FileText,
  GitBranch,
  Layers,
  Network,
  Shield,
  Zap,
} from 'lucide-react';

const agentRoles = [
  {
    name: 'Signal Collector',
    role: 'Acquires raw data from operational systems, APIs, and event streams',
    color: '#4B8BDB',
  },
  {
    name: 'Normalizer',
    role: 'Standardizes heterogeneous inputs into a consistent internal schema',
    color: '#00b8d9',
  },
  {
    name: 'Classifier',
    role: 'Applies model-driven tagging to identify signal type, urgency, and domain',
    color: '#0098ba',
  },
  {
    name: 'Reasoning Engine',
    role: 'Applies domain logic to assess consequence, context, and recommended action',
    color: '#007a94',
  },
  {
    name: 'Orchestrator',
    role: 'Sequences multi-step workflows and routes tasks to the right system or person',
    color: '#005e73',
  },
  {
    name: 'Output Generator',
    role: 'Produces structured outputs: reports, briefs, API calls, and audit records',
    color: '#004d60',
  },
  {
    name: 'Governance Reviewer',
    role: 'Intercepts high-stakes decisions for human approval before execution',
    color: '#003d4d',
  },
];

const powers = [
  {
    name: 'KORA',
    desc: 'Decision intelligence and command. Counsel drives signal ingestion, anomaly classification, and workflow routing.',
    accent: '#f59e0b',
  },
  {
    name: 'SEXTANT',
    desc: 'Maritime intelligence. Counsel processes voyage data, fleet exceptions, and regulatory signals into command-ready output.',
    accent: '#3b82f6',
  },
  {
    name: 'Creative Workflows',
    desc: 'Governed creative orchestration. Counsel sequences campaign production — scripts, storyboards, voice assets, and approvals — from brief to final delivery.',
    accent: '#4B8BDB',
  },
];

const pipelineSteps = [
  {
    step: '01',
    label: 'Inputs',
    desc: 'Structured and unstructured data from APIs, databases, operational feeds',
    icon: Activity,
  },
  {
    step: '02',
    label: 'Normalization',
    desc: 'Standardized schema — unified regardless of source format or protocol',
    icon: Layers,
  },
  {
    step: '03',
    label: 'Reasoning',
    desc: 'Domain-specific classification, consequence scoring, and context enrichment',
    icon: Network,
  },
  {
    step: '04',
    label: 'Orchestration',
    desc: 'Multi-step workflow sequencing with conditional logic and dependency graphs',
    icon: GitBranch,
  },
  {
    step: '05',
    label: 'Outputs',
    desc: 'Reports, API triggers, task assignments, and automated workflow executions',
    icon: FileText,
  },
  {
    step: '06',
    label: 'Governance',
    desc: 'Human checkpoints, approval gates, and full audit trail for every decision',
    icon: Shield,
  },
];

const outputs = [
  'Structured intelligence reports',
  'Automated task assignments',
  'Escalation routing with rationale',
  'Audit-ready decision logs',
  'API-triggered downstream actions',
  'Executive briefings and summaries',
];

const alloyNavLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Agents', href: '#agents' },
  { label: 'Governance', href: '#governance' },
  { label: 'Integrations', href: '#integrations' },
];

export default function AlloyMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080c14',
        color: '#e2e8f0',
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(75,139,219,0.08)',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #4B8BDB22, #4B8BDB44)',
                border: '1px solid #4B8BDB40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={14} style={{ color: '#4B8BDB' }} />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '-0.02em',
                color: '#e2e8f0',
              }}
            >
              Counsel
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#475569',
                marginLeft: '4px',
              }}
            >
              by SZL Holdings
            </span>
          </div>
          <div
            style={{ display: 'none', alignItems: 'center', gap: '28px' }}
            className="alloy-nav-links"
          >
            {alloyNavLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="/"
              style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#64748b';
              }}
            >
              SZL Holdings
            </a>
            <button
              onClick={onSignIn}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'rgba(75,139,219,0.1)',
                border: '1px solid rgba(75,139,219,0.3)',
                color: '#4B8BDB',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(75,139,219,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(75,139,219,0.1)';
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          paddingTop: '120px',
          paddingBottom: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(75,139,219,0.06) 0%, transparent 65%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 100%)',
          }}
        />
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '0 1.5rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.5rem',
              padding: '4px 12px 4px 8px',
              borderRadius: '4px',
              background: 'rgba(75,139,219,0.06)',
              border: '1px solid rgba(75,139,219,0.15)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#4B8BDB',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(75,139,219,0.6)',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#4B8BDB',
              }}
            >
              Orchestration Engine
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.75rem)',
              fontWeight: 700,
              letterSpacing: '-0.032em',
              lineHeight: 1.05,
              color: '#f1f5f9',
              marginBottom: '1.25rem',
            }}
          >
            The intelligence layer behind
            <br />
            premium command systems.
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.72,
              color: '#64748b',
              maxWidth: '36rem',
              margin: '0 auto 2.5rem',
            }}
          >
            Counsel is not a chatbot. It is the orchestration engine that acquires signals, applies
            reasoning, sequences workflows, and routes actions — across every SZL platform.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onSignIn}
              style={{
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                background: '#4B8BDB',
                color: '#080c14',
                border: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#00b8d9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#4B8BDB';
              }}
            >
              Sign in to Platform
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.10)',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
              }}
            >
              Request a Demo
              <ArrowRight size={13} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* What Counsel Is */}
      <section
        id="platform"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 0' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4rem',
              alignItems: 'start',
            }}
            className="alloy-grid"
          >
            <div>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#4B8BDB',
                  marginBottom: '0.75rem',
                }}
              >
                What Counsel Is
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.026em',
                  color: '#f1f5f9',
                  lineHeight: 1.08,
                  marginBottom: '1.25rem',
                }}
              >
                An orchestration engine, not an interface.
              </h2>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.72,
                  color: '#64748b',
                  marginBottom: '1rem',
                }}
              >
                Counsel operates as the intelligence backbone of SZL Holdings. It processes signals
                from across operational systems, applies reasoning to classify and contextualize
                them, and then sequences the right actions — without humans manually routing every
                decision.
              </p>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.72, color: '#64748b' }}>
                Every platform in the SZL ecosystem — KORA for decision intelligence, SEXTANT for
                maritime command, and Creative Workflows for governed campaign production — is
                powered by Counsel's orchestration layer. The platforms are the interface. Counsel is
                the engine.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  label: 'Signal Acquisition',
                  desc: 'Pulls from operational data sources, APIs, and event streams across every connected platform.',
                  rgb: '0,212,255',
                },
                {
                  label: 'Reasoning Layer',
                  desc: 'Applies domain-specific classification and consequence scoring to every signal.',
                  rgb: '0,212,255',
                },
                {
                  label: 'Workflow Orchestration',
                  desc: 'Sequences multi-step processes with conditional logic and automatic dependency resolution.',
                  rgb: '0,212,255',
                },
                {
                  label: 'Governance Gates',
                  desc: 'Intercepts high-stakes decisions with built-in human approval checkpoints.',
                  rgb: '0,212,255',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '6px',
                    background: `rgba(${item.rgb}, 0.04)`,
                    border: `1px solid rgba(${item.rgb}, 0.10)`,
                  }}
                >
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#4B8BDB',
                      flexShrink: 0,
                      marginTop: '5px',
                      boxShadow: '0 0 5px rgba(75,139,219,0.5)',
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#cbd5e1',
                        marginBottom: '2px',
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: '12px', lineHeight: 1.55, color: '#475569' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What It Powers */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '5rem 0',
          background: 'rgba(75,139,219,0.015)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '0.75rem',
            }}
          >
            What It Powers
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.026em',
              color: '#f1f5f9',
              lineHeight: 1.08,
              marginBottom: '0.75rem',
            }}
          >
            Two flagship platforms. One engine.
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.72,
              color: '#64748b',
              marginBottom: '2.5rem',
              maxWidth: '32rem',
            }}
          >
            Counsel underpins every intelligent operation within the SZL ecosystem.
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
            className="powers-grid"
          >
            {powers.map((p) => (
              <div
                key={p.name}
                style={{
                  padding: '1.75rem',
                  borderRadius: '6px',
                  background: `${p.accent}06`,
                  border: `1px solid ${p.accent}18`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${p.accent}10`;
                  el.style.borderColor = `${p.accent}35`;
                  el.style.boxShadow = `0 0 24px ${p.accent}12`;
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${p.accent}06`;
                  el.style.borderColor = `${p.accent}18`;
                  el.style.boxShadow = 'none';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: p.accent,
                    marginBottom: '0.75rem',
                  }}
                >
                  {p.name}
                </p>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: '#94a3b8' }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Pipeline */}
      <section
        id="pipeline"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 0' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '0.75rem',
            }}
          >
            How It Works
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.026em',
              color: '#f1f5f9',
              lineHeight: 1.08,
              marginBottom: '2.5rem',
            }}
          >
            Six-layer intelligence pipeline.
          </h2>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
            className="pipeline-grid"
          >
            {pipelineSteps.map((step, i) => (
              <div
                key={step.step}
                style={{
                  padding: '1.5rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: `2px solid rgba(75,139,219,${0.35 - i * 0.04})`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#4B8BDB',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {step.step}
                  </span>
                  <step.icon size={14} style={{ color: '#4B8BDB' }} />
                </div>
                <p
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '6px',
                  }}
                >
                  {step.label}
                </p>
                <p style={{ fontSize: '12px', lineHeight: 1.58, color: '#475569' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Roles */}
      <section
        id="agents"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '5rem 0',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '0.75rem',
            }}
          >
            Agent Roles
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.026em',
              color: '#f1f5f9',
              lineHeight: 1.08,
              marginBottom: '2.5rem',
            }}
          >
            Seven agents. One pipeline.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agentRoles.map((agent, i) => (
              <div
                key={agent.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.055)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(75,139,219,0.05)';
                  el.style.borderColor = 'rgba(75,139,219,0.18)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.02)';
                  el.style.borderColor = 'rgba(255,255,255,0.055)';
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#334155',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    minWidth: '20px',
                  }}
                >
                  0{i + 1}
                </span>
                <div
                  style={{
                    width: '3px',
                    height: '32px',
                    borderRadius: '2px',
                    background: agent.color,
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#cbd5e1',
                      marginBottom: '2px',
                    }}
                  >
                    {agent.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#475569' }}>{agent.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outputs */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4rem',
              alignItems: 'start',
            }}
            className="outputs-grid"
          >
            <div>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#475569',
                  marginBottom: '0.75rem',
                }}
              >
                Outputs
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.026em',
                  color: '#f1f5f9',
                  lineHeight: 1.08,
                  marginBottom: '1rem',
                }}
              >
                Structured decisions.
                <br />
                Not raw data.
              </h2>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.72, color: '#64748b' }}>
                Every Counsel workflow produces a clean, traceable output — structured enough to act
                on, explainable enough to audit, and precise enough to route automatically.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {outputs.map((output) => (
                <div
                  key={output}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    background: 'rgba(75,139,219,0.04)',
                    border: '1px solid rgba(75,139,219,0.08)',
                  }}
                >
                  <CheckCircle size={13} style={{ color: '#4B8BDB', flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{output}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Governance */}
      <section
        id="governance"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '5rem 0',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4rem',
              alignItems: 'center',
            }}
            className="gov-grid"
          >
            <div>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#475569',
                  marginBottom: '0.75rem',
                }}
              >
                Governance
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.026em',
                  color: '#f1f5f9',
                  lineHeight: 1.08,
                  marginBottom: '1rem',
                }}
              >
                Humans stay in the loop.
              </h2>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.72, color: '#64748b' }}>
                Counsel's governance layer is not a bolt-on. It's built into every workflow.
                High-consequence decisions pause for human review. Every approval is logged. Every
                action is attributable. The audit trail is immutable.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  label: 'Approval checkpoints',
                  desc: 'Configurable governance gates on any workflow step',
                },
                {
                  label: 'Rationale recording',
                  desc: 'Every decision includes the reasoning chain that produced it',
                },
                {
                  label: 'Immutable audit trail',
                  desc: 'Full history of actions, approvals, and overrides',
                },
                {
                  label: 'Role-based access',
                  desc: 'Approval rights scoped to the right person for each decision type',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Shield size={14} style={{ color: '#4B8BDB', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#cbd5e1',
                        marginBottom: '2px',
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: '12px', color: '#475569' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '2.5rem 0',
          background: 'rgba(75,139,219,0.02)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}
            className="alloy-stats-grid"
          >
            {[
              { value: '4.2M+', label: 'Signals processed / day' },
              { value: '1,800+', label: 'Workflows orchestrated' },
              { value: '47', label: 'Agent deployments' },
              { value: '99.97%', label: 'Workflow completion rate' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#4B8BDB',
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#475569',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Ecosystem */}
      <section
        id="integrations"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 0' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '0.75rem',
            }}
          >
            Integration Ecosystem
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.026em',
              color: '#f1f5f9',
              lineHeight: 1.08,
              marginBottom: '0.75rem',
            }}
          >
            Connect to anything.
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.72,
              color: '#64748b',
              marginBottom: '2.5rem',
              maxWidth: '32rem',
            }}
          >
            Counsel connects to the systems your business already runs on — acquiring signals from any
            source and routing outputs to any downstream target.
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
            className="integrations-grid"
          >
            {[
              {
                category: 'Data Sources',
                items: [
                  'REST APIs',
                  'Webhooks',
                  'Database connectors',
                  'Event streams',
                  'File ingestion',
                  'Custom adapters',
                ],
              },
              {
                category: 'Enterprise Systems',
                items: [
                  'CRM platforms',
                  'ERP systems',
                  'Task management',
                  'Identity providers',
                  'Cloud storage',
                  'BI / Analytics tools',
                ],
              },
              {
                category: 'Output Targets',
                items: [
                  'Email & notifications',
                  'Slack / Teams',
                  'API callbacks',
                  'Database writes',
                  'Audit log systems',
                  'Report generation',
                ],
              },
            ].map((group) => (
              <div
                key={group.category}
                style={{
                  padding: '1.5rem',
                  borderRadius: '6px',
                  background: 'rgba(75,139,219,0.025)',
                  border: '1px solid rgba(75,139,219,0.08)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#4B8BDB',
                    marginBottom: '1rem',
                  }}
                >
                  {group.category}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {group.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle
                        size={11}
                        style={{ color: '#4B8BDB', opacity: 0.6, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 0' }}>
        <div
          style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.022em',
              color: '#f1f5f9',
              marginBottom: '1rem',
            }}
          >
            Access the platform
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.65,
              color: '#64748b',
              marginBottom: '2rem',
            }}
          >
            Counsel is available to authenticated SZL Holdings operators. Sign in to access the
            platform, or request a demonstration.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                background: '#4B8BDB',
                color: '#080c14',
                border: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#00b8d9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#4B8BDB';
              }}
            >
              Sign in to Counsel
              <ArrowRight size={14} />
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.10)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
              }}
            >
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '3rem',
              marginBottom: '2.5rem',
            }}
            className="alloy-footer-grid"
          >
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    background: 'rgba(75,139,219,0.12)',
                    border: '1px solid rgba(75,139,219,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={12} style={{ color: '#4B8BDB' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#e2e8f0' }}>Counsel</span>
              </div>
              <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65 }}>
                Intelligence orchestration engine by SZL Holdings. Signal acquisition, reasoning,
                and workflow automation across the entire ecosystem.
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#334155',
                  marginBottom: '1rem',
                }}
              >
                Platform
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Execution Runs',
                  'Workflow Orchestration',
                  'Connector Mesh',
                  'Governance Audit',
                ].map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#64748b';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#334155';
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#334155',
                  marginBottom: '1rem',
                }}
              >
                Company
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['About', 'Security', 'Compliance', 'Contact'].map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#64748b';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#334155';
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#334155',
                  marginBottom: '1rem',
                }}
              >
                Ecosystem
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['SZL Holdings', 'DOMAINE', 'KORA', 'SEXTANT', 'PARAGON'].map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#64748b';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#334155';
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <p style={{ fontSize: '11px', color: '#1e293b', fontFamily: 'monospace' }}>
              © {new Date().getFullYear()} SZL Holdings. All rights reserved.
            </p>
            <p style={{ fontSize: '11px', color: '#1e293b', fontFamily: 'monospace' }}>
              inquiries@szlholdings.com
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .alloy-nav-links { display: flex !important; }
        }
        @media (max-width: 768px) {
          .alloy-grid, .powers-grid, .outputs-grid, .gov-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .pipeline-grid { grid-template-columns: 1fr 1fr !important; }
          .alloy-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .integrations-grid { grid-template-columns: 1fr !important; }
          .alloy-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 480px) {
          .pipeline-grid { grid-template-columns: 1fr !important; }
          .alloy-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .alloy-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
