import { Router, type IRouter, type RequestHandler } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router: IRouter = Router();

const insLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Insurance API rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const FLAG_RISK: Record<string, number> = {
  "US": 0.90, "GB": 0.92, "NO": 0.88, "DE": 0.91, "JP": 0.89, "FR": 0.90, "NL": 0.91, "DK": 0.91,
  "IT": 0.93, "GR": 0.95, "SG": 0.92, "CN": 1.05, "IN": 1.06, "HK": 1.00, "PA": 1.08,
  "LR": 1.12, "MH": 1.10, "BM": 1.02, "BS": 1.15, "KH": 1.18, "TZ": 1.20,
};

const HAZARD_CLASS: Record<string, { factor: number; description: string }> = {
  "Non-hazardous": { factor: 1.00, description: "Standard general cargo or dry bulk" },
  "Class 1 - Explosives": { factor: 2.50, description: "Extremely hazardous; war risk required" },
  "Class 2 - Gases": { factor: 1.80, description: "Flammable/compressed gases (LNG, LPG)" },
  "Class 3 - Flammable Liquids": { factor: 1.60, description: "Crude oil, petroleum products" },
  "Class 4 - Flammable Solids": { factor: 1.30, description: "Coal, sulphur, iron ore" },
  "Class 5 - Oxidizers": { factor: 1.40, description: "Ammonium nitrate, fertilizers" },
  "Class 6 - Toxic": { factor: 1.70, description: "Chemicals, pesticides" },
  "Class 7 - Radioactive": { factor: 3.00, description: "Restricted; specialist underwriting only" },
  "Class 8 - Corrosive": { factor: 1.45, description: "Acids, caustic soda" },
  "Perishable Goods": { factor: 1.20, description: "Temperature-sensitive commodities" },
};

const ROUTE_CHOKEPOINTS: Record<string, { riskFactor: number; description: string }> = {
  "Strait of Hormuz": { riskFactor: 1.45, description: "Persian Gulf transit; geopolitical risk" },
  "Strait of Malacca": { riskFactor: 1.25, description: "High-traffic corridor; piracy risk" },
  "Bab-el-Mandeb": { riskFactor: 1.55, description: "Red Sea entrance; Houthi threat active" },
  "Suez Canal": { riskFactor: 1.20, description: "Traffic congestion risk; political instability" },
  "Panama Canal": { riskFactor: 1.10, description: "Drought-related draft restrictions" },
  "Danish Straits": { riskFactor: 1.05, description: "Winter ice conditions possible" },
  "Cape of Good Hope": { riskFactor: 1.08, description: "Heavy weather; avoided as Suez alternative" },
  "South China Sea": { riskFactor: 1.35, description: "Territorial disputes; piracy risk" },
  "Gulf of Guinea": { riskFactor: 1.50, description: "High piracy activity area" },
  "Arctic Route": { riskFactor: 1.40, description: "Ice risk; limited SAR coverage" },
};

const COVERAGE_RATES: Record<string, number> = {
  marine_cargo: 0.0012,
  hull_machinery: 0.0045,
  protection_indemnity: 0.0080,
  freight_demurrage: 0.0008,
  war_risk: 0.0025,
  pollution_liability: 0.0060,
};

const BASE_DEDUCTIBLES: Record<string, number> = {
  marine_cargo: 5000, hull_machinery: 75000, protection_indemnity: 25000,
  freight_demurrage: 10000, war_risk: 15000, pollution_liability: 50000,
};

