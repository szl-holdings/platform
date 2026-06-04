import {
  aboutSzlParagraph,
  copyrightLine,
  copyrightLineShort,
  ecosystemThesis,
  founderQuote,
  getLiveProducts,
  getMetric,
  getProduct,
  getProductName,
  getProductTagline,
  registry,
} from './index.js';

export type {
  BrandRegistry,
  CompanyFacts,
  FounderBio,
  ProductEntry,
} from './types.js';

export {
  aboutSzlParagraph,
  copyrightLine,
  copyrightLineShort,
  ecosystemThesis,
  founderQuote,
  getLiveProducts,
  getMetric,
  getProduct,
  getProductName,
  getProductTagline,
  registry,
};

export const mobile = {
  companyName: registry.company.name,
  companyTagline: registry.boilerplate.footerTagline,
  founderName: registry.founder.name,
  founderTitle: registry.founder.title,
  email: registry.company.email,
  aboutSzl: registry.boilerplate.aboutSzl,
  governancePhilosophy: registry.boilerplate.governancePhilosophy,
  missionStatement: registry.boilerplate.missionStatement,
  products: registry.products,
  liveProducts: getLiveProducts(),
};
