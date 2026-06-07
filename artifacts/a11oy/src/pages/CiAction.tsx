import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)', text: '#f5f5f5', dim: '#8a8a8a',
  muted: '#5e5e5e', accent: '#c9b787',
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => (p === '/' ? BASE + '/' : BASE + p);

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, margin: '0 0 1.5rem' }}>{children}</p>;
}

function CodeBlock({ title, children }: { title: string; children: string }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', backgroundColor: T.surface }}>
      <div style={{ padding: '0.65rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: T.accent }} />
        <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.dim }}>{title}</span>
      </div>
      <pre style={{ padding: '1.25rem', margin: 0, fontFamily: T.mono, fontSize: '0.68rem', lineHeight: 1.7, color: T.dim, overflowX: 'auto' }}>
        {children}
      </pre>
    </div>
  );
}

const WORKFLOW_YAML = `name: a11oy governed pull request review
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  governed-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    outputs:
      proof_hash: \${{ steps.run_a11oy.outputs.proof-hash }}
      final_message: \${{ steps.run_a11oy.outputs.final-message }}
    steps:
      - uses: actions/checkout@v5
        with:
          ref: refs/pull/\${{ github.event.pull_request.number }}/merge

      - name: Pre-fetch base and head refs
        run: |
          git fetch --no-tags origin \\
            \${{ github.event.pull_request.base.ref }} \\
            +refs/pull/\${{ github.event.pull_request.number }}/head

      - name: Run a11oy Governed Review
        id: run_a11oy
        uses: szl-holdings/a11oy-action@v2
        with:
          a11oy-api-key: \${{ secrets.A11OY_API_KEY }}
          prompt-file: .github/a11oy/prompts/review.md
          output-file: a11oy-review.md
          governance-policy: production
          safety-strategy: drop-sudo
          sandbox: workspace-write
          proof-chain: enabled
          covenant-id: \${{ vars.A11OY_COVENANT_ID }}

  post_governed_feedback:
    runs-on: ubuntu-latest
    needs: governed-review
    if: needs.governed-review.outputs.final_message != ''
    steps:
      - name: Post governed feedback with proof hash
        uses: actions/github-script@v7
        with:
          github-token: \${{ github.token }}
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: \`\${process.env.A11OY_FINAL_MESSAGE}\\n\\n---\\n\` +
                    \`Proof: \${process.env.A11OY_PROOF_HASH} · Governed by a11oy\`,
            });
        env:
          A11OY_FINAL_MESSAGE: \${{ needs.governed-review.outputs.final_message }}
          A11OY_PROOF_HASH: \${{ needs.governed-review.outputs.proof_hash }}`;

const MIGRATION_YAML = `name: a11oy governed database migration
on:
  push:
    paths: ['migrations/**', 'src/db/schema/**']
    branches: [main]

jobs:
  governed-migration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Run governed migration review
        uses: szl-holdings/a11oy-action@v2
        with:
          a11oy-api-key: \${{ secrets.A11OY_API_KEY }}
          prompt: |
            Review database migrations for:
            - Breaking schema changes
            - Data loss risk
            - Rollback safety
            - Index impact analysis
            Require VP-Engineering approval for destructive changes.
          governance-policy: database-critical
          safety-strategy: drop-sudo
          sandbox: read-only
          proof-chain: enabled
          approval-required: true
          approval-roles: ["db-admin", "vp-engineering"]`;

const SECURITY_YAML = `name: a11oy governed security scan
on:
  pull_request:
    types: [opened, synchronize]
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am

jobs:
  governed-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Run governed security analysis
        uses: szl-holdings/a11oy-action@v2
        with:
          a11oy-api-key: \${{ secrets.A11OY_API_KEY }}
          prompt-file: .github/a11oy/prompts/security-audit.md
          governance-policy: security-critical
          safety-strategy: unprivileged-user
          codex-user: a11oy-scanner
          sandbox: read-only
          proof-chain: enabled
          pii-filter: strict
          dual-use-classification: enabled
          output-file: security-report.json
          output-schema: .github/a11oy/schemas/security-report.json`;

const TABS = [
  { id: 'review', label: 'PR Review', yaml: WORKFLOW_YAML, file: '.github/workflows/a11oy-review.yml' },
  { id: 'migration', label: 'DB Migration', yaml: MIGRATION_YAML, file: '.github/workflows/a11oy-migration.yml' },
  { id: 'security', label: 'Security Scan', yaml: SECURITY_YAML, file: '.github/workflows/a11oy-security.yml' },
];

