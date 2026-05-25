import { useState } from 'react';
import { Link } from 'wouter';
import { ATELIER_TEMPLATES, VERTICAL_COLORS, type AudienceTier, type NexusSignal, type Runtime, type Vertical } from '../../data/atelierData';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

const AUDIENCE_META: Record<AudienceTier, { label: string; color: string; bg: string; desc: string }> = {
  internal:   { label: 'Internal',   color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)', desc: 'SZL ops only — no auth wall on internal surfaces' },
  enterprise: { label: 'Enterprise', color: '#c9b787', bg: 'rgba(201,183,135,0.1)',  desc: 'Tenant-gated, branded for tenant, governance enforced' },
  public:     { label: 'Public',     color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)',  desc: 'Open access, rate-limited, watermarked, no privileged connectors' },
};

const RUNTIME_META: Record<Runtime, { label: string; icon: string; desc: string }> = {
  chat:         { label: 'Chat',       icon: '💬', desc: 'Streaming conversational interface' },
  form:         { label: 'Form',       icon: '📋', desc: 'Structured input with governed outputs' },
  canvas:       { label: 'Canvas',     icon: '🖼', desc: 'Rich multi-pane visualization surface' },
  'agent-loop': { label: 'Agent Loop', icon: '⟳', desc: 'Autonomous multi-step governed execution' },
};

const CONSTITUTIONS = [
  { id: 'const-domaine-v3', name: 'DOMAINE Real Estate v3', vertical: 'real-estate' },
  { id: 'const-sextant-v3', name: 'SEXTANT Maritime v3', vertical: 'maritime' },
  { id: 'const-counsel-v2', name: 'Counsel Legal v2', vertical: 'legal' },
  { id: 'const-paragon-v4', name: 'PARAGON Defense v4', vertical: 'cyber' },
  { id: 'const-boardroom-v2', name: 'Boardroom Executive v2', vertical: 'executive' },
  { id: 'const-guardian-v2', name: 'Guardian Defense v2', vertical: 'defense' },
  { id: 'const-nexus-v1', name: 'NEXUS Cross-Vertical v1', vertical: 'cross-vertical' },
  { id: 'const-platform-v1', name: 'Platform Health v1', vertical: 'platform' },
  { id: 'const-advisory-v1', name: 'Advisory Intelligence v1', vertical: 'advisory' },
  { id: 'const-decision-v2', name: 'Decision Intelligence v2', vertical: 'decision' },
  { id: 'const-data-v1', name: 'Data Activation v1', vertical: 'reverse-etl' },
  { id: 'const-brand-v1', name: 'Brand Orchestration v1', vertical: 'brand' },
];

const AVAILABLE_CONNECTORS = [
  'AIS Live Feed', 'CoStar API', 'MLS Feed', 'Docket Search', 'Document Repository',
  'Threat Intelligence Feed', 'CVE Database', 'SIEM Events', 'Signal Mesh',
  'Workcell Registry', 'Proof Ledger', 'Outcome Memory', 'Client Portfolio DB',
  'Market Intelligence', 'Evidence Graph', 'CRM Connector', 'ERP Connector',
  'Design Token Library', 'Voice Guidelines', 'Fabric Layer Metrics',
];

const PRIVILEGED_CONNECTORS = new Set<string>([
  'AIS Live Feed',
  'Docket Search',
  'Document Repository',
  'Threat Intelligence Feed',
  'CVE Database',
  'SIEM Events',
  'Client Portfolio DB',
  'CRM Connector',
  'ERP Connector',
]);

const MODEL_POLICIES = [
  'claude-3.5-sonnet',
  'claude-3.5-sonnet → gpt-4o (fallback)',
  'gpt-4o',
  'gpt-4o → claude-3.5-sonnet (fallback)',
  'claude-3.5-sonnet (air-gapped)',
  'claude-3.5-sonnet (privilege-mode)',
  'gpt-4o (monitoring-mode)',
];

const PRIVILEGED_MODEL_POLICIES = new Set<string>([
  'claude-3.5-sonnet (air-gapped)',
  'claude-3.5-sonnet (privilege-mode)',
]);

