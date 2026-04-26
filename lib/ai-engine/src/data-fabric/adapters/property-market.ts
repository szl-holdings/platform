import type {
  AdapterHealthStatus,
  DataFabricAdapter,
  Domain,
  NormalizedEntity,
  OntologyMapping,
  RefreshSchedule,
} from '../adapter-registry.js';

const PROPERTY_ONTOLOGY_MAPPINGS: OntologyMapping[] = [
  {
    entityType: 'property',
    domain: 'terra',
    fieldMap: {
      address: 'address',
      borough: 'submarket',
      assessedValueUsd: 'lastSalePrice',
      distressScore: 'distressScore',
      ownerName: 'ownerName',
    },
  },
  {
    entityType: 'deal',
    domain: 'terra',
    fieldMap: {
      estimatedValueUsd: 'transactionPrice',
      stage: 'transactionStatus',
      counterparty: 'buyerName',
    },
  },
];

const REFRESH_SCHEDULE: RefreshSchedule = {
  intervalMs: 6 * 60 * 60 * 1000,
  retryBackoffMs: 30_000,
  maxRetries: 3,
  activeHoursUtc: { start: 6, end: 22 },
};

interface ComparableTransaction {
  id: string;
  address: string;
  submarket: string;
  propertyType: string;
  salePrice: number;
  pricePerSf: number;
  capRate: number;
  saleDate: string;
  sqFt: number;
  yearBuilt: number;
  noi: number;
  occupancyPct: number;
  buyerName: string;
  sellerName: string;
}

interface RentComp {
  id: string;
  address: string;
  submarket: string;
  propertyType: string;
  askingRentPerSf: number;
  effectiveRentPerSf: number;
  freeMonths: number;
  leaseTermMonths: number;
  tenantIndustry: string;
  signDate: string;
}

interface VacancyData {
  submarket: string;
  propertyType: string;
  vacancyRatePct: number;
  absorptionSf: number;
  inventorySf: number;
  underConstructionSf: number;
  avgAskingRentPerSf: number;
  asOfDate: string;
}

const SEED_TRANSACTIONS: ComparableTransaction[] = [
  { id: 'txn-001', address: '100 Park Ave, Manhattan', submarket: 'Midtown', propertyType: 'office', salePrice: 185_000_000, pricePerSf: 892, capRate: 5.2, saleDate: '2026-03-15', sqFt: 207_400, yearBuilt: 1998, noi: 9_620_000, occupancyPct: 91, buyerName: 'Vanguard RE Fund IV', sellerName: 'SL Green' },
  { id: 'txn-002', address: '450 Brickell Ave, Miami', submarket: 'Brickell', propertyType: 'office', salePrice: 92_000_000, pricePerSf: 614, capRate: 5.8, saleDate: '2026-02-28', sqFt: 149_800, yearBuilt: 2015, noi: 5_336_000, occupancyPct: 88, buyerName: 'Hines REIT', sellerName: 'Related Group' },
  { id: 'txn-003', address: '1200 Industrial Blvd, Austin', submarket: 'East Austin', propertyType: 'industrial', salePrice: 38_500_000, pricePerSf: 192, capRate: 6.1, saleDate: '2026-01-20', sqFt: 200_500, yearBuilt: 2020, noi: 2_348_500, occupancyPct: 97, buyerName: 'Prologis', sellerName: 'Trammell Crow' },
  { id: 'txn-004', address: '88 Warehouse Rd, Dallas', submarket: 'DFW Industrial', propertyType: 'industrial', salePrice: 42_000_000, pricePerSf: 175, capRate: 5.9, saleDate: '2026-03-01', sqFt: 240_000, yearBuilt: 2019, noi: 2_478_000, occupancyPct: 95, buyerName: 'Blackstone', sellerName: 'Duke Realty' },
  { id: 'txn-005', address: '300 Retail Pkwy, Atlanta', submarket: 'Buckhead', propertyType: 'retail', salePrice: 28_000_000, pricePerSf: 350, capRate: 6.8, saleDate: '2026-02-10', sqFt: 80_000, yearBuilt: 2005, noi: 1_904_000, occupancyPct: 82, buyerName: 'Simon Property', sellerName: 'Whitehall RE' },
  { id: 'txn-006', address: '500 Tower Dr, Chicago', submarket: 'Loop', propertyType: 'office', salePrice: 125_000_000, pricePerSf: 520, capRate: 6.4, saleDate: '2026-01-05', sqFt: 240_400, yearBuilt: 1990, noi: 8_000_000, occupancyPct: 84, buyerName: 'JP Morgan AM', sellerName: 'Manulife' },
  { id: 'txn-007', address: '750 Coastal Hwy, San Diego', submarket: 'Del Mar', propertyType: 'multifamily', salePrice: 56_000_000, pricePerSf: 467, capRate: 4.9, saleDate: '2026-03-22', sqFt: 120_000, yearBuilt: 2022, noi: 2_744_000, occupancyPct: 96, buyerName: 'Greystar', sellerName: 'AvalonBay' },
  { id: 'txn-008', address: '200 Main St, Denver', submarket: 'LoDo', propertyType: 'office', salePrice: 78_000_000, pricePerSf: 445, capRate: 5.7, saleDate: '2026-02-18', sqFt: 175_300, yearBuilt: 2008, noi: 4_446_000, occupancyPct: 89, buyerName: 'CBRE Investors', sellerName: 'Brookfield' },
];

