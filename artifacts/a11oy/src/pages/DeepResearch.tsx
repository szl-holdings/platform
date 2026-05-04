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

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay, ease }} className={className}>
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, margin: '0 0 1.5rem' }}>{children}</p>;
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Ask anything complex',
    desc: 'Submit multi-layered research questions — competitive analysis, regulatory landscape, market sizing, academic synthesis. Upload documents, data files, images for context. No question too complex.',
  },
  {
    step: '02',
    title: 'Governed exploration',
    desc: 'The research agent autonomously browses hundreds of authenticated sources, analyzes documents, cross-references data — all through a11oy\'s governance pipeline. Every source verified. Every step logged to the Proof Chain.',
  },
  {
    step: '03',
    title: 'Real-time transparency',
    desc: 'Watch the agent work in real time. See which sources it\'s consulting, what hypotheses it\'s forming, where it\'s finding contradictions. Redirect mid-research. Full chain-of-thought visibility.',
  },
  {
    step: '04',
    title: 'Verified deliverable',
    desc: 'Receive a comprehensive, structured report with inline citations, confidence scores, and a cryptographic proof hash. Every claim traceable. Every source auditable. Export to any format.',
  },
];

const CAPABILITIES = [
  {
    icon: '\u2693',
    name: 'Multi-Source Synthesis',
    desc: 'Browses and synthesizes from 500+ sources per query. Web, academic databases, patent archives, regulatory filings, financial reports — all cross-referenced and ranked by reliability.',
    stat: '500+',
    statLabel: 'sources per query',
  },
  {
    icon: '\u26A1',
    name: 'Document Intelligence',
    desc: 'Upload PDFs, spreadsheets, images, datasets. The agent extracts, analyzes, and integrates document content into the research pipeline. OCR, table extraction, chart interpretation — all governed.',
    stat: '47',
    statLabel: 'file types supported',
  },
  {
    icon: '\u2B21',
    name: 'Authenticated Sources',
    desc: 'Every source is verified and ranked. Academic papers checked against DOI registries. Financial data cross-referenced with SEC filings. News verified against multiple outlets. No hallucinated citations.',
    stat: '99.7%',
    statLabel: 'source accuracy',
  },
  {
    icon: '\u25C8',
    name: 'Real-Time Control',
    desc: 'Pause, redirect, or refine the research agent mid-execution. Add new constraints, exclude sources, narrow scope. The agent adapts its plan instantly while preserving all prior work.',
    stat: '<30s',
    statLabel: 'redirect latency',
  },
  {
    icon: '\u2726',
    name: 'Structured Output',
    desc: 'Reports generated with executive summaries, detailed sections, data tables, and citations. Export as PDF, DOCX, HTML, or JSON. Custom templates for recurring research types.',
    stat: '12',
    statLabel: 'output formats',
  },
  {
    icon: '\u229A',
    name: 'Proof Chain',
    desc: 'Every research session produces a tamper-proof audit trail. Source access logs, reasoning chains, confidence calculations — all committed to the cryptographic proof ledger. Enterprise-grade accountability.',
    stat: '100%',
    statLabel: 'auditable',
  },
];

