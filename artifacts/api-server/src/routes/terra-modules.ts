import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import {
  terraLeasesTable,
  terraProFormaProjectsTable,
  terraExchanges1031Table,
  terraTaxAppealsTable,
  terraWaterfallStructuresTable,
  terraConstructionProjectsTable,
  terraTenantApplicationsTable,
} from "@szl-holdings/db";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { sendSuccess, sendBadRequest, handleRouteError, sendUnauthorized } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import multer from "multer";
import mammoth from "mammoth";

const router: IRouter = Router();

const authRead = authMiddleware({ required: true });
const authWrite = authMiddleware({ required: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt", ".doc"];
    const ext = "." + (file.originalname.split(".").pop() ?? "").toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ---------------------------------------------------------------------------
// Tenant Screening Provider Abstraction
// ---------------------------------------------------------------------------

interface ScreeningProviderResult {
  providerName: string;
  providerStatus: "live" | "sandbox" | "unavailable";
  creditScore?: number;
  creditHistory: string;
  bankruptcies: number;
  judgments: number;
  incomeVerified: boolean;
  backgroundClear: boolean;
  evictionRecords: number;
  radarScores: {
    income: number;
    credit: number;
    rental: number;
    overall: number;
  };
  flags: Array<{ severity: string; field: string; note: string }>;
  rawResponse?: Record<string, unknown>;
}

interface ScreeningProviderInput {
  name: string;
  annualIncome?: number;
  creditScore?: number;
  targetRent?: number;
}

interface ScreeningProvider {
  name: string;
  isAvailable(): boolean;
  screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult>;
}

class MockScreeningProvider implements ScreeningProvider {
  name = "SZL Internal Screening (Sandbox)";

  isAvailable() {
    return true;
  }

  async screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult> {
    const seed = input.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = (min: number, max: number, offset = 0) =>
      min + ((seed + offset) % (max - min + 1));

    const creditScore = input.creditScore ?? rng(580, 820, 1);
    const annualIncome = input.annualIncome ?? rng(45_000, 180_000, 2) * 1000;
    const rentToIncome = input.targetRent ? (input.targetRent * 12) / annualIncome : rng(25, 45, 3) / 100;
    const bankruptcies = creditScore < 600 && rng(0, 3, 4) > 2 ? 1 : 0;
    const judgments = creditScore < 650 && rng(0, 5, 5) > 3 ? 1 : 0;
    const evictions = creditScore < 620 && rng(0, 5, 6) > 3 ? 1 : 0;
    const backgroundClear = creditScore > 640 && evictions === 0;

    const incomeScore = Math.min(100, Math.round((annualIncome / (input.targetRent ? input.targetRent * 12 * 3.5 : 80_000)) * 100));
    const creditRatingScore = Math.round(((creditScore - 300) / 550) * 100);
    const rentalScore = evictions === 0 ? (backgroundClear ? 85 + rng(0, 15, 7) : 65) : 40;
    const overall = Math.round((incomeScore * 0.35 + creditRatingScore * 0.4 + rentalScore * 0.25));

    const flags: Array<{ severity: string; field: string; note: string }> = [];
    if (creditScore < 620) flags.push({ severity: "error", field: "Credit Score", note: `Credit score ${creditScore} is below minimum threshold of 620` });
    if (rentToIncome > 0.4) flags.push({ severity: "warning", field: "Rent-to-Income", note: `Rent-to-income ratio ${(rentToIncome * 100).toFixed(0)}% exceeds recommended 40%` });
    if (bankruptcies > 0) flags.push({ severity: "error", field: "Bankruptcy", note: "Bankruptcy filing detected in screening history" });
    if (judgments > 0) flags.push({ severity: "warning", field: "Judgments", note: `${judgments} civil judgment(s) found in public records` });
    if (evictions > 0) flags.push({ severity: "error", field: "Eviction Record", note: "Prior eviction proceeding found — lease denied under standard policy" });

    const historyDescriptors = creditScore >= 750
      ? "Excellent — clean payment history, zero delinquencies"
      : creditScore >= 700
      ? "Good — 2-3 late payments in prior 24 months, no collections"
      : creditScore >= 650
      ? "Fair — occasional late payments, 1 collection account"
      : "Poor — multiple delinquencies, collection activity present";

    return {
      providerName: this.name,
      providerStatus: "sandbox",
      creditScore,
      creditHistory: historyDescriptors,
      bankruptcies,
      judgments,
      evictionRecords: evictions,
      incomeVerified: rentToIncome < 0.4 && annualIncome > 45_000,
      backgroundClear,
      radarScores: {
        income: Math.min(100, incomeScore),
        credit: Math.min(100, creditRatingScore),
        rental: Math.min(100, rentalScore),
        overall: Math.min(100, overall),
      },
      flags,
    };
  }
}

class EquifaxScreeningProvider implements ScreeningProvider {
  name = "Equifax DecisionPoint";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable() {
    return this.apiKey.length > 10;
  }

  async screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult> {
    const url = "https://api.equifax.com/business/creditrisk/v2/reports";
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ applicantName: input.name, product: "consumer-credit-report", consent: true }),
    });
    if (!resp.ok) throw new Error(`Equifax API error ${resp.status}`);
    const raw = await resp.json() as Record<string, unknown>;
    const credit = (raw.creditScore as Record<string, unknown>) ?? {};
    const creditScore = (credit.score as number) ?? 0;
    return {
      providerName: this.name,
      providerStatus: "live",
      creditScore,
      creditHistory: (credit.summary as string) ?? "See raw response",
      bankruptcies: (raw.publicRecords as number) ?? 0,
      judgments: (raw.judgments as number) ?? 0,
      evictionRecords: 0,
      incomeVerified: false,
      backgroundClear: true,
      radarScores: { income: 0, credit: Math.round(((creditScore - 300) / 550) * 100), rental: 0, overall: 0 },
      flags: [],
      rawResponse: raw,
    };
  }
}

function getScreeningProvider(): ScreeningProvider {
  const equifaxKey = process.env.EQUIFAX_API_KEY ?? "";
  if (equifaxKey.length > 10) return new EquifaxScreeningProvider(equifaxKey);
  return new MockScreeningProvider();
}

