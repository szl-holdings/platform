import {
  registry,
  getProduct,
  getProductName,
  getProductTagline,
  getLiveProducts,
  getMetric,
  copyrightLine,
  copyrightLineShort,
  aboutSzlParagraph,
  founderQuote,
  ecosystemThesis,
} from "./index.js";

export type {
  BrandRegistry,
  ProductEntry,
  CompanyFacts,
  FounderBio,
} from "./types.js";

export {
  registry,
  getProduct,
  getProductName,
  getProductTagline,
  getLiveProducts,
  getMetric,
  copyrightLine,
  copyrightLineShort,
  aboutSzlParagraph,
  founderQuote,
  ecosystemThesis,
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
