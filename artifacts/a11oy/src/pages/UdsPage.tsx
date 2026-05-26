import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const ATTEST_URL = `${BASE}/uds-attestations.json`;

type AttestChainEntry = {
  index: number;
  subject: string;
  fileCount: number;
  totalBytes: number;
  subjectSha256: string;
  prevHash: string;
  entryHash: string;
};

type AttestManifest = {
  name: string;
  version: string;
  gitSha?: string;
  builtAt: string;
  hashAlgorithm: string;
  manifestSha256?: string;
  subjects?: string[];
  chain: AttestChainEntry[];
  head: string;
};

type AttestState =
  | { status: 'loading' }
  | { status: 'ready'; manifest: AttestManifest; verifiedAt: string }
  | { status: 'missing' }
  | { status: 'error'; message: string };

const COLORS = {
  bg: '#0a0a0a',
  card: '#111111',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  sub: '#8a8a8a',
  gold: '#c9b787',
  uds: '#7d4cff',
  udsSoft: 'rgba(125,76,255,0.14)',
  ok: '#4ade80',
};

const SLIDES = [
  {
    n: '01',
    label: 'TITLE',
    title: 'a11oy.UDS',
    body: 'A UDS-native, governed agent runtime. Inheriting UDS guardrails. Carrying a11oy\u2019s orchestration DNA.',
  },
  {
    n: '02',
    label: 'POSTURE',
    title: 'Why this name, why this shape',
    body: 'The Linux ethos thread: a kernel surface stays small, sharp, and verifiable. Capabilities mesh in at the policy and admission edges. a11oy is a capability. UDS is the kernel surface.',
  },
  {
    n: '03',
    label: 'INHERITANCE',
    title: 'What a11oy already carries',
    body: 'Six primitives, in production today: orchestration, approval gates, artifact registry, proof ledger, \u039b-9 invariant runtime, and the recalibration memo pipeline.',
  },
  {
    n: '04',
    label: 'INHERITANCE',
    title: 'What UDS already carries',
    body: 'Distribution (Zarf, UDS bundles), cluster (uds-core, Pepr admission, NetworkPolicies), identity (Keycloak), edge (Istio tenant gateway), telemetry (Loki + Prometheus).',
  },
  {
    n: '05',
    label: 'THESIS',
    title: 'The meshing thesis',
    body: 'a11oy.UDS = a11oy\u2019s six primitives expressed natively as UDS citizens. Every novel surface lives above the UDS line; everything below it is borrowed.',
  },
];

const PROBLEMS = [
  {
    tag: 'PROBLEM 1',
    title: 'Trusted AI / agent orchestration inside air-gapped UDS',
    points: [
      'Provenance for every tool call (uds-cli #5026 sidecar)',
      'Human-in-the-loop approval gates (pepr #5027)',
      'Immutable tool-call audit (Ed25519 + ML-DSA-65)',
      'Disconnected operation \u2014 verifiable offline',
      'Keycloak-backed agent identities',
    ],
  },
  {
    tag: 'PROBLEM 2',
    title: 'A UDS-native artifact spine for AI',
    points: [
      'SBOM-style attestation per AIArtifact kind',
      'Signed evals \u2014 dev pass means prod pass',
      'Drift detection (embeddings, evals, prompts)',
      'Promote / queue / discard mirrors Zarf packages',
      'In-cluster RAG over attested embedding bundles',
    ],
  },
];

const LADDER = [
  {
    tag: 'OPTION A',
    badge: '2\u20133 week proof point',
    badgeColor: COLORS.gold,
    title: 'a11oy.UDS as a Zarf bundle payload',
    body: 'Drops into an existing UDS cluster. Inherits Keycloak SSO, Istio tenant gateway, Pepr admission, NetworkPolicies, and Loki/Prometheus as-is. Recommended starting point.',
  },
  {
    tag: 'OPTION B',
    badge: 'Falls out of A',
    badgeColor: COLORS.sub,
    title: 'Primitives ported one-by-one to native UDS components',
    body: 'Each a11oy primitive gets a UDS-native form. Pepr capabilities, OPA bundles, Keycloak clients. Done as a by-product of the Option A bundle work \u2014 not as an independent multi-quarter refactor.',
  },
  {
    tag: 'OPTION C',
    badge: 'The real destination',
    badgeColor: COLORS.uds,
    title: 'Full a11oy.UDS ecosystem port',
    body: 'a11oy.UDS becomes a first-class peer of uds-core. UDS adopters get governed-agent orchestration the same way they get SSO \u2014 a default checkbox at install.',
  },
];