// ---------------------------------------------------------------------------
// Lease extraction from uploaded documents
// ---------------------------------------------------------------------------

function extractLeaseFromText(text: string, filename: string): {
  tenant: string;
  commencementDate: string;
  expirationDate: string;
  baseRent: number;
  rentPerSqft: number;
  sqft: number;
  leaseType: string;
  premises: string;
  propertyAddress: string;
  escalations: string;
  cam: number;
  tiAllowance: number;
  securityDeposit: number;
  terminationOption: string;
  exclusiveUse: string;
  options: string[];
  confidence: number;
} {
  const upper = text.toUpperCase();
  let confidence = 50;
  const fields: string[] = [];

  const tenantMatch = text.match(/TENANT[:\s]+([A-Z][A-Za-z\s,\.]+(?:LLC|Inc\.|Corp\.|LP|LLP|Co\.)?)/i)
    ?? text.match(/LESSEE[:\s]+([A-Z][A-Za-z\s,\.]+(?:LLC|Inc\.|Corp\.|LP|LLP|Co\.)?)/i);
  const tenant = tenantMatch?.[1]?.trim() ?? "Unknown Tenant";
  if (tenantMatch) { confidence += 10; fields.push("tenant"); }

  const sqftMatch = text.match(/([\d,]+)\s*(?:square feet|sq\.?\s*ft\.?|SF)/i);
  const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ""), 10) : 0;
  if (sqftMatch) { confidence += 8; fields.push("sqft"); }

  const rentPatterns = [
    /base rent[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*(?:per month)?/i,
    /monthly rent[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
    /rent[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*per month/i,
  ];
  let baseRent = 0;
  for (const p of rentPatterns) {
    const m = text.match(p);
    if (m) { baseRent = parseFloat(m[1].replace(/,/g, "")); confidence += 10; fields.push("baseRent"); break; }
  }

  const rentPerSqft = sqft > 0 && baseRent > 0 ? parseFloat((baseRent / sqft).toFixed(2)) : 0;

  const commenceDateMatch = text.match(/(?:commencement|commence|start)\s*date[:\s]+(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const commencementDate = commenceDateMatch ? new Date(commenceDateMatch[1]).toISOString().slice(0, 10) : "";
  if (commenceDateMatch && !isNaN(new Date(commenceDateMatch[1]).getTime())) { confidence += 8; fields.push("commencementDate"); }

  const expireDateMatch = text.match(/(?:expir(?:ation|y)|termination|end)\s*date[:\s]+(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const expirationDate = expireDateMatch ? new Date(expireDateMatch[1]).toISOString().slice(0, 10) : "";
  if (expireDateMatch && !isNaN(new Date(expireDateMatch[1]).getTime())) { confidence += 8; fields.push("expirationDate"); }

  const leaseTypeMatch = text.match(/\b(NNN|Triple Net|Modified Gross|Full Service Gross|Gross Lease|Net Lease)\b/i);
  const leaseType = leaseTypeMatch?.[1] ?? "";
  if (leaseTypeMatch) { confidence += 5; fields.push("leaseType"); }

  const premisesMatch = text.match(/(?:premises|suite|space)[:\s]+([A-Za-z0-9\s,\-]+(?:Suite|Floor|Ste\.?)[\w\s,]+)/i);
  const premises = premisesMatch?.[1]?.trim().slice(0, 100) ?? "";
  if (premisesMatch) { confidence += 5; fields.push("premises"); }

  const addrMatch = text.match(/(\d+\s+[A-Za-z\s]+(?:Street|St\.|Avenue|Ave\.|Boulevard|Blvd\.|Drive|Dr\.|Lane|Ln\.|Road|Rd\.|Way)[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5})/i);
  const propertyAddress = addrMatch?.[1]?.trim() ?? "";
  if (addrMatch) { confidence += 7; fields.push("address"); }

  const escalationMatch = text.match(/(?:escalation|rent increase)[:\s]+([^.;]{10,80})/i);
  const escalations = escalationMatch?.[1]?.trim() ?? "";
  if (escalationMatch) { confidence += 5; fields.push("escalations"); }

  const camMatch = text.match(/(?:CAM|common area maintenance)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  const cam = camMatch ? parseFloat(camMatch[1].replace(/,/g, "")) : 0;
  if (camMatch) { confidence += 4; fields.push("cam"); }

  const tiMatch = text.match(/(?:tenant improvement|TI)\s*allowance[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  const tiAllowance = tiMatch ? parseFloat(tiMatch[1].replace(/,/g, "")) : 0;
  if (tiMatch) { confidence += 5; fields.push("tiAllowance"); }

  const depositMatch = text.match(/security deposit[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  const securityDeposit = depositMatch ? parseFloat(depositMatch[1].replace(/,/g, "")) : 0;
  if (depositMatch) { confidence += 4; fields.push("securityDeposit"); }

  const termMatch = text.match(/(?:early termination|termination option)[:\s]+([^.;]{10,100})/i);
  const terminationOption = termMatch?.[1]?.trim() ?? "No early termination clause";

  const exclusiveMatch = text.match(/exclusive use[:\s]+([^.;]{5,80})/i);
  const exclusiveUse = exclusiveMatch?.[1]?.trim() ?? "No exclusive use clause";

  const options: string[] = [];
  const optionMatch = text.match(/(?:renewal option|option to renew)[:\s]+([^.;]{10,120})/ig);
  if (optionMatch) options.push(...optionMatch.map(m => m.replace(/^[^:]+:\s*/i, "").trim().slice(0, 100)));
  if (options.length > 0) { confidence += 5; fields.push("renewalOptions"); }

  return {
    tenant, commencementDate, expirationDate, baseRent, rentPerSqft, sqft,
    leaseType, premises, propertyAddress, escalations, cam, tiAllowance,
    securityDeposit, terminationOption, exclusiveUse, options,
    confidence: Math.min(97, Math.max(40, confidence)),
  };
}

// ---------------------------------------------------------------------------
// Lease rowTo mapper
// ---------------------------------------------------------------------------

function rowToLease(r: typeof terraLeasesTable.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    documentName: r.documentName,
    tenant: r.tenant,
    premises: r.premises ?? "",
    propertyAddress: r.propertyAddress ?? "",
    leaseType: r.leaseType ?? "",
    commencementDate: r.commencementDate ?? "",
    expirationDate: r.expirationDate ?? "",
    baseRent: Number(r.baseRent ?? 0),
    rentPerSqft: Number(r.rentPerSqft ?? 0),
    sqft: r.sqft ?? 0,
    escalations: r.escalations ?? "",
    options: (r.options as string[]) ?? [],
    cam: Number(r.cam ?? 0),
    tiAllowance: Number(r.tiAllowance ?? 0),
    securityDeposit: Number(r.securityDeposit ?? 0),
    terminationOption: r.terminationOption ?? "",
    exclusiveUse: r.exclusiveUse ?? "",
    coTenancy: r.coTenancy ?? "",
    extractedAt: r.createdAt.toISOString(),
    confidence: r.confidence,
    flags: (r.flags as Array<{ field: string; issue: string; severity: string }>) ?? [],
    isDemo: r.isDemo,
  };
}

router.get("/terra/leases", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db.select().from(terraLeasesTable)
      .where(userId != null ? or(eq(terraLeasesTable.ownerUserId, userId), isNull(terraLeasesTable.ownerUserId)) : isNull(terraLeasesTable.ownerUserId))
      .orderBy(desc(terraLeasesTable.createdAt));
    sendSuccess(res, { count: rows.length, leases: rows.map(rowToLease), dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch leases"); }
});

const LeaseCreateSchema = z.object({
  documentName: z.string().min(1),
  tenant: z.string().min(1),
  premises: z.string().optional(),
  propertyAddress: z.string().optional(),
  leaseType: z.string().optional(),
  commencementDate: z.string().optional(),
  expirationDate: z.string().optional(),
  baseRent: z.number().optional(),
  rentPerSqft: z.number().optional(),
  sqft: z.number().optional(),
  escalations: z.string().optional(),
  options: z.array(z.string()).optional(),
  cam: z.number().optional(),
  tiAllowance: z.number().optional(),
  securityDeposit: z.number().optional(),
  terminationOption: z.string().optional(),
  exclusiveUse: z.string().optional(),
  coTenancy: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  flags: z.array(z.object({ field: z.string(), issue: z.string(), severity: z.string() })).optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/leases", authWrite, async (req: Request, res: Response) => {
  try {
    const body = LeaseCreateSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraLeasesTable).values({
      externalId: randomUUID(),
      documentName: d.documentName,
      tenant: d.tenant,
      premises: d.premises,
      propertyAddress: d.propertyAddress,
      leaseType: d.leaseType,
      commencementDate: d.commencementDate,
      expirationDate: d.expirationDate,
      baseRent: d.baseRent != null ? String(d.baseRent) : undefined,
      rentPerSqft: d.rentPerSqft != null ? String(d.rentPerSqft) : undefined,
      sqft: d.sqft,
      escalations: d.escalations,
      options: d.options ?? [],
      cam: d.cam != null ? String(d.cam) : undefined,
      tiAllowance: d.tiAllowance != null ? String(d.tiAllowance) : undefined,
      securityDeposit: d.securityDeposit != null ? String(d.securityDeposit) : undefined,
      terminationOption: d.terminationOption,
      exclusiveUse: d.exclusiveUse,
      coTenancy: d.coTenancy,
      confidence: d.confidence ?? 85,
      flags: d.flags ?? [],
      ownerUserId: req.user?.id ?? null,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { lease: rowToLease(row) });
  } catch (err) { handleRouteError(res, err, "Failed to create lease"); }
});

router.post("/terra/leases/upload", authWrite, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return sendBadRequest(res, "No file uploaded. Use multipart/form-data with field name 'file'.");
    const { originalname, buffer, mimetype, size } = req.file;
    const ext = originalname.split(".").pop()?.toLowerCase() ?? "";

    let extractedText = "";
    let extractionMethod = "none";

    if (ext === "txt") {
      extractedText = buffer.toString("utf-8");
      extractionMethod = "text";
    } else if (ext === "docx" || ext === "doc") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        extractionMethod = "mammoth-docx";
      } catch {
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
        extractionMethod = "raw-ascii-fallback";
      }
    } else if (ext === "pdf") {
      try {
        const pdfParse = await import("pdf-parse").catch(() => null);
        if (pdfParse) {
          const parsed = await pdfParse.default(buffer);
          extractedText = parsed.text;
          extractionMethod = "pdf-parse";
        }
      } catch {
        extractionMethod = "pdf-failed";
      }
      if (!extractedText) {
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
        extractionMethod = "raw-ascii-fallback";
      }
    }

    const extracted = extractLeaseFromText(extractedText, originalname);
    const missingFields: string[] = [];
    if (!extracted.tenant || extracted.tenant === "Unknown Tenant") missingFields.push("tenant");
    if (!extracted.commencementDate) missingFields.push("commencement date");
    if (!extracted.expirationDate) missingFields.push("expiration date");
    if (!extracted.baseRent) missingFields.push("base rent");

    const flags: Array<{ field: string; issue: string; severity: string }> = [];
    for (const f of missingFields) {
      flags.push({ field: f, issue: `Could not extract ${f} from document — manual entry required`, severity: "warning" });
    }
    if (extracted.confidence < 70) {
      flags.push({ field: "Document Quality", issue: "Low extraction confidence — document may be scanned or poorly formatted", severity: "warning" });
    }

    const [row] = await db.insert(terraLeasesTable).values({
      externalId: randomUUID(),
      documentName: originalname,
      tenant: extracted.tenant,
      premises: extracted.premises || undefined,
      propertyAddress: extracted.propertyAddress || undefined,
      leaseType: extracted.leaseType || undefined,
      commencementDate: extracted.commencementDate || undefined,
      expirationDate: extracted.expirationDate || undefined,
      baseRent: extracted.baseRent > 0 ? String(extracted.baseRent) : undefined,
      rentPerSqft: extracted.rentPerSqft > 0 ? String(extracted.rentPerSqft) : undefined,
      sqft: extracted.sqft > 0 ? extracted.sqft : undefined,
      escalations: extracted.escalations || undefined,
      options: extracted.options,
      cam: extracted.cam > 0 ? String(extracted.cam) : undefined,
      tiAllowance: extracted.tiAllowance > 0 ? String(extracted.tiAllowance) : undefined,
      securityDeposit: extracted.securityDeposit > 0 ? String(extracted.securityDeposit) : undefined,
      terminationOption: extracted.terminationOption,
      exclusiveUse: extracted.exclusiveUse,
      confidence: extracted.confidence,
      flags,
      rawData: {
        extractionMethod,
        fileSize: size,
        mimeType: mimetype,
        textLength: extractedText.length,
        missingFields,
      },
      ownerUserId: req.user?.id ?? null,
      isDemo: false,
    }).returning();

    sendSuccess(res, {
      lease: rowToLease(row),
      extraction: { method: extractionMethod, confidence: extracted.confidence, missingFields },
    });
  } catch (err) { handleRouteError(res, err, "Failed to process lease upload"); }
});

router.put("/terra/leases/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = LeaseCreateSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.tenant) update.tenant = d.tenant;
    if (d.baseRent != null) update.baseRent = String(d.baseRent);
    if (d.expirationDate) update.expirationDate = d.expirationDate;
    if (d.flags) update.flags = d.flags;
    if (d.confidence != null) update.confidence = d.confidence;
    const leaseUserId = req.user?.id;
    const leaseWhere = leaseUserId != null
      ? and(eq(terraLeasesTable.externalId, req.params.id), or(eq(terraLeasesTable.ownerUserId, leaseUserId), isNull(terraLeasesTable.ownerUserId)))
      : eq(terraLeasesTable.externalId, req.params.id);
    const [leaseUpdated] = await db.update(terraLeasesTable).set(update).where(leaseWhere).returning({ id: terraLeasesTable.id });
    if (!leaseUpdated) return sendUnauthorized(res, "You do not have permission to update this record");
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update lease"); }
});

router.delete("/terra/leases/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const leaseUserId = req.user?.id;
    const leaseWhere = leaseUserId != null
      ? and(eq(terraLeasesTable.externalId, req.params.id), or(eq(terraLeasesTable.ownerUserId, leaseUserId), isNull(terraLeasesTable.ownerUserId)))
      : eq(terraLeasesTable.externalId, req.params.id);
    const [leaseDeleted] = await db.delete(terraLeasesTable).where(leaseWhere).returning({ id: terraLeasesTable.id });
    if (!leaseDeleted) return sendUnauthorized(res, "You do not have permission to delete this record");
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete lease"); }
});

// ---------------------------------------------------------------------------
// Pro Forma Projects
// ---------------------------------------------------------------------------

router.get("/terra/pro-forma-projects", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const baseQuery = db.select().from(terraProFormaProjectsTable);
    const rows = await (userId
      ? baseQuery.where(eq(terraProFormaProjectsTable.ownerUserId, userId))
      : baseQuery
    ).orderBy(desc(terraProFormaProjectsTable.updatedAt));
    const projects = rows.map(r => ({
      id: r.externalId ?? String(r.id),
      projectName: r.projectName,
      propertyType: r.propertyType ?? "",
      inputs: r.inputs as Record<string, unknown>,
      results: r.results as Record<string, unknown> | null,
      updatedAt: r.updatedAt.toISOString(),
      isDemo: r.isDemo,
    }));
    sendSuccess(res, { count: rows.length, projects, dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch pro forma projects"); }
});

const ProFormaProjectSchema = z.object({
  projectName: z.string().min(1),
  propertyType: z.string().optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  ownerName: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/pro-forma-projects", authWrite, async (req: Request, res: Response) => {
  try {
    const body = ProFormaProjectSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraProFormaProjectsTable).values({
      externalId: randomUUID(),
      projectName: d.projectName,
      propertyType: d.propertyType,
      inputs: d.inputs,
      results: d.results,
      ownerName: d.ownerName ?? req.user?.displayName,
      ownerUserId: req.user?.id,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { project: { id: row.externalId ?? String(row.id), projectName: row.projectName, inputs: row.inputs, results: row.results, updatedAt: row.updatedAt.toISOString() } });
  } catch (err) { handleRouteError(res, err, "Failed to save pro forma project"); }
});

router.put("/terra/pro-forma-projects/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = ProFormaProjectSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.projectName) update.projectName = d.projectName;
    if (d.inputs) update.inputs = d.inputs;
    if (d.results) update.results = d.results;
    const conditions = [eq(terraProFormaProjectsTable.externalId, req.params.id)];
    if (req.user?.id) conditions.push(eq(terraProFormaProjectsTable.ownerUserId, req.user.id));
    await db.update(terraProFormaProjectsTable).set(update).where(and(...conditions));
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update pro forma project"); }
});

router.delete("/terra/pro-forma-projects/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const conditions = [eq(terraProFormaProjectsTable.externalId, req.params.id)];
    if (req.user?.id) conditions.push(eq(terraProFormaProjectsTable.ownerUserId, req.user.id));
    await db.delete(terraProFormaProjectsTable).where(and(...conditions));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete pro forma project"); }
});

// ---------------------------------------------------------------------------
// 1031 Exchanges
// ---------------------------------------------------------------------------

function rowToExchange(r: typeof terraExchanges1031Table.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    relinquishedProperty: r.relinquishedProperty,
    relinquishedAddress: r.relinquishedAddress ?? "",
    saleDate: r.saleDate ?? "",
    salePrice: Number(r.salePrice ?? 0),
    adjustedBasis: Number(r.adjustedBasis ?? 0),
    deferredGain: Number(r.deferredGain ?? 0),
    qi: r.qi ?? "",
    qiContact: r.qiContact ?? "",
    status: r.status,
    identificationDeadline: r.identificationDeadline ?? "",
    exchangeDeadline: r.exchangeDeadline ?? "",
    identifiedProperties: (r.identifiedProperties as Array<Record<string, unknown>>) ?? [],
    complianceItems: (r.complianceItems as Array<Record<string, unknown>>) ?? [],
    taxSavings: Number(r.taxSavings ?? 0),
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/terra/exchanges-1031", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db.select().from(terraExchanges1031Table)
      .where(userId != null ? or(eq(terraExchanges1031Table.ownerUserId, userId), isNull(terraExchanges1031Table.ownerUserId)) : isNull(terraExchanges1031Table.ownerUserId))
      .orderBy(desc(terraExchanges1031Table.createdAt));
    sendSuccess(res, { count: rows.length, exchanges: rows.map(rowToExchange), dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch 1031 exchanges"); }
});

const Exchange1031Schema = z.object({
  relinquishedProperty: z.string().min(1),
  relinquishedAddress: z.string().optional(),
  saleDate: z.string().optional(),
  salePrice: z.number().optional(),
  adjustedBasis: z.number().optional(),
  deferredGain: z.number().optional(),
  qi: z.string().optional(),
  qiContact: z.string().optional(),
  status: z.enum(["identification", "exchange", "completed", "failed"]).optional(),
  identificationDeadline: z.string().optional(),
  exchangeDeadline: z.string().optional(),
  identifiedProperties: z.array(z.record(z.unknown())).optional(),
  complianceItems: z.array(z.record(z.unknown())).optional(),
  taxSavings: z.number().optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/exchanges-1031", authWrite, async (req: Request, res: Response) => {
  try {
    const body = Exchange1031Schema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraExchanges1031Table).values({
      externalId: randomUUID(),
      relinquishedProperty: d.relinquishedProperty,
      relinquishedAddress: d.relinquishedAddress,
      saleDate: d.saleDate,
      salePrice: d.salePrice != null ? String(d.salePrice) : undefined,
      adjustedBasis: d.adjustedBasis != null ? String(d.adjustedBasis) : undefined,
      deferredGain: d.deferredGain != null ? String(d.deferredGain) : undefined,
      qi: d.qi,
      qiContact: d.qiContact,
      status: d.status ?? "identification",
      identificationDeadline: d.identificationDeadline,
      exchangeDeadline: d.exchangeDeadline,
      identifiedProperties: d.identifiedProperties ?? [],
      complianceItems: d.complianceItems ?? [],
      taxSavings: d.taxSavings != null ? String(d.taxSavings) : undefined,
      ownerUserId: req.user?.id ?? null,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { exchange: rowToExchange(row) });
  } catch (err) { handleRouteError(res, err, "Failed to create exchange"); }
});

router.put("/terra/exchanges-1031/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = Exchange1031Schema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.status) update.status = d.status;
    if (d.identifiedProperties) update.identifiedProperties = d.identifiedProperties;
    if (d.complianceItems) update.complianceItems = d.complianceItems;
    const exUserId = req.user?.id;
    const exWhere = exUserId != null
      ? and(eq(terraExchanges1031Table.externalId, req.params.id), or(eq(terraExchanges1031Table.ownerUserId, exUserId), isNull(terraExchanges1031Table.ownerUserId)))
      : eq(terraExchanges1031Table.externalId, req.params.id);
    const [exUpdated] = await db.update(terraExchanges1031Table).set(update).where(exWhere).returning({ id: terraExchanges1031Table.id });
    if (!exUpdated) return sendUnauthorized(res, "You do not have permission to update this record");
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update exchange"); }
});

router.delete("/terra/exchanges-1031/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const exUserId = req.user?.id;
    const exWhere = exUserId != null
      ? and(eq(terraExchanges1031Table.externalId, req.params.id), or(eq(terraExchanges1031Table.ownerUserId, exUserId), isNull(terraExchanges1031Table.ownerUserId)))
      : eq(terraExchanges1031Table.externalId, req.params.id);
    const [exDeleted] = await db.delete(terraExchanges1031Table).where(exWhere).returning({ id: terraExchanges1031Table.id });
    if (!exDeleted) return sendUnauthorized(res, "You do not have permission to delete this record");
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete exchange"); }
});

// ---------------------------------------------------------------------------
// Tax Appeals
// ---------------------------------------------------------------------------

function rowToTaxAppeal(r: typeof terraTaxAppealsTable.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    address: r.address ?? "",
    propertyType: r.propertyType ?? "",
    sqft: r.sqft ?? 0,
    assessedValue: Number(r.assessedValue ?? 0),
    avmValue: Number(r.avmValue ?? 0),
    taxRate: Number(r.taxRate ?? 0),
    overAssessedPct: Number(r.overAssessedPct ?? 0),
    annualTax: Number(r.annualTax ?? 0),
    potentialSavings: Number(r.potentialSavings ?? 0),
    appealDeadline: r.appealDeadline ?? "",
    appealStatus: r.appealStatus,
    juris: r.juris ?? "",
    comparables: (r.comparables as Array<Record<string, unknown>>) ?? [],
    appealStrength: r.appealStrength,
    notes: r.notes ?? "",
    isDemo: r.isDemo,
  };
}

router.get("/terra/tax-appeals", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db.select().from(terraTaxAppealsTable)
      .where(userId != null ? or(eq(terraTaxAppealsTable.ownerUserId, userId), isNull(terraTaxAppealsTable.ownerUserId)) : isNull(terraTaxAppealsTable.ownerUserId))
      .orderBy(desc(terraTaxAppealsTable.createdAt));
    sendSuccess(res, { count: rows.length, properties: rows.map(rowToTaxAppeal), dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch tax appeals"); }
});

const TaxAppealSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  propertyType: z.string().optional(),
  sqft: z.number().optional(),
  assessedValue: z.number().optional(),
  avmValue: z.number().optional(),
  taxRate: z.number().optional(),
  overAssessedPct: z.number().optional(),
  annualTax: z.number().optional(),
  potentialSavings: z.number().optional(),
  appealDeadline: z.string().optional(),
  appealStatus: z.enum(["eligible", "filed", "hearing", "won", "lost", "not-eligible"]).optional(),
  juris: z.string().optional(),
  comparables: z.array(z.record(z.unknown())).optional(),
  appealStrength: z.enum(["strong", "moderate", "weak"]).optional(),
  notes: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/tax-appeals", authWrite, async (req: Request, res: Response) => {
  try {
    const body = TaxAppealSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraTaxAppealsTable).values({
      externalId: randomUUID(),
      name: d.name,
      address: d.address,
      propertyType: d.propertyType,
      sqft: d.sqft,
      assessedValue: d.assessedValue != null ? String(d.assessedValue) : undefined,
      avmValue: d.avmValue != null ? String(d.avmValue) : undefined,
      taxRate: d.taxRate != null ? String(d.taxRate) : undefined,
      overAssessedPct: d.overAssessedPct != null ? String(d.overAssessedPct) : undefined,
      annualTax: d.annualTax != null ? String(d.annualTax) : undefined,
      potentialSavings: d.potentialSavings != null ? String(d.potentialSavings) : undefined,
      appealDeadline: d.appealDeadline,
      appealStatus: d.appealStatus ?? "eligible",
      juris: d.juris,
      comparables: d.comparables ?? [],
      appealStrength: d.appealStrength ?? "moderate",
      notes: d.notes,
      ownerUserId: req.user?.id ?? null,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { property: rowToTaxAppeal(row) });
  } catch (err) { handleRouteError(res, err, "Failed to create tax appeal"); }
});

router.put("/terra/tax-appeals/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = TaxAppealSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.appealStatus) update.appealStatus = d.appealStatus;
    if (d.notes) update.notes = d.notes;
    const taUserId = req.user?.id;
    const taWhere = taUserId != null
      ? and(eq(terraTaxAppealsTable.externalId, req.params.id), or(eq(terraTaxAppealsTable.ownerUserId, taUserId), isNull(terraTaxAppealsTable.ownerUserId)))
      : eq(terraTaxAppealsTable.externalId, req.params.id);
    const [taUpdated] = await db.update(terraTaxAppealsTable).set(update).where(taWhere).returning({ id: terraTaxAppealsTable.id });
    if (!taUpdated) return sendUnauthorized(res, "You do not have permission to update this record");
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update tax appeal"); }
});

