import type { ScenarioDefinition, ScenarioLibraryEntry } from "./schema.js";

export const VESSELS_VOYAGE_COST: ScenarioDefinition = {
  id: "vessels/voyage-cost",
  version: "1.0.0",
  title: "Voyage Cost Simulation",
  description: "Simulates total voyage cost including fuel, weather delays, port fees, and piracy risk premium.",
  domain: "vessels",
  tags: ["cost", "voyage", "risk"],
  inputs: [
    {
      id: "fuelPricePerTon",
      label: "Fuel Price ($/MT)",
      distribution: { type: "normal", mean: 620, stdDev: 80 },
      unit: "$/MT",
      format: "currency",
    },
    {
      id: "fuelConsumptionTons",
      label: "Fuel Consumption (MT/day)",
      distribution: { type: "triangular", min: 28, mode: 34, max: 42 },
      unit: "MT/day",
      format: "number",
    },
    {
      id: "voyageDays",
      label: "Voyage Duration (days)",
      distribution: { type: "normal", mean: 18, stdDev: 3 },
      unit: "days",
      format: "number",
    },
    {
      id: "portFees",
      label: "Port Fees ($000)",
      distribution: { type: "triangular", min: 40, mode: 65, max: 120 },
      unit: "$000",
      format: "currency",
    },
    {
      id: "weatherDelayDays",
      label: "Weather Delay (days)",
      distribution: { type: "poisson", lambda: 1.5 },
      unit: "days",
      format: "number",
    },
    {
      id: "piracyRiskPremiumPct",
      label: "Piracy Risk Premium (%)",
      distribution: { type: "beta", alpha: 2, beta: 10, min: 0, max: 0.08 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "cargoValue",
      label: "Cargo Value ($M)",
      distribution: { type: "log_normal", mean: 8, stdDev: 2 },
      unit: "$M",
      format: "currency",
    },
  ],
  calculate: (inputs) => {
    const totalDays = inputs["voyageDays"]! + inputs["weatherDelayDays"]!;
    const fuelCost = inputs["fuelPricePerTon"]! * inputs["fuelConsumptionTons"]! * totalDays;
    const portFees = inputs["portFees"]! * 1000;
    const piracyPremium = inputs["cargoValue"]! * 1_000_000 * inputs["piracyRiskPremiumPct"]!;
    const totalCost = fuelCost + portFees + piracyPremium;
    const costPerDay = totalCost / totalDays;
    return {
      totalVoyageCost: totalCost / 1000,
      fuelCostShare: fuelCost / totalCost,
      costPerDay: costPerDay / 1000,
      totalDays,
      effectiveFuelCost: fuelCost / 1000,
    };
  },
  outputs: [
    { id: "totalVoyageCost", label: "Total Voyage Cost ($000)", format: "currency", higherIsBetter: false },
    { id: "fuelCostShare", label: "Fuel Cost Share", format: "percentage", higherIsBetter: false },
    { id: "costPerDay", label: "Cost per Day ($000)", format: "currency", higherIsBetter: false },
    { id: "totalDays", label: "Total Transit Days", format: "number", higherIsBetter: false },
  ],
};

export const TERRA_PROPERTY_RETURNS: ScenarioDefinition = {
  id: "terra/property-investment-returns",
  version: "1.0.0",
  title: "Property Investment Return Model",
  description: "Simulates IRR and equity multiple for a real estate investment over a 5-year hold period.",
  domain: "terra",
  tags: ["real-estate", "irr", "returns"],
  inputs: [
    {
      id: "purchasePrice",
      label: "Purchase Price ($M)",
      distribution: { type: "constant", value: 10 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "initialCapRate",
      label: "Initial Cap Rate (%)",
      distribution: { type: "normal", mean: 0.055, stdDev: 0.008 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "rentGrowthRate",
      label: "Annual Rent Growth (%)",
      distribution: { type: "normal", mean: 0.03, stdDev: 0.015 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "vacancyRate",
      label: "Vacancy Rate (%)",
      distribution: { type: "beta", alpha: 3, beta: 20, min: 0.02, max: 0.25 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "exitCapRate",
      label: "Exit Cap Rate (%)",
      distribution: { type: "normal", mean: 0.06, stdDev: 0.01 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "interestRate",
      label: "Loan Interest Rate (%)",
      distribution: { type: "normal", mean: 0.065, stdDev: 0.01 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "ltv",
      label: "Loan-to-Value (%)",
      distribution: { type: "uniform", min: 0.55, max: 0.75 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "opexGrowth",
      label: "Operating Expense Growth (%)",
      distribution: { type: "triangular", min: 0.01, mode: 0.025, max: 0.05 },
      unit: "%",
      format: "percentage",
    },
  ],
  calculate: (inputs) => {
    const price = inputs["purchasePrice"]! * 1_000_000;
    const noi0 = price * inputs["initialCapRate"]!;
    const equity = price * (1 - inputs["ltv"]!);
    const debt = price * inputs["ltv"]!;
    const annualDebtService = debt * inputs["interestRate"]!;
    const holdYears = 5;

    let cumulativeCashFlow = -equity;
    let noi = noi0;
    let opex = noi0 * 0.35;

    const cashFlows: number[] = [-equity];

    for (let y = 1; y <= holdYears; y++) {
      noi *= (1 + inputs["rentGrowthRate"]!);
      opex *= (1 + inputs["opexGrowth"]!);
      const effectiveNoi = noi * (1 - inputs["vacancyRate"]!);
      const cfBeforeDebt = effectiveNoi - opex;
      const cfAfterDebt = cfBeforeDebt - annualDebtService;
      cashFlows.push(cfAfterDebt);
    }

    const exitNoi = noi * (1 - inputs["vacancyRate"]!);
    const exitValue = exitNoi / inputs["exitCapRate"]!;
    const exitProceeds = exitValue - debt;
    cashFlows[holdYears] = (cashFlows[holdYears] ?? 0) + exitProceeds;

    const irr = computeIRR(cashFlows);
    const equityMultiple = cashFlows.reduce((s, cf) => s + cf, 0) / equity + 1;
    const totalReturn = (exitValue - price) / price;

    return {
      irr: irr * 100,
      equityMultiple,
      exitValue: exitValue / 1_000_000,
      totalReturn: totalReturn * 100,
      noiYear5: (noi * (1 - inputs["vacancyRate"]!)) / 1_000_000,
    };
  },
  outputs: [
    { id: "irr", label: "IRR (%)", format: "percentage", higherIsBetter: true, thresholds: { excellent: 20, good: 12, poor: 6 } },
    { id: "equityMultiple", label: "Equity Multiple (x)", format: "number", higherIsBetter: true },
    { id: "exitValue", label: "Exit Value ($M)", format: "currency", higherIsBetter: true },
    { id: "totalReturn", label: "Total Return (%)", format: "percentage", higherIsBetter: true },
  ],
};

export const SZL_FUND_EXIT: ScenarioDefinition = {
  id: "szl/fund-exit-modeling",
  version: "1.0.0",
  title: "Fund Exit Modeling",
  description: "Models fund exit returns across portfolio companies with market condition uncertainty.",
  domain: "szl",
  tags: ["fund", "exit", "returns", "moic"],
  inputs: [
    {
      id: "holdingPeriodYears",
      label: "Holding Period (years)",
      distribution: { type: "triangular", min: 3, mode: 5, max: 8 },
      unit: "years",
      format: "years",
    },
    {
      id: "revenueGrowthCagr",
      label: "Revenue CAGR (%)",
      distribution: { type: "normal", mean: 0.25, stdDev: 0.12 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "exitRevenueMultiple",
      label: "Exit Revenue Multiple (x)",
      distribution: { type: "log_normal", mean: 5, stdDev: 2 },
      unit: "x",
      format: "number",
    },
    {
      id: "entryRevenueMultiple",
      label: "Entry Revenue Multiple (x)",
      distribution: { type: "constant", value: 4 },
      unit: "x",
      format: "number",
    },
    {
      id: "baseRevenueMillion",
      label: "Entry Revenue ($M)",
      distribution: { type: "constant", value: 20 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "marketExpansionFactor",
      label: "Market Expansion Factor",
      distribution: { type: "triangular", min: 0.7, mode: 1.0, max: 1.5 },
      unit: "x",
      format: "number",
    },
    {
      id: "dilutionPct",
      label: "Dilution (%)",
      distribution: { type: "beta", alpha: 3, beta: 12, min: 0.05, max: 0.35 },
      unit: "%",
      format: "percentage",
    },
  ],
  calculate: (inputs) => {
    const entryValuation = inputs["baseRevenueMillion"]! * inputs["entryRevenueMultiple"]!;
    const exitRevenue = inputs["baseRevenueMillion"]! * Math.pow(1 + inputs["revenueGrowthCagr"]!, inputs["holdingPeriodYears"]!);
    const exitValuation = exitRevenue * inputs["exitRevenueMultiple"]! * inputs["marketExpansionFactor"]!;
    const ownership = 1 - inputs["dilutionPct"]!;
    const proceeds = exitValuation * ownership;
    const moic = proceeds / entryValuation;
    const irr = Math.pow(moic, 1 / inputs["holdingPeriodYears"]!) - 1;

    return {
      moic,
      irr: irr * 100,
      exitValuation,
      proceeds,
      revenueAtExit: exitRevenue,
    };
  },
  outputs: [
    { id: "moic", label: "MOIC (x)", format: "number", higherIsBetter: true, thresholds: { excellent: 4, good: 2.5, poor: 1.5 } },
    { id: "irr", label: "IRR (%)", format: "percentage", higherIsBetter: true, thresholds: { excellent: 30, good: 20, poor: 10 } },
    { id: "exitValuation", label: "Exit Valuation ($M)", format: "currency", higherIsBetter: true },
    { id: "proceeds", label: "Proceeds ($M)", format: "currency", higherIsBetter: true },
  ],
};

export const PRISM_LITIGATION_OUTCOME: ScenarioDefinition = {
  id: "prism/litigation-outcome",
  version: "1.0.0",
  title: "Litigation Outcome Prediction",
  description: "Predicts verdict ranges, settlement probability, and total legal cost for active matters.",
  domain: "prism",
  tags: ["litigation", "settlement", "damages"],
  inputs: [
    {
      id: "claimedDamages",
      label: "Claimed Damages ($M)",
      distribution: { type: "log_normal", mean: 5, stdDev: 3 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "liabilityProbability",
      label: "Liability Probability (%)",
      distribution: { type: "beta", alpha: 4, beta: 6, min: 0, max: 1 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "damageFactor",
      label: "Damage Reduction Factor",
      distribution: { type: "beta", alpha: 5, beta: 3, min: 0.2, max: 1.0 },
      unit: "x",
      format: "number",
    },
    {
      id: "settlementDiscount",
      label: "Settlement Discount (%)",
      distribution: { type: "beta", alpha: 5, beta: 5, min: 0.2, max: 0.7 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "legalFeesMillion",
      label: "Legal Fees ($M)",
      distribution: { type: "triangular", min: 0.3, mode: 0.8, max: 2.5 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "trialProbability",
      label: "Probability Goes to Trial (%)",
      distribution: { type: "beta", alpha: 2, beta: 8, min: 0, max: 1 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "reputationMultiplier",
      label: "Reputational Cost Multiplier",
      distribution: { type: "triangular", min: 1.0, mode: 1.3, max: 2.5 },
      unit: "x",
      format: "number",
    },
  ],
  calculate: (inputs) => {
    const goesToTrial = Math.random() < inputs["trialProbability"]!;
    const isLiable = Math.random() < inputs["liabilityProbability"]!;

    let directCost: number;
    if (goesToTrial) {
      directCost = isLiable
        ? inputs["claimedDamages"]! * inputs["damageFactor"]!
        : 0;
    } else {
      directCost = inputs["claimedDamages"]! * inputs["settlementDiscount"]!;
    }

    const legalFees = inputs["legalFeesMillion"]!;
    const totalCost = (directCost + legalFees) * inputs["reputationMultiplier"]!;
    const settlementProbability = 1 - inputs["trialProbability"]!;

    return {
      totalExposure: totalCost,
      directCost,
      legalFees,
      settlementProbability: settlementProbability * 100,
      expectedLoss: inputs["liabilityProbability"]! * directCost + legalFees,
    };
  },
  outputs: [
    { id: "totalExposure", label: "Total Exposure ($M)", format: "currency", higherIsBetter: false },
    { id: "directCost", label: "Direct Verdict/Settlement ($M)", format: "currency", higherIsBetter: false },
    { id: "expectedLoss", label: "Expected Loss ($M)", format: "currency", higherIsBetter: false },
    { id: "settlementProbability", label: "Settlement Probability (%)", format: "percentage" },
  ],
};

export const AEGIS_CYBER_RISK: ScenarioDefinition = {
  id: "aegis/cyber-risk-quantification",
  version: "1.0.0",
  title: "Cyber Risk Quantification",
  description: "Quantifies annual expected loss from cyber incidents including breach probability, impact, and recovery.",
  domain: "aegis",
  tags: ["cyber", "breach", "risk", "ALE"],
  inputs: [
    {
      id: "annualBreachProbability",
      label: "Annual Breach Probability (%)",
      distribution: { type: "beta", alpha: 2, beta: 18, min: 0, max: 0.5 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "recordsAtRisk",
      label: "Records at Risk (000s)",
      distribution: { type: "log_normal", mean: 500, stdDev: 300 },
      unit: "k records",
      format: "number",
    },
    {
      id: "costPerRecord",
      label: "Cost per Compromised Record ($)",
      distribution: { type: "triangular", min: 150, mode: 220, max: 400 },
      unit: "$",
      format: "currency",
    },
    {
      id: "businessInterruptionDays",
      label: "Business Interruption (days)",
      distribution: { type: "triangular", min: 3, mode: 12, max: 45 },
      unit: "days",
      format: "number",
    },
    {
      id: "dailyRevenueMillion",
      label: "Daily Revenue ($M)",
      distribution: { type: "constant", value: 2.5 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "ransomDemandMillion",
      label: "Ransom Demand ($M)",
      distribution: { type: "log_normal", mean: 3, stdDev: 2 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "payRansomProbability",
      label: "Probability of Paying Ransom (%)",
      distribution: { type: "beta", alpha: 3, beta: 7, min: 0, max: 1 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "cyberInsuranceCoverage",
      label: "Cyber Insurance Coverage ($M)",
      distribution: { type: "constant", value: 10 },
      unit: "$M",
      format: "currency",
    },
  ],
  calculate: (inputs) => {
    const dataBreachCost = inputs["recordsAtRisk"]! * 1000 * inputs["costPerRecord"]! / 1_000_000;
    const biLoss = inputs["businessInterruptionDays"]! * inputs["dailyRevenueMillion"]!;
    const ransomCost = inputs["payRansomProbability"]! * inputs["ransomDemandMillion"]!;
    const totalGrossLoss = dataBreachCost + biLoss + ransomCost;
    const insuranceOffset = Math.min(inputs["cyberInsuranceCoverage"]!, totalGrossLoss * 0.8);
    const netLoss = Math.max(0, totalGrossLoss - insuranceOffset);
    const annualExpectedLoss = inputs["annualBreachProbability"]! * totalGrossLoss;

    return {
      annualExpectedLoss,
      grossLossIfBreached: totalGrossLoss,
      netLossIfBreached: netLoss,
      dataBreachCost,
      businessInterruptionLoss: biLoss,
    };
  },
  outputs: [
    { id: "annualExpectedLoss", label: "Annual Expected Loss ($M)", format: "currency", higherIsBetter: false },
    { id: "grossLossIfBreached", label: "Gross Loss if Breached ($M)", format: "currency", higherIsBetter: false },
    { id: "netLossIfBreached", label: "Net Loss After Insurance ($M)", format: "currency", higherIsBetter: false },
    { id: "dataBreachCost", label: "Data Breach Cost ($M)", format: "currency", higherIsBetter: false },
  ],
};

export const NEXUS_GEOPOLITICAL_CASCADE: ScenarioDefinition = {
  id: "nexus/geopolitical-cascade",
  version: "1.0.0",
  title: "Geopolitical Cascade Modeling",
  description: "Models cascading economic and operational impact of geopolitical events on portfolio operations.",
  domain: "nexus",
  tags: ["geopolitics", "cascade", "risk"],
  inputs: [
    {
      id: "eventProbability",
      label: "Triggering Event Probability (%)",
      distribution: { type: "beta", alpha: 2, beta: 15, min: 0, max: 0.4 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "initialImpactMagnitude",
      label: "Initial Impact Magnitude (0-1)",
      distribution: { type: "triangular", min: 0.1, mode: 0.35, max: 0.9 },
      unit: "",
      format: "number",
    },
    {
      id: "cascadeFactor",
      label: "Cascade Amplification Factor",
      distribution: { type: "log_normal", mean: 1.8, stdDev: 0.6 },
      unit: "x",
      format: "number",
    },
    {
      id: "recoveryTimeMonths",
      label: "Recovery Time (months)",
      distribution: { type: "triangular", min: 3, mode: 12, max: 48 },
      unit: "months",
      format: "number",
    },
    {
      id: "exposedRevenueMillions",
      label: "Exposed Revenue ($M)",
      distribution: { type: "constant", value: 50 },
      unit: "$M",
      format: "currency",
    },
    {
      id: "hedgeEffectiveness",
      label: "Hedge Effectiveness (%)",
      distribution: { type: "beta", alpha: 4, beta: 4, min: 0, max: 0.8 },
      unit: "%",
      format: "percentage",
    },
  ],
  calculate: (inputs) => {
    const occurs = Math.random() < inputs["eventProbability"]!;
    const rawImpact = occurs
      ? inputs["initialImpactMagnitude"]! * inputs["cascadeFactor"]!
      : 0;
    const hedgedImpact = rawImpact * (1 - inputs["hedgeEffectiveness"]!);
    const revenueAtRisk = inputs["exposedRevenueMillions"]! * Math.min(hedgedImpact, 1);
    const recoveryMonths = occurs ? inputs["recoveryTimeMonths"]! : 0;

    return {
      revenueAtRisk,
      impactMagnitude: hedgedImpact,
      recoveryMonths,
      eventOccurrence: occurs ? 1 : 0,
      annualExpectedImpact: inputs["eventProbability"]! * revenueAtRisk,
    };
  },
  outputs: [
    { id: "revenueAtRisk", label: "Revenue at Risk ($M)", format: "currency", higherIsBetter: false },
    { id: "impactMagnitude", label: "Impact Magnitude (0-1)", format: "number", higherIsBetter: false },
    { id: "annualExpectedImpact", label: "Annual Expected Impact ($M)", format: "currency", higherIsBetter: false },
    { id: "recoveryMonths", label: "Recovery Time (months)", format: "number", higherIsBetter: false },
  ],
};

export const LYTE_CAPACITY_PLANNING: ScenarioDefinition = {
  id: "lyte/capacity-planning",
  version: "1.0.0",
  title: "Capacity Planning Simulation",
  description: "Models infrastructure capacity requirements given demand growth, failure rates, and scaling triggers.",
  domain: "lyte",
  tags: ["capacity", "infrastructure", "scaling"],
  inputs: [
    {
      id: "currentLoad",
      label: "Current Load (%)",
      distribution: { type: "normal", mean: 0.62, stdDev: 0.08 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "demandGrowthCagr",
      label: "Demand Growth CAGR (%)",
      distribution: { type: "normal", mean: 0.35, stdDev: 0.15 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "failureRatePerYear",
      label: "Component Failure Rate (per year)",
      distribution: { type: "poisson", lambda: 2.5 },
      unit: "events/yr",
      format: "number",
    },
    {
      id: "scalingTriggerPct",
      label: "Scaling Trigger Threshold (%)",
      distribution: { type: "constant", value: 0.75 },
      unit: "%",
      format: "percentage",
    },
    {
      id: "provisioningLeadTimeWeeks",
      label: "Provisioning Lead Time (weeks)",
      distribution: { type: "triangular", min: 2, mode: 4, max: 12 },
      unit: "weeks",
      format: "number",
    },
    {
      id: "costPerUnitThousands",
      label: "Cost per Capacity Unit ($000)",
      distribution: { type: "normal", mean: 45, stdDev: 8 },
      unit: "$000",
      format: "currency",
    },
    {
      id: "downtimeCostPerHour",
      label: "Downtime Cost ($/hour)",
      distribution: { type: "log_normal", mean: 12000, stdDev: 5000 },
      unit: "$/hr",
      format: "currency",
    },
  ],
  calculate: (inputs) => {
    const planningHorizonYears = 3;
    const peakLoad = inputs["currentLoad"]! * Math.pow(1 + inputs["demandGrowthCagr"]!, planningHorizonYears);
    const capacityGap = Math.max(0, peakLoad - inputs["scalingTriggerPct"]!);
    const unitsRequired = Math.ceil(capacityGap / 0.1);
    const capacityCost = unitsRequired * inputs["costPerUnitThousands"]! * 1000;
    const expectedDowntimeHours = inputs["failureRatePerYear"]! * planningHorizonYears * (inputs["provisioningLeadTimeWeeks"]! / 52) * 24;
    const downtimeCost = expectedDowntimeHours * inputs["downtimeCostPerHour"]!;
    const totalTco = capacityCost + downtimeCost;

    return {
      peakLoadPct: peakLoad * 100,
      unitsRequired,
      capacityCostThousands: capacityCost / 1000,
      downtimeCostThousands: downtimeCost / 1000,
      totalTcoThousands: totalTco / 1000,
      expectedDowntimeHours,
    };
  },
  outputs: [
    { id: "peakLoadPct", label: "Peak Load at Year 3 (%)", format: "percentage", higherIsBetter: false },
    { id: "unitsRequired", label: "Capacity Units Required", format: "number", higherIsBetter: false },
    { id: "totalTcoThousands", label: "3-Year TCO ($000)", format: "currency", higherIsBetter: false },
    { id: "expectedDowntimeHours", label: "Expected Downtime (hours)", format: "number", higherIsBetter: false },
  ],
};

function computeIRR(cashFlows: number[], guess = 0.1): number {
  let rate = guess;
  for (let i = 0; i < 1000; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t]! / Math.pow(1 + rate, t);
      dnpv -= t * cashFlows[t]! / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(npv) < 1e-6) return rate;
    if (dnpv === 0) break;
    rate -= npv / dnpv;
    if (rate < -0.999) rate = -0.999;
    if (rate > 10) rate = 10;
  }
  return rate;
}

export const DOMAIN_SCENARIO_LIBRARY: Record<string, ScenarioDefinition> = {
  [VESSELS_VOYAGE_COST.id]: VESSELS_VOYAGE_COST,
  [TERRA_PROPERTY_RETURNS.id]: TERRA_PROPERTY_RETURNS,
  [SZL_FUND_EXIT.id]: SZL_FUND_EXIT,
  [PRISM_LITIGATION_OUTCOME.id]: PRISM_LITIGATION_OUTCOME,
  [AEGIS_CYBER_RISK.id]: AEGIS_CYBER_RISK,
  [NEXUS_GEOPOLITICAL_CASCADE.id]: NEXUS_GEOPOLITICAL_CASCADE,
  [LYTE_CAPACITY_PLANNING.id]: LYTE_CAPACITY_PLANNING,
};

export const SCENARIO_VARIANTS: Record<string, Array<{ id: string; label: string; description: string; overrides: Record<string, unknown> }>> = {
  [TERRA_PROPERTY_RETURNS.id]: [
    { id: "base", label: "Base Case", description: "Expected market conditions", overrides: {} },
    {
      id: "bull",
      label: "Bull Case",
      description: "Favorable rent growth and compressed exit cap",
      overrides: {
        rentGrowthRate: { distribution: { type: "normal", mean: 0.05, stdDev: 0.01 } },
        exitCapRate: { distribution: { type: "normal", mean: 0.05, stdDev: 0.005 } },
      },
    },
    {
      id: "bear",
      label: "Bear Case",
      description: "Elevated vacancy and expanded exit cap",
      overrides: {
        vacancyRate: { distribution: { type: "beta", alpha: 4, beta: 10, min: 0.1, max: 0.4 } },
        exitCapRate: { distribution: { type: "normal", mean: 0.075, stdDev: 0.01 } },
      },
    },
    {
      id: "black_swan",
      label: "Black Swan",
      description: "Market collapse with severe vacancy and rate spike",
      overrides: {
        vacancyRate: { distribution: { type: "beta", alpha: 4, beta: 4, min: 0.25, max: 0.6 } },
        exitCapRate: { distribution: { type: "normal", mean: 0.09, stdDev: 0.015 } },
        rentGrowthRate: { distribution: { type: "normal", mean: -0.02, stdDev: 0.02 } },
      },
    },
  ],
  [SZL_FUND_EXIT.id]: [
    { id: "base", label: "Base Case", description: "Expected fund performance", overrides: {} },
    {
      id: "bull",
      label: "Bull Case",
      description: "High growth with premium exit multiple",
      overrides: {
        revenueGrowthCagr: { distribution: { type: "normal", mean: 0.40, stdDev: 0.08 } },
        exitRevenueMultiple: { distribution: { type: "log_normal", mean: 8, stdDev: 2 } },
      },
    },
    {
      id: "bear",
      label: "Bear Case",
      description: "Below-target growth with compressed multiples",
      overrides: {
        revenueGrowthCagr: { distribution: { type: "normal", mean: 0.12, stdDev: 0.08 } },
        exitRevenueMultiple: { distribution: { type: "log_normal", mean: 3, stdDev: 1 } },
      },
    },
  ],
};
