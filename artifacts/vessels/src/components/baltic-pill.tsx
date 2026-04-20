import { Activity } from 'lucide-react';
import {
  compareVoyageToBenchmark,
  type FreightBenchmarkSnapshot,
  inferVesselClassFromCargo,
  useFreightBenchmarks,
  type VesselClassKey,
} from '@/lib/freight-benchmarks';

function fmtMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

interface BalticPillProps {
  voyageTce: number;
  cargo?: string | null;
  vesselClass?: VesselClassKey | null;
  size?: 'sm' | 'xs';
  className?: string;
}

export function resolveVesselClass(
  snapshot: FreightBenchmarkSnapshot | undefined,
  vesselClass: VesselClassKey | null | undefined,
  cargo: string | null | undefined,
): VesselClassKey | null {
  if (vesselClass && snapshot?.benchmarksByLabel[vesselClass]) return vesselClass;
  return inferVesselClassFromCargo(cargo ?? null);
}

export function BalticPill({
  voyageTce,
  cargo,
  vesselClass,
  size = 'sm',
  className,
}: BalticPillProps) {
  const { data: snapshot } = useFreightBenchmarks();
  const classKey = resolveVesselClass(snapshot, vesselClass, cargo);
  const cmp = compareVoyageToBenchmark(snapshot, classKey, voyageTce);
  if (!cmp) return null;
  const above = cmp.aboveMarket;
  const baseSize =
    size === 'xs' ? 'text-[9px] px-1 py-0.5 gap-0.5' : 'text-[10px] px-1.5 py-0.5 gap-1';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span
      className={[
        'inline-flex items-center font-mono rounded border whitespace-nowrap',
        baseSize,
        above
          ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10'
          : 'text-red-300 border-red-500/25 bg-red-500/10',
        className ?? '',
      ].join(' ')}
      title={`Voyage TCE ${fmtMoney(cmp.voyageTce)}/day vs Baltic ${cmp.classKey} ${fmtMoney(cmp.benchmark.tce)}/day`}
    >
      <Activity className={iconSize} />
      vs Baltic: {above ? '+' : ''}
      {cmp.deltaPct.toFixed(1)}%
    </span>
  );
}