router.delete("/terra/tax-appeals/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const taUserId = req.user?.id;
    const taWhere = taUserId != null
      ? and(eq(terraTaxAppealsTable.externalId, req.params.id), or(eq(terraTaxAppealsTable.ownerUserId, taUserId), isNull(terraTaxAppealsTable.ownerUserId)))
      : eq(terraTaxAppealsTable.externalId, req.params.id);
    const [taDeleted] = await db.delete(terraTaxAppealsTable).where(taWhere).returning({ id: terraTaxAppealsTable.id });
    if (!taDeleted) return sendUnauthorized(res, "You do not have permission to delete this record");
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete tax appeal"); }
});

// ---------------------------------------------------------------------------
// Waterfall Structures
// ---------------------------------------------------------------------------

router.get("/terra/waterfall-structures", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const baseQuery = db.select().from(terraWaterfallStructuresTable);
    const rows = await (userId
      ? baseQuery.where(eq(terraWaterfallStructuresTable.ownerUserId, userId))
      : baseQuery
    ).orderBy(desc(terraWaterfallStructuresTable.updatedAt));
    const structures = rows.map(r => ({
      id: r.externalId ?? String(r.id),
      name: r.name,
      description: r.description ?? "",
      inputs: r.inputs as Record<string, unknown>,
      results: r.results as Record<string, unknown> | null,
      updatedAt: r.updatedAt.toISOString(),
      isDemo: r.isDemo,
    }));
    sendSuccess(res, { count: rows.length, structures, dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch waterfall structures"); }
});

const WaterfallStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  ownerName: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/waterfall-structures", authWrite, async (req: Request, res: Response) => {
  try {
    const body = WaterfallStructureSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraWaterfallStructuresTable).values({
      externalId: randomUUID(),
      name: d.name,
      description: d.description,
      inputs: d.inputs,
      results: d.results,
      ownerName: d.ownerName ?? req.user?.displayName,
      ownerUserId: req.user?.id,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { structure: { id: row.externalId ?? String(row.id), name: row.name, inputs: row.inputs, updatedAt: row.updatedAt.toISOString() } });
  } catch (err) { handleRouteError(res, err, "Failed to save waterfall structure"); }
});