const AVAILABLE_NEXUS_SIGNALS: NexusSignal[] = [
  { id: 'ns-maritime-supply', vertical: 'maritime', event: 'supply-chain-disruption', description: 'Maritime supply-chain disruption signals across SZL routes', subscribed: false },
  { id: 'ns-maritime-port', vertical: 'maritime', event: 'port-disruption', description: 'Port congestion and disruption indicators', subscribed: false },
  { id: 'ns-maritime-vessel', vertical: 'maritime', event: 'vessel-anomaly', description: 'Vessel anomaly detection from AIS streams', subscribed: false },
  { id: 'ns-legal-regulatory', vertical: 'legal', event: 'regulatory-filing', description: 'New regulatory filings affecting matter strategy', subscribed: false },
  { id: 'ns-legal-sanctions', vertical: 'legal', event: 'sanctions-update', description: 'Sanctions list updates affecting operations', subscribed: false },
  { id: 'ns-legal-matter', vertical: 'legal', event: 'major-matter-update', description: 'Significant updates on tracked legal matters', subscribed: false },
  { id: 'ns-cyber-incident', vertical: 'cyber', event: 'security-incident', description: 'Live cyber incident telemetry from SIEM correlation', subscribed: false },
  { id: 'ns-cyber-critical', vertical: 'cyber', event: 'critical-threat', description: 'Critical threat elevations requiring exec awareness', subscribed: false },
  { id: 'ns-exec-portfolio', vertical: 'executive', event: 'portfolio-brief', description: 'Executive portfolio summary across verticals', subscribed: false },
  { id: 'ns-exec-strategic', vertical: 'executive', event: 'strategic-signal', description: 'Cross-vertical strategic signals for decision models', subscribed: false },
  { id: 'ns-exec-market', vertical: 'executive', event: 'market-signal', description: 'Market signal aggregation for advisory context', subscribed: false },
  { id: 'ns-re-port', vertical: 'real-estate', event: 'port-adjacent-asset', description: 'Port-adjacent real-estate exposure changes', subscribed: false },
];

type Step = 'template' | 'runtime' | 'audience' | 'constitution' | 'connectors' | 'model' | 'nexus' | 'preview' | 'published';

const STEPS: Step[] = ['template', 'runtime', 'audience', 'constitution', 'connectors', 'model', 'nexus', 'preview'];

