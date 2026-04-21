export interface WaterfallInputs {
  totalEquity: number;
  gpContributionPct: number;
  preferredReturn: number;
  catchUpPct: number;
  promotePct: number;
  exitProceeds: number;
  holdMonths: number;
}

export interface TierResult {
  tier: string;
  description: string;
  gpAmount: number;
  lpAmount: number;
  total: number;
  gpPct: number;
  lpPct: number;
  cumGp: number;
  cumLp: number;
}

export interface WaterfallResult {
  gpEquity: number;
  lpEquity: number;
  gpTotal: number;
  lpTotal: number;
  gpEM: number;
  lpEM: number;
  gpIRR: number;
  lpIRR: number;
  tiers: TierResult[];
  prefReturnAmount: number;
  catchUpAmount: number;
  gpPromote: number;
  lpResidual: number;
}

export const DEFAULT_WATERFALL_INPUTS: WaterfallInputs = {
  totalEquity: 15_000_000,
  gpContributionPct: 10,
  preferredReturn: 8,
  catchUpPct: 50,
  promotePct: 20,
  exitProceeds: 28_500_000,
  holdMonths: 48,
};

export function calcWaterfall(inputs: WaterfallInputs): WaterfallResult {
  const gpEquity = inputs.totalEquity * (inputs.gpContributionPct / 100);
  const lpEquity = inputs.totalEquity - gpEquity;

  const prefReturnAmount =
    inputs.totalEquity * (inputs.preferredReturn / 100) * (inputs.holdMonths / 12);
  const returnOfCapital = inputs.totalEquity;
  const remainingAfterPref = Math.max(
    0,
    inputs.exitProceeds - returnOfCapital - prefReturnAmount,
  );

  const catchUpTarget =
    remainingAfterPref > 0
      ? (inputs.catchUpPct / 100) * (prefReturnAmount / (1 - inputs.catchUpPct / 100))
      : 0;
  const catchUpAmount = Math.min(catchUpTarget, remainingAfterPref);
  const afterCatchUp = remainingAfterPref - catchUpAmount;
  const gpPromote = afterCatchUp * (inputs.promotePct / 100);
  const lpResidual = afterCatchUp * (1 - inputs.promotePct / 100);

  const gpTotal = gpEquity + catchUpAmount + gpPromote;
  const lpTotal = lpEquity + prefReturnAmount + lpResidual;
  const gpEM = gpEquity > 0 ? gpTotal / gpEquity : 0;
  const lpEM = lpEquity > 0 ? lpTotal / lpEquity : 0;
  const totalMonths = inputs.holdMonths;
  const gpIRR = gpEquity > 0 ? (gpEM ** (12 / totalMonths) - 1) * 100 : 0;
  const lpIRR = lpEquity > 0 ? (lpEM ** (12 / totalMonths) - 1) * 100 : 0;

  let cumGp = 0;
  let cumLp = 0;

  const tiers: TierResult[] = [
    (() => {
      const gp = gpEquity;
      const lp = lpEquity;
      cumGp += gp;
      cumLp += lp;
      return {
        tier: 'Tier 1',
        description: 'Return of Capital',
        gpAmount: gp,
        lpAmount: lp,
        total: gp + lp,
        gpPct: (gp / (gp + lp)) * 100,
        lpPct: (lp / (gp + lp)) * 100,
        cumGp,
        cumLp,
      };
    })(),
    (() => {
      const gp = 0;
      const lp = prefReturnAmount;
      cumGp += gp;
      cumLp += lp;
      return {
        tier: 'Tier 2',
        description: `Preferred Return (${inputs.preferredReturn}% p.a.)`,
        gpAmount: gp,
        lpAmount: lp,
        total: gp + lp,
        gpPct: 0,
        lpPct: 100,
        cumGp,
        cumLp,
      };
    })(),
    (() => {
      const gp = catchUpAmount;
      const lp = 0;
      cumGp += gp;
      cumLp += lp;
      return {
        tier: 'Tier 3',
        description: `GP Catch-Up (${inputs.catchUpPct}%)`,
        gpAmount: gp,
        lpAmount: lp,
        total: gp + lp,
        gpPct: gp > 0 ? 100 : 0,
        lpPct: 0,
        cumGp,
        cumLp,
      };
    })(),
    (() => {
      const gp = gpPromote;
      const lp = lpResidual;
      cumGp += gp;
      cumLp += lp;
      return {
        tier: 'Tier 4',
        description: `Residual (GP ${inputs.promotePct}% promote)`,
        gpAmount: gp,
        lpAmount: lp,
        total: gp + lp,
        gpPct: gp + lp > 0 ? (gp / (gp + lp)) * 100 : 0,
        lpPct: gp + lp > 0 ? (lp / (gp + lp)) * 100 : 0,
        cumGp,
        cumLp,
      };
    })(),
  ];

  return {
    gpEquity,
    lpEquity,
    gpTotal,
    lpTotal,
    gpEM,
    lpEM,
    gpIRR,
    lpIRR,
    tiers,
    prefReturnAmount,
    catchUpAmount,
    gpPromote,
    lpResidual,
  };
}
