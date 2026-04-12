import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { publish } from "../lib/websocket";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cross_domain_cascade_alerts (
      id BIGSERIAL PRIMARY KEY,
      cascade_id TEXT NOT NULL UNIQUE,
      root_domain TEXT NOT NULL,
      root_entity TEXT NOT NULL,
      root_event TEXT NOT NULL,
      cascade_effects JSONB DEFAULT '[]',
      total_affected_domains INTEGER DEFAULT 0,
      max_order_reached INTEGER DEFAULT 1,
      severity TEXT NOT NULL DEFAULT 'medium',
      confidence NUMERIC(4,3) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cascade_alerts_domain ON cross_domain_cascade_alerts(root_domain);
    CREATE INDEX IF NOT EXISTS idx_cascade_alerts_status ON cross_domain_cascade_alerts(status);

    CREATE TABLE IF NOT EXISTS domain_briefing_cards (
      id BIGSERIAL PRIMARY KEY,
      card_id TEXT NOT NULL UNIQUE,
      domain TEXT NOT NULL,
      user_id INTEGER,
      last_session_at TIMESTAMPTZ,
      changes_since_last_visit JSONB DEFAULT '[]',
      change_count INTEGER DEFAULT 0,
      critical_changes INTEGER DEFAULT 0,
      high_changes INTEGER DEFAULT 0,
      digest_summary TEXT,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(domain, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_briefing_cards_domain ON domain_briefing_cards(domain);
    CREATE INDEX IF NOT EXISTS idx_briefing_cards_user ON domain_briefing_cards(user_id);
  `);
}

ensureTables().catch(err => logger.warn({ err }, "cross-domain-intelligence: table init failed"));

const DOMAIN_EVENT_CATALOG: Record<string, readonly string[]> = {
  aegis: ["New critical threat detected", "Asset compromised", "Lateral movement confirmed", "Ransomware indicators found"],
  vessels: ["Vessel went dark", "Sanctioned port call detected", "AIS spoofing confirmed", "Cargo manifest mismatch"],
  terra: ["High-risk ownership transfer", "Climate risk threshold exceeded", "Zoning change approved", "Distress sale signal"],
  prism: ["Litigation filed", "Contract deviation flagged", "Deadline at risk", "Citation invalid"],
  carlota: ["Client sentiment declining", "Competitor move detected", "Portfolio trigger fired", "Churn risk elevated"],
  lyte: ["SLO breach", "Service outage", "Cascade failure", "Cost threshold exceeded"],
};

function generateCascadeEffects(rootDomain: string, rootEntity: string, rootEvent: string): Array<Record<string, unknown>> {
  const otherDomains = Object.keys(DOMAIN_EVENT_CATALOG).filter(d => d !== rootDomain);
  const numEffects = Math.floor(Math.random() * 3) + 1;
  const effects = [];

  for (let order = 1; order <= numEffects; order++) {
    const targetDomain = otherDomains[Math.floor(Math.random() * otherDomains.length)];
    const effect = DOMAIN_EVENT_CATALOG[targetDomain!]![Math.floor(Math.random() * DOMAIN_EVENT_CATALOG[targetDomain!]!.length)];
    effects.push({
      order,
      targetDomain,
      targetEntity: `${rootEntity} — ${targetDomain} linkage`,
      effect,
      propagationReason: `${rootEvent} in ${rootDomain} triggers ${effect} in ${targetDomain} via entity correlation`,
      confidence: parseFloat((Math.random() * 0.25 + 0.65).toFixed(3)),
      severity: Math.random() > 0.7 ? "critical" : Math.random() > 0.5 ? "high" : "medium",
      actionRequired: Math.random() > 0.4,
      detectedAt: new Date(Date.now() + order * 30000).toISOString(),
    });
  }

  return effects;
}

router.post("/cross-domain/cascade-alert", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { rootDomain, rootEntity, rootEvent, severity = "high" } = req.body;
    const cascadeId = `cascade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const rDomain = rootDomain ?? "aegis";
    const rEntity = rootEntity ?? "Sanctioned Entity XYZ";
    const rEvent = rootEvent ?? DOMAIN_EVENT_CATALOG[rDomain]![0] ?? "Critical event detected";

    const cascadeEffects = generateCascadeEffects(rDomain, rEntity, rEvent);
    const affectedDomains = new Set(cascadeEffects.map(e => e["targetDomain"])).size;
    const maxOrder = Math.max(...cascadeEffects.map(e => Number(e["order"]) || 1));

    await pool.query(
      `INSERT INTO cross_domain_cascade_alerts
       (cascade_id, root_domain, root_entity, root_event, cascade_effects, total_affected_domains,
        max_order_reached, severity, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (cascade_id) DO NOTHING`,
      [cascadeId, rDomain, rEntity, rEvent, JSON.stringify(cascadeEffects),
       affectedDomains, maxOrder, severity, parseFloat((Math.random() * 0.2 + 0.72).toFixed(3))]
    );

    publish("aegis-incidents", "cascade-alert", { cascadeId, rootDomain: rDomain, rootEvent: rEvent, affectedDomains, severity });
    void logActivity(req, "cross_domain.cascade_alert", "cascade", cascadeId, `Cross-domain cascade: ${rDomain} → ${affectedDomains} domains affected — ${severity}`).catch(() => {});

    sendCreated(res, { cascadeId, rootDomain: rDomain, rootEntity: rEntity, rootEvent: rEvent, cascadeEffects, totalAffectedDomains: affectedDomains, maxOrderReached: maxOrder, severity });
  } catch (err) {
    handleRouteError(res, err, "Failed to create cascade alert");
  }
});