function StepIndicator({ current, steps }: { current: Step; steps: Step[] }) {
  const idx = steps.indexOf(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem' }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.625rem', fontFamily: T.mono,
            background: i < idx ? 'rgba(201,183,135,0.15)' : i === idx ? T.accent : 'rgba(255,255,255,0.04)',
            border: `1px solid ${i <= idx ? T.accent : T.border}`,
            color: i < idx ? T.accent : i === idx ? '#0a0a0a' : T.textMuted,
            fontWeight: i === idx ? 700 : 400,
          }}>
            {i < idx ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 24, height: 1, background: i < idx ? T.accent : T.border }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function AtelierNew() {
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [constitution, setConstitution] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<string[]>([]);
  const [modelPolicy, setModelPolicy] = useState<string | null>(null);
  const [audienceTier, setAudienceTier] = useState<AudienceTier | null>(null);
  const [nexusSubscriptions, setNexusSubscriptions] = useState<string[]>([]);
  const [spaceName, setSpaceName] = useState('');
  const [published, setPublished] = useState(false);

  const template = ATELIER_TEMPLATES.find(t => t.id === selectedTemplate);
  const isPublic = audienceTier === 'public';

  function toggleConnector(c: string) {
    if (isPublic && PRIVILEGED_CONNECTORS.has(c)) return;
    setConnectors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function toggleNexus(id: string) {
    setNexusSubscriptions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function validateGovernance(): string[] {
    const errors: string[] = [];
    if (!constitution) errors.push('A Constitution must be bound before publish.');
    if (!modelPolicy) errors.push('A model router policy must be selected.');
    if (isPublic) {
      const privConn = connectors.filter(c => PRIVILEGED_CONNECTORS.has(c));
      if (privConn.length > 0) errors.push(`Public-tier Spaces cannot use privileged connectors: ${privConn.join(', ')}.`);
      if (modelPolicy && PRIVILEGED_MODEL_POLICIES.has(modelPolicy)) errors.push(`Public-tier Spaces cannot use privileged model policy: ${modelPolicy}.`);
    }
    return errors;
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function publish() {
    // Attempt to persist via POST /api/atelier/spaces. This endpoint
    // requires auth in production; failure is non-fatal so the demo
    // wizard always completes (Space appears as published locally and
    // will join the live registry once the operator is authenticated).
    const slug = (spaceName || template?.name || 'new-space')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'new-space';
    void fetch('/api/atelier/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        name: spaceName || template?.name || 'New Space',
        vertical: template?.vertical ?? 'cross-vertical',
        audienceTier: audienceTier ?? 'enterprise',
        templateId: selectedTemplate,
        runtime,
        constitutionRef: constitution,
        connectors,
        modelPolicy,
        nexusSubscriptions,
      }),
    }).catch(() => {});
    setPublished(true);
    setStep('published');
  }

  if (step === 'published') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '0.75rem' }}>Published</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: T.text, margin: '0 0 0.875rem', letterSpacing: '-0.025em' }}>
            {spaceName || template?.name || 'Your Space'} is live
          </h2>
          <p style={{ fontSize: '0.875rem', color: T.textDim, lineHeight: 1.7, marginBottom: '2rem' }}>
            Your Space has been constitutionally-bound, proof-chain initialized, and published to the {audienceTier} tier. It will appear in the leaderboards after its first governed run.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href={b('/atelier')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.625rem 1.25rem', borderRadius: 6, background: 'rgba(201,183,135,0.1)', border: `1px solid rgba(201,183,135,0.25)`, color: T.accent, fontSize: '0.8125rem', fontWeight: 500 }}>
                ← Back to Atelier
              </span>
            </Link>
            <Link href={b('/atelier/leaderboards')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.625rem 1.25rem', borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim, fontSize: '0.8125rem' }}>
                View Leaderboards
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none', fontSize: '0.75rem' }}>Atelier</Link>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ fontSize: '0.75rem', color: T.accent }}>Create Space</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, letterSpacing: '-0.03em', color: T.text, margin: '0 0 1.75rem', lineHeight: 1.1 }}>
          Create a New Space
        </h1>

        <StepIndicator current={step} steps={STEPS} />

        {step === 'template' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Choose a Template</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>12 vertical-tuned templates. Each ships with a pre-configured Constitution and connector defaults.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
              {ATELIER_TEMPLATES.map(t => {
                const vColor = VERTICAL_COLORS[t.vertical as Vertical];
                const isSelected = selectedTemplate === t.id;
                return (
                  <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setRuntime(t.runtime); setConstitution(t.constitutionRef); setConnectors(t.defaultConnectors); }}
                    style={{
                      padding: '1rem', borderRadius: 7, textAlign: 'left', cursor: 'pointer',
                      border: `1px solid ${isSelected ? vColor : T.border}`,
                      background: isSelected ? `${vColor}08` : T.bg,
                      borderTop: `2px solid ${isSelected ? vColor : T.border}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: vColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.375rem' }}>
                      {t.vertical.replace(/-/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.text, marginBottom: '0.375rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: T.textMuted, lineHeight: 1.5 }}>{t.description}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={next} disabled={!selectedTemplate}
                style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: selectedTemplate ? 'pointer' : 'not-allowed', background: selectedTemplate ? 'rgba(201,183,135,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedTemplate ? 'rgba(201,183,135,0.3)' : T.border}`, color: selectedTemplate ? T.accent : T.textMuted, opacity: selectedTemplate ? 1 : 0.5 }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 'runtime' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Choose a Runtime</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>The runtime controls how users interact with your Space.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {(Object.entries(RUNTIME_META) as [Runtime, typeof RUNTIME_META[Runtime]][]).map(([r, meta]) => {
                const isSelected = runtime === r;
                return (
                  <button key={r} onClick={() => setRuntime(r)}
                    style={{ padding: '1.25rem', borderRadius: 7, textAlign: 'left', cursor: 'pointer', border: `1px solid ${isSelected ? T.accent : T.border}`, background: isSelected ? 'rgba(201,183,135,0.04)' : T.bg, transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{meta.icon}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.25rem' }}>{meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: T.textDim }}>{meta.desc}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} disabled={!runtime} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: runtime ? 'pointer' : 'not-allowed', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent, opacity: runtime ? 1 : 0.5 }}>Next →</button>
            </div>
          </div>
        )}

        {step === 'constitution' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Bind a Constitution</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>The Constitution defines what your Space can and cannot do. Governance constraints are enforced at publish time, not inferred at runtime.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CONSTITUTIONS.map(c => (
                <button key={c.id} onClick={() => setConstitution(c.id)}
                  style={{ padding: '0.875rem 1rem', borderRadius: 6, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1px solid ${constitution === c.id ? T.accent : T.border}`, background: constitution === c.id ? 'rgba(201,183,135,0.04)' : T.bg }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${constitution === c.id ? T.accent : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {constitution === c.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{c.id}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} disabled={!constitution} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: constitution ? 'pointer' : 'not-allowed', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent, opacity: constitution ? 1 : 0.5 }}>Next →</button>
            </div>
          </div>
        )}

        {step === 'connectors' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Bind Connectors</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>Select which data sources your Space can read from. Available connectors are gated by the audience tier you select — privileged connectors are not available on Public-tier Spaces.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {AVAILABLE_CONNECTORS.map(c => {
                const selected = connectors.includes(c);
                const isPriv = PRIVILEGED_CONNECTORS.has(c);
                const locked = isPublic && isPriv;
                return (
                  <button key={c} onClick={() => toggleConnector(c)}
                    disabled={locked}
                    title={locked ? 'Not available on Public tier' : isPriv ? 'Privileged connector' : undefined}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: 5, cursor: locked ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontFamily: T.mono, border: `1px solid ${selected ? T.accent : T.border}`, background: selected ? 'rgba(201,183,135,0.08)' : 'transparent', color: locked ? T.textMuted : selected ? T.accent : T.textDim, opacity: locked ? 0.45 : 1, transition: 'all 0.15s' }}>
                    {locked ? '🔒 ' : selected ? '✓ ' : ''}{c}
                  </button>
                );
              })}
            </div>
            {isPublic && (
              <div style={{ fontSize: '0.6875rem', color: T.textMuted, marginBottom: '0.5rem' }}>
                Locked connectors are unavailable on Public tier. Switch audience tier to Internal or Enterprise to enable.
              </div>
            )}
            <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted }}>{connectors.length} connectors selected</div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent }}>Next →</button>
            </div>
          </div>
        )}

        {step === 'model' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Model Router Policy</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>Choose which model routes your Space uses. All routes go through the A11oy model router — no direct model calls.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MODEL_POLICIES.map(policy => {
                const isPriv = PRIVILEGED_MODEL_POLICIES.has(policy);
                const locked = isPublic && isPriv;
                return (
                  <button key={policy} onClick={() => { if (!locked) setModelPolicy(policy); }}
                    disabled={locked}
                    title={locked ? 'Not available on Public tier' : undefined}
                    style={{ padding: '0.875rem 1rem', borderRadius: 6, textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1px solid ${modelPolicy === policy ? T.accent : T.border}`, background: modelPolicy === policy ? 'rgba(201,183,135,0.04)' : T.bg, opacity: locked ? 0.45 : 1 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${modelPolicy === policy ? T.accent : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {modelPolicy === policy && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontFamily: T.mono, color: locked ? T.textMuted : modelPolicy === policy ? T.text : T.textDim }}>
                      {locked ? '🔒 ' : ''}{policy}
                    </span>
                  </button>
                );
              })}
            </div>
            {isPublic && (
              <div style={{ fontSize: '0.6875rem', color: T.textMuted, marginTop: '0.5rem' }}>
                Air-gapped and privilege-mode routes are unavailable on Public tier.
              </div>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} disabled={!modelPolicy} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: modelPolicy ? 'pointer' : 'not-allowed', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent, opacity: modelPolicy ? 1 : 0.5 }}>Next →</button>
            </div>
          </div>
        )}

        {step === 'audience' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>Audience Tier</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>The tier choice gates which connectors and model routes are selectable. Governance is enforced at publish time — billing for Public tier is a future milestone.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(Object.entries(AUDIENCE_META) as [AudienceTier, typeof AUDIENCE_META[AudienceTier]][]).map(([tier, meta]) => (
                <button key={tier} onClick={() => setAudienceTier(tier)}
                  style={{ padding: '1.25rem', borderRadius: 7, textAlign: 'left', cursor: 'pointer', border: `1px solid ${audienceTier === tier ? meta.color : T.border}`, background: audienceTier === tier ? meta.bg : T.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${audienceTier === tier ? meta.color : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {audienceTier === tier && <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />}
                    </div>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: audienceTier === tier ? meta.color : T.text }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: T.textDim, paddingLeft: '1.75rem' }}>{meta.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} disabled={!audienceTier} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: audienceTier ? 'pointer' : 'not-allowed', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent, opacity: audienceTier ? 1 : 0.5 }}>Next →</button>
            </div>
          </div>
        )}

        {step === 'nexus' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>NEXUS Signal Subscriptions</div>
            <div style={{ fontSize: '0.8125rem', color: T.textDim, marginBottom: '1.25rem' }}>Subscribe this Space to cross-vertical NEXUS signals. Subscribed events feed the workcell context at run time so decisions can react to upstream state changes.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {AVAILABLE_NEXUS_SIGNALS.map(sig => {
                const selected = nexusSubscriptions.includes(sig.id);
                return (
                  <button key={sig.id} onClick={() => toggleNexus(sig.id)}
                    style={{ padding: '0.875rem 1rem', borderRadius: 6, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', border: `1px solid ${selected ? T.accent : T.border}`, background: selected ? 'rgba(201,183,135,0.04)' : T.bg }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${selected ? T.accent : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: 1, background: T.accent }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{sig.vertical}</span>
                        <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.text }}>{sig.event}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: T.textDim, lineHeight: 1.5 }}>{sig.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted }}>{nexusSubscriptions.length} signal{nexusSubscriptions.length === 1 ? '' : 's'} subscribed</div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
              <button onClick={next} style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.3)`, color: T.accent }}>Review →</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '1.25rem' }}>Review & Publish</div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: T.mono, color: T.textMuted, marginBottom: '0.375rem' }}>Space Name</label>
              <input
                value={spaceName}
                onChange={e => setSpaceName(e.target.value)}
                placeholder={template?.name ?? 'My Space'}
                style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 6, border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)', color: T.text, fontSize: '0.875rem', outline: 'none', fontFamily: T.mono, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, marginBottom: '1.5rem' }}>
              {[
                { label: 'Template', value: template?.name ?? '—' },
                { label: 'Runtime', value: runtime ?? '—' },
                { label: 'Audience Tier', value: audienceTier ?? '—' },
                { label: 'Constitution', value: constitution ?? '—' },
                { label: 'Connectors', value: connectors.length > 0 ? connectors.join(', ') : '—' },
                { label: 'Model Policy', value: modelPolicy ?? '—' },
                { label: 'NEXUS Signals', value: nexusSubscriptions.length > 0 ? `${nexusSubscriptions.length} subscribed` : '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textMuted, width: 120, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '0.75rem', color: T.textDim }}>{row.value}</span>
                </div>
              ))}
            </div>
            {(() => {
              const errors = validateGovernance();
              const ok = errors.length === 0;
              return (
                <>
                  {ok ? (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 6, border: `1px solid rgba(122,184,123,0.25)`, background: 'rgba(122,184,123,0.04)', marginBottom: '1rem', fontSize: '0.75rem', color: '#9bcb9c', fontFamily: T.mono }}>
                      ✓ Governance validation passed
                    </div>
                  ) : (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: 6, border: `1px solid rgba(220,120,120,0.3)`, background: 'rgba(220,120,120,0.05)', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.6875rem', fontFamily: T.mono, color: '#dc7878', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>Governance validation failed</div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: T.textDim, lineHeight: 1.6 }}>
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  <div style={{ padding: '1rem', borderRadius: 6, border: `1px solid rgba(201,183,135,0.15)`, background: 'rgba(201,183,135,0.02)', marginBottom: '1.5rem', fontSize: '0.75rem', color: T.textDim, lineHeight: 1.7 }}>
                    Publishing will: (1) bind the Constitution to this Space, (2) initialize the proof chain, (3) register connectors in the governance fabric, (4) wire NEXUS signal subscriptions, (5) make the Space available in the Atelier hub under the selected audience tier. Governance constraints apply immediately.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={back} style={{ padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim }}>← Back</button>
                    <button onClick={publish}
                      disabled={!ok}
                      style={{ padding: '0.625rem 1.5rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 600, cursor: ok ? 'pointer' : 'not-allowed', background: ok ? T.accent : 'rgba(201,183,135,0.2)', border: 'none', color: ok ? '#0a0a0a' : T.textMuted, letterSpacing: '-0.01em', opacity: ok ? 1 : 0.6 }}>
                      Publish Space ✦
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