const SEED_RENT_COMPS: RentComp[] = [
  { id: 'rent-001', address: '100 Park Ave, Manhattan', submarket: 'Midtown', propertyType: 'office', askingRentPerSf: 78, effectiveRentPerSf: 68, freeMonths: 6, leaseTermMonths: 120, tenantIndustry: 'Financial Services', signDate: '2026-03-01' },
  { id: 'rent-002', address: '450 Brickell Ave, Miami', submarket: 'Brickell', propertyType: 'office', askingRentPerSf: 62, effectiveRentPerSf: 55, freeMonths: 4, leaseTermMonths: 84, tenantIndustry: 'Technology', signDate: '2026-02-15' },
  { id: 'rent-003', address: '1200 Industrial Blvd, Austin', submarket: 'East Austin', propertyType: 'industrial', askingRentPerSf: 12, effectiveRentPerSf: 11.5, freeMonths: 2, leaseTermMonths: 60, tenantIndustry: 'Logistics', signDate: '2026-01-10' },
  { id: 'rent-004', address: '88 Warehouse Rd, Dallas', submarket: 'DFW Industrial', propertyType: 'industrial', askingRentPerSf: 11, effectiveRentPerSf: 10.2, freeMonths: 3, leaseTermMonths: 84, tenantIndustry: 'E-Commerce', signDate: '2026-02-20' },
  { id: 'rent-005', address: '500 Tower Dr, Chicago', submarket: 'Loop', propertyType: 'office', askingRentPerSf: 52, effectiveRentPerSf: 44, freeMonths: 8, leaseTermMonths: 120, tenantIndustry: 'Legal', signDate: '2026-01-25' },
];

const SEED_VACANCY: VacancyData[] = [
  { submarket: 'Midtown', propertyType: 'office', vacancyRatePct: 14.2, absorptionSf: -120_000, inventorySf: 88_000_000, underConstructionSf: 2_400_000, avgAskingRentPerSf: 76, asOfDate: '2026-Q1' },
  { submarket: 'Brickell', propertyType: 'office', vacancyRatePct: 11.8, absorptionSf: 45_000, inventorySf: 18_500_000, underConstructionSf: 1_100_000, avgAskingRentPerSf: 60, asOfDate: '2026-Q1' },
  { submarket: 'East Austin', propertyType: 'industrial', vacancyRatePct: 4.1, absorptionSf: 320_000, inventorySf: 42_000_000, underConstructionSf: 3_800_000, avgAskingRentPerSf: 12, asOfDate: '2026-Q1' },
  { submarket: 'DFW Industrial', propertyType: 'industrial', vacancyRatePct: 5.6, absorptionSf: 180_000, inventorySf: 92_000_000, underConstructionSf: 6_200_000, avgAskingRentPerSf: 10.5, asOfDate: '2026-Q1' },
  { submarket: 'Loop', propertyType: 'office', vacancyRatePct: 18.4, absorptionSf: -210_000, inventorySf: 124_000_000, underConstructionSf: 800_000, avgAskingRentPerSf: 48, asOfDate: '2026-Q1' },
  { submarket: 'Buckhead', propertyType: 'retail', vacancyRatePct: 8.2, absorptionSf: 12_000, inventorySf: 14_000_000, underConstructionSf: 200_000, avgAskingRentPerSf: 38, asOfDate: '2026-Q1' },
  { submarket: 'Del Mar', propertyType: 'multifamily', vacancyRatePct: 3.8, absorptionSf: 95_000, inventorySf: 8_200_000, underConstructionSf: 450_000, avgAskingRentPerSf: 3.2, asOfDate: '2026-Q1' },
  { submarket: 'LoDo', propertyType: 'office', vacancyRatePct: 16.1, absorptionSf: -85_000, inventorySf: 22_000_000, underConstructionSf: 600_000, avgAskingRentPerSf: 42, asOfDate: '2026-Q1' },
];

