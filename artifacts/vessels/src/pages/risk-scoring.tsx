import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Slider } from '@szl-holdings/shared-ui/ui/slider';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { ShowTheMath } from '@/components/ShowTheMath';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface FleetVessel {
  id: number;
  orgId?: number;
  name?: string | null;
  imo?: string | null;
  flag?: string | null;
}

function extractErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const j = json as Record<string, unknown>;
    if (typeof j.error === 'string') return j.error;
    if (j.error && typeof j.error === 'object') {
      const e = j.error as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
    }
    if (typeof j.message === 'string') return j.message;
  }
  return fallback;
}

interface RiskPoint {
  computedAt: string;
  lambdaScore: number;
  severity?: number;
  likelihood?: number;
  valueAtRiskUsd?: number;
  driftScore?: number | null;
  formulaVersion?: string;
  receiptHash?: string | null;
  seeded?: boolean;
}

interface RiskHistoryResponse {
  vesselId: number;
  windowDays: number;
  formula: string;
  formulaVersion: string;
  points: RiskPoint[];
  seeded: boolean;
}

interface RecomputeResponse {
  vesselId: number;
  lambdaScore: number;
  rawRiskUsd: number;
  formula: string;
  formulaVersion: string;
  receiptHash: string;
  a11oyHandoff?: { handoffId: string; vesselsProofId: string; a11oyProofId: string } | null;
  computedAt: string;
}

function riskLevelFromLambda(lambda: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (lambda >= 0.85) return 'Critical';
  if (lambda >= 0.65) return 'High';
  if (lambda >= 0.4) return 'Medium';
  return 'Low';
}

