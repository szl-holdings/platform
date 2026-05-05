import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusPill, ActionButton,
  CodeBlock, EmptyState, ProgressBar, InfoRow, VerdictBadge,
} from '../components/ui';

const API = '/api/a11oy/forge';

interface MirrorEvalDimension {
  id: string; label: string; score: number; threshold: number; passed: boolean;
}
interface MirrorEvalReport {
  evalId: string; composite: number; disposition: 'pass' | 'pass_with_warning' | 'blocked';
  dimensions: MirrorEvalDimension[]; flags: string[]; evaluatedAt: string;
}
interface CovenantReport {
  checkId: string; passed: boolean; excessiveToolAccess: boolean; bypassesGovernance: boolean;
  scopeViolations: string[]; declaredApprovalTier: string; inferredApprovalTier: string; evaluatedAt: string;
}
interface CapabilityCertificate {
  certificateId: string; schemaVersion: string; skillId: string; skillVersion: string;
  contentHash: string; mirrorEval: MirrorEvalReport; covenant: CovenantReport;
  pceGate: {
    approved: boolean; contractId: string; approvedAt: string; blockedReason?: string;
    bindings: { mirrorEvalId: string; covenantCheckId: string };
  };
  evaluator: {
    identity: string; platform: string;
    publicKeyFingerprint: string; publicKeyAlgorithm: 'Ed25519'; publicKeyJwksUrl: string;
  };
  signature: {
    algorithm: 'Ed25519'; publicKeyFingerprint: string;
    canonicalPayloadHash: string; value: string;
  };
  trustLevel: 'unverified' | 'sandboxed' | 'governed' | 'sovereign';
  issuedAt: string; expiresAt: string;
}
interface ForgeMeta {
  id: string; name: string; slug: string; domain: string; description: string;
  requiredTools: string[]; blockedTools: string[];
  requiredApprovalTier: 'auto' | 'operator' | 'executive' | 'board';
  declaredScope: string; author: string; version: string;
}
interface ForgeSkill {
  meta: ForgeMeta; skillMd: string; certificate?: CapabilityCertificate;
  status: 'draft' | 'evaluated' | 'published' | 'blocked';
  trustLevel: 'unverified' | 'sandboxed' | 'governed' | 'sovereign';
  usage: { consumedBy: number; runs: number; avgScore: number };
  versionHistory: Array<{ version: string; certificateId?: string; publishedAt: string }>;
  createdAt: string; updatedAt: string;
}
interface ListResponse {
  skills: ForgeSkill[];
  summary: {
    total: number; published: number; sovereign: number; governed: number;
    sandboxed: number; blocked: number; domains: string[];
  };
}

const DOMAIN_LABELS: Record<string, string> = {
  maritime: 'Maritime',
  legal: 'Legal',
  cyber: 'Cyber',
  'real-estate': 'Real Estate',
  defense: 'Defense',
  finance: 'Finance',
  general: 'General',
};

const TRUST_COLORS: Record<string, string> = {
  sovereign: '#c9b787',
  governed: '#b08d52',
  sandboxed: '#8a8a8a',
  unverified: '#5e5e5e',
};

function TrustPill({ trust }: { trust: ForgeSkill['trustLevel'] }) {
  const c = TRUST_COLORS[trust];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono uppercase"
      style={{ backgroundColor: `${c}18`, color: c, border: `1px solid ${c}40` }}>
      ◇ {trust}
    </span>
  );
}

const DEFAULT_TEMPLATE = {
  name: 'Vendor Risk Synth Brief',
  domain: 'finance',
  description: 'Synthesizes vendor SLA performance, sanctions screening, and supply concentration into a procurement risk brief.',
  requiredTools: 'vendor_score, sla_monitor, sanctions_check',
  blockedTools: 'vendor_delist, contract_terminate, payment_block',
  requiredApprovalTier: 'executive' as const,
  declaredScope: 'Read-only vendor risk analysis. Drafts brief; never modifies vendor records or executes payments.',
  author: 'forge.author',
  version: '0.1.0',
  body: `Aggregate active vendor SLA performance over the last 90 days. For each vendor, run sanctions screening on the legal entity and beneficial owners. Compute supply concentration risk for any vendor accounting for >25% of category spend.

Produce a procurement risk brief with:
- top 5 at-risk vendors with cited SLA breach evidence
- any sanctions hits (escalate immediately)
- recommended secondary-vendor onboarding actions

Failure mode: if sanctions data is unavailable, flag for manual compliance review and do not produce a final brief.`,
};