router.put("/terra/waterfall-structures/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = WaterfallStructureSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.name) update.name = d.name;
    if (d.inputs) update.inputs = d.inputs;
    if (d.results) update.results = d.results;
    const conditions = [eq(terraWaterfallStructuresTable.externalId, req.params.id)];
    if (req.user?.id) conditions.push(eq(terraWaterfallStructuresTable.ownerUserId, req.user.id));
    await db.update(terraWaterfallStructuresTable).set(update).where(and(...conditions));
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update waterfall structure"); }
});

router.delete("/terra/waterfall-structures/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const conditions = [eq(terraWaterfallStructuresTable.externalId, req.params.id)];
    if (req.user?.id) conditions.push(eq(terraWaterfallStructuresTable.ownerUserId, req.user.id));
    await db.delete(terraWaterfallStructuresTable).where(and(...conditions));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete waterfall structure"); }
});

// ---------------------------------------------------------------------------
// Construction Projects
// ---------------------------------------------------------------------------

function rowToConstructionProject(r: typeof terraConstructionProjectsTable.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    address: r.address ?? "",
    type: r.type ?? "",
    totalBudget: Number(r.totalBudget ?? 0),
    totalSpent: Number(r.totalSpent ?? 0),
    overallPct: r.overallPct,
    startDate: r.startDate ?? "",
    projectedCompletion: r.projectedCompletion ?? "",
    revisedCompletion: r.revisedCompletion ?? undefined,
    status: r.status,
    gc: r.gc ?? "",
    architect: r.architect ?? "",
    milestones: (r.milestones as Array<Record<string, unknown>>) ?? [],
    budgetLines: (r.budgetLines as Array<Record<string, unknown>>) ?? [],
    photos: (r.photos as Array<Record<string, unknown>>) ?? [],
    isDemo: r.isDemo,
  };
}