const COMPONENTS = [
  ['Signal Mesh + Workcells', 'Orchestration plane', 'Pepr operator hooks', 'Wired (#5028)'],
  ['Approval Queue', 'Approval gates', 'UDS policy engine + Pepr admission', 'Wired (pepr #5027)'],
  ['\u039b-9 Invariant Runtime', 'Pepr admission module', 'Pepr admission', 'Merged (pepr #5027)'],
  ['Frontier registry', 'AIArtifact CRD (model/prompt/eval/embed/agent)', 'Zarf OCI registry + SBOM', 'Wired prototype'],
  ['Proof Ledger', 'In-bundle attestation sidecar + Loki', 'uds-cli attestation manifest', 'Merged (uds-cli #5026)'],
  ['Recalibration Memo', 'UDS-aware fleet "what-changed" feed', 'uds-cli bundle inspect', 'Wired in a11oy'],
  ['Agent Identity Registry', 'Keycloak agent identities', 'Keycloak realm + OIDC', 'Planned \u2014 Week 1'],
  ['Embedding / RAG fabric', 'RAG with attested embeddings', 'Zarf-attested components', 'Planned \u2014 Week 3'],
  ['Telemetry', 'OTLP \u2192 Loki, /metrics \u2192 Prometheus', 'UDS observability stack', 'Planned \u2014 Week 1'],
  ['NetworkPolicy posture', 'UDS-default deny + allow-list', 'NetworkPolicies', 'Wired (#5028)'],
];

const WEEKS = [
  {
    n: 'WEEK 1',
    title: 'Bundle, identity, observability',
    items: [
      'uds-cli bundle deploy on the reference cluster',
      'Keycloak SSO round-trip end-to-end',
      'Istio tenant gateway routes verified',
      'Loki + Prometheus exporters confirmed',
    ],
    artifact: 'Screenshot: a11oy home, via tenant gateway, after Keycloak SSO, request line in Loki.',
  },
  {
    n: 'WEEK 2',
    title: 'Approval gates, \u039b-9 admission, audit chain',
    items: [
      'Bad invocation \u2192 MATURITY_GATE_BLOCKED',
      'Good invocation \u2192 approval queue prompt fires',
      'Cable pulled \u2014 three offline invocations',
      'Cable restored \u2014 sidecar shipped to verifier laptop',
    ],
    artifact: 'uds-cli bundle verify --offline \u2192 OK chain=clean entries=N signer=did:plat:szl-a11oy-prod',
  },
  {
    n: 'WEEK 3',
    title: 'Artifact spine',
    items: [
      'AIArtifact CRD applied',
      'All five kinds round-trip candidate \u2192 queued \u2192 promoted',
      'Seeded embedding drift surfaces in next memo (\u226424h)',
      'Broken-signature promote denied + recorded in proof ledger',
    ],
    artifact: '\u22645-min single-take walkthrough + final proof-ledger sidecar.',
  },
];

const WIRES = [
  { ref: 'uds-cli #5026', body: 'In-bundle hash-chained attestation manifest. --attest + verify --offline.', tag: 'MERGED' },
  { ref: 'pepr #5027', body: 'lambda-floor Pepr capability + AgentInvocation CRD. 0.90 / 0.95 / 0.95 floor.', tag: 'MERGED' },
  { ref: '#5028', body: 'A11oy + Sentra + Amaru Zarf packages, top-level UDS bundle with attestations sidecar.', tag: 'MERGED' },
  { ref: 'OPA gateway pack', body: 'platform/agent-gateway/tests/gateway-opa-live.test.ts \u2014 3 tests, pinned OPA v0.69.0.', tag: 'LIVE' },
  { ref: '#5118 / #5119', body: 'Publish + validate steps for the merged work. Tracked, out of scope for Tuesday.', tag: 'TRACKED' },
];

