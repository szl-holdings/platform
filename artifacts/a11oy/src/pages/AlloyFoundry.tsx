import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { T } from './alloy-theme';
import { AlloyTopBar } from './AlloyTopBar';
import {
  createHfHubClient,
  type HFModel,
  type HFDataset,
  type HFSpace,
  type HFStatus,
} from '@szl-holdings/shared-ui';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;

const ease = [0.22, 1, 0.36, 1] as const;

type Tab = 'models' | 'datasets' | 'spaces' | 'playground';

const hfClient = createHfHubClient(import.meta.env.BASE_URL ?? '/a11oy/');
const hfGet = hfClient.get;
const hfPost = hfClient.post;

function ErrorBox({ msg, onRetry, label }: { msg: string; onRetry: () => void; label: string }) {
  return (
    <div style={{
      padding: '3rem 2rem', textAlign: 'center',
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
        fontSize: 16, marginBottom: '0.875rem',
      }}>⚡</div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.25rem' }}>
        {label} unavailable
      </p>
      <p style={{ fontSize: '0.8125rem', color: T.textDim, maxWidth: '36ch', margin: '0 auto 1rem' }}>
        {msg || 'Connect the HF Hub API to browse assets.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '0.5rem 1.25rem', background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: '0.8125rem', color: T.textDim,
        }}
      >
        Retry
      </button>
    </div>
  );
}

