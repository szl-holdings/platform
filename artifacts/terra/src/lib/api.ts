import { apiFetch, graphqlRequest } from "@szl-holdings/shared-ui";

export async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  return graphqlRequest<T>(query, variables);
}

export interface GqlTerraActionItem {
  id: string;
  externalId: string | null;
  propertyId: string;
  issue: string;
  severity: string;
  ownerName: string;
  ownerRole: string;
  dueDate: string | null;
  status: string;
  recommendedAction: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TerraLease {
  id: string;
  documentName: string;
  tenant: string;
  premises: string;
  propertyAddress: string;
  leaseType: string;
  commencementDate: string;
  expirationDate: string;
  baseRent: number;
  rentPerSqft: number;
  sqft: number;
  escalations: string;
  options: string[];
  cam: number;
  tiAllowance: number;
  securityDeposit: number;
  terminationOption: string;
  exclusiveUse: string;
  coTenancy: string;
  extractedAt: string;
  confidence: number;
  flags: { field: string; issue: string; severity: string }[];
  isDemo: boolean;
}

export interface TerraProFormaProject {
  id: string;
  projectName: string;
  propertyType: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown> | null;
  updatedAt: string;
  isDemo: boolean;
}

export interface TerraExchange {
  id: string;
  relinquishedProperty: string;
  relinquishedAddress: string;
  saleDate: string;
  salePrice: number;
  adjustedBasis: number;
  deferredGain: number;
  qi: string;
  qiContact: string;
  status: "identification" | "exchange" | "completed" | "failed";
  identificationDeadline: string;
  exchangeDeadline: string;
  identifiedProperties: Array<Record<string, unknown>>;
  complianceItems: Array<Record<string, unknown>>;
  taxSavings: number;
  isDemo: boolean;
}

export interface TerraTaxAppeal {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  sqft: number;
  assessedValue: number;
  avmValue: number;
  taxRate: number;
  overAssessedPct: number;
  annualTax: number;
  potentialSavings: number;
  appealDeadline: string;
  appealStatus: "eligible" | "filed" | "hearing" | "won" | "lost" | "not-eligible";
  juris: string;
  comparables: Array<Record<string, unknown>>;
  appealStrength: "strong" | "moderate" | "weak";
  notes: string;
  isDemo: boolean;
}

export interface TerraWaterfallStructure {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown> | null;
  updatedAt: string;
  isDemo: boolean;
}

export interface TerraConstructionProject {
  id: string;
  name: string;
  address: string;
  type: string;
  totalBudget: number;
  totalSpent: number;
  overallPct: number;
  startDate: string;
  projectedCompletion: string;
  revisedCompletion?: string;
  status: "on-track" | "behind" | "at-risk" | "complete";
  gc: string;
  architect: string;
  milestones: Array<Record<string, unknown>>;
  budgetLines: Array<Record<string, unknown>>;
  photos: Array<Record<string, unknown>>;
  isDemo: boolean;
}

export interface TerraTenantApplication {
  id: string;
  name: string;
  type: "individual" | "entity";
  targetUnit: string;
  proposedRent: number;
  leaseTermMonths: number;
  submittedDate: string;
  status: "pending" | "approved" | "conditional" | "declined";
  overallScore: number;
  recommendation: "approve" | "conditional" | "decline";
  creditScore: number;
  annualIncome: number;
  incomeVerified: boolean;
  rentToIncomeRatio: number;
  priorEvictions: number;
  backgroundClear: boolean;
  screeningData: Record<string, unknown>;
  flags: Array<Record<string, unknown>>;
  notes: string;
  isDemo: boolean;
}

export interface ClimateHazard {
  type: string;
  current: string;
  projected2030: string;
  projected2050: string;
  trend: string;
  detail: string;
}

export interface ClimateRiskData {
  propertyId: string;
  overallRiskScore: number;
  overallGrade: string;
  annualInsurance: number;
  insuranceAdjustment: number;
  valuationHaircut: number;
  adaptationCost: number;
  thirtyYearExpectedLoss: number;
  regulatoryFlags: string[];
  hazards: ClimateHazard[];
  dataSource: string;
  generatedAt: string;
}

export interface ZoningScenario {
  id: string;
  name: string;
  type: string;
  units: number;
  grossSqft: number;
  far: number;
  stories: number;
  parkingSpaces: number;
  estimatedRevenue: number;
  constructionCost: number;
  landValue: number;
  requiresVariance: boolean;
  varianceProbability: number;
  timelineMonths: number;
}

export interface ZoningData {
  propertyId: string;
  currentZoning: string;
  zoningDescription: string;
  lotSizeSqft: number;
  currentFar: number;
  maxFar: number;
  currentUnits: number;
  maxUnits: number;
  maxHeight: number;
  varianceProbability: number;
  setbacks: { front: number; side: number; rear: number };
  overlayDistricts: string[];
  scenarios: ZoningScenario[];
  aiSummary: string;
  dataSource: string;
  generatedAt: string;
}

export interface MicroMarket {
  name: string;
  score: number;
  trajectory: string;
  deltaQoQ: number;
}

export interface NeighborhoodMomentumData {
  propertyId: string;
  trajectory: string;
  momentumScore: number;
  institutionalFlowM: number;
  capRateCompression: number;
  priceAppreciation12m: number;
  permitVolume3m: number;
  permitVolumeChange: number;
  restaurantOpenings3m: number;
  retailVacancyPct: number;
  walkScore: number;
  transitScore: number;
  medianHHIncome: number;
  incomeGrowth5y: number;
  topSignals: string[];
  microMarkets: MicroMarket[];
  dataSource: string;
  generatedAt: string;
}

export interface MotivationFactor {
  factor: string;
  weight: number;
}

export interface SellerMotivationData {
  propertyId: string;
  acceptanceScore: number;
  acceptanceCategory: string;
  debtLoad: number;
  estimatedEquity: number;
  estimatedLTV: number;
  suggestedDiscount: number;
  ownershipYears: number;
  daysOnMarket: number;
  priorListings: number;
  taxDelinquencyMonths: number;
  motivationFactors: MotivationFactor[];
  distressSignals: string[];
  outreachScript: string;
  dataSource: string;
  generatedAt: string;
}

export interface RenovationOption {
  name: string;
  cost: number;
  valueAdd: number;
  timelineWeeks: number;
}

export interface RoomInspection {
  id: string;
  name: string;
  sqft: number;
  condition: string;
  ceiling: number;
  renovationOptions: RenovationOption[];
}

export interface StagingOption {
  name: string;
  description: string;
  estimatedValue: number;
}

export interface SpatialWalkthroughData {
  propertyId: string;
  totalSqft: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  levels: number;
  overallConditionScore: number;
  totalRenovationBudget: number;
  totalValueAdd: number;
  rooms: RoomInspection[];
  stagingOptions: StagingOption[];
  dataSource: string;
  generatedAt: string;
}

export interface WaterfallTier {
  description: string;
  gpAmount: number;
  lpAmount: number;
}

export interface PropertyWaterfallData {
  propertyId: string;
  totalEquity: number;
  gpContributionPct: number;
  preferredReturn: number;
  catchUpPct: number;
  promotePct: number;
  holdMonths: number;
  exitProceeds: number;
  gpEquity: number;
  lpEquity: number;
  gpTotal: number;
  lpTotal: number;
  gpEM: number;
  lpEM: number;
  gpIRR: number;
  lpIRR: number;
  tiers: WaterfallTier[];
  dataSource: string;
  generatedAt: string;
}

export const api = {
  marketIntelligence: (market?: string) =>
    apiFetch<any>(`/terra/market-intelligence${market ? `?market=${encodeURIComponent(market)}` : ""}`),
  reitFilings: (type?: string) =>
    apiFetch<any>(`/terra/reit-filings${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  demographics: (market?: string) =>
    apiFetch<any>(`/terra/demographics${market ? `?market=${encodeURIComponent(market)}` : ""}`),
  propertyRisk: (propertyId?: string) =>
    apiFetch<any>(`/terra/property-risk${propertyId ? `?propertyId=${propertyId}` : ""}`),
  employmentOutlook: () => apiFetch<any>("/terra/employment-outlook"),
  sectorPerformance: () => apiFetch<any>("/terra/sector-performance"),
  live: {
    censusHousing: (msa?: string) =>
      apiFetch<any>(`/terra/live/census-housing${msa ? `?msa=${msa}` : ""}`),
    hudFairMarketRents: () => apiFetch<any>("/terra/live/hud-fair-market-rents"),
    mortgageRates: () => apiFetch<any>("/terra/live/mortgage-rates"),
    blsConstruction: () => apiFetch<any>("/terra/live/bls-construction"),
    femaNri: (state?: string) =>
      apiFetch<any>(`/terra/live/fema-nri${state ? `?state=${state}` : ""}`),
  },
  leases: {
    list: () => apiFetch<{ leases: TerraLease[]; dataMode: string }>("/terra/leases"),
    create: (data: Omit<TerraLease, "id" | "extractedAt" | "isDemo"> & { isDemo?: boolean }) =>
      apiFetch<{ lease: TerraLease }>("/terra/leases", { method: "POST", body: JSON.stringify(data) }),
    upload: async (file: File): Promise<{ lease: TerraLease; extraction: { method: string; confidence: number; missingFields: string[] } }> => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/terra/leases/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/leases/${id}`, { method: "DELETE" }),
  },
  proForma: {
    list: () => apiFetch<{ projects: TerraProFormaProject[]; dataMode: string }>("/terra/pro-forma-projects"),
    create: (data: { projectName: string; propertyType?: string; inputs: Record<string, unknown>; results?: Record<string, unknown> }) =>
      apiFetch<{ project: TerraProFormaProject }>("/terra/pro-forma-projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ projectName: string; inputs: Record<string, unknown>; results: Record<string, unknown> }>) =>
      apiFetch<{ updated: boolean }>(`/terra/pro-forma-projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/pro-forma-projects/${id}`, { method: "DELETE" }),
  },
  exchanges1031: {
    list: () => apiFetch<{ exchanges: TerraExchange[]; dataMode: string }>("/terra/exchanges-1031"),
    create: (data: Omit<TerraExchange, "id" | "isDemo"> & { isDemo?: boolean }) =>
      apiFetch<{ exchange: TerraExchange }>("/terra/exchanges-1031", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TerraExchange>) =>
      apiFetch<{ updated: boolean }>(`/terra/exchanges-1031/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/exchanges-1031/${id}`, { method: "DELETE" }),
  },
  taxAppeals: {
    list: () => apiFetch<{ properties: TerraTaxAppeal[]; dataMode: string }>("/terra/tax-appeals"),
    create: (data: Omit<TerraTaxAppeal, "id" | "isDemo"> & { isDemo?: boolean }) =>
      apiFetch<{ property: TerraTaxAppeal }>("/terra/tax-appeals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TerraTaxAppeal>) =>
      apiFetch<{ updated: boolean }>(`/terra/tax-appeals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/tax-appeals/${id}`, { method: "DELETE" }),
  },
  waterfall: {
    list: () => apiFetch<{ structures: TerraWaterfallStructure[]; dataMode: string }>("/terra/waterfall-structures"),
    create: (data: { name: string; description?: string; inputs: Record<string, unknown>; results?: Record<string, unknown> }) =>
      apiFetch<{ structure: TerraWaterfallStructure }>("/terra/waterfall-structures", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; inputs: Record<string, unknown>; results: Record<string, unknown> }>) =>
      apiFetch<{ updated: boolean }>(`/terra/waterfall-structures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/waterfall-structures/${id}`, { method: "DELETE" }),
  },
  construction: {
    list: () => apiFetch<{ projects: TerraConstructionProject[]; dataMode: string }>("/terra/construction-projects"),
    create: (data: Omit<TerraConstructionProject, "id" | "isDemo"> & { isDemo?: boolean }) =>
      apiFetch<{ project: TerraConstructionProject }>("/terra/construction-projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TerraConstructionProject>) =>
      apiFetch<{ updated: boolean }>(`/terra/construction-projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/construction-projects/${id}`, { method: "DELETE" }),
  },
  tenantApplications: {
    list: () => apiFetch<{ applicants: TerraTenantApplication[]; dataMode: string }>("/terra/tenant-applications"),
    create: (data: Omit<TerraTenantApplication, "id" | "isDemo"> & { isDemo?: boolean }) =>
      apiFetch<{ applicant: TerraTenantApplication }>("/terra/tenant-applications", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TerraTenantApplication>) =>
      apiFetch<{ updated: boolean }>(`/terra/tenant-applications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/terra/tenant-applications/${id}`, { method: "DELETE" }),
  },
  properties: {
    climateRisk: (id: string) => apiFetch<{ data: ClimateRiskData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/climate-risk`),
    zoning: (id: string) => apiFetch<{ data: ZoningData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/zoning`),
    neighborhoodMomentum: (id: string) => apiFetch<{ data: NeighborhoodMomentumData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/neighborhood-momentum`),
    sellerMotivation: (id: string) => apiFetch<{ data: SellerMotivationData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/seller-motivation`),
    spatialWalkthrough: (id: string) => apiFetch<{ data: SpatialWalkthroughData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/spatial-walkthrough`),
    waterfall: (id: string) => apiFetch<{ data: PropertyWaterfallData; propertyId: string; dataMode: string }>(`/terra/properties/${id}/waterfall`),
  },
};
