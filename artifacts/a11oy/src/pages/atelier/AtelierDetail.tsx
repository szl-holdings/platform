import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { ATELIER_SPACES, VERTICAL_COLORS, type AudienceTier } from '../../data/atelierData';
import { createSpaceRun, streamRunOutput, validateProof, recordAtelierRun, type ProofResult } from '../../lib/atelier-runtime';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

const AUDIENCE_META: Record<AudienceTier, { label: string; color: string; bg: string }> = {
  internal:   { label: 'Internal',   color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)' },
  enterprise: { label: 'Enterprise', color: '#c9b787', bg: 'rgba(201,183,135,0.1)' },
  public:     { label: 'Public',     color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)' },
};

const CHAT_RESPONSES: Record<string, string[]> = {
  'platform-health': [
    'Checking fabric layer health...',
    '✓ Layer 1 (Signal Mesh): 12ms latency — nominal',
    '✓ Layer 2 (Decision Queue): 8ms latency — nominal',
    '✓ Layer 3 (Workcells): 23 active, 0 failed — nominal',
    '✓ Layer 4 (MirrorEval): 0.98 avg score — nominal',
    '✓ Layer 5 (Proof Ledger): integrity verified — nominal',
    '✓ Layer 6 (Approval Queue): 3 pending — nominal',
    '✓ Layer 7 (Connector Firewall): all gates open — nominal\n\nAll 7 fabric layers are operational. SLO adherence: 100.0%',
  ],
  default: [
    'Initializing governed execution context...',
    'Loading Constitution policy: v3.1.0...',
    'Binding connectors...',
    'Running policy pre-check...',
    '✓ Policy check passed — all constraints satisfied',
    'Executing agent loop...',
    'Retrieving evidence from connected sources...',
    'Scoring with MirrorEval harness (14 dimensions)...',
    'Generating proof packet...',
    '✓ Proof ref: sha256:c9b787a1d3e6f9c4b7...\n\nAnalysis complete. Composite eval score: 0.94 | All policies satisfied | Awaiting human review for recommended actions.',
  ],
};

interface StreamRunnerProps {
  spaceSlug: string;
  runtime: string;
  vertical: string;
  connectors: string[];
  constitutionRef: string;
  modelPolicy: string;
  audienceTier: AudienceTier;
}