export const propertyMarketAdapter: DataFabricAdapter = {
  id: 'property-market',
  displayName: 'Commercial Property Market Data',
  domain: 'terra',
  category: 'real_estate',
  costPerQueryUsd: 0.15,
  ontologyMappings: PROPERTY_ONTOLOGY_MAPPINGS,
  refreshSchedule: REFRESH_SCHEDULE,

  isConfigured(): boolean {
    return true;
  },

  async fetch(params?: Record<string, unknown>): Promise<NormalizedEntity[]> {
    const submarket = params?.submarket as string | undefined;
    const propertyType = params?.propertyType as string | undefined;
    const now = new Date().toISOString();
    const entities: NormalizedEntity[] = [];

    let transactions = SEED_TRANSACTIONS;
    if (submarket) transactions = transactions.filter((t) => t.submarket.toLowerCase().includes(submarket.toLowerCase()));
    if (propertyType) transactions = transactions.filter((t) => t.propertyType === propertyType);

    for (const txn of transactions) {
      entities.push({
        id: `prop-txn-${txn.id}`,
        entityType: 'deal',
        domain: 'terra',
        label: `${txn.address} — $${(txn.salePrice / 1_000_000).toFixed(1)}M`,
        confidence: 0.92,
        freshness: 'recent',
        sourceRef: `property-market:${txn.id}`,
        provenance: {
          sourceId: txn.id,
          adapterId: 'property-market',
          confidence: 0.92,
          freshness: 'recent',
          fetchedAt: now,
          costUsd: 0.15,
          rawRecordCount: 1,
        },
        data: {
          ...txn,
          dataType: 'transaction',
        },
        createdAt: txn.saleDate,
        updatedAt: now,
      });
    }

    let rentComps = SEED_RENT_COMPS;
    if (submarket) rentComps = rentComps.filter((r) => r.submarket.toLowerCase().includes(submarket.toLowerCase()));

    for (const rc of rentComps) {
      entities.push({
        id: `prop-rent-${rc.id}`,
        entityType: 'property',
        domain: 'terra',
        label: `Rent Comp: ${rc.address} — $${rc.effectiveRentPerSf}/SF`,
        confidence: 0.88,
        freshness: 'recent',
        sourceRef: `property-market:${rc.id}`,
        provenance: {
          sourceId: rc.id,
          adapterId: 'property-market',
          confidence: 0.88,
          freshness: 'recent',
          fetchedAt: now,
          costUsd: 0.05,
          rawRecordCount: 1,
        },
        data: {
          ...rc,
          dataType: 'rent_comp',
        },
        createdAt: rc.signDate,
        updatedAt: now,
      });
    }

    let vacancy = SEED_VACANCY;
    if (submarket) vacancy = vacancy.filter((v) => v.submarket.toLowerCase().includes(submarket.toLowerCase()));

    for (const v of vacancy) {
      entities.push({
        id: `prop-vac-${v.submarket.toLowerCase().replace(/\s+/g, '-')}-${v.propertyType}`,
        entityType: 'property',
        domain: 'terra',
        label: `${v.submarket} ${v.propertyType} — ${v.vacancyRatePct}% vacancy`,
        confidence: 0.85,
        freshness: 'recent',
        sourceRef: `property-market:vacancy:${v.submarket}`,
        provenance: {
          sourceId: `vacancy-${v.submarket}`,
          adapterId: 'property-market',
          confidence: 0.85,
          freshness: 'recent',
          fetchedAt: now,
          costUsd: 0.02,
          rawRecordCount: 1,
        },
        data: {
          ...v,
          dataType: 'vacancy',
        },
        createdAt: v.asOfDate,
        updatedAt: now,
      });
    }

    return entities;
  },

  async healthCheck(): Promise<AdapterHealthStatus> {
    return {
      adapterId: 'property-market',
      status: 'healthy',
      lastSuccessAt: new Date().toISOString(),
      lastErrorAt: null,
      lastError: null,
      totalQueries: 0,
      totalErrors: 0,
      avgLatencyMs: 45,
    };
  },
};

export type { ComparableTransaction, RentComp, VacancyData };
export { SEED_TRANSACTIONS, SEED_RENT_COMPS, SEED_VACANCY };