function SkillRegistry({ skills, summary, onSelect, selectedId }: {
  skills: ForgeSkill[]; summary: ListResponse['summary'];
  onSelect: (s: ForgeSkill) => void; selectedId?: string;
}) {
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [trustFilter, setTrustFilter] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const q = query.trim().toLowerCase();
  const filtered = skills.filter((s) => {
    if (domainFilter !== 'all' && s.meta.domain !== domainFilter) return false;
    if (trustFilter !== 'all' && s.trustLevel !== trustFilter) return false;
    if (!q) return true;
    return (
      s.meta.name.toLowerCase().includes(q)
      || s.meta.slug.toLowerCase().includes(q)
      || s.meta.domain.toLowerCase().includes(q)
      || s.meta.description.toLowerCase().includes(q)
      || s.meta.author.toLowerCase().includes(q)
      || s.meta.requiredTools.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KpiCard label="CERTIFIED" value={String(summary.published)} sub="FORGE-issued" accent="#c9b787" />
        <KpiCard label="SOVEREIGN" value={String(summary.sovereign)} sub="Top-tier trust" accent="#c9b787" />
        <KpiCard label="GOVERNED" value={String(summary.governed)} sub="Standard trust" accent="#b08d52" />
        <KpiCard label="SANDBOXED" value={String(summary.sandboxed)} sub="Warnings present" accent="#8a8a8a" />
        <KpiCard label="DOMAINS" value={String(summary.domains.length)} sub="Vertical packs" accent="#8a8a8a" />
      </div>

      <div className="mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills by name, slug, domain, tool, or author…"
          className="w-full text-xs px-3 py-2 rounded outline-none"
          style={{
            backgroundColor: 'var(--color-a11oy-muted)',
            color: 'var(--color-a11oy-text)',
            border: '1px solid var(--color-a11oy-border)',
          }}
        />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Domain:</span>
        {['all', ...summary.domains].map((d) => (
          <button key={d} onClick={() => setDomainFilter(d)}
            className="text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: domainFilter === d ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: domainFilter === d ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${domainFilter === d ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}`,
            }}>
            {d === 'all' ? 'all' : (DOMAIN_LABELS[d] ?? d)}
          </button>
        ))}
        <span className="text-xs ml-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Trust:</span>
        {['all', 'sovereign', 'governed', 'sandboxed', 'unverified'].map((t) => (
          <button key={t} onClick={() => setTrustFilter(t)}
            className="text-xs px-2 py-0.5 rounded uppercase"
            style={{
              backgroundColor: trustFilter === t ? `${TRUST_COLORS[t] ?? '#5e5e5e'}22` : 'var(--color-a11oy-muted)',
              color: trustFilter === t ? (TRUST_COLORS[t] ?? '#5e5e5e') : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${trustFilter === t ? `${TRUST_COLORS[t] ?? '#5e5e5e'}44` : 'var(--color-a11oy-border)'}`,
            }}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState title="No FORGE skills match" description="Try another domain or trust filter." />
        : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <Card key={s.meta.id}
                className={`cursor-pointer ${selectedId === s.meta.id ? 'ring-1 ring-[#c9b787]/40' : ''}`}
                onClick={() => onSelect(s)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{s.meta.name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.12)', color: '#b08d52' }}>
                        {DOMAIN_LABELS[s.meta.domain] ?? s.meta.domain}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>v{s.meta.version}</span>
                      <TrustPill trust={s.trustLevel} />
                    </div>
                  </div>
                  <StatusPill status={s.status === 'published' ? 'LIVE' : s.status === 'blocked' ? 'ERROR' : 'GATED'} />
                </div>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.meta.description}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>composite</div>
                    <div style={{ color: '#c9b787' }}>{s.certificate ? `${Math.round(s.certificate.mirrorEval.composite * 100)}%` : '—'}</div>
                  </div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>consumed by</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.usage.consumedBy} skills</div>
                  </div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>runs</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.usage.runs.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

function CertificateView({ skill }: { skill: ForgeSkill }) {
  const cert = skill.certificate;
  const [exporting, setExporting] = useState(false);

  function downloadExport() {
    setExporting(true);
    fetch(`${API}/skills/${skill.meta.id}/export?download=1`)
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url; a.download = `${skill.meta.slug}-skill-pack.json`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      })
      .finally(() => setExporting(false));
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-base font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{skill.meta.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            {skill.meta.author} · v{skill.meta.version} · {DOMAIN_LABELS[skill.meta.domain] ?? skill.meta.domain}
          </div>
        </div>
        <TrustPill trust={skill.trustLevel} />
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.meta.description}</p>

      {!cert
        ? <div className="text-xs p-3 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.06)', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)' }}>
            ✗ Skill is currently blocked or unverified — no FORGE certificate has been issued.
          </div>
        : (
          <>
            <SectionTitle className="!mb-2">FORGE Capability Certificate</SectionTitle>
            <div className="mb-3">
              <InfoRow label="Certificate ID" value={cert.certificateId} mono />
              <InfoRow label="Content hash" value={<span className="break-all">{cert.contentHash}</span>} mono />
              <InfoRow label="MirrorEval composite" value={`${Math.round(cert.mirrorEval.composite * 100)}% (${cert.mirrorEval.disposition})`} />
              <InfoRow label="Covenant compliance" value={cert.covenant.passed ? '✓ passed' : `✗ ${cert.covenant.scopeViolations.join('; ')}`} />
              <InfoRow label="PCE Gate" value={cert.pceGate.approved ? `✓ approved · ${cert.pceGate.contractId}` : `✗ ${cert.pceGate.blockedReason}`} mono />
              <InfoRow label="PCE bindings" value={`mirror=${cert.pceGate.bindings.mirrorEvalId} · covenant=${cert.pceGate.bindings.covenantCheckId}`} mono />
              <InfoRow label="Evaluator" value={`${cert.evaluator.identity} · ${cert.evaluator.publicKeyAlgorithm} key:${cert.evaluator.publicKeyFingerprint}`} mono />
              <InfoRow label="Verifier JWKS" value={<a href={cert.evaluator.publicKeyJwksUrl} target="_blank" rel="noreferrer" className="break-all underline">{cert.evaluator.publicKeyJwksUrl}</a>} mono />
              <InfoRow label="Signature" value={<span className="break-all">{cert.signature.algorithm}:{cert.signature.value}</span>} mono />
              <InfoRow label="Canonical hash" value={<span className="break-all">{cert.signature.canonicalPayloadHash}</span>} mono />
              <InfoRow label="Issued" value={new Date(cert.issuedAt).toLocaleString()} />
              <InfoRow label="Expires" value={new Date(cert.expiresAt).toLocaleString()} />
            </div>

            <SectionTitle className="!mb-2">MirrorEval — 10 Dimensions</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {cert.mirrorEval.dimensions.map((d) => (
                <div key={d.id} className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{d.label}</span>
                    <span className="font-mono" style={{ color: d.passed ? '#c9b787' : '#f5f5f5' }}>
                      {Math.round(d.score * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={d.score * 100} color={d.passed ? '#c9b787' : '#f5f5f5'} />
                  <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    threshold {Math.round(d.threshold * 100)}% · {d.passed ? 'pass' : 'below threshold'}
                  </div>
                </div>
              ))}
            </div>

            {cert.mirrorEval.flags.length > 0 && (
              <div className="text-xs mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: '#c9b787' }}>
                <div className="font-medium mb-1">Flags</div>
                {cert.mirrorEval.flags.map((f) => <div key={f} className="font-mono">· {f}</div>)}
              </div>
            )}

            <SectionTitle className="!mb-2">Version History</SectionTitle>
            <div className="text-xs mb-4">
              {skill.versionHistory.map((v) => (
                <div key={v.version + v.publishedAt} className="flex items-center gap-3 py-1 border-b" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <span className="font-mono" style={{ color: '#c9b787' }}>v{v.version}</span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(v.publishedAt).toLocaleString()}</span>
                  {v.certificateId && <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{v.certificateId}</span>}
                </div>
              ))}
            </div>

            <SectionTitle className="!mb-2">SKILL.md (HF-compatible)</SectionTitle>
            <CodeBlock language="markdown">{skill.skillMd}</CodeBlock>

            <div className="flex gap-2 mt-3">
              <ActionButton variant="primary" onClick={downloadExport} disabled={exporting}>
                {exporting ? 'Packaging…' : '↓ Export HF Skill Pack'}
              </ActionButton>
              <a href={`${API}/skills/${skill.meta.id}/export`} target="_blank" rel="noreferrer">
                <ActionButton variant="ghost">Inspect JSON</ActionButton>
              </a>
            </div>
          </>
        )}
    </Card>
  );
}

interface EvaluateResponse {
  preview: { meta: ForgeMeta; skillMd: string };
  mirrorEval: MirrorEvalReport;
  covenant: CovenantReport;
  canPublish: boolean;
}
interface PublishResponse {
  published: boolean;
  reason?: string;
  skill: ForgeSkill;
  certificate?: CapabilityCertificate;
  mirrorEval?: MirrorEvalReport;
  covenant?: CovenantReport;
}

function ForgeAuthor({ onPublished }: { onPublished: () => void }) {
  const [form, setForm] = useState(DEFAULT_TEMPLATE);
  const [evaluation, setEvaluation] = useState<EvaluateResponse | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);
  const [busy, setBusy] = useState<'evaluate' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildPayload() {
    return {
      meta: {
        name: form.name,
        domain: form.domain,
        description: form.description,
        requiredTools: form.requiredTools.split(',').map((s) => s.trim()).filter(Boolean),
        blockedTools: form.blockedTools.split(',').map((s) => s.trim()).filter(Boolean),
        requiredApprovalTier: form.requiredApprovalTier,
        declaredScope: form.declaredScope,
        author: form.author,
        version: form.version,
      },
      body: form.body,
    };
  }

  async function evaluate() {
    setBusy('evaluate'); setError(null); setPublishResult(null);
    try {
      const res = await fetch(`${API}/skills/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`Evaluate failed: HTTP ${res.status}`);
      setEvaluation(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function publish() {
    setBusy('publish'); setError(null);
    try {
      const res = await fetch(`${API}/skills/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer forge-publisher-demo',
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`Publish failed: HTTP ${res.status}`);
      const data: PublishResponse = await res.json();
      setPublishResult(data);
      if (data.published) onPublished();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <SectionTitle>Skill Authoring</SectionTitle>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Domain
            <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }}>
              {Object.entries(DOMAIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs col-span-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Description
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
          <label className="text-xs col-span-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Declared scope (covenant input)
            <input value={form.declaredScope} onChange={(e) => setForm({ ...form, declaredScope: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Required tools (comma)
            <input value={form.requiredTools} onChange={(e) => setForm({ ...form, requiredTools: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: '#c9b787', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Blocked tools (comma)
            <input value={form.blockedTools} onChange={(e) => setForm({ ...form, blockedTools: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: '#f5f5f5', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Approval tier
            <select value={form.requiredApprovalTier} onChange={(e) => setForm({ ...form, requiredApprovalTier: e.target.value as typeof form.requiredApprovalTier })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }}>
              {['auto', 'operator', 'executive', 'board'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Version
            <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }} />
          </label>
        </div>

        <label className="text-xs block" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SKILL.md instructions
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={14}
            className="w-full mt-1 px-2 py-1.5 text-xs rounded font-mono"
            style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text)', border: '1px solid var(--color-a11oy-border)' }} />
        </label>

        <div className="flex gap-2 mt-3">
          <ActionButton variant="ghost" onClick={evaluate} disabled={busy !== null}>
            {busy === 'evaluate' ? 'Evaluating…' : '◎ Run MirrorEval + Covenant'}
          </ActionButton>
          <ActionButton variant="primary" onClick={publish} disabled={busy !== null}>
            {busy === 'publish' ? 'Publishing…' : '✓ Publish + Issue Certificate'}
          </ActionButton>
        </div>

        {error && <div className="text-xs mt-2" style={{ color: '#f5f5f5' }}>✗ {error}</div>}
      </Card>

      <div>
        {publishResult
          ? (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <SectionTitle className="!mb-0">{publishResult.published ? 'Certificate Issued' : 'Publish Blocked'}</SectionTitle>
                <VerdictBadge verdict={publishResult.published ? 'pass' : 'fail'} />
              </div>
              {publishResult.published && publishResult.certificate
                ? (
                  <>
                    <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      Skill <span className="font-mono" style={{ color: '#c9b787' }}>{publishResult.skill.meta.id}</span> published.
                      Cert <span className="font-mono" style={{ color: '#c9b787' }}>{publishResult.certificate.certificateId}</span> · trust <TrustPill trust={publishResult.certificate.trustLevel} />
                    </div>
                    <CodeBlock language="json">{JSON.stringify(publishResult.certificate, null, 2)}</CodeBlock>
                  </>
                )
                : (
                  <div className="text-xs" style={{ color: '#f5f5f5' }}>
                    <div className="mb-2">✗ Reason: <span className="font-mono">{publishResult.reason}</span></div>
                    {publishResult.mirrorEval && publishResult.mirrorEval.flags.length > 0 && (
                      <div className="mb-2">
                        <div className="font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>MirrorEval flags</div>
                        {publishResult.mirrorEval.flags.map((f) => <div key={f} className="font-mono">· {f}</div>)}
                      </div>
                    )}
                    {publishResult.covenant && publishResult.covenant.scopeViolations.length > 0 && (
                      <div>
                        <div className="font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>Covenant violations</div>
                        {publishResult.covenant.scopeViolations.map((f) => <div key={f} className="font-mono">· {f}</div>)}
                      </div>
                    )}
                  </div>
                )}
            </Card>
          )
          : evaluation
            ? (
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <SectionTitle className="!mb-0">Evaluation Preview</SectionTitle>
                  <VerdictBadge verdict={evaluation.canPublish ? 'pass' : evaluation.mirrorEval.disposition === 'blocked' ? 'fail' : 'warn'} />
                </div>
                <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  Composite <span className="font-mono" style={{ color: '#c9b787' }}>{Math.round(evaluation.mirrorEval.composite * 100)}%</span>
                  {' · '}Covenant {evaluation.covenant.passed ? '✓' : '✗'}
                  {' · '}{evaluation.canPublish ? 'Ready to publish' : 'Will be blocked at publish'}
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mb-3">
                  {evaluation.mirrorEval.dimensions.map((d) => (
                    <div key={d.id} className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{d.label}</span>
                        <span className="font-mono" style={{ color: d.passed ? '#c9b787' : '#f5f5f5' }}>
                          {Math.round(d.score * 100)}%
                        </span>
                      </div>
                      <ProgressBar value={d.score * 100} color={d.passed ? '#c9b787' : '#f5f5f5'} />
                    </div>
                  ))}
                </div>
                {(evaluation.mirrorEval.flags.length > 0 || evaluation.covenant.scopeViolations.length > 0) && (
                  <div className="text-xs p-2 rounded mb-2" style={{ backgroundColor: 'rgba(245,245,245,0.05)', color: '#f5f5f5' }}>
                    {evaluation.mirrorEval.flags.map((f) => <div key={f} className="font-mono">⚠ {f}</div>)}
                    {evaluation.covenant.scopeViolations.map((f) => <div key={`c-${f}`} className="font-mono">⚠ covenant: {f}</div>)}
                    {evaluation.covenant.excessiveToolAccess && <div className="font-mono">⚠ covenant: excessive_tool_access</div>}
                    {evaluation.covenant.bypassesGovernance && <div className="font-mono">⚠ covenant: bypasses_governance</div>}
                  </div>
                )}
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Inferred approval tier: <span className="font-mono">{evaluation.covenant.inferredApprovalTier}</span> ·
                  declared: <span className="font-mono">{evaluation.covenant.declaredApprovalTier}</span>
                </div>
              </Card>
            )
            : <EmptyState icon="◇" title="No evaluation yet" description="Run MirrorEval + Covenant to preview scores before issuing a certificate." />}
      </div>
    </div>
  );
}

export default function SkillForge() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [tab, setTab] = useState<'registry' | 'forge' | 'detail'>('registry');
  const [selected, setSelected] = useState<ForgeSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API}/skills`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: ListResponse = await r.json();
      setData(j);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const summary = useMemo(() => data?.summary ?? { total: 0, published: 0, sovereign: 0, governed: 0, sandboxed: 0, blocked: 0, domains: [] }, [data]);

  return (
    <Layout>
      <PageHeader
        label="A11OY · FORGE"
        title="Proof-Carrying Agent Skills"
        subtitle="A FORGE-certified skill marketplace. Every published skill ships with a Capability Certificate — MirrorEval scores, covenant compliance, PCE Gate approval, evaluator identity, and a content hash. HF-compatible export."
        status="LIVE"
      />

      <div className="flex items-center gap-2 mb-5 border-b" style={{ borderColor: 'var(--color-a11oy-border)' }}>
        {[
          { id: 'registry' as const, label: `Registry (${summary.total})` },
          { id: 'forge' as const, label: 'Skill Forge — Author + Evaluate' },
          { id: 'detail' as const, label: selected ? `Detail · ${selected.meta.name}` : 'Detail', disabled: !selected },
        ].map((t) => (
          <button key={t.id}
            disabled={'disabled' in t && t.disabled}
            onClick={() => setTab(t.id)}
            className="text-xs px-3 py-2 -mb-px"
            style={{
              color: tab === t.id ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              borderBottom: tab === t.id ? '2px solid #c9b787' : '2px solid transparent',
              opacity: ('disabled' in t && t.disabled) ? 0.4 : 1,
              cursor: ('disabled' in t && t.disabled) ? 'not-allowed' : 'pointer',
              background: 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading FORGE registry…</div>}
      {error && <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.05)', color: '#f5f5f5' }}>✗ {error}</div>}

      {!loading && !error && data && (
        <>
          {tab === 'registry' && (
            <SkillRegistry skills={data.skills} summary={data.summary}
              selectedId={selected?.meta.id}
              onSelect={(s) => { setSelected(s); setTab('detail'); }} />
          )}
          {tab === 'forge' && <ForgeAuthor onPublished={() => { refresh(); setTab('registry'); }} />}
          {tab === 'detail' && selected && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><CertificateView skill={selected} /></div>
              <div>
                <SectionTitle>Manifest</SectionTitle>
                <Card>
                  <InfoRow label="Skill ID" value={selected.meta.id} mono />
                  <InfoRow label="Slug" value={selected.meta.slug} mono />
                  <InfoRow label="Author" value={selected.meta.author} />
                  <InfoRow label="Approval tier" value={selected.meta.requiredApprovalTier} mono />
                  <InfoRow label="Required tools" value={
                    <div className="flex flex-wrap gap-1">
                      {selected.meta.requiredTools.map((t) => (
                        <span key={t} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>{t}</span>
                      ))}
                    </div>
                  } />
                  <InfoRow label="Blocked tools" value={
                    <div className="flex flex-wrap gap-1">
                      {selected.meta.blockedTools.map((t) => (
                        <span key={t} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.06)', color: '#f5f5f5' }}>{t}</span>
                      ))}
                    </div>
                  } />
                  <InfoRow label="Declared scope" value={selected.meta.declaredScope} />
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" />
        Every published skill carries a FORGE Capability Certificate — MirrorEval scores across 10 dimensions, covenant compliance verdict, PCE Gate approval, evaluator identity, signature, and SHA-256 content hash. Out of scope here: actual HF Hub publishing, cross-tenant sharing, monetization.
      </div>
    </Layout>
  );
}
