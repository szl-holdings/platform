import manifestRaw from '@/data/capability-manifest.json';

export type CapabilityStatus =
  | 'live'
  | 'working_demo'
  | 'partial'
  | 'stub'
  | 'broken'
  | 'undocumented';

export interface Capability {
  id: string;
  product: string;
  capability_name: string;
  claim_source: string;
  route_or_module: string;
  status: CapabilityStatus;
  evidence: string;
  test_coverage: string;
  blocking_dependencies: string[];
  owner: string;
  severity: string;
}

export interface ProductSummary {
  product: string;
  total: number;
  live: number;
  working_demo: number;
  partial: number;
  stub: number;
  broken: number;
  undocumented: number;
  readinessScore: number;
  capabilities: Capability[];
}

const manifest = manifestRaw as { meta: Record<string, unknown>; capabilities: Capability[] };

export function useCapabilityManifest() {
  const capabilities = manifest.capabilities as Capability[];
  const meta = manifest.meta as {
    title: string;
    version: string;
    generated: string;
    auditor: string;
    scope: string;
  };

  const byProduct = capabilities.reduce<Record<string, Capability[]>>((acc, cap) => {
    if (!acc[cap.product]) acc[cap.product] = [];
    acc[cap.product].push(cap);
    return acc;
  }, {});

  const products: ProductSummary[] = Object.entries(byProduct).map(([product, caps]) => {
    const counts = { live: 0, working_demo: 0, partial: 0, stub: 0, broken: 0, undocumented: 0 };
    for (const c of caps) {
      if (c.status in counts) counts[c.status as keyof typeof counts]++;
    }
    const readinessScore = Math.round(
      ((counts.live * 1.0 + counts.working_demo * 0.75 + counts.partial * 0.4) / caps.length) * 100,
    );
    return {
      product,
      total: caps.length,
      ...counts,
      readinessScore,
      capabilities: caps,
    };
  });

  const totals = capabilities.reduce(
    (acc, c) => {
      if (c.status in acc) acc[c.status as keyof typeof acc]++;
      acc.total++;
      return acc;
    },
    { total: 0, live: 0, working_demo: 0, partial: 0, stub: 0, broken: 0, undocumented: 0 },
  );

  const provenClaims = capabilities.filter(
    (c) => c.status === 'live' || c.status === 'working_demo',
  );
  const flaggedClaims = capabilities.filter(
    (c) => c.status === 'stub' || c.status === 'broken' || c.status === 'undocumented',
  );

  return { capabilities, products, totals, provenClaims, flaggedClaims, meta };
}

export const PRODUCT_DISPLAY: Record<
  string,
  { label: string; color: string; href: string; appStatus: string }
> = {
  'KORA (Business Observability)': {
    label: 'KORA',
    color: '#d4a054',
    href: '/lyte',
    appStatus: 'Beta',
  },
  'PARAGON (Defense & Intelligence)': {
    label: 'PARAGON',
    color: '#c45a4a',
    href: '/solutions/aegis',
    appStatus: 'Beta',
  },
  'SEXTANT (Maritime Intelligence)': {
    label: 'SEXTANT',
    color: '#4a90b8',
    href: '/solutions/vessels',
    appStatus: 'Partial',
  },
  'DOMAINE (Real Estate Intelligence)': {
    label: 'DOMAINE',
    color: '#c8953c',
    href: '/solutions/terra',
    appStatus: 'Beta',
  },
  'Carlota Jo (Private Advisory)': {
    label: 'Carlota Jo',
    color: '#a0a0c0',
    href: '/carlota-jo',
    appStatus: 'GA',
  },
  'API Server': { label: 'API Server', color: '#6aaa72', href: '/developers', appStatus: 'GA' },
  'SZL Holdings Corporate': { label: 'Corporate', color: '#8b7ac8', href: '/', appStatus: 'Beta' },
  'TENAX (Cyber Resilience)': {
    label: 'TENAX',
    color: '#ef8c3a',
    href: '/solutions/aegis',
    appStatus: 'Beta',
  },
  'Command (Unified Command Portal)': {
    label: 'Command',
    color: '#5b8dd4',
    href: '/command',
    appStatus: 'Partial',
  },
  'LUMINA (AI Executive Briefing)': {
    label: 'LUMINA',
    color: '#e0709a',
    href: '/pulse',
    appStatus: 'Partial',
  },
  'SZL Holdings Mobile': { label: 'Mobile', color: '#7ecfc0', href: '/mobile', appStatus: 'Beta' },
  'Packages (Marketplace)': {
    label: 'Packages',
    color: '#a8c070',
    href: '/developers',
    appStatus: 'GA',
  },
  'Infrastructure / Security': {
    label: 'Infrastructure',
    color: '#808090',
    href: '/trust-center',
    appStatus: 'Partial',
  },
  'Counsel (Legal Matter Command)': {
    label: 'Counsel',
    color: '#6aaa72',
    href: '/solutions/prism-counsel',
    appStatus: 'Beta',
  },
  'Counsel (Legal Command)': {
    label: 'Counsel',
    color: '#70b890',
    href: '/solutions/prism-counsel',
    appStatus: 'Beta',
  },
};