router.get("/terra/construction-projects", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db.select().from(terraConstructionProjectsTable)
      .where(userId != null ? or(eq(terraConstructionProjectsTable.ownerUserId, userId), isNull(terraConstructionProjectsTable.ownerUserId)) : isNull(terraConstructionProjectsTable.ownerUserId))
      .orderBy(desc(terraConstructionProjectsTable.createdAt));
    sendSuccess(res, { count: rows.length, projects: rows.map(rowToConstructionProject), dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch construction projects"); }
});

const ConstructionProjectSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  type: z.string().optional(),
  totalBudget: z.number().optional(),
  totalSpent: z.number().optional(),
  overallPct: z.number().int().optional(),
  startDate: z.string().optional(),
  projectedCompletion: z.string().optional(),
  revisedCompletion: z.string().optional(),
  status: z.enum(["on-track", "behind", "at-risk", "complete"]).optional(),
  gc: z.string().optional(),
  architect: z.string().optional(),
  milestones: z.array(z.record(z.unknown())).optional(),
  budgetLines: z.array(z.record(z.unknown())).optional(),
  photos: z.array(z.record(z.unknown())).optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/construction-projects", authWrite, async (req: Request, res: Response) => {
  try {
    const body = ConstructionProjectSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const [row] = await db.insert(terraConstructionProjectsTable).values({
      externalId: randomUUID(),
      name: d.name,
      address: d.address,
      type: d.type,
      totalBudget: d.totalBudget != null ? String(d.totalBudget) : undefined,
      totalSpent: d.totalSpent != null ? String(d.totalSpent) : undefined,
      overallPct: d.overallPct ?? 0,
      startDate: d.startDate,
      projectedCompletion: d.projectedCompletion,
      revisedCompletion: d.revisedCompletion,
      status: d.status ?? "on-track",
      gc: d.gc,
      architect: d.architect,
      milestones: d.milestones ?? [],
      budgetLines: d.budgetLines ?? [],
      photos: d.photos ?? [],
      ownerUserId: req.user?.id ?? null,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, { project: rowToConstructionProject(row) });
  } catch (err) { handleRouteError(res, err, "Failed to create construction project"); }
});

