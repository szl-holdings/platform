export type Tab = "portfolio" | "compliance" | "captable" | "admin";

export type SummaryData = {
  compliance: { totalInvestors: number; verifiedInvestors: number; pendingVerification: number; formDFilings: number; lpReports: number };
  fundAdmin: {
    capitalCalls: number; distributions: number;
    latestNav: { navDate: string; totalNavCents: number; calledCapitalCents: number; netIrr: string | null; tvpi: string | null; dpi: string | null; rvpi: string | null } | null;
    pendingCapitalCalls: Array<{ id: number; callNumber: number; callDate: string; dueDate: string; totalAmountCents: number; fundedAmountCents: number; status: string; purpose: string }>;
  };
};

export type PortfolioFinancial = {
  id: number; companySlug: string; companyName: string; periodLabel: string;
  periodStart: string; periodEnd: string; periodType: string;
  revenue: string | null; burnRate: string | null; cashAndEquivalents: string | null;
  runwayMonths: string | null; ebitda: string | null; netIncome: string | null;
  grossProfit: string | null; operatingExpenses: string | null;
  reportingStatus: string; cogs: string | null;
};

export type CapTableRow = {
  holder: { id: number; name: string; holderType: string };
  sharesByClass: Record<string, number>;
  totalShares: number;
  ownershipPct: number;
};

export type CapTableSummary = {
  holders: CapTableRow[];
  shareClasses: Array<{ id: number; name: string; classType: string; issuedShares: string | null; liquidationPreferencePct: string | null; liquidationMultiple: string | null; isParticipating: boolean; seniority: number }>;
  totalSharesByClass: Record<string, number>;
  fullyDilutedTotal: number;
};

export type LpReport = {
  id: number; reportType: string; reportingPeriod: string; status: string;
  periodStart: string; periodEnd: string;
  netIrr: string | null; tvpi: string | null; dpi: string | null; rvpi: string | null;
  grossIrr: string | null; fundNav: string | null; totalCommitments: string | null;
  calledCapital: string | null; distributedCapital: string | null;
  managementFeeRate: string | null; carryRate: string | null; preferredReturnRate: string | null;
  narrativeSummary: string | null; disclaimers: string | null;
};

export type AccreditedInvestor = {
  id: number; lpName: string; lpType: string; accreditationBasis: string;
  verificationMethod: string; verificationStatus: string; contactEmail: string | null;
  verifiedAt: string | null; verificationExpiresAt: string | null;
};

export type LpCapitalAccount = {
  id: number; lpId: number; lpName: string | null; lpType: string | null;
  commitmentCents: number; calledCents: number; uncalledCents: number;
  distributionsCents: number; currentNavCents: number; ownershipPct: string | null;
  managementFeesPaidCents: number; carriedInterestPaidCents: number;
  vintage: string | null; notes: string | null;
};

export type CapitalCall = {
  id: number; callNumber: number; callDate: string; dueDate: string;
  totalAmountCents: number; fundedAmountCents: number; status: string; purpose: string;
};

export type FormDFiling = {
  id: number; entityName: string; filingType: string; exemption: string;
  offeringAmount: string | null; amountSold: string | null; investorCount: number | null;
  status: string; regDStatus: string; notes: string | null;
};
