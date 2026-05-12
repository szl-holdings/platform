import { classifyCoherence, runKuramoto } from "../src/index.js";

const N = 24;
const oscillators = Array.from({ length: N }, (_, i) => ({
  phase: (2 * Math.PI * i) / N,
  omega: 1 + 0.1 * Math.cos(i),
}));

for (const K of [0, 1, 2, 4, 8]) {
  const { rTrace } = runKuramoto({ oscillators, couplingK: K }, 400, 0.05);
  const final = rTrace[rTrace.length - 1]!;
  console.log(
    `K=${K.toFixed(1)}  final r = ${final.toFixed(4)}  → ${classifyCoherence(final)}`,
  );
}
