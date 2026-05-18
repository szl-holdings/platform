import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Skeleton } from '@szl-holdings/shared-ui/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Eye,
  EyeOff,
  GitMerge,
  Hash,
  Loader2,
  Network,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sigma,
  TrendingUp,
} from 'lucide-react';

/**
 * R0513 OVERWATCH — read-only sensor panel.
 *
 * Backed by services/amaru/src/amaru/overwatch.py via the api-server's
 * `/api/amaru/overwatch/snapshot` proxy. No data on this page is computed
 * client-side: every value, status, and threshold comes from the canonical
 * `evaluate_panel(...)` function in the Amaru kernel.
 *
 * Doctrine reference: szl-holdings/ouroboros-thesis
 *   docs/anatomy/hatun-sources.md ("R0513 overwatch panel — 6 innovations")
 *   docs/anatomy/explainers/linkedin/linkedin_brain.md
 *     ("OVERWATCH — r0513, df4e9741. 146 SLOC. Read-only. Halt authority
 *      belongs to HUKLLA.")
 *
 * The 6 panel innovations:
 *   I1  KL drift watcher (per axis)
 *   I2  Joint-margin envelope
 *   I3  TUKUY mid-exec re-gate signal
 *   I4  reserved (preserves the panel slot)
 *   I5  Maxwell M=0 rigidity check (21-edge CHAKANA)
 *   I6  continuum_hash chain integrity
 */

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

type InvariantStatus = 'pass' | 'warn' | 'trip' | 'reserved';

interface Invariant {
  id: string;
  title: string;
  status: InvariantStatus;
  value: number | null;
  threshold: number | null;
  detail: string;
}

interface OverwatchSnapshot {
  panel_version: string;
  thesis_kernel_hash: string;
  thesis_brain_hash: string;
  read_only: boolean;
  invariants: Invariant[];
  summary: Record<string, number>;
}

const INVARIANT_ICONS: Record<string, typeof TrendingUp> = {
  I1: TrendingUp,
  I2: Activity,
  I3: GitMerge,
  I4: ShieldQuestion,
  I5: Network,
  I6: Hash,
};

const INVARIANT_HUMAN_TITLES: Record<string, string> = {
  I1: 'KL Drift (per axis)',
  I2: 'Joint-Margin Envelope',
  I3: 'TUKUY Mid-Exec Re-Gate',
  I4: 'Reserved Panel Slot',
  I5: 'Maxwell M=0 Rigidity (CHAKANA)',
  I6: 'continuum_hash Chain Integrity',
};

function statusBadge(status: InvariantStatus) {
  switch (status) {
    case 'pass':
      return (
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          <ShieldCheck className="w-3 h-3 mr-1" /> PASS
        </Badge>
      );
    case 'warn':
      return (
        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
          <ShieldAlert className="w-3 h-3 mr-1" /> WARN
        </Badge>
      );
    case 'trip':
      return (
        <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10">
          <AlertOctagon className="w-3 h-3 mr-1" /> TRIP
        </Badge>
      );
    case 'reserved':
      return (
        <Badge variant="outline" className="text-white/40 border-white/10 bg-white/5">
          <ShieldQuestion className="w-3 h-3 mr-1" /> RESERVED
        </Badge>
      );
  }
}

function fmtValue(v: number | null): string {
  if (v === null || v === undefined) return '—';
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(4);
}

