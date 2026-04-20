import type { Distribution } from './distributions.js';
import type { InputVariable } from './schema.js';

export interface DriverTweak {
  meanMultiplier: number;
  spreadMultiplier: number;
}

export const IDENTITY_TWEAK: DriverTweak = { meanMultiplier: 1, spreadMultiplier: 1 };

export function isIdentityTweak(t: DriverTweak | undefined): boolean {
  if (!t) return true;
  return Math.abs(t.meanMultiplier - 1) < 1e-9 && Math.abs(t.spreadMultiplier - 1) < 1e-9;
}

export function applyTweak(d: Distribution, t: DriverTweak): Distribution {
  const mm = t.meanMultiplier;
  const sm = Math.max(0, t.spreadMultiplier);
  switch (d.type) {
    case 'normal':
      return { type: 'normal', mean: d.mean * mm, stdDev: d.stdDev * sm };
    case 'log_normal':
      return { type: 'log_normal', mean: d.mean * mm, stdDev: d.stdDev * sm };
    case 'uniform': {
      const center = (d.min + d.max) / 2;
      const half = ((d.max - d.min) / 2) * sm;
      const newCenter = center * mm;
      return { type: 'uniform', min: newCenter - half, max: newCenter + half };
    }
    case 'triangular': {
      const newMode = d.mode * mm;
      return {
        type: 'triangular',
        min: newMode + (d.min - d.mode) * sm,
        mode: newMode,
        max: newMode + (d.max - d.mode) * sm,
      };
    }
    case 'beta': {
      const lo = d.min ?? 0;
      const hi = d.max ?? 1;
      const center = (lo + hi) / 2;
      const half = ((hi - lo) / 2) * sm;
      const newCenter = center * mm;
      return {
        type: 'beta',
        alpha: d.alpha,
        beta: d.beta,
        min: newCenter - half,
        max: newCenter + half,
      };
    }
    case 'poisson':
      return { type: 'poisson', lambda: Math.max(0, d.lambda * mm) };
    case 'constant':
      return { type: 'constant', value: d.value * mm };
    case 'custom':
      return { type: 'custom', values: d.values.map((v) => v * mm), weights: d.weights };
  }
}

export function tweakedInputs(
  inputs: InputVariable[],
  tweaks: Record<string, DriverTweak | undefined>,
): InputVariable[] {
  return inputs.map((inp) => {
    const t = tweaks[inp.id];
    if (isIdentityTweak(t)) return inp;
    return { ...inp, distribution: applyTweak(inp.distribution, t!) };
  });
}

export function tweakSummary(d: Distribution): { center: number; spread: number } {
  switch (d.type) {
    case 'normal':
    case 'log_normal':
      return { center: d.mean, spread: d.stdDev };
    case 'uniform':
      return { center: (d.min + d.max) / 2, spread: (d.max - d.min) / 2 };
    case 'triangular':
      return { center: d.mode, spread: Math.max(d.mode - d.min, d.max - d.mode) };
    case 'beta': {
      const lo = d.min ?? 0;
      const hi = d.max ?? 1;
      return { center: (lo + hi) / 2, spread: (hi - lo) / 2 };
    }
    case 'poisson':
      return { center: d.lambda, spread: Math.sqrt(d.lambda) };
    case 'constant':
      return { center: d.value, spread: 0 };
    case 'custom': {
      const mean = d.values.reduce((s, v) => s + v, 0) / Math.max(1, d.values.length);
      return { center: mean, spread: 0 };
    }
  }
}

export function distributionSupportsSpread(d: Distribution): boolean {
  return d.type !== 'constant' && d.type !== 'poisson' && d.type !== 'custom';
}
