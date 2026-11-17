import type { EvidenceMode, QueryEvidence } from '../lib/query-evidence';

export function DashboardEvidence({ mode, onModeChange, sources }: {
  mode: EvidenceMode;
  onModeChange: (mode: EvidenceMode) => void;
  sources: Record<string, QueryEvidence>;
}) {
  return (
    <section aria-label="Data sources" className="mb-6 rounded-lg border p-4" style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-card)' }}>
      <div className="flex flex-wrap items-center gap-2 mb-3" role="group" aria-label="Data mode">
        <button type="button" aria-pressed={mode === 'api'} onClick={() => onModeChange('api')} className="min-h-11 rounded border px-3 text-xs font-mono" style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>API responses</button>
        <button type="button" aria-pressed={mode === 'demo'} onClick={() => onModeChange('demo')} className="min-h-11 rounded border px-3 text-xs font-mono" style={{ borderColor: 'var(--color-a11oy-border)', color: '#c9b787' }}>Use DEMO fixtures</button>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
        {mode === 'demo'
          ? 'DEMO — fictional fixtures selected explicitly. Counts and local choices are demonstrations; no execution, authorization or ledger write occurs.'
          : 'API_DATA means a response was observed. It does not establish service health, authorization or verified evidence. Failed, stale and refreshing responses are withheld. Operational deployment remains BLOCKED.'}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(sources).map(([name, source]) => (
          <div key={name} data-source-name={name} data-source-state={mode === 'demo' ? 'DEMO' : source.state}>
            <dt className="text-xs font-mono uppercase" style={{ color: '#c9b787' }}>{name}: {mode === 'demo' ? 'DEMO' : source.state}</dt>
            <dd className="mt-1 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{mode === 'demo' ? 'Fixture data only; API responses are not displayed.' : source.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
