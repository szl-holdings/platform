const GOLD = '#c9b787';

const INNOVATIONS = [
  {
    id: 'covenant-hash',
    title: 'I. Covenant Hash',
    subtitle: 'SHA-256(content ∥ policy ∥ actor ∥ tenant ∥ doctrine_revision ∥ timestamp)',
    description: `Every artifact stored in the Reliquary carries two cryptographic identities: a content hash (SHA-256 of raw bytes) and a covenant hash that binds the content to the governance context in which it was created. No two covenant hashes are ever alike — even if two actors store identical model weights, the covenant hash records who authorized it, under which policy, at which doctrine revision, and when.`,
    regulatory: 'EU AI Act Art. 12 (Technical Documentation) — requires traceability of training data, model versions, and system configurations across the full AI lifecycle.',
    nist: 'NIST AI RMF GOVERN 1.1 — policies and procedures for AI risk management must be documented and traceable.',
    color: '#60a5fa',
    icon: '⟨⟩',
  },
  {
    id: 'lineage-graph',
    title: 'II. Lineage Graph',
    subtitle: 'Directed acyclic provenance DAG from primitive inputs to final outputs',
    description: `The Reliquary maintains a directed acyclic graph connecting every artifact to its parents and children. A compliance briefing traces back through the agent that produced it, the model revision the agent invoked, the prompt template that governed its behavior, the dataset the agent retrieved from, and the embeddings that indexed that dataset — five levels of verifiable ancestry, each carrying a proof receipt.`,
    regulatory: 'EU AI Act Art. 13 (Transparency) — end-users and deployers must be able to understand system capabilities and lineage of AI-generated content.',
    nist: 'NIST AI RMF MAP 1.6 — AI risk context includes data lineage and provenance, including training and evaluation data sources.',
    color: '#34d399',
    icon: '⊸',
  },
  {
    id: 'glasswing-snapshots',
    title: 'III. Glasswing Snapshots',
    subtitle: 'Deterministic, content-addressed, time-frozen governance manifests',
    description: `A Glasswing Snapshot is a content-addressed manifest that pins the exact state of an entire decision context — model revision, prompt version, dataset hash, agent definition, active policy, and doctrine revision — at a single instant. The manifest itself is SHA-256 hashed, making any tampering immediately detectable. An auditor can reconstruct the complete governance state years after a decision was made.`,
    regulatory: 'EU AI Act Art. 12(c) — technical documentation must include the computational resources used and the results of any tests performed.',
    nist: 'NIST AI RMF MEASURE 2.6 — the AI system and its components are evaluated for performance across its lifecycle.',
    color: '#a78bfa',
    icon: '◈',
  },
  {
    id: 'sovereign-mode',
    title: 'IV. Sovereign Mode',
    subtitle: 'Air-gap enforcement: offline doctrine-only execution, zero cloud dependency',
    description: `Sovereign Mode is a governance-gated toggle that places the entire platform in an air-gapped posture. When active, all network fetches are disabled, and only artifact revisions whose complete covenant chain is resolved on local disk are accessible. Operators in regulated environments — defense contractors, financial institutions under data residency rules, clinical AI deployments — can invoke Sovereign Mode to guarantee that no model call, no dataset fetch, and no agent invocation escapes the physical boundary.`,
    regulatory: 'EU AI Act Art. 9 (Risk Management) — high-risk AI systems must operate within documented risk boundaries, including data residency constraints.',
    nist: 'NIST AI RMF GOVERN 6.1 — policies and procedures are in place to address AI risks and benefits to employees and other third parties.',
    color: '#ef4444',
    icon: '⊕',
  },
  {
    id: 'cryptographic-attestation',
    title: 'V. Cryptographic Cache Attestation',
    subtitle: 'Merkle-root proof of cache integrity, persisted to the Proof Ledger',
    description: `At any time, an operator can trigger a cache attestation: the Reliquary sorts all content hashes lexicographically, computes a Merkle tree, and persists the root to the Proof Ledger alongside the ordered hash array. Months later, an auditor can recompute the root from the archived hashes and confirm that the cache was not modified between the attestation and today. This is the same cryptographic mechanism used in certificate transparency logs and blockchain anchoring.`,
    regulatory: 'EU AI Act Art. 12(a) — technical documentation must include a general description of the AI system and its intended purpose, supported by audit evidence.',
    nist: 'NIST AI RMF MEASURE 2.9 — the AI system to be deployed satisfies its design specifications and applicable regulations, standards, and guidelines.',
    color: GOLD,
    icon: '⌥',
  },
  {
    id: 'time-travel',
    title: 'VI. Time-Travel Queries',
    subtitle: 'Rehydrate any historical governance context from covenant hash alone',
    description: `Because every artifact is content-addressed, and every covenant hash encodes the full governance provenance context, any artifact can be precisely reconstructed at any future point. Given a covenant hash from a proof receipt issued two years ago, the Reliquary can retrieve the exact bytes, verify their integrity, reconstruct the lineage graph, and replay the original decision — with the original model, original prompt, and original dataset — without any special archival process.`,
    regulatory: 'EU AI Act Art. 12(d) — logs of the functioning of the AI system with time stamps enabling the identification of events, including errors or adverse impacts.',
    nist: 'NIST AI RMF GOVERN 4.1 — organizational teams are committed to a culture that includes AI risk awareness, root-cause analysis, and continuous improvement.',
    color: '#fb923c',
    icon: '↺',
  },
  {
    id: 'cross-artifact-dedup',
    title: 'VII. Cross-Artifact Symlink Deduplication',
    subtitle: 'Content equality across tenants and domains is detected and stored once',
    description: `If two tenants store identical model weights, the Reliquary stores the bytes exactly once (keyed by content hash) while maintaining separate covenant-hash records with distinct governance provenance. This symlink-style deduplication compresses storage footprint across the multi-tenant platform without compromising provenance isolation: each tenant's covenant record is independent, auditable, and tied to their specific policy context.`,
    regulatory: 'EU AI Act Art. 9(5) — risk management measures must be commensurate with risks identified through the lifecycle of the AI system.',
    nist: 'NIST AI RMF MAP 5.1 — likelihood and magnitude of each identified impact based on assumptions about the deployment context is assessed.',
    color: '#f472b6',
    icon: '⊗',
  },
];