const BUNDLE_VARIANTS = [
  {
    file: 'uds-bundle.local.yaml',
    badge: 'DEMO DEFAULT',
    badgeColor: COLORS.gold,
    summary:
      'Path-based references to the sibling a11oy/sentra/amaru deploy/ directories. uds-cli builds the three Zarf packages locally at bundle-build time \u2014 no GHCR pull, no published-package dependency. This is what we run for Andrew.',
    cmd: 'uds-cli bundle create . -f uds-bundle.local.yaml --confirm',
  },
  {
    file: 'uds-bundle.yaml',
    badge: 'PRODUCTION PATH',
    badgeColor: COLORS.uds,
    summary:
      'OCI references to ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha. For downstream adopters pulling the bundle from a registry once the packages have been published \u2014 not the demo path.',
    cmd: 'uds-cli bundle create . --confirm',
  },
];

const DOCS = [
  ['00_cover_letter.md', 'Cover note Stephen can paste as the email body.'],
  ['01_vision_deck.md', 'Slide-by-slide outline (~14 slides) with speaker notes.'],
  ['02_a11oy_uds_architecture.md', 'System diagram, per-component table, problem-to-component map, CRD sketch.'],
  ['03_meshing_writeup.md', '~1500-word write-up on Options A / B / C and the proof plan.'],
  ['04_problem_briefs.md', 'One-page brief per problem with smallest-credible-demo + acceptance signal.'],
  ['05_proof_plan.md', '2\u20133 week proof plan with week-by-week milestones, demo script, asks.'],
  ['06_appendix_evidence.md', '\u201CWires are set up\u201D exhibit list. Every claim path-walkable.'],
];

