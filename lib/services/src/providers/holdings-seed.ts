import type { DataProvider } from './factory.js';

export interface HoldingsVenture {
  id: string;
  name: string;
  sector: string;
  stage: 'seed' | 'series_a' | 'series_b' | 'growth' | 'mature';
  investmentDate: string;
  investmentAmount: number;
  currentValuation: number;
  ownership: number;
  status: 'active' | 'exited' | 'write_off' | 'under_review';
  description: string;
  irr: number;
}

const SEED_DATA: HoldingsVenture[] = [
  {
    id: 'h-001',
    name: 'Vessels Maritime Intelligence',
    sector: 'Maritime Technology',
    stage: 'series_b',
    investmentDate: '2024-06-15',
    investmentAmount: 2500000,
    currentValuation: 12000000,
    ownership: 35,
    status: 'active',
    description: 'AI-powered maritime fleet intelligence and compliance platform',
    irr: 0.42,
  },
  {
    id: 'h-002',
    name: 'AI Research Lab',
    sector: 'Artificial Intelligence',
    stage: 'seed',
    investmentDate: '2025-09-01',
    investmentAmount: 800000,
    currentValuation: 3200000,
    ownership: 25,
    status: 'active',
    description: 'Enterprise AI research lab focused on domain-specific models',
    irr: 0.65,
  },
  {
    id: 'h-003',
    name: 'Aegis Security',
    sector: 'Cybersecurity',
    stage: 'series_a',
    investmentDate: '2025-01-10',
    investmentAmount: 1200000,
    currentValuation: 5800000,
    ownership: 20,
    status: 'active',
    description: 'Red team simulation platform for enterprise security testing',
    irr: 0.38,
  },
  {
    id: 'h-004',
    name: 'Lyte Commerce',
    sector: 'E-commerce',
    stage: 'growth',
    investmentDate: '2023-03-22',
    investmentAmount: 4000000,
    currentValuation: 18000000,
    ownership: 15,
    status: 'active',
    description: 'Premium direct-to-consumer commerce engine',
    irr: 0.52,
  },
];

export const holdingsSeedProvider: DataProvider<HoldingsVenture> = {
  mode: 'seed',
  async getAll() {
    return SEED_DATA;
  },
  async getById(id: string) {
    return SEED_DATA.find((h) => h.id === id) ?? null;
  },
  async search(query: string) {
    const q = query.toLowerCase();
    return SEED_DATA.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.sector.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q),
    );
  },
};
