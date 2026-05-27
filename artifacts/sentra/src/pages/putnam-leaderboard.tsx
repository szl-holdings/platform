import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sigma, ShieldCheck, XCircle, MinusCircle } from 'lucide-react';

type Verdict = 'correct' | 'partial' | 'incorrect' | 'abstained';

interface RubricItem {
  partId: number;
  title: string;
  awarded: number;
  maxPoints: number;
  justification: string;
}

interface PerProblem {
  problemIdx: number;
  verdict: Verdict;
  awarded: number;
  possible: number;
  pickedStrategy: string;
  contradictionAgreement: number | null;
  leanElaborated: boolean;
  leanToolchainAvailable: boolean;
  receiptChainHead: string;
  rubric: RubricItem[];
}

interface Gauge {
  receiptClass: string;
  freshnessNonce: string;
  issuedAt: string;
  tenant: string;
  competitionId: string;
  problemsAttempted: number;
  problemsCorrect: number;
  problemsPartial: number;
  problemsIncorrect: number;
  problemsAbstained: number;
  totalAwarded: number;
  totalPossible: number;
  score01: number;
  wallSeconds: number;
  modelRoster: string[];
  primitiveRoster: string[];
  receiptChainHead: string;
}

interface Leaderboard {
  issuedAt: string;
  gauge: Gauge;
  manifest?: { candidateK?: number };
  perProblem: PerProblem[];
  honesty?: Record<string, string | boolean>;
}

interface LeaderboardResponse {
  present: boolean;
  message?: string;
  source?: string;
  leaderboard?: Leaderboard;
}

const ACCENT = '#c9b787';

function verdictColor(v: Verdict): string {
  if (v === 'correct') return '#4ade80';
  if (v === 'partial') return '#facc15';
  if (v === 'incorrect') return '#f87171';
  return '#94a3b8';
}

function VerdictIcon({ v }: { v: Verdict }) {
  const cls = 'w-3.5 h-3.5';
  if (v === 'correct') return <CheckCircle2 className={cls} style={{ color: verdictColor(v) }} />;
  if (v === 'partial') return <AlertTriangle className={cls} style={{ color: verdictColor(v) }} />;
  if (v === 'incorrect') return <XCircle className={cls} style={{ color: verdictColor(v) }} />;
  return <MinusCircle className={cls} style={{ color: verdictColor(v) }} />;
}

function shortHash(h: string): string {
  return h ? `${h.slice(0, 8)}…${h.slice(-6)}` : '—';
}

