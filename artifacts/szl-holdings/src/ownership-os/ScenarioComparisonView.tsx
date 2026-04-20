import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Scale,
  Shield,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from './api';
import { DisclaimerBanner, FitBadge, ScoreBar, StatusBadge } from './components';
import type { OwnershipScenario, ScenarioDetail } from './types';

export function ScenarioComparisonView() {
  const { data: scenarios = [], isLoading } = useStandardQuery<OwnershipScenario[]>({
    queryKey: ['ownership-scenarios'],
    queryFn: () => apiFetch('/ownership/scenarios?limit=50'),
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadedDetails, setLoadedDetails] = useState<Map<number, ScenarioDetail>>(new Map());

  useEffect(() => {
    const idsToLoad = selectedIds.filter((id) => !loadedDetails.has(id));
    if (idsToLoad.length === 0) return;
    Promise.all(
      idsToLoad.map((id) =>
        apiFetch<ScenarioDetail>(`/ownership/scenarios/${id}`).then((d) => [id, d] as const),
      ),
    ).then((results) => {
      setLoadedDetails((prev) => {
        const next = new Map(prev);
        for (const [id, d] of results) next.set(id, d);
        return next;
      });
    });
  }, [selectedIds]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const loaded = selectedIds
    .map((id) => loadedDetails.get(id))
    .filter((d): d is ScenarioDetail => !!d);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );

  const fitLevelRank: Record<string, number> = {
    strong: 3,
    moderate: 2,
    weak: 1,
    not_applicable: 0,
  };

  return (
    <div className="space-y-5">
      <DisclaimerBanner />
      <div>
        <h2 className="text-base font-semibold text-foreground">Compare Scenarios</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select up to 3 scenarios to compare side-by-side.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleSelect(s.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              selectedIds.includes(s.id)
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:border-primary/20 hover:text-foreground',
            )}
          >
            {selectedIds.includes(s.id) ? (
              <CheckSquare className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            {s.name}
            {s.isPreferred && <Star className="w-3 h-3 text-amber-500" />}
          </button>
        ))}
      </div>

      {selectedIds.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <Scale className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Select scenarios above to begin comparison.
          </p>
        </div>
      )}

      {loaded.length >= 2 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Readiness Scores
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Metric
                    </th>
                    {loaded.map((d) => (
                      <th
                        key={d.scenario.id}
                        className="text-center py-2 px-3 text-muted-foreground font-medium"
                      >
                        {d.scenario.name}
                        {d.scenario.isPreferred && (
                          <Star className="w-3 h-3 text-amber-500 inline ml-1" />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { label: 'Fundraising Fit', key: 'fundraisingFitScore' as const },
                    { label: 'Banking Fit', key: 'bankFitScore' as const },
                    { label: 'Investor Clarity', key: 'investorClarityScore' as const },
                  ].map((metric) => {
                    const vals = loaded.map((d) => d.scenario[metric.key] ?? 0);
                    const best = Math.max(...vals);
                    return (
                      <tr key={metric.key} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4 text-foreground font-medium">{metric.label}</td>
                        {loaded.map((d, i) => {
                          const v = d.scenario[metric.key];
                          return (
                            <td key={d.scenario.id} className="py-2.5 px-3 text-center">
                              <span
                                className={cn(
                                  'text-sm font-bold tabular-nums',
                                  vals[i] === best ? 'text-emerald-500' : 'text-foreground',
                                )}
                              >
                                {v ?? '—'}
                              </span>
                              {v != null && <span className="text-muted-foreground">/100</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Ownership Structure
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Owner</th>
                    {loaded.map((d) => (
                      <th
                        key={d.scenario.id}
                        className="text-center py-2 px-3 text-muted-foreground font-medium"
                      >
                        {d.scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Array.from(
                    new Set(loaded.flatMap((d) => d.allocations.map((a) => a.personName))),
                  ).map((name) => (
                    <tr key={name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-4 text-foreground font-medium">{name}</td>
                      {loaded.map((d) => {
                        const alloc = d.allocations.find((a) => a.personName === name);
                        return (
                          <td key={d.scenario.id} className="py-2 px-3 text-center">
                            {alloc ? (
                              <div className="space-y-0.5">
                                <span className="text-sm font-bold tabular-nums text-foreground">
                                  {alloc.equityPct}%
                                </span>
                                {alloc.isControlling && (
                                  <Shield className="w-3 h-3 text-primary mx-auto" />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Certification Fit Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Certification
                    </th>
                    {loaded.map((d) => (
                      <th
                        key={d.scenario.id}
                        className="text-center py-2 px-3 text-muted-foreground font-medium"
                      >
                        {d.scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Array.from(
                    new Set(loaded.flatMap((d) => d.certReadiness.map((c) => c.certificationName))),
                  ).map((certName) => {
                    const certs = loaded.map((d) =>
                      d.certReadiness.find((c) => c.certificationName === certName),
                    );
                    const bestRank = Math.max(
                      ...certs.map((c) => (c ? (fitLevelRank[c.fitLevel] ?? 0) : 0)),
                    );
                    return (
                      <tr key={certName} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4 text-foreground font-medium">{certName}</td>
                        {certs.map((cert, i) => (
                          <td key={loaded[i].scenario.id} className="py-2.5 px-3 text-center">
                            {cert ? (
                              <div className="space-y-1">
                                <FitBadge level={cert.fitLevel} />
                                {cert.gapSummary && (
                                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 max-w-[200px] mx-auto">
                                    {cert.gapSummary}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Control Authority Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Authority
                    </th>
                    {loaded.map((d) => (
                      <th
                        key={d.scenario.id}
                        className="text-center py-2 px-3 text-muted-foreground font-medium"
                      >
                        {d.scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(
                    [
                      'hasDayToDayControl',
                      'hasLongTermDecisionAuthority',
                      'hasHiringFiringAuthority',
                      'hasStrategicVeto',
                    ] as const
                  ).map((auth) => (
                    <tr key={auth} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-4 text-foreground">
                        {auth
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^has /, '')
                          .trim()}
                      </td>
                      {loaded.map((d) => {
                        const controller = d.controlRoles.find(
                          (r) => r.hasDayToDayControl || r.hasStrategicVeto,
                        );
                        const primaryRole = controller ?? d.controlRoles[0];
                        return (
                          <td key={d.scenario.id} className="py-2 px-3 text-center">
                            {primaryRole ? (
                              primaryRole[auth] ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                              )
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedIds.length === 1 && (
        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Select at least one more scenario to see the comparison.
          </p>
        </div>
      )}
    </div>
  );
}
