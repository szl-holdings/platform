import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

type DistributionType = 'normal' | 'log_normal' | 'uniform' | 'triangular' | 'beta' | 'poisson' | 'constant';

interface DistributionConfig {
  type: DistributionType;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
  alpha?: number;
  beta?: number;
  lambda?: number;
  value?: number;
}

interface MonteCarloInput {
  id: string;
  label: string;
  distribution: DistributionConfig;
  unit?: string;
}

interface ProbabilityBand {
  label: string;
  lower: number;
  upper: number;
  probability: number;
  color: string;
}

interface PathPoint {
  step: number;
  value: number;
}

interface OutputDistribution {
  id: string;
  label: string;
  unit: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  percentiles: Record<string, number>;
  probabilityBands: ProbabilityBand[];
  histogram: { binStart: number; binEnd: number; count: number; density: number }[];
  cdf: { value: number; probability: number }[];
  values: number[];
}

interface MonteCarloFabricResult {
  simulationId: string;
  iterations: number;
  validIterations: number;
  constraintViolationRate: number;
  durationMs: number;
  inputs: MonteCarloInput[];
  outputs: OutputDistribution[];
  samplePaths: PathPoint[][];
  correlationMatrix: Record<string, Record<string, number>>;
  sensitivityTornado: { inputId: string; inputLabel: string; lowImpact: number; highImpact: number; elasticity: number }[];
  timestamp: string;
}

function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev;
}

function randomTriangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  return u < fc
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function randomLogNormal(mean: number, stdDev: number): number {
  const mu = Math.log(mean * mean / Math.sqrt(stdDev * stdDev + mean * mean));
  const sigma = Math.sqrt(Math.log(1 + (stdDev * stdDev) / (mean * mean)));
  return Math.exp(randomNormal(mu, sigma));
}

function randomBeta(alpha: number, beta: number): number {
  const ga = randomGamma(alpha);
  const gb = randomGamma(beta);
  return ga / (ga + gb);
}

function randomGamma(shape: number): number {
  if (shape < 1) {
    return randomGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = randomNormal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleDistribution(config: DistributionConfig): number {
  switch (config.type) {
    case 'normal':
      return randomNormal(config.mean ?? 0, config.stdDev ?? 1);
    case 'log_normal':
      return randomLogNormal(config.mean ?? 1, config.stdDev ?? 0.5);
    case 'uniform':
      return (config.min ?? 0) + Math.random() * ((config.max ?? 1) - (config.min ?? 0));
    case 'triangular':
      return randomTriangular(config.min ?? 0, config.mode ?? 0.5, config.max ?? 1);
    case 'beta': {
      const raw = randomBeta(config.alpha ?? 2, config.beta ?? 5);
      const lo = config.min ?? 0;
      const hi = config.max ?? 1;
      return lo + raw * (hi - lo);
    }
    case 'poisson': {
      const L = Math.exp(-(config.lambda ?? 1));
      let k = 0, p = 1;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    }
    case 'constant':
      return config.value ?? 0;
    default:
      return randomNormal(0, 1);
  }
}

function computePercentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

function computeSkewness(values: number[], mean: number, stdDev: number): number {
  if (stdDev === 0 || values.length < 3) return 0;
  const n = values.length;
  const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function computeKurtosis(values: number[], mean: number, stdDev: number): number {
  if (stdDev === 0 || values.length < 4) return 0;
  const n = values.length;
  const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
}

function buildHistogram(values: number[], buckets: number = 30): { binStart: number; binEnd: number; count: number; density: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / buckets;
  const bins: { binStart: number; binEnd: number; count: number; density: number }[] = [];
  for (let i = 0; i < buckets; i++) {
    bins.push({ binStart: min + i * binWidth, binEnd: min + (i + 1) * binWidth, count: 0, density: 0 });
  }
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), buckets - 1);
    bins[idx]!.count++;
  }
  for (const b of bins) {
    b.density = b.count / (values.length * binWidth);
  }
  return bins;
}

function buildCdf(sorted: number[], steps: number = 50): { value: number; probability: number }[] {
  const result: { value: number; probability: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const idx = Math.floor((i / (steps - 1)) * (sorted.length - 1));
    result.push({ value: sorted[idx]!, probability: (idx + 1) / sorted.length });
  }
  return result;
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!; sumB += b[i]!;
    sumAB += a[i]! * b[i]!;
    sumA2 += a[i]! * a[i]!;
    sumB2 += b[i]! * b[i]!;
  }
  const denom = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return denom === 0 ? 0 : (n * sumAB - sumA * sumB) / denom;
}