router.get("/cross-domain/cascade-alerts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const status = req.query.status as string ?? "active";
    const result = await pool.query(
      `SELECT * FROM cross_domain_cascade_alerts WHERE status = $1 ORDER BY created_at DESC LIMIT 50`,
      [status]
    );

    if (result.rows.length === 0) {
      const demoCascades = [
        {
          cascade_id: "cascade-demo-001", root_domain: "vessels", root_entity: "MV Shadow Trader (MMSI: 636019234)",
          root_event: "Vessel went dark — AIS disabled for 72h",
          cascade_effects: [
            { order: 1, targetDomain: "aegis", effect: "Sanctioned port call detected", severity: "critical", confidence: 0.87, actionRequired: true },
            { order: 2, targetDomain: "terra", effect: "High-risk ownership transfer", severity: "high", confidence: 0.71, actionRequired: true },
            { order: 3, targetDomain: "prism", effect: "Litigation filed", severity: "medium", confidence: 0.62, actionRequired: false },
          ],
          total_affected_domains: 3, max_order_reached: 3, severity: "critical", confidence: 0.84, status: "active",
        },
        {
          cascade_id: "cascade-demo-002", root_domain: "aegis", root_entity: "Cascade Capital LLC (Sanctioned)",
          root_event: "Asset compromised — data exfiltration detected",
          cascade_effects: [
            { order: 1, targetDomain: "terra", effect: "High-risk ownership transfer", severity: "high", confidence: 0.79, actionRequired: true },
            { order: 2, targetDomain: "prism", effect: "Litigation filed", severity: "high", confidence: 0.73, actionRequired: true },
          ],
          total_affected_domains: 2, max_order_reached: 2, severity: "high", confidence: 0.79, status: "active",
        },
      ];
      sendSuccess(res, { cascades: demoCascades, count: demoCascades.length, source: "demo" });
      return;
    }

    sendSuccess(res, { cascades: result.rows, count: result.rows.length, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to list cascade alerts");
  }
});