export default function PutnamLeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chainRoot, setChainRoot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/putnam/leaderboard', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        const payload: LeaderboardResponse = body?.data ?? body;
        setData(payload);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data?.present || !data.source) return;
    let cancelled = false;
    fetch('/api/putnam/gauge', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((body) => {
        if (cancelled || !body) return;
        const payload = body?.data ?? body;
        if (payload?.gauge?.receiptChainHead) setChainRoot(payload.gauge.receiptChainHead);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [data]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto" style={{ background: '#0a0a0a', minHeight: '100%' }}>
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sigma className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>
            putnam-2025 · receipt-attested
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-[#f5f5f5] mb-2">
          Putnam Leaderboard
        </h1>
        <p className="text-sm text-[#f5f5f5]/60 max-w-3xl">
          Live numbers from the canonical aggregated run. Per-problem verdicts, picked strategy,
          contradiction-agreement, lean elaboration, and the chain-head of the receipt graph that
          produced them. Sourced from <code className="text-[#f5f5f5]/80">/api/putnam/leaderboard</code>.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-[#f5f5f5]/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading canonical run…
        </div>
      )}

      {error && (
        <div
          className="p-4 rounded border text-sm text-red-300"
          style={{ background: 'rgba(248,113,113,0.05)', borderColor: 'rgba(248,113,113,0.2)' }}
        >
          Failed to fetch leaderboard: {error}
        </div>
      )}

      {!loading && !error && data && !data.present && (
        <div
          className="p-6 rounded border text-sm text-[#f5f5f5]/70"
          style={{ background: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.18)' }}
        >
          <div className="flex items-center gap-2 mb-2" style={{ color: ACCENT }}>
            <MinusCircle className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">no canonical run yet</span>
          </div>
          {data.message ?? 'The harness has not produced an aggregated canonical run yet.'}
        </div>
      )}

      {!loading && !error && data?.present && data.leaderboard && (
        <PutnamView lb={data.leaderboard} source={data.source} chainRoot={chainRoot} />
      )}
    </div>
  );
}

function PutnamView({
  lb,
  source,
  chainRoot,
}: {
  lb: Leaderboard;
  source?: string;
  chainRoot: string | null;
}) {
  const g = lb.gauge;
  const pct = (g.score01 * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <section
        className="rounded border p-5 lg:p-6"
        style={{ background: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.18)' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Stat label="score01" value={`${pct}%`} accent />
          <Stat label="awarded / possible" value={`${g.totalAwarded} / ${g.totalPossible}`} />
          <Stat label="wall seconds" value={g.wallSeconds.toFixed(1)} />
          <Stat label="candidate K" value={String(lb.manifest?.candidateK ?? '—')} />
          <Stat label="correct" value={String(g.problemsCorrect)} color="#4ade80" />
          <Stat label="partial" value={String(g.problemsPartial)} color="#facc15" />
          <Stat label="incorrect" value={String(g.problemsIncorrect)} color="#f87171" />
          <Stat label="abstained" value={String(g.problemsAbstained)} color="#94a3b8" />
        </div>
        <div className="mt-5 pt-4 border-t border-white/5 text-[11px] font-mono text-[#f5f5f5]/55 space-y-1">
          <div>
            <span className="text-[#f5f5f5]/40">issued</span> {new Date(g.issuedAt).toISOString()}
          </div>
          <div>
            <span className="text-[#f5f5f5]/40">tenant</span> {g.tenant}
          </div>
          <div>
            <span className="text-[#f5f5f5]/40">models</span> {g.modelRoster.join(', ')}
          </div>
          <div>
            <span className="text-[#f5f5f5]/40">primitives</span> {g.primitiveRoster.join(', ')}
          </div>
          <div>
            <span className="text-[#f5f5f5]/40">chain-head</span>{' '}
            <span style={{ color: ACCENT }}>{shortHash(g.receiptChainHead)}</span>
            {chainRoot && chainRoot !== g.receiptChainHead && (
              <>
                {' '}
                <span className="text-[#f5f5f5]/40">· gauge-head</span>{' '}
                <span style={{ color: ACCENT }}>{shortHash(chainRoot)}</span>
              </>
            )}
          </div>
          {source && (
            <div>
              <span className="text-[#f5f5f5]/40">source</span> {source.split('/').slice(-1)[0]}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#f5f5f5]/70 mb-3">
          Per-problem rubric
        </h2>
        <div className="overflow-x-auto rounded border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02]">
              <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-[#f5f5f5]/50">
                <th className="px-3 py-2">P#</th>
                <th className="px-3 py-2">Verdict</th>
                <th className="px-3 py-2">Awarded</th>
                <th className="px-3 py-2">Strategy</th>
                <th className="px-3 py-2">Agreement</th>
                <th className="px-3 py-2">Lean</th>
                <th className="px-3 py-2">Chain-head</th>
              </tr>
            </thead>
            <tbody>
              {lb.perProblem.map((p) => (
                <tr key={p.problemIdx} className="border-t border-white/[0.04] align-top">
                  <td className="px-3 py-2 font-mono text-[#f5f5f5]/80">P{String(p.problemIdx).padStart(2, '0')}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5" style={{ color: verdictColor(p.verdict) }}>
                      <VerdictIcon v={p.verdict} />
                      <span className="font-mono uppercase text-[10px] tracking-widest">{p.verdict}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[#f5f5f5]/80">
                    {p.awarded} / {p.possible}
                  </td>
                  <td className="px-3 py-2 font-mono text-[#f5f5f5]/70">{p.pickedStrategy}</td>
                  <td className="px-3 py-2 font-mono text-[#f5f5f5]/70">
                    {p.contradictionAgreement === null ? '—' : p.contradictionAgreement.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {p.leanElaborated ? (
                      <span className="text-emerald-300">elaborated</span>
                    ) : p.leanToolchainAvailable ? (
                      <span className="text-[#f5f5f5]/50">skipped</span>
                    ) : (
                      <span className="text-[#f5f5f5]/40">no-toolchain</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[#f5f5f5]/60" title={p.receiptChainHead}>
                    {shortHash(p.receiptChainHead)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {lb.honesty && (
        <section
          className="rounded border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#f5f5f5]/70">
              Honesty contract
            </h2>
          </div>
          <ul className="space-y-1.5 text-[11px] font-mono text-[#f5f5f5]/65">
            {Object.entries(lb.honesty).map(([k, v]) => (
              <li key={k}>
                <span className="text-[#f5f5f5]/40">{k}</span>{' '}
                <span className="text-[#f5f5f5]/80">{typeof v === 'boolean' ? String(v) : v}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  color,
}: {
  label: string;
  value: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#f5f5f5]/50 mb-1">
        {label}
      </div>
      <div
        className="text-xl lg:text-2xl font-semibold"
        style={{ color: accent ? ACCENT : color ?? '#f5f5f5' }}
      >
        {value}
      </div>
    </div>
  );
}
