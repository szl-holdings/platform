/**
 * Gauss-Forecast — predicts whether the next loop iteration will close,
 * using least-squares on the residual history of prior iterations.
 *
 * Theory: if a sequence of canonical-hash distances h_0, h_1, ..., h_n
 * follows an approximately linear trend (in log-residual space), we can
 * project to h_{n+1}. If the projection exceeds tolerance, the loop is
 * diverging and we save the cost of the next iteration.
 *
 * Cites Gauss, Theoria combinationis observationum erroribus minimis
 * obnoxiae (1823).
 */

export interface ForecastResult {
  predictedResidual: number;
  tolerance: number;
  diverging: boolean;
  slope: number;
  intercept: number;
  rSquared: number;
}

/**
 * Linear least-squares on (i, log(history[i])).
 * Returns slope/intercept and the projected next value exp(slope·(n) + intercept).
 *
 * tolerance defaults to 1.0 (residual ≥ 1 = divergent).
 */
export function gaussForecast(
  history: ReadonlyArray<number>,
  tolerance = 1.0,
): ForecastResult {
  const n = history.length;
  if (n < 2) {
    return {
      predictedResidual: history[0] ?? 0,
      tolerance,
      diverging: false,
      slope: 0,
      intercept: 0,
      rSquared: 0,
    };
  }
  // Filter out zeros (log undefined) and replace with epsilon
  const eps = 1e-12;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = Math.max(history[i], eps);
    xs.push(i);
    ys.push(Math.log(v));
  }
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  // R²
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = slope * xs[i] + intercept;
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  const predictedResidual = Math.exp(slope * n + intercept);
  return {
    predictedResidual,
    tolerance,
    diverging: predictedResidual > tolerance,
    slope,
    intercept,
    rSquared,
  };
}
