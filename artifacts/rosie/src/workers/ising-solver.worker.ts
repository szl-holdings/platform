/**
 * Local browser-side Ising / Simulated Annealing solver.
 *
 * Runs OFF the main thread so the UI stays responsive while annealing.
 * Streams progress events back via postMessage so the optimizer surface
 * can render the energy trace live as the solver descends.
 *
 * Governance: this is a NARRATIVE/PREVIEW solver — the authoritative
 * receipt comes from the server's deterministic solver. The browser
 * worker exists so operators can see and feel the descent in real time.
 */

export type WorkerInput = {
  J: number[][];
  h: number[];
  seed: number;
  sweeps?: number;
  tStart?: number;
  tEnd?: number;
};

export type WorkerProgress =
  | { kind: "progress"; sweep: number; sweeps: number; energy: number; bestEnergy: number; temperature: number }
  | { kind: "done"; spins: number[]; energy: number; trace: number[]; iterations: number; ms: number }
  | { kind: "error"; message: string };

self.onmessage = (ev: MessageEvent<WorkerInput>) => {
  try {
    const { J, h, seed, sweeps = 600, tStart = 2.0, tEnd = 0.01 } = ev.data;
    const n = h.length;
    let state = seed >>> 0;
    const rng = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const spins = new Array<number>(n);
    for (let i = 0; i < n; i++) spins[i] = rng() < 0.5 ? -1 : 1;

    const energy = (s: number[]): number => {
      let e = 0;
      for (let i = 0; i < n; i++) {
        e += h[i] * s[i];
        for (let j = i + 1; j < n; j++) e += J[i][j] * s[i] * s[j];
      }
      return e;
    };
    const localField = (i: number, s: number[]): number => {
      let f = h[i];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const c = j < i ? J[j][i] : J[i][j];
        f += c * s[j];
      }
      return f;
    };

    let best = spins.slice();
    let bestE = energy(spins);
    const trace: number[] = [bestE];
    let iterations = 0;
    const t0 = performance.now();

    for (let sw = 0; sw < sweeps; sw++) {
      const t = tStart * Math.pow(tEnd / tStart, sw / Math.max(1, sweeps - 1));
      for (let i = 0; i < n; i++) {
        iterations++;
        const dE = -2 * spins[i] * localField(i, spins);
        if (dE <= 0 || rng() < Math.exp(-dE / t)) spins[i] = -spins[i];
      }
      const e = energy(spins);
      if (e < bestE) {
        bestE = e;
        best = spins.slice();
      }
      if (sw % 8 === 0) {
        trace.push(bestE);
        (self as unknown as Worker).postMessage({
          kind: "progress",
          sweep: sw,
          sweeps,
          energy: e,
          bestEnergy: bestE,
          temperature: t,
        } satisfies WorkerProgress);
      }
    }
    trace.push(bestE);
    (self as unknown as Worker).postMessage({
      kind: "done",
      spins: best,
      energy: bestE,
      trace,
      iterations,
      ms: performance.now() - t0,
    } satisfies WorkerProgress);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      kind: "error",
      message: String(err),
    } satisfies WorkerProgress);
  }
};
