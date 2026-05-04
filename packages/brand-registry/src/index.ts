export { registry } from './registry.js';
export type {
  ApprovedBoilerplate,
  BrandRegistry,
  CompanyFacts,
  CompanyMetric,
  FounderBio,
  FundingRound,
  LegalEntityFacts,
  ProductEntry,
} from './types.js';

import { registry } from './registry.js';
import type { ProductEntry } from './types.js';

export function getProduct(id: string): ProductEntry | undefined {
  return registry.products.find((p) => p.id === id);
}

export function getProductName(id: string): string {
  return getProduct(id)?.name ?? id;
}

export function getProductTagline(id: string): string {
  return getProduct(id)?.tagline ?? '';
}

export function getProductOneLiner(id: string): string {
  return getProduct(id)?.oneLiner ?? '';
}

export function getLiveProducts(): ProductEntry[] {
  return registry.products.filter((p) => p.status === 'live');
}

export function getMetric(key: string): string {
  return registry.metrics[key]?.value ?? '';
}

export function copyrightLine(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `© ${y} ${registry.company.name}. ${registry.boilerplate.footerRightsReserved}`;
}

/** Compact copyright for dense footers — omits "All rights reserved." */
export function copyrightLineShort(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `© ${y} ${registry.company.name}`;
}

export function subsidiaryCopyrightLine(brandName: string, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `© ${y} ${brandName}. A ${registry.company.name} company. ${registry.boilerplate.footerRightsReserved}`;
}

export function aboutSzlParagraph(): string {
  return registry.boilerplate.aboutSzl;
}

export function founderQuote(): { text: string; attribution: string } {
  return {
    text: registry.founder.quote,
    attribution: registry.founder.quoteAttribution,
  };
}

export function ecosystemThesis(): string {
  return registry.boilerplate.ecosystemThesis;
}

export function productHref(id: string): string {
  return getProduct(id)?.link ?? '/';
}

export const brand = registry;
