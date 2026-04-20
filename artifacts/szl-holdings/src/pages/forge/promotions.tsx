import {
  ForgeShell,
  Section,
  StatusPill,
  tableStyle,
  tdStyle,
  thStyle,
  useForgeQuery,
} from './_shared';

interface Promotion {
  id: string;
  agentId: string;
  fromEnv: string;
  toEnv: string;
  status: string;
  blockers: Array<{ code: string; message: string }>;
  validationReport: Record<string, unknown>;
  createdAt: string;
  promotedAt: string | null;
}

export default function ForgePromotionsPage() {
  const { data } = useForgeQuery<Promotion[]>('promotions', '/api/forge/promotions?limit=100');

  const grouped = (data ?? []).reduce<Record<string, Promotion[]>>((acc, p) => {
    (acc[p.status] ||= []).push(p);
    return acc;
  }, {});
  const order = ['requested', 'validated', 'blocked', 'approved', 'promoted'];

  return (
    <ForgeShell
      title="Promotions"
      subtitle="Every dev → sandbox → staging → production transition validated, audited, and approved."
    >
      {order.map((status) => {
        const list = grouped[status] ?? [];
        if (list.length === 0) return null;
        return (
          <Section key={status} title={`${status} (${list.length})`}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>From → To</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Blockers</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Promoted</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td style={tdStyle}>
                      <code style={{ fontSize: 11 }}>{p.agentId.slice(0, 8)}</code>
                    </td>
                    <td style={tdStyle}>
                      {p.fromEnv} → {p.toEnv}
                    </td>
                    <td style={tdStyle}>
                      <StatusPill value={p.status} />
                    </td>
                    <td style={tdStyle}>
                      {(p.blockers ?? []).length === 0 ? (
                        '✓ none'
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {p.blockers.map((b, i) => (
                            <li key={i} style={{ color: '#fca5a5', fontSize: 12 }}>
                              <b>{b.code}</b>: {b.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td style={tdStyle}>{new Date(p.createdAt).toLocaleString()}</td>
                    <td style={tdStyle}>
                      {p.promotedAt ? new Date(p.promotedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        );
      })}
      {!data && <div style={{ color: '#9ca3af' }}>Loading…</div>}
      {data && data.length === 0 && <div style={{ color: '#6b7280' }}>No promotions recorded.</div>}
    </ForgeShell>
  );
}