const PRESET_SCENARIOS: Record<string, { title: string; description: string; domain: string; inputs: MonteCarloInput[]; outputExpr: { id: string; label: string; unit: string; expr: (inputs: Record<string, number>) => number }[] }> = {
  'terra/cap-rate-forecast': {
    title: 'Cap Rate Forecast (Monte Carlo)',
    description: 'Probabilistic cap rate forecast using macro drivers and property fundamentals',
    domain: 'terra',
    inputs: [
      { id: 'tenYearYield', label: '10Y Treasury Yield (%)', distribution: { type: 'normal', mean: 4.25, stdDev: 0.4 }, unit: '%' },
      { id: 'vacancyRate', label: 'Vacancy Rate (%)', distribution: { type: 'triangular', min: 5, mode: 8.5, max: 16 }, unit: '%' },
      { id: 'noiGrowth', label: 'NOI Growth (%)', distribution: { type: 'normal', mean: 2.8, stdDev: 1.5 }, unit: '%' },
      { id: 'capExRate', label: 'CapEx as % of NOI', distribution: { type: 'triangular', min: 8, mode: 12, max: 22 }, unit: '%' },
      { id: 'riskPremium', label: 'Risk Premium (bps)', distribution: { type: 'normal', mean: 180, stdDev: 40 }, unit: 'bps' },
    ],
    outputExpr: [
      { id: 'predictedCapRate', label: 'Predicted Cap Rate', unit: '%', expr: (i) => (i.tenYearYield! + i.riskPremium! / 100) * (1 + i.vacancyRate! / 100 * 0.3) - i.noiGrowth! * 0.15 },
      { id: 'impliedValue', label: 'Implied Value ($M)', unit: '$M', expr: (i) => { const cr = (i.tenYearYield! + i.riskPremium! / 100) * (1 + i.vacancyRate! / 100 * 0.3) - i.noiGrowth! * 0.15; return cr > 0 ? 10 / (cr / 100) : 0; } },
      { id: 'cashOnCash', label: 'Cash-on-Cash Return', unit: '%', expr: (i) => { const cr = (i.tenYearYield! + i.riskPremium! / 100) * (1 + i.vacancyRate! / 100 * 0.3) - i.noiGrowth! * 0.15; return cr * (1 - i.capExRate! / 100); } },
    ],
  },
  'vessels/voyage-pnl': {
    title: 'Voyage P&L Simulation',
    description: 'Monte Carlo simulation of voyage economics with stochastic fuel, weather, and rate variability',
    domain: 'vessels',
    inputs: [
      { id: 'bunkerPrice', label: 'Bunker Price ($/MT)', distribution: { type: 'log_normal', mean: 620, stdDev: 120 }, unit: '$/MT' },
      { id: 'dailyConsumption', label: 'Daily Consumption (MT)', distribution: { type: 'triangular', min: 28, mode: 34, max: 44 }, unit: 'MT' },
      { id: 'voyageDays', label: 'Voyage Days', distribution: { type: 'normal', mean: 22, stdDev: 3 }, unit: 'days' },
      { id: 'charterRate', label: 'Charter Rate ($/day)', distribution: { type: 'normal', mean: 42000, stdDev: 8000 }, unit: '$/day' },
      { id: 'weatherDelay', label: 'Weather Delay (days)', distribution: { type: 'poisson', lambda: 1.5 }, unit: 'days' },
      { id: 'canalFee', label: 'Canal Fee ($K)', distribution: { type: 'triangular', min: 200, mode: 350, max: 500 }, unit: '$K' },
    ],
    outputExpr: [
      { id: 'totalRevenue', label: 'Total Revenue', unit: '$K', expr: (i) => i.charterRate! * (i.voyageDays! + i.weatherDelay!) / 1000 },
      { id: 'bunkerCost', label: 'Bunker Cost', unit: '$K', expr: (i) => i.bunkerPrice! * i.dailyConsumption! * (i.voyageDays! + i.weatherDelay!) / 1000 },
      { id: 'totalCost', label: 'Total Cost', unit: '$K', expr: (i) => i.bunkerPrice! * i.dailyConsumption! * (i.voyageDays! + i.weatherDelay!) / 1000 + i.canalFee! + 85 },
      { id: 'netPnl', label: 'Net P&L', unit: '$K', expr: (i) => { const rev = i.charterRate! * (i.voyageDays! + i.weatherDelay!) / 1000; const cost = i.bunkerPrice! * i.dailyConsumption! * (i.voyageDays! + i.weatherDelay!) / 1000 + i.canalFee! + 85; return rev - cost; } },
      { id: 'tceRate', label: 'TCE Rate', unit: '$/day', expr: (i) => { const rev = i.charterRate! * (i.voyageDays! + i.weatherDelay!); const cost = (i.bunkerPrice! * i.dailyConsumption! * (i.voyageDays! + i.weatherDelay!)) + i.canalFee! * 1000 + 85000; return (rev - cost) / (i.voyageDays! + i.weatherDelay!); } },
    ],
  },
  'lyte/revenue-forecast': {
    title: 'Revenue Forecast Simulation',
    description: 'Probabilistic revenue forecast with growth, churn, and market expansion variability',
    domain: 'lyte',
    inputs: [
      { id: 'baseRevenue', label: 'Base Revenue ($M)', distribution: { type: 'constant', value: 24.5 }, unit: '$M' },
      { id: 'organicGrowth', label: 'Organic Growth (%)', distribution: { type: 'normal', mean: 12, stdDev: 4 }, unit: '%' },
      { id: 'churnRate', label: 'Churn Rate (%)', distribution: { type: 'beta', alpha: 2, beta: 15, min: 0, max: 15 }, unit: '%' },
      { id: 'newMarketUplift', label: 'New Market Uplift (%)', distribution: { type: 'triangular', min: 0, mode: 5, max: 18 }, unit: '%' },
      { id: 'pricingPower', label: 'Pricing Power (%)', distribution: { type: 'normal', mean: 3, stdDev: 1.5 }, unit: '%' },
    ],
    outputExpr: [
      { id: 'projectedRevenue', label: 'Projected Revenue', unit: '$M', expr: (i) => i.baseRevenue! * (1 + i.organicGrowth! / 100 - i.churnRate! / 100 + i.newMarketUplift! / 100 + i.pricingPower! / 100) },
      { id: 'netGrowthRate', label: 'Net Growth Rate', unit: '%', expr: (i) => i.organicGrowth! - i.churnRate! + i.newMarketUplift! + i.pricingPower! },
      { id: 'revenueAtRisk', label: 'Revenue at Risk', unit: '$M', expr: (i) => i.baseRevenue! * i.churnRate! / 100 },
    ],
  },
};