const RESEARCH_DOMAINS = [
  { name: 'Competitive Intelligence', desc: 'Market positioning, feature comparison, pricing analysis, team composition, funding history, patent filings, and strategic direction across any industry vertical.', queries: '2,400+' },
  { name: 'Market Research', desc: 'TAM/SAM/SOM analysis, consumer behavior trends, demographic segmentation, pricing elasticity, and market entry strategy backed by primary and secondary sources.', queries: '3,100+' },
  { name: 'Academic Synthesis', desc: 'Literature reviews across 200M+ papers. Meta-analysis, methodology comparison, citation network mapping, and research gap identification with confidence scoring.', queries: '1,800+' },
  { name: 'Regulatory & Compliance', desc: 'Cross-jurisdictional regulatory analysis. GDPR, SOX, HIPAA, StateRAMP, ITAR — track requirements, monitor changes, assess impact on your operations.', queries: '1,200+' },
  { name: 'Financial Analysis', desc: 'Company fundamentals, industry benchmarking, risk assessment, scenario modeling. SEC filings, earnings transcripts, analyst reports — all synthesized into actionable intelligence.', queries: '2,700+' },
  { name: 'Legal Research', desc: 'Case law analysis, statute interpretation, regulatory precedent, contract clause comparison. Jurisdiction-aware, citation-verified, privilege-respecting.', queries: '900+' },
  { name: 'Technical Due Diligence', desc: 'Architecture assessment, codebase analysis, infrastructure review, security posture evaluation. For M&A, vendor selection, or internal audit — with governed access controls.', queries: '1,500+' },
  { name: 'Patent & IP Analysis', desc: 'Prior art search, patent landscape mapping, claim analysis, freedom-to-operate assessment. Cross-reference USPTO, EPO, WIPO databases with academic literature.', queries: '800+' },
];

const ENTERPRISE_FEATURES = [
  { name: 'Data Sovereignty', desc: 'Research data never leaves your designated region. Process and store in US, EU, APAC, or on-premise. Full compliance with data residency requirements.' },
  { name: 'Zero Data Training', desc: 'Your research queries and results are never used to train models. Contractual guarantee. Cryptographically verified data isolation.' },
  { name: 'Team Workspaces', desc: 'Shared research libraries, collaborative annotation, role-based access. Research directors, analysts, and executives each see what they need.' },
  { name: 'Custom Source Lists', desc: 'Curate approved source lists per team, domain, or project. Block competitors from being cited. Prioritize proprietary databases and internal knowledge bases.' },
  { name: 'Compliance Certifications', desc: 'SOC 2 Type II, ISO 27001, HIPAA BAA, StateRAMP (in progress). Every certification backed by continuous monitoring, not annual snapshots.' },
  { name: 'API Access', desc: 'Programmatic research at scale. Batch queries, webhook callbacks, structured JSON output. Build research pipelines that feed directly into your decision systems.' },
  { name: 'Conversation Archival', desc: 'Every research conversation archived with full metadata. Searchable, exportable, retention-policy compliant. Meet regulatory record-keeping requirements automatically.' },
  { name: 'Priority Inference', desc: 'Dedicated compute for enterprise research. No queue. No throttling. Sub-minute response times even for complex multi-source synthesis queries.' },
];

const PIPELINE_STEPS = [
  { label: 'QUERY RECEIVED', detail: 'Intent parsed · Scope validated · Governance policy checked', color: T.dim },
  { label: 'SOURCE PLANNING', detail: '12 source categories ranked · 500+ endpoints mapped · Access verified', color: T.dim },
  { label: 'GOVERNED CRAWL', detail: 'Authenticated browsing · Rate-limited · PII filtered · Proof logged', color: T.accent },
  { label: 'SYNTHESIS', detail: 'Cross-reference · Contradiction detection · Confidence scoring', color: T.accent },
  { label: 'QUALITY GATE', detail: 'Citation verification · Bias check · Completeness score · Hallucination filter', color: T.accent },
  { label: 'PROOF COMMIT', detail: 'Hash: 0x9f4a...c3e7 · Ledger updated · Audit trail sealed', color: '#4ade80' },
  { label: 'DELIVERABLE', detail: 'Structured report · Inline citations · Confidence intervals · Export ready', color: '#4ade80' },
];

const STATS = [
  { value: '500+', label: 'sources per query' },
  { value: '200M+', label: 'academic papers indexed' },
  { value: '99.7%', label: 'citation accuracy' },
  { value: '<5min', label: 'complex research delivery' },
  { value: '100%', label: 'governed & auditable' },
  { value: '8', label: 'research domains' },
];

