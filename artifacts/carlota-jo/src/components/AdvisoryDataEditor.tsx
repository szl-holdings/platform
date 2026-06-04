import React, { useEffect, useState } from 'react';

const API = `${import.meta.env.BASE_URL}api`;

type ClientId = string;

interface ClientLite {
  id: ClientId;
  name: string;
  industry: string;
}

interface MarginRow {
  month: string;
  margin: number;
}
interface RoiTrendRow {
  month: string;
  avgRoi: number;
}
interface MarketTrendRow {
  month: string;
  you: number;
  market: number;
}
interface CompetitorRow {
  name: string;
  score: number;
  trend: string;
  share: number;
}
interface RadarRow extends Record<string, unknown> {
  competitor: string;
  event: string;
  impact: string;
  direction: string;
  date?: string;
  signalDate?: string;
  detail: string;
}
interface RoiBenchmarks {
  avgRoi: number;
  avgPaybackMonths: number;
  avgRateRealisationPct: number;
  blendedMarginPct: number;
  clientRetentionPct: number;
  npsScore: number;
}

interface AdvisoryData {
  clientId: ClientId;
  name: string;
  marginHistory: MarginRow[];
  roiBenchmarks: RoiBenchmarks;
  roiTrend: RoiTrendRow[];
  radarSignals: RadarRow[];
  competitors: CompetitorRow[];
  marketTrend: MarketTrendRow[];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.85)',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
  display: 'block',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.75)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

interface SaveBarProps {
  accent: string;
  onSave: () => void;
  saving: boolean;
  status: string | null;
}
function SaveBar({ accent, onSave, saving, status }: SaveBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '10px',
      }}
    >
      {status && (
        <span
          style={{ fontSize: '11px', color: status.startsWith('Saved') ? '#22c55e' : '#ef4444' }}
        >
          {status}
        </span>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          padding: '7px 14px',
          borderRadius: '8px',
          border: 'none',
          background: accent,
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  );
}

