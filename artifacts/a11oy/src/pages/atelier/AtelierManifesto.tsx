import { Link } from 'wouter';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

const COMPETITORS = [
  {
    name: 'Hugging Face Spaces',
    url: 'https://github.com/huggingface/huggingface_hub',
    what: 'Gradio/Streamlit demos hosted in Docker containers; ZeroGPU burst inference; community ranking by likes and downloads; model cards; dataset cards',
    atelier_copies: 'Browse-and-discover hub; card-based gallery; community forking; public embeds',
    atelier_ignores: 'Community-first ranking; popularity voting; GPU burst for generic ML demos',
    atelier_leapfrogs: 'Every Space is constitutionally-bound — no Space can take actions outside its governance envelope. Ranking is by proof score and audit completeness, not likes. Cross-domain signal subscriptions are native.',
  },
  {
    name: 'Replicate',
    url: 'https://github.com/replicate/cog',
    what: 'Versioned model hosting with Cog packaging; prediction API; webhook callbacks; cold-start GPU scheduling; fine-tuning workflows',
    atelier_copies: 'Versioned Space artifacts; prediction-style run API; webhook-compatible output events',
    atelier_ignores: 'Generic GPU model serving; Cog container packaging; fine-tuning pipelines',
    atelier_leapfrogs: 'Spaces are governed agents with proof chains, not stateless model endpoints. Every prediction is policy-checked and proof-chained. Human approval gates are native.',
  },
  {
    name: 'Modal',
    url: 'https://github.com/modal-labs/modal-client',
    what: 'Serverless GPU with decorator-based deployment; ephemeral sandboxes; scheduled functions; distributed parallel execution',
    atelier_copies: 'Ephemeral sandbox execution; scheduled runs; parallel agent-loop steps',
    atelier_ignores: 'Raw GPU compute abstraction; Python decorator deployment model; cost-per-second GPU billing',
    atelier_leapfrogs: 'Execution is governance-first: every sandbox is constitutionally-scoped. MirrorEval scoring is automatic. No ephemeral run bypasses the proof chain.',
  },
  {
    name: 'Vercel v0',
    url: 'https://github.com/vercel/ai',
    what: 'Generative UI with AI SDK streaming; RSC-native streaming components; useChat/useCompletion hooks; tool-call orchestration',
    atelier_copies: 'Streaming runtime output; multi-step agent loop display; real-time run status',
    atelier_ignores: 'React Server Components generative UI; Next.js-native primitives; frontend-first streaming UX',
    atelier_leapfrogs: 'Atelier Spaces are enterprise-grade governed agents with full audit trails — not generative UI components. Every tool call is policy-checked. Outputs are proof-chained.',
  },
  {
    name: 'Poe (Quora)',
    url: 'https://poe.com',
    what: 'Bot marketplace; creator monetization; multi-bot chat; knowledge files; subscription-gated premium bots',
    atelier_copies: 'Public Space discovery; creator-authored Spaces; multi-audience tiers',
    atelier_ignores: 'Consumer-first social graph; creator revenue share; generic chatbot hosting',
    atelier_leapfrogs: 'Spaces are constitutionally-bound enterprise agents with proof chains. No Space can take privileged actions without tenant + human approval. Governance is sovereign — not an afterthought.',
  },
  {
    name: 'OpenAI GPTs / GPT Store',
    url: 'https://openai.com/blog/introducing-gpts',
    what: 'Custom GPT builder with Actions (OpenAPI schema); knowledge files; image generation; GPT Store discovery; monetization for creators',
    atelier_copies: 'Guided authoring flow; connector/action binding; marketplace discovery; audience tiers',
    atelier_ignores: 'Single-model dependency; ChatGPT-native embedding; OpenAPI Actions as primary connector model',
    atelier_leapfrogs: 'Atelier Spaces are model-agnostic (Anthropic, OpenAI, Gemini, Groq, DeepSeek) and run through a governed model router. Constitution DSL is more expressive than GPT system prompts. Proof chains persist across runs.',
  },
  {
    name: 'Dify / Flowise',
    url: 'https://github.com/langgenius/dify',
    what: 'Visual drag-and-drop agent builder; LLM orchestration; RAG pipelines; API publish; team workspaces; self-hosted option',
    atelier_copies: 'Visual authoring flow; connector binding; RAG integration; API publish target',
    atelier_ignores: 'Drag-and-drop node graph as primary UX; self-hosted open-source-first model',
    atelier_leapfrogs: 'Governance is constitutionally enforced, not configured per-node. Every Space has a proof chain, MirrorEval scoring, and a human-approval gate hierarchy baked in — not bolt-ons.',
  },
  {
    name: 'AWS Bedrock Agents',
    url: 'https://aws.amazon.com/bedrock/agents/',
    what: 'Fully managed agent orchestration on AWS; action groups (Lambda); knowledge bases (OpenSearch); guardrails; session management; multi-agent collaboration',
    atelier_copies: 'Action group concept; knowledge base integration; multi-agent coordination; guardrails layer',
    atelier_ignores: 'AWS infrastructure lock-in; Lambda-only action execution; CloudWatch-native observability',
    atelier_leapfrogs: 'Atelier Spaces are portable across infrastructure. Constitution DSL is human-readable and auditable. Proof chains are cryptographic and externally verifiable — not AWS-internal audit logs. Cross-vertical NEXUS signals are native.',
  },
];