export function DeepResearch() {
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
            <span style={{ color: T.muted, fontSize: '0.8rem' }}>deep research</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href={b('/a11oy-code')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Platform</span></Link>
            <Link href={b('/plugins')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Plugins</span></Link>
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
            GOVERNED MULTI-SOURCE INTELLIGENCE
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 0 2rem' }}>
            Deep Research
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: '0 auto 3rem', textAlign: 'center' }}>
            Autonomous research agent that browses hundreds of authenticated sources, synthesizes findings into comprehensive reports, and commits every step to the Proof Chain. Not just answers — governed intelligence with full audit trail.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={b('/terminal')}>
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Start Research
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '4rem', flexWrap: 'wrap' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontFamily: T.mono, color: T.accent, fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Governed Research Pipeline</Label></FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ position: 'relative', padding: '2rem 0' }}>
            <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, backgroundColor: T.border }} />
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}
              >
                <div style={{ width: 33, height: 33, borderRadius: '50%', border: `1px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontFamily: T.mono, color: step.color, flexShrink: 0, backgroundColor: T.bg, zIndex: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: step.color, marginBottom: 2, fontFamily: T.mono, letterSpacing: '0.04em' }}>{step.label}</div>
                  <div style={{ fontSize: '0.75rem', color: T.dim }}>{step.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>How it works</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '3rem' }}>
            From question to governed intelligence.
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {HOW_IT_WORKS.map((item, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div style={{ padding: '2rem', borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, height: '100%' }}>
                <div style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.accent, marginBottom: '1rem', fontWeight: 600 }}>{item.step}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>{item.title}</h3>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.65, color: T.dim }}>{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Core Capabilities</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '3rem' }}>
            Research infrastructure, not a chatbot.
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {CAPABILITIES.map((cap, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ padding: '2rem', borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{cap.icon}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontFamily: T.mono, color: T.accent, fontWeight: 700 }}>{cap.stat}</div>
                    <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cap.statLabel}</div>
                  </div>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem', letterSpacing: '-0.01em' }}>{cap.name}</h3>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.65, color: T.dim }}>{cap.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Research Domains</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Eight domains. Every one governed.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '3rem', lineHeight: 1.6 }}>
            Deep Research doesn't just search — it understands domain context, applies domain-specific source ranking, and produces deliverables formatted for each discipline.
          </p>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', backgroundColor: T.border, borderRadius: 12, overflow: 'hidden' }}>
          {RESEARCH_DOMAINS.map((domain, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{ padding: '1.75rem', backgroundColor: T.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{domain.name}</h3>
                  <span style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.accent }}>{domain.queries} queries</span>
                </div>
                <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: T.dim }}>{domain.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Live Research Session</Label></FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', backgroundColor: T.surface }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />
              <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.dim }}>a11oy deep-research v2.1 — governed session</span>
            </div>
            <div style={{ padding: '1.5rem', fontFamily: T.mono, fontSize: '0.72rem', lineHeight: 1.8 }}>
              <div style={{ color: T.muted }}># Research query submitted</div>
              <div style={{ color: T.text }}><span style={{ color: T.accent }}>user</span> &gt; Analyze the competitive landscape for governed AI platforms in the defense sector. Include funding history, team composition, key contracts, and technology differentiation. Cross-reference with recent DoD procurement patterns.</div>
              <div style={{ height: 12 }} />
              <div style={{ color: T.muted }}># Governed research pipeline initialized</div>
              <div style={{ color: '#4ade80' }}>[governance] Policy check: PASSED — defense sector research authorized for this team</div>
              <div style={{ color: '#4ade80' }}>[governance] Data sovereignty: US-ONLY processing enforced</div>
              <div style={{ color: '#4ade80' }}>[governance] Proof Chain: session 0xf8c2...a4e1 initialized</div>
              <div style={{ height: 12 }} />
              <div style={{ color: T.dim }}>[source-planner] Mapping source categories...</div>
              <div style={{ color: T.dim }}>[source-planner] 14 categories identified: SEC filings, Crunchbase, USASpending.gov, SBIR.gov, LinkedIn (team composition), patent databases, DoD contract announcements, defense industry publications, earnings transcripts, analyst reports, academic papers, press releases, GitHub (OSS footprint), conference proceedings</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[crawler] Authenticated browsing: 347 sources accessed</div>
              <div style={{ color: T.dim }}>[crawler] Rate-limited: 12 req/sec per domain — compliance maintained</div>
              <div style={{ color: T.dim }}>[crawler] PII filter: 3 instances redacted from source content</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[synthesis] Cross-referencing 347 sources...</div>
              <div style={{ color: T.dim }}>[synthesis] 23 companies identified in governed AI defense space</div>
              <div style={{ color: T.dim }}>[synthesis] 7 contradictions detected — resolving via primary source priority</div>
              <div style={{ color: T.dim }}>[synthesis] Confidence score: 94.2%</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.accent }}>[quality-gate] Citation verification: 341/347 verified (98.3%)</div>
              <div style={{ color: T.accent }}>[quality-gate] Bias check: PASSED — no single-source dependency</div>
              <div style={{ color: T.accent }}>[quality-gate] Hallucination filter: 0 fabricated claims detected</div>
              <div style={{ height: 8 }} />
              <div style={{ color: '#4ade80' }}>[proof] Hash: 0x9f4a...c3e7 committed to ledger</div>
              <div style={{ color: '#4ade80' }}>[proof] 347 source access logs sealed</div>
              <div style={{ color: '#4ade80' }}>[proof] Reasoning chain (1,847 steps) archived</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.text }}>Report ready: 23 companies profiled, $4.7B total funding mapped, 12 active DoD contracts identified, 3 technology differentiation clusters defined.</div>
              <div style={{ color: T.muted }}>Delivery time: 3m 47s | Sources: 347 | Confidence: 94.2% | Format: PDF + JSON</div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Enterprise</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Research infrastructure built for regulated industries.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '3rem', lineHeight: 1.6 }}>
            Not a consumer toy with an enterprise wrapper. Built from day one for teams that answer to regulators, auditors, and boards.
          </p>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {ENTERPRISE_FEATURES.map((feat, i) => (
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
        <FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div>
              <Label>What makes this different</Label>
              <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '2rem', lineHeight: 1.3 }}>
                They give you search results.<br />
                <span style={{ color: T.accent }}>We give you governed intelligence.</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { them: 'Search results with links', us: 'Synthesized reports with inline citations and confidence scores' },
                { them: 'No audit trail', us: 'Cryptographic proof hash on every research session' },
                { them: 'Black box reasoning', us: 'Full chain-of-thought visibility with real-time control' },
                { them: 'Consumer-grade privacy', us: 'Data sovereignty, zero-training guarantee, SOC 2 Type II' },
                { them: 'Single model', us: 'Multi-model routing: GPT-5.5, Claude 4, DeepSeek V4 — best model per sub-task' },
              ].map((row, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
                    <div style={{ color: T.muted, padding: '0.75rem 1rem', borderRadius: 8, backgroundColor: T.surface, borderLeft: `2px solid ${T.muted}` }}>
                      {row.them}
                    </div>
                    <div style={{ color: T.text, padding: '0.75rem 1rem', borderRadius: 8, backgroundColor: T.surface, borderLeft: `2px solid ${T.accent}` }}>
                      {row.us}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '6rem 2rem 8rem', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, marginBottom: '2rem' }}>
              THE RESEARCH LAYER OF GOVERNED AGI
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
              Every question answered.<br />Every source verified.<br />Every step proven.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ fontSize: '0.85rem', color: T.dim, marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Deep Research is not a feature. It's the governed research infrastructure for the world's most consequential decisions.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={b('/terminal')}>
                <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  Start Research
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
          a11oy deep research — governed multi-source intelligence — SZL Holdings
        </p>
      </footer>
    </div>
  );
}