export default function AdvisoryDataEditor({ accent }: { accent: string }) {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientId, setClientId] = useState<ClientId | ''>('');
  const [data, setData] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [statusBySection, setStatusBySection] = useState<Record<string, string | null>>({});

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/carlota/clients`, { credentials: 'include' });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: { clients?: ClientLite[] };
          clients?: ClientLite[];
        };
        const list = json.data?.clients ?? json.clients ?? [];
        setClients(list);
        if (list.length > 0 && !clientId) setClientId(list[0]?.id);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    setStatusBySection({});
    void (async () => {
      try {
        const res = await fetch(
          `${API}/carlota/admin/clients/${encodeURIComponent(clientId)}/advisory-data`,
          { credentials: 'include' },
        );
        if (!res.ok) {
          setError(
            res.status === 401 || res.status === 403
              ? 'You need an admin role to view or edit per-client advisory data.'
              : `Failed to load (${res.status})`,
          );
          setData(null);
          return;
        }
        const json = (await res.json()) as { data?: AdvisoryData } | AdvisoryData;
        const payload: AdvisoryData =
          'data' in (json as object) && (json as { data?: AdvisoryData }).data
            ? (json as { data: AdvisoryData }).data
            : (json as AdvisoryData);
        setData({
          ...payload,
          radarSignals: payload.radarSignals.map((r) => ({
            ...r,
            date: r.signalDate ?? r.date ?? '',
          })),
        });
      } catch (_e) {
        setError('Network error loading advisory data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  async function saveSection(section: string, body: object) {
    if (!clientId) return;
    setSavingSection(section);
    setStatusBySection((s) => ({ ...s, [section]: null }));
    try {
      const res = await fetch(
        `${API}/carlota/admin/clients/${encodeURIComponent(clientId)}/${section}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatusBySection((s) => ({ ...s, [section]: 'Saved.' }));
      setTimeout(() => setStatusBySection((s) => ({ ...s, [section]: null })), 2500);
    } catch (e) {
      setStatusBySection((s) => ({ ...s, [section]: `Save failed: ${(e as Error).message}` }));
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value as ClientId)}
          style={{ ...inputStyle, width: '260px', padding: '7px 10px', fontSize: '13px' }}
        >
          {clients.length === 0 && <option value="">Loading...</option>}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          Loading client data...
        </div>
      )}
      {error && <div style={{ fontSize: '12px', color: '#ef4444' }}>{error}</div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Margin history */}
          <div>
            <div style={sectionTitleStyle}>Margin History (monthly %)</div>
            <ListEditor
              rows={data.marginHistory}
              onChange={(rows) => setData({ ...data, marginHistory: rows })}
              columns={[
                { key: 'month', label: 'Month', width: '1fr' },
                { key: 'margin', label: 'Margin %', width: '1fr', numeric: true },
              ]}
              newRow={() => ({ month: '', margin: 0 })}
            />
            <SaveBar
              accent={accent}
              saving={savingSection === 'margin-history'}
              status={statusBySection['margin-history'] ?? null}
              onSave={() => saveSection('margin-history', { items: data.marginHistory })}
            />
          </div>

          {/* ROI benchmarks */}
          <div>
            <div style={sectionTitleStyle}>ROI Benchmarks</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(Object.keys(data.roiBenchmarks) as Array<keyof RoiBenchmarks>).map((k) => (
                <div key={k}>
                  <label style={labelStyle}>{k}</label>
                  <input
                    type="number"
                    value={data.roiBenchmarks[k]}
                    onChange={(e) =>
                      setData({
                        ...data,
                        roiBenchmarks: { ...data.roiBenchmarks, [k]: Number(e.target.value) },
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <SaveBar
              accent={accent}
              saving={savingSection === 'roi-benchmarks'}
              status={statusBySection['roi-benchmarks'] ?? null}
              onSave={() => saveSection('roi-benchmarks', data.roiBenchmarks)}
            />
          </div>

          {/* ROI trend */}
          <div>
            <div style={sectionTitleStyle}>ROI Trend (avg ROI by month)</div>
            <ListEditor
              rows={data.roiTrend}
              onChange={(rows) => setData({ ...data, roiTrend: rows })}
              columns={[
                { key: 'month', label: 'Month', width: '1fr' },
                { key: 'avgRoi', label: 'Avg ROI %', width: '1fr', numeric: true },
              ]}
              newRow={() => ({ month: '', avgRoi: 0 })}
            />
            <SaveBar
              accent={accent}
              saving={savingSection === 'roi-trend'}
              status={statusBySection['roi-trend'] ?? null}
              onSave={() => saveSection('roi-trend', { items: data.roiTrend })}
            />
          </div>

          {/* Radar signals */}
          <div>
            <div style={sectionTitleStyle}>Radar Signals</div>
            <ListEditor
              rows={data.radarSignals}
              onChange={(rows) => setData({ ...data, radarSignals: rows })}
              columns={[
                { key: 'competitor', label: 'Competitor', width: '1fr' },
                { key: 'event', label: 'Event', width: '2fr' },
                {
                  key: 'impact',
                  label: 'Impact',
                  width: '0.6fr',
                  select: ['high', 'medium', 'low'],
                },
                {
                  key: 'direction',
                  label: 'Direction',
                  width: '0.7fr',
                  select: ['threat', 'opportunity', 'neutral'],
                },
                { key: 'date', label: 'Date', width: '0.8fr' },
                { key: 'detail', label: 'Detail', width: '2fr' },
              ]}
              newRow={() => ({
                competitor: '',
                event: '',
                impact: 'medium',
                direction: 'neutral',
                date: '',
                detail: '',
              })}
            />
            <SaveBar
              accent={accent}
              saving={savingSection === 'radar-signals'}
              status={statusBySection['radar-signals'] ?? null}
              onSave={() => saveSection('radar-signals', { items: data.radarSignals })}
            />
          </div>

          {/* Competitors */}
          <div>
            <div style={sectionTitleStyle}>Competitor Rankings</div>
            <ListEditor
              rows={data.competitors}
              onChange={(rows) => setData({ ...data, competitors: rows })}
              columns={[
                { key: 'name', label: 'Name', width: '2fr' },
                { key: 'score', label: 'Score', width: '0.7fr', numeric: true },
                { key: 'trend', label: 'Trend', width: '0.7fr', select: ['up', 'down', 'flat'] },
                { key: 'share', label: 'Share %', width: '0.7fr', numeric: true },
              ]}
              newRow={() => ({ name: '', score: 50, trend: 'flat', share: 0 })}
            />
            <SaveBar
              accent={accent}
              saving={savingSection === 'competitors'}
              status={statusBySection.competitors ?? null}
              onSave={() => saveSection('competitors', { items: data.competitors })}
            />
          </div>

          {/* Market trend */}
          <div>
            <div style={sectionTitleStyle}>Market Trend (you vs market)</div>
            <ListEditor
              rows={data.marketTrend}
              onChange={(rows) => setData({ ...data, marketTrend: rows })}
              columns={[
                { key: 'month', label: 'Month', width: '1fr' },
                { key: 'you', label: 'You', width: '1fr', numeric: true },
                { key: 'market', label: 'Market', width: '1fr', numeric: true },
              ]}
              newRow={() => ({ month: '', you: 0, market: 0 })}
            />
            <SaveBar
              accent={accent}
              saving={savingSection === 'market-trend'}
              status={statusBySection['market-trend'] ?? null}
              onSave={() => saveSection('market-trend', { items: data.marketTrend })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Column {
  key: string;
  label: string;
  width: string;
  numeric?: boolean;
  select?: string[];
}

function ListEditor<T extends Record<string, unknown>>({
  rows,
  onChange,
  columns,
  newRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: Column[];
  newRow: () => T;
}) {
  const grid = `${columns.map((c) => c.width).join(' ')} 60px`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px', padding: '0 4px' }}>
        {columns.map((c) => (
          <div key={c.key} style={labelStyle}>
            {c.label}
          </div>
        ))}
        <div />
      </div>
      {rows.map((row, idx) => (
        <div
          key={idx}
          style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px', alignItems: 'center' }}
        >
          {columns.map((c) => {
            const val = row[c.key];
            if (c.select) {
              return (
                <select
                  key={c.key}
                  value={String(val ?? '')}
                  style={inputStyle}
                  onChange={(e) => {
                    const next = [...rows];
                    next[idx] = { ...row, [c.key]: e.target.value } as T;
                    onChange(next);
                  }}
                >
                  {c.select.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={c.key}
                type={c.numeric ? 'number' : 'text'}
                value={val == null ? '' : String(val)}
                onChange={(e) => {
                  const next = [...rows];
                  const v: unknown = c.numeric ? Number(e.target.value) : e.target.value;
                  next[idx] = { ...row, [c.key]: v } as T;
                  onChange(next);
                }}
                style={inputStyle}
              />
            );
          })}
          <button
            onClick={() => onChange(rows.filter((_, i) => i !== idx))}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...rows, newRow()])}
        style={{
          marginTop: '6px',
          padding: '7px',
          borderRadius: '6px',
          border: '1px dashed rgba(255,255,255,0.15)',
          background: 'transparent',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '11px',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        + Add row
      </button>
    </div>
  );
}