const CAPABILITY_AXES = [
  'Governance enforcement',
  'Cryptographic proof chain',
  'Cross-domain signal subscription',
  'Embed-anywhere (cross-origin)',
  'Vertical-tuned templates',
  'Audience tier gating',
  'Governance leaderboards',
  'Human approval hierarchy',
  'Model-agnostic routing',
  'Constitution DSL',
];

const COMPETITOR_SCORES: Record<string, (string | null)[]> = {
  'Hugging Face Spaces': [null, null, null, 'Partial', null, null, null, null, 'Partial', null],
  'Replicate':           [null, null, null, 'Partial', null, null, null, null, 'Partial', null],
  'Modal':               [null, null, null, null, null, null, null, null, 'Partial', null],
  'Vercel v0':           [null, null, null, 'Partial', null, null, null, null, null, null],
  'Poe':                 [null, null, null, null, null, 'Partial', null, null, null, null],
  'OpenAI GPTs':         ['Partial', null, null, null, null, 'Partial', null, 'Partial', null, 'Partial'],
  'Dify / Flowise':      ['Partial', null, null, null, null, null, null, 'Partial', null, 'Partial'],
  'Bedrock Agents':      ['Partial', null, null, null, null, null, null, 'Partial', null, null],
};

export function AtelierManifesto() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none', fontSize: '0.75rem' }}>Atelier</Link>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ fontSize: '0.75rem', color: T.accent }}>Manifesto</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '3rem 0' }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.accent, marginBottom: '1.25rem' }}>
            One of One
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, letterSpacing: '-0.04em', color: T.text, lineHeight: 1.05, margin: '0 0 1.5rem' }}>
            Not a Spaces clone.<br />The governance layer<br />that makes Spaces sovereign.
          </h1>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.75, color: T.textDim, maxWidth: '52ch', margin: '0 auto 2rem' }}>
            Atelier takes the best of Hugging Face Spaces, Replicate, Modal, Vercel v0, Poe, OpenAI GPTs, Dify, and Bedrock Agents — then collapses them into one layer that none of them can match: every Space is a constitutionally-bound, proof-chained, cross-domain-aware agent that can be embedded into any A11oy-powered surface with tenant context already wired in.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={b('/atelier')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.75rem 1.75rem', borderRadius: 6, background: T.accent, color: '#0a0a0a', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                Browse Spaces
              </span>
            </Link>
            <Link href={b('/atelier/new')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.75rem 1.75rem', borderRadius: 6, border: `1px solid ${T.border}`, color: T.textDim, fontSize: '0.875rem' }}>
                Create a Space
              </span>
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '1.5rem', textAlign: 'center' }}>
            Capability Matrix
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontFamily: T.mono, fontSize: '0.5625rem', color: T.textMuted, fontWeight: 500, borderBottom: `1px solid ${T.border}`, minWidth: 160 }}>Capability</th>
                  {Object.keys(COMPETITOR_SCORES).map(comp => (
                    <th key={comp} style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontFamily: T.mono, fontSize: '0.5rem', color: T.textMuted, fontWeight: 500, borderBottom: `1px solid ${T.border}`, minWidth: 80 }}>
                      {comp.replace(' / ', '/')}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontFamily: T.mono, fontSize: '0.5rem', color: T.accent, fontWeight: 700, borderBottom: `2px solid ${T.accent}`, minWidth: 80, background: 'rgba(201,183,135,0.04)' }}>
                    Atelier
                  </th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_AXES.map((axis, i) => (
                  <tr key={axis} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.625rem 1rem', color: T.text, fontSize: '0.75rem' }}>{axis}</td>
                    {Object.values(COMPETITOR_SCORES).map((scores, ci) => (
                      <td key={ci} style={{ textAlign: 'center', padding: '0.625rem 0.5rem' }}>
                        <span style={{
                          fontSize: '0.625rem',
                          color: scores[i] === null ? T.textMuted : '#8a8a8a',
                        }}>
                          {scores[i] === null ? '—' : scores[i]}
                        </span>
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', padding: '0.625rem 0.5rem', background: 'rgba(201,183,135,0.04)' }}>
                      <span style={{ color: T.accent, fontSize: '0.875rem', fontWeight: 700 }}>✦</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '2rem', textAlign: 'center' }}>
            Competitive Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {COMPETITORS.map(comp => (
              <div key={comp.name} style={{ padding: '1.75rem', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: T.text, margin: '0 0 0.25rem', letterSpacing: '-0.01em' }}>{comp.name}</h3>
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted, textDecoration: 'none' }}>
                      {comp.url.replace('https://', '')}
                    </a>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>What it does</div>
                    <div style={{ fontSize: '0.75rem', color: T.textDim, lineHeight: 1.6 }}>{comp.what}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>Atelier borrows</div>
                    <div style={{ fontSize: '0.75rem', color: T.textDim, lineHeight: 1.6 }}>{comp.atelier_copies}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>Atelier ignores</div>
                    <div style={{ fontSize: '0.75rem', color: T.textMuted, lineHeight: 1.6 }}>{comp.atelier_ignores}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>Atelier leapfrogs</div>
                    <div style={{ fontSize: '0.75rem', color: T.textDim, lineHeight: 1.6 }}>{comp.atelier_leapfrogs}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '4rem', padding: '2rem', border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '1rem', textAlign: 'center' }}>
            The Proofs — Not Marketing Copy
          </div>
          <p style={{ fontSize: '0.875rem', color: T.textDim, lineHeight: 1.65, textAlign: 'center', maxWidth: '56ch', margin: '0 auto 1.5rem' }}>
            Every claim above is backed by a verifiable, publicly addressable proof packet. No screenshots. No demos. Click any claim to inspect its constitution, MirrorEval dimensions, and signed proof reference.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
            {[
              { claim: 'Constitutionally bound', target: 'pp-run-seed-re-underwriting-5' },
              { claim: 'Cryptographic proof chain', target: 'pp-run-seed-maritime-routing-1' },
              { claim: 'Cross-Space composition', target: 'pp-run-seed-cross-vertical-executive-brief-7' },
              { claim: 'Forked with inheritance', target: 'pp-run-seed-re-underwriting-distressed-6' },
              { claim: 'Cyber triage under governance', target: 'pp-run-seed-cyber-triage-3' },
              { claim: 'Platform-health self-monitor', target: 'pp-run-seed-platform-health-5' },
            ].map((c) => (
              <Link key={c.target} href={b(`/atelier/proof/${c.target}`)} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '0.75rem 0.875rem', border: `1px solid ${T.border}`, borderRadius: 6,
                  background: 'rgba(255,255,255,0.015)', cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                  <div style={{ fontSize: '0.75rem', color: T.text, marginBottom: '0.375rem', fontWeight: 500 }}>{c.claim}</div>
                  <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent }}>↗ proof/{c.target}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '4rem 0 2rem' }}>
          <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '1.25rem' }}>
            The Proof Speaks
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.03em', color: T.text, margin: '0 0 1rem' }}>
            Every Space earns its rank.
          </h2>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, lineHeight: 1.7, maxWidth: '48ch', margin: '0 auto 2rem' }}>
            Governance score, not stars. Audit completeness, not downloads. Proof chain, not upvotes. This is the one surface where AI agents are ranked by how well they behave — not how popular they are.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={b('/atelier/leaderboards')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.75rem 1.75rem', borderRadius: 6, background: T.accent, color: '#0a0a0a', fontSize: '0.875rem', fontWeight: 600 }}>
                View Leaderboards →
              </span>
            </Link>
            <Link href={b('/atelier')} style={{ textDecoration: 'none' }}>
              <span style={{ padding: '0.75rem 1.75rem', borderRadius: 6, border: `1px solid ${T.border}`, color: T.textDim, fontSize: '0.875rem' }}>
                Browse Spaces
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