function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          height: 64, borderRadius: 8,
          background: T.surface, border: `1px solid ${T.border}`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: HFStatus['status'] }) {
  const map: Record<HFStatus['status'], { color: string; label: string }> = {
    healthy: { color: '#10b981', label: 'Healthy' },
    degraded: { color: '#f59e0b', label: 'Degraded' },
    auth_error: { color: '#ef4444', label: 'Auth Error' },
    unconfigured: { color: T.textMuted, label: 'No Token' },
  };
  const cfg = map[status] ?? map.unconfigured;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.6875rem', fontWeight: 600, color: cfg.color, fontFamily: T.mono,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ModelsTab() {
  const [search, setSearch] = useState('');
  const [task, setTask] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [models, setModels] = useState<HFModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const params = new URLSearchParams({ search: debouncedSearch, limit: '20' });
    if (task) params.set('task', task);

    hfGet<{ models: HFModel[] }>(`/models?${params}`, controller.signal)
      .then((data) => { setModels(data.models ?? []); setLoading(false); })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load models');
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, task, attempt]);

  const TASKS = [
    'text-generation', 'text2text-generation', 'question-answering',
    'summarization', 'translation', 'image-classification',
    'image-to-text', 'automatic-speech-recognition', 'text-to-image',
    'feature-extraction', 'text-classification', 'token-classification',
  ];

  if (error) return <ErrorBox msg={error} onRetry={() => setAttempt((a) => a + 1)} label="Model registry" />;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '0.625rem 0.875rem',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 6, color: T.text, fontSize: '0.8125rem',
            fontFamily: T.sans, outline: 'none',
          }}
        />
        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{
            padding: '0.625rem 0.875rem',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 6, color: T.text, fontSize: '0.8125rem',
            fontFamily: T.mono, cursor: 'pointer',
          }}
        >
          <option value="">All tasks</option>
          {TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <LoadingSkeleton count={5} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {models.map((m, i) => {
            const hfId = m.modelId ?? m.id;
            return (
              <motion.div
                key={hfId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * i }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem',
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 7,
                    background: '#6366f114', border: '1px solid #6366f128',
                    fontSize: 12, fontFamily: T.mono, color: '#6366f1', fontWeight: 700,
                  }}>M</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.875rem', fontWeight: 500, color: '#e8e8e8', fontFamily: T.mono,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{hfId}</div>
                    <div style={{ fontSize: '0.6875rem', color: T.textMuted, marginTop: '0.125rem', display: 'flex', gap: '0.5rem' }}>
                      {m.downloads != null && <span>{(m.downloads / 1000).toFixed(0)}k downloads</span>}
                      {m.likes != null && <span>{m.likes} likes</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {m.pipeline_tag && (
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      background: '#6366f112', border: '1px solid #6366f120',
                      borderRadius: 4, fontSize: '0.625rem', fontFamily: T.mono,
                      fontWeight: 600, color: '#6366f1',
                    }}>{m.pipeline_tag}</span>
                  )}
                  <a
                    href={`https://huggingface.co/${hfId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.6875rem', color: T.textMuted, textDecoration: 'none' }}
                    title="View on Hugging Face"
                  >↗</a>
                </div>
              </motion.div>
            );
          })}
          {models.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: T.textDim, fontSize: '0.875rem' }}>
              No models found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DatasetsTab() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datasets, setDatasets] = useState<HFDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rows?: unknown[] } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const controller = new AbortController();

    hfGet<{ datasets: HFDataset[] }>(
      `/datasets?search=${encodeURIComponent(debouncedSearch)}&limit=20`,
      controller.signal,
    )
      .then((data) => { setDatasets(data.datasets ?? []); setLoading(false); })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load datasets');
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, attempt]);

  useEffect(() => {
    if (!selectedDataset) { setPreview(null); return; }
    const controller = new AbortController();
    hfGet<{ preview: { rows?: unknown[] } | null }>(`/datasets/${selectedDataset}`, controller.signal)
      .then((data) => setPreview(data.preview))
      .catch(() => setPreview(null));
    return () => controller.abort();
  }, [selectedDataset]);

  if (error) return <ErrorBox msg={error} onRetry={() => setAttempt((a) => a + 1)} label="Dataset registry" />;

  return (
    <div>
      <input
        type="search"
        placeholder="Search datasets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '0.625rem 0.875rem',
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 6, color: T.text, fontSize: '0.8125rem',
          fontFamily: T.sans, marginBottom: '1rem', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {loading ? <LoadingSkeleton count={4} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {datasets.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * i }}
            >
              <div
                onClick={() => setSelectedDataset(selectedDataset === d.id ? null : d.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem',
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 7,
                    background: '#3b82f614', border: '1px solid #3b82f628',
                    fontSize: 12, fontFamily: T.mono, color: '#3b82f6', fontWeight: 700,
                  }}>D</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.875rem', fontWeight: 500, color: '#e8e8e8', fontFamily: T.mono,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{d.id}</div>
                    <div style={{ fontSize: '0.6875rem', color: T.textMuted, marginTop: '0.125rem', display: 'flex', gap: '0.5rem' }}>
                      {d.downloads != null && <span>{(d.downloads / 1000).toFixed(0)}k downloads</span>}
                      {d.likes != null && <span>{d.likes} likes</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, color: T.textMuted,
                    transform: selectedDataset === d.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s', display: 'inline-block',
                  }}>▶</span>
                  <a
                    href={`https://huggingface.co/datasets/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.6875rem', color: T.textMuted, textDecoration: 'none' }}
                    title="View on Hugging Face"
                  >↗</a>
                </div>
              </div>
              {selectedDataset === d.id && preview && preview.rows && (
                <div style={{
                  margin: '0.25rem 0 0 0', padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`,
                  borderRadius: 8, overflowX: 'auto',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6875rem', fontFamily: T.mono }}>
                    <tbody>
                      {(preview.rows as unknown[]).slice(0, 5).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '0.375rem 0.5rem', color: T.textMuted, width: 30 }}>{ri}</td>
                          <td style={{
                            padding: '0.375rem 0.5rem', color: T.textDim,
                            maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {JSON.stringify(row).slice(0, 140)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
          {datasets.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: T.textDim, fontSize: '0.875rem' }}>
              No datasets found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpacesTab() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [embeddedSpace, setEmbeddedSpace] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const controller = new AbortController();

    hfGet<{ spaces: HFSpace[] }>(
      `/spaces?search=${encodeURIComponent(debouncedSearch)}&limit=20`,
      controller.signal,
    )
      .then((data) => { setSpaces(data.spaces ?? []); setLoading(false); })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load spaces');
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, attempt]);

  if (error) return <ErrorBox msg={error} onRetry={() => setAttempt((a) => a + 1)} label="Space registry" />;

  return (
    <div>
      <input
        type="search"
        placeholder="Search spaces..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '0.625rem 0.875rem',
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 6, color: T.text, fontSize: '0.8125rem',
          fontFamily: T.sans, marginBottom: '1rem', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {loading ? <LoadingSkeleton count={4} /> : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem',
          }}>
            {spaces.map((s, i) => {
              const spaceUrl = `https://huggingface.co/spaces/${s.id}`;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.04 * i }}
                  style={{
                    padding: '1rem',
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, cursor: 'pointer',
                  }}
                  onClick={() => setEmbeddedSpace(embeddedSpace === s.id ? null : s.id)}
                >
                  <div style={{
                    height: 60, borderRadius: 8, marginBottom: '0.875rem',
                    background: 'linear-gradient(135deg, #3b82f614 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid #3b82f620',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.6875rem', fontFamily: T.mono, color: '#3b82f6',
                      fontWeight: 700, letterSpacing: '0.1em',
                    }}>{s.sdk ?? 'SPACE'}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e8e8', marginBottom: '0.25rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.id}</div>
                  <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono, display: 'flex', gap: '0.5rem' }}>
                    {s.likes != null && <span>{s.likes} likes</span>}
                    <a
                      href={spaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: T.accent, textDecoration: 'none' }}
                    >↗ HF</a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {embeddedSpace && (
            <div style={{
              marginTop: '1rem', border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: T.surface, borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim }}>{embeddedSpace}</span>
                <button
                  type="button"
                  onClick={() => setEmbeddedSpace(null)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: T.textMuted, fontSize: '0.875rem',
                  }}
                >✕</button>
              </div>
              <iframe
                src={`https://huggingface.co/spaces/${embeddedSpace}`}
                title={embeddedSpace}
                style={{ width: '100%', height: 500, border: 'none', background: '#0a0a0a' }}
              />
            </div>
          )}

          {spaces.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: T.textDim, fontSize: '0.875rem' }}>
              No spaces found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlaygroundTab() {
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    hfGet<{ models: HFModel[] }>('/models?limit=10', controller.signal)
      .then((data) => {
        const names = (data.models ?? []).map((m) => m.modelId ?? m.id).filter(Boolean);
        setAvailableModels(names);
        if (!model && names.length > 0) setModel(names[0]);
      })
      .catch(() => {})
      .finally(() => setModelsLoaded(true));
    return () => controller.abort();
  }, []);

  const run = useCallback(async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    setOutput('');
    setError('');
    setLatency(null);
    const start = Date.now();
    try {
      const res = await hfPost<{ output?: string; text?: string; content?: string }>(
        '/inference',
        { model: model || undefined, prompt: prompt.trim(), modality: 'text' },
      );
      setLatency(Date.now() - start);
      setOutput(res.output ?? res.text ?? res.content ?? JSON.stringify(res, null, 2));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach the inference endpoint. Check HF_TOKEN configuration.',
      );
    } finally {
      setRunning(false);
    }
  }, [model, prompt]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ fontSize: '0.75rem', color: T.textDim, display: 'block', marginBottom: '0.375rem', fontFamily: T.mono }}>
          Model
        </label>
        {availableModels.length > 0 ? (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              padding: '0.625rem 0.875rem',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, color: T.text, fontSize: '0.8125rem',
              fontFamily: T.mono, width: '100%', cursor: 'pointer',
            }}
          >
            {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={modelsLoaded ? 'Enter model name (no models found via HF Hub)' : 'Loading models...'}
            style={{
              padding: '0.625rem 0.875rem',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, color: T.text, fontSize: '0.8125rem',
              fontFamily: T.mono, width: '100%', outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: T.textDim, display: 'block', marginBottom: '0.375rem', fontFamily: T.mono }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to test this model..."
          rows={4}
          style={{
            width: '100%', padding: '0.75rem',
            background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`,
            borderRadius: 6, color: T.text, fontSize: '0.8125rem',
            fontFamily: T.mono, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running || !prompt.trim()}
        style={{
          padding: '0.75rem 1.5rem',
          background: running || !prompt.trim() ? 'rgba(255,255,255,0.06)' : T.accent,
          border: 'none', borderRadius: 8,
          fontSize: '0.875rem', fontWeight: 600,
          color: running || !prompt.trim() ? T.textMuted : '#0a0a0a',
          cursor: running || !prompt.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', alignSelf: 'flex-start',
        }}
      >
        {running ? 'Running...' : 'Run inference →'}
      </button>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '1rem',
          fontSize: '0.8125rem', color: '#f87171', lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}

      {output && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '1rem',
            fontFamily: T.mono, fontSize: '0.8125rem',
            color: T.textDim, lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}
        >
          {output}
          {latency != null && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.6875rem', color: T.textMuted }}>
              Latency: {latency}ms · Model: {model}
            </div>
          )}
        </motion.div>
      )}

      <p style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono }}>
        Inference calls are governed by Policy Engine and create Proof Chain entries.
      </p>
    </div>
  );
}

export function AlloyFoundry() {
  const [tab, setTab] = useState<Tab>('models');
  const [hfStatus, setHfStatus] = useState<HFStatus | null>(null);

  useEffect(() => {
    hfGet<HFStatus>('/status')
      .then(setHfStatus)
      .catch(() => {});
  }, []);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'models', label: 'Models' },
    { id: 'datasets', label: 'Datasets' },
    { id: 'spaces', label: 'Spaces' },
    { id: 'playground', label: 'Inference Playground' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.sans }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <AlloyTopBar backLabel="Alloy" backHref={b('/hub')} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem clamp(1.25rem, 5vw, 4rem) 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800, color: T.text, letterSpacing: '-0.04em',
            }}>
              The Alloy Foundry
            </h1>
            {hfStatus && <StatusBadge status={hfStatus.status} />}
          </div>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '52ch' }}>
            Browse models, datasets, and spaces from the HF Hub. Every asset is governed, attributed, and deployable from one place.
          </p>
          {hfStatus?.username && (
            <p style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono, marginTop: '0.375rem' }}>
              Authenticated as {hfStatus.username} · {hfStatus.pinnedModels} pinned models · {hfStatus.pinnedDatasets} pinned datasets · {hfStatus.pinnedSpaces} pinned spaces
            </p>
          )}
        </motion.div>

        <div style={{
          display: 'flex', gap: '0.375rem', marginBottom: '2rem',
          borderBottom: `1px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap',
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.625rem 1rem',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? T.accent : 'transparent'}`,
                cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? T.accent : T.textDim,
                transition: 'color 0.15s, border-color 0.15s',
                borderRadius: 0, marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'models' && <ModelsTab />}
          {tab === 'datasets' && <DatasetsTab />}
          {tab === 'spaces' && <SpacesTab />}
          {tab === 'playground' && <PlaygroundTab />}
        </motion.div>
      </main>
    </div>
  );
}
