import { useMemo, useState, useCallback, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge, HashId, InfoRow, ActionButton } from '../components/ui';
import { CAVD_RECORDS, partnerById, GLASSWING_PARTNERS, type CAVDStage, type CAVDRecord, type DoctrineAgentId } from '../data/hatunDoctrine';

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const CAVD_STORAGE_KEY = 'a11oy:cavd:submitted';

interface SubmittedIntake {
  advisoryId: string;
  partnerId: string;
  category: string;
  severity: string;
  agentScope: string[];
  description: string;
  findingHash: string;
  receivedAt: string;
  embargoExpiresAt: string;
  stage: CAVDStage;
}

function loadSubmitted(): SubmittedIntake[] {
  try {
    return JSON.parse(localStorage.getItem(CAVD_STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function saveSubmitted(items: SubmittedIntake[]) {
  localStorage.setItem(CAVD_STORAGE_KEY, JSON.stringify(items));
}

const STAGES: CAVDStage[] = ['intake', 'triaged', 'embargoed', 'patch-developed', 'patch-verified', 'disclosed', 'withdrawn'];

const STAGE_COLOR: Record<CAVDStage, string> = {
  intake: '#5e5e5e', triaged: '#8a8a8a', embargoed: '#c9b787',
  'patch-developed': '#c9b787', 'patch-verified': '#c9b787',
  disclosed: '#f5f5f5', withdrawn: '#5e5e5e',
};

const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);
const daysUntil = (iso: string) => Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);

export function CAVD() {
  const [stageFilter, setStageFilter] = useState<CAVDStage | 'all'>('all');
  const [selectedId, setSelectedId] = useState(CAVD_RECORDS[0].advisoryId);
  const [submitted, setSubmitted] = useState<SubmittedIntake[]>(loadSubmitted);

  const allRecords = useMemo(() => {
    const submittedAsCavd: CAVDRecord[] = submitted.map(s => ({
      advisoryId: s.advisoryId,
      category: s.category,
      severity: s.severity as CAVDRecord['severity'],
      stage: s.stage,
      agentScope: s.agentScope as DoctrineAgentId[],
      reporterPartnerId: s.partnerId,
      receivedAt: s.receivedAt,
      findingHash: s.findingHash,
      embargoExpiresAt: s.embargoExpiresAt,
      defenderCreditPaid: 0,
      notes: s.description,
    }));
    return [...CAVD_RECORDS, ...submittedAsCavd];
  }, [submitted]);

  const filtered = useMemo(() => {
    if (stageFilter === 'all') return allRecords;
    return allRecords.filter(r => r.stage === stageFilter);
  }, [stageFilter, allRecords]);

  const selected = allRecords.find(r => r.advisoryId === selectedId) ?? filtered[0] ?? allRecords[0];

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · CAVD"
        title="Coordinated Agent-Vulnerability Disclosure"
        subtitle="Hash-now / disclose-later. Default policy: 90d-or-patch. Modeled on CERT/CC, CISA, ISO/IEC 29147."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <KpiCard label="TOTAL RECORDS" value={allRecords.length} accent="#c9b787" />
        <KpiCard label="EMBARGOED" value={allRecords.filter(r => r.stage === 'embargoed').length} sub="hash anchored" accent="#c9b787" />
        <KpiCard label="PATCH-VERIFIED" value={allRecords.filter(r => r.stage === 'patch-verified').length} sub="awaiting publication" accent="#c9b787" />
        <KpiCard label="DISCLOSED" value={allRecords.filter(r => r.stage === 'disclosed').length} sub="full content public" accent="#f5f5f5" />
        <KpiCard label="DEFAULT POLICY" value="90d-or-patch" sub="whichever is sooner" accent="#c9b787" />
      </div>

      <Card className="mb-6">
        <SectionTitle>Lifecycle</SectionTitle>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button
            onClick={() => setStageFilter('all')}
            className="px-2 py-1 rounded text-xs font-mono"
            style={{
              backgroundColor: stageFilter === 'all' ? 'rgba(201,183,135,0.12)' : 'transparent',
              color: stageFilter === 'all' ? '#c9b787' : 'var(--color-a11oy-text-sub)',
              border: '1px solid var(--color-a11oy-border)', cursor: 'pointer',
            }}
          >
            ALL ({allRecords.length})
          </button>
          {STAGES.map(s => {
            const count = allRecords.filter(r => r.stage === s).length;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className="px-2 py-1 rounded text-xs font-mono uppercase"
                style={{
                  backgroundColor: stageFilter === s ? `${STAGE_COLOR[s]}22` : 'transparent',
                  color: stageFilter === s ? STAGE_COLOR[s] : 'var(--color-a11oy-text-sub)',
                  border: `1px solid ${stageFilter === s ? STAGE_COLOR[s] : 'var(--color-a11oy-border)'}`,
                  cursor: 'pointer',
                }}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      <CAVDIntakeForm onSubmit={(intake) => {
        const updated = [...submitted, intake];
        setSubmitted(updated);
        saveSubmitted(updated);
      }} nextSequence={CAVD_RECORDS.length + submitted.length + 1} />

      <EmbargoAutomation records={allRecords} />

      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {filtered.map(r => {
            const days = daysUntil(r.embargoExpiresAt);
            return (
              <button
                key={r.advisoryId}
                onClick={() => setSelectedId(r.advisoryId)}
                className="text-left rounded-lg border p-3"
                style={{
                  backgroundColor: selectedId === r.advisoryId ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                  borderColor: selectedId === r.advisoryId ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{r.advisoryId}</span>
                  <StatusBadge status={r.severity === 'critical' || r.severity === 'high' ? 'error' : r.severity === 'medium' ? 'warn' : 'info'} label={r.severity.toUpperCase()} />
                </div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.category} · {r.agentScope.join(', ')}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[r.stage]}22`, color: STAGE_COLOR[r.stage] }}>{r.stage}</span>
                  <span className="text-xs font-mono" style={{ color: days < 0 ? '#f5f5f5' : 'var(--color-a11oy-text-ghost)' }}>
                    {r.stage === 'disclosed' || r.stage === 'withdrawn' ? '—' : `T${days >= 0 ? '-' : '+'}${Math.abs(days)}d`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <CAVDDetail record={selected} />
      </div>
    </Layout>
  );
}

function CAVDIntakeForm({ onSubmit, nextSequence }: { onSubmit: (intake: SubmittedIntake) => void; nextSequence: number }) {
  const [showForm, setShowForm] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [anchoredHash, setAnchoredHash] = useState<string | null>(null);
  const [previewHash, setPreviewHash] = useState('');
  const [form, setForm] = useState({ partnerId: '', category: '', severity: 'medium', agentScope: '', description: '' });

  useEffect(() => {
    if (!form.description) { setPreviewHash(''); return; }
    let cancelled = false;
    const payload = JSON.stringify({ ...form, ts: 'preview' });
    sha256(payload).then(h => { if (!cancelled) setPreviewHash(`sha256:${h.slice(0, 16)}...${h.slice(-8)}`); });
    return () => { cancelled = true; };
  }, [form]);

  const handleSubmit = async () => {
    setAnchoring(true);
    const now = new Date();
    const receivedAt = now.toISOString();
    const payload = JSON.stringify({ ...form, ts: now.getTime() });
    const hash = await sha256(payload);
    const fullHash = `sha256:${hash}`;
    const embargo = new Date(now);
    embargo.setDate(embargo.getDate() + 90);

    const intake: SubmittedIntake = {
      advisoryId: `CAVD-${now.getFullYear()}-${String(nextSequence).padStart(4, '0')}`,
      partnerId: form.partnerId,
      category: form.category,
      severity: form.severity,
      agentScope: form.agentScope.split(',').map(s => s.trim()).filter(Boolean),
      description: form.description,
      findingHash: fullHash,
      receivedAt,
      embargoExpiresAt: embargo.toISOString(),
      stage: 'intake',
    };

    onSubmit(intake);
    setAnchoredHash(fullHash);
    setAnchoring(false);
    setTimeout(() => {
      setAnchoredHash(null);
      setShowForm(false);
      setForm({ partnerId: '', category: '', severity: 'medium', agentScope: '', description: '' });
    }, 4000);
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Intake submission</SectionTitle>
        <ActionButton variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : 'New intake'}
        </ActionButton>
      </div>
      {!showForm && !anchoredHash && (
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.7 }}>
          Submit a new agent-vulnerability finding. The finding is hash-anchored at receive time via SHA-256, placed under 90-day embargo, and dual-approved by the Glasswing partner and A11oy operations. Click "New intake" to begin.
        </p>
      )}
      {showForm && !anchoredHash && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Reporter partner</label>
            <select
              value={form.partnerId}
              onChange={e => setForm({ ...form, partnerId: e.target.value })}
              className="w-full text-xs p-2 rounded border bg-transparent"
              style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              <option value="">Select partner...</option>
              {GLASSWING_PARTNERS.filter(p => p.stage === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full text-xs p-2 rounded border bg-transparent"
              style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              <option value="">Select...</option>
              <option value="prompt-injection">prompt-injection</option>
              <option value="indirect-injection">indirect-injection</option>
              <option value="data-exfiltration">data-exfiltration</option>
              <option value="tool-misuse">tool-misuse</option>
              <option value="scope-escape">scope-escape</option>
              <option value="policy-bypass">policy-bypass</option>
              <option value="covert-channel">covert-channel</option>
              <option value="snapshot-tampering">snapshot-tampering</option>
              <option value="supply-chain">supply-chain</option>
              <option value="auth-bypass">auth-bypass</option>
              <option value="other">other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Severity</label>
            <select
              value={form.severity}
              onChange={e => setForm({ ...form, severity: e.target.value })}
              className="w-full text-xs p-2 rounded border bg-transparent"
              style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent scope</label>
            <input
              value={form.agentScope}
              onChange={e => setForm({ ...form, agentScope: e.target.value })}
              placeholder="op-cascade, op-counsel"
              className="w-full text-xs p-2 rounded border bg-transparent"
              style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Finding description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the vulnerability finding..."
              className="w-full text-xs p-2 rounded border bg-transparent resize-none"
              style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between">
            <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              SHA-256 anchor: <span style={{ color: '#c9b787' }}>{previewHash || '—'}</span>
            </span>
            <ActionButton variant="primary" size="sm" onClick={handleSubmit} disabled={!form.partnerId || !form.category || !form.description || anchoring}>
              {anchoring ? 'Anchoring…' : 'Hash & submit'}
            </ActionButton>
          </div>
        </div>
      )}
      {anchoredHash && (
        <div className="flex flex-col gap-2 p-3 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)' }}>
          <div className="flex items-center gap-2">
            <StatusBadge status="ok" label="ANCHORED" />
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Finding hash-anchored via SHA-256. 90-day embargo started. Dual-approval required before disclosure.
            </span>
          </div>
          <span className="text-xs font-mono break-all" style={{ color: '#c9b787' }}>{anchoredHash}</span>
        </div>
      )}
    </Card>
  );
}

function EmbargoAutomation({ records }: { records: CAVDRecord[] }) {
  const embargoedRecords = records.filter(r => r.stage === 'embargoed' || r.stage === 'patch-developed' || r.stage === 'patch-verified' || r.stage === 'intake');
  if (embargoedRecords.length === 0) return null;

  return (
    <Card className="mb-6">
      <SectionTitle>Embargo automation — active countdowns</SectionTitle>
      <div className="flex flex-col gap-2">
        {embargoedRecords.map(r => {
          const days = Math.floor((new Date(r.embargoExpiresAt).getTime() - Date.now()) / 86400000);
          const pct = Math.max(0, Math.min(100, ((90 - Math.max(0, days)) / 90) * 100));
          return (
            <div key={r.advisoryId} className="flex items-center gap-3 p-2 rounded border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <span className="text-xs font-mono font-semibold w-32 shrink-0" style={{ color: 'var(--color-a11oy-text)' }}>{r.advisoryId}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(201,183,135,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: days < 14 ? '#f5f5f5' : '#c9b787', transition: 'width 0.3s' }} />
              </div>
              <span className="text-xs font-mono w-20 text-right" style={{ color: days < 14 ? '#f5f5f5' : 'var(--color-a11oy-text-ghost)' }}>
                {days < 0 ? `expired ${Math.abs(days)}d ago` : `${days}d left`}
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${STAGE_COLOR[r.stage]}22`, color: STAGE_COLOR[r.stage] }}>
                {r.stage === 'patch-verified' ? 'ready' : r.stage.replace('-', ' ')}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.7 }}>
        Policy: auto-disclose at embargo expiry or patch verification — whichever is sooner. Dual-approval (partner + A11oy ops) required before early disclosure.
      </p>
    </Card>
  );
}

function CAVDDetail({ record }: { record: CAVDRecord }) {
  const partner = partnerById(record.reporterPartnerId);
  const isPublic = record.stage === 'disclosed';
  const stageIdx = STAGES.indexOf(record.stage);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{record.advisoryId}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[record.stage]}22`, color: STAGE_COLOR[record.stage] }}>{record.stage}</span>
              <StatusBadge status={record.severity === 'critical' || record.severity === 'high' ? 'error' : record.severity === 'medium' ? 'warn' : 'info'} label={record.severity.toUpperCase()} />
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {record.category} · agents: <span className="font-mono">{record.agentScope.join(', ')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {record.stage !== 'disclosed' && record.stage !== 'withdrawn' && (
              <ActionButton variant="ghost" size="sm">Advance</ActionButton>
            )}
            {record.stage === 'patch-verified' && (
              <ActionButton variant="primary" size="sm">Disclose</ActionButton>
            )}
          </div>
        </div>

        <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LIFECYCLE</div>
        <div className="flex items-center gap-1">
          {STAGES.slice(0, 6).map((s, i) => {
            const reached = i <= stageIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div
                  className="px-2 py-0.5 rounded-full text-xs font-mono uppercase"
                  style={{
                    backgroundColor: reached ? `${STAGE_COLOR[s]}22` : 'transparent',
                    color: reached ? STAGE_COLOR[s] : 'var(--color-a11oy-text-ghost)',
                    border: `1px solid ${reached ? STAGE_COLOR[s] : 'var(--color-a11oy-border)'}`,
                  }}
                >
                  {s.replace('-', ' ')}
                </div>
                {i < 5 && <div className="flex-1 h-px mx-1" style={{ backgroundColor: i < stageIdx ? '#c9b787' : 'var(--color-a11oy-border)' }} />}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>Intake (hash anchored at receive time)</SectionTitle>
        <InfoRow label="reporter" value={<><span className="font-mono">{record.reporterPartnerId}</span>{partner ? <span style={{ color: 'var(--color-a11oy-text-ghost)' }}> · {partner.name}</span> : null}</>} />
        <InfoRow label="received" value={fmtDate(record.receivedAt)} />
        <InfoRow label="findingHash" value={<HashId id={record.findingHash} />} />
        <InfoRow label="embargo policy" value={<span className="font-mono">90d-or-patch</span>} />
        <InfoRow label="embargo expires" value={fmtDate(record.embargoExpiresAt)} />
      </Card>

      {record.patchedSnapshotRef && (
        <Card>
          <SectionTitle>Patch verification</SectionTitle>
          <InfoRow label="patched snapshot" value={<HashId id={record.patchedSnapshotRef} />} />
        </Card>
      )}

      {isPublic && record.publicSummary ? (
        <Card>
          <SectionTitle>Public summary</SectionTitle>
          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{record.publicSummary}</p>
        </Card>
      ) : (
        <Card>
          <SectionTitle>Public summary</SectionTitle>
          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.7 }}>
            Embargoed. The finding hash above is the cryptographic anchor. Full content publishes at embargo expiry or patch verification — whichever is sooner.
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle>Notes</SectionTitle>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{record.notes}</p>
      </Card>
    </div>
  );
}
