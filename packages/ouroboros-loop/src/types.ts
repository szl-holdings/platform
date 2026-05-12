export type Verdict =
  | "ACCEPTED"
  | "REFUSED_LAMBDA_GATE"
  | "REFUSED_DUAL_WITNESS_DIVERGE"
  | "REFUSED_FLUXIONS_BARE_CLAIM"
  | "REFUSED_BEKENSTEIN_OVERFLOW"
  | "REFUSED_FORECAST_DIVERGENT"
  | "REFUSED_WITNESS_DIVERSITY"
  | "MAX_ITER_NO_FIXED_POINT";

export interface OuroborosInput<T> {
  payload: T;
  /** Canonical hash of state for fixed-point detection. */
  canonical: (x: T) => string;
  /** Transform applied each iteration: T → T. */
  transform: (x: T) => T;
  mechanisms?: {
    lambdaGate?: (x: T) => boolean;
    dualWitness?: (x: T) => { match: boolean };
    fluxionsReceipt?: (x: T) => boolean;
    bekensteinCheck?: (x: T) => boolean;
    /** Gauss-forecast: returns predicted residual norm of next iter; if it
     *  exceeds tolerance the loop short-circuits with REFUSED_FORECAST_DIVERGENT. */
    forecast?: (history: number[]) => { predictedResidual: number; tolerance: number };
    /** Gauss witness-diversity gate (class-number axis). Returns the
     *  computed K_axis ∈ [0,1] and a minimum threshold. Short-circuits
     *  with REFUSED_WITNESS_DIVERSITY when K_axis < threshold. Runs
     *  AFTER Λ-gate and fluxionsReceipt, BEFORE the iteration loop. */
    witnessDiversity?: (x: T) => { axis: number; threshold: number; discriminant?: number; classNumber?: number };
  };
  maxIter?: number;
}

export interface OuroborosReceipt<T> {
  verdict: Verdict;
  iterations: number;
  fixedPoint: boolean;
  finalHash: string;
  finalValue: T | null;
  trace: ReadonlyArray<{ readonly iter: number; readonly hash: string }>;
  refusalReason: string | null;
  receiptDigest: string;
  forecast?: { predictedResidual: number; tolerance: number; admitted: boolean };
  witnessDiversity?: { axis: number; threshold: number; admitted: boolean; discriminant?: number; classNumber?: number };
}
