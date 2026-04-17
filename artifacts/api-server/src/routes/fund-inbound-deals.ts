import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { db, fundInboundDealsTable } from "@szl-holdings/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { publicSubmitLimiter } from "../middlewares/rate-limiters";

const router: IRouter = Router();

const submitSchema = z.object({
  company: z.string().min(1).max(200),
  website: z.string().max(300).optional().nullable(),
  sector: z.string().min(1).max(100),
  stage: z.string().min(1).max(50),
  askSize: z.string().max(50).optional().nullable(),
  valuation: z.string().max(50).optional().nullable(),
  arr: z.string().max(50).optional().nullable(),
  growth: z.string().max(50).optional().nullable(),
  founderName: z.string().min(1).max(200),
  founderEmail: z.string().email().max(254),
  founderBackground: z.string().max(2000).optional().nullable(),
  founderEducation: z.string().max(500).optional().nullable(),
  founderPriorExits: z.string().max(20).optional().nullable(),
  summary: z.string().min(1).max(4000),
  deckUrl: z.string().max(500).optional().nullable(),
  convictionScore: z.number().int().min(0).max(100),
  scores: z.object({
    team: z.number().int().min(0).max(100),
    market: z.number().int().min(0).max(100),
    product: z.number().int().min(0).max(100),
    traction: z.number().int().min(0).max(100),
    competitive: z.number().int().min(0).max(100),
    financials: z.number().int().min(0).max(100),
  }),
  status: z.enum(["screening", "active", "passed", "invested"]).default("screening"),
  strengths: z.array(z.string().max(500)).max(20).default([]),
  risks: z.array(z.string().max(500)).max(20).default([]),
});

function generatePipelineId(): string {
  // DF-<4 time chars>-<4 random chars> — time prefix keeps entries ordered
  // visually; random suffix eliminates collisions under concurrent submits.
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  const r = randomBytes(3).toString("base64").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  return `DF-${t}${r}`;
}

router.post("/public/fund-inbound-deals", publicSubmitLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, `Invalid submission: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      return;
    }
    const v = parsed.data;
    const pipelineId = generatePipelineId();

    const [row] = await db.insert(fundInboundDealsTable).values({
      pipelineId,
      company: v.company,
      website: v.website ?? null,
      sector: v.sector,
      stage: v.stage,
      askSize: v.askSize ?? null,
      valuation: v.valuation ?? null,
      arr: v.arr ?? null,
      growth: v.growth ?? null,
      founderName: v.founderName,
      founderEmail: v.founderEmail,
      founderBackground: v.founderBackground ?? null,
      founderEducation: v.founderEducation ?? null,
      founderPriorExits: v.founderPriorExits ?? null,
      summary: v.summary,
      deckUrl: v.deckUrl ?? null,
      convictionScore: v.convictionScore,
      scoreTeam: v.scores.team,
      scoreMarket: v.scores.market,
      scoreProduct: v.scores.product,
      scoreTraction: v.scores.traction,
      scoreCompetitive: v.scores.competitive,
      scoreFinancials: v.scores.financials,
      status: v.status,
      strengths: v.strengths,
      risks: v.risks,
      source: "inbound",
    }).returning();

    sendSuccess(res, {
      pipelineId: row.pipelineId,
      submittedAt: row.submittedAt,
      confirmationEmail: v.founderEmail,
      message: `Submission received. Confirmation sent to ${v.founderEmail}. Pipeline ID ${row.pipelineId}.`,
    }, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to record inbound deal submission");
  }
});

// Authenticated listing for partners. The /api/ prefix (without /public)
// is protected by the global auth enforcer — only signed-in partners can
// view founder identity, summary, and scoring details.
router.get("/fund-inbound-deals", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(fundInboundDealsTable)
      .orderBy(desc(fundInboundDealsTable.submittedAt))
      .limit(200);

    const mapped = rows.map(r => ({
      id: r.pipelineId,
      company: r.company,
      sector: r.sector,
      stage: r.stage,
      askSize: r.askSize ?? "—",
      valuation: r.valuation ?? "—",
      convictionScore: r.convictionScore,
      scores: {
        team: r.scoreTeam,
        market: r.scoreMarket,
        product: r.scoreProduct,
        traction: r.scoreTraction,
        competitive: r.scoreCompetitive,
        financials: r.scoreFinancials,
      },
      status: r.status,
      founder: r.founderName + (r.founderBackground ? ` (${r.founderBackground.slice(0, 60)}${r.founderBackground.length > 60 ? "…" : ""})` : ""),
      founderEmail: r.founderEmail,
      summary: r.summary,
      strengths: r.strengths ?? [],
      risks: r.risks ?? [],
      date: new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      source: r.source,
    }));

    sendSuccess(res, mapped);
  } catch (err) {
    handleRouteError(res, err, "Failed to list inbound deal submissions");
  }
});

export default router;