const levelColor: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function RiskScoringPage() {
  const qc = useQueryClient();

  const { data: fleet, isLoading: fleetLoading } = useQuery<FleetVessel[]>({
    queryKey: ['vessels-fleet'],
    queryFn: () => api.vessels.list() as Promise<FleetVessel[]>,
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Default to first fleet vessel once loaded.
  useEffect(() => {
    if (selectedId === null && fleet && fleet.length > 0 && fleet[0]) {
      setSelectedId(fleet[0].id);
    }
  }, [fleet, selectedId]);

  // Clear any prior recompute result when the user switches vessels — the
  // displayed Λ/receipt/handoff must only ever refer to the current selection.
  useEffect(() => {
    recompute.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selected = useMemo(
    () => fleet?.find((v) => v.id === selectedId) ?? null,
    [fleet, selectedId],
  );

  const {
    data: history,
    isLoading: histLoading,
    isFetching: histFetching,
  } = useQuery<RiskHistoryResponse>({
    queryKey: ['vessels-risk-history', selectedId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/vessels/formula/risk-history/${selectedId}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error(`risk-history HTTP ${r.status}`);
      const json = await r.json();
      return (json.data ?? json) as RiskHistoryResponse;
    },
    enabled: selectedId !== null,
    staleTime: 30_000,
  });

  const latest: RiskPoint | undefined = history?.points[0];

  // Recompute inputs — seeded from latest point or sensible defaults.
  const [severity, setSeverity] = useState(0.5);
  const [likelihood, setLikelihood] = useState(0.5);
  const [varUsd, setVarUsd] = useState(500_000);

  useEffect(() => {
    if (latest) {
      if (typeof latest.severity === 'number') setSeverity(latest.severity);
      if (typeof latest.likelihood === 'number') setLikelihood(latest.likelihood);
      if (typeof latest.valueAtRiskUsd === 'number') setVarUsd(latest.valueAtRiskUsd);
    }
  }, [latest]);

  const recompute = useMutation<RecomputeResponse>({
    mutationFn: async () => {
      if (selectedId === null) throw new Error('No vessel selected');
      const body: Record<string, unknown> = {
        vesselId: selectedId,
        severity,
        likelihood,
        valueAtRiskUsd: varUsd,
        capUsd: 1_000_000,
      };
      // Pass orgId when the vessel exposes one so multi-org users don't hit
      // resolveOrgIdForWrite's 400. Single-org users: backend auto-resolves.
      if (typeof selected?.orgId === 'number') body.orgId = selected.orgId;
      const r = await fetch(`${API_BASE}/api/vessels/formula/risk-recompute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(extractErrorMessage(json, `Recompute failed (HTTP ${r.status})`));
      }
      return (json.data ?? json) as RecomputeResponse;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['vessels-risk-history', selectedId] });
      const handoffSuffix = result.a11oyHandoff
        ? ` — A11oy handoff ${result.a11oyHandoff.handoffId}`
        : '';
      toast.success(
        `Λ recomputed to ${result.lambdaScore.toFixed(3)}${handoffSuffix}`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Recompute failed');
    },
  });

  const chartPoints = (history?.points ?? []).slice().reverse().map((p) => ({
    date: fmtDate(p.computedAt),
    lambda: Math.round(p.lambdaScore * 1000) / 1000,
  }));

  const lambda = recompute.data?.lambdaScore ?? latest?.lambdaScore ?? 0;
  const level = riskLevelFromLambda(lambda);
  const lambdaPct = Math.round(lambda * 100);

  // Radar from the three driver axes the formula uses.
  const radarData = [
    { subject: 'Severity', value: Math.round(severity * 100), fullMark: 100 },
    { subject: 'Likelihood', value: Math.round(likelihood * 100), fullMark: 100 },
    { subject: 'Value at Risk', value: Math.min(100, Math.round((varUsd / 10_000))), fullMark: 100 },
    { subject: 'Drift', value: Math.round((latest?.driftScore ?? 0) * 100), fullMark: 100 },
    { subject: 'Λ Composite', value: lambdaPct, fullMark: 100 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Behavioral Risk Scoring Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Λ-normalized vessel risk — persisted history, canonical formula from{' '}
          <code className="font-mono text-[11px]">@szl-holdings/formulas</code>,
          A11oy cross-product handoff when Λ ≥ 0.7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Fleet ({fleet?.length ?? 0})
          </h3>
          {fleetLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading fleet…
            </div>
          )}
          {!fleetLoading && (fleet?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              No vessels in fleet. Add a vessel in the Fleet page to run risk
              scoring against it.
            </div>
          )}
          {(fleet ?? []).map((v) => {
            const isSel = v.id === selectedId;
            return (
              <Card
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`cursor-pointer transition-all hover:border-primary/30 ${isSel ? 'border-primary ring-1 ring-primary/20' : ''}`}
                data-testid={`risk-fleet-row-${v.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{v.name ?? `Vessel #${v.id}`}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {(v.flag ?? '—')} · IMO {v.imo ?? '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Center: Λ score + radar + history chart */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{selected?.name ?? 'Select a vessel'} — Λ Composite</span>
                {selected && (
                  <ShowTheMath
                    formulaId="lutar-invariant-5"
                    label="Lutar Invariant Λ"
                    expression="Λ = normalizedRiskScore(severity, likelihood, VaR, cap)"
                    inputs={{
                      severity,
                      likelihood,
                      valueAtRiskUsd: varUsd,
                      capUsd: 1_000_000,
                    }}
                    result={lambda}
                    thesisRef="v10 §2.5 — Λ-composite"
                    receiptHash={recompute.data?.receiptHash ?? latest?.receiptHash ?? null}
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-5xl font-bold font-mono ${levelColor[level].split(' ')[0]}`}>
                    {lambdaPct}
                  </p>
                  <Badge variant="outline" className={`mt-2 text-[10px] ${levelColor[level]}`}>
                    {level}
                  </Badge>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Radar
                        dataKey="value"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.25}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Λ History — 90 day</span>
                {history?.seeded && (
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                    No real history yet — seeded
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(histLoading || histFetching) && !history && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading history…
                </div>
              )}
              {chartPoints.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="lambda"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.15}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Recompute panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recompute Λ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Severity</span>
                  <span className="font-mono">{severity.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[severity]}
                  onValueChange={(v) => setSeverity(v[0] ?? 0)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Likelihood</span>
                  <span className="font-mono">{likelihood.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[likelihood]}
                  onValueChange={(v) => setLikelihood(v[0] ?? 0)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Value at Risk (USD)</span>
                  <span className="font-mono">${varUsd.toLocaleString()}</span>
                </div>
                <Slider
                  min={0}
                  max={1_000_000}
                  step={10_000}
                  value={[varUsd]}
                  onValueChange={(v) => setVarUsd(v[0] ?? 0)}
                />
              </div>

              <Button
                type="button"
                onClick={() => recompute.mutate()}
                disabled={selectedId === null || recompute.isPending}
                className="w-full"
                data-testid="risk-recompute-btn"
              >
                {recompute.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Recomputing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Recompute Λ
                  </>
                )}
              </Button>

              {recompute.data?.a11oyHandoff && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-[11px]">
                    <p className="font-semibold text-amber-300">Elevated risk — A11oy notified</p>
                    <p className="text-amber-200/70 font-mono mt-0.5 break-all">
                      {recompute.data.a11oyHandoff.handoffId}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Formula Provenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Formula</span>
                <code className="font-mono text-[11px]">{history?.formula ?? '—'}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <code className="font-mono text-[11px]">{history?.formulaVersion ?? 'lambda-v10'}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source</span>
                <code className="font-mono text-[11px]">@szl-holdings/formulas</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thesis</span>
                <code className="font-mono text-[11px]">v10 §2.5</code>
              </div>
              {(recompute.data?.receiptHash || latest?.receiptHash) && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Λ-receipt</span>
                  <Badge variant="outline" className="font-mono text-[10px] break-all">
                    {(recompute.data?.receiptHash ?? latest?.receiptHash ?? '').slice(0, 12)}…
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