function computeRiskScore(params: {
  vesselAge: number;
  vesselGrossTonnage: number;
  cargoHazardClass: string;
  routeChokepoints: string[];
  flagState: string;
  coverageType: string;
}): { score: number; rating: string; factors: Record<string, any> } {
  const { vesselAge, vesselGrossTonnage, cargoHazardClass, routeChokepoints, flagState, coverageType } = params;

  const ageFactor = vesselAge <= 5 ? 0.90 : vesselAge <= 10 ? 1.00 : vesselAge <= 15 ? 1.10 : vesselAge <= 20 ? 1.25 : 1.45;
  const flagFactor = FLAG_RISK[flagState] ?? 1.15;
  const hazardFactor = HAZARD_CLASS[cargoHazardClass]?.factor ?? 1.00;
  const routeFactors = routeChokepoints.map(cp => ROUTE_CHOKEPOINTS[cp]?.riskFactor ?? 1.00);
  const routeFactor = routeFactors.length > 0 ? Math.max(...routeFactors) : 1.00;
  const tonnageFactor = vesselGrossTonnage > 200000 ? 1.12 : vesselGrossTonnage > 100000 ? 1.06 : vesselGrossTonnage > 50000 ? 1.02 : 1.00;
  const coverageFactor = coverageType === "protection_indemnity" ? 1.15 : coverageType === "war_risk" ? 1.30 : 1.00;

  const composite = ageFactor * flagFactor * hazardFactor * routeFactor * tonnageFactor * coverageFactor;
  const score = Math.round(Math.min(Math.max((composite - 0.75) / 2.5 * 100, 5), 98) * 10) / 10;

  const rating = score < 25 ? "low" : score < 50 ? "moderate" : score < 70 ? "high" : score < 85 ? "very_high" : "uninsurable";

  return {
    score,
    rating,
    factors: {
      ageFactor: { value: ageFactor, description: `Vessel age ${vesselAge} years`, impact: ageFactor > 1.1 ? "High" : ageFactor > 1.0 ? "Medium" : "Low" },
      flagStateFactor: { value: flagFactor, flag: flagState, description: `Flag state risk for ${flagState}`, impact: flagFactor > 1.1 ? "High" : flagFactor > 1.0 ? "Medium" : "Low" },
      cargoHazardFactor: { value: hazardFactor, cargoClass: cargoHazardClass, description: HAZARD_CLASS[cargoHazardClass]?.description ?? "Standard cargo", impact: hazardFactor > 1.4 ? "Critical" : hazardFactor > 1.2 ? "High" : hazardFactor > 1.0 ? "Medium" : "Low" },
      routeFactor: { value: routeFactor, chokepoints: routeChokepoints, description: routeChokepoints.length > 0 ? `Route through ${routeChokepoints.join(", ")}` : "Standard route", impact: routeFactor > 1.3 ? "Critical" : routeFactor > 1.15 ? "High" : routeFactor > 1.05 ? "Medium" : "Low" },
      tonnageFactor: { value: tonnageFactor, grossTonnage: vesselGrossTonnage, impact: tonnageFactor > 1.1 ? "High" : tonnageFactor > 1.0 ? "Medium" : "Low" },
      coverageFactor: { value: coverageFactor, coverageType, impact: coverageFactor > 1.2 ? "High" : coverageFactor > 1.0 ? "Medium" : "Low" },
    },
  };
}

function computePremium(params: {
  coverageLimitUsd: number;
  coverageType: string;
  riskScore: number;
  riskFactors: Record<string, any>;
  coveragePeriodDays: number;
}): { annualRate: number; periodRate: number; annualPremium: number; periodPremium: number; breakdown: any } {
  const { coverageLimitUsd, coverageType, riskScore, coveragePeriodDays } = params;
  const baseRate = COVERAGE_RATES[coverageType] ?? 0.0015;
  const riskMultiplier = 0.5 + (riskScore / 100) * 1.5;
  const annualRate = Math.round(baseRate * riskMultiplier * 10000) / 10000;
  const periodRate = Math.round(annualRate * (coveragePeriodDays / 365) * 100000) / 100000;
  const annualPremium = Math.round(coverageLimitUsd * annualRate * 100) / 100;
  const periodPremium = Math.round(coverageLimitUsd * periodRate * 100) / 100;
  const terrorism = Math.round(periodPremium * 0.03 * 100) / 100;
  const survey = Math.round(periodPremium * 0.02 * 100) / 100;
  const broker = Math.round(periodPremium * 0.10 * 100) / 100;
  return {
    annualRate,
    periodRate,
    annualPremium,
    periodPremium,
    breakdown: {
      basePremium: Math.round((periodPremium - terrorism - survey - broker) * 100) / 100,
      terrorismSupplement: terrorism,
      surveyCost: survey,
      brokerFee: broker,
      totalPremium: periodPremium,
    },
  };
}

let quoteCounter = 100;
let policyCounter = 200;
let claimCounter = 300;