const runSimulationSchema = z.object({
  scenarioId: z.string().optional(),
  inputs: z.array(z.object({
    id: z.string(),
    label: z.string(),
    distribution: z.object({
      type: z.enum(['normal', 'log_normal', 'uniform', 'triangular', 'beta', 'poisson', 'constant']),
      mean: z.number().optional(),
      stdDev: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      mode: z.number().optional(),
      alpha: z.number().optional(),
      beta: z.number().optional(),
      lambda: z.number().optional(),
      value: z.number().optional(),
    }),
    unit: z.string().optional(),
  })).optional(),
  iterations: z.number().int().min(1000).max(100000).default(10000),
  outputMetricId: z.string().optional(),
});

router.get('/monte-carlo-fabric/scenarios', noAuth, (_req, res) => {
  try {
    const scenarios = Object.entries(PRESET_SCENARIOS).map(([id, s]) => ({
      id,
      title: s.title,
      description: s.description,
      domain: s.domain,
      inputCount: s.inputs.length,
      outputCount: s.outputExpr.length,
      inputs: s.inputs.map((i) => ({
        id: i.id,
        label: i.label,
        distribution: i.distribution,
        unit: i.unit,
      })),
      outputs: s.outputExpr.map((o) => ({ id: o.id, label: o.label, unit: o.unit })),
    }));
    sendSuccess(res, { scenarios, count: scenarios.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list Monte Carlo scenarios');
  }
});

router.post('/monte-carlo-fabric/simulate', noAuth, validateBody(runSimulationSchema), (req, res) => {
  try {
    const body = req.body as z.infer<typeof runSimulationSchema>;
    const iterations = body.iterations ?? 10000;

    let inputs: MonteCarloInput[];
    let outputExprs: { id: string; label: string; unit: string; expr: (inputs: Record<string, number>) => number }[];

    if (body.scenarioId && PRESET_SCENARIOS[body.scenarioId]) {
      const preset = PRESET_SCENARIOS[body.scenarioId]!;
      inputs = body.inputs ?? preset.inputs;
      outputExprs = preset.outputExpr;
    } else if (body.inputs && body.inputs.length > 0) {
      inputs = body.inputs as MonteCarloInput[];
      outputExprs = [{ id: 'output', label: 'Output', unit: '', expr: (i) => Object.values(i).reduce((s, v) => s + v, 0) }];
    } else {
      sendBadRequest(res, 'Provide a valid scenarioId or custom inputs');
      return;
    }

    const startMs = Date.now();
    const inputSamples: Record<string, number[]> = {};
    const outputSamples: Record<string, number[]> = {};

    for (const inp of inputs) inputSamples[inp.id] = [];
    for (const out of outputExprs) outputSamples[out.id] = [];

    let validIterations = 0;
    let constraintViolations = 0;

    const samplePathCount = 20;
    const samplePathInterval = Math.max(1, Math.floor(iterations / 100));
    const samplePaths: PathPoint[][] = Array.from({ length: samplePathCount }, () => []);

    for (let i = 0; i < iterations; i++) {
      const inputValues: Record<string, number> = {};
      for (const inp of inputs) {
        const val = sampleDistribution(inp.distribution);
        inputValues[inp.id] = val;
        inputSamples[inp.id]!.push(val);
      }

      let valid = true;
      const outputValues: Record<string, number> = {};
      for (const out of outputExprs) {
        try {
          const val = out.expr(inputValues);
          if (!Number.isFinite(val)) { valid = false; break; }
          outputValues[out.id] = val;
        } catch {
          valid = false;
          break;
        }
      }

      if (!valid) { constraintViolations++; continue; }

      validIterations++;
      for (const out of outputExprs) {
        outputSamples[out.id]!.push(outputValues[out.id]!);
      }

      if (i % samplePathInterval === 0) {
        const pathIdx = Math.floor(i / samplePathInterval) % samplePathCount;
        if (pathIdx < samplePathCount) {
          const primaryOutput = outputExprs[0]!;
          samplePaths[pathIdx]!.push({ step: i, value: outputValues[primaryOutput.id]! });
        }
      }
    }

    const durationMs = Date.now() - startMs;

    const outputs: OutputDistribution[] = outputExprs.map((out) => {
      const values = outputSamples[out.id] ?? [];
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      if (n === 0) {
        return {
          id: out.id, label: out.label, unit: out.unit,
          mean: 0, median: 0, stdDev: 0, min: 0, max: 0, skewness: 0, kurtosis: 0,
          percentiles: {}, probabilityBands: [], histogram: [], cdf: [], values: [],
        };
      }

      const mean = values.reduce((s, v) => s + v, 0) / n;
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
      const stdDev = Math.sqrt(variance);
      const median = computePercentile(sorted, 50);

      const percentiles: Record<string, number> = {};
      for (const p of [1, 5, 10, 25, 50, 75, 90, 95, 99]) {
        percentiles[`p${p}`] = computePercentile(sorted, p);
      }

      const probabilityBands: ProbabilityBand[] = [
        { label: 'P5–P25 (Downside)', lower: percentiles.p5!, upper: percentiles.p25!, probability: 0.20, color: '#ef4444' },
        { label: 'P25–P50 (Below Median)', lower: percentiles.p25!, upper: percentiles.p50!, probability: 0.25, color: '#f59e0b' },
        { label: 'P50–P75 (Above Median)', lower: percentiles.p50!, upper: percentiles.p75!, probability: 0.25, color: '#22c55e' },
        { label: 'P75–P95 (Upside)', lower: percentiles.p75!, upper: percentiles.p95!, probability: 0.20, color: '#3b82f6' },
      ];

      return {
        id: out.id,
        label: out.label,
        unit: out.unit,
        mean: Number(mean.toFixed(4)),
        median: Number(median.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        min: sorted[0]!,
        max: sorted[n - 1]!,
        skewness: Number(computeSkewness(values, mean, stdDev).toFixed(4)),
        kurtosis: Number(computeKurtosis(values, mean, stdDev).toFixed(4)),
        percentiles,
        probabilityBands,
        histogram: buildHistogram(values, 30),
        cdf: buildCdf(sorted, 50),
        values: sorted.filter((_, idx) => idx % Math.max(1, Math.floor(n / 500)) === 0),
      };
    });

    const correlationMatrix: Record<string, Record<string, number>> = {};
    const allKeys = [...inputs.map((i) => i.id), ...outputExprs.map((o) => o.id)];
    const allSamples: Record<string, number[]> = { ...inputSamples, ...outputSamples };
    for (const k1 of allKeys) {
      correlationMatrix[k1] = {};
      for (const k2 of allKeys) {
        correlationMatrix[k1]![k2] = Number(pearsonCorrelation(allSamples[k1] ?? [], allSamples[k2] ?? []).toFixed(4));
      }
    }

    const primaryOutput = outputExprs[0]!;
    const baselineOutputMean = outputs.find((o) => o.id === primaryOutput.id)?.mean ?? 0;
    const sensitivityTornado = inputs.map((inp) => {
      const sorted = [...(inputSamples[inp.id] ?? [])].sort((a, b) => a - b);
      if (sorted.length < 10) return { inputId: inp.id, inputLabel: inp.label, lowImpact: 0, highImpact: 0, elasticity: 0 };
      const lowIdx = Math.floor(sorted.length * 0.1);
      const highIdx = Math.floor(sorted.length * 0.9);
      const lowVal = sorted[lowIdx]!;
      const highVal = sorted[highIdx]!;

      const lowInputs: Record<string, number> = {};
      const highInputs: Record<string, number> = {};
      for (const other of inputs) {
        const otherSorted = [...(inputSamples[other.id] ?? [])].sort((a, b) => a - b);
        const midVal = otherSorted[Math.floor(otherSorted.length / 2)] ?? 0;
        lowInputs[other.id] = midVal;
        highInputs[other.id] = midVal;
      }
      lowInputs[inp.id] = lowVal;
      highInputs[inp.id] = highVal;

      const lowOutput = primaryOutput.expr(lowInputs);
      const highOutput = primaryOutput.expr(highInputs);

      const inputRange = highVal - lowVal;
      const outputRange = highOutput - lowOutput;
      const elasticity = inputRange !== 0 && baselineOutputMean !== 0
        ? (outputRange / baselineOutputMean) / (inputRange / ((lowVal + highVal) / 2))
        : 0;

      return {
        inputId: inp.id,
        inputLabel: inp.label,
        lowImpact: Number(lowOutput.toFixed(4)),
        highImpact: Number(highOutput.toFixed(4)),
        elasticity: Number(elasticity.toFixed(4)),
      };
    }).sort((a, b) => Math.abs(b.highImpact - b.lowImpact) - Math.abs(a.highImpact - a.lowImpact));

    const result: MonteCarloFabricResult = {
      simulationId: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      iterations,
      validIterations,
      constraintViolationRate: Number((constraintViolations / iterations).toFixed(6)),
      durationMs,
      inputs,
      outputs,
      samplePaths,
      correlationMatrix,
      sensitivityTornado,
      timestamp: new Date().toISOString(),
    };

    sendSuccess(res, { result });
  } catch (err) {
    handleRouteError(res, err, 'Failed to run Monte Carlo simulation');
  }
});

router.get('/monte-carlo-fabric/distributions', noAuth, (_req, res) => {
  try {
    sendSuccess(res, {
      distributions: [
        { type: 'normal', label: 'Normal (Gaussian)', params: ['mean', 'stdDev'], description: 'Bell curve — most common for symmetric uncertainties' },
        { type: 'log_normal', label: 'Log-Normal', params: ['mean', 'stdDev'], description: 'Right-skewed — common for prices, costs, durations' },
        { type: 'uniform', label: 'Uniform', params: ['min', 'max'], description: 'Equal probability across range — maximum uncertainty' },
        { type: 'triangular', label: 'Triangular', params: ['min', 'mode', 'max'], description: 'Three-point estimate — practical for expert judgment' },
        { type: 'beta', label: 'Beta', params: ['alpha', 'beta', 'min', 'max'], description: 'Flexible shape — common for rates and proportions' },
        { type: 'poisson', label: 'Poisson', params: ['lambda'], description: 'Count data — events per time period' },
        { type: 'constant', label: 'Constant', params: ['value'], description: 'Fixed value — no uncertainty' },
      ],
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list distributions');
  }
});

export default router;