router.put("/terra/construction-projects/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = ConstructionProjectSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.overallPct != null) update.overallPct = d.overallPct;
    if (d.status) update.status = d.status;
    if (d.milestones) update.milestones = d.milestones;
    if (d.budgetLines) update.budgetLines = d.budgetLines;
    if (d.photos) update.photos = d.photos;
    if (d.totalSpent != null) update.totalSpent = String(d.totalSpent);
    if (d.revisedCompletion) update.revisedCompletion = d.revisedCompletion;
    const cpUserId = req.user?.id;
    const cpWhere = cpUserId != null
      ? and(eq(terraConstructionProjectsTable.externalId, req.params.id), or(eq(terraConstructionProjectsTable.ownerUserId, cpUserId), isNull(terraConstructionProjectsTable.ownerUserId)))
      : eq(terraConstructionProjectsTable.externalId, req.params.id);
    const [cpUpdated] = await db.update(terraConstructionProjectsTable).set(update).where(cpWhere).returning({ id: terraConstructionProjectsTable.id });
    if (!cpUpdated) return sendUnauthorized(res, "You do not have permission to update this record");
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update construction project"); }
});

router.delete("/terra/construction-projects/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const cpUserId = req.user?.id;
    const cpWhere = cpUserId != null
      ? and(eq(terraConstructionProjectsTable.externalId, req.params.id), or(eq(terraConstructionProjectsTable.ownerUserId, cpUserId), isNull(terraConstructionProjectsTable.ownerUserId)))
      : eq(terraConstructionProjectsTable.externalId, req.params.id);
    const [cpDeleted] = await db.delete(terraConstructionProjectsTable).where(cpWhere).returning({ id: terraConstructionProjectsTable.id });
    if (!cpDeleted) return sendUnauthorized(res, "You do not have permission to delete this record");
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete construction project"); }
});