const ACTION_INPUTS = [
  { name: 'a11oy-api-key', required: true, desc: 'Your a11oy API key. Store as a GitHub secret. The action starts a governed proxy that routes all inference through a11oy\'s governance layer.' },
  { name: 'prompt / prompt-file', required: true, desc: 'Inline instructions or path to a Markdown prompt file. Store prompts in .github/a11oy/prompts/ for version-controlled governance.' },
  { name: 'governance-policy', required: false, desc: 'Named governance policy from your a11oy covenant. Controls approval gates, PII filtering, dual-use classification, and proof chain depth.' },
  { name: 'proof-chain', required: false, desc: 'Enable cryptographic proof chain. Every reasoning step, file access, and model call logged to tamper-proof ledger. Default: enabled.' },
  { name: 'covenant-id', required: false, desc: 'Link to a specific a11oy covenant for policy enforcement. Covenants define what the agent can and cannot do.' },
  { name: 'safety-strategy', required: false, desc: 'Privilege control: drop-sudo (default), unprivileged-user, or unsafe. drop-sudo removes sudo before running — irreversible, protects secrets.' },
  { name: 'sandbox', required: false, desc: 'Filesystem/network access: workspace-write, read-only, or danger-full-access. Choose the narrowest option for the task.' },
  { name: 'approval-required', required: false, desc: 'Require human approval before applying changes. Integrates with a11oy\'s governance gate system.' },
  { name: 'approval-roles', required: false, desc: 'JSON array of roles authorized to approve. Maps to your a11oy team roles.' },
  { name: 'pii-filter', required: false, desc: 'PII detection level: off, standard, strict. Strict mode redacts all PII from logs, outputs, and proof chain entries.' },
  { name: 'dual-use-classification', required: false, desc: 'Enable dual-use capability classification. High-risk operations automatically flagged and routed through safety gates.' },
  { name: 'model', required: false, desc: 'Model selection. Routes through a11oy\'s model router: GPT-5.5, Claude 4, DeepSeek V4, or auto (best model per sub-task).' },
  { name: 'output-file', required: false, desc: 'Save the governed output to disk. Includes proof hash, governance metadata, and the agent\'s final message.' },
  { name: 'output-schema', required: false, desc: 'Path to JSON schema for structured output. Enforce consistent report formats across teams.' },
];

const OUTPUTS = [
  { name: 'final-message', desc: 'The agent\'s final response. Includes findings, recommendations, and governance summary.' },
  { name: 'proof-hash', desc: 'Cryptographic hash of the complete session proof chain. Verifiable via a11oy\'s trust center.' },
  { name: 'governance-report', desc: 'JSON object with policy compliance details, PII filter results, and approval status.' },
  { name: 'exit-code', desc: 'Standard exit code. 0 = success, 1 = failure, 2 = governance violation, 3 = approval pending.' },
];

const USE_CASES = [
  { name: 'Pull Request Review', desc: 'Every PR reviewed by a governed agent. Architecture analysis, security scanning, performance profiling — with proof hash on every review comment.', icon: '\u2B21' },
  { name: 'Database Migrations', desc: 'Schema changes analyzed for breaking changes, data loss risk, and rollback safety. Destructive operations require human approval through governance gates.', icon: '\u25C8' },
  { name: 'Security Auditing', desc: 'Continuous security scanning with dual-use classification. Dependency vulnerabilities, secret exposure, injection vectors — all governed and logged.', icon: '\u26A1' },
  { name: 'Release Preparation', desc: 'Automated changelog generation, version bumping, license compliance checks, and deployment readiness assessment. Governed approval before publish.', icon: '\u2726' },
  { name: 'Code Migration', desc: 'Framework upgrades, API version migrations, language modernization. The agent plans, executes, and proves every change. Rollback guaranteed.', icon: '\u229A' },
  { name: 'Compliance Checks', desc: 'SOC 2, HIPAA, GDPR compliance scanning on every commit. Policy violations flagged before they reach production. Audit trail automatic.', icon: '\u2693' },
  { name: 'Test Generation', desc: 'Generate test suites for uncovered code paths. Unit, integration, and e2e tests — with governed execution to verify they pass before merging.', icon: '\u25CB' },
  { name: 'Documentation', desc: 'Auto-generate API documentation, architecture decision records, and onboarding guides from code changes. Version-controlled, governed, proven.', icon: '\u25A1' },
];

const SECURITY_FEATURES = [
  { name: 'Privilege Isolation', desc: 'drop-sudo removes elevated privileges before agent execution. Irreversible per job. Secrets in memory protected from agent access.' },
  { name: 'Proof Chain', desc: 'Every file read, model call, and reasoning step committed to cryptographic ledger. Tamper-proof. Verifiable. Queryable by any dimension.' },
  { name: 'PII Filtering', desc: 'Automatic detection and redaction of personally identifiable information. Three levels: off, standard, strict. Applied to all outputs and logs.' },
  { name: 'Dual-Use Classification', desc: 'Security-sensitive operations automatically classified. Penetration testing tools, exploit analysis, and reverse engineering governed through safety gates.' },
  { name: 'Covenant Enforcement', desc: 'Organization-level policies enforced at the action level. What the agent can access, modify, and approve — defined once, enforced everywhere.' },
  { name: 'Trigger Restrictions', desc: 'Control who can invoke the action. Limit to write collaborators, specific users, or verified service accounts. Bot access configurable per workflow.' },
];

