import type {
  AdapterHealthStatus,
  DataFabricAdapter,
  Domain,
  NormalizedEntity,
  OntologyMapping,
  RefreshSchedule,
} from '../adapter-registry.js';

const MACRO_ONTOLOGY_MAPPINGS: OntologyMapping[] = [
  {
    entityType: 'signal',
    domain: 'lyte',
    fieldMap: {
      label: 'indicatorName',
      confidence: 'dataQuality',
    },
  },
];

const REFRESH_SCHEDULE: RefreshSchedule = {
  intervalMs: 60 * 60 * 1000,
  retryBackoffMs: 15_000,
  maxRetries: 3,
  activeHoursUtc: { start: 0, end: 24 },
};

interface MacroIndicator {
  id: string;
  name: string;
  category: 'rates' | 'commodities' | 'fx' | 'equity_indices' | 'macro';
  value: number;
  previousValue: number;
  changeAbsolute: number;
  changePct: number;
  unit: string;
  frequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  source: string;
  asOfDate: string;
  sparkline7d: number[];
  impact: string;
}

const SEED_INDICATORS: MacroIndicator[] = [
  { id: 'fed-funds', name: 'Fed Funds Rate', category: 'rates', value: 5.33, previousValue: 5.33, changeAbsolute: 0, changePct: 0, unit: '%', frequency: 'daily', source: 'Federal Reserve', asOfDate: '2026-04-25', sparkline7d: [5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33], impact: 'Drives cap rates, borrowing costs, and asset valuations across Terra and Holdings portfolios' },
  { id: 'treasury-10y', name: '10-Year Treasury Yield', category: 'rates', value: 4.38, previousValue: 4.42, changeAbsolute: -0.04, changePct: -0.9, unit: '%', frequency: 'daily', source: 'US Treasury', asOfDate: '2026-04-25', sparkline7d: [4.45, 4.43, 4.40, 4.42, 4.41, 4.42, 4.38], impact: 'Primary benchmark for commercial real estate cap rate spreads and debt pricing' },
  { id: 'treasury-2y', name: '2-Year Treasury Yield', category: 'rates', value: 4.72, previousValue: 4.78, changeAbsolute: -0.06, changePct: -1.3, unit: '%', frequency: 'daily', source: 'US Treasury', asOfDate: '2026-04-25', sparkline7d: [4.82, 4.80, 4.76, 4.78, 4.75, 4.78, 4.72], impact: 'Yield curve shape indicator — inversion signals recession risk' },
  { id: 'wti-crude', name: 'WTI Crude Oil', category: 'commodities', value: 73.41, previousValue: 72.88, changeAbsolute: 0.53, changePct: 0.73, unit: 'USD/bbl', frequency: 'daily', source: 'NYMEX', asOfDate: '2026-04-25', sparkline7d: [71.2, 72.1, 72.5, 72.88, 73.1, 72.88, 73.41], impact: 'Primary cost driver for Vessels bunker expenses and voyage economics' },
  { id: 'brent-crude', name: 'Brent Crude Oil', category: 'commodities', value: 77.89, previousValue: 77.34, changeAbsolute: 0.55, changePct: 0.71, unit: 'USD/bbl', frequency: 'daily', source: 'ICE', asOfDate: '2026-04-25', sparkline7d: [75.8, 76.5, 76.9, 77.34, 77.5, 77.34, 77.89], impact: 'Global oil benchmark — affects tanker charter rates and trade flows' },
  { id: 'natural-gas', name: 'Henry Hub Natural Gas', category: 'commodities', value: 2.18, previousValue: 2.24, changeAbsolute: -0.06, changePct: -2.7, unit: 'USD/MMBtu', frequency: 'daily', source: 'NYMEX', asOfDate: '2026-04-25', sparkline7d: [2.30, 2.28, 2.25, 2.24, 2.20, 2.24, 2.18], impact: 'LNG shipping demand indicator — affects gas carrier charter rates' },
  { id: 'gold-spot', name: 'Gold Spot', category: 'commodities', value: 2342.50, previousValue: 2328.80, changeAbsolute: 13.70, changePct: 0.59, unit: 'USD/oz', frequency: 'daily', source: 'LBMA', asOfDate: '2026-04-25', sparkline7d: [2310, 2318, 2325, 2328.8, 2335, 2328.8, 2342.5], impact: 'Safe-haven demand signal — inversely correlated with risk appetite' },
  { id: 'dxy', name: 'US Dollar Index (DXY)', category: 'fx', value: 104.32, previousValue: 104.55, changeAbsolute: -0.23, changePct: -0.22, unit: 'index', frequency: 'daily', source: 'ICE', asOfDate: '2026-04-25', sparkline7d: [105.1, 104.9, 104.7, 104.55, 104.4, 104.55, 104.32], impact: 'USD strength affects charter revenue in foreign-denominated contracts and cross-border RE valuations' },
  { id: 'eurusd', name: 'EUR/USD', category: 'fx', value: 1.0862, previousValue: 1.0845, changeAbsolute: 0.0017, changePct: 0.16, unit: 'rate', frequency: 'daily', source: 'Reuters', asOfDate: '2026-04-25', sparkline7d: [1.078, 1.080, 1.082, 1.0845, 1.085, 1.0845, 1.0862], impact: 'Key FX pair for European asset exposure and containerized trade flows' },
  { id: 'spx', name: 'S&P 500', category: 'equity_indices', value: 5117.09, previousValue: 5104.76, changeAbsolute: 12.33, changePct: 0.24, unit: 'index', frequency: 'daily', source: 'NYSE', asOfDate: '2026-04-25', sparkline7d: [5085, 5092, 5098, 5104.76, 5110, 5104.76, 5117.09], impact: 'Risk appetite barometer — correlates with CRE capital flows and PE deal volume' },
  { id: 'vix', name: 'VIX Volatility Index', category: 'equity_indices', value: 17.43, previousValue: 18.12, changeAbsolute: -0.69, changePct: -3.8, unit: 'index', frequency: 'daily', source: 'CBOE', asOfDate: '2026-04-25', sparkline7d: [19.2, 18.8, 18.5, 18.12, 17.8, 18.12, 17.43], impact: 'Market fear gauge — high VIX signals defensive positioning across all portfolios' },
  { id: 'cpi-yoy', name: 'CPI Year-over-Year', category: 'macro', value: 3.2, previousValue: 3.4, changeAbsolute: -0.2, changePct: -5.9, unit: '%', frequency: 'monthly', source: 'BLS', asOfDate: '2026-03-01', sparkline7d: [3.5, 3.4, 3.4, 3.4, 3.3, 3.4, 3.2], impact: 'Inflation trajectory drives Fed policy expectations and real yield calculations' },
  { id: 'unemployment', name: 'US Unemployment Rate', category: 'macro', value: 4.2, previousValue: 4.1, changeAbsolute: 0.1, changePct: 2.4, unit: '%', frequency: 'monthly', source: 'BLS', asOfDate: '2026-03-01', sparkline7d: [3.9, 4.0, 4.0, 4.1, 4.1, 4.1, 4.2], impact: 'Labor market health affects commercial occupancy rates and consumer spending' },
  { id: 'baltic-dry', name: 'Baltic Dry Index', category: 'commodities', value: 1842, previousValue: 1798, changeAbsolute: 44, changePct: 2.4, unit: 'index', frequency: 'daily', source: 'Baltic Exchange', asOfDate: '2026-04-25', sparkline7d: [1756, 1770, 1785, 1798, 1815, 1798, 1842], impact: 'Dry bulk shipping demand — leading indicator for global trade volumes' },
  { id: 'vlcc-rate', name: 'VLCC TD3C Rate', category: 'commodities', value: 42500, previousValue: 41200, changeAbsolute: 1300, changePct: 3.2, unit: 'USD/day', frequency: 'daily', source: 'Baltic Exchange', asOfDate: '2026-04-25', sparkline7d: [38500, 39200, 40100, 41200, 41800, 41200, 42500], impact: 'VLCC time-charter benchmark — direct input to Vessels voyage P&L calculations' },
];