const demoQuotes: any[] = [
  { id: 1, quoteRef: "QT-MAR-0001", vesselMmsi: "636092587", vesselImo: "9654321", vesselName: "PACIFIC GUARDIAN", vesselType: "Tanker", vesselAge: 8, vesselGrossTonnage: 158000, vesselFlag: "LR", cargoType: "Crude Oil", cargoValueUsd: 45000000, cargoHazardClass: "Class 3 - Flammable Liquids", voyageOrigin: "Ras Tanura, Saudi Arabia", voyageDestination: "Rotterdam, Netherlands", routeChokepoints: ["Strait of Hormuz", "Suez Canal"], coverageType: "marine_cargo", coverageLimitUsd: 45000000, deductibleUsd: 500000, coveragePeriodDays: 45, riskRating: "high", riskScore: 68.4, premiumUsd: 89250, annualPremiumUsd: 724500, status: "quote", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 2, quoteRef: "QT-MAR-0002", vesselMmsi: "352456789", vesselImo: "9456789", vesselName: "LIBERTY WAVE", vesselType: "Container", vesselAge: 4, vesselGrossTonnage: 210000, vesselFlag: "PA", cargoType: "General Cargo", cargoValueUsd: 18000000, cargoHazardClass: "Non-hazardous", voyageOrigin: "Shanghai, China", voyageDestination: "Los Angeles, USA", routeChokepoints: ["South China Sea"], coverageType: "hull_machinery", coverageLimitUsd: 180000000, deductibleUsd: 1500000, coveragePeriodDays: 365, riskRating: "moderate", riskScore: 41.2, premiumUsd: 378000, annualPremiumUsd: 378000, status: "bound", createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

const demoPolicies: any[] = [
  { id: 1, quoteId: 2, policyNumber: "POL-MAR-20260214-001", vesselMmsi: "352456789", vesselImo: "9456789", vesselName: "LIBERTY WAVE", coverageType: "hull_machinery", coverageLimitUsd: 180000000, deductibleUsd: 1500000, premiumUsd: 378000, status: "active", effectiveAt: new Date(Date.now() - 86400000 * 5).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 360).toISOString(), carrier: "Lloyd's of London Syndicate 1234", syndicateCode: "SYN-1234-VMI", claimsCount: 0, totalClaimsUsd: 0, boundAt: new Date(Date.now() - 86400000 * 5).toISOString(), createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const demoClaims: any[] = [
  { id: 1, policyId: 1, claimRef: "CLM-MAR-0001", vesselMmsi: "352456789", vesselName: "LIBERTY WAVE", incidentType: "Machinery Breakdown", incidentDescription: "Main engine failure at sea — emergency tow required", incidentAt: new Date(Date.now() - 86400000 * 2).toISOString(), incidentLocation: "North Pacific, 38.5°N 165.2°E", claimedAmountUsd: 2800000, approvedAmountUsd: null, settledAmountUsd: null, deductibleApplied: 1500000, status: "under_review", reserveAmountUsd: 2800000, adjustorNotes: "Initial survey confirms main engine failure. Tow to Yokohama completed. Parts assessment ongoing.", filedAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const sessionQuotes: any[] = [];
const sessionPolicies: any[] = [];
const sessionClaims: any[] = [];

router.get("/vessels/insurance/quotes", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const all = [...demoQuotes, ...sessionQuotes];
    sendSuccess(res, { quotes: all.reverse(), count: all.length, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch quotes"); }
});

router.post("/vessels/insurance/quotes", insLimit, authMiddleware({ required: false }), validateBody(bodyShape({
      "cargoHazardClass": z.unknown().optional(),
      "cargoType": z.unknown().optional(),
      "cargoValueUsd": z.unknown().optional(),
      "coverageLimitUsd": z.unknown().optional(),
      "coveragePeriodDays": z.unknown().optional(),
      "coverageType": z.unknown().optional(),
      "routeChokepoints": z.unknown().optional(),
      "vesselAge": z.unknown().optional(),
      "vesselFlag": z.unknown().optional(),
      "vesselGrossTonnage": z.unknown().optional(),
      "vesselImo": z.unknown().optional(),
      "vesselMmsi": z.unknown().optional(),
      "vesselName": z.unknown().optional(),
      "vesselType": z.unknown().optional(),
      "voyageDestination": z.unknown().optional(),
      "voyageOrigin": z.unknown().optional(),
    })), (req, res) => {
  try {
    const {
      vesselMmsi, vesselImo, vesselName, vesselType, vesselAge, vesselGrossTonnage, vesselFlag,
      cargoType, cargoValueUsd, cargoHazardClass, voyageOrigin, voyageDestination, routeChokepoints,
      coverageType, coverageLimitUsd, coveragePeriodDays,
    } = req.body;

    if (!vesselName || !coverageType || !coverageLimitUsd) {
      res.status(400).json({ error: "vesselName, coverageType, and coverageLimitUsd are required" });
      return;
    }

    const age = parseInt(vesselAge ?? "10");
    const grt = parseFloat(vesselGrossTonnage ?? "50000");
    const chokepoints = Array.isArray(routeChokepoints) ? routeChokepoints : [];
    const limit = parseFloat(coverageLimitUsd);
    const periodDays = parseInt(coveragePeriodDays ?? "30");
    const flag = vesselFlag ?? "PA";
    const hazard = cargoHazardClass ?? "Non-hazardous";
    const ct = coverageType ?? "marine_cargo";

    const riskResult = computeRiskScore({ vesselAge: age, vesselGrossTonnage: grt, cargoHazardClass: hazard, routeChokepoints: chokepoints, flagState: flag, coverageType: ct });
    const premiumResult = computePremium({ coverageLimitUsd: limit, coverageType: ct, riskScore: riskResult.score, riskFactors: riskResult.factors, coveragePeriodDays: periodDays });
    const deductible = BASE_DEDUCTIBLES[ct] ?? 5000;
    const quoteRef = `QT-MAR-${String(++quoteCounter).padStart(4, "0")}`;

    const quote = {
      id: quoteCounter,
      quoteRef,
      vesselMmsi: vesselMmsi ?? null,
      vesselImo: vesselImo ?? null,
      vesselName,
      vesselType: vesselType ?? "Unknown",
      vesselAge: age,
      vesselGrossTonnage: grt,
      vesselFlag: flag,
      cargoType: cargoType ?? null,
      cargoValueUsd: cargoValueUsd ? parseFloat(cargoValueUsd) : null,
      cargoHazardClass: hazard,
      voyageOrigin: voyageOrigin ?? null,
      voyageDestination: voyageDestination ?? null,
      routeChokepoints: chokepoints,
      coverageType: ct,
      coverageLimitUsd: limit,
      deductibleUsd: deductible,
      coveragePeriodDays: periodDays,
      riskRating: riskResult.rating,
      riskScore: riskResult.score,
      riskFactors: riskResult.factors,
      baseRatePercent: COVERAGE_RATES[ct],
      finalRatePercent: premiumResult.periodRate,
      annualPremiumUsd: premiumResult.annualPremium,
      premiumUsd: premiumResult.periodPremium,
      premiumBreakdown: premiumResult.breakdown,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "quote",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessionQuotes.push(quote);
    sendSuccess(res, { quote, riskAnalysis: riskResult, premium: premiumResult });
  } catch (err) { handleRouteError(res, err, "Failed to generate quote"); }
});

router.post("/vessels/insurance/quotes/:id/bind", insLimit, authMiddleware({ required: false }), validateBody(bodyShape({})), (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const allQuotes = [...demoQuotes, ...sessionQuotes];
    const quote = allQuotes.find(q => q.id === id);
    if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
    if (quote.status === "bound") { res.status(400).json({ error: "Quote already bound" }); return; }
    if (quote.riskRating === "uninsurable") { res.status(400).json({ error: "This risk is uninsurable; cannot bind" }); return; }

    const policyNumber = `POL-MAR-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(++policyCounter).padStart(3, "0")}`;
    const policy: any = {
      id: policyCounter,
      quoteId: id,
      policyNumber,
      vesselMmsi: quote.vesselMmsi,
      vesselImo: quote.vesselImo,
      vesselName: quote.vesselName,
      coverageType: quote.coverageType,
      coverageLimitUsd: quote.coverageLimitUsd,
      deductibleUsd: quote.deductibleUsd,
      premiumUsd: quote.premiumUsd,
      status: "active",
      effectiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + quote.coveragePeriodDays * 86400000).toISOString(),
      carrier: "Lloyd's of London Syndicate 4711",
      syndicateCode: `SYN-4711-MAR`,
      claimsCount: 0,
      totalClaimsUsd: 0,
      boundAt: new Date().toISOString(),
      policyTerms: { coverageType: quote.coverageType, institute: "Institute Cargo Clauses (A)", law: "English Law and Jurisdiction" },
      exclusions: ["Nuclear Risk", "War & Strikes (separate cover available)", "Wilful Misconduct"],
      createdAt: new Date().toISOString(),
    };

    quote.status = "bound";
    sessionPolicies.push(policy);
    sendSuccess(res, { policy, message: `Policy ${policyNumber} bound successfully` });
  } catch (err) { handleRouteError(res, err, "Failed to bind policy"); }
});

router.get("/vessels/insurance/policies", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const all = [...demoPolicies, ...sessionPolicies];
    sendSuccess(res, { policies: all.reverse(), count: all.length, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch policies"); }
});

router.get("/vessels/insurance/policies/:id", insLimit, authMiddleware({ required: false }), (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const all = [...demoPolicies, ...sessionPolicies];
    const policy = all.find(p => p.id === id);
    if (!policy) { res.status(404).json({ error: "Policy not found" }); return; }
    const pClaims = [...demoClaims, ...sessionClaims].filter(c => c.policyId === id);
    sendSuccess(res, { policy, claims: pClaims, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch policy"); }
});

router.get("/vessels/insurance/claims", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const all = [...demoClaims, ...sessionClaims];
    sendSuccess(res, { claims: all.reverse(), count: all.length, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch claims"); }
});

router.post("/vessels/insurance/claims", insLimit, authMiddleware({ required: false }), validateBody(bodyShape({
      "claimedAmountUsd": z.unknown().optional(),
      "incidentAt": z.unknown().optional(),
      "incidentDescription": z.unknown().optional(),
      "incidentLocation": z.unknown().optional(),
      "incidentType": z.unknown().optional(),
      "linkedExceptionId": z.unknown().optional(),
      "policyId": z.unknown().optional(),
      "vesselMmsi": z.unknown().optional(),
      "vesselName": z.unknown().optional(),
    })), (req, res) => {
  try {
    const { policyId, vesselMmsi, vesselName, incidentType, incidentDescription, incidentAt, incidentLocation, claimedAmountUsd, linkedExceptionId } = req.body;
    if (!policyId || !incidentType || !claimedAmountUsd) {
      res.status(400).json({ error: "policyId, incidentType, and claimedAmountUsd are required" });
      return;
    }
    const allPolicies = [...demoPolicies, ...sessionPolicies];
    const policy = allPolicies.find(p => p.id === parseInt(policyId));
    if (!policy) { res.status(404).json({ error: "Policy not found" }); return; }
    const claimed = parseFloat(claimedAmountUsd);
    const reserve = Math.round(Math.min(claimed, parseFloat(policy.coverageLimitUsd ?? "1000000")) * 100) / 100;
    const claimRef = `CLM-MAR-${String(++claimCounter).padStart(4, "0")}`;
    const claim = {
      id: claimCounter,
      policyId: parseInt(policyId),
      claimRef,
      vesselMmsi: vesselMmsi ?? policy.vesselMmsi ?? null,
      vesselName: vesselName ?? policy.vesselName,
      incidentType,
      incidentDescription: incidentDescription ?? null,
      incidentAt: incidentAt ?? new Date().toISOString(),
      incidentLocation: incidentLocation ?? null,
      claimedAmountUsd: claimed,
      approvedAmountUsd: null,
      settledAmountUsd: null,
      deductibleApplied: parseFloat(policy.deductibleUsd ?? "0"),
      status: "filed",
      linkedExceptionId: linkedExceptionId ?? null,
      reserveAmountUsd: reserve,
      filedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    sessionClaims.push(claim);
    policy.claimsCount = (policy.claimsCount ?? 0) + 1;
    sendSuccess(res, { claim, message: `Claim ${claimRef} filed successfully. Reserve set at $${reserve.toLocaleString()}` });
  } catch (err) { handleRouteError(res, err, "Failed to file claim"); }
});

router.put("/vessels/insurance/claims/:id/status", insLimit, authMiddleware({ required: false }), validateBody(bodyShape({
      "adjustorNotes": z.unknown().optional(),
      "approvedAmountUsd": z.unknown().optional(),
      "settledAmountUsd": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, adjustorNotes, approvedAmountUsd, settledAmountUsd } = req.body;
    const allClaims = [...demoClaims, ...sessionClaims];
    const claim = allClaims.find(c => c.id === id);
    if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }
    Object.assign(claim, {
      status: status ?? claim.status,
      adjustorNotes: adjustorNotes ?? claim.adjustorNotes,
      approvedAmountUsd: approvedAmountUsd ? parseFloat(approvedAmountUsd) : claim.approvedAmountUsd,
      settledAmountUsd: settledAmountUsd ? parseFloat(settledAmountUsd) : claim.settledAmountUsd,
      settledAt: status === "settled" ? new Date().toISOString() : claim.settledAt,
      closedAt: status === "closed" ? new Date().toISOString() : claim.closedAt,
    });
    sendSuccess(res, { claim, message: `Claim status updated to ${status}` });
  } catch (err) { handleRouteError(res, err, "Failed to update claim status"); }
});

router.get("/vessels/insurance/risk-score", insLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { vesselAge, vesselGrossTonnage, cargoHazardClass, routeChokepoints, flagState, coverageType } = req.query;
    const chokepoints = routeChokepoints ? (Array.isArray(routeChokepoints) ? routeChokepoints : [routeChokepoints]) as string[] : [];
    const result = computeRiskScore({
      vesselAge: parseInt(vesselAge as string ?? "10"),
      vesselGrossTonnage: parseFloat(vesselGrossTonnage as string ?? "50000"),
      cargoHazardClass: cargoHazardClass as string ?? "Non-hazardous",
      routeChokepoints: chokepoints,
      flagState: flagState as string ?? "PA",
      coverageType: coverageType as string ?? "marine_cargo",
    });
    sendSuccess(res, { ...result, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to compute risk score"); }
});

router.get("/vessels/insurance/reference/chokepoints", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const chokepoints = Object.entries(ROUTE_CHOKEPOINTS).map(([name, data]) => ({ name, ...data }));
    sendSuccess(res, { chokepoints, count: chokepoints.length });
  } catch (err) { handleRouteError(res, err, "Failed to fetch chokepoints"); }
});

router.get("/vessels/insurance/reference/hazard-classes", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const classes = Object.entries(HAZARD_CLASS).map(([name, data]) => ({ name, ...data }));
    sendSuccess(res, { hazardClasses: classes, count: classes.length });
  } catch (err) { handleRouteError(res, err, "Failed to fetch hazard classes"); }
});

router.get("/vessels/insurance/portfolio-summary", insLimit, authMiddleware({ required: false }), (_req, res) => {
  try {
    const allPolicies = [...demoPolicies, ...sessionPolicies];
    const allClaims = [...demoClaims, ...sessionClaims];
    const allQuotes = [...demoQuotes, ...sessionQuotes];
    const activePolicies = allPolicies.filter(p => p.status === "active");
    const totalPremium = activePolicies.reduce((s, p) => s + parseFloat(p.premiumUsd ?? "0"), 0);
    const totalExposure = activePolicies.reduce((s, p) => s + parseFloat(p.coverageLimitUsd ?? "0"), 0);
    const openClaims = allClaims.filter(c => !["settled", "closed", "rejected"].includes(c.status));
    const totalReserve = openClaims.reduce((s, c) => s + parseFloat(c.reserveAmountUsd ?? "0"), 0);
    const settledClaims = allClaims.filter(c => c.status === "settled");
    const totalPaid = settledClaims.reduce((s, c) => s + parseFloat(c.settledAmountUsd ?? "0"), 0);
    const lossRatio = totalPremium > 0 ? Math.round((totalPaid / totalPremium) * 1000) / 10 : 0;
    sendSuccess(res, {
      activePolicies: activePolicies.length,
      totalPolicies: allPolicies.length,
      pendingQuotes: allQuotes.filter(q => q.status === "quote").length,
      totalGrossWrittenPremium: Math.round(totalPremium * 100) / 100,
      totalExposure: Math.round(totalExposure * 100) / 100,
      openClaims: openClaims.length,
      totalClaims: allClaims.length,
      totalReserves: Math.round(totalReserve * 100) / 100,
      totalPaidClaims: Math.round(totalPaid * 100) / 100,
      lossRatioPercent: lossRatio,
      combinedRatio: lossRatio + 28.5,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch portfolio summary"); }
});

export default router;