// ---------------------------------------------------------------------------
// Tenant Applications — with screening provider integration
// ---------------------------------------------------------------------------

function rowToTenantApplication(r: typeof terraTenantApplicationsTable.$inferSelect) {
  const screening = (r.screeningData as Record<string, unknown>) ?? {};
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    type: r.type,
    targetUnit: r.targetUnit ?? "",
    proposedRent: Number(r.proposedRent ?? 0),
    leaseTermMonths: r.leaseTermMonths ?? 12,
    submittedDate: r.submittedDate ?? r.createdAt.toISOString().slice(0, 10),
    status: r.status,
    overallScore: r.overallScore,
    recommendation: r.recommendation,
    creditScore: r.creditScore ?? (screening.creditScore as number) ?? 0,
    annualIncome: Number(r.annualIncome ?? (screening.annualIncome as number) ?? 0),
    incomeVerified: r.incomeVerified,
    rentToIncomeRatio: Number(r.rentToIncomeRatio ?? (screening.rentToIncomeRatio as number) ?? 0),
    priorEvictions: r.priorEvictions,
    backgroundClear: r.backgroundClear,
    screeningData: screening,
    flags: (r.flags as Array<Record<string, unknown>>) ?? [],
    notes: r.notes ?? "",
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/terra/tenant-applications", authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db.select().from(terraTenantApplicationsTable)
      .where(userId != null ? or(eq(terraTenantApplicationsTable.ownerUserId, userId), isNull(terraTenantApplicationsTable.ownerUserId)) : isNull(terraTenantApplicationsTable.ownerUserId))
      .orderBy(desc(terraTenantApplicationsTable.createdAt));
    sendSuccess(res, { count: rows.length, applicants: rows.map(rowToTenantApplication), dataMode: rows.length > 0 ? "live" : "empty" });
  } catch (err) { handleRouteError(res, err, "Failed to fetch tenant applications"); }
});

const TenantApplicationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["individual", "entity"]).optional(),
  targetUnit: z.string().optional(),
  proposedRent: z.number().optional(),
  leaseTermMonths: z.number().int().optional(),
  submittedDate: z.string().optional(),
  status: z.enum(["pending", "approved", "conditional", "declined"]).optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  recommendation: z.enum(["approve", "conditional", "decline"]).optional(),
  creditScore: z.number().int().optional(),
  annualIncome: z.number().optional(),
  incomeVerified: z.boolean().optional(),
  rentToIncomeRatio: z.number().optional(),
  priorEvictions: z.number().int().optional(),
  backgroundClear: z.boolean().optional(),
  screeningData: z.record(z.unknown()).optional(),
  flags: z.array(z.record(z.unknown())).optional(),
  notes: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post("/terra/tenant-applications", authWrite, async (req: Request, res: Response) => {
  try {
    const body = TenantApplicationSchema.safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;

    let screeningResult: ScreeningProviderResult | null = null;
    let providerError: string | null = null;

    if (!d.isDemo) {
      try {
        const provider = getScreeningProvider();
        screeningResult = await provider.screen({
          name: d.name,
          annualIncome: d.annualIncome,
          creditScore: d.creditScore,
          targetRent: d.proposedRent,
        });
      } catch (err) {
        providerError = err instanceof Error ? err.message : "Screening provider error";
      }
    }

    const effectiveCreditScore = screeningResult?.creditScore ?? d.creditScore;
    const effectiveBackgroundClear = screeningResult?.backgroundClear ?? d.backgroundClear ?? true;
    const effectiveEvictions = screeningResult?.evictionRecords ?? d.priorEvictions ?? 0;
    const effectiveIncomeVerified = screeningResult?.incomeVerified ?? d.incomeVerified ?? false;
    const overallScore = screeningResult?.radarScores.overall ?? d.overallScore ?? 50;
    const recommendation: "approve" | "conditional" | "decline" = overallScore >= 75 ? "approve"
      : overallScore >= 50 ? "conditional" : "decline";

    const normalizedRadarScores: { subject: string; score: number }[] | undefined =
      screeningResult?.radarScores
        ? [
            { subject: "Credit", score: screeningResult.radarScores.credit },
            { subject: "Income", score: screeningResult.radarScores.income },
            { subject: "Rental Hist.", score: screeningResult.radarScores.rental },
            { subject: "Overall", score: screeningResult.radarScores.overall },
          ]
        : undefined;

    const severityToType = (s: string): "warning" | "info" | "error" =>
      s === "error" ? "error" : s === "warning" ? "warning" : "info";

    const screeningData: Record<string, unknown> = {
      ...(d.screeningData ?? {}),
      providerName: screeningResult?.providerName ?? "Manual Entry",
      providerStatus: screeningResult?.providerStatus ?? "unavailable",
      creditHistory: screeningResult?.creditHistory,
      bankruptcies: screeningResult?.bankruptcies ?? 0,
      judgments: screeningResult?.judgments ?? 0,
      ...(normalizedRadarScores ? { radarScores: normalizedRadarScores } : {}),
      ...(providerError ? { providerError } : {}),
    };

    const flags: Array<{ type: "warning" | "info" | "error"; text: string }> = [
      ...(d.flags ?? [] as Array<{ type: "warning" | "info" | "error"; text: string }>),
      ...(screeningResult?.flags.map(f => ({ type: severityToType(f.severity), text: f.note })) ?? []),
    ];

    const [row] = await db.insert(terraTenantApplicationsTable).values({
      externalId: randomUUID(),
      name: d.name,
      type: d.type ?? "individual",
      targetUnit: d.targetUnit,
      proposedRent: d.proposedRent != null ? String(d.proposedRent) : undefined,
      leaseTermMonths: d.leaseTermMonths,
      submittedDate: d.submittedDate ?? new Date().toISOString().slice(0, 10),
      status: d.status ?? "pending",
      overallScore,
      recommendation: d.recommendation ?? recommendation,
      creditScore: effectiveCreditScore,
      annualIncome: d.annualIncome != null ? String(d.annualIncome) : undefined,
      incomeVerified: effectiveIncomeVerified,
      rentToIncomeRatio: d.rentToIncomeRatio != null ? String(d.rentToIncomeRatio) : undefined,
      priorEvictions: effectiveEvictions,
      backgroundClear: effectiveBackgroundClear,
      screeningData,
      flags,
      notes: d.notes,
      ownerUserId: req.user?.id ?? null,
      isDemo: d.isDemo ?? false,
    }).returning();
    sendSuccess(res, {
      applicant: rowToTenantApplication(row),
      screening: screeningResult ? { provider: screeningResult.providerName, status: screeningResult.providerStatus } : null,
    });
  } catch (err) { handleRouteError(res, err, "Failed to create tenant application"); }
});

router.put("/terra/tenant-applications/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const body = TenantApplicationSchema.partial().safeParse(req.body);
    if (!body.success) return sendBadRequest(res, body.error.message);
    const d = body.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (d.status) update.status = d.status;
    if (d.recommendation) update.recommendation = d.recommendation;
    if (d.overallScore != null) update.overallScore = d.overallScore;
    if (d.notes != null) update.notes = d.notes;
    if (d.screeningData) update.screeningData = d.screeningData;
    if (d.flags) update.flags = d.flags;
    const userId = req.user?.id;
    const where = userId != null
      ? and(eq(terraTenantApplicationsTable.externalId, req.params.id), or(eq(terraTenantApplicationsTable.ownerUserId, userId), isNull(terraTenantApplicationsTable.ownerUserId)))
      : eq(terraTenantApplicationsTable.externalId, req.params.id);
    const [updated] = await db.update(terraTenantApplicationsTable).set(update).where(where).returning({ id: terraTenantApplicationsTable.id });
    if (!updated) return sendUnauthorized(res, "You do not have permission to update this record");
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update tenant application"); }
});

router.delete("/terra/tenant-applications/:id", authWrite, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const where = userId != null
      ? and(eq(terraTenantApplicationsTable.externalId, req.params.id), or(eq(terraTenantApplicationsTable.ownerUserId, userId), isNull(terraTenantApplicationsTable.ownerUserId)))
      : eq(terraTenantApplicationsTable.externalId, req.params.id);
    const [deleted] = await db.delete(terraTenantApplicationsTable).where(where).returning({ id: terraTenantApplicationsTable.id });
    if (!deleted) return sendUnauthorized(res, "You do not have permission to delete this record");
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete tenant application"); }
});

export default router;
