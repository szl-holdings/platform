export function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export async function downloadPropertyPDF(
  property: Record<string, unknown>,
  extras: { distressScore?: number; investmentThesis?: string; distressFactors?: string[] } = {},
): Promise<void> {
  const res = await fetch('/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template: 'terra-property-report', data: { property, ...extras } }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terra-${(property.id as string) || 'property'}-report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export const statusConfig: Record<string, { label: string; color: string; border: string }> = {
  performing: { label: 'Performing', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  watch: { label: 'Watch List', color: 'text-amber-400', border: 'border-amber-500/30' },
  critical: { label: 'Critical', color: 'text-rose-400', border: 'border-rose-500/30' },
};

export const tenantStatusColors: Record<string, string> = {
  active: 'text-emerald-400',
  expiring: 'text-amber-400',
  delinquent: 'text-rose-400',
};

export const GQL_ACTION_ITEMS = `
  query TerraActionItems($propertyId: String) {
    terraActionItems(propertyId: $propertyId, limit: 20) {
      id externalId propertyId issue severity ownerName ownerRole dueDate status recommendedAction resolvedAt updatedAt
    }
  }
`;

export const GQL_SEED_ACTIONS = `
  mutation SeedTerraActionItems($propertyId: String!) {
    seedTerraActionItems(propertyId: $propertyId) {
      id externalId propertyId issue severity ownerName ownerRole dueDate status recommendedAction resolvedAt updatedAt
    }
  }
`;

export const GQL_UPDATE_ACTION = `
  mutation UpdateTerraActionItem($id: ID!, $status: String) {
    updateTerraActionItem(id: $id, status: $status) {
      id status resolvedAt updatedAt
    }
  }
`;

export interface WhyNowFactor {
  factor: string;
  score: number;
  maxScore: number;
  summary: string;
  source?: string;
  citation?: string;
}

export interface WhyNowApiResponse {
  distressDecomposition: {
    total: number;
    tier: string;
    headline: string;
    factors: WhyNowFactor[];
    investmentThesis?: string;
  };
  fetchedAt: string;
  partialOutage?: boolean;
}

export interface WhyNowPanelData {
  distressScore: number;
  distressTier: string;
  dealNarrative: string;
  factors: { name: string; score: number; maxScore: number; summary: string }[];
  computedAt: string;
  partialOutage?: boolean;
}

export type DetailTab = 'overview' | 'ownership' | 'diligence' | 'actions' | 'atlas' | 'why-now';
