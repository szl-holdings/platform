/**
 * Demo eval call — exercises the Hoeffding LCB gate (Auer-Cesa-Bianchi-
 * Fischer 2002, §2.1) added to ROSIE's evolution loop. Documented in
 * docs/ingestion/agent-research.md as the "at least one eval call
 * demonstrates it in dev preview" deliverable of task #5405.
 *
 * Run:
 *   pnpm tsx scripts/demo-rosie-lcb-gate.ts
 */
import {
  evaluateObservedEvent,
  hoeffdingLowerBound,
  type ObservedEvent,
} from '../lib/formulas/src/evolution.js';

function mkEvent(samples: number, gap: number): ObservedEvent {
  return {
    formulaId: 'lutar_v6_holographic_twistor_cyclic',
    fromVersion: '6.0.0',
    parameter: 'cycle_phase_weight',
    oldValue: 0.5,
    candidateValue: 0.7,
    observedGap: gap,
    samples,
    gapHistory: Array.from({ length: samples }, () => gap),
    irreversibility: 0.1,
    thesisCitation: 'docs/thesis/v10-canonical.md §6.1',
  };
}

const cases = [
  { name: 'thin evidence  (n=30,   gap=15%)', event: mkEvent(30, 0.15) },
  { name: 'medium evidence (n=300,  gap=15%)', event: mkEvent(300, 0.15) },
  { name: 'thick evidence (n=3000, gap=15%)', event: mkEvent(3000, 0.15) },
];

console.log('\nROSIE evolution loop — Hoeffding LCB gate demo');
console.log('Source: Auer, Cesa-Bianchi, Fischer (2002) Machine Learning 47:235-256, §2.1');
console.log('        Hoeffding (1963) JASA 58:13-30');
console.log('Threshold: gapLcbMin = gapMin = 0.10 (production target)\n');

for (const c of cases) {
  const lcb = hoeffdingLowerBound(c.event.observedGap, c.event.samples, 0.05);
  const decision = evaluateObservedEvent(c.event, { gapLcbMin: 0.1 });
  console.log(`▸ ${c.name}`);
  console.log(`    point gap : ${(c.event.observedGap * 100).toFixed(1)}%`);
  console.log(`    95% LCB   : ${(lcb * 100).toFixed(1)}%   (radius ${(c.event.observedGap - lcb).toFixed(4)})`);
  console.log(`    decision  : ${decision.kind}`);
  if (decision.kind === 'noop') console.log(`    reason    : ${decision.reason}`);
  else console.log(`    score     : ${decision.proposal.score.toFixed(3)}`);
  console.log();
}

console.log('Interpretation:');
console.log('  - Same 15% point estimate produces three different decisions because');
console.log('    Hoeffding radius shrinks as √n. Thin evidence (n=30) gets rejected;');
console.log('    thick evidence (n=3000) clears the LCB gate.');
console.log('  - Pre-upgrade, all three would have queued identical proposals.');
console.log('  - Operators dial gapLcbMin via ROSIE_GAP_LCB_MIN env (default 0 =');
console.log('    informational; production target = gapMin).');
