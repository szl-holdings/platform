/**
 * Unified Marketplace API
 * Serves both INCA Lab AgentMarketplace and Alloy skills-marketplace
 * from a single Postgres-backed catalog.
 *
 * GET  /api/marketplace/listings         - list/search
 * GET  /api/marketplace/listings/:id     - single listing
 * POST /api/marketplace/listings/:id/deploy   - deploy (agents)
 * POST /api/marketplace/listings/:id/activate - activate (skills)
 * DELETE /api/marketplace/listings/:id/activate - deactivate (skills)
 * POST /api/marketplace/listings/:id/rate - rate a listing
 * GET  /api/marketplace/stats            - platform stats
 * GET  /api/marketplace/deployments      - user deployments
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "@szl-holdings/db";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Table bootstrap ──────────────────────────────────────────────────────────

let _booted = false;
async function boot() {
  if (_booted) return;
  _booted = true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id SERIAL PRIMARY KEY,
        listing_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0.0',
        description TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('agent', 'skill')),
        domain TEXT NOT NULL,
        category TEXT NOT NULL,
        capability TEXT,
        tags JSONB DEFAULT '[]',
        autonomy_level TEXT,
        provider TEXT,
        model TEXT,
        publisher TEXT DEFAULT 'SZL Platform',
        cost_per_run REAL,
        avg_latency_ms INTEGER,
        success_rate REAL,
        deployment_count INTEGER NOT NULL DEFAULT 0,
        active_users INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        rating REAL NOT NULL DEFAULT 0,
        rating_count INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_popular BOOLEAN NOT NULL DEFAULT FALSE,
        is_sla_compliant BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        capabilities JSONB DEFAULT '[]',
        change_log JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_ratings (
        id SERIAL PRIMARY KEY,
        listing_id TEXT NOT NULL REFERENCES marketplace_listings(listing_id),
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        review TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_deployments (
        id SERIAL PRIMARY KEY,
        deployment_id TEXT NOT NULL UNIQUE,
        listing_id TEXT NOT NULL REFERENCES marketplace_listings(listing_id),
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        config JSONB DEFAULT '{}',
        deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        terminated_at TIMESTAMPTZ
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_user_activations (
        id SERIAL PRIMARY KEY,
        listing_id TEXT NOT NULL REFERENCES marketplace_listings(listing_id),
        user_id INTEGER NOT NULL,
        is_activated BOOLEAN NOT NULL DEFAULT TRUE,
        activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deactivated_at TIMESTAMPTZ,
        UNIQUE(user_id, listing_id)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS marketplace_kind_idx ON marketplace_listings(kind);
      CREATE INDEX IF NOT EXISTS marketplace_domain_idx ON marketplace_listings(domain);
      CREATE INDEX IF NOT EXISTS marketplace_active_idx ON marketplace_listings(is_active);
      CREATE INDEX IF NOT EXISTS marketplace_featured_idx ON marketplace_listings(is_featured);
    `);

    logger.info("Marketplace tables ensured");
    await seedIfEmpty();
  } catch (err) {
    logger.error({ err }, "Failed to ensure marketplace tables");
  }
}

boot().catch(err => logger.error({ err }, "marketplace boot failed"));

// ─── Seed catalog ─────────────────────────────────────────────────────────────

async function seedIfEmpty() {
  const check = await pool.query("SELECT COUNT(*) as cnt FROM marketplace_listings");
  if (parseInt(check.rows[0].cnt, 10) > 0) return;

  const listings = [
    // ── Agents (INCA Lab) ──────────────────────────────────────────────────
    {
      listing_id: "sentinel-v4", name: "Sentinel v4", slug: "sentinel-v4", version: "4.1.0",
      description: "Advanced threat detection with real-time OFAC screening, CVE correlation, and maker-checker validation. Handles critical escalations with full audit trail.",
      kind: "agent", domain: "Security", category: "Monitoring", capability: "Monitoring",
      tags: ["threat-intel", "OFAC", "maker-checker", "audit"],
      autonomy_level: "supervised", provider: "anthropic", model: "claude-sonnet-4-6",
      cost_per_run: 0.042, avg_latency_ms: 890, success_rate: 99.1, deployment_count: 38,
      active_users: 38, usage_count: 4820, rating: 4.9, rating_count: 142,
      is_featured: true, is_popular: true, is_sla_compliant: true,
      capabilities: ["OFAC screening", "CVE correlation", "Maker-checker", "Audit trail"],
      change_log: ["v4.1.0: Enhanced OFAC secondary screening", "v4.0.0: Added maker-checker protocol", "v3.8.0: CVE correlation engine"],
    },
    {
      listing_id: "helmsman-v3", name: "Helmsman v3", slug: "helmsman-v3", version: "3.2.4",
      description: "End-to-end maritime intelligence: AIS dark period detection, vessel ownership resolution, sanctions route analysis, and crew compliance screening.",
      kind: "agent", domain: "Maritime", category: "Analysis", capability: "Analysis",
      tags: ["AIS", "vessels", "sanctions", "maritime"],
      autonomy_level: "supervised", provider: "anthropic", model: "claude-sonnet-4-6",
      cost_per_run: 0.071, avg_latency_ms: 1240, success_rate: 97.3, deployment_count: 24,
      active_users: 24, usage_count: 2810, rating: 4.8, rating_count: 87,
      is_featured: true, is_popular: true, is_sla_compliant: true,
      capabilities: ["AIS dark detection", "Ownership graph", "Sanctions routing", "Crew compliance"],
      change_log: ["v3.2.4: Improved AIS gap detection", "v3.2.0: Ownership graph resolution", "v3.0.0: Full rewrite"],
    },
    {
      listing_id: "docminer-v2", name: "DocMiner v2", slug: "docminer-v2", version: "2.5.1",
      description: "High-throughput legal document parsing. Extracts deadlines, obligations, counterparties, and risk flags from contracts, filings, and correspondence.",
      kind: "agent", domain: "Legal", category: "Analysis", capability: "Analysis",
      tags: ["contracts", "deadlines", "NLP", "legal"],
      autonomy_level: "semi-autonomous", provider: "openai", model: "gpt-4o-mini",
      cost_per_run: 0.034, avg_latency_ms: 2100, success_rate: 94.8, deployment_count: 19,
      active_users: 19, usage_count: 1940, rating: 4.7, rating_count: 63,
      is_featured: false, is_popular: false, is_sla_compliant: true,
      capabilities: ["Deadline extraction", "Obligation parsing", "Risk flagging", "Counterparty ID"],
      change_log: ["v2.5.1: Deadline confidence improved", "v2.5.0: New obligation extractor"],
    },
    {
      listing_id: "prospector-v2", name: "Prospector v2", slug: "prospector-v2", version: "2.1.0",
      description: "Distressed property identification, automated due diligence scoring, comparable sales analysis, and market risk assessment across target regions.",
      kind: "agent", domain: "Real Estate", category: "Analysis", capability: "Analysis",
      tags: ["property", "due-diligence", "market-analysis"],
      autonomy_level: "semi-autonomous", provider: "gemini", model: "gemini-1.5-pro",
      cost_per_run: 0.055, avg_latency_ms: 1580, success_rate: 96.2, deployment_count: 12,
      active_users: 12, usage_count: 1140, rating: 4.6, rating_count: 44,
      is_featured: false, is_popular: false, is_sla_compliant: false,
      capabilities: ["Distress scoring", "Due diligence", "Comparable sales", "Market risk"],
      change_log: ["v2.1.0: Comparable sales engine", "v2.0.0: GIS integration"],
    },
    {
      listing_id: "beacon-v3", name: "Beacon v3", slug: "beacon-v3", version: "3.0.1",
      description: "Multi-dimensional anomaly detection across KPI streams. 3σ statistical thresholds, trend forecasting, and automated alerting with root-cause suggestions.",
      kind: "agent", domain: "Analytics", category: "Monitoring", capability: "Monitoring",
      tags: ["anomaly", "KPI", "alerting", "telemetry"],
      autonomy_level: "autonomous", provider: "gemini", model: "gemini-1.5-pro",
      cost_per_run: 0.028, avg_latency_ms: 650, success_rate: 98.4, deployment_count: 31,
      active_users: 31, usage_count: 3890, rating: 4.8, rating_count: 91,
      is_featured: true, is_popular: true, is_sla_compliant: true,
      capabilities: ["3σ thresholds", "Trend forecasting", "Root-cause analysis", "Auto-alerting"],
      change_log: ["v3.0.1: Root cause analysis", "v3.0.0: Forecasting engine"],
    },
    {
      listing_id: "muse-v2", name: "Muse v2", slug: "muse-v2", version: "2.0.3",
      description: "Brand-aligned content generation at scale. Campaign strategy, copywriting variants, SEO-optimized assets, and tone consistency enforcement.",
      kind: "agent", domain: "Commerce", category: "Generation", capability: "Generation",
      tags: ["content", "brand", "copy", "campaign"],
      autonomy_level: "semi-autonomous", provider: "openai", model: "gpt-4o",
      cost_per_run: 0.065, avg_latency_ms: 2800, success_rate: 91.4, deployment_count: 8,
      active_users: 8, usage_count: 870, rating: 4.3, rating_count: 28,
      is_featured: false, is_popular: false, is_sla_compliant: false,
      capabilities: ["Campaign strategy", "Copywriting", "SEO optimization", "Tone enforcement"],
      change_log: ["v2.0.3: Tone consistency module", "v2.0.0: Brand alignment engine"],
    },
    {
      listing_id: "oracle-v1", name: "Oracle v1", slug: "oracle-v1", version: "1.4.2",
      description: "72-hour predictive risk forecasting for maritime corridors, sanctions pressure, and geopolitical volatility. Trained on multi-source intelligence feeds.",
      kind: "agent", domain: "Analytics", category: "Analysis", capability: "Analysis",
      tags: ["forecast", "risk", "geopolitical", "maritime"],
      autonomy_level: "supervised", provider: "openai", model: "gpt-4o",
      cost_per_run: 0.12, avg_latency_ms: 3800, success_rate: 89.7, deployment_count: 6,
      active_users: 6, usage_count: 560, rating: 4.4, rating_count: 19,
      is_featured: false, is_popular: false, is_sla_compliant: false,
      capabilities: ["72h forecasting", "Sanctions pressure", "Geopolitical scoring", "Multi-source fusion"],
      change_log: ["v1.4.2: 72h horizon support", "v1.4.0: Multi-source fusion"],
    },
    {
      listing_id: "zeus-v3", name: "Zeus v3", slug: "zeus-v3", version: "3.0.5",
      description: "Autonomous Azure/Kubernetes operations with intelligent rollback. Handles deployment orchestration, health checks, and infrastructure scaling decisions.",
      kind: "agent", domain: "Infrastructure", category: "Automation", capability: "Automation",
      tags: ["Azure", "Kubernetes", "DevOps", "infrastructure"],
      autonomy_level: "supervised", provider: "anthropic", model: "claude-sonnet-4-6",
      cost_per_run: 0.038, avg_latency_ms: 920, success_rate: 96.8, deployment_count: 15,
      active_users: 15, usage_count: 1680, rating: 4.5, rating_count: 37,
      is_featured: false, is_popular: false, is_sla_compliant: true,
      capabilities: ["Azure orchestration", "k8s operations", "Intelligent rollback", "Health checks"],
      change_log: ["v3.0.5: Intelligent rollback", "v3.0.0: k8s operator integration"],
    },

    // ── Skills (Alloy) ─────────────────────────────────────────────────────
    {
      listing_id: "sk_presentation_engine", name: "AI Presentation Engine", slug: "presentation-engine", version: "3.1.0",
      description: "Generate structured slide decks — investor pitches, board briefs, client presentations — directly from natural language prompts. Supports 8 layout types with domain-aware tone profiles.",
      kind: "skill", domain: "Documents", category: "Content Generation",
      tags: ["slides", "decks", "investor", "board", "content"],
      cost_per_run: null, avg_latency_ms: 1240, success_rate: 98.2,
      deployment_count: 0, active_users: 47, usage_count: 18420,
      rating: 4.8, rating_count: 312, is_featured: true, is_popular: true, is_sla_compliant: true,
      capabilities: ["Multi-layout slides", "Domain tone profiles", "Speaker notes", "PDF export"],
      change_log: ["v3.1.0: Executive summary slide type", "v3.0.0: Domain tone profiles", "v2.0.0: PDF export"],
    },
    {
      listing_id: "sk_email_composer", name: "AI Email Composer", slug: "email-composer", version: "2.4.1",
      description: "Smart email drafting, intelligent reply suggestions, tone adjustment, and thread summarization. Domain-aware profiles for legal, maritime, security, and executive contexts.",
      kind: "skill", domain: "Communication", category: "Communication",
      tags: ["email", "drafting", "tone", "summarize"],
      cost_per_run: null, avg_latency_ms: 890, success_rate: 97.8,
      deployment_count: 0, active_users: 62, usage_count: 23100,
      rating: 4.7, rating_count: 287, is_featured: false, is_popular: true, is_sla_compliant: true,
      capabilities: ["Draft mode", "Reply suggestions", "Tone adjustment", "Thread summarization"],
      change_log: ["v2.4.1: Maritime tone profile", "v2.4.0: Legal context mode"],
    },
    {
      listing_id: "sk_design_studio", name: "AI Design Studio", slug: "design-studio", version: "1.8.2",
      description: "Generate brand-consistent UI mockups, marketing visuals, and data visualizations from prompts. Outputs SVG and PNG assets ready for production use.",
      kind: "skill", domain: "Media", category: "Design",
      tags: ["design", "mockup", "brand", "visual", "SVG"],
      cost_per_run: null, avg_latency_ms: 2100, success_rate: 94.1,
      deployment_count: 0, active_users: 31, usage_count: 8940,
      rating: 4.5, rating_count: 156, is_featured: false, is_popular: true, is_sla_compliant: false,
      capabilities: ["UI mockups", "Brand visuals", "Data charts", "SVG + PNG export"],
      change_log: ["v1.8.2: Data viz module", "v1.8.0: Brand token injection"],
    },
    {
      listing_id: "sk_research_agent", name: "Deep Research Agent", slug: "research-agent", version: "2.2.0",
      description: "Autonomous web research, source triangulation, and structured report generation. Handles multi-step queries with citations and confidence scoring for each claim.",
      kind: "skill", domain: "Research", category: "Research",
      tags: ["research", "web", "citations", "reports"],
      cost_per_run: null, avg_latency_ms: 4200, success_rate: 91.3,
      deployment_count: 0, active_users: 28, usage_count: 5820,
      rating: 4.6, rating_count: 198, is_featured: true, is_popular: true, is_sla_compliant: false,
      capabilities: ["Multi-step research", "Source triangulation", "Citations", "Confidence scoring"],
      change_log: ["v2.2.0: Source triangulation", "v2.0.0: Multi-step planner"],
    },
    {
      listing_id: "sk_data_navigator", name: "Data Navigator", slug: "data-navigator", version: "1.5.0",
      description: "Natural language to SQL query translation with schema-aware suggestions, query optimization hints, and result summarization. Connects to any Postgres or BigQuery dataset.",
      kind: "skill", domain: "Data", category: "Analytics",
      tags: ["SQL", "database", "NLP", "query", "BigQuery"],
      cost_per_run: null, avg_latency_ms: 780, success_rate: 96.4,
      deployment_count: 0, active_users: 41, usage_count: 12300,
      rating: 4.7, rating_count: 231, is_featured: false, is_popular: true, is_sla_compliant: true,
      capabilities: ["NL to SQL", "Schema awareness", "Query optimization", "Result summarization"],
      change_log: ["v1.5.0: BigQuery connector", "v1.4.0: Query optimizer"],
    },
    {
      listing_id: "sk_voice_intel", name: "Voice Intelligence", slug: "voice-intel", version: "1.2.3",
      description: "Meeting transcription, speaker diarization, action item extraction, and automated follow-up drafting. Integrates with Zoom, Teams, and Google Meet.",
      kind: "skill", domain: "Productivity", category: "Meetings",
      tags: ["meetings", "transcription", "diarization", "action-items"],
      cost_per_run: null, avg_latency_ms: 6200, success_rate: 93.8,
      deployment_count: 0, active_users: 19, usage_count: 4110,
      rating: 4.4, rating_count: 89, is_featured: false, is_popular: false, is_sla_compliant: false,
      capabilities: ["Transcription", "Speaker diarization", "Action items", "Follow-up drafting"],
      change_log: ["v1.2.3: Teams integration", "v1.2.0: Google Meet support"],
    },
    {
      listing_id: "sk_compliance_checker", name: "Compliance Checker", slug: "compliance-checker", version: "2.0.1",
      description: "Automated regulatory compliance analysis for maritime, financial, and legal frameworks. Maps documents to specific regulatory requirements with gap identification.",
      kind: "skill", domain: "Security", category: "Compliance",
      tags: ["compliance", "regulatory", "maritime", "legal", "gap-analysis"],
      cost_per_run: null, avg_latency_ms: 3100, success_rate: 97.2,
      deployment_count: 0, active_users: 24, usage_count: 7650,
      rating: 4.8, rating_count: 174, is_featured: true, is_popular: true, is_sla_compliant: true,
      capabilities: ["Regulatory mapping", "Gap analysis", "Multi-framework support", "Evidence linking"],
      change_log: ["v2.0.1: GDPR framework", "v2.0.0: Multi-framework engine"],
    },
  ];

  for (const l of listings) {
    await pool.query(`
      INSERT INTO marketplace_listings
        (listing_id, name, slug, version, description, kind, domain, category, capability,
         tags, autonomy_level, provider, model, publisher, cost_per_run, avg_latency_ms,
         success_rate, deployment_count, active_users, usage_count, rating, rating_count,
         is_featured, is_popular, is_sla_compliant, capabilities, change_log, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'SZL Platform',$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'{}')
      ON CONFLICT (listing_id) DO NOTHING
    `, [
      l.listing_id, l.name, l.slug, l.version, l.description, l.kind,
      l.domain, l.category, (l as any).capability ?? null,
      JSON.stringify(l.tags ?? []),
      (l as any).autonomy_level ?? null,
      (l as any).provider ?? null, (l as any).model ?? null,
      l.cost_per_run ?? null, l.avg_latency_ms ?? null,
      l.success_rate ?? null, l.deployment_count, l.active_users,
      l.usage_count, l.rating, l.rating_count,
      l.is_featured, l.is_popular, l.is_sla_compliant,
      JSON.stringify(l.capabilities ?? []),
      JSON.stringify(l.change_log ?? []),
    ]).catch(err => logger.warn({ err, listingId: l.listing_id }, "Failed to seed marketplace listing"));
  }

  logger.info("Marketplace catalog seeded with 14 listings");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapListing(r: any): any {
  return {
    id: r.listing_id, name: r.name, slug: r.slug, version: r.version,
    description: r.description, kind: r.kind, domain: r.domain, category: r.category,
    capability: r.capability, tags: r.tags ?? [], autonomyLevel: r.autonomy_level,
    provider: r.provider, model: r.model, publisher: r.publisher,
    costPerRun: r.cost_per_run, avgLatencyMs: r.avg_latency_ms, successRate: r.success_rate,
    deploymentCount: r.deployment_count, activeUsers: r.active_users, usageCount: r.usage_count,
    rating: r.rating, ratingCount: r.rating_count, reviews: r.rating_count,
    isFeatured: r.is_featured, isPopular: r.is_popular, isSlaCompliant: r.is_sla_compliant,
    slaCompliant: r.is_sla_compliant, featured: r.is_featured,
    capabilities: r.capabilities ?? [], changeLog: r.change_log ?? [],
    isActivated: r._is_activated ?? false,
    metadata: r.metadata ?? {}, updatedAt: r.updated_at,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/marketplace/listings", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { kind, domain, category, search, featured, popular } = req.query as Record<string, string>;
    const userId = req.user?.id;
    const params: any[] = [];
    const wheres: string[] = ["ml.is_active = TRUE"];
    let idx = 1;

    if (kind) { wheres.push(`ml.kind = $${idx++}`); params.push(kind); }
    if (domain && domain !== "All") { wheres.push(`ml.domain = $${idx++}`); params.push(domain); }
    if (category && category !== "All") { wheres.push(`ml.category = $${idx++}`); params.push(category); }
    if (featured === "true") { wheres.push("ml.is_featured = TRUE"); }
    if (popular === "true") { wheres.push("ml.is_popular = TRUE"); }
    if (search) {
      wheres.push(`(ml.name ILIKE $${idx} OR ml.description ILIKE $${idx} OR ml.domain ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const activationJoin = userId
      ? `LEFT JOIN marketplace_user_activations mua ON mua.listing_id = ml.listing_id AND mua.user_id = ${Number(userId)} AND mua.is_activated = TRUE`
      : "";
    const activationSel = userId ? ", mua.is_activated AS _is_activated" : ", FALSE AS _is_activated";

    const { rows } = await pool.query(
      `SELECT ml.* ${activationSel} FROM marketplace_listings ml ${activationJoin} WHERE ${wheres.join(" AND ")} ORDER BY ml.is_featured DESC, ml.rating DESC, ml.usage_count DESC`,
      params
    );

    const listings = rows.map(mapListing);
    const agents = listings.filter(l => l.kind === "agent");
    const skills = listings.filter(l => l.kind === "skill");

    sendSuccess(res, { listings, agents, skills, count: listings.length });
  } catch (err) {
    handleRouteError(res, err, "marketplace list");
  }
});

router.get("/marketplace/listings/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const activationJoin = userId
      ? `LEFT JOIN marketplace_user_activations mua ON mua.listing_id = ml.listing_id AND mua.user_id = ${Number(userId)} AND mua.is_activated = TRUE`
      : "";
    const activationSel = userId ? ", mua.is_activated AS _is_activated" : ", FALSE AS _is_activated";
    const { rows } = await pool.query(
      `SELECT ml.* ${activationSel} FROM marketplace_listings ml ${activationJoin} WHERE ml.listing_id = $1`,
      [req.params.id]
    );
    if (!rows[0]) { sendNotFound(res, "Listing"); return; }
    sendSuccess(res, mapListing(rows[0]));
  } catch (err) {
    handleRouteError(res, err, "marketplace listing detail");
  }
});

router.post("/marketplace/listings/:id/deploy", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { rows } = await pool.query("SELECT * FROM marketplace_listings WHERE listing_id=$1 AND is_active=TRUE", [req.params.id]);
    if (!rows[0]) { sendNotFound(res, "Listing"); return; }
    const listing = rows[0];
    if (listing.kind !== "agent") { sendBadRequest(res, "Deploy is only for agents. Use /activate for skills."); return; }

    const deploymentId = `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await pool.query(`
      INSERT INTO marketplace_deployments (deployment_id, listing_id, user_id, status, config, deployed_at)
      VALUES ($1,$2,$3,'active',$4,NOW())
    `, [deploymentId, listing.listing_id, req.user.id, JSON.stringify(req.body.config ?? {})]);

    await pool.query(
      "UPDATE marketplace_listings SET deployment_count = deployment_count + 1, active_users = active_users + 1 WHERE listing_id=$1",
      [listing.listing_id]
    );

    logger.info({ deploymentId, listingId: listing.listing_id, userId: req.user.id }, "marketplace: agent deployed");
    sendCreated(res, {
      deploymentId, listingId: listing.listing_id, agentName: listing.name,
      status: "active", deployedAt: new Date().toISOString(),
      message: `${listing.name} has been deployed successfully.`,
    });
  } catch (err) {
    handleRouteError(res, err, "marketplace deploy");
  }
});

router.post("/marketplace/listings/:id/activate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { rows } = await pool.query("SELECT * FROM marketplace_listings WHERE listing_id=$1 AND is_active=TRUE", [req.params.id]);
    if (!rows[0]) { sendNotFound(res, "Listing"); return; }
    const listing = rows[0];
    if (listing.kind !== "skill") { sendBadRequest(res, "Activate is only for skills. Use /deploy for agents."); return; }

    await pool.query(`
      INSERT INTO marketplace_user_activations (listing_id, user_id, is_activated, activated_at)
      VALUES ($1,$2,TRUE,NOW())
      ON CONFLICT (user_id, listing_id) DO UPDATE SET is_activated=TRUE, activated_at=NOW(), deactivated_at=NULL
    `, [listing.listing_id, req.user.id]);

    await pool.query(
      "UPDATE marketplace_listings SET usage_count = usage_count + 1 WHERE listing_id=$1",
      [listing.listing_id]
    );

    logger.info({ listingId: listing.listing_id, userId: req.user.id }, "marketplace: skill activated");
    sendCreated(res, { listingId: listing.listing_id, skillName: listing.name, isActivated: true, activatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "marketplace activate");
  }
});

router.delete("/marketplace/listings/:id/activate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    await pool.query(`
      UPDATE marketplace_user_activations
      SET is_activated=FALSE, deactivated_at=NOW()
      WHERE listing_id=$1 AND user_id=$2
    `, [req.params.id, req.user.id]);
    sendSuccess(res, { listingId: req.params.id, isActivated: false });
  } catch (err) {
    handleRouteError(res, err, "marketplace deactivate");
  }
});

router.post("/marketplace/listings/:id/rate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { rows } = await pool.query("SELECT listing_id FROM marketplace_listings WHERE listing_id=$1", [req.params.id]);
    if (!rows[0]) { sendNotFound(res, "Listing"); return; }
    const { score, review } = req.body as { score?: number; review?: string };
    if (typeof score !== "number" || score < 1 || score > 5) { sendBadRequest(res, "score must be 1-5"); return; }

    await pool.query(`
      INSERT INTO marketplace_ratings (listing_id, user_id, score, review, created_at)
      VALUES ($1,$2,$3,$4,NOW())
      ON CONFLICT (user_id, listing_id) DO UPDATE SET score=$3, review=$4
    `, [req.params.id, req.user.id, score, review ?? null]);

    const aggr = await pool.query(
      "SELECT AVG(score)::REAL as avg_rating, COUNT(*)::INTEGER as cnt FROM marketplace_ratings WHERE listing_id=$1",
      [req.params.id]
    );
    const { avg_rating, cnt } = aggr.rows[0];
    await pool.query(
      "UPDATE marketplace_listings SET rating=$1, rating_count=$2 WHERE listing_id=$3",
      [Math.round(avg_rating * 10) / 10, cnt, req.params.id]
    );

    logger.info({ listingId: req.params.id, userId: req.user.id, score }, "marketplace: rating submitted");
    sendCreated(res, { listingId: req.params.id, score, review, newRating: Math.round(avg_rating * 10) / 10, ratingCount: cnt });
  } catch (err) {
    handleRouteError(res, err, "marketplace rate");
  }
});

router.get("/marketplace/stats", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const [totals, byKind, deployments, activations] = await Promise.all([
      pool.query("SELECT COUNT(*)::INTEGER as total_listings, SUM(usage_count)::BIGINT as total_usage, SUM(deployment_count)::INTEGER as total_deployments, SUM(active_users)::INTEGER as total_active_users FROM marketplace_listings WHERE is_active=TRUE"),
      pool.query("SELECT kind, COUNT(*)::INTEGER as count FROM marketplace_listings WHERE is_active=TRUE GROUP BY kind"),
      userId ? pool.query("SELECT COUNT(*)::INTEGER as cnt FROM marketplace_deployments WHERE user_id=$1 AND status='active'", [userId]) : Promise.resolve({ rows: [{ cnt: 0 }] }),
      userId ? pool.query("SELECT COUNT(*)::INTEGER as cnt FROM marketplace_user_activations WHERE user_id=$1 AND is_activated=TRUE", [userId]) : Promise.resolve({ rows: [{ cnt: 0 }] }),
    ]);

    const t = totals.rows[0];
    const kindMap: Record<string, number> = {};
    for (const r of byKind.rows) kindMap[r.kind] = r.count;

    sendSuccess(res, {
      totalListings: t.total_listings,
      totalAgents: kindMap["agent"] ?? 0,
      totalSkills: kindMap["skill"] ?? 0,
      totalUsage: parseInt(t.total_usage ?? "0", 10),
      totalDeployments: t.total_deployments,
      totalActiveUsers: t.total_active_users,
      userDeployments: deployments.rows[0].cnt,
      userActivations: activations.rows[0].cnt,
    });
  } catch (err) {
    handleRouteError(res, err, "marketplace stats");
  }
});

router.get("/marketplace/deployments", authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { rows } = await pool.query(`
      SELECT md.*, ml.name, ml.domain, ml.kind, ml.success_rate, ml.avg_latency_ms
      FROM marketplace_deployments md
      JOIN marketplace_listings ml ON ml.listing_id = md.listing_id
      WHERE md.user_id=$1 AND md.status='active'
      ORDER BY md.deployed_at DESC
    `, [req.user.id]);

    const deployments = rows.map(r => ({
      deploymentId: r.deployment_id, listingId: r.listing_id, name: r.name,
      domain: r.domain, kind: r.kind, status: r.status,
      successRate: r.success_rate, avgLatencyMs: r.avg_latency_ms,
      config: r.config, deployedAt: r.deployed_at,
    }));

    sendSuccess(res, { deployments, count: deployments.length });
  } catch (err) {
    handleRouteError(res, err, "marketplace deployments");
  }
});

export default router;
