export interface CompanyFacts {
  name: string;
  legalEntity: string;
  jurisdiction: string;
  founded: string;
  foundedQuarter: string;
  headquarters: string[];
  email: string;
  privacyEmail: string;
  website: string;
}

export interface FounderBio {
  name: string;
  title: string;
  shortBio: string;
  longBio: string;
  linkedin: string;
  quote: string;
  quoteAttribution: string;
}

export interface CompanyMetric {
  label: string;
  value: string;
  asOf?: string;
  source?: string;
}

export interface FundingRound {
  round: string;
  amount: string;
  date: string;
  detail?: string;
}

export interface ProductEntry {
  id: string;
  name: string;
  tagline: string;
  category: string;
  oneLiner: string;
  description: string;
  status: "live" | "beta" | "alpha" | "development" | "deferred";
  doctrineRole?: string;
  link?: string;
  color?: string;
}

export interface ApprovedBoilerplate {
  aboutSzl: string;
  footerRightsReserved: string;
  footerTagline: string;
  governancePhilosophy: string;
  missionStatement: string;
  prismExpansion: string;
  alloyDescription: string;
  ecosystemThesis: string;
}

export interface LegalEntityFacts {
  entityName: string;
  jurisdiction: string;
  copyrightHolder: string;
  privacyController: string;
  privacyEmail: string;
  termsContact: string;
}

export interface BrandRegistry {
  version: string;
  company: CompanyFacts;
  founder: FounderBio;
  metrics: Record<string, CompanyMetric>;
  funding: FundingRound[];
  products: ProductEntry[];
  boilerplate: ApprovedBoilerplate;
  legal: LegalEntityFacts;
  deprecatedStrings: string[];
}