export function ReliquaryDoctrine() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ padding: '3rem 2rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: GOLD, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
            Reliquary · Mythos Doctrine
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9', margin: '0 0 16px', lineHeight: 1.2 }}>
            Seven Innovations of the<br />Provenance-Bound Cache
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
            The Reliquary is not a cache. It is a cryptographic memory — every artifact bound to the
            policy that authorized its creation, the actor who requested it, and the doctrine that
            governed its use. What follows are the seven architectural innovations that make
            AI governance auditable by construction.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '14px 20px', background: '#111', border: '1px solid #1e293b', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Regulatory Anchors</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'EU AI Act Art. 12', desc: 'Technical Documentation & Record-Keeping' },
              { label: 'EU AI Act Art. 13', desc: 'Transparency & Explainability' },
              { label: 'NIST AI RMF', desc: 'GOVERN · MAP · MEASURE · MANAGE' },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {INNOVATIONS.map((inn, idx) => (
            <div
              key={inn.id}
              style={{
                background: '#111',
                border: '1px solid #1e293b',
                borderLeft: `4px solid ${inn.color}`,
                borderRadius: 8,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: `${inn.color}18`, border: `1px solid ${inn.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: inn.color, flexShrink: 0,
                }}>
                  {inn.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>{inn.title}</h2>
                  <div style={{ fontSize: 11, color: inn.color, fontFamily: 'monospace', letterSpacing: 0.5 }}>{inn.subtitle}</div>
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, margin: '0 0 16px' }}>
                {inn.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#0a0a0a', borderRadius: 6, padding: '10px 14px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#3b82f6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EU AI Act</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{inn.regulatory}</div>
                </div>
                <div style={{ background: '#0a0a0a', borderRadius: 6, padding: '10px 14px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#8b5cf6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>NIST AI RMF</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{inn.nist}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '20px 24px', background: '#111', border: `1px solid ${GOLD}33`, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 8 }}>Doctrine Rev 007</div>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            The seven innovations above are not features to be configured — they are properties of every artifact
            stored in the Reliquary by construction. Governance is not a layer applied after the fact;
            it is the substrate on which every inference runs.
          </p>
        </div>
      </div>
    </div>
  );
}