export const macroIndicatorsAdapter: DataFabricAdapter = {
  id: 'macro-indicators',
  displayName: 'Macro Market Indicators (Rates, Commodities, FX, Indices)',
  domain: 'lyte',
  category: 'market_data',
  costPerQueryUsd: 0.05,
  ontologyMappings: MACRO_ONTOLOGY_MAPPINGS,
  refreshSchedule: REFRESH_SCHEDULE,

  isConfigured(): boolean {
    return true;
  },

  async fetch(params?: Record<string, unknown>): Promise<NormalizedEntity[]> {
    const category = params?.category as string | undefined;
    const now = new Date().toISOString();

    let indicators = SEED_INDICATORS;
    if (category) indicators = indicators.filter((i) => i.category === category);

    return indicators.map((ind) => ({
      id: `macro-${ind.id}`,
      entityType: 'signal' as const,
      domain: 'lyte' as const,
      label: `${ind.name}: ${ind.unit === 'USD/bbl' || ind.unit === 'USD/oz' || ind.unit === 'USD/day' ? '$' : ''}${ind.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${ind.unit === '%' ? '%' : ''} (${ind.changePct >= 0 ? '+' : ''}${ind.changePct.toFixed(2)}%)`,
      confidence: 0.96,
      freshness: 'recent' as const,
      sourceRef: `macro-indicators:${ind.id}`,
      provenance: {
        sourceId: ind.id,
        adapterId: 'macro-indicators',
        confidence: 0.96,
        freshness: 'recent' as const,
        fetchedAt: now,
        costUsd: 0.005,
        rawRecordCount: 1,
      },
      data: { ...ind, dataType: 'macro_indicator' },
      createdAt: ind.asOfDate,
      updatedAt: now,
    }));
  },

  async healthCheck(): Promise<AdapterHealthStatus> {
    return {
      adapterId: 'macro-indicators',
      status: 'healthy',
      lastSuccessAt: new Date().toISOString(),
      lastErrorAt: null,
      lastError: null,
      totalQueries: 0,
      totalErrors: 0,
      avgLatencyMs: 35,
    };
  },
};

export type { MacroIndicator };
export { SEED_INDICATORS };