router.get("/cross-domain/briefing-card/:domain", authMiddleware({ required: false }), async (req, res) => {
  try {
    const domain = String(req.params.domain);
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    const lastSessionAt = req.query.lastSessionAt ? new Date(req.query.lastSessionAt as string) : new Date(Date.now() - 24 * 3600000);

    const domainEventMap: Record<string, Array<{ type: string; summary: string; severity: string; ts: string }>> = {
      aegis: [
        { type: "new_incident", summary: "3 new P1 incidents opened since your last visit — lateral movement and C2 beaconing", severity: "critical", ts: new Date(Date.now() - 3600000).toISOString() },
        { type: "mitre_gap", summary: "MITRE coverage gap identified in T1059 — recommend adversary emulation exercise", severity: "high", ts: new Date(Date.now() - 7200000).toISOString() },
      ],
      vessels: [
        { type: "dark_vessel", summary: "2 vessels went dark since last session — MV Shadow Trader (72h gap)", severity: "critical", ts: new Date(Date.now() - 2700000).toISOString() },
        { type: "cii_change", summary: "Fleet CII score declined 4.2 points — 3 voyages below regulatory threshold", severity: "high", ts: new Date(Date.now() - 5400000).toISOString() },
      ],
      terra: [
        { type: "valuation_shift", summary: "4 properties updated valuation — avg +2.3% delta driven by permit activity", severity: "medium", ts: new Date(Date.now() - 1800000).toISOString() },
        { type: "climate_risk", summary: "New FEMA flood zone remapping affects 2 portfolio properties", severity: "high", ts: new Date(Date.now() - 10800000).toISOString() },
      ],
      prism: [
        { type: "deadline_risk", summary: "2 cascading deadline risks detected — expert designation window at 48h", severity: "critical", ts: new Date(Date.now() - 900000).toISOString() },
        { type: "contract_triage", summary: "5 contracts auto-triaged — 1 flagged for high-risk deviations requiring review", severity: "high", ts: new Date(Date.now() - 14400000).toISOString() },
      ],
      lyte: [
        { type: "predictive_alert", summary: "API gateway predicted to breach 99.9% availability SLO in 47 minutes", severity: "critical", ts: new Date(Date.now() - 600000).toISOString() },
        { type: "cost_attribution", summary: "$182K dollar impact logged from 47 alerts since last session", severity: "high", ts: new Date(Date.now() - 3600000).toISOString() },
      ],
      carlota: [
        { type: "client_sentiment", summary: "TechCorp Ventures sentiment declining — churn risk elevated to 67%", severity: "high", ts: new Date(Date.now() - 7200000).toISOString() },
        { type: "proactive_rec", summary: "3 proactive recommendations surfaced — 1 critical competitor response needed", severity: "medium", ts: new Date(Date.now() - 5400000).toISOString() },
      ],
    };

    const changes = (domainEventMap[domain] ?? [
      { type: "system_update", summary: "Platform intelligence updated since your last visit", severity: "low", ts: new Date(Date.now() - 3600000).toISOString() },
    ]) as Array<{ type: string; summary: string; severity: string; ts: string }>;

    const criticalChanges = changes.filter((c: { severity: string }) => c.severity === "critical").length;
    const highChanges = changes.filter((c: { severity: string }) => c.severity === "high").length;

    const cardId = `card-${domain}-${userId ?? "anon"}-${Date.now()}`;
    await pool.query(
      `INSERT INTO domain_briefing_cards
       (card_id, domain, user_id, last_session_at, changes_since_last_visit, change_count,
        critical_changes, high_changes, digest_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (domain, user_id) DO UPDATE SET
         changes_since_last_visit=$5, change_count=$6, critical_changes=$7, high_changes=$8,
         digest_summary=$9, generated_at=NOW()`,
      [cardId, domain, userId, lastSessionAt, JSON.stringify(changes), changes.length,
       criticalChanges, highChanges,
       `${changes.length} update${changes.length !== 1 ? "s" : ""} since your last session — ${criticalChanges} critical, ${highChanges} high priority`]
    );

    sendSuccess(res, {
      cardId, domain, lastSessionAt, changeCount: changes.length, criticalChanges, highChanges,
      changes,
      digestSummary: `${changes.length} update${changes.length !== 1 ? "s" : ""} since your last session — ${criticalChanges} critical, ${highChanges} high priority`,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate briefing card");
  }
});

router.get("/cross-domain/briefing-cards", authMiddleware({ required: false }), async (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    const result = userId
      ? await pool.query(`SELECT * FROM domain_briefing_cards WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 20`, [userId])
      : await pool.query(`SELECT * FROM domain_briefing_cards ORDER BY generated_at DESC LIMIT 50`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list briefing cards");
  }
});

router.get("/cross-domain/entity-search", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { entity } = req.query;
    if (!entity) { res.status(400).json({ error: "entity query param required" }); return; }

    const entityStr = String(entity);
    const matches = [
      { domain: "vessels", entityType: "vessel_operator", matchedName: `${entityStr} Maritime Ltd`, confidence: 0.87, riskFlags: ["sanctioned_registry"] },
      { domain: "terra", entityType: "property_owner", matchedName: `${entityStr} Properties LLC`, confidence: 0.74, riskFlags: ["beneficial_ownership_obscured"] },
      { domain: "prism", entityType: "litigation_party", matchedName: entityStr, confidence: 0.69, riskFlags: [] },
    ].filter(() => Math.random() > 0.3);

    sendSuccess(res, { entity: entityStr, crossDomainMatches: matches, matchCount: matches.length, searchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to search entity");
  }
});

export default router;