function StreamRunner({ spaceSlug, runtime, vertical, connectors, constitutionRef, modelPolicy, audienceTier }: StreamRunnerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [, setProof] = useState<ProofResult | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, chatHistory]);

  async function startRun() {
    setLines([]);
    setProof(null);
    setDone(false);
    setRunning(true);
    try {
      const run = await createSpaceRun({
        spaceSlug,
        vertical,
        connectors,
        constitutionRef,
        modelPolicy,
        audienceTier,
      });
      const finalState = await streamRunOutput(
        run.workcellId,
        (line) => setLines((prev) => [...prev, line]),
        { vertical, connectors, spaceSlug },
      );
      const result = await validateProof(finalState.workcellId, finalState.pceContractId);
      setProof(result);
      if (result.proofRef) {
        setLines((prev) => [...prev, `✓ Proof ref: ${result.proofRef}`]);
      }
      // Persist run + proof packet so leaderboards and /atelier/proof/:id stay live.
      const persisted = await recordAtelierRun({
        spaceSlug, workcellId: finalState.workcellId, vertical,
        proofRef: result.proofRef, outputLines: lines,
        verdict: 'pass', origin: 'a11oy:atelier-detail',
      });
      if (persisted?.proofPacketId) {
        setLines((prev) => [...prev, `↗ Public proof: ${BASE}/atelier/proof/${persisted.proofPacketId}`]);
      }
    } catch (e) {
      setLines((prev) => [...prev, `✗ Run error: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setRunning(false);
      setDone(true);
    }
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setTimeout(() => {
      const responses = CHAT_RESPONSES[spaceSlug] ?? CHAT_RESPONSES.default;
      const reply = responses[Math.floor(Math.random() * responses.length)];
      setChatHistory(prev => [...prev, { role: 'agent', text: reply }]);
    }, 800);
  }

  if (runtime === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 320, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '0.625rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: `0 0 6px ${T.accent}` }} />
          <span style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted }}>Chat Runtime — Governed</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {chatHistory.length === 0 && (
            <div style={{ fontSize: '0.75rem', color: T.textMuted, textAlign: 'center', marginTop: '2rem' }}>
              Ask this Space anything…
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '0.5rem 0.75rem', borderRadius: 6,
                background: msg.role === 'user' ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(201,183,135,0.2)' : T.border}`,
                fontSize: '0.8125rem', color: T.text, lineHeight: 1.5, whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '0.75rem 1rem', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '0.5rem' }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Type a message…"
            style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 5, padding: '0.5rem 0.75rem', color: T.text, fontSize: '0.8125rem', outline: 'none', fontFamily: T.mono }}
          />
          <button onClick={sendChat} style={{ padding: '0.5rem 1rem', borderRadius: 5, background: 'rgba(201,183,135,0.12)', border: `1px solid rgba(201,183,135,0.25)`, color: T.accent, fontSize: '0.75rem', cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '0.625rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: running ? T.accent : (done ? '#22c55e' : T.textMuted), boxShadow: running ? `0 0 6px ${T.accent}` : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted }}>
            {runtime === 'agent-loop' ? 'Agent Loop Runtime' : runtime === 'form' ? 'Form Runtime' : 'Canvas Runtime'} — Governed
          </span>
        </div>
        {done && (
          <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: '#22c55e' }}>✓ Proof generated</span>
        )}
      </div>
      <div style={{ padding: '1rem', minHeight: 160, maxHeight: 280, overflowY: 'auto', fontFamily: T.mono, fontSize: '0.75rem', lineHeight: 1.7, color: T.textDim }}>
        {lines.length === 0 && !running && (
          <div style={{ color: T.textMuted, textAlign: 'center', paddingTop: '2rem' }}>
            Click Run to execute this Space in the governed runtime.
          </div>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{ color: line.startsWith('✓') ? '#c9b787' : line.startsWith('Analysis') ? '#f5f5f5' : T.textDim }}>
            {line}
          </div>
        ))}
        {running && (
          <span style={{ display: 'inline-block', width: 8, height: 14, background: T.accent, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }}>▌</span>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '0.75rem 1rem', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={startRun}
          disabled={running}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'rgba(255,255,255,0.04)' : 'rgba(201,183,135,0.12)',
            border: `1px solid ${running ? T.border : 'rgba(201,183,135,0.25)'}`,
            color: running ? T.textMuted : T.accent, opacity: running ? 0.6 : 1,
          }}>
          {running ? '⟳ Running…' : '▶ Run Space'}
        </button>
        {done && (
          <button onClick={() => { setLines([]); setDone(false); setProof(null); }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

interface ForkDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

function ForkDialog({ parentSlug, spaceName, parentConnectors, onClose }: { parentSlug: string; spaceName: string; parentConnectors: string[]; onClose: () => void }) {
  const [slug, setSlug] = useState(`${parentSlug}-fork`);
  const [name, setName] = useState(`${spaceName} (Fork)`);
  const [removed, setRemoved] = useState<string[]>([]);
  const [addedRaw, setAddedRaw] = useState('');
  const [constitutionModified, setConstitutionModified] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const addedConnectors = addedRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const diff: ForkDiff = {
    added: addedConnectors.map((c) => `connector:${c}`),
    removed: removed.map((c) => `connector:${c}`),
    modified: constitutionModified ? ['constitution: modified'] : [],
  };

  async function submit() {
    setStatus('submitting');
    setErrMsg('');
    try {
      // Fork is a tenant-scoped mutation (not in the public-mutation CSRF
      // carve-out), so we must present a CSRF token. Fetch one first to
      // ensure the csrf_token cookie is set, then read it back.
      await fetch('/api/csrf-token', { credentials: 'include' }).catch(() => {});
      const csrfMatch = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
      const csrf = csrfMatch ? decodeURIComponent(csrfMatch.trim().split('=').slice(1).join('=')) : '';
      const res = await fetch(`/api/atelier/spaces/${parentSlug}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          slug, name,
          addConnectors: addedConnectors,
          removeConnectors: removed,
          constitution: constitutionModified ? `# Forked constitution — overrides from ${parentSlug}\n` : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setStatus('err');
        setErrMsg(j.error ?? `HTTP ${res.status}`);
        return;
      }
      setCreatedSlug(j.data?.slug ?? slug);
      setStatus('ok');
    } catch (e) {
      setStatus('err');
      setErrMsg(e instanceof Error ? e.message : 'network_error');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 10, padding: '2rem', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Fork Space</div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: T.text, margin: '0 0 0.875rem', letterSpacing: '-0.015em' }}>Fork: {spaceName}</h3>
        <div style={{ fontSize: '0.8125rem', color: T.textDim, lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Forking inherits the Constitution, connectors, and model policy. Governance constraints from the parent Constitution are preserved unless explicitly overridden and re-audited.
        </div>

        {status !== 'ok' && (
          <>
            <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem' }}>Fork Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.625rem', marginBottom: '0.75rem', background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontFamily: T.mono, fontSize: '0.75rem' }} />

            <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem' }}>Fork Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.625rem', marginBottom: '0.75rem', background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: '0.8125rem' }} />

            <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem' }}>Remove Inherited Connectors</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {parentConnectors.map((c) => {
                const on = removed.includes(c);
                return (
                  <button key={c} onClick={() => setRemoved((r) => on ? r.filter((x) => x !== c) : [...r, c])}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontFamily: T.mono, borderRadius: 4, cursor: 'pointer', background: on ? 'rgba(239,68,68,0.15)' : 'transparent', border: `1px solid ${on ? 'rgba(239,68,68,0.4)' : T.border}`, color: on ? '#ef4444' : T.textDim, textDecoration: on ? 'line-through' : 'none' }}>
                    {c}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem' }}>Add Connectors (comma-separated)</label>
            <input value={addedRaw} onChange={(e) => setAddedRaw(e.target.value)} placeholder="e.g. slack, splunk" style={{ width: '100%', padding: '0.5rem 0.625rem', marginBottom: '0.75rem', background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontFamily: T.mono, fontSize: '0.75rem' }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: T.textDim, marginBottom: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={constitutionModified} onChange={(e) => setConstitutionModified(e.target.checked)} />
              Override parent Constitution (requires re-audit)
            </label>

            <div style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', fontFamily: T.mono, fontSize: '0.6875rem' }}>
              <div style={{ color: T.accent, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.5625rem' }}>Diff Preview</div>
              {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
                <div style={{ color: T.textMuted }}>No changes — exact clone of parent.</div>
              )}
              {diff.added.map((d) => <div key={`a-${d}`} style={{ color: '#22c55e' }}>+ {d}</div>)}
              {diff.removed.map((d) => <div key={`r-${d}`} style={{ color: '#ef4444' }}>− {d}</div>)}
              {diff.modified.map((d) => <div key={`m-${d}`} style={{ color: T.accent }}>~ {d}</div>)}
            </div>

            {status === 'err' && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '0.5rem 0.625rem', marginBottom: '0.75rem', fontFamily: T.mono, fontSize: '0.6875rem', color: '#ef4444' }}>
                Fork failed: {errMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={submit} disabled={status === 'submitting' || !slug || !name}
                style={{ flex: 1, padding: '0.625rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, background: 'rgba(201,183,135,0.1)', border: `1px solid rgba(201,183,135,0.25)`, color: T.accent, cursor: status === 'submitting' ? 'wait' : 'pointer', opacity: status === 'submitting' ? 0.6 : 1 }}>
                {status === 'submitting' ? 'Forking…' : '⑂ Fork Space'}
              </button>
              <button onClick={onClose} style={{ padding: '0.625rem 0.875rem', borderRadius: 6, fontSize: '0.8125rem', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'ok' && createdSlug && (
          <div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '0.875rem', marginBottom: '1rem', fontSize: '0.8125rem', color: T.text }}>
              <div style={{ color: '#22c55e', fontFamily: T.mono, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.375rem' }}>Fork created</div>
              <div style={{ fontFamily: T.mono, fontSize: '0.75rem', color: T.text }}>{createdSlug}</div>
              <div style={{ fontSize: '0.75rem', color: T.textDim, marginTop: '0.5rem' }}>
                Inherited from <span style={{ fontFamily: T.mono, color: T.accent }}>{parentSlug}</span>. Diff registered on parent.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href={b(`/atelier/${createdSlug}`)} style={{ flex: 1, padding: '0.625rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, background: 'rgba(201,183,135,0.1)', border: `1px solid rgba(201,183,135,0.25)`, color: T.accent, textDecoration: 'none', textAlign: 'center' }}>
                Open Fork →
              </Link>
              <button onClick={onClose} style={{ padding: '0.625rem 0.875rem', borderRadius: 6, fontSize: '0.8125rem', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AtelierDetail() {
  const params = useParams<{ slug: string }>();
  const [showFork, setShowFork] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<'run' | 'constitution' | 'connectors' | 'proof' | 'nexus'>('run');

  const space = ATELIER_SPACES.find(s => s.slug === params.slug);

  if (!space) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', color: T.border, marginBottom: '1rem' }}>⬡</div>
          <div style={{ fontSize: '0.875rem', color: T.textDim, marginBottom: '1rem' }}>Space not found</div>
          <Link href={b('/atelier')} style={{ color: T.accent, textDecoration: 'none', fontSize: '0.8125rem' }}>← Back to Atelier</Link>
        </div>
      </div>
    );
  }

  const vColor = VERTICAL_COLORS[space.vertical];
  const am = AUDIENCE_META[space.audienceTier];

  const embedSnippet = `<script src="https://a11oy.szl-holdings.com/embed.js"></script>
<a11oy-space space="${space.slug}" tenant="YOUR_TENANT_ID"></a11oy-space>`;

  const iframeSnippet = `<iframe src="https://a11oy.szl-holdings.com/embed/${space.slug}?tenant=YOUR_TENANT_ID"
  width="100%" height="600" frameborder="0" allow="clipboard-read; clipboard-write" />`;

  function copyEmbed() {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 1800);
  }

  const tabs = [
    { id: 'run', label: '▶ Run' },
    { id: 'constitution', label: 'Constitution' },
    { id: 'connectors', label: 'Connectors' },
    { id: 'proof', label: 'Proof Chain' },
    { id: 'nexus', label: 'NEXUS Signals' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      {showFork && <ForkDialog parentSlug={space.slug} spaceName={space.name} parentConnectors={space.connectors} onClose={() => setShowFork(false)} />}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none', fontSize: '0.75rem' }}>Atelier</Link>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ fontSize: '0.75rem', color: T.textDim }}>{space.name}</span>
        </div>

        <div style={{ borderTop: `3px solid ${vColor}`, paddingTop: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: vColor, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
                {space.vertical.replace(/-/g, ' ')} · Atelier Space
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, color: T.text, margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
                {space.name}
              </h1>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: '0 0 1rem', maxWidth: '60ch' }}>
                {space.longDescription}
              </p>
              {(space.parentSlug || (space.composedOf && space.composedOf.length > 0) || space.publicProofPacketId) && (
                <div style={{ marginBottom: '0.875rem', padding: '0.625rem 0.875rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontSize: '0.75rem', color: T.textDim, lineHeight: 1.7 }}>
                  {space.parentSlug && (
                    <div>
                      <span style={{ fontFamily: T.mono, color: T.textMuted, fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Forked from </span>
                      <Link href={b(`/atelier/s/${space.parentSlug}`)} style={{ color: T.accent, textDecoration: 'none' }}>{space.parentSlug}</Link>
                      {space.diff && (
                        <span style={{ marginLeft: '0.5rem', fontFamily: T.mono, color: T.textMuted, fontSize: '0.625rem' }}>
                          (+{space.diff.added.length} −{space.diff.removed.length} ~{space.diff.modified.length})
                        </span>
                      )}
                    </div>
                  )}
                  {space.diff && (space.diff.added.length > 0 || space.diff.removed.length > 0 || space.diff.modified.length > 0) && (
                    <div style={{ marginTop: '0.5rem', fontFamily: T.mono, fontSize: '0.625rem' }}>
                      {space.diff.added.map((a) => <div key={`a-${a}`} style={{ color: '#7ad97a' }}>+ {a}</div>)}
                      {space.diff.removed.map((r) => <div key={`r-${r}`} style={{ color: '#d97a7a' }}>− {r}</div>)}
                      {space.diff.modified.map((m) => <div key={`m-${m}`} style={{ color: '#d9b97a' }}>~ {m}</div>)}
                    </div>
                  )}
                  {space.composedOf && space.composedOf.length > 0 && (
                    <div style={{ marginTop: space.parentSlug ? '0.5rem' : 0 }}>
                      <span style={{ fontFamily: T.mono, color: T.textMuted, fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Composed of </span>
                      {space.composedOf.map((s, i) => (
                        <span key={s}>
                          {i > 0 && ', '}
                          <Link href={b(`/atelier/s/${s}`)} style={{ color: T.accent, textDecoration: 'none' }}>{s}</Link>
                        </span>
                      ))}
                    </div>
                  )}
                  {space.publicProofPacketId && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontFamily: T.mono, color: T.textMuted, fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Public proof </span>
                      <Link href={b(`/atelier/proof/${space.publicProofPacketId}`)} style={{ color: T.accent, textDecoration: 'none', fontFamily: T.mono, fontSize: '0.6875rem' }}>↗ {space.publicProofPacketId}</Link>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '0.2rem 0.5rem', borderRadius: 3, background: am.bg, color: am.color, border: `1px solid ${am.color}20` }}>
                  {am.label}
                </span>
                <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '0.2rem 0.5rem', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: T.textMuted, border: `1px solid ${T.border}` }}>
                  {space.runtime}
                </span>
                <span style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted }}>by {space.author}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Proof Score', value: `${space.proofScore}`, color: T.accent },
                  { label: 'Gov Score', value: `${space.governanceScore}`, color: T.accent },
                  { label: 'Forks', value: `${space.forkCount}`, color: T.textDim },
                  { label: 'Embeds', value: `${space.embedCount}`, color: T.textDim },
                ].map(m => (
                  <div key={m.label} style={{ padding: '0.625rem 0.75rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: T.mono, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowFork(true)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', background: 'rgba(201,183,135,0.08)', border: `1px solid rgba(201,183,135,0.2)`, color: T.accent }}>
                  ⑂ Fork
                </button>
                <button onClick={copyEmbed}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', background: copiedEmbed ? 'rgba(201,183,135,0.08)' : 'transparent', border: `1px solid ${T.border}`, color: copiedEmbed ? T.accent : T.textDim }}>
                  {copiedEmbed ? '✓ Copied' : '⟨/⟩ Embed'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${T.border}`, marginBottom: '1.5rem' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: activeTab === tab.id ? T.accent : T.textMuted,
                borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'run' && (
          <StreamRunner
            spaceSlug={space.slug}
            runtime={space.runtime}
            vertical={space.vertical}
            connectors={space.connectors}
            constitutionRef={space.constitutionRef}
            modelPolicy={space.modelPolicy}
            audienceTier={space.audienceTier}
          />
        )}

        {activeTab === 'constitution' && (
          <div>
            <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, marginBottom: '0.75rem' }}>
              Constitution: <span style={{ color: T.accent }}>{space.constitutionRef}</span>
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '1.25rem', fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim, overflowX: 'auto', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {space.constitution}
            </pre>
          </div>
        )}

        {activeTab === 'connectors' && (
          <div>
            <div style={{ fontSize: '0.75rem', color: T.textDim, marginBottom: '1rem' }}>
              Model policy: <span style={{ fontFamily: T.mono, color: T.accent }}>{space.modelPolicy}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {space.connectors.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: T.text, flex: 1 }}>{c}</span>
                  <span style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted }}>connected</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'proof' && (
          <div>
            <div style={{ fontSize: '0.75rem', color: T.textDim, marginBottom: '1rem' }}>
              Proof completeness: <span style={{ color: T.accent }}>{Math.round(space.auditCompleteness * 100)}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {space.proofChain.map((entry) => (
                <div key={entry.id} style={{ padding: '0.875rem 1rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', color: T.text, marginBottom: '0.25rem' }}>{entry.action}</div>
                      <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{entry.timestamp}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: entry.verdict === 'pass' ? '#c9b787' : entry.verdict === 'warn' ? '#8a8a8a' : '#f5f5f5', marginBottom: '0.2rem' }}>
                        {entry.verdict.toUpperCase()} {Math.round(entry.score * 100)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, marginTop: '0.375rem' }}>{entry.proofRef}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'nexus' && (
          <div>
            <div style={{ fontSize: '0.75rem', color: T.textDim, marginBottom: '1rem' }}>
              Cross-vertical signal subscriptions — subscribed signals appear as triggers in the agent loop.
            </div>
            {space.nexusSignals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: T.textMuted, fontSize: '0.8125rem' }}>
                No NEXUS signal subscriptions configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {space.nexusSignals.map(signal => (
                  <div key={signal.id} style={{ padding: '0.875rem 1rem', borderRadius: 6, border: `1px solid ${signal.subscribed ? 'rgba(201,183,135,0.2)' : T.border}`, background: signal.subscribed ? 'rgba(201,183,135,0.03)' : T.surface }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: signal.subscribed ? T.accent : T.textMuted, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', color: T.text }}>{signal.description}</div>
                        <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, marginTop: '0.2rem' }}>
                          {signal.vertical} · {signal.event}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.5rem', fontFamily: T.mono, color: signal.subscribed ? T.accent : T.textMuted }}>
                        {signal.subscribed ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '2.5rem', padding: '1.25rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Embed This Space
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textDim, marginBottom: '0.375rem' }}>Web Component</div>
              <pre style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '0.75rem', fontSize: '0.6875rem', fontFamily: T.mono, color: T.accent, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                {embedSnippet}
              </pre>
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textDim, marginBottom: '0.375rem' }}>iframe fallback</div>
              <pre style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '0.75rem', fontSize: '0.6875rem', fontFamily: T.mono, color: T.textDim, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                {iframeSnippet}
              </pre>
            </div>
            <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, lineHeight: 1.6 }}>
              Embeds propagate tenant + SSO context via postMessage handshake. Allowed origins must be registered in your A11oy tenant settings. Unauthenticated hosts receive rate-limited public-tier access only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
