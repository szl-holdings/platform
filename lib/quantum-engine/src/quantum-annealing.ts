/**
 * Simulated Quantum Annealing (SQA)
 *
 * Implements quantum tunneling concepts on classical hardware.
 * Unlike classical simulated annealing (which uses thermal fluctuations),
 * SQA uses a transverse-field Hamiltonian to allow tunneling through
 * energy barriers that would trap classical SA — producing better solutions
 * on NP-hard combinatorial problems.
 *
 * Mathematical basis: PIMC (Path-Integral Monte Carlo) representation of
 * the transverse-field Ising model. The tunneling field Γ(t) is annealed
 * from Γ_max → 0 while temperature T is also reduced, allowing quantum
 * fluctuations to explore the solution space more efficiently than
 * purely thermal methods.
 *
 * Reference: Kadowaki & Nishimori (1998), Farhi et al. (2001 QA).
 */

export interface AnnealingProblem {
  variables: string[];
  couplings: Array<{ i: number; j: number; weight: number }>;
  localFields: number[];
  objective: 'minimize' | 'maximize';
}

export interface AnnealingConfig {
  troterSlices?: number;
  initialTunneling?: number;
  finalTunneling?: number;
  initialTemperature?: number;
  finalTemperature?: number;
  sweeps?: number;
  seed?: number;
}

export interface AnnealingResult {
  solution: number[];
  energy: number;
  iterationsRun: number;
  tunnelingPath: number[];
  improvementOverClassical: number;
  durationMs: number;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function computeEnergy(
  spins: number[],
  couplings: Array<{ i: number; j: number; weight: number }>,
  localFields: number[],
): number {
  let energy = 0;
  for (const c of couplings) {
    energy -= c.weight * spins[c.i]! * spins[c.j]!;
  }
  for (let i = 0; i < spins.length; i++) {
    energy -= (localFields[i] ?? 0) * spins[i]!;
  }
  return energy;
}

function computeLocalEnergy(
  spinIndex: number,
  replicas: number[][],
  replicaIndex: number,
  couplings: Array<{ i: number; j: number; weight: number }>,
  localFields: number[],
  tunnelingField: number,
  temperature: number,
  troterSlices: number,
): number {
  const spins = replicas[replicaIndex]!;
  let localEnergy = 0;

  const relevantCouplings = couplings.filter((c) => c.i === spinIndex || c.j === spinIndex);
  for (const c of relevantCouplings) {
    const neighbor = c.i === spinIndex ? c.j : c.i;
    localEnergy -= c.weight * spins[neighbor]!;
  }
  localEnergy -= localFields[spinIndex] ?? 0;

  const prevReplica = (replicaIndex - 1 + troterSlices) % troterSlices;
  const nextReplica = (replicaIndex + 1) % troterSlices;
  const tunnelingCoupling =
    (-temperature * troterSlices * 0.5) *
    Math.log(Math.tanh(tunnelingField / (temperature * troterSlices)));
  localEnergy -=
    tunnelingCoupling *
    (replicas[prevReplica]![spinIndex]! + replicas[nextReplica]![spinIndex]!);

  return localEnergy * spins[spinIndex]!;
}

export function solveQuantumAnnealing(
  problem: AnnealingProblem,
  config: AnnealingConfig = {},
): AnnealingResult {
  const startMs = Date.now();
  const n = problem.variables.length;
  const troterSlices = config.troterSlices ?? Math.max(8, Math.ceil(n / 4));
  const sweeps = config.sweeps ?? 1000;
  const initTunneling = config.initialTunneling ?? 2.0;
  const finalTunneling = config.finalTunneling ?? 0.01;
  const initTemp = config.initialTemperature ?? 2.0;
  const finalTemp = config.finalTemperature ?? 0.01;

  const rand = seededRandom(config.seed ?? 42);

  const replicas: number[][] = Array.from({ length: troterSlices }, () =>
    Array.from({ length: n }, () => (rand() > 0.5 ? 1 : -1)),
  );

  const tunnelingPath: number[] = [];
  let bestEnergy = Infinity * (problem.objective === 'minimize' ? 1 : -1);
  let bestSpins: number[] = [...replicas[0]!];

  for (let sweep = 0; sweep < sweeps; sweep++) {
    const progress = sweep / sweeps;
    const temperature = initTemp * Math.pow(finalTemp / initTemp, progress);
    const tunneling = initTunneling * Math.pow(finalTunneling / initTunneling, progress);
    tunnelingPath.push(tunneling);

    for (let r = 0; r < troterSlices; r++) {
      for (let i = 0; i < n; i++) {
        const dE =
          -2.0 *
          computeLocalEnergy(i, replicas, r, problem.couplings, problem.localFields, tunneling, temperature, troterSlices);

        if (dE < 0 || rand() < Math.exp(-dE / temperature)) {
          replicas[r]![i] = -replicas[r]![i]!;
        }
      }
    }

    const avgSpins = replicas[0]!.map((_, i) =>
      Math.sign(replicas.reduce((s, rep) => s + rep[i]!, 0)),
    );
    const energy = computeEnergy(avgSpins, problem.couplings, problem.localFields);
    const isBetter =
      problem.objective === 'minimize' ? energy < bestEnergy : energy > bestEnergy;
    if (isBetter) {
      bestEnergy = energy;
      bestSpins = [...avgSpins];
    }
  }

  const classicalGreedyEnergy = solveClassicalGreedy(problem);
  const improvement =
    problem.objective === 'minimize'
      ? (classicalGreedyEnergy - bestEnergy) / Math.abs(classicalGreedyEnergy + 1e-10)
      : (bestEnergy - classicalGreedyEnergy) / Math.abs(classicalGreedyEnergy + 1e-10);

  return {
    solution: bestSpins,
    energy: bestEnergy,
    iterationsRun: sweeps,
    tunnelingPath: tunnelingPath.filter((_, i) => i % Math.floor(sweeps / 20) === 0),
    improvementOverClassical: Math.max(0, improvement),
    durationMs: Date.now() - startMs,
  };
}

function solveClassicalGreedy(problem: AnnealingProblem): number {
  const n = problem.variables.length;
  const spins = Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : -1));

  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < n; i++) {
      let localField = problem.localFields[i] ?? 0;
      for (const c of problem.couplings) {
        if (c.i === i) localField += c.weight * spins[c.j]!;
        if (c.j === i) localField += c.weight * spins[c.i]!;
      }
      // Minimize: align spin with local field (lowers energy = -h*s - J*s*s).
      // Maximize: anti-align spin with local field (raises energy toward +∞).
      spins[i] = problem.objective === 'minimize' ? (localField > 0 ? 1 : -1) : (localField > 0 ? -1 : 1);
    }
  }

  return computeEnergy(spins, problem.couplings, problem.localFields);
}