export default function OverwatchR0513Page() {
  const query = useQuery<OverwatchSnapshot>({
    queryKey: ['amaru-overwatch-snapshot'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/amaru/overwatch/snapshot`, {
        credentials: 'include',
      });
      if (!r.ok) {
        const text = await r.text();
        let msg = `Amaru returned HTTP ${r.status}`;
        try {
          const j = JSON.parse(text);
          if (typeof j?.message === 'string') msg = j.message;
          else if (typeof j?.error === 'string') msg = j.error;
        } catch {
          /* keep generic message */
        }
        throw new Error(msg);
      }
      return (await r.json()) as OverwatchSnapshot;
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  const snap = query.data;
  const summary = snap?.summary ?? {};
  const trips = Number(summary.trip ?? 0);
  const warns = Number(summary.warn ?? 0);
  const passes = Number(summary.pass ?? 0);
  const reserved = Number(summary.reserved ?? 0);

  const halt = trips > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            R0513 OVERWATCH
            <Badge variant="outline" className="ml-2 text-[10px] font-mono">
              read-only sensor
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            R0513 watches every cycle. It does not write. Halt authority belongs to{' '}
            <span className="font-mono text-white/80">HUKLLA</span>. The 6-invariant
            panel below is computed by the Amaru kernel against live receipt-chain
            and chakana wiring snapshots — no value on this page is fabricated by
            the browser.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          data-testid="overwatch-refresh-btn"
        >
          {query.isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Re-evaluate panel
        </Button>
      </div>

      {/* Doctrine + sentry strip */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                Panel
              </p>
              <p className="font-mono text-sm mt-0.5">{snap?.panel_version ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                Kernel hash
              </p>
              <p className="font-mono text-sm mt-0.5">{snap?.thesis_kernel_hash ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                Brain hash
              </p>
              <p className="font-mono text-sm mt-0.5">{snap?.thesis_brain_hash ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                Read-only
              </p>
              <p className="text-sm mt-0.5 flex items-center gap-1">
                {snap === undefined ? (
                  <span className="text-white/40">—</span>
                ) : snap.read_only ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">enforced</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-300">VIOLATED</span>
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                Halt authority
              </p>
              <p className="font-mono text-sm mt-0.5">HUKLLA</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Halt banner when any TRIP */}
      {halt && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-300">
                {trips} invariant{trips === 1 ? '' : 's'} TRIPPED — HUKLLA halt
                request emitted by R0513.
              </p>
              <p className="text-red-200/70 text-xs mt-1">
                R0513 only observes. The halt decision is HUKLLA's. Until HUKLLA
                acknowledges, the cycle continues; the panel below shows the
                exact predicate that fired.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="PASS"
          value={passes}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          tone="emerald"
        />
        <KpiCard
          label="WARN"
          value={warns}
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          tone="amber"
        />
        <KpiCard
          label="TRIP"
          value={trips}
          icon={<AlertOctagon className="w-4 h-4 text-red-400" />}
          tone="red"
        />
        <KpiCard
          label="RESERVED"
          value={reserved}
          icon={<ShieldQuestion className="w-4 h-4 text-white/50" />}
          tone="muted"
        />
      </div>

      {/* Invariants */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sigma className="w-4 h-4" /> Six Invariants
        </h2>

        {query.isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {query.error && !snap && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold text-red-300 mb-1">
                Amaru sidecar did not respond.
              </p>
              <p className="text-xs text-red-200/70 mb-3">
                {query.error instanceof Error
                  ? query.error.message
                  : 'unknown error'}
              </p>
              <p className="text-xs text-white/50">
                The api-server proxies <code>/api/amaru/overwatch/snapshot</code>{' '}
                to the Amaru FastAPI service on port 6810. If the{' '}
                <code>artifacts/api-server: amaru</code> workflow has failed,
                restart it.
              </p>
            </CardContent>
          </Card>
        )}

        {snap && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {snap.invariants.map((inv) => {
              const Icon = INVARIANT_ICONS[inv.id] ?? Sigma;
              const title = INVARIANT_HUMAN_TITLES[inv.id] ?? inv.title;
              return (
                <Card key={inv.id} data-testid={`overwatch-invariant-${inv.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-mono text-xs text-white/40">
                          {inv.id}
                        </span>
                        <span>{title}</span>
                      </span>
                      {statusBadge(inv.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-white/70">{inv.detail}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[9px]">
                          Value
                        </p>
                        <p className="font-mono text-sm mt-0.5">
                          {fmtValue(inv.value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[9px]">
                          Threshold
                        </p>
                        <p className="font-mono text-sm mt-0.5">
                          {fmtValue(inv.threshold)}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-white/30 pt-1">
                      computed by amaru.overwatch.evaluate_panel
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer doctrine line */}
      <p className="text-[11px] text-white/30 font-mono text-center">
        R0513 · {snap?.panel_version ?? 'r0513.v1'} · kernel{' '}
        {snap?.thesis_kernel_hash ?? '01f6c9b6'} · brain{' '}
        {snap?.thesis_brain_hash ?? 'df4e9741'} · 146 SLOC · read-only · halt
        authority HUKLLA
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'amber' | 'red' | 'muted';
}) {
  const toneClasses: Record<typeof tone, string> = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
    muted: 'text-white/50',
  } as const;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">
            {label}
          </p>
          {icon}
        </div>
        <p className={`text-3xl font-bold font-mono mt-1 ${toneClasses[tone]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