function useAttestation(): AttestState {
  const [state, setState] = useState<AttestState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ATTEST_URL, { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: 'missing' });
          return;
        }
        if (!res.ok) {
          setState({ status: 'error', message: `HTTP ${res.status}` });
          return;
        }
        const dateHeader = res.headers.get('date') ?? new Date().toUTCString();
        const manifest = (await res.json()) as AttestManifest;
        if (cancelled) return;
        if (!manifest || !Array.isArray(manifest.chain) || typeof manifest.head !== 'string') {
          setState({ status: 'error', message: 'malformed manifest' });
          return;
        }
        setState({
          status: 'ready',
          manifest,
          verifiedAt: new Date(dateHeader).toISOString(),
        });
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', message: (err as Error).message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function shortHash(h: string): string {
  if (!h) return '—';
  if (h.length <= 16) return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function StatBlock({ label, value, mono = false, color = COLORS.text }: { label: string; value: React.ReactNode; mono?: boolean; color?: string }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.sub,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: mono ? 12 : 16,
          color,
          fontFamily: mono ? 'JetBrains Mono, ui-monospace, monospace' : 'inherit',
          wordBreak: 'break-all',
          lineHeight: 1.3,
          fontWeight: mono ? 500 : 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LiveAttestationTile() {
  const state = useAttestation();

  const statusBadge = (() => {
    if (state.status === 'loading') return <Pill color={COLORS.sub}>READING MANIFEST…</Pill>;
    if (state.status === 'missing') return <Pill color={COLORS.gold}>NOT YET GENERATED</Pill>;
    if (state.status === 'error') return <Pill color={COLORS.gold}>UNAVAILABLE</Pill>;
    return <Pill color={COLORS.ok}>CHAIN INTACT · {state.manifest.hashAlgorithm.toUpperCase()}</Pill>;
  })();

  return (
    <section style={{ marginBottom: 48 }}>
      <Card accent={COLORS.ok}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <Pill color={COLORS.ok}>LIVE · IN-BUNDLE ATTESTATION</Pill>
            <h2
              style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 22,
                fontWeight: 600,
                color: COLORS.text,
                letterSpacing: '-0.01em',
              }}
            >
              Hash-chained sidecar — read at page load
            </h2>
          </div>
          {statusBadge}
        </div>

        {state.status === 'ready' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              <StatBlock label="Bundle" value={`${state.manifest.name} · v${state.manifest.version}`} />
              <StatBlock label="Entries" value={state.manifest.chain.length} />
              <StatBlock
                label="Head Hash (sha256)"
                value={shortHash(state.manifest.head)}
                mono
                color={COLORS.ok}
              />
              <StatBlock
                label="Built At (UTC)"
                value={state.manifest.builtAt}
                mono
              />
              <StatBlock
                label="Last Verified"
                value={state.verifiedAt}
                mono
              />
              {state.manifest.gitSha && (
                <StatBlock label="Git SHA" value={state.manifest.gitSha} mono />
              )}
            </div>
            <details style={{ marginTop: 14 }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.sub,
                }}
              >
                Inspect chain ({state.manifest.chain.length} entries)
              </summary>
              <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: COLORS.sub, letterSpacing: '0.08em' }}>
                      <th style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>#</th>
                      <th style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>SUBJECT</th>
                      <th style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>FILES</th>
                      <th style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>BYTES</th>
                      <th style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>ENTRY HASH</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
                    {state.manifest.chain.map((e) => (
                      <tr key={e.index} style={{ color: COLORS.text }}>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.sub }}>{e.index}</td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}` }}>{e.subject}</td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.sub }}>{e.fileCount}</td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.sub }}>{e.totalBytes}</td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.ok }}>{shortHash(e.entryHash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}

        {state.status === 'loading' && (
          <p style={{ fontSize: 13, color: COLORS.sub, margin: 0 }}>
            Fetching <code style={{ color: COLORS.gold }}>{ATTEST_URL}</code>…
          </p>
        )}

        {state.status === 'missing' && (
          <p style={{ fontSize: 13, color: COLORS.sub, margin: 0, lineHeight: 1.6 }}>
            Attestation not yet generated. Run{' '}
            <code style={{ color: COLORS.gold }}>pnpm --filter @workspace/a11oy-uds run build</code>{' '}
            to produce <code style={{ color: COLORS.gold }}>build-attestations/ATTESTATIONS.json</code>;
            this tile reads from disk on every page load.
          </p>
        )}

        {state.status === 'error' && (
          <p style={{ fontSize: 13, color: COLORS.sub, margin: 0, lineHeight: 1.6 }}>
            Could not read the attestation manifest ({state.message}). The page is intentionally
            degrading rather than crashing.
          </p>
        )}
      </Card>
    </section>
  );
}

function Pill({ children, color = COLORS.gold, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
        backgroundColor: bg ?? `${color}1a`,
        border: `1px solid ${color}40`,
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: accent ? `2px solid ${accent}` : `1px solid ${COLORS.border}`,
        padding: '20px 22px',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function Section({ id, label, title, children }: { id: string; label: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 18 }}>
        <Pill color={COLORS.uds}>{label}</Pill>
        <h2
          style={{
            marginTop: 10,
            fontSize: 28,
            fontWeight: 600,
            color: COLORS.text,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function UdsPage() {
  const linkBase = `${BASE}/uds`;
  const docsBase = '/docs/proposals/defense-unicorns/tuesday';
  return (
    <Layout>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          padding: '56px 0 64px',
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: 48,
          background: `radial-gradient(ellipse at top right, ${COLORS.udsSoft}, transparent 60%)`,
        }}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill color={COLORS.uds}>FOR ANDREW GREENE · DEFENSE UNICORNS</Pill>
          <Pill color={COLORS.gold}>TUESDAY PACKAGE</Pill>
          <Pill color={COLORS.ok}>WIRES MERGED</Pill>
        </div>
        <h1
          style={{
            fontSize: 64,
            lineHeight: 1.02,
            fontWeight: 700,
            margin: 0,
            color: COLORS.text,
            letterSpacing: '-0.025em',
          }}
        >
          a11oy<span style={{ color: COLORS.uds }}>.UDS</span>
        </h1>
        <p
          style={{
            marginTop: 18,
            fontSize: 18,
            lineHeight: 1.55,
            color: COLORS.sub,
            maxWidth: 760,
          }}
        >
          A UDS-native, governed agent runtime. Inheriting UDS guardrails.
          Carrying a11oy&rsquo;s orchestration DNA. Recommendation:&nbsp;
          <span style={{ color: COLORS.gold }}>Option A as a 2–3 week proof point</span>,
          with <span style={{ color: COLORS.uds }}>Option C as the real destination</span>.
          B falls out along the way.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`#vision`}
            style={{
              padding: '10px 18px',
              backgroundColor: COLORS.uds,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 2,
              letterSpacing: '0.04em',
            }}
          >
            Read the vision →
          </a>
          <a
            href={`#architecture`}
            style={{
              padding: '10px 18px',
              backgroundColor: 'transparent',
              color: COLORS.text,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 2,
              border: `1px solid ${COLORS.border}`,
              letterSpacing: '0.04em',
            }}
          >
            See the architecture →
          </a>
          <a
            href={`#proof`}
            style={{
              padding: '10px 18px',
              backgroundColor: 'transparent',
              color: COLORS.gold,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 2,
              border: `1px solid ${COLORS.gold}55`,
              letterSpacing: '0.04em',
            }}
          >
            The 2–3 week proof plan →
          </a>
        </div>
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
          }}
        >
          {[
            ['6', 'a11oy primitives'],
            ['5', 'UDS substrates inherited'],
            ['3', 'upstream wires merged'],
            ['2', 'problems targeted'],
            ['3wk', 'proof point window'],
          ].map(([k, v]) => (
            <div
              key={v}
              style={{
                padding: '14px 16px',
                backgroundColor: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>{k}</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.sub,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live attestation tile */}
      <LiveAttestationTile />

      {/* Vision deck */}
      <Section id="vision" label="VISION DECK · §01" title="The deck, in five panels">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {SLIDES.map((s) => (
            <Card key={s.n} accent={COLORS.uds}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 11,
                    color: COLORS.uds,
                    letterSpacing: '0.1em',
                  }}
                >
                  SLIDE {s.n}
                </span>
                <Pill color={COLORS.sub}>{s.label}</Pill>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </Card>
          ))}
        </div>
        <p style={{ marginTop: 18, fontSize: 12, color: COLORS.sub }}>
          Full ~14-slide outline with speaker notes:&nbsp;
          <a href={`${docsBase}/01_vision_deck.md`} style={{ color: COLORS.gold }}>
            01_vision_deck.md
          </a>
        </p>
      </Section>

      {/* Problems */}
      <Section id="problems" label="TARGETS · §04" title="Two problems a11oy.UDS moves the needle on">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
          {PROBLEMS.map((p) => (
            <Card key={p.tag} accent={COLORS.gold}>
              <Pill color={COLORS.gold}>{p.tag}</Pill>
              <h3 style={{ marginTop: 12, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{p.title}</h3>
              <ul style={{ marginTop: 12, paddingLeft: 18, color: COLORS.sub, fontSize: 13, lineHeight: 1.8 }}>
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* A/B/C ladder */}
      <Section id="ladder" label="THE LADDER" title="A / B / C — one ladder, one direction">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {LADDER.map((l) => (
            <Card key={l.tag} accent={l.badgeColor}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Pill color={l.badgeColor}>{l.tag}</Pill>
                <span style={{ fontSize: 11, color: l.badgeColor, letterSpacing: '0.06em' }}>{l.badge}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>{l.title}</h3>
              <p style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.65, margin: 0 }}>{l.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Architecture */}
      <Section id="architecture" label="ARCHITECTURE · §02" title="The system view">
        <Card>
          <pre
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 11,
              lineHeight: 1.5,
              color: COLORS.sub,
              overflowX: 'auto',
              margin: 0,
            }}
          >
{`                          UDS Cluster
   ┌────────┐    SSO       ┌────────────────────────┐
   │ User   │ ───────────► │  Keycloak (UDS)        │
   └────────┘              └────────────┬───────────┘
                                        │
                           ┌────────────▼───────────┐
                           │  Istio tenant gateway  │
                           └────────────┬───────────┘
                                        │
   ┌────────────────────────────────────▼───────────────────────┐
   │                       a11oy.UDS                            │
   │                                                            │
   │  ┌──────────────┐    ┌────────────────────┐                │
   │  │Orchestration │───►│ Approval Gates     │                │
   │  │ Plane        │    │ (Pepr + UDS policy)│                │
   │  └──────┬───────┘    └──────────┬─────────┘                │
   │         │            ┌──────────▼─────────┐                │
   │         │            │ Λ-9 Invariant Gate │  pepr #5027    │
   │         │            └──────────┬─────────┘                │
   │  ┌──────▼───────┐    ┌──────────▼─────────┐                │
   │  │ Artifact     │◄───┤ Agent / Approval   │                │
   │  │ Registry     │    │ Workers (Temporal) │                │
   │  └──────┬───────┘    └──────────┬─────────┘                │
   │         │            ┌──────────▼─────────┐                │
   │  ┌──────▼───────┐    │ Embedding / RAG    │                │
   │  │ Proof Ledger │◄───┤ Fabric             │                │
   │  │ (Ed25519 +   │    └────────────────────┘                │
   │  │  ML-DSA-65)  │       uds-cli #5026 sidecar              │
   │  └──────┬───────┘                                          │
   └─────────┼──────────────────────────────────────────────────┘
             │
             ▼
       Loki + Prometheus  (UDS observability)
       NetworkPolicies     (UDS default-deny)
                  uds-core`}
          </pre>
        </Card>
        <h3
          style={{
            marginTop: 28,
            marginBottom: 12,
            fontSize: 14,
            color: COLORS.text,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Per-component mesh
        </h3>
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: COLORS.sub, letterSpacing: '0.08em' }}>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 10 }}>A11OY TODAY</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 10 }}>BECOMES IN A11OY.UDS</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 10 }}>UDS PRIMITIVE INHERITED</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 10 }}>STATE</th>
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((row, i) => (
                  <tr key={i} style={{ color: COLORS.text }}>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}` }}>{row[0]}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.sub }}>{row[1]}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.sub }}>{row[2]}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}` }}>
                      <span style={{ color: row[3].startsWith('Merged') || row[3].startsWith('Wired') ? COLORS.ok : COLORS.gold }}>
                        {row[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p style={{ marginTop: 14, fontSize: 12, color: COLORS.sub }}>
          Full architecture (problem-to-component map, AIArtifact CRD sketch):&nbsp;
          <a href={`${docsBase}/02_a11oy_uds_architecture.md`} style={{ color: COLORS.gold }}>
            02_a11oy_uds_architecture.md
          </a>
        </p>
      </Section>

      {/* Proof plan */}
      <Section id="proof" label="PROOF PLAN · §05" title="2–3 week proof point (Option A)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {WEEKS.map((w) => (
            <Card key={w.n} accent={COLORS.gold}>
              <Pill color={COLORS.gold}>{w.n}</Pill>
              <h3 style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: COLORS.text }}>{w.title}</h3>
              <ul style={{ marginTop: 10, paddingLeft: 18, color: COLORS.sub, fontSize: 13, lineHeight: 1.7 }}>
                {w.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  backgroundColor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 11,
                  color: COLORS.text,
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: COLORS.gold }}>artifact \u25b8</span> {w.artifact}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Bundle variants */}
      <Section
        id="bundle"
        label="BUNDLE · DEMO VS. PRODUCTION"
        title="Two bundle files, one source tree"
      >
        <p style={{ fontSize: 14, color: COLORS.sub, lineHeight: 1.65, marginTop: -6, marginBottom: 16 }}>
          The Tuesday packet ships two top-level UDS bundles side by side. The local-build
          variant is the <span style={{ color: COLORS.gold }}>demo default</span> so the Day-1
          happy path runs without depending on the szl-holdings GHCR packages being
          reachable; the registry variant is the production path for downstream adopters.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {BUNDLE_VARIANTS.map((b) => (
            <Card key={b.file} accent={b.badgeColor}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 13,
                    color: COLORS.text,
                  }}
                >
                  {b.file}
                </span>
                <Pill color={b.badgeColor}>{b.badge}</Pill>
              </div>
              <p style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.65, margin: 0 }}>{b.summary}</p>
              <pre
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  padding: '10px 12px',
                  backgroundColor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 11,
                  color: COLORS.text,
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                }}
              >
                $ {b.cmd}
              </pre>
            </Card>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 12, color: COLORS.sub }}>
          Source:&nbsp;
          <a
            href="/docs/proposals/defense-unicorns/szl-holdings/uds-mesh/uds-bundle.local.yaml"
            style={{ color: COLORS.gold }}
          >
            uds-bundle.local.yaml
          </a>
          &nbsp;·&nbsp;
          <a
            href="/docs/proposals/defense-unicorns/szl-holdings/uds-mesh/uds-bundle.yaml"
            style={{ color: COLORS.uds }}
          >
            uds-bundle.yaml
          </a>
          &nbsp;·&nbsp;
          <a
            href="/docs/proposals/defense-unicorns/szl-holdings/uds-mesh/README.md"
            style={{ color: COLORS.sub }}
          >
            README walk-through
          </a>
        </p>
      </Section>

      {/* Wires */}
      <Section id="wires" label="EVIDENCE · §06" title='"The wires are set up"'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WIRES.map((w) => (
            <Card key={w.ref}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      fontSize: 13,
                      color: COLORS.text,
                      marginBottom: 4,
                    }}
                  >
                    {w.ref}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.6 }}>{w.body}</div>
                </div>
                <Pill color={w.tag === 'MERGED' ? COLORS.ok : w.tag === 'LIVE' ? COLORS.gold : COLORS.sub}>{w.tag}</Pill>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* The package */}
      <Section id="package" label="THE PACKAGE" title="What goes in the Tuesday email">
        <Card>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {DOCS.map(([file, desc]) => (
              <li
                key={file}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '10px 0',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <a
                  href={`${docsBase}/${file}`}
                  style={{
                    color: COLORS.gold,
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 12,
                    minWidth: 240,
                    textDecoration: 'none',
                  }}
                >
                  {file}
                </a>
                <span style={{ color: COLORS.sub, fontSize: 13 }}>{desc}</span>
              </li>
            ))}
            <li style={{ display: 'flex', gap: 14, padding: '12px 0' }}>
              <a
                href={`${docsBase}/a11oy_uds_package.zip`}
                style={{
                  color: COLORS.uds,
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontSize: 12,
                  minWidth: 240,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                a11oy_uds_package.zip
              </a>
              <span style={{ color: COLORS.text, fontSize: 13 }}>
                Single zip Stephen attaches to the email. Contains every file above plus the rendered .pptx and .pdf deck.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: `1px solid ${COLORS.border}` }}>
              <a
                href={`${docsBase}/email_to_andrew.docx`}
                style={{
                  color: COLORS.uds,
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontSize: 12,
                  minWidth: 240,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                email_to_andrew.docx
              </a>
              <span style={{ color: COLORS.text, fontSize: 13 }}>
                The email body, as a separate Word document. Stephen sends this verbatim.
              </span>
            </li>
          </ul>
        </Card>
      </Section>

      {/* Close */}
      <Section id="close" label="CLOSE" title="The bet">
        <Card accent={COLORS.uds}>
          <p style={{ fontSize: 16, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>
            a11oy.UDS is the bet that <span style={{ color: COLORS.uds }}>governed agency</span> is the next primitive
            the UDS surface deserves — and that we can prove it in three weeks without you having to take our word
            for any of it.
          </p>
          <p style={{ marginTop: 20, fontSize: 12, color: COLORS.sub, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
            Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
          </p>
        </Card>
        <div style={{ marginTop: 16, fontSize: 11, color: COLORS.sub }}>
          Page route: <code style={{ color: COLORS.gold }}>{linkBase}</code> · Public, no auth required.
        </div>
      </Section>
    </Layout>
  );
}

export default UdsPage;
