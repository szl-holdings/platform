/**
 * Forge Database Persistence Layer
 * Provides helpers for reading/writing forge data to Postgres.
 * Used by forge-revenue.ts and forge-portal.ts routes.
 */
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";
import { randomUUID } from "crypto";

// ─── Table bootstrap ──────────────────────────────────────────────────────────

export async function ensureForgeTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_onboarding (
        id SERIAL PRIMARY KEY,
        record_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'in_progress',
        current_step INTEGER NOT NULL DEFAULT 1,
        total_steps INTEGER NOT NULL DEFAULT 6,
        company_profile JSONB,
        domain_interests JSONB DEFAULT '[]',
        kyc_status TEXT NOT NULL DEFAULT 'pending',
        kyc_documents JSONB DEFAULT '[]',
        portfolio_config JSONB,
        team_invitations JSONB DEFAULT '[]',
        billing_setup JSONB,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_client_health (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        overall_score REAL NOT NULL DEFAULT 0,
        trend TEXT NOT NULL DEFAULT 'stable',
        trend_delta REAL NOT NULL DEFAULT 0,
        dimensions JSONB NOT NULL DEFAULT '{}',
        risk_level TEXT NOT NULL DEFAULT 'low',
        churn_probability REAL NOT NULL DEFAULT 0,
        days_since_last_login INTEGER NOT NULL DEFAULT 0,
        reports_viewed_last_30d INTEGER NOT NULL DEFAULT 0,
        features_adopted INTEGER NOT NULL DEFAULT 0,
        total_features INTEGER NOT NULL DEFAULT 0,
        support_tickets_open INTEGER NOT NULL DEFAULT 0,
        nps_score INTEGER,
        recommendations JSONB DEFAULT '[]',
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_proposals (
        id SERIAL PRIMARY KEY,
        proposal_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'consulting',
        status TEXT NOT NULL DEFAULT 'draft',
        executive_summary TEXT,
        services JSONB DEFAULT '[]',
        timeline JSONB DEFAULT '[]',
        pricing JSONB NOT NULL DEFAULT '{}',
        domains JSONB DEFAULT '[]',
        valid_until TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ,
        viewed_at TIMESTAMPTZ,
        responded_at TIMESTAMPTZ
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_intelligence_packages (
        id SERIAL PRIMARY KEY,
        package_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        domains JSONB DEFAULT '[]',
        tier TEXT NOT NULL DEFAULT 'professional',
        features JSONB DEFAULT '[]',
        deliverables JSONB DEFAULT '[]',
        pricing JSONB NOT NULL DEFAULT '{}',
        agent_workflows JSONB DEFAULT '[]',
        usage_limits JSONB DEFAULT '[]',
        subscriber_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_communications (
        id SERIAL PRIMARY KEY,
        comm_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        summary TEXT,
        body TEXT,
        domain TEXT NOT NULL DEFAULT 'general',
        priority TEXT NOT NULL DEFAULT 'normal',
        status TEXT NOT NULL DEFAULT 'scheduled',
        metadata JSONB DEFAULT '{}',
        scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_communication_preferences (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        briefing_frequency TEXT NOT NULL DEFAULT 'weekly',
        alert_threshold TEXT NOT NULL DEFAULT 'high',
        newsletter_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
        email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
        in_portal_notifications BOOLEAN NOT NULL DEFAULT TRUE,
        domain_preferences JSONB DEFAULT '{}',
        quiet_hours_start TEXT,
        quiet_hours_end TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Forge Portal tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_portal_clients (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        email TEXT NOT NULL,
        relationship TEXT,
        member_since TEXT,
        tier TEXT NOT NULL DEFAULT 'silver',
        domains JSONB DEFAULT '[]',
        avatar_initials TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_portfolio_holdings (
        id SERIAL PRIMARY KEY,
        holding_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        capital_deployed REAL NOT NULL DEFAULT 0,
        current_value REAL NOT NULL DEFAULT 0,
        irr TEXT,
        vintage TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_legal_matters (
        id SERIAL PRIMARY KEY,
        matter_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        next_deadline TEXT,
        recovery_progress INTEGER NOT NULL DEFAULT 0,
        lead_attorney TEXT,
        opened_date TEXT,
        description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_portal_assets (
        id SERIAL PRIMARY KEY,
        asset_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        value TEXT,
        last_update TEXT,
        location TEXT,
        alert TEXT,
        notification_threshold INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_portal_documents (
        id SERIAL PRIMARY KEY,
        doc_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        type TEXT NOT NULL,
        uploaded_by TEXT,
        uploaded_date TEXT,
        size TEXT,
        version TEXT DEFAULT '1.0',
        access_log JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_message_threads (
        id SERIAL PRIMARY KEY,
        thread_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        participants JSONB DEFAULT '[]',
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS forge_proposals_client_idx ON forge_proposals(client_id);
      CREATE INDEX IF NOT EXISTS forge_comms_client_idx ON forge_communications(client_id);
      CREATE INDEX IF NOT EXISTS forge_holdings_client_idx ON forge_portfolio_holdings(client_id);
      CREATE INDEX IF NOT EXISTS forge_matters_client_idx ON forge_legal_matters(client_id);
      CREATE INDEX IF NOT EXISTS forge_assets_client_idx ON forge_portal_assets(client_id);
      CREATE INDEX IF NOT EXISTS forge_docs_client_idx ON forge_portal_documents(client_id);
      CREATE INDEX IF NOT EXISTS forge_threads_client_idx ON forge_message_threads(client_id);
    `);

    logger.info("Forge tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure forge tables");
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function getOnboardingRecord(userId: number): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_onboarding WHERE user_id = $1", [userId]);
    return r.rows[0] ? mapOnboarding(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertOnboarding(record: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_onboarding
      (record_id, user_id, status, current_step, total_steps, company_profile,
       domain_interests, kyc_status, kyc_documents, portfolio_config, team_invitations,
       billing_setup, started_at, completed_at, last_updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (user_id) DO UPDATE SET
      status=$3, current_step=$4, total_steps=$5, company_profile=$6,
      domain_interests=$7, kyc_status=$8, kyc_documents=$9, portfolio_config=$10,
      team_invitations=$11, billing_setup=$12, completed_at=$14, last_updated_at=$15
  `, [
    record.id, record.userId, record.status, record.currentStep, record.totalSteps,
    JSON.stringify(record.companyProfile ?? null),
    JSON.stringify(record.domainInterests ?? []),
    record.kycStatus,
    JSON.stringify(record.kycDocuments ?? []),
    JSON.stringify(record.portfolioConfig ?? null),
    JSON.stringify(record.teamInvitations ?? []),
    JSON.stringify(record.billingSetup ?? null),
    record.startedAt, record.completedAt ?? null, record.lastUpdatedAt,
  ]);
}

function mapOnboarding(r: any): any {
  return {
    id: r.record_id,
    userId: r.user_id,
    status: r.status,
    currentStep: r.current_step,
    totalSteps: r.total_steps,
    companyProfile: r.company_profile,
    domainInterests: r.domain_interests ?? [],
    kycStatus: r.kyc_status,
    kycDocuments: r.kyc_documents ?? [],
    portfolioConfig: r.portfolio_config,
    teamInvitations: r.team_invitations ?? [],
    billingSetup: r.billing_setup,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    lastUpdatedAt: r.last_updated_at,
  };
}

// ─── Client Health ─────────────────────────────────────────────────────────────

export async function getClientHealth(clientId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_client_health WHERE client_id = $1", [clientId]);
    return r.rows[0] ? mapHealth(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertClientHealth(health: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_client_health
      (client_id, overall_score, trend, trend_delta, dimensions, risk_level,
       churn_probability, days_since_last_login, reports_viewed_last_30d,
       features_adopted, total_features, support_tickets_open, nps_score,
       recommendations, computed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (client_id) DO UPDATE SET
      overall_score=$2, trend=$3, trend_delta=$4, dimensions=$5, risk_level=$6,
      churn_probability=$7, days_since_last_login=$8, reports_viewed_last_30d=$9,
      features_adopted=$10, total_features=$11, support_tickets_open=$12,
      nps_score=$13, recommendations=$14, computed_at=$15
  `, [
    health.clientId, health.overallScore, health.trend, health.trendDelta,
    JSON.stringify(health.dimensions), health.riskLevel, health.churnProbability,
    health.daysSinceLastLogin, health.reportsViewedLast30d, health.featuresAdopted,
    health.totalFeatures, health.supportTicketsOpen, health.npsScore ?? null,
    JSON.stringify(health.recommendations ?? []), health.computedAt,
  ]);
}

function mapHealth(r: any): any {
  return {
    clientId: r.client_id, overallScore: r.overall_score, trend: r.trend,
    trendDelta: r.trend_delta, dimensions: r.dimensions, riskLevel: r.risk_level,
    churnProbability: r.churn_probability, daysSinceLastLogin: r.days_since_last_login,
    reportsViewedLast30d: r.reports_viewed_last_30d, featuresAdopted: r.features_adopted,
    totalFeatures: r.total_features, supportTicketsOpen: r.support_tickets_open,
    npsScore: r.nps_score, recommendations: r.recommendations ?? [],
    computedAt: r.computed_at,
  };
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function getClientProposals(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_proposals WHERE client_id=$1 ORDER BY created_at DESC", [clientId]);
    return r.rows.map(mapProposal);
  } catch { return []; }
}

export async function getProposal(proposalId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_proposals WHERE proposal_id=$1", [proposalId]);
    return r.rows[0] ? mapProposal(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertProposal(p: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_proposals
      (proposal_id, client_id, title, type, status, executive_summary, services,
       timeline, pricing, domains, valid_until, created_at, sent_at, viewed_at, responded_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (proposal_id) DO UPDATE SET
      status=$5, executive_summary=$6, services=$7, timeline=$8, pricing=$9,
      domains=$10, valid_until=$11, sent_at=$13, viewed_at=$14, responded_at=$15
  `, [
    p.id, p.clientId, p.title, p.type, p.status, p.executiveSummary,
    JSON.stringify(p.services ?? []), JSON.stringify(p.timeline ?? []),
    JSON.stringify(p.pricing), JSON.stringify(p.domains ?? []),
    p.validUntil, p.createdAt, p.sentAt ?? null, p.viewedAt ?? null, p.respondedAt ?? null,
  ]);
}

function mapProposal(r: any): any {
  return {
    id: r.proposal_id, clientId: r.client_id, title: r.title, type: r.type,
    status: r.status, executiveSummary: r.executive_summary, services: r.services ?? [],
    timeline: r.timeline ?? [], pricing: r.pricing, domains: r.domains ?? [],
    validUntil: r.valid_until, createdAt: r.created_at, sentAt: r.sent_at,
    viewedAt: r.viewed_at, respondedAt: r.responded_at,
  };
}

// ─── Intelligence Packages ────────────────────────────────────────────────────

export async function getAllPackages(): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_intelligence_packages WHERE is_active=TRUE ORDER BY id");
    return r.rows.map(mapPackage);
  } catch { return []; }
}

export async function getPackage(packageId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_intelligence_packages WHERE package_id=$1", [packageId]);
    return r.rows[0] ? mapPackage(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertPackage(p: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_intelligence_packages
      (package_id, name, slug, description, domains, tier, features, deliverables,
       pricing, agent_workflows, usage_limits, subscriber_count, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (package_id) DO UPDATE SET
      name=$2, slug=$3, description=$4, domains=$5, tier=$6, features=$7,
      deliverables=$8, pricing=$9, agent_workflows=$10, usage_limits=$11,
      subscriber_count=$12, is_active=$13
  `, [
    p.id, p.name, p.slug, p.description,
    JSON.stringify(p.domains ?? []), p.tier,
    JSON.stringify(p.features ?? []), JSON.stringify(p.deliverables ?? []),
    JSON.stringify(p.pricing), JSON.stringify(p.agentWorkflows ?? []),
    JSON.stringify(p.usageLimits ?? []), p.subscriberCount, p.isActive,
  ]);
}

export async function incrementPackageSubscribers(packageId: string): Promise<void> {
  await pool.query(
    "UPDATE forge_intelligence_packages SET subscriber_count = subscriber_count + 1 WHERE package_id=$1",
    [packageId]
  );
}

function mapPackage(r: any): any {
  return {
    id: r.package_id, name: r.name, slug: r.slug, description: r.description,
    domains: r.domains ?? [], tier: r.tier, features: r.features ?? [],
    deliverables: r.deliverables ?? [], pricing: r.pricing,
    agentWorkflows: r.agent_workflows ?? [], usageLimits: r.usage_limits ?? [],
    subscriberCount: r.subscriber_count, isActive: r.is_active,
  };
}

// ─── Communications ───────────────────────────────────────────────────────────

export async function getClientCommunications(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query(
      "SELECT * FROM forge_communications WHERE client_id=$1 ORDER BY scheduled_at DESC",
      [clientId]
    );
    return r.rows.map(mapComm);
  } catch { return []; }
}

export async function getCommunication(commId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_communications WHERE comm_id=$1", [commId]);
    return r.rows[0] ? mapComm(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertCommunication(c: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_communications
      (comm_id, client_id, type, subject, summary, body, domain, priority,
       status, metadata, scheduled_at, sent_at, read_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (comm_id) DO UPDATE SET
      status=$9, metadata=$10, sent_at=$12, read_at=$13
  `, [
    c.id, c.clientId, c.type, c.subject, c.summary, c.body,
    c.domain, c.priority, c.status, JSON.stringify(c.metadata ?? {}),
    c.scheduledAt, c.sentAt ?? null, c.readAt ?? null,
  ]);
}

function mapComm(r: any): any {
  return {
    id: r.comm_id, clientId: r.client_id, type: r.type, subject: r.subject,
    summary: r.summary, body: r.body, domain: r.domain, priority: r.priority,
    status: r.status, metadata: r.metadata ?? {}, scheduledAt: r.scheduled_at,
    sentAt: r.sent_at, readAt: r.read_at,
  };
}

// ─── Communication Preferences ────────────────────────────────────────────────

export async function getCommPrefs(clientId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_communication_preferences WHERE client_id=$1", [clientId]);
    return r.rows[0] ? mapPrefs(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertCommPrefs(prefs: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_communication_preferences
      (client_id, briefing_frequency, alert_threshold, newsletter_opt_in,
       email_notifications, in_portal_notifications, domain_preferences,
       quiet_hours_start, quiet_hours_end, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (client_id) DO UPDATE SET
      briefing_frequency=$2, alert_threshold=$3, newsletter_opt_in=$4,
      email_notifications=$5, in_portal_notifications=$6, domain_preferences=$7,
      quiet_hours_start=$8, quiet_hours_end=$9, updated_at=NOW()
  `, [
    prefs.clientId, prefs.briefingFrequency, prefs.alertThreshold,
    prefs.newsletterOptIn, prefs.emailNotifications, prefs.inPortalNotifications,
    JSON.stringify(prefs.domainPreferences ?? {}),
    prefs.quietHoursStart ?? null, prefs.quietHoursEnd ?? null,
  ]);
}

function mapPrefs(r: any): any {
  return {
    clientId: r.client_id, briefingFrequency: r.briefing_frequency,
    alertThreshold: r.alert_threshold, newsletterOptIn: r.newsletter_opt_in,
    emailNotifications: r.email_notifications, inPortalNotifications: r.in_portal_notifications,
    domainPreferences: r.domain_preferences ?? {}, quietHoursStart: r.quiet_hours_start,
    quietHoursEnd: r.quiet_hours_end,
  };
}

// ─── Portal Clients ───────────────────────────────────────────────────────────

export async function getPortalClient(userId: number): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_portal_clients WHERE user_id=$1", [userId]);
    return r.rows[0] ? mapPortalClient(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertPortalClient(c: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_portal_clients
      (client_id, user_id, name, company_name, email, relationship, member_since,
       tier, domains, avatar_initials)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (user_id) DO UPDATE SET
      name=$3, company_name=$4, email=$5, relationship=$6, member_since=$7,
      tier=$8, domains=$9, avatar_initials=$10, updated_at=NOW()
  `, [
    c.id, c.userId, c.name, c.companyName, c.email, c.relationship, c.memberSince,
    c.tier, JSON.stringify(c.domains ?? []), c.avatarInitials,
  ]);
}

function mapPortalClient(r: any): any {
  return {
    id: r.client_id, userId: r.user_id, name: r.name, companyName: r.company_name,
    email: r.email, relationship: r.relationship, memberSince: r.member_since,
    tier: r.tier, domains: r.domains ?? [], avatarInitials: r.avatar_initials,
  };
}

// ─── Portfolio Holdings ───────────────────────────────────────────────────────

export async function getClientHoldings(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_portfolio_holdings WHERE client_id=$1 ORDER BY id", [clientId]);
    return r.rows.map(mapHolding);
  } catch { return []; }
}

export async function getHolding(holdingId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_portfolio_holdings WHERE holding_id=$1", [holdingId]);
    return r.rows[0] ? mapHolding(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertHolding(h: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_portfolio_holdings
      (holding_id, client_id, name, domain, capital_deployed, current_value, irr, vintage, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (holding_id) DO UPDATE SET
      name=$3, domain=$4, capital_deployed=$5, current_value=$6, irr=$7, vintage=$8, status=$9
  `, [h.id, h.clientId, h.name, h.domain, h.capitalDeployed, h.currentValue, h.irr, h.vintage, h.status]);
}

function mapHolding(r: any): any {
  return {
    id: r.holding_id, clientId: r.client_id, name: r.name, domain: r.domain,
    capitalDeployed: r.capital_deployed, currentValue: r.current_value,
    irr: r.irr, vintage: r.vintage, status: r.status,
  };
}

// ─── Legal Matters ────────────────────────────────────────────────────────────

export async function getClientMatters(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_legal_matters WHERE client_id=$1 ORDER BY id", [clientId]);
    return r.rows.map(mapMatter);
  } catch { return []; }
}

export async function getMatter(matterId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_legal_matters WHERE matter_id=$1", [matterId]);
    return r.rows[0] ? mapMatter(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertMatter(m: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_legal_matters
      (matter_id, client_id, title, type, status, next_deadline, recovery_progress,
       lead_attorney, opened_date, description)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (matter_id) DO UPDATE SET
      title=$3, type=$4, status=$5, next_deadline=$6, recovery_progress=$7,
      lead_attorney=$8, opened_date=$9, description=$10, updated_at=NOW()
  `, [m.id, m.clientId, m.title, m.type, m.status, m.nextDeadline ?? null,
    m.recoveryProgress, m.leadAttorney, m.openedDate, m.description]);
}

function mapMatter(r: any): any {
  return {
    id: r.matter_id, clientId: r.client_id, title: r.title, type: r.type,
    status: r.status, nextDeadline: r.next_deadline ?? "", recoveryProgress: r.recovery_progress,
    leadAttorney: r.lead_attorney, openedDate: r.opened_date, description: r.description,
  };
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export async function getClientAssets(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_portal_assets WHERE client_id=$1 ORDER BY id", [clientId]);
    return r.rows.map(mapAsset);
  } catch { return []; }
}

export async function getAsset(assetId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_portal_assets WHERE asset_id=$1", [assetId]);
    return r.rows[0] ? mapAsset(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertAsset(a: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_portal_assets
      (asset_id, client_id, name, domain, type, status, value, last_update,
       location, alert, notification_threshold)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (asset_id) DO UPDATE SET
      name=$3, domain=$4, type=$5, status=$6, value=$7, last_update=$8,
      location=$9, alert=$10, notification_threshold=$11, updated_at=NOW()
  `, [
    a.id, a.clientId, a.name, a.domain, a.type, a.status, a.value,
    a.lastUpdate, a.location, a.alert ?? null, a.notificationThreshold ?? null,
  ]);
}

function mapAsset(r: any): any {
  return {
    id: r.asset_id, clientId: r.client_id, name: r.name, domain: r.domain,
    type: r.type, status: r.status, value: r.value, lastUpdate: r.last_update,
    location: r.location, alert: r.alert ?? undefined,
    notificationThreshold: r.notification_threshold,
  };
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getClientDocuments(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_portal_documents WHERE client_id=$1 ORDER BY id", [clientId]);
    return r.rows.map(mapDoc);
  } catch { return []; }
}

export async function getDocument(docId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_portal_documents WHERE doc_id=$1", [docId]);
    return r.rows[0] ? mapDoc(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertDocument(d: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_portal_documents
      (doc_id, client_id, title, domain, type, uploaded_by, uploaded_date,
       size, version, access_log)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (doc_id) DO UPDATE SET
      title=$3, domain=$4, type=$5, uploaded_by=$6, uploaded_date=$7,
      size=$8, version=$9, access_log=$10
  `, [
    d.id, d.clientId, d.title, d.domain, d.type, d.uploadedBy,
    d.uploadedDate, d.size, d.version, JSON.stringify(d.accessLog ?? []),
  ]);
}

function mapDoc(r: any): any {
  return {
    id: r.doc_id, clientId: r.client_id, title: r.title, domain: r.domain,
    type: r.type, uploadedBy: r.uploaded_by, uploadedDate: r.uploaded_date,
    size: r.size, version: r.version, accessLog: r.access_log ?? [],
  };
}

// ─── Message Threads ──────────────────────────────────────────────────────────

export async function getClientThreads(clientId: string): Promise<any[]> {
  try {
    const r = await pool.query("SELECT * FROM forge_message_threads WHERE client_id=$1 ORDER BY updated_at DESC", [clientId]);
    return r.rows.map(mapThread);
  } catch { return []; }
}

export async function getThread(threadId: string): Promise<any | null> {
  try {
    const r = await pool.query("SELECT * FROM forge_message_threads WHERE thread_id=$1", [threadId]);
    return r.rows[0] ? mapThread(r.rows[0]) : null;
  } catch { return null; }
}

export async function upsertThread(t: any): Promise<void> {
  await pool.query(`
    INSERT INTO forge_message_threads
      (thread_id, client_id, subject, status, participants, messages, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (thread_id) DO UPDATE SET
      subject=$3, status=$4, participants=$5, messages=$6, updated_at=$8
  `, [
    t.id, t.clientId, t.subject, t.status,
    JSON.stringify(t.participants ?? []), JSON.stringify(t.messages ?? []),
    t.createdAt, t.updatedAt,
  ]);
}

function mapThread(r: any): any {
  return {
    id: r.thread_id, clientId: r.client_id, subject: r.subject, status: r.status,
    participants: r.participants ?? [], messages: r.messages ?? [],
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
