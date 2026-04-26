import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, ActionButton, StatusBadge } from '../components/ui';
import { SNAPSHOTS } from '../data/mythosDoctrine';

export function SnapshotProvenance() {
  const [selected, setSelected] = useState(SNAPSHOTS[0].workcellRef);
  const [replayState, setReplayState] = useState<Record<string, 'idle' | 'running' | 'done'>>({});
  const snap = SNAPSHOTS.find(s => s.workcellRef === selected) ?? SNAPSHOTS[0];

  const triggerReplay = (ref: string) => {
    setReplayState(s => ({ ...s, [ref]: 'running' }));
    setTimeout(() => setReplayState(s => ({ ...s, [ref]: 'done' })), 1200);
  };

  const totalReplays = SNAPSHOTS.reduce((a, s) => a + s.replayCount, 0);

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · SNAPSHOT PROVENANCE"
        title="Snapshot Provenance + Replay"
        subtitle="Every workcell ships with a bit-exact fingerprint over its constitution version, model weights, toolset, prompts, and evidence pack. Replayable forever."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="SNAPSHOTS" value={SNAPSHOTS.length} sub="captured" accent="#c9b787" />
        <KpiCard label="REPLAYABLE" value={SNAPSHOTS.filter(s => s.replayable).length} sub="bit-exact" accent="#c9b787" />
        <KpiCard label="REPLAYS RUN" value={totalReplays} sub="this window" accent="#c9b787" />
        <KpiCard label="FINGERPRINT" value="sha256" sub="immutable" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-2">
          <SectionTitle>Workcell Snapshots</SectionTitle>
          {SNAPSHOTS.map(s => (
            <Card key={s.workcellRef}
              onClick={() => setSelected(s.workcellRef)}
              style={{
                borderColor: s.workcellRef === selected ? '#c9b787' : undefined,
                background: s.workcellRef === selected ? 'rgba(201,183,135,0.04)' : undefined,
              }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{s.workcellRef}</div>
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>{s.fingerprint}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {s.replayCount} replay(s)
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <SectionTitle>Snapshot Detail</SectionTitle>
          <Card>
            <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{snap.workcellRef}</div>
              <StatusBadge status={snap.replayable ? 'ok' : 'warn'} label={snap.replayable ? 'REPLAYABLE' : 'NOT REPLAYABLE'} />
            </div>

            <div className="font-mono text-xs px-3 py-2 rounded mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-a11oy-border)', color: '#c9b787', wordBreak: 'break-all' }}>
              {snap.fingerprint}
            </div>

            <InfoRow label="Captured at" value={new Date(snap.capturedAt).toLocaleString()} />
            <InfoRow label="Constitution" value={snap.constitutionVersion} mono />
            <InfoRow label="Model + weights" value={snap.modelWeightsId} mono />
            <InfoRow label="Toolset hash" value={snap.toolsetHash} mono />
            <InfoRow label="Prompts hash" value={snap.promptsHash} mono />
            <InfoRow label="Evidence pack hash" value={snap.evidencePackHash} mono />
            <InfoRow label="Replays" value={`${snap.replayCount}${snap.lastReplayedAt ? ` · last ${new Date(snap.lastReplayedAt).toLocaleString()}` : ''}`} />

            <div className="flex items-center gap-2 mt-4">
              <ActionButton variant="primary" onClick={() => triggerReplay(snap.workcellRef)} disabled={replayState[snap.workcellRef] === 'running'}>
                {replayState[snap.workcellRef] === 'running' ? 'Replaying…' : replayState[snap.workcellRef] === 'done' ? 'Replay queued ✓' : '↻ Replay snapshot'}
              </ActionButton>
              <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Replays use the captured weights, toolset, and prompts — no behavior drift.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