const COMPARISON = [
  { label: 'Governance', theirs: 'None — agent runs with full trust', ours: 'Covenant-enforced policies, approval gates, proof chain' },
  { label: 'Audit Trail', theirs: 'Workflow logs only', ours: 'Cryptographic proof hash on every session, verifiable via trust center' },
  { label: 'PII Protection', theirs: 'Manual — developer responsibility', ours: 'Automatic PII filtering at three strictness levels' },
  { label: 'Approval Gates', theirs: 'None — changes applied immediately', ours: 'Role-based approval required for destructive operations' },
  { label: 'Model Routing', theirs: 'Single model, single provider', ours: 'Multi-model: GPT-5.5, Claude 4, DeepSeek V4 — best per sub-task' },
  { label: 'Security Classification', theirs: 'None', ours: 'Dual-use classification, safety gates for high-risk operations' },
];

export function CiAction() {
  const [activeTab, setActiveTab] = useState('review');
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href={b('/')}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text, cursor: 'pointer', letterSpacing: '-0.02em' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, backgroundColor: T.accent, color: T.bg, fontSize: '0.65rem', fontWeight: 800, marginRight: 6 }}>a</span>
                a11oy
              </span>
            </Link>
            <span style={{ color: T.muted, fontSize: '0.8rem' }}>action</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href={b('/a11oy-code')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Platform</span></Link>
            <Link href={b('/deep-research')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Research</span></Link>
            <Link href={b('/sdk')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>SDK</span></Link>
            <Link href={b('/investor-demo')}>
              <span style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', border: `1px solid ${T.accent}`, borderRadius: 20, color: T.accent, cursor: 'pointer' }}>Investor demo</span>
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '8rem 2rem 6rem' }}>
        <FadeIn>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, marginBottom: '2rem', textAlign: 'center' }}>
            GOVERNED CI/CD INTELLIGENCE
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 0 0.5rem' }}>
            a11oy Action
          </h1>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p style={{ fontSize: '1.1rem', textAlign: 'center', fontFamily: T.mono, color: T.muted, marginBottom: '2rem' }}>
            szl-holdings/a11oy-action@v2
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: '0 auto 3rem', textAlign: 'center' }}>
            Drop a governed AI agent into any GitHub Actions workflow. Code review, security scans, migrations, releases — every action proven on-chain. Not a wrapper around an API call. A governed agentic runtime for your CI/CD pipeline.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={b('/sdk')}>
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Get Started
              </span>
            </Link>
            <Link href={b('/a11oy-code')}>
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, border: `1px solid ${T.borderStrong}`, color: T.text, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                View Platform
              </span>
            </Link>
          </div>
        </FadeIn>
        <FadeIn delay={0.4}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[
              { value: '8', label: 'use cases' },
              { value: '14', label: 'action inputs' },
              { value: '100%', label: 'proof chain coverage' },
              { value: '3', label: 'sandbox modes' },
              { value: '6', label: 'security layers' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontFamily: T.mono, color: T.accent, fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Workflow Examples</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
            Drop in. Govern everything.
          </h2>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 8, border: `1px solid ${activeTab === tab.id ? T.accent : T.border}`,
                  backgroundColor: activeTab === tab.id ? 'rgba(201,183,135,0.08)' : 'transparent',
                  color: activeTab === tab.id ? T.accent : T.dim, cursor: 'pointer', fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <CodeBlock title={active.file}>{active.yaml}</CodeBlock>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Use Cases</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '3rem' }}>
            Eight governed workflows. One action.
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {USE_CASES.map((uc, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ padding: '1.75rem', borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, height: '100%' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{uc.icon}</div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem' }}>{uc.name}</h3>
                <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: T.dim }}>{uc.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Action Inputs</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            14 inputs. Full governance control.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '2rem', lineHeight: 1.6 }}>
            Every input maps to a governance dimension. Configure once in your workflow, enforce everywhere.
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {ACTION_INPUTS.map((input, i) => (
              <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: i < ACTION_INPUTS.length - 1 ? `1px solid ${T.border}` : 'none', display: 'grid', gridTemplateColumns: '200px auto', gap: '1.5rem', alignItems: 'start' }}>
                <div>
                  <code style={{ fontSize: '0.72rem', fontFamily: T.mono, color: T.accent }}>{input.name}</code>
                  {input.required && <span style={{ fontSize: '0.55rem', color: '#ef4444', marginLeft: 6, fontFamily: T.mono }}>required</span>}
                </div>
                <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>{input.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Outputs</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
            Every run produces governed outputs.
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {OUTPUTS.map((out, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ padding: '1.5rem', borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
                <code style={{ fontSize: '0.72rem', fontFamily: T.mono, color: T.accent, display: 'block', marginBottom: '0.6rem' }}>{out.name}</code>
                <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>{out.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Live Session</Label></FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', backgroundColor: T.surface }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />
              <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.dim }}>github-actions / a11oy-governed-review / Run a11oy Governed Review</span>
            </div>
            <div style={{ padding: '1.5rem', fontFamily: T.mono, fontSize: '0.68rem', lineHeight: 1.8 }}>
              <div style={{ color: T.muted }}># a11oy-action@v2 initialized</div>
              <div style={{ color: '#4ade80' }}>[governance] Covenant cov-prod-2024 loaded — 12 policies active</div>
              <div style={{ color: '#4ade80' }}>[governance] Safety strategy: drop-sudo — elevated privileges removed</div>
              <div style={{ color: '#4ade80' }}>[governance] Proof chain: session 0xa8f2...d4c1 initialized</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[agent] Reading prompt from .github/a11oy/prompts/review.md</div>
              <div style={{ color: T.dim }}>[agent] Analyzing PR #847: "Refactor payment processing pipeline"</div>
              <div style={{ color: T.dim }}>[agent] Diff: 14 files changed, +342 -187 lines</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[model-router] Task: code review → routed to Claude 4 (architecture analysis)</div>
              <div style={{ color: T.dim }}>[model-router] Sub-task: security scan → routed to GPT-5.5 (vulnerability detection)</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[review] Architecture: Service extraction pattern detected — correctly separated</div>
              <div style={{ color: T.accent }}>[review] Warning: PaymentProcessor.execute() missing idempotency key</div>
              <div style={{ color: T.accent }}>[review] Warning: Retry logic in webhook handler may cause duplicate charges</div>
              <div style={{ color: T.dim }}>[review] Performance: N+1 query in OrderRepository.findWithItems() (line 142)</div>
              <div style={{ color: '#4ade80' }}>[review] Security: No credential exposure, no injection vectors detected</div>
              <div style={{ height: 8 }} />
              <div style={{ color: '#4ade80' }}>[pii-filter] Scanned 14 files — 0 PII instances detected</div>
              <div style={{ color: '#4ade80' }}>[dual-use] Classification: standard development — no safety gates triggered</div>
              <div style={{ height: 8 }} />
              <div style={{ color: '#4ade80' }}>[proof] Hash: 0x3c7a...f1b2 committed to ledger</div>
              <div style={{ color: '#4ade80' }}>[proof] 847 reasoning steps archived</div>
              <div style={{ color: T.text }}>Review complete: 2 warnings, 1 performance issue, 0 security findings</div>
              <div style={{ color: T.muted }}>Duration: 34s | Model calls: 7 | Proof: verified | Governance: compliant</div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Security</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Six layers between the agent and your secrets.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '3rem', lineHeight: 1.6 }}>
            Other CI agents run with full trust. Ours doesn't. Every privilege explicitly granted, every action cryptographically proven.
          </p>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {SECURITY_FEATURES.map((feat, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ padding: '1.75rem', borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, height: '100%' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem' }}>{feat.name}</h3>
                <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: T.dim }}>{feat.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Comparison</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
            Their action vs. ours.
          </h2>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: `1px solid ${T.border}`, padding: '0.75rem 1.25rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}></div>
              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Generic CI Agent</div>
              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>a11oy Action</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', padding: '0.85rem 1.25rem', borderBottom: i < COMPARISON.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>{row.label}</div>
                <div style={{ fontSize: '0.72rem', color: T.muted }}>{row.theirs}</div>
                <div style={{ fontSize: '0.72rem', color: T.text }}>{row.ours}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '6rem 2rem 8rem', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, marginBottom: '2rem' }}>
              GOVERNED CI/CD FOR THE AGENTIC ERA
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
              Every commit reviewed.<br />Every change governed.<br />Every action proven.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ fontSize: '0.85rem', color: T.dim, marginBottom: '2.5rem', lineHeight: 1.6 }}>
              a11oy Action is not a CI plugin. It's the governed agentic runtime for your entire software delivery pipeline.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={b('/sdk')}>
                <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  Get Started
                </span>
              </Link>
              <Link href={b('/investor-demo')}>
                <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  Investor Demo
                </span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted }}>
          a11oy action — governed CI/CD intelligence — szl-holdings/a11oy-action@v2 — SZL Holdings
        </p>
      </footer>
    </div>
  );
}
