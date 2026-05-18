/**
 * Canonical TS example detector — `ts-example/heuristic-port-scan`.
 *
 * Flags a simple port-scan pattern from existing telemetry rows: a single
 * source IP touching >= `params.distinctPortsMin` distinct destination
 * ports within `params.windowMinutes`. Intentionally simple — its job is
 * to prove that the framework round-trips telemetry → finding → receipt
 * without dragging in real EDR coverage.
 */
import type { Detector, Finding } from '@szl-holdings/sentra-detector-sdk';

interface ConnRow {
  srcIp: string;
  dstIp: string;
  dstPort: number;
  ts: string;
}

export const heuristicPortScanDetector: Detector = {
  manifest: {
    id: 'ts-example/heuristic-port-scan',
    label: 'Heuristic Port Scan',
    description:
      'Flags a single source IP touching N+ distinct destination ports within a sliding window — the simplest possible reconnaissance signal, included to exercise the framework.',
    kind: 'heuristic',
    runtime: 'ts',
    inputs: ['network.flows'],
    costClass: 'cheap',
    governanceClass: 'advisory',
    attackTechniques: ['T1046'],
    version: '1.0.0',
  },
  async evaluate(ctx) {
    const distinctPortsMin = Number(ctx.params.distinctPortsMin ?? 12);
    const rows = ((await ctx.read('network.flows')) ?? []) as ConnRow[];
    ctx.trace('input.loaded', { rows: rows.length, distinctPortsMin });

    const bySrc = new Map<string, Set<number>>();
    const dstBySrc = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!r?.srcIp || typeof r.dstPort !== 'number') continue;
      let ports = bySrc.get(r.srcIp);
      if (!ports) {
        ports = new Set();
        bySrc.set(r.srcIp, ports);
      }
      ports.add(r.dstPort);
      let dsts = dstBySrc.get(r.srcIp);
      if (!dsts) {
        dsts = new Set();
        dstBySrc.set(r.srcIp, dsts);
      }
      if (r.dstIp) dsts.add(r.dstIp);
    }

    const findings: Finding[] = [];
    let idx = 0;
    for (const [srcIp, ports] of bySrc) {
      if (ports.size < distinctPortsMin) continue;
      const score = Math.min(1, ports.size / (distinctPortsMin * 2));
      const severity =
        ports.size >= distinctPortsMin * 4
          ? 'high'
          : ports.size >= distinctPortsMin * 2
            ? 'medium'
            : 'low';
      findings.push({
        id: `${ctx.detectorId}#${ctx.runId}#${idx++}`,
        detectorId: ctx.detectorId,
        runId: ctx.runId,
        severity,
        score,
        title: `Possible port scan from ${srcIp}`,
        summary: `${srcIp} touched ${ports.size} distinct destination ports across ${dstBySrc.get(srcIp)?.size ?? 0} hosts in the window.`,
        attackTechniques: ['T1046'],
        affectedAssets: Array.from(dstBySrc.get(srcIp) ?? []),
        evidence: {
          srcIp,
          distinctPorts: ports.size,
          distinctDsts: dstBySrc.get(srcIp)?.size ?? 0,
          samplePorts: Array.from(ports).slice(0, 16),
        },
        recommendedAction: {
          kind: 'investigate',
          detail: `Correlate ${srcIp} against asset inventory; consider perimeter block if not internal.`,
        },
        emittedAt: new Date().toISOString(),
        governanceClass: 'advisory',
      });
    }
    ctx.trace('finished', { findings: findings.length });
    return findings;
  },
};
