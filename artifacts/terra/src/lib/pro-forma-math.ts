export interface ProFormaInputs {
  projectName: string;
  propertyType: string;
  totalUnits: number;
  avgUnitSF: number;
  landCost: number;
  hardCostPerSF: number;
  softCostPct: number;
  contingencyPct: number;
  financingRate: number;
  loanToCost: number;
  constructionMonths: number;
  absorptionMonths: number;
  stabilizedOccupancy: number;
  marketRentPerSF: number;
  opexPerSF: number;
  exitCapRate: number;
  equityMultipleTarget: number;
}

export const DEFAULT_INPUTS: ProFormaInputs = {
  projectName: 'The Arbor — Mixed-Use Tower',
  propertyType: 'Mixed-Use',
  totalUnits: 120,
  avgUnitSF: 950,
  landCost: 8_500_000,
  hardCostPerSF: 285,
  softCostPct: 18,
  contingencyPct: 8,
  financingRate: 7.25,
  loanToCost: 65,
  constructionMonths: 24,
  absorptionMonths: 12,
  stabilizedOccupancy: 94,
  marketRentPerSF: 3.4,
  opexPerSF: 1.05,
  exitCapRate: 5.25,
  equityMultipleTarget: 1.85,
};

export const BEAR_INPUTS: ProFormaInputs = {
  ...DEFAULT_INPUTS,
  projectName: 'The Arbor — Bear Case',
  hardCostPerSF: 310,
  financingRate: 8.0,
  marketRentPerSF: 3.1,
  exitCapRate: 5.75,
  stabilizedOccupancy: 90,
};

export const BULL_INPUTS: ProFormaInputs = {
  ...DEFAULT_INPUTS,
  projectName: 'The Arbor — Bull Case',
  hardCostPerSF: 265,
  financingRate: 6.75,
  marketRentPerSF: 3.65,
  exitCapRate: 4.75,
  stabilizedOccupancy: 96,
};

export interface ProFormaResult {
  totalSF: number;
  hardCosts: number;
  softCosts: number;
  contingency: number;
  totalDevelopmentCost: number;
  totalDebt: number;
  totalEquity: number;
  constructionInterest: number;
  totalProjectCost: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  opex: number;
  noi: number;
  stabilizedValue: number;
  developerProfit: number;
  profitOnCost: number;
  yieldOnCost: number;
  spreadToCapRate: number;
  equityMultiple: number;
  irr: number;
  costPerUnit: number;
  valuePerUnit: number;
  schedule: { phase: string; cost: number; cumulative: number }[];
  sensRows: { capRate: number; value: number; profit: number; em: number }[];
}

export function calcProForma(inputs: ProFormaInputs): ProFormaResult {
  const totalSF = inputs.totalUnits * inputs.avgUnitSF;
  const hardCosts = totalSF * inputs.hardCostPerSF;
  const softCosts = hardCosts * (inputs.softCostPct / 100);
  const contingency = (hardCosts + softCosts) * (inputs.contingencyPct / 100);
  const totalDevelopmentCost = inputs.landCost + hardCosts + softCosts + contingency;
  const totalDebt = totalDevelopmentCost * (inputs.loanToCost / 100);
  const totalEquity = totalDevelopmentCost - totalDebt;
  const constructionInterest =
    totalDebt * (inputs.financingRate / 100) * (inputs.constructionMonths / 12) * 0.6;
  const totalProjectCost = totalDevelopmentCost + constructionInterest;

  const grossPotentialRent = inputs.totalUnits * (inputs.avgUnitSF * inputs.marketRentPerSF) * 12;
  const effectiveGrossIncome = grossPotentialRent * (inputs.stabilizedOccupancy / 100);
  const opex = totalSF * inputs.opexPerSF * 12;
  const noi = effectiveGrossIncome - opex;
  const stabilizedValue = noi / (inputs.exitCapRate / 100);
  const developerProfit = stabilizedValue - totalProjectCost;
  const profitOnCost = (developerProfit / totalProjectCost) * 100;
  const yieldOnCost = (noi / totalProjectCost) * 100;
  const spreadToCapRate = yieldOnCost - inputs.exitCapRate;

  const equityProceeds = stabilizedValue - totalDebt;
  const equityMultiple = equityProceeds / totalEquity;
  const projectMonths = inputs.constructionMonths + inputs.absorptionMonths;
  const irr = (Math.max(equityMultiple, 0.001) ** (12 / projectMonths) - 1) * 100;

  const costPerUnit = totalProjectCost / inputs.totalUnits;
  const valuePerUnit = stabilizedValue / inputs.totalUnits;

  const schedule: { phase: string; cost: number; cumulative: number }[] = [];
  let cum = 0;
  const phases = [
    { phase: 'Land', cost: inputs.landCost },
    { phase: 'Hard Costs', cost: hardCosts },
    { phase: 'Soft Costs', cost: softCosts },
    { phase: 'Contingency', cost: contingency },
    { phase: 'Const. Interest', cost: constructionInterest },
  ];
  phases.forEach((p) => {
    cum += p.cost;
    schedule.push({ ...p, cumulative: cum });
  });

  const sensRows: { capRate: number; value: number; profit: number; em: number }[] = [];
  for (let cr = inputs.exitCapRate - 1; cr <= inputs.exitCapRate + 1; cr += 0.25) {
    const v = noi / (cr / 100);
    const pr = v - totalProjectCost;
    const eq = (v - totalDebt) / totalEquity;
    sensRows.push({ capRate: cr, value: v, profit: pr, em: eq });
  }

  return {
    totalSF,
    hardCosts,
    softCosts,
    contingency,
    totalDevelopmentCost,
    totalDebt,
    totalEquity,
    constructionInterest,
    totalProjectCost,
    grossPotentialRent,
    effectiveGrossIncome,
    opex,
    noi,
    stabilizedValue,
    developerProfit,
    profitOnCost,
    yieldOnCost,
    spreadToCapRate,
    equityMultiple,
    irr,
    costPerUnit,
    valuePerUnit,
    schedule,
    sensRows,
  };
}
