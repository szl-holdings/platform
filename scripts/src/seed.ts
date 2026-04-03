// @ts-nocheck
import {
  db,
  pool,
  projectsTable,
  usersTable,
  rolesTable,
  userRolesTable,
  sessionsTable,
  organizationsTable,
  orgMembersTable,
  connectorsTable,
  connectorLogsTable,
  notificationsTable,
  notificationPreferencesTable,
  activityLogTable,
  auditEventsTable,
  apiKeysTable,
  featureFlagsTable,
  featureFlagOverridesTable,
  billingPlansTable,
  subscriptionsTable,
  invoicesTable,
  entitlementsTable,
  usageEventsTable,
  filesTable,
  assetsTable,
  appsRegistryTable,
  healthChecksTable,
  webhookEventsTable,
  stephenSiteTestimonialsTable,
  stephenSiteCaseStudiesTable,
  stephenSiteContactsTable,
  vesselsFleetsTable,
  vesselsTable,
  vesselsPositionsTable,
  vesselsCargoTable,
  vesselsRoutesTable,
  vesselsAlertRulesTable,
  vesselsAlertsTable,
  vesselsWeatherSnapshotsTable,
  vesselsSimulationsTable,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  firestormCampaignsTable,
  firestormLeadsTable,
  firestormAnalyticsTable,
  lyteWorkspacesTable,
  alloyWorkflowsTable,
  alloySignalsTable,
  alloyWorkflowRunsTable,
  alloyArtifactsTable,
  lyteActionsTable,
  lyteSavedViewsTable,
  lyteReadinessItemsTable,
  lyteSignalTimelineTable,
  voyagesTable,
  fleetExceptionsTable,
  corridorsTable,
  vesselMaintenanceTable,
  portsTable,
  lyteSignalsTable,
  lyteCommandCardsTable,
  lyteIncidentsTable,
  lytePlaybooksTable,
  lyteRecommendationsTable,
  dreamscapeProjectsTable,
  dreamscapeAssetsTable,
  dreamscapeCampaignsTable,
  dreamscapeScriptsTable,
  dreamscapeStoryboardsTable,
  dreamscapeVoiceAssetsTable,
  dreamscapeCampaignAssetsTable,
  dreamscapeReviewsTable,
  readinessProgramsTable,
  readinessDimensionsTable,
  readinessScoreHistoryTable,
  readinessMilestonesTable,
  readinessRisksTable,
  readinessAlertsTable,
  incaProjectsTable,
  incaExperimentsTable,
  incaModelsTable,
  incaInsightsTable,
  incaDatasetsTable,
  carlotaInquiriesTable,
  carlotaReservationsTable,
  carlotaServicesTable,
  carlotaClientProfilesTable,
  holdingsVenturesTable,
  holdingsMilestonesTable,
  holdingsMetricsTable,
  holdingsLeadershipTable,
  holdingsInquiriesTable,
} from "@szl-holdings/db";
import { randomBytes } from "crypto";

async function seed() {
  console.log("Seeding database...");

  console.log("  Clearing existing data...");
  await pool.query(`DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$`);
  console.log("  ✓ Tables cleared");


  const roles = await db.insert(rolesTable).values([
    { name: "super_admin", description: "Full platform access" },
    { name: "operator", description: "Day-to-day operational access" },
    { name: "analyst", description: "Read-only dashboards and analytics" },
    { name: "seller", description: "E-commerce and marketing tools" },
    { name: "client_viewer", description: "External client portal access" },
    { name: "creative_user", description: "Creative tools access" },
  ]).returning();
  console.log(`  ✓ ${roles.length} roles`);

  const users = await db.insert(usersTable).values([
    { displayName: "Stephen L.", email: "stephen@szlholdings.com", bio: "Founder & Technology Consultant", avatarUrl: null },
    { displayName: "Alex Rivera", email: "alex@szlholdings.com", bio: "Operations Lead", avatarUrl: null },
    { displayName: "Jordan Chen", email: "jordan@szlholdings.com", bio: "Data Analyst", avatarUrl: null },
    { displayName: "Morgan Blake", email: "morgan@szlholdings.com", bio: "Marketing Director", avatarUrl: null },
    { displayName: "Casey Torres", email: "casey@szlholdings.com", bio: "Creative Director", avatarUrl: null },
    { displayName: "Demo Client", email: "demo@client.example.com", bio: "External client account", avatarUrl: null },
  ]).returning();
  console.log(`  ✓ ${users.length} users`);

  const superAdminRole = roles.find((r) => r.name === "super_admin")!;
  const operatorRole = roles.find((r) => r.name === "operator")!;
  const analystRole = roles.find((r) => r.name === "analyst")!;
  const sellerRole = roles.find((r) => r.name === "seller")!;
  const clientRole = roles.find((r) => r.name === "client_viewer")!;
  const creativeRole = roles.find((r) => r.name === "creative_user")!;

  await db.insert(userRolesTable).values([
    { userId: users[0].id, roleId: superAdminRole.id },
    { userId: users[1].id, roleId: operatorRole.id },
    { userId: users[2].id, roleId: analystRole.id },
    { userId: users[3].id, roleId: sellerRole.id },
    { userId: users[4].id, roleId: creativeRole.id },
    { userId: users[5].id, roleId: clientRole.id },
  ]);
  console.log("  ✓ user roles assigned");

  const [org] = await db.insert(organizationsTable).values([
    { name: "SZL Holdings", slug: "szl-holdings", plan: "enterprise", domain: "szlholdings.com" },
  ]).returning();
  console.log("  ✓ organization created");

  await db.insert(orgMembersTable).values([
    { orgId: org.id, userId: users[0].id, role: "owner" },
    { orgId: org.id, userId: users[1].id, role: "admin" },
    { orgId: org.id, userId: users[2].id, role: "member" },
    { orgId: org.id, userId: users[3].id, role: "member" },
    { orgId: org.id, userId: users[4].id, role: "member" },
    { orgId: org.id, userId: users[5].id, role: "viewer" },
  ]);
  console.log("  ✓ org members");

  const connectors = await db.insert(connectorsTable).values([
    { orgId: org.id, name: "Stripe Payments", type: "stripe", status: "active" },
    { orgId: org.id, name: "Slack Workspace", type: "slack", status: "active" },
    { orgId: org.id, name: "GitHub Repos", type: "github", status: "active" },
    { orgId: org.id, name: "Google Workspace", type: "google", status: "pending" },
    { orgId: org.id, name: "Notion Docs", type: "notion", status: "inactive" },
  ]).returning();
  console.log(`  ✓ ${connectors.length} connectors`);

  await db.insert(connectorLogsTable).values([
    { connectorId: connectors[0].id, level: "info", message: "Stripe webhook verified successfully", metadata: { event: "payment_intent.succeeded" } },
    { connectorId: connectors[0].id, level: "info", message: "Payment processed: $299.00", metadata: { amount: 29900, currency: "usd" } },
    { connectorId: connectors[1].id, level: "warn", message: "Slack API rate limit approaching threshold", metadata: { remainingCalls: 12 } },
    { connectorId: connectors[3].id, level: "error", message: "Google OAuth token refresh failed", metadata: { error: "invalid_grant" } },
  ]);
  console.log("  ✓ connector logs");

  await db.insert(notificationsTable).values([
    { userId: users[0].id, type: "info", channel: "in_app", title: "Welcome to DreamStack", message: "Your platform is ready. Start by exploring the dashboard." },
    { userId: users[0].id, type: "success", channel: "in_app", title: "Stripe Connected", message: "Payment processing is now live." },
    { userId: users[1].id, type: "warning", channel: "in_app", title: "Vessel Alert", message: "MV Atlantic Voyager has deviated from planned route." },
    { userId: users[3].id, type: "action_required", channel: "in_app", title: "Campaign Review", message: "Q4 Launch campaign needs approval before going live." },
  ]);
  console.log("  ✓ notifications");

  await db.insert(notificationPreferencesTable).values([
    { userId: users[0].id, emailEnabled: true, smsEnabled: false, slackEnabled: true, inAppEnabled: true },
    { userId: users[1].id, emailEnabled: false, smsEnabled: false, slackEnabled: true, inAppEnabled: true },
    { userId: users[3].id, emailEnabled: true, smsEnabled: false, slackEnabled: false, inAppEnabled: true },
  ]);
  console.log("  ✓ notification preferences");

  await db.insert(activityLogTable).values([
    { userId: users[0].id, action: "login", resource: "auth", description: "User logged in" },
    { userId: users[0].id, action: "create", resource: "project", resourceId: "1", description: "Created project: SZL Portfolio Redesign" },
    { userId: users[1].id, action: "update", resource: "connector", resourceId: "1", description: "Updated Stripe connector configuration" },
  ]);
  console.log("  ✓ activity log");

  await db.insert(auditEventsTable).values([
    { userId: users[0].id, action: "login", entityType: "auth", entityId: "1", ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0" },
    { userId: users[0].id, action: "create", entityType: "connector", entityId: String(connectors[0].id) },
    { userId: users[1].id, action: "update", entityType: "organization", entityId: String(org.id), newValues: { billing: "enterprise" } },
  ]);
  console.log("  ✓ audit events");

  const sessions = await db.insert(sessionsTable).values([
    { userId: users[0].id, token: randomBytes(32).toString("hex"), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    { userId: users[1].id, token: randomBytes(32).toString("hex"), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  ]).returning();
  console.log(`  ✓ ${sessions.length} sessions`);

  await db.insert(apiKeysTable).values([
    { userId: users[0].id, name: "CI/CD Pipeline Key", keyHash: randomBytes(32).toString("hex"), keyPrefix: "szl_live_", scopes: ["read", "write"], expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    { userId: users[1].id, name: "Monitoring Service", keyHash: randomBytes(32).toString("hex"), keyPrefix: "szl_svc_", scopes: ["read"], expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  ]);
  console.log("  ✓ API keys");

  const featureFlags = await db.insert(featureFlagsTable).values([
    { key: "dark_mode", name: "Dark Mode", description: "Enable dark mode UI across all apps", isEnabled: true, rolloutPercentage: 100 },
    { key: "ai_assistant", name: "AI Assistant", description: "Enable AI-powered assistant in dashboard", isEnabled: true, rolloutPercentage: 50 },
    { key: "vessel_live_tracking", name: "Live Vessel Tracking", description: "Real-time AIS vessel position updates", isEnabled: false, rolloutPercentage: 0 },
    { key: "firestorm_ab_testing", name: "A/B Testing", description: "Campaign A/B testing features", isEnabled: true, rolloutPercentage: 25 },
    { key: "lyte_command_center", name: "Lyte Command Center", description: "Business observability command center", isEnabled: true, rolloutPercentage: 100 },
    { key: "readiness_pdf_export", name: "PDF Export", description: "Export readiness reports as PDF", isEnabled: true, rolloutPercentage: 100 },
  ]).returning();
  console.log(`  ✓ ${featureFlags.length} feature flags`);

  await db.insert(featureFlagOverridesTable).values([
    { flagId: featureFlags[1].id, entityType: "user", entityId: String(users[0].id), isEnabled: true },
    { flagId: featureFlags[4].id, entityType: "user", entityId: String(users[0].id), isEnabled: true },
    { flagId: featureFlags[2].id, entityType: "org", entityId: String(org.id), isEnabled: true },
  ]);
  console.log("  ✓ feature flag overrides");

  const plans = await db.insert(billingPlansTable).values([
    { name: "Free", slug: "free", description: "Basic access with limited features", priceMonthly: "0.00", priceYearly: "0.00", features: { apps: 1, users: 2, storage: "500MB" } },
    { name: "Starter", slug: "starter", description: "For small teams getting started", priceMonthly: "29.00", priceYearly: "290.00", features: { apps: 3, users: 5, storage: "5GB" } },
    { name: "Professional", slug: "professional", description: "Full suite for growing businesses", priceMonthly: "99.00", priceYearly: "990.00", features: { apps: 7, users: 25, storage: "50GB" } },
    { name: "Enterprise", slug: "enterprise", description: "Custom solutions for large organizations", priceMonthly: "299.00", priceYearly: "2990.00", features: { apps: "unlimited", users: "unlimited", storage: "500GB" } },
  ]).returning();
  console.log(`  ✓ ${plans.length} billing plans`);

  const [subscription] = await db.insert(subscriptionsTable).values([
    { orgId: org.id, planId: plans[3].id, status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  ]).returning();
  console.log("  ✓ subscription");

  await db.insert(invoicesTable).values([
    { subscriptionId: subscription.id, orgId: org.id, stripeInvoiceId: "in_test_001", amount: "299.00", currency: "usd", status: "paid", paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { subscriptionId: subscription.id, orgId: org.id, stripeInvoiceId: "in_test_002", amount: "299.00", currency: "usd", status: "paid", paidAt: new Date() },
    { subscriptionId: subscription.id, orgId: org.id, stripeInvoiceId: "in_test_003", amount: "299.00", currency: "usd", status: "open" },
  ]);
  console.log("  ✓ invoices");

  await db.insert(entitlementsTable).values([
    { planId: plans[0].id, featureKey: "apps", featureName: "Applications", type: "limit", limitValue: 1, description: "Number of apps allowed" },
    { planId: plans[0].id, featureKey: "users", featureName: "Team Members", type: "limit", limitValue: 2, description: "Number of team members" },
    { planId: plans[1].id, featureKey: "apps", featureName: "Applications", type: "limit", limitValue: 3, description: "Number of apps allowed" },
    { planId: plans[1].id, featureKey: "users", featureName: "Team Members", type: "limit", limitValue: 5, description: "Number of team members" },
    { planId: plans[2].id, featureKey: "apps", featureName: "Applications", type: "limit", limitValue: 7, description: "Number of apps allowed" },
    { planId: plans[2].id, featureKey: "audit_logs", featureName: "Audit Logs", type: "boolean", description: "Access to audit log history" },
    { planId: plans[3].id, featureKey: "apps", featureName: "Applications", type: "limit", limitValue: 999, description: "Unlimited apps" },
    { planId: plans[3].id, featureKey: "sso", featureName: "Single Sign-On", type: "boolean", description: "SSO integration support" },
    { planId: plans[3].id, featureKey: "webhooks", featureName: "Webhooks", type: "boolean", description: "Webhook delivery support" },
    { planId: plans[3].id, featureKey: "api_requests", featureName: "API Requests", type: "usage", limitValue: 100000, description: "Monthly API request limit" },
  ]);
  console.log("  ✓ entitlements");

  await db.insert(usageEventsTable).values([
    { orgId: org.id, featureKey: "api_requests", quantity: 1250, metadata: { endpoint: "/api/vessels" } },
    { orgId: org.id, featureKey: "api_requests", quantity: 840, metadata: { endpoint: "/api/firestorm" } },
    { orgId: org.id, featureKey: "api_requests", quantity: 320, metadata: { endpoint: "/api/projects" } },
    { orgId: org.id, featureKey: "api_requests", quantity: 95, metadata: { endpoint: "/api/admin" } },
    { orgId: org.id, featureKey: "api_requests", quantity: 560, metadata: { endpoint: "/api/billing" } },
    { orgId: org.id, featureKey: "api_requests", quantity: 420, metadata: { endpoint: "/api/auth" } },
    { orgId: org.id, featureKey: "webhooks", quantity: 15, metadata: { source: "stripe" } },
    { orgId: org.id, featureKey: "webhooks", quantity: 8, metadata: { source: "github" } },
  ]);
  console.log("  ✓ usage events");

  await db.insert(appsRegistryTable).values([
    { slug: "stephen-site", name: "Stephen L. Portfolio", description: "Personal portfolio and consulting showcase", icon: "Globe", color: "#6366f1", status: "active", version: "1.0.0", isPublic: true },
    { slug: "vessels", name: "Vessels Tracker", description: "Maritime vessel tracking and cargo management", icon: "Ship", color: "#06b6d4", status: "active", version: "0.5.0" },
    { slug: "firestorm", name: "Firestorm Marketing", description: "Campaign management and lead generation", icon: "Flame", color: "#f97316", status: "active", version: "0.3.0" },
    { slug: "lyte-command-center", name: "Lyte Command Center", description: "Business observability and operational decisions", icon: "Monitor", color: "#0ea5e9", status: "active", version: "1.0.0" },
    { slug: "dreamscape", name: "Dreamscape Creative", description: "Creative campaign engine for storytelling and media", icon: "Palette", color: "#f59e0b", status: "active", version: "1.0.0" },
    { slug: "readiness-report", name: "Lyte Readiness", description: "Operational readiness and maturity scoring module within Lyte", icon: "Shield", color: "#10b981", status: "active", version: "1.0.0" },
    { slug: "control-plane", name: "Admin Control Plane", description: "Platform administration and configuration", icon: "Settings", color: "#64748b", status: "active", version: "0.2.0" },
  ]);
  console.log("  ✓ apps registry");

  await db.insert(healthChecksTable).values([
    { service: "database", status: "healthy", responseTimeMs: 12 },
    { service: "api-server", status: "healthy", responseTimeMs: 5 },
    { service: "stripe", status: "healthy", responseTimeMs: 230 },
    { service: "slack", status: "degraded", responseTimeMs: 1500, details: { error: "Rate limited" } },
  ]);
  console.log("  ✓ health checks");

  await db.insert(webhookEventsTable).values([
    { source: "stripe", eventType: "payment_intent.succeeded", payload: { id: "pi_test_123", amount: 29900, currency: "usd" }, status: "processed", processedAt: new Date() },
    { source: "github", eventType: "push", payload: { ref: "refs/heads/main", repository: "szl-holdings/dreamstack" }, status: "processed", processedAt: new Date() },
    { source: "stripe", eventType: "invoice.payment_failed", payload: { id: "in_test_456", amount: 9900, currency: "usd" }, status: "failed", errorMessage: "Payment method declined" },
  ]);
  console.log("  ✓ webhook events");

  const files = await db.insert(filesTable).values([
    { userId: users[4].id, orgId: org.id, filename: "brand-guidelines.pdf", originalName: "brand-guidelines.pdf", mimeType: "application/pdf", size: 2450000, storageUrl: "/uploads/brand-guidelines.pdf", storageKey: "uploads/brand-guidelines.pdf", category: "document" as const },
    { userId: users[2].id, orgId: org.id, filename: "quarterly-report-q1.xlsx", originalName: "quarterly-report-q1.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 850000, storageUrl: "/uploads/quarterly-report-q1.xlsx", storageKey: "uploads/quarterly-report-q1.xlsx", category: "document" as const },
    { userId: users[4].id, orgId: org.id, filename: "logo-dark.svg", originalName: "logo-dark.svg", mimeType: "image/svg+xml", size: 15200, storageUrl: "/uploads/logo-dark.svg", storageKey: "uploads/logo-dark.svg", category: "image" as const },
  ]).returning();
  console.log(`  ✓ ${files.length} files`);

  await db.insert(assetsTable).values([
    { fileId: files[0].id, name: "Brand Guidelines", description: "Official SZL Holdings brand guidelines", tags: ["branding", "design"] },
    { fileId: files[1].id, name: "Q1 Report", description: "Quarterly financial report", tags: ["finance", "report"] },
    { fileId: files[2].id, name: "Dark Logo", description: "Logo for dark backgrounds", tags: ["branding", "logo"] },
  ]);
  console.log("  ✓ assets");

  const projects = await db.insert(projectsTable).values([
    { name: "SZL Portfolio Redesign", description: "Complete redesign of the SZL Holdings portfolio site", status: "active" },
    { name: "Vessels API Integration", description: "Integrate MarineTraffic API for live vessel data", status: "active" },
    { name: "Firestorm Campaign Engine", description: "Build automated campaign management system", status: "active" },
    { name: "Lyte Command Center Build", description: "Business observability command center for portfolio operations", status: "active" },
    { name: "Dreamscape Creative Pipeline", description: "Creative campaign engine for storytelling and media workflows", status: "active" },
    { name: "Lyte Readiness Module", description: "Portfolio-wide maturity scoring and readiness tracking within Lyte", status: "completed" },
    { name: "MSP Command Center", description: "Next-generation managed service provider platform for IT service delivery", status: "active" },
  ]).returning();
  console.log(`  ✓ ${projects.length} projects`);

  await db.insert(stephenSiteTestimonialsTable).values([
    { clientName: "Sarah Mitchell", clientTitle: "CTO", clientCompany: "TechVentures Inc.", content: "Stephen transformed our entire digital infrastructure. His strategic thinking and technical expertise are unmatched.", rating: 5, isPublished: true },
    { clientName: "David Park", clientTitle: "Founder", clientCompany: "NovaBright", content: "Working with Stephen was a game-changer. He delivered a scalable architecture that grew with our business.", rating: 5, isPublished: true },
    { clientName: "Rachel Torres", clientTitle: "VP of Engineering", clientCompany: "GlobalSync", content: "Exceptional attention to detail and deep understanding of modern cloud architecture. Highly recommended.", rating: 5, isPublished: true },
  ]);
  console.log("  ✓ testimonials");

  await db.insert(stephenSiteCaseStudiesTable).values([
    { title: "Enterprise Cloud Migration", slug: "enterprise-cloud-migration", client: "TechVentures Inc.", industry: "Technology", summary: "Migrated legacy on-premise infrastructure to AWS with zero downtime", technologies: ["AWS", "Terraform", "Docker", "Kubernetes"], isPublished: true, publishedAt: new Date() },
    { title: "Real-time Analytics Dashboard", slug: "realtime-analytics", client: "NovaBright", industry: "SaaS", summary: "Built a real-time analytics platform processing 10M+ events per day", technologies: ["React", "Node.js", "PostgreSQL", "Redis", "WebSockets"], isPublished: true, publishedAt: new Date() },
  ]);
  console.log("  ✓ case studies");

  await db.insert(stephenSiteContactsTable).values([
    { name: "John Reynolds", email: "john@enterprise.com", company: "Enterprise Solutions Ltd", message: "We are looking to migrate our on-premise infrastructure to the cloud. Would love to discuss options.", status: "replied" },
    { name: "Lisa Chang", email: "lisa@startuptech.io", company: "StartupTech", message: "Interested in building an MVP for our SaaS product. Can we schedule a call?", status: "new" },
  ]);
  console.log("  ✓ stephen site contacts");

  const fleets = await db.insert(vesselsFleetsTable).values([
    { name: "Pacific Fleet", description: "Trans-Pacific shipping operations", region: "Pacific Ocean", status: "active", vesselCount: 2 },
    { name: "Atlantic Fleet", description: "North Atlantic trade routes", region: "Atlantic Ocean", status: "active", vesselCount: 1 },
    { name: "Indian Ocean Fleet", description: "Middle East and South Asia routes", region: "Indian Ocean", status: "active", vesselCount: 1 },
  ]).returning();
  console.log(`  ✓ ${fleets.length} vessel fleets`);

  const vessels = await db.insert(vesselsTable).values([
    { fleetId: fleets[1].id, name: "MV Atlantic Voyager", imo: "9876543", vesselType: "container", flag: "Panama", yearBuilt: 2019, grossTonnage: "85000.00", status: "at_sea" },
    { fleetId: fleets[0].id, name: "SS Pacific Guardian", imo: "9876544", vesselType: "tanker", flag: "Liberia", yearBuilt: 2021, grossTonnage: "120000.00", status: "in_port" },
    { fleetId: fleets[0].id, name: "MV Northern Star", imo: "9876545", vesselType: "bulk", flag: "Marshall Islands", yearBuilt: 2017, grossTonnage: "75000.00", status: "at_sea" },
    { fleetId: fleets[2].id, name: "SS Gulf Explorer", imo: "9876546", vesselType: "cargo", flag: "Singapore", yearBuilt: 2020, grossTonnage: "45000.00", status: "anchored" },
    { fleetId: fleets[1].id, name: "MV Coral Breeze", imo: "9876547", vesselType: "container", flag: "Hong Kong", yearBuilt: 2022, grossTonnage: "92000.00", status: "at_sea" },
  ]).returning();
  console.log(`  ✓ ${vessels.length} vessels`);

  await db.insert(vesselsPositionsTable).values([
    { vesselId: vessels[0].id, latitude: "40.7128000", longitude: "-74.0060000", heading: "45.00", speed: "12.50", recordedAt: new Date() },
    { vesselId: vessels[0].id, latitude: "39.9526000", longitude: "-70.1233000", heading: "48.00", speed: "13.20", recordedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    { vesselId: vessels[1].id, latitude: "1.3521000", longitude: "103.8198000", heading: "0.00", speed: "0.00", recordedAt: new Date() },
    { vesselId: vessels[2].id, latitude: "51.5074000", longitude: "-0.1278000", heading: "180.00", speed: "15.30", recordedAt: new Date() },
    { vesselId: vessels[3].id, latitude: "25.2760000", longitude: "55.2962000", heading: "90.00", speed: "0.00", recordedAt: new Date() },
    { vesselId: vessels[4].id, latitude: "35.6762000", longitude: "-45.3210000", heading: "270.00", speed: "14.80", recordedAt: new Date() },
  ]);
  console.log("  ✓ vessel positions");

  await db.insert(vesselsCargoTable).values([
    { vesselId: vessels[0].id, cargoType: "Electronics", quantity: "2500.00", unit: "TEU", origin: "Shanghai", destination: "New York", status: "in_transit" },
    { vesselId: vessels[2].id, cargoType: "Iron Ore", quantity: "45000.00", unit: "MT", origin: "Sydney", destination: "Rotterdam", status: "in_transit" },
    { vesselId: vessels[3].id, cargoType: "Crude Oil", quantity: "80000.00", unit: "BBL", origin: "Dubai", destination: "Mumbai", status: "loading" },
    { vesselId: vessels[4].id, cargoType: "Automobiles", quantity: "1200.00", unit: "TEU", origin: "Hamburg", destination: "Baltimore", status: "in_transit" },
  ]);
  console.log("  ✓ vessel cargo");

  const routes = await db.insert(vesselsRoutesTable).values([
    { vesselId: vessels[0].id, originPort: "Shanghai", destinationPort: "New York", departureAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), arrivalAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), distanceNm: "11500.00", waypoints: [{ lat: 35.0, lng: 139.0, name: "Tokyo Bay" }, { lat: 21.3, lng: -157.8, name: "Honolulu" }, { lat: 9.0, lng: -79.5, name: "Panama Canal" }], status: "active" },
    { vesselId: vessels[1].id, originPort: "Singapore", destinationPort: "Singapore", departureAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), distanceNm: "0.00", status: "completed" },
    { vesselId: vessels[2].id, originPort: "Sydney", destinationPort: "Rotterdam", departureAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), arrivalAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), distanceNm: "12200.00", waypoints: [{ lat: -33.9, lng: 18.4, name: "Cape Town" }, { lat: 36.1, lng: -5.3, name: "Gibraltar" }], status: "active" },
    { vesselId: vessels[4].id, originPort: "Hamburg", destinationPort: "Baltimore", departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), arrivalAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), distanceNm: "3800.00", status: "active" },
  ]).returning();
  console.log("  ✓ vessel routes");

  const alertRules = await db.insert(vesselsAlertRulesTable).values([
    { name: "Speed Limit Violation", description: "Alert when vessel exceeds 18 knots in restricted zone", ruleType: "speed", conditions: { maxSpeed: 18, zone: "coastal" }, severity: "high" },
    { name: "Weather Warning", description: "Alert for severe weather along route", ruleType: "weather", conditions: { windSpeed: 40, waveHeight: 4.0 }, severity: "critical" },
    { name: "Geofence Breach", description: "Alert when vessel exits designated corridor", ruleType: "geofence", conditions: { corridorWidth: 50 }, severity: "medium" },
    { name: "Schedule Delay", description: "Alert when ETA exceeds 12 hours past schedule", ruleType: "schedule", conditions: { delayHours: 12 }, severity: "medium" },
    { name: "Maintenance Due", description: "Alert for upcoming maintenance schedule", ruleType: "maintenance", conditions: { daysBefore: 30 }, severity: "low" },
  ]).returning();
  console.log(`  ✓ ${alertRules.length} alert rules`);

  await db.insert(vesselsAlertsTable).values([
    { ruleId: alertRules[1].id, vesselId: vessels[0].id, title: "Severe Weather Warning", message: "Storm system detected ahead on planned route. Wind speeds expected to reach 45 knots.", severity: "critical", status: "active", metadata: { windSpeed: 45, waveHeight: 5.2, location: "North Atlantic" } },
    { ruleId: alertRules[0].id, vesselId: vessels[2].id, title: "Speed Limit Exceeded", message: "MV Northern Star recorded 19.2 knots in Strait of Gibraltar restricted zone.", severity: "high", status: "acknowledged", metadata: { recordedSpeed: 19.2, limit: 18 } },
    { ruleId: alertRules[3].id, vesselId: vessels[4].id, title: "Schedule Deviation", message: "MV Coral Breeze is running 14 hours behind schedule due to port congestion.", severity: "medium", status: "active", metadata: { delayHours: 14, cause: "port congestion" } },
    { ruleId: alertRules[2].id, vesselId: vessels[0].id, title: "Route Deviation Detected", message: "MV Atlantic Voyager deviated 12nm from planned corridor near Azores.", severity: "medium", status: "resolved", metadata: { deviationNm: 12 }, resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ]);
  console.log("  ✓ vessel alerts");

  await db.insert(vesselsWeatherSnapshotsTable).values([
    { routeId: routes[0].id, location: "Mid-Atlantic", latitude: "38.5000000", longitude: "-55.0000000", temperature: "14.00", windSpeed: "35.00", windDirection: "NW", waveHeight: "3.50", visibility: "8.00", description: "Strong winds, moderate seas", riskLevel: "moderate" },
    { routeId: routes[0].id, location: "North Atlantic Storm", latitude: "42.0000000", longitude: "-50.0000000", temperature: "8.00", windSpeed: "48.00", windDirection: "W", waveHeight: "5.50", visibility: "3.00", description: "Storm system with heavy seas", riskLevel: "severe" },
    { routeId: routes[2].id, location: "Cape of Good Hope", latitude: "-34.3500000", longitude: "18.4700000", temperature: "20.00", windSpeed: "22.00", windDirection: "SE", waveHeight: "2.00", visibility: "15.00", description: "Fair conditions", riskLevel: "low" },
    { routeId: routes[2].id, location: "Bay of Biscay", latitude: "45.0000000", longitude: "-5.0000000", temperature: "12.00", windSpeed: "30.00", windDirection: "SW", waveHeight: "3.00", visibility: "10.00", description: "Moderate winds", riskLevel: "moderate" },
    { routeId: routes[3].id, location: "English Channel", latitude: "50.5000000", longitude: "-1.5000000", temperature: "10.00", windSpeed: "15.00", windDirection: "W", waveHeight: "1.20", visibility: "12.00", description: "Calm conditions", riskLevel: "low" },
  ]);
  console.log("  ✓ weather snapshots");

  await db.insert(vesselsSimulationsTable).values([
    { routeId: routes[0].id, vesselId: vessels[0].id, name: "Atlantic Route Risk Analysis", description: "Full route risk assessment for Shanghai-New York passage", simulationType: "route_risk", status: "completed", riskScore: "62.50", parameters: { includeWeather: true, includeTraffic: true }, results: { overallRisk: "62.50", weatherRisk: "35.00", routeRisk: "20.00", scheduleRisk: "7.50", recommendations: ["Consider southern route to avoid storm system", "Reduce speed in approach to Panama Canal"] }, startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000) },
    { routeId: routes[2].id, vesselId: vessels[2].id, name: "Sydney-Rotterdam Weather Impact", description: "Weather impact analysis for bulk carrier route", simulationType: "weather_impact", status: "completed", riskScore: "38.00", parameters: { forecastDays: 14 }, results: { overallRisk: "38.00", weatherRisk: "22.00", routeRisk: "10.00", scheduleRisk: "6.00", recommendations: ["Current conditions favorable", "Monitor Bay of Biscay forecast updates"] }, startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 11 * 60 * 60 * 1000) },
    { routeId: routes[3].id, vesselId: vessels[4].id, name: "Hamburg-Baltimore Fuel Optimization", simulationType: "fuel_optimization", status: "completed", riskScore: "28.00", parameters: { optimizeFor: "fuel" }, results: { overallRisk: "28.00", fuelSavings: "4.2%", recommendedSpeed: "13.5 knots" }, startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  ]);
  console.log("  ✓ vessel simulations");

  const fsScenarios = await db.insert(firestormScenariosTable).values([
    { name: "Phishing Campaign Simulation", description: "Controlled phishing email simulation to test employee awareness and response protocols", category: "social_engineering", severity: "high", complexity: "intermediate", attackVector: "Email", mitreTechnique: "T1566", expectedDuration: 48 },
    { name: "Network Perimeter Assessment", description: "Simulated external network scan and penetration attempt against public-facing infrastructure", category: "network", severity: "critical", complexity: "advanced", attackVector: "Network", mitreTechnique: "T1595", expectedDuration: 72 },
    { name: "Web Application Security Test", description: "OWASP Top 10 vulnerability assessment against web applications", category: "application", severity: "high", complexity: "intermediate", attackVector: "Web", mitreTechnique: "T1190", expectedDuration: 24 },
    { name: "Insider Threat Simulation", description: "Controlled simulation of insider threat scenarios including data exfiltration attempts", category: "insider_threat", severity: "critical", complexity: "expert", attackVector: "Internal", mitreTechnique: "T1567", expectedDuration: 96 },
    { name: "Cloud Infrastructure Review", description: "Assessment of cloud configuration security including IAM, networking, and storage", category: "cloud", severity: "medium", complexity: "intermediate", attackVector: "Cloud", mitreTechnique: "T1078", expectedDuration: 36 },
    { name: "Supply Chain Risk Analysis", description: "Evaluation of third-party dependencies and supply chain attack surfaces", category: "supply_chain", severity: "high", complexity: "advanced", attackVector: "Supply Chain", mitreTechnique: "T1195", expectedDuration: 120 },
    { name: "IoT Device Security Audit", description: "Security assessment of connected devices and IoT infrastructure", category: "iot", severity: "medium", complexity: "intermediate", attackVector: "Physical/Network", mitreTechnique: "T1200", expectedDuration: 48 },
    { name: "Physical Security Walkthrough", description: "Controlled physical security assessment including access control and surveillance", category: "physical", severity: "low", complexity: "basic", attackVector: "Physical", expectedDuration: 8 },
  ]).returning();
  console.log(`  ✓ ${fsScenarios.length} firestorm scenarios`);

  const fsAssessments = await db.insert(firestormAssessmentsTable).values([
    { name: "Q1 2026 Penetration Test", description: "Comprehensive quarterly penetration test of production environment", assessmentType: "penetration_test", status: "completed", scope: "Production infrastructure and web applications", targetEnvironment: "Production", assessorName: "Stephen L.", startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), overallRiskScore: "68.50", executiveSummary: "The assessment identified several areas requiring attention. Critical findings include unpatched systems and weak access controls. Immediate remediation recommended for critical and high severity findings." },
    { name: "Red Team Exercise Alpha", description: "Full-scope red team exercise simulating advanced persistent threat", assessmentType: "red_team", status: "in_progress", scope: "Entire organization including physical and digital assets", targetEnvironment: "All", assessorName: "Alex Rivera", startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), overallRiskScore: "72.00" },
    { name: "Cloud Security Assessment", description: "Focused assessment of AWS and Azure cloud infrastructure", assessmentType: "vulnerability_scan", status: "completed", scope: "Cloud infrastructure across AWS and Azure", targetEnvironment: "Cloud", assessorName: "Jordan Chen", startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), overallRiskScore: "45.00", executiveSummary: "Cloud infrastructure is generally well-configured. Minor findings related to over-permissive IAM roles and public S3 bucket policies." },
    { name: "Tabletop Exercise: Ransomware", description: "Executive tabletop exercise simulating ransomware incident response", assessmentType: "tabletop", status: "draft", scope: "Executive team incident response capabilities", targetEnvironment: "N/A", assessorName: "Stephen L." },
  ]).returning();
  console.log(`  ✓ ${fsAssessments.length} firestorm assessments`);

  const fsSimRuns = await db.insert(firestormSimulationRunsTable).values([
    { assessmentId: fsAssessments[0].id, scenarioId: fsScenarios[1].id, name: "External Perimeter Scan", status: "completed", mode: "controlled", durationSeconds: 3600, parameters: { ports: "1-65535", protocols: ["tcp", "udp"] }, results: { vulnerabilitiesFound: 7, criticalFindings: 1, highFindings: 3, mediumFindings: 3, controlsValidated: 12, overallScore: "65.00" }, startedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000 + 3600000) },
    { assessmentId: fsAssessments[0].id, scenarioId: fsScenarios[2].id, name: "Web App OWASP Scan", status: "completed", mode: "demo", durationSeconds: 1800, parameters: { targetUrls: ["app.example.com"] }, results: { vulnerabilitiesFound: 4, criticalFindings: 0, highFindings: 2, mediumFindings: 2, controlsValidated: 8, overallScore: "72.00" }, startedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000 + 1800000) },
    { assessmentId: fsAssessments[1].id, scenarioId: fsScenarios[0].id, name: "Phishing Test Wave 1", status: "completed", mode: "controlled", durationSeconds: 7200, parameters: { targets: 50, emailTemplate: "standard" }, results: { vulnerabilitiesFound: 12, criticalFindings: 2, highFindings: 4, mediumFindings: 6, controlsValidated: 5, overallScore: "55.00", clickRate: "24%", reportRate: "38%" }, startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 7200000) },
    { assessmentId: fsAssessments[1].id, scenarioId: fsScenarios[3].id, name: "Insider Threat Sim", status: "running", mode: "demo", startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ]).returning();
  console.log(`  ✓ ${fsSimRuns.length} firestorm simulation runs`);

  await db.insert(firestormFindingsTable).values([
    { assessmentId: fsAssessments[0].id, simulationRunId: fsSimRuns[0].id, title: "Unpatched Apache Server", description: "Apache HTTP Server version 2.4.49 with known path traversal vulnerability (CVE-2021-41773)", severity: "critical", status: "confirmed", category: "Vulnerability", affectedAsset: "web-server-01.prod", impact: "Remote code execution possible through path traversal", recommendation: "Immediately upgrade Apache to latest stable version. Apply WAF rules as interim mitigation.", cvssScore: "9.80" },
    { assessmentId: fsAssessments[0].id, simulationRunId: fsSimRuns[0].id, title: "Weak SSH Configuration", description: "SSH server allows password-based authentication and outdated key exchange algorithms", severity: "high", status: "mitigated", category: "Configuration", affectedAsset: "bastion-01.prod", impact: "Potential brute-force attacks and downgrade attacks", recommendation: "Enforce key-based authentication only. Disable weak ciphers and key exchange algorithms.", cvssScore: "7.50" },
    { assessmentId: fsAssessments[0].id, simulationRunId: fsSimRuns[1].id, title: "Cross-Site Scripting (Reflected)", description: "Reflected XSS vulnerability in search parameter of main application", severity: "high", status: "open", category: "Web Application", affectedAsset: "app.example.com/search", impact: "Session hijacking, credential theft via crafted URLs", recommendation: "Implement proper input sanitization and Content Security Policy headers.", cvssScore: "6.10" },
    { assessmentId: fsAssessments[0].id, simulationRunId: fsSimRuns[1].id, title: "Missing Security Headers", description: "Application missing X-Content-Type-Options, X-Frame-Options, and Strict-Transport-Security headers", severity: "medium", status: "open", category: "Configuration", affectedAsset: "app.example.com", impact: "Increased risk of clickjacking and MIME type confusion attacks", recommendation: "Configure appropriate security headers in web server and application responses.", cvssScore: "4.30" },
    { assessmentId: fsAssessments[1].id, simulationRunId: fsSimRuns[2].id, title: "High Phishing Susceptibility", description: "24% of targeted employees clicked phishing links. 8% entered credentials on fake login page.", severity: "high", status: "confirmed", category: "Human Factor", affectedAsset: "Organization-wide", impact: "Significant credential compromise risk across organization", recommendation: "Implement mandatory security awareness training. Deploy additional email filtering controls.", cvssScore: "7.00" },
    { assessmentId: fsAssessments[1].id, simulationRunId: fsSimRuns[2].id, title: "Low Incident Reporting Rate", description: "Only 38% of employees reported the phishing email to the security team", severity: "medium", status: "open", category: "Process", affectedAsset: "Security Operations", impact: "Delayed incident detection and response", recommendation: "Simplify phishing reporting process. Add one-click report button to email client.", cvssScore: "5.00" },
    { assessmentId: fsAssessments[2].id, title: "Over-Permissive IAM Roles", description: "3 IAM roles with AdministratorAccess policy attached to service accounts", severity: "high", status: "confirmed", category: "Access Control", affectedAsset: "AWS IAM", impact: "Privilege escalation and lateral movement risk", recommendation: "Apply principle of least privilege. Create specific policies per service account.", cvssScore: "8.00" },
    { assessmentId: fsAssessments[2].id, title: "Public S3 Bucket", description: "S3 bucket 'company-backups' has public read access enabled", severity: "critical", status: "mitigated", category: "Data Exposure", affectedAsset: "s3://company-backups", impact: "Potential exposure of sensitive backup data", recommendation: "Remove public access. Enable S3 Block Public Access at account level.", cvssScore: "9.10" },
  ]);
  console.log("  ✓ firestorm findings");

  await db.insert(firestormRiskScoresTable).values([
    { assessmentId: fsAssessments[0].id, category: "Network Security", likelihood: 4, impact: 5, currentScore: "80.00", residualScore: "45.00", trend: "improving", notes: "Significant improvement after patching campaign" },
    { assessmentId: fsAssessments[0].id, category: "Application Security", likelihood: 3, impact: 4, currentScore: "60.00", residualScore: "35.00", trend: "stable", notes: "Web application vulnerabilities being addressed" },
    { assessmentId: fsAssessments[0].id, category: "Access Control", likelihood: 3, impact: 5, currentScore: "75.00", residualScore: "40.00", trend: "improving" },
    { assessmentId: fsAssessments[0].id, category: "Data Protection", likelihood: 2, impact: 5, currentScore: "50.00", residualScore: "30.00", trend: "stable" },
    { assessmentId: fsAssessments[1].id, category: "Human Factor", likelihood: 4, impact: 4, currentScore: "64.00", residualScore: "40.00", trend: "degrading", notes: "Phishing susceptibility higher than expected" },
    { assessmentId: fsAssessments[1].id, category: "Incident Response", likelihood: 3, impact: 4, currentScore: "48.00", residualScore: "28.00", trend: "stable" },
    { assessmentId: fsAssessments[2].id, category: "Cloud Security", likelihood: 3, impact: 4, currentScore: "48.00", residualScore: "25.00", trend: "improving", notes: "Cloud posture improving with automated remediation" },
    { assessmentId: fsAssessments[2].id, category: "Identity & Access", likelihood: 4, impact: 5, currentScore: "80.00", residualScore: "50.00", trend: "degrading", notes: "IAM role sprawl needs attention" },
  ]);
  console.log("  ✓ firestorm risk scores");

  const fsCampaigns = await db.insert(firestormCampaignsTable).values([
    { name: "Q1 Security Awareness", description: "Quarterly security awareness and phishing simulation campaign", type: "awareness", status: "active", targetAudience: { roles: ["All employees"] }, budget: "5000", startDate: new Date("2026-01-15"), endDate: new Date("2026-03-31") },
    { name: "Executive Threat Briefing", description: "Monthly executive threat intelligence briefing series", type: "briefing", status: "active", targetAudience: { roles: ["C-Suite", "VPs"] }, budget: "2000", startDate: new Date("2026-02-01"), endDate: new Date("2026-06-30") },
    { name: "Vendor Risk Communication", description: "Supply chain and vendor risk notification campaign", type: "notification", status: "draft", targetAudience: { roles: ["Procurement team"] }, budget: "1500" },
  ]).returning();
  console.log(`  ✓ ${fsCampaigns.length} firestorm campaigns`);

  await db.insert(firestormLeadsTable).values([
    { campaignId: fsCampaigns[0].id, firstName: "IT Security", lastName: "Team", email: "security@szlholdings.com", company: "SZL Holdings", title: "Security Analyst", source: "internal", status: "contacted", score: 90 },
    { campaignId: fsCampaigns[0].id, firstName: "HR", lastName: "Department", email: "hr@szlholdings.com", company: "SZL Holdings", title: "HR Manager", source: "internal", status: "engaged", score: 75 },
    { campaignId: fsCampaigns[1].id, firstName: "Stephen", lastName: "L.", email: "stephen@szlholdings.com", company: "SZL Holdings", title: "CEO", source: "internal", status: "contacted", score: 95 },
    { campaignId: fsCampaigns[1].id, firstName: "Alex", lastName: "Rivera", email: "alex@szlholdings.com", company: "SZL Holdings", title: "COO", source: "internal", status: "new", score: 80 },
  ]);
  console.log("  ✓ firestorm leads");

  await db.insert(firestormAnalyticsTable).values([
    { campaignId: fsCampaigns[0].id, date: new Date("2026-03-01"), impressions: 1200, clicks: 864, conversions: 540, spend: "150.00", revenue: "0" },
    { campaignId: fsCampaigns[0].id, date: new Date("2026-03-08"), impressions: 1350, clicks: 972, conversions: 607, spend: "150.00", revenue: "0" },
    { campaignId: fsCampaigns[0].id, date: new Date("2026-03-15"), impressions: 1100, clicks: 792, conversions: 495, spend: "150.00", revenue: "0" },
    { campaignId: fsCampaigns[1].id, date: new Date("2026-03-01"), impressions: 50, clicks: 44, conversions: 44, spend: "100.00", revenue: "0" },
    { campaignId: fsCampaigns[1].id, date: new Date("2026-03-15"), impressions: 50, clicks: 46, conversions: 45, spend: "100.00", revenue: "0" },
  ]);
  console.log("  ✓ firestorm analytics");

  const [lyteWorkspace] = await db.insert(lyteWorkspacesTable).values([
    { name: "SZL Operations Hub", description: "Primary command center for SZL Holdings portfolio operations", ownerId: String(users[0].id), settings: { timezone: "America/New_York", alertThreshold: "medium" } },
  ]).returning();
  console.log("  ✓ Lyte workspace");

  await db.insert(lyteSignalsTable).values([
    { workspaceId: lyteWorkspace.id, source: "Stripe", sourceType: "connector", severity: "info", title: "Payment volume spike detected", body: "Transaction volume increased 35% over the last 4 hours compared to baseline", status: "new", metadata: { volumeIncrease: "35%", timeframe: "4h" } },
    { workspaceId: lyteWorkspace.id, source: "Slack", sourceType: "connector", severity: "medium", title: "Slack API rate limit warning", body: "Approaching Slack API rate limits. 12 remaining calls in current window.", status: "acknowledged", metadata: { remainingCalls: 12 } },
    { workspaceId: lyteWorkspace.id, source: "Monitoring", sourceType: "monitoring", severity: "critical", title: "API response time degradation", body: "P95 latency has exceeded 2000ms on the /api/projects endpoint for 15 minutes", status: "new", metadata: { endpoint: "/api/projects", p95: "2340ms" } },
    { workspaceId: lyteWorkspace.id, source: "Scheduler", sourceType: "scheduler", severity: "low", title: "Scheduled backup completed", body: "Daily database backup completed successfully. Size: 2.4GB", status: "resolved", metadata: { backupSize: "2.4GB" } },
    { workspaceId: lyteWorkspace.id, source: "GitHub", sourceType: "webhook", severity: "info", title: "Deployment succeeded", body: "Production deployment v2.4.1 completed on main branch", status: "resolved", metadata: { version: "v2.4.1", branch: "main" } },
    { workspaceId: lyteWorkspace.id, source: "Monitoring", sourceType: "monitoring", severity: "high", title: "Error rate spike on vessel service", body: "Error rate on Vessels API exceeded 5% threshold. Currently at 8.2%", status: "new", metadata: { errorRate: "8.2%", threshold: "5%" } },
    { workspaceId: lyteWorkspace.id, source: "Google", sourceType: "connector", severity: "medium", title: "Google OAuth token refresh failed", body: "Unable to refresh OAuth token for Google Workspace integration", status: "new", metadata: { error: "invalid_grant" } },
  ]);
  console.log("  ✓ Lyte signals");

  await db.insert(lyteCommandCardsTable).values([
    { workspaceId: lyteWorkspace.id, title: "Investigate API latency spike", description: "P95 latency on projects endpoint exceeds SLA. Root cause analysis needed.", category: "operations", priority: "critical", status: "in_progress", assignee: "Alex Rivera" },
    { workspaceId: lyteWorkspace.id, title: "Review Q1 revenue projections", description: "Quarterly revenue forecast needs executive review before board meeting", category: "finance", priority: "high", status: "pending", assignee: "Stephen L.", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { workspaceId: lyteWorkspace.id, title: "Update compliance documentation", description: "Annual SOC 2 compliance docs need refresh with new service additions", category: "compliance", priority: "medium", status: "pending", assignee: "Jordan Chen" },
    { workspaceId: lyteWorkspace.id, title: "Scale vessel tracking ingestion", description: "AIS data volume increasing. Need to evaluate scaling options.", category: "strategy", priority: "medium", status: "pending" },
    { workspaceId: lyteWorkspace.id, title: "Launch Firestorm campaign analytics v2", description: "New analytics dashboard ready for production deployment", category: "growth", priority: "high", status: "completed", assignee: "Morgan Blake" },
  ]);
  console.log("  ✓ Lyte command cards");

  await db.insert(lyteIncidentsTable).values([
    { workspaceId: lyteWorkspace.id, title: "API Gateway 503 errors", description: "Intermittent 503 errors on API gateway affecting 2% of requests. Load balancer health checks failing on node-3.", severity: "high", status: "investigating", assignee: "Alex Rivera", impactArea: "API Infrastructure" },
    { workspaceId: lyteWorkspace.id, title: "Stripe webhook delivery delay", description: "Stripe webhooks delayed by 5-10 minutes. Payment status updates not reflecting in real-time.", severity: "medium", status: "mitigating", assignee: "Stephen L.", impactArea: "Payments" },
    { workspaceId: lyteWorkspace.id, title: "Database connection pool exhaustion", description: "Connection pool reached maximum capacity during peak hours. Implemented connection pooling with PgBouncer.", severity: "critical", status: "resolved", assignee: "Alex Rivera", impactArea: "Database", rootCause: "Missing connection pool limits", resolution: "Added PgBouncer and set max connections to 100", resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ]);
  console.log("  ✓ Lyte incidents");

  await db.insert(lytePlaybooksTable).values([
    { workspaceId: lyteWorkspace.id, title: "API Outage Response", description: "Step-by-step guide for handling API outages", category: "incident_response", content: "# API Outage Response\n\n## 1. Triage\n- Check API gateway health dashboard\n- Verify database connectivity\n- Check upstream service status\n\n## 2. Communication\n- Post in #incidents Slack channel\n- Notify on-call team lead\n\n## 3. Mitigation\n- Enable circuit breaker if needed\n- Scale up API pods\n- Redirect traffic if regional\n\n## 4. Resolution\n- Deploy hotfix if code issue\n- Restart services if transient\n- Document timeline\n\n## 5. Post-mortem\n- Schedule within 48 hours\n- Document root cause\n- Create follow-up tasks", version: 2, isPublished: true, tags: ["api", "outage", "critical"] },
    { workspaceId: lyteWorkspace.id, title: "New Connector Onboarding", description: "Process for adding a new third-party connector", category: "onboarding", content: "# Connector Onboarding\n\n## Prerequisites\n- API documentation reviewed\n- Security assessment completed\n- Data mapping defined\n\n## Steps\n1. Create connector entry in admin panel\n2. Configure OAuth or API key\n3. Set up webhook endpoints\n4. Test data flow in staging\n5. Deploy to production\n6. Monitor for 24 hours", version: 1, isPublished: true, tags: ["connector", "integration"] },
    { workspaceId: lyteWorkspace.id, title: "Security Incident Escalation", description: "Escalation procedures for security incidents", category: "escalation", content: "# Security Incident Escalation\n\n## Severity Levels\n- P1: Data breach, unauthorized access\n- P2: Vulnerability exploitation\n- P3: Suspicious activity, failed attacks\n\n## Escalation Path\n1. Security team on-call\n2. VP of Engineering\n3. CEO (P1 only)\n\n## Actions\n- Isolate affected systems\n- Preserve evidence\n- Notify legal if P1", version: 1, isPublished: true, tags: ["security", "escalation"] },
    { workspaceId: lyteWorkspace.id, title: "Daily Operations Checklist", description: "Morning operations verification checklist", category: "operations", content: "# Daily Ops Checklist\n\n- [ ] Verify all services healthy\n- [ ] Check error rates < 1%\n- [ ] Review overnight alerts\n- [ ] Confirm backups succeeded\n- [ ] Check API response times\n- [ ] Review pending deployments\n- [ ] Check disk space usage", version: 3, isPublished: true, tags: ["daily", "operations", "checklist"] },
  ]);
  console.log("  ✓ Lyte playbooks");

  await db.insert(lyteRecommendationsTable).values([
    { workspaceId: lyteWorkspace.id, title: "Implement auto-scaling for API servers", description: "Based on recurring latency spikes during peak hours, implementing horizontal auto-scaling could reduce P95 latency by 40% and prevent SLA breaches.", category: "operational", impact: "high", effort: "medium", status: "suggested", actionItems: ["Evaluate Kubernetes HPA", "Set CPU threshold at 70%", "Configure min/max replicas"] },
    { workspaceId: lyteWorkspace.id, title: "Consolidate monitoring tools", description: "Currently using 3 separate monitoring solutions. Consolidating to a single observability platform could save $2,400/month and reduce context switching.", category: "cost_optimization", impact: "medium", effort: "high", status: "suggested", actionItems: ["Evaluate Grafana Cloud", "Migration plan", "Team training"] },
    { workspaceId: lyteWorkspace.id, title: "Enable MFA for all admin accounts", description: "3 admin accounts lack multi-factor authentication. This is a critical security gap that should be addressed immediately.", category: "risk_mitigation", impact: "high", effort: "low", status: "accepted", actionItems: ["Audit admin accounts", "Enable TOTP/WebAuthn", "Update security policy"] },
    { workspaceId: lyteWorkspace.id, title: "Launch customer feedback loop", description: "Implementing a structured feedback collection process could increase customer retention by 15% based on industry benchmarks.", category: "growth", impact: "medium", effort: "medium", status: "suggested", actionItems: ["Choose survey tool", "Design feedback forms", "Set up automation"] },
  ]);
  console.log("  ✓ Lyte recommendations");

  const dProjects = await db.insert(dreamscapeProjectsTable).values([
    { name: "SZL Brand Story 2026", description: "Full brand narrative video series showcasing SZL Holdings evolution and vision", clientName: "SZL Holdings", type: "brand_story", status: "production", mood: "inspiring", colorPalette: { primary: "#1e40af", secondary: "#f59e0b" } },
    { name: "Vessels Fleet Showcase", description: "Commercial video highlighting maritime fleet capabilities", clientName: "Vessels Division", type: "commercial", status: "pre_production" },
    { name: "Firestorm Product Launch", description: "Social media campaign assets for Firestorm marketing platform launch", clientName: "Firestorm Team", type: "product_launch", status: "review" },
    { name: "Internal Culture Documentary", description: "Documentary-style video about SZL company culture and team", clientName: "HR Department", type: "documentary", status: "concept" },
  ]).returning();
  console.log(`  ✓ ${dProjects.length} Dreamscape projects`);

  await db.insert(dreamscapeAssetsTable).values([
    { projectId: dProjects[0].id, name: "SZL Logo Pack", type: "image" },
    { projectId: dProjects[0].id, name: "Drone Footage - City", type: "video", metadata: { resolution: "4K", duration: "45s" } },
    { projectId: dProjects[2].id, name: "Firestorm UI Screenshots", type: "image" },
  ]);
  console.log("  ✓ Dreamscape assets");

  const dCampaigns = await db.insert(dreamscapeCampaignsTable).values([
    { name: "SZL Brand Story 2026", description: "Full brand narrative video series showcasing SZL Holdings evolution and vision", clientName: "SZL Holdings", status: "production", category: "brand_story", targetAudience: "Investors, Partners, Enterprise Clients", deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    { name: "Vessels Fleet Showcase", description: "Commercial video highlighting maritime fleet capabilities and tracking technology", clientName: "Vessels Division", status: "pre_production", category: "commercial", targetAudience: "Shipping companies, logistics partners" },
    { name: "Firestorm Product Launch", description: "Social media campaign assets for Firestorm marketing platform launch", clientName: "Firestorm Team", status: "review", category: "product_launch", targetAudience: "Marketing professionals, SMBs" },
    { name: "Internal Culture Documentary", description: "Documentary-style video about SZL company culture and team", clientName: "HR Department", status: "concept", category: "documentary", targetAudience: "Internal employees, recruits" },
  ]).returning();
  console.log(`  ✓ ${dCampaigns.length} Dreamscape campaigns`);

  const dScripts = await db.insert(dreamscapeScriptsTable).values([
    { campaignId: dCampaigns[0].id, title: "Brand Story - Episode 1: Origins", content: "FADE IN:\n\nEXT. CITY SKYLINE - DAWN\n\nNARRATOR (V.O.)\nEvery great journey begins with a single step. For SZL Holdings, that step was taken in a small office in 2020...\n\nCUT TO:\nINT. MODERN OFFICE - DAY\n\nStephen sits at his desk, multiple monitors displaying code and dashboards.\n\nNARRATOR (V.O.)\nWhat started as a vision to unify technology consulting has grown into a portfolio of innovative solutions...\n\nMONTAGE: Various SZL products in action - Vessels tracking ships, Firestorm campaigns running, Dreamscape creative workflows...", version: 3, status: "approved", notes: "Final approved version after client feedback" },
    { campaignId: dCampaigns[0].id, title: "Brand Story - Episode 2: Innovation", content: "FADE IN:\n\nINT. TECH LAB - DAY\n\nNARRATOR (V.O.)\nInnovation isn't just about technology. It's about understanding what businesses truly need...\n\nSequence showing development of each platform tool...", version: 1, status: "draft" },
    { campaignId: dCampaigns[2].id, title: "Firestorm Launch - 30s Spot", content: "OPEN ON:\nFast-paced montage of marketing dashboards, lead scoring, campaign analytics.\n\nVO: \"Your campaigns. Supercharged.\"\n\nProduct demo footage. Clean UI. Data flowing.\n\nVO: \"Firestorm by SZL Holdings. Marketing intelligence, reimagined.\"\n\nLOGO + CTA", version: 2, status: "review", notes: "Pending final voiceover recording" },
  ]).returning();
  console.log(`  ✓ ${dScripts.length} Dreamscape scripts`);

  await db.insert(dreamscapeStoryboardsTable).values([
    { campaignId: dCampaigns[0].id, scriptId: dScripts[0].id, title: "Opening skyline shot", sceneNumber: 1, visualDescription: "Wide aerial drone shot of city skyline at dawn. Golden hour lighting. Camera slowly pushes forward.", dialogue: "", duration: "8s" },
    { campaignId: dCampaigns[0].id, scriptId: dScripts[0].id, title: "Office introduction", sceneNumber: 2, visualDescription: "Medium shot of modern office. Founder at desk with multiple monitors. Clean, professional environment.", dialogue: "Every great journey begins with a single step...", duration: "12s" },
    { campaignId: dCampaigns[0].id, scriptId: dScripts[0].id, title: "Product montage", sceneNumber: 3, visualDescription: "Quick cuts between different SZL products. Screen recordings of dashboards. Fast-paced editing.", dialogue: "What started as a vision to unify technology...", duration: "15s" },
    { campaignId: dCampaigns[0].id, scriptId: dScripts[0].id, title: "Team collaboration", sceneNumber: 4, visualDescription: "Team meeting in conference room. Whiteboard with diagrams. Collaborative energy.", dialogue: "", duration: "10s" },
    { campaignId: dCampaigns[2].id, title: "Firestorm hero shot", sceneNumber: 1, visualDescription: "Screen capture of Firestorm dashboard with animated data. Dark theme with orange accents.", duration: "5s" },
    { campaignId: dCampaigns[2].id, title: "Feature highlights", sceneNumber: 2, visualDescription: "Split screen showing lead scoring, campaign analytics, A/B testing features", duration: "10s" },
  ]);
  console.log("  ✓ Dreamscape storyboards");

  await db.insert(dreamscapeVoiceAssetsTable).values([
    { campaignId: dCampaigns[0].id, name: "Brand Story Narrator - Ep1", voiceId: "narrator_professional_1", provider: "placeholder", text: "Every great journey begins with a single step. For SZL Holdings, that step was taken in a small office in 2020...", status: "ready", duration: "45s" },
    { campaignId: dCampaigns[0].id, name: "Brand Story Narrator - Ep2", voiceId: "narrator_professional_1", provider: "placeholder", text: "Innovation isn't just about technology. It's about understanding what businesses truly need...", status: "pending", duration: "30s" },
    { campaignId: dCampaigns[2].id, name: "Firestorm VO - 30s Spot", provider: "placeholder", text: "Your campaigns. Supercharged. Firestorm by SZL Holdings. Marketing intelligence, reimagined.", status: "pending", duration: "8s" },
  ]);
  console.log("  ✓ Dreamscape voice assets");

  await db.insert(dreamscapeCampaignAssetsTable).values([
    { campaignId: dCampaigns[0].id, name: "SZL Logo Pack", type: "image", mimeType: "image/svg+xml", fileSize: 45200, tags: ["logo", "branding"] },
    { campaignId: dCampaigns[0].id, name: "Brand Color Palette", type: "document", mimeType: "application/pdf", fileSize: 128000, tags: ["branding", "colors"] },
    { campaignId: dCampaigns[0].id, name: "Drone Footage - City", type: "video", mimeType: "video/mp4", fileSize: 234000000, tags: ["footage", "aerial"] },
    { campaignId: dCampaigns[2].id, name: "Firestorm UI Screenshots", type: "image", mimeType: "image/png", fileSize: 3200000, tags: ["product", "screenshots"] },
    { campaignId: dCampaigns[2].id, name: "Background Music - Energetic", type: "audio", mimeType: "audio/mp3", fileSize: 8500000, tags: ["music", "background"] },
    { campaignId: dCampaigns[3].id, name: "Interview Template", type: "template", mimeType: "application/pdf", fileSize: 67000, tags: ["template", "interview"] },
  ]);
  console.log("  ✓ Dreamscape campaign assets");

  await db.insert(dreamscapeReviewsTable).values([
    { campaignId: dCampaigns[0].id, reviewerName: "Stephen L.", comment: "Brand story narrative is compelling. The opening sequence sets the right tone. Approved for production.", status: "approved" },
    { campaignId: dCampaigns[0].id, reviewerName: "Casey Torres", comment: "Storyboard flow is solid. Consider adding a customer testimonial segment between scenes 3 and 4.", status: "changes_requested" },
    { campaignId: dCampaigns[2].id, reviewerName: "Morgan Blake", comment: "The 30s spot script is punchy and on-brand. Ready for voiceover recording.", status: "approved" },
    { campaignId: dCampaigns[2].id, reviewerName: "Stephen L.", comment: "Would like to see more product detail in the feature highlights scene.", status: "changes_requested" },
  ]);
  console.log("  ✓ Dreamscape reviews");

  const [readinessProgram] = await db.insert(readinessProgramsTable).values([
    { name: "SZL Portfolio Readiness Q1 2026", description: "Comprehensive readiness assessment across the entire SZL Holdings portfolio", overallScore: "76.50", targetScore: "85.00", status: "active", owner: "Stephen L." },
  ]).returning();
  console.log("  ✓ Readiness program");

  const dimensions = await db.insert(readinessDimensionsTable).values([
    { programId: readinessProgram.id, name: "Technical Infrastructure", category: "technical", weight: "1.5", currentScore: "82.00", targetScore: "90.00", assessorName: "Alex Rivera", lastAssessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Security & Compliance", category: "security", weight: "2.0", currentScore: "71.00", targetScore: "90.00", assessorName: "Stephen L.", lastAssessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Operational Processes", category: "operational", weight: "1.0", currentScore: "85.00", targetScore: "85.00", assessorName: "Alex Rivera", lastAssessedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Financial Health", category: "financial", weight: "1.5", currentScore: "78.00", targetScore: "80.00", assessorName: "Jordan Chen", lastAssessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Strategic Alignment", category: "strategic", weight: "1.0", currentScore: "72.00", targetScore: "85.00", assessorName: "Stephen L.", lastAssessedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Team & People", category: "people", weight: "1.0", currentScore: "80.00", targetScore: "85.00", assessorName: "Casey Torres", lastAssessedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Process Maturity", category: "process", weight: "1.0", currentScore: "68.00", targetScore: "80.00", assessorName: "Alex Rivera", lastAssessedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    { programId: readinessProgram.id, name: "Compliance Framework", category: "compliance", weight: "1.5", currentScore: "74.00", targetScore: "90.00", assessorName: "Jordan Chen", lastAssessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  ]).returning();
  console.log(`  ✓ ${dimensions.length} readiness dimensions`);

  const scoreEntries = [];
  for (const dim of dimensions) {
    const baseScore = parseFloat(dim.currentScore ?? "70");
    for (let weekAgo = 12; weekAgo >= 0; weekAgo--) {
      const variance = (Math.random() - 0.3) * 8;
      const score = Math.max(40, Math.min(100, baseScore - (weekAgo * 1.5) + variance));
      scoreEntries.push({
        dimensionId: dim.id,
        programId: readinessProgram.id,
        score: score.toFixed(2),
        recordedAt: new Date(Date.now() - weekAgo * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }
  await db.insert(readinessScoreHistoryTable).values(scoreEntries);
  console.log(`  ✓ ${scoreEntries.length} readiness score history entries`);

  await db.insert(readinessMilestonesTable).values([
    { programId: readinessProgram.id, title: "SOC 2 Type II Certification", description: "Complete SOC 2 Type II audit and receive certification", status: "in_progress", dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), owner: "Stephen L." },
    { programId: readinessProgram.id, title: "DR Plan Testing", description: "Execute full disaster recovery plan test across all services", status: "pending", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), owner: "Alex Rivera" },
    { programId: readinessProgram.id, title: "API Gateway Migration", description: "Migrate from legacy API gateway to new cloud-native solution", status: "completed", dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), owner: "Alex Rivera" },
    { programId: readinessProgram.id, title: "Team Security Training", description: "Complete annual security awareness training for all team members", status: "overdue", dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), owner: "Casey Torres" },
    { programId: readinessProgram.id, title: "Financial Audit Prep", description: "Prepare all documentation for annual financial audit", status: "in_progress", dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), owner: "Jordan Chen" },
    { programId: readinessProgram.id, title: "Process Documentation Update", description: "Update all operational process documentation to current state", status: "pending", dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), owner: "Alex Rivera" },
  ]);
  console.log("  ✓ readiness milestones");

  await db.insert(readinessRisksTable).values([
    { programId: readinessProgram.id, dimensionId: dimensions[1].id, title: "Missing MFA on admin accounts", description: "3 admin accounts do not have multi-factor authentication enabled, creating a critical security vulnerability", severity: "critical", likelihood: "likely", status: "open", mitigation: "Enforce MFA for all admin-level accounts. Deadline: 7 days.", owner: "Stephen L." },
    { programId: readinessProgram.id, dimensionId: dimensions[0].id, title: "Single point of failure in database", description: "Primary database lacks automated failover. Manual intervention required during outages.", severity: "high", likelihood: "possible", status: "mitigating", mitigation: "Implementing PostgreSQL streaming replication with automatic failover", owner: "Alex Rivera" },
    { programId: readinessProgram.id, dimensionId: dimensions[6].id, title: "Outdated runbook documentation", description: "Several operational runbooks reference deprecated tools and processes", severity: "medium", likelihood: "likely", status: "open", mitigation: "Schedule documentation sprint to update all runbooks", owner: "Alex Rivera" },
    { programId: readinessProgram.id, dimensionId: dimensions[3].id, title: "Revenue concentration risk", description: "Top 3 clients represent 65% of revenue. Need diversification strategy.", severity: "high", likelihood: "possible", status: "open", owner: "Jordan Chen" },
    { programId: readinessProgram.id, dimensionId: dimensions[7].id, title: "GDPR data retention gaps", description: "Data retention policies not fully implemented for all services", severity: "medium", likelihood: "possible", status: "mitigating", mitigation: "Implementing automated data lifecycle management", owner: "Jordan Chen" },
  ]);
  console.log("  ✓ readiness risks");

  await db.insert(readinessAlertsTable).values([
    { programId: readinessProgram.id, dimensionId: dimensions[1].id, type: "score_drop", title: "Security score dropped below target", message: "Security & Compliance score dropped to 71.0, which is 19 points below the target of 90.0", severity: "critical" },
    { programId: readinessProgram.id, type: "milestone_overdue", title: "Team Security Training is overdue", message: "The 'Team Security Training' milestone was due 5 days ago and is still not completed", severity: "warning" },
    { programId: readinessProgram.id, dimensionId: dimensions[6].id, type: "target_missed", title: "Process Maturity below target", message: "Process Maturity score of 68.0 is 12 points below the target of 80.0", severity: "warning" },
    { programId: readinessProgram.id, dimensionId: dimensions[2].id, type: "improvement", title: "Operational Processes reached target", message: "Operational Processes score of 85.0 has reached the target score of 85.0", severity: "info", isRead: true },
    { programId: readinessProgram.id, type: "risk_escalation", title: "Critical risk requires immediate attention", message: "Missing MFA on admin accounts has been open for 14 days. Escalating to leadership.", severity: "critical" },
    { programId: readinessProgram.id, type: "general", title: "Quarterly assessment due", message: "Q2 2026 readiness assessment cycle begins in 30 days. Prepare assessment materials.", severity: "info" },
  ]);
  console.log("  ✓ readiness alerts");

  const incaProjects = await db.insert(incaProjectsTable).values([
    { name: "NLP Pipeline v3", description: "Next-gen natural language processing pipeline for document intelligence", status: "development", domain: "NLP", accuracy: "93.40", progress: 78, metadata: { framework: "PyTorch", cluster: "gpu-pool-01", owner: "Jordan Chen" } },
    { name: "Anomaly Detection Engine", description: "Real-time anomaly detection for financial transaction monitoring", status: "deployed", domain: "Anomaly Detection", accuracy: "91.00", progress: 100, metadata: { framework: "TensorFlow", dataset: "transactions-2025", owner: "Alex Rivera" } },
    { name: "Recommendation System", description: "ML-powered recommendation engine for portfolio optimization", status: "deployed", domain: "RecSys", accuracy: "94.20", progress: 100, metadata: { framework: "XGBoost", owner: "Stephen L." } },
    { name: "Computer Vision POC", description: "Proof of concept for automated document classification using vision models", status: "research", domain: "Computer Vision", progress: 15, metadata: { owner: "Jordan Chen" } },
  ]).returning();
  console.log(`  ✓ ${incaProjects.length} INCA projects`);

  const incaExperiments = await db.insert(incaExperimentsTable).values([
    { projectId: incaProjects[0].id, name: "BERT Fine-tune v1", hypothesis: "Fine-tuning BERT-base on domain corpus will reach >90% accuracy", status: "completed", hyperparameters: { learningRate: 2e-5, epochs: 10, batchSize: 32 }, results: "Accuracy: 91.2%, F1: 0.897, Loss: 0.234" },
    { projectId: incaProjects[0].id, name: "BERT Fine-tune v2", hypothesis: "Augmented data will improve F1 by 2%+", status: "running", hyperparameters: { learningRate: 3e-5, epochs: 15, batchSize: 16 }, results: "Accuracy: 93.4%, F1: 0.921 (in progress)" },
    { projectId: incaProjects[1].id, name: "Isolation Forest Baseline", hypothesis: "Isolation forests can detect >80% of anomalies", status: "completed", hyperparameters: { contamination: 0.01, nEstimators: 200 }, results: "Precision: 88%, Recall: 76%, AUC: 0.92" },
    { projectId: incaProjects[1].id, name: "Autoencoder v1", hypothesis: "Deep autoencoder will outperform isolation forest on high-dim data", status: "completed", hyperparameters: { encoderLayers: [128, 64, 32], latentDim: 16 }, results: "Precision: 91%, Recall: 84%, AUC: 0.95" },
    { projectId: incaProjects[2].id, name: "XGBoost Portfolio Model", hypothesis: "Gradient boosting can predict allocation with <5% RMSE", status: "completed", hyperparameters: { maxDepth: 8, nEstimators: 500, learningRate: 0.1 }, results: "RMSE: 3.2%, R²: 0.94" },
  ]).returning();
  console.log(`  ✓ ${incaExperiments.length} INCA experiments`);

  await db.insert(incaModelsTable).values([
    { projectId: incaProjects[0].id, name: "nlp-pipeline-bert-v2", architecture: "BERT-base (fine-tuned)", version: "2.1.0", status: "production", accuracy: "93.40", speed: 45, parameters: "110M", metadata: { gpuRequired: true, servingEndpoint: "/api/inca/predict/nlp" } },
    { projectId: incaProjects[1].id, name: "anomaly-autoencoder-v1", architecture: "Deep Autoencoder", version: "1.0.0", status: "production", accuracy: "91.00", speed: 12, parameters: "2.4M", metadata: { servingEndpoint: "/api/inca/predict/anomaly" } },
    { projectId: incaProjects[2].id, name: "portfolio-xgb-v1", architecture: "XGBoost", version: "1.2.0", status: "retired", accuracy: "94.20", speed: 8, parameters: "500 estimators" },
    { projectId: incaProjects[0].id, name: "nlp-pipeline-bert-v1", architecture: "BERT-base (fine-tuned)", version: "1.0.0", status: "retired", accuracy: "91.20", speed: 52, parameters: "110M" },
  ]);
  console.log("  ✓ INCA models");

  await db.insert(incaInsightsTable).values([
    { category: "discovery", title: "Training data augmentation improves F1 by 2.4%", description: "Adding synthetic paraphrase data to training set improved F1 score from 0.897 to 0.921. Recommend augmenting all future training runs.", impact: "high", confidence: 92, sourceExperiment: "BERT Fine-tune v2" },
    { category: "success", title: "Autoencoder outperforms Isolation Forest on high-dimensional data", description: "Deep autoencoder shows 8% improvement in recall over isolation forest baseline when feature dimensionality exceeds 50.", impact: "high", confidence: 88, sourceExperiment: "Autoencoder v1" },
    { category: "warning", title: "False positive rate needs attention", description: "Current model generates ~200 false positives per day. Recommend threshold tuning and adding business rule filters.", impact: "medium", confidence: 95 },
    { category: "warning", title: "Model drift detected in Q4 data", description: "Portfolio recommendation model shows performance degradation on Q4 2025 data. Retraining recommended.", impact: "high", confidence: 85, sourceExperiment: "XGBoost Portfolio Model" },
  ]);
  console.log("  ✓ INCA insights");

  await db.insert(incaDatasetsTable).values([
    { projectId: incaProjects[0].id, name: "Legal Documents Corpus", description: "10k annotated legal documents for NLP training", source: "internal", format: "jsonl", size: "450 MB", recordCount: 10000, status: "validated", metadata: { fields: ["text", "labels", "metadata"] } },
    { projectId: incaProjects[1].id, name: "Transaction History 2025", description: "Full year of financial transaction records for anomaly detection", source: "database", format: "parquet", size: "2.1 GB", recordCount: 5400000, status: "validated", metadata: { fields: ["timestamp", "amount", "category", "merchant", "is_anomaly"] } },
    { projectId: incaProjects[2].id, name: "Portfolio Performance Data", description: "Historical portfolio performance metrics", source: "api", format: "csv", size: "85 MB", recordCount: 120000, status: "archived" },
  ]);
  console.log("  ✓ INCA datasets");

  await db.insert(carlotaServicesTable).values([
    { name: "Strategic Advisory", slug: "strategic-advisory", description: "C-suite strategic counsel for complex business transformations and market positioning", category: "advisory", isActive: "true", sortOrder: 1, metadata: { icon: "Compass", duration: "3-6 months" } },
    { name: "Portfolio Optimization", slug: "portfolio-optimization", description: "Data-driven portfolio analysis and rebalancing strategies for maximum returns", category: "advisory", isActive: "true", sortOrder: 2, metadata: { icon: "TrendingUp", duration: "2-4 months" } },
    { name: "Technology Transformation", slug: "technology-transformation", description: "End-to-end technology modernization from architecture to implementation", category: "consulting", isActive: "true", sortOrder: 3, metadata: { icon: "Cpu", duration: "6-12 months" } },
    { name: "Risk & Compliance", slug: "risk-compliance", description: "Comprehensive risk assessment and regulatory compliance frameworks", category: "consulting", isActive: "true", sortOrder: 4, metadata: { icon: "Shield", duration: "2-3 months" } },
    { name: "Growth Strategy", slug: "growth-strategy", description: "Market expansion and revenue growth playbooks for scaling organizations", category: "advisory", isActive: "true", sortOrder: 5, metadata: { icon: "Rocket", duration: "3-6 months" } },
    { name: "M&A Advisory", slug: "ma-advisory", description: "Merger and acquisition due diligence, valuation, and integration support", category: "advisory", isActive: "true", sortOrder: 6, metadata: { icon: "Handshake", duration: "1-3 months" } },
  ]);
  console.log("  ✓ Carlota Jo services");

  await db.insert(carlotaInquiriesTable).values([
    { name: "Sarah Chen", email: "s.chen@techventures.com", company: "TechVentures Inc.", phone: "+1-555-0101", service: "strategic-advisory", message: "Looking for strategic advisory services to navigate a Series C fundraise and international expansion.", status: "in_progress" },
    { name: "Marcus Williams", email: "m.williams@novacore.io", company: "NovaCore", phone: "+1-555-0202", service: "technology-transformation", message: "We need help modernizing our legacy infrastructure. Currently running on-premise and want to move to cloud-native architecture.", status: "new" },
    { name: "Elena Rodriguez", email: "e.rodriguez@globalfund.com", company: "Global Fund Partners", service: "portfolio-optimization", message: "Interested in portfolio optimization services for our $2B AUM fund.", status: "contacted" },
  ]);
  console.log("  ✓ Carlota Jo inquiries");

  await db.insert(carlotaReservationsTable).values([
    { name: "Sarah Chen", email: "s.chen@techventures.com", company: "TechVentures Inc.", phone: "+1-555-0101", service: "strategic-advisory", tier: "executive", date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], time: "10:00 AM", notes: "Series C fundraise discussion. Please prepare market analysis.", status: "confirmed", confirmationId: "CJ-A1B2C3" },
    { name: "David Park", email: "d.park@novabright.co", company: "NovaBright", service: "growth-strategy", tier: "strategy-session", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], time: "2:00 PM", status: "pending", confirmationId: "CJ-D4E5F6" },
  ]);
  console.log("  ✓ Carlota Jo reservations");

  await db.insert(carlotaClientProfilesTable).values([
    { name: "Sarah Chen", email: "s.chen@techventures.com", company: "TechVentures Inc.", phone: "+1-555-0101", notes: "Series C client. High priority.", metadata: { industry: "Technology", aum: "$150M", firstContact: "2025-11" } },
    { name: "David Park", email: "d.park@novabright.co", company: "NovaBright", notes: "Growth-stage SaaS. Referred by Marcus Williams.", metadata: { industry: "SaaS", employees: 85 } },
    { name: "Elena Rodriguez", email: "e.rodriguez@globalfund.com", company: "Global Fund Partners", phone: "+1-555-0303", metadata: { industry: "Finance", aum: "$2B" } },
  ]);
  console.log("  ✓ Carlota Jo client profiles");

  const ventures = await db.insert(holdingsVenturesTable).values([
    { slug: "vessels", name: "Vessels", description: "Maritime intelligence and fleet tracking platform", sector: "Maritime Tech", status: "active", stage: "growth", color: "#06b6d4", website: "/vessels", metrics: { arr: "$1.2M", users: "4,200", growth: "+28%" }, metadata: { icon: "Ship", tagline: "Maritime Intelligence", marketContext: "Global shipping market valued at $14.1T with increasing demand for digital fleet management solutions." } },
    { slug: "firestorm", name: "Firestorm", description: "AI-powered security simulation and red team platform", sector: "Cybersecurity", status: "active", stage: "growth", color: "#f97316", website: "/firestorm", metrics: { arr: "$890K", users: "1,800", growth: "+45%" }, metadata: { icon: "Shield", tagline: "Security Intelligence", marketContext: "Cybersecurity market expected to reach $538B by 2030." } },
    { slug: "dreamscape", name: "Dreamscape", description: "Creative campaign engine for storytelling and media production", sector: "Creative Tech", status: "active", stage: "early", color: "#f59e0b", website: "/dreamscape", metrics: { campaigns: "47", assets: "2,400", growth: "+62%" }, metadata: { icon: "Palette", tagline: "Creative Engine" } },
    { slug: "lyte", name: "Lyte", description: "Business observability command center for operational decisions", sector: "DevOps", status: "active", stage: "growth", color: "#0ea5e9", website: "/lyte-command-center", metrics: { signals: "24K/day", incidents: "156", growth: "+33%" }, metadata: { icon: "Zap", tagline: "Operational Intelligence" } },
    { slug: "inca", name: "INCA", description: "AI research command center for ML experiments and model lifecycle", sector: "AI/ML", status: "active", stage: "early", color: "#8b5cf6", website: "/inca", metrics: { models: "12", experiments: "89", growth: "+55%" }, metadata: { icon: "Sparkles", tagline: "AI Research Platform" } },
    { slug: "nexus-analytics", name: "Nexus Analytics", description: "Enterprise data analytics and business intelligence platform", sector: "Analytics", status: "stealth", stage: "concept", color: "#10b981", metrics: { beta_users: "120" }, metadata: { icon: "BarChart3", tagline: "Data Intelligence", marketContext: "Business intelligence market growing at 13.2% CAGR." } },
  ]).returning();
  console.log(`  ✓ ${ventures.length} Holdings ventures`);

  await db.insert(holdingsMilestonesTable).values([
    { ventureId: ventures[0].id, title: "Vessels v2.0 Launch", description: "Major platform update with real-time AIS integration", date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "product_launch" },
    { ventureId: ventures[0].id, title: "Series A Close", description: "Closed $8M Series A led by Maritime Capital Partners", date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "funding" },
    { ventureId: ventures[1].id, title: "SOC 2 Certification", description: "Achieved SOC 2 Type II compliance certification", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "milestone" },
    { ventureId: ventures[1].id, title: "1000th Customer", description: "Reached 1,000 active enterprise customers", date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "milestone" },
    { ventureId: ventures[2].id, title: "Dreamscape Beta Launch", description: "Public beta launch of creative campaign engine", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "product_launch" },
    { ventureId: ventures[3].id, title: "Lyte v1.0 GA", description: "General availability release of Lyte Command Center", date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "product_launch" },
    { ventureId: ventures[4].id, title: "INCA Research Lab Founded", description: "Established dedicated AI/ML research lab", date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], category: "milestone" },
  ]);
  console.log("  ✓ Holdings milestones");

  await db.insert(holdingsMetricsTable).values([
    { ventureId: ventures[0].id, label: "ARR", value: "$1.2M", category: "revenue", period: "2026-Q1" },
    { ventureId: ventures[0].id, label: "Active Users", value: "4,200", category: "users", period: "2026-Q1" },
    { ventureId: ventures[0].id, label: "Fleet Coverage", value: "12,000+ vessels", category: "product", period: "2026-Q1" },
    { ventureId: ventures[1].id, label: "ARR", value: "$890K", category: "revenue", period: "2026-Q1" },
    { ventureId: ventures[1].id, label: "Simulations Run", value: "8,400", category: "product", period: "2026-Q1" },
    { ventureId: ventures[2].id, label: "Campaigns Created", value: "47", category: "product", period: "2026-Q1" },
    { ventureId: ventures[2].id, label: "Assets Generated", value: "2,400", category: "product", period: "2026-Q1" },
    { ventureId: ventures[3].id, label: "Signals Processed", value: "24K/day", category: "product", period: "2026-Q1" },
    { ventureId: ventures[3].id, label: "MTTR", value: "23 min", category: "ops", period: "2026-Q1" },
    { ventureId: ventures[4].id, label: "Models in Production", value: "12", category: "product", period: "2026-Q1" },
    { ventureId: ventures[4].id, label: "Experiments", value: "89", category: "product", period: "2026-Q1" },
  ]);
  console.log("  ✓ Holdings metrics");

  await db.insert(holdingsLeadershipTable).values([
    { name: "Stephen Lutar", title: "Founder & CEO", bio: "Technologist and entrepreneur building the next generation of enterprise software.", linkedIn: "https://linkedin.com/in/stephenlutar", sortOrder: 1 },
    { name: "Alex Rivera", title: "COO", bio: "Operations leader with 15+ years scaling technology companies from startup to enterprise.", sortOrder: 2 },
    { name: "Jordan Chen", title: "Chief Data Officer", bio: "Data science expert specializing in AI/ML systems and enterprise analytics.", sortOrder: 3 },
    { name: "Morgan Blake", title: "VP of Marketing", bio: "Marketing strategist with deep expertise in B2B SaaS growth and brand building.", sortOrder: 4 },
    { name: "Casey Torres", title: "Creative Director", bio: "Award-winning creative director with experience across media, film, and digital storytelling.", sortOrder: 5 },
  ]);
  console.log("  ✓ Holdings leadership");

  await db.insert(holdingsInquiriesTable).values([
    { name: "Rachel Kim", email: "rachel@venturecap.com", company: "Venture Capital Partners", subject: "Investment Inquiry", message: "Interested in learning more about SZL Holdings portfolio for potential Series B co-investment.", status: "new" },
    { name: "Thomas Wright", email: "t.wright@enterprisecorp.com", company: "EnterpriseCorp", subject: "Partnership Proposal", message: "We'd like to explore a strategic partnership around your Vessels and Firestorm platforms.", status: "replied" },
  ]);
  console.log("  ✓ Holdings inquiries");

  const featureFlagsNew = await db.insert(featureFlagsTable).values([
    { key: "lyte_readiness_enabled", name: "Lyte Readiness", description: "Enable Lyte Readiness tracking module", isEnabled: true, rolloutPercentage: 100 },
    { key: "lyte_value_at_risk_enabled", name: "Lyte Value at Risk", description: "Enable value-at-risk scoring on Lyte signals", isEnabled: true, rolloutPercentage: 100 },
    { key: "vessels_command_mode_enabled", name: "Vessels Command Mode", description: "Enable command mode for vessels dashboard", isEnabled: true, rolloutPercentage: 100 },
    { key: "alloy_admin_enabled", name: "Alloy Admin", description: "Enable Alloy admin panel and workflow controls", isEnabled: true, rolloutPercentage: 100 },
    { key: "pilot_customer_portal_enabled", name: "Pilot Customer Portal", description: "Enable pilot customer portal access", isEnabled: false, rolloutPercentage: 0 },
    { key: "alloy_signal_ingestion_enabled", name: "Alloy Signal Ingestion", description: "Enable external signal ingestion API", isEnabled: true, rolloutPercentage: 100 },
    { key: "vessels_exception_command_enabled", name: "Vessels Exception Command", description: "Enable exception resolution commands for vessels", isEnabled: true, rolloutPercentage: 100 },
    { key: "lyte_saved_views_enabled", name: "Lyte Saved Views", description: "Enable saved views for Lyte signal and action feeds", isEnabled: true, rolloutPercentage: 100 },
  ]).returning().catch(() => []);
  console.log(`  ✓ ${featureFlagsNew.length} product feature flags`);

  const alloyWorkflows = await db.insert(alloyWorkflowsTable).values([
    { orgId: org.id, name: "Signal Triage & Normalization", description: "Normalize incoming signals, assign severity, route to owner", trigger: "signal", outputType: "action", requiresApproval: false, isActive: true, steps: [{ step: 1, name: "normalize" }, { step: 2, name: "assign_severity" }, { step: 3, name: "route" }], createdBy: users[0].id },
    { orgId: org.id, name: "Executive Digest Generation", description: "Generate daily digest for executive briefing", trigger: "schedule", outputType: "report", requiresApproval: true, approverRole: "exec", isActive: true, steps: [{ step: 1, name: "aggregate" }, { step: 2, name: "narrate" }, { step: 3, name: "format" }], createdBy: users[0].id },
    { orgId: org.id, name: "Fleet Exception Escalation", description: "Automatically escalate unresolved maritime exceptions after 2h", trigger: "schedule", outputType: "notification", requiresApproval: false, isActive: true, steps: [{ step: 1, name: "scan_exceptions" }, { step: 2, name: "escalate" }, { step: 3, name: "notify" }], createdBy: users[0].id },
    { orgId: org.id, name: "Readiness Score Recompute", description: "Recompute readiness scores across all dimensions", trigger: "schedule", outputType: "artifact", requiresApproval: false, isActive: true, steps: [{ step: 1, name: "fetch_items" }, { step: 2, name: "score" }, { step: 3, name: "report" }], createdBy: users[0].id },
    { orgId: org.id, name: "Artifact Approval Routing", description: "Route generated artifacts to designated approvers", trigger: "api", outputType: "artifact", requiresApproval: true, approverRole: "exec", isActive: true, steps: [{ step: 1, name: "generate" }, { step: 2, name: "route" }], createdBy: users[0].id },
    { orgId: org.id, name: "Stale Action Sweep", description: "Identify and escalate actions open for more than 48h", trigger: "schedule", outputType: "action", requiresApproval: false, isActive: true, steps: [{ step: 1, name: "scan" }, { step: 2, name: "escalate" }], createdBy: users[0].id },
  ]).returning();
  console.log(`  ✓ ${alloyWorkflows.length} Alloy workflows`);

  const alloySignals = await db.insert(alloySignalsTable).values([
    { orgId: org.id, source: "Stripe", sourceType: "connector", severity: "high", title: "Revenue dip detected — 3 consecutive days below target", status: "new", normalizedScore: "82", valueAtRisk: "42000" },
    { orgId: org.id, source: "GitHub Actions", sourceType: "connector", severity: "critical", title: "CI/CD pipeline failure — main branch blocked", status: "new", normalizedScore: "94", valueAtRisk: "18000" },
    { orgId: org.id, source: "Monitoring", sourceType: "monitoring", severity: "medium", title: "API response latency elevated — p95 at 1.8s", status: "acknowledged", normalizedScore: "61" },
    { orgId: org.id, source: "MarineTraffic", sourceType: "connector", severity: "high", title: "Vessel deviation detected — MV Pacific Meridian off route", status: "new", normalizedScore: "78", valueAtRisk: "285000" },
    { orgId: org.id, source: "Scheduler", sourceType: "scheduled", severity: "info", title: "Weekly readiness digest generated", status: "processed", normalizedScore: "20" },
  ]).returning();
  console.log(`  ✓ ${alloySignals.length} Alloy signals`);

  const alloyRuns = await db.insert(alloyWorkflowRunsTable).values([
    { workflowId: alloyWorkflows[0].id, signalId: alloySignals[0].id, triggeredBy: users[0].id, state: "completed", input: { signalId: alloySignals[0].id }, output: { severity: "high", owner: "ops_lead", action: "created" }, durationMs: 842, startedAt: new Date(Date.now() - 3600000), completedAt: new Date(Date.now() - 3599000) },
    { workflowId: alloyWorkflows[1].id, triggeredBy: users[0].id, state: "waiting_approval", input: { period: "2026-W13" }, durationMs: null, startedAt: new Date(Date.now() - 1800000) },
    { workflowId: alloyWorkflows[2].id, triggeredBy: null, state: "completed", input: { scanAt: new Date().toISOString() }, output: { escalated: 2, notified: 3 }, durationMs: 1240, startedAt: new Date(Date.now() - 7200000), completedAt: new Date(Date.now() - 7199000) },
    { workflowId: alloyWorkflows[0].id, signalId: alloySignals[1].id, triggeredBy: users[1].id, state: "running", input: { signalId: alloySignals[1].id }, startedAt: new Date() },
    { workflowId: alloyWorkflows[4].id, triggeredBy: users[0].id, state: "failed", errorMessage: "Approver role not found", durationMs: 120, startedAt: new Date(Date.now() - 600000), completedAt: new Date(Date.now() - 599000) },
  ]).returning();
  console.log(`  ✓ ${alloyRuns.length} Alloy workflow runs`);

  await db.insert(alloyArtifactsTable).values([
    { workflowRunId: alloyRuns[0].id, workflowId: alloyWorkflows[0].id, orgId: org.id, title: "Signal Triage Report — Stripe Revenue Signal", artifactType: "report", content: { severity: "high", recommendedActions: ["Investigate Stripe webhook queue", "Check ARR dashboard"], owner: "Alex Rivera" }, status: "published", approvalStatus: "not_required" },
    { workflowRunId: alloyRuns[1].id, workflowId: alloyWorkflows[1].id, orgId: org.id, title: "Executive Digest — Week 13 2026", artifactType: "summary", content: { headline: "Fleet performance below target, CI/CD incident resolved", signals: 12, incidents: 3, readinessScore: 78 }, status: "pending_review", approvalStatus: "pending" },
    { workflowRunId: alloyRuns[2].id, workflowId: alloyWorkflows[2].id, orgId: org.id, title: "Exception Escalation Report — Maritime Fleet", artifactType: "alert", content: { escalated: 2, vessels: ["Mediterranean Dawn", "Arctic Falcon"] }, status: "published", approvalStatus: "not_required" },
  ]);
  console.log("  ✓ Alloy artifacts");

  const [lyteWs] = await db.select().from(lyteWorkspacesTable).limit(1);
  if (lyteWs) {
    const lyteActions = await db.insert(lyteActionsTable).values([
      { workspaceId: lyteWs.id, title: "Investigate Stripe webhook queue delay", description: "Webhook queue showing 15-min delay. Investigate and restore normal latency.", category: "investigate", priority: "high", status: "in_progress", assignee: "Alex Rivera" },
      { workspaceId: lyteWs.id, title: "Remediate CI/CD pipeline failure on main branch", description: "Rollback failing deployment, restore green build status.", category: "remediate", priority: "critical", status: "open", assignee: "Jordan Chen" },
      { workspaceId: lyteWs.id, title: "Review API rate limiting thresholds", description: "p95 latency elevated, consider scaling or caching adjustment.", category: "review", priority: "medium", status: "open", assignee: "Alex Rivera" },
      { workspaceId: lyteWs.id, title: "Notify maritime ops of deviation alert", description: "Send executive notification for Pacific Meridian route deviation.", category: "notify", priority: "high", status: "resolved", assignee: "Morgan Blake", resolvedAt: new Date(Date.now() - 3600000) },
      { workspaceId: lyteWs.id, title: "Document CI/CD post-mortem", description: "Write incident post-mortem for main branch failure and publish to Notion.", category: "document", priority: "low", status: "open" },
    ]).returning();
    console.log(`  ✓ ${lyteActions.length} Lyte actions`);

    await db.insert(lyteSavedViewsTable).values([
      { workspaceId: lyteWs.id, userId: users[0].id, name: "Critical Unresolved", viewType: "signals", filters: { severity: "critical", status: ["new", "acknowledged"] }, sortBy: "receivedAt", sortOrder: "desc", isDefault: false, isShared: true },
      { workspaceId: lyteWs.id, userId: users[0].id, name: "My Actions", viewType: "actions", filters: { assignee: "Alex Rivera", status: ["open", "in_progress"] }, sortBy: "priority", sortOrder: "desc", isDefault: true, isShared: false },
      { workspaceId: lyteWs.id, userId: users[1].id, name: "Operations Overview", viewType: "dashboard", filters: {}, isDefault: false, isShared: true },
    ]).returning();
    console.log("  ✓ Lyte saved views");

    await db.insert(lyteReadinessItemsTable).values([
      { workspaceId: lyteWs.id, title: "Incident response playbook reviewed", category: "operational", status: "complete", weight: "2", score: "100", owner: "Alex Rivera", completedAt: new Date(Date.now() - 7 * 24 * 3600000) },
      { workspaceId: lyteWs.id, title: "All critical signals have owners assigned", category: "operational", status: "in_progress", weight: "2", score: "70", owner: "Alex Rivera" },
      { workspaceId: lyteWs.id, title: "MFA enabled for all team members", category: "security", status: "complete", weight: "3", score: "100", owner: "Jordan Chen", completedAt: new Date(Date.now() - 14 * 24 * 3600000) },
      { workspaceId: lyteWs.id, title: "SOC2 evidence collection started", category: "compliance", status: "in_progress", weight: "3", score: "45", owner: "Jordan Chen" },
      { workspaceId: lyteWs.id, title: "Q1 financial reporting complete", category: "financial", status: "complete", weight: "2", score: "100", owner: "Morgan Blake", completedAt: new Date(Date.now() - 3 * 24 * 3600000) },
      { workspaceId: lyteWs.id, title: "API documentation up to date", category: "technical", status: "not_started", weight: "1", owner: "Jordan Chen" },
      { workspaceId: lyteWs.id, title: "On-call rotation defined for all services", category: "people", status: "in_progress", weight: "2", score: "60", owner: "Alex Rivera" },
    ]).returning();
    console.log("  ✓ Lyte readiness items");
  }

  const ports = await db.insert(portsTable).values([
    { name: "Port of Yokohama", locode: "JPYOK", country: "Japan", region: "Asia-Pacific", lat: "35.450", lon: "139.650", portType: "commercial", status: "open", avgCongestionDays: "1.2", weeklyTeu: 78000, capacityUtilization: "82" },
    { name: "Port Hedland", locode: "AUPHE", country: "Australia", region: "Asia-Pacific", lat: "-20.310", lon: "118.580", portType: "industrial", status: "open", avgCongestionDays: "0.8", weeklyTeu: 24000, capacityUtilization: "91" },
    { name: "Port of Rotterdam", locode: "NLRTM", country: "Netherlands", region: "Atlantic", lat: "51.900", lon: "4.400", portType: "commercial", status: "open", avgCongestionDays: "0.8", weeklyTeu: 58000, capacityUtilization: "71" },
    { name: "Ras Tanura", locode: "SARAT", country: "Saudi Arabia", region: "Middle East", lat: "26.640", lon: "50.160", portType: "industrial", status: "open", avgCongestionDays: "0.3", weeklyTeu: 8000, capacityUtilization: "88" },
    { name: "Port of Fujairah", locode: "AEFJR", country: "UAE", region: "Middle East", lat: "25.118", lon: "56.340", portType: "commercial", status: "open", avgCongestionDays: "1.1", weeklyTeu: 14000, capacityUtilization: "79" },
    { name: "Port of Hamburg", locode: "DEHAM", country: "Germany", region: "Atlantic", lat: "53.550", lon: "9.990", portType: "commercial", status: "open", avgCongestionDays: "0.9", weeklyTeu: 44000, capacityUtilization: "74" },
    { name: "Port of Murmansk", locode: "RUMRM", country: "Russia", region: "Arctic", lat: "68.980", lon: "33.090", portType: "industrial", status: "open", avgCongestionDays: "2.1", weeklyTeu: 6000, capacityUtilization: "66" },
    { name: "Ningbo-Zhoushan", locode: "CNNBO", country: "China", region: "Asia-Pacific", lat: "29.869", lon: "121.578", portType: "commercial", status: "open", avgCongestionDays: "2.4", weeklyTeu: 112000, capacityUtilization: "89" },
  ]).returning();
  console.log(`  ✓ ${ports.length} ports`);

  const dbVessels = await db.select().from(vesselsTable).limit(10);
  if (dbVessels.length > 0) {
    const v1 = dbVessels[0];
    const v2 = dbVessels[1] ?? v1;
    const v3 = dbVessels[2] ?? v1;
    const v4 = dbVessels[3] ?? v1;

    const voyages = await db.insert(voyagesTable).values([
      { orgId: org.id, vesselId: v1.id, voyageRef: "VOY-001", originLabel: "Port Hedland", destinationLabel: "Yokohama", originPortId: ports[1].id, destinationPortId: ports[0].id, cargoType: "Iron Ore", cargoQuantity: "72000", cargoUnit: "MT", charterType: "time_charter", estimatedRevenue: "4320000", operatingCost: "2100000", fuelCost: "980000", portCost: "420000", delayCost: "0", marginEstimate: "2220000", marginPct: "51.4", tce: "28500", fuelConsumptionTotal: "412", delayHours: 0, routeProgress: 78, status: "active", scheduledDeparture: new Date("2026-03-28"), scheduledArrival: new Date("2026-04-02"), estimatedArrival: new Date("2026-04-02") },
      { orgId: org.id, vesselId: v2.id, voyageRef: "VOY-002", originLabel: "New York", destinationLabel: "Hamburg", originPortId: null, destinationPortId: ports[5].id, cargoType: "General Cargo", charterType: "voyage_charter", estimatedRevenue: "7800000", operatingCost: "4200000", fuelCost: "1640000", portCost: "870000", delayCost: "180000", marginEstimate: "3600000", marginPct: "46.2", tce: "45200", delayHours: 6, routeProgress: 100, status: "active", scheduledDeparture: new Date("2026-03-18"), scheduledArrival: new Date("2026-04-05"), estimatedArrival: new Date("2026-04-05") },
      { orgId: org.id, vesselId: v3.id, voyageRef: "VOY-003", originLabel: "Ras Tanura", destinationLabel: "Fujairah", originPortId: ports[3].id, destinationPortId: ports[4].id, cargoType: "Crude Oil", charterType: "spot", estimatedRevenue: "12400000", operatingCost: "5100000", fuelCost: "1220000", portCost: "580000", delayCost: "0", marginEstimate: "7300000", marginPct: "58.9", tce: "52000", delayHours: 0, routeProgress: 91, status: "active" },
      { orgId: org.id, vesselId: v4.id, voyageRef: "VOY-008", originLabel: "Narvik", destinationLabel: "Murmansk", originPortId: null, destinationPortId: ports[6].id, cargoType: "Nickel Ore", charterType: "time_charter", estimatedRevenue: "2900000", operatingCost: "2100000", delayCost: "420000", marginEstimate: "800000", marginPct: "27.6", tce: "22400", delayHours: 22, routeProgress: 31, status: "active" },
    ]).returning();
    console.log(`  ✓ ${voyages.length} voyages`);

    const exceptions = await db.insert(fleetExceptionsTable).values([
      { orgId: org.id, vesselId: v1.id, exceptionRef: "EXC-001", exceptionType: "security_alert", severity: "critical", title: "Unidentified Dark Vessel Approach — Persian Gulf", description: "AIS-dark vessel approached within 800m with no transponder. Security protocol activated.", whyItMatters: "Area has active threat intelligence. Vessel approach profile matches documented STS transfer signatures.", recommendedResponse: "Maintain heightened watch. Await Coast Guard update.", businessConsequence: "Potential cargo seizure risk. P&I implications.", owner: "Capt. Al-Rashid", ownerFunction: "Operations", estimatedImpactUsd: "12400000", status: "active", detectedAt: new Date(Date.now() - 7200000) },
      { orgId: org.id, vesselId: v2.id, exceptionRef: "EXC-002", exceptionType: "weather_disruption", severity: "high", title: "Severe Weather Forcing Speed Reduction — Mediterranean", description: "Force 8 conditions in Ionian Sea forcing speed reduction to 9.1 knots. ETA 31 hours behind.", whyItMatters: "Charter party terms require 14-day advance notice for delay claims.", recommendedResponse: "Issue charterer notification within 6 hours.", businessConsequence: "Port slot cancellation fee estimated $82K.", owner: "T. Kowalski", ownerFunction: "Commercial", estimatedImpactUsd: "620000", status: "active", detectedAt: new Date(Date.now() - 21600000) },
      { orgId: org.id, vesselId: v3.id, exceptionRef: "EXC-003", exceptionType: "maintenance_risk", severity: "high", title: "Rudder Hydraulic System Degradation — Actionable", description: "Port rudder actuator hydraulic pressure drop 15%. Predictive model indicates failure probability 84% within 13 days.", whyItMatters: "Main rudder failure at sea requires emergency tow.", recommendedResponse: "Schedule port call maintenance at Hamburg.", businessConsequence: "Potential off-hire period 4–7 days. Revenue exposure $316K.", owner: "V. Petrov", ownerFunction: "Technical", estimatedImpactUsd: "316000", status: "acknowledged", acknowledgedAt: new Date(Date.now() - 3600000), detectedAt: new Date(Date.now() - 86400000) },
      { orgId: org.id, vesselId: v4.id, exceptionRef: "EXC-004", exceptionType: "delay_risk", severity: "high", title: "Ice Condition Delay — Arctic Route Speed Reduction", description: "Unexpected ice field expansion forcing 6.2 knot transit. ETA now 22 hours behind.", whyItMatters: "Murmansk port slot held for 12-hour window. Missing slot means 48-hour delay in loading.", recommendedResponse: "Contact Murmansk port authority for slot re-allocation.", businessConsequence: "$420K delay cost. Receiver storage costs accruing.", owner: "B. Ivanova", ownerFunction: "Operations", estimatedImpactUsd: "420000", status: "active", detectedAt: new Date(Date.now() - 10800000) },
      { orgId: org.id, vesselId: v1.id, exceptionRef: "EXC-005", exceptionType: "port_congestion", severity: "watch", title: "Yokohama Anchorage Congestion — Pre-arrival Monitor", description: "Yokohama anchorage showing 12 bulk carriers waiting. Average current wait 18 hours.", whyItMatters: "Cargo receiver operating on just-in-time schedule.", recommendedResponse: "Issue early arrival notice. Request priority anchorage via agent.", businessConsequence: "If anchorage wait exceeds 24h, demurrage clock starts at $28,500/day.", owner: "Y. Tanaka", ownerFunction: "Commercial", estimatedImpactUsd: "71250", status: "active", detectedAt: new Date(Date.now() - 3600000) },
    ]).returning();
    console.log(`  ✓ ${exceptions.length} fleet exceptions`);

    await db.insert(vesselMaintenanceTable).values([
      { vesselId: v1.id, component: "Main Engine Turbocharger", maintenanceType: "scheduled", description: "Routine turbocharger inspection and cleaning per class schedule", status: "scheduled", priority: "medium", dueDate: new Date(Date.now() + 30 * 24 * 3600000), estimatedCost: "42000", riskOfServiceIssue: "15", impactsVoyageAvailability: false, assetHealth: "88", technician: "T. Nakamura" },
      { vesselId: v2.id, component: "Port Rudder Hydraulic System", maintenanceType: "corrective", description: "Hydraulic pressure drop 15% — seal replacement required", status: "in_progress", priority: "high", dueDate: new Date(Date.now() + 13 * 24 * 3600000), estimatedCost: "128000", riskOfServiceIssue: "84", impactsVoyageAvailability: true, assetHealth: "61", technician: "V. Petrov" },
      { vesselId: v3.id, component: "Ballast Water Treatment System", maintenanceType: "preventive", description: "UV lamp replacement and filter cleaning", status: "due_soon", priority: "medium", dueDate: new Date(Date.now() + 7 * 24 * 3600000), estimatedCost: "18500", riskOfServiceIssue: "25", impactsVoyageAvailability: false, assetHealth: "74", technician: "R. Okafor" },
      { vesselId: v4.id, component: "Ice Class Propeller Shaft Seal", maintenanceType: "corrective", description: "Seal showing signs of wear in ice conditions. Replacement recommended.", status: "overdue", priority: "critical", dueDate: new Date(Date.now() - 3 * 24 * 3600000), estimatedCost: "65000", riskOfServiceIssue: "91", impactsVoyageAvailability: true, assetHealth: "42", technician: "B. Ivanova" },
      { vesselId: v1.id, component: "Cargo Hold Hatch Covers", maintenanceType: "preventive", description: "Hatch cover rubber seal inspection and replacement", status: "scheduled", priority: "low", dueDate: new Date(Date.now() + 60 * 24 * 3600000), estimatedCost: "9200", riskOfServiceIssue: "8", impactsVoyageAvailability: false, assetHealth: "93", technician: "T. Nakamura" },
    ]);
    console.log("  ✓ vessel maintenance items");
  }

  await db.insert(corridorsTable).values([
    { name: "Iron Ore Pacific Highway", origin: "Port Hedland", destination: "Yokohama / Ningbo", region: "Asia-Pacific", commodity: "Iron Ore", vesselCount: 8, delayRate: "12", avgTransitDays: "14", weeklyVolume: "2.1M MT", profitabilityIndex: "92", weatherRisk: "low", portCongestionRisk: "moderate", trend: "stable", activeAlerts: 1 },
    { name: "Atlantic Containerized Cargo Lane", origin: "US East Coast", destination: "Northern Europe", region: "Atlantic", commodity: "General Cargo / Containers", vesselCount: 24, delayRate: "18", avgTransitDays: "14", weeklyVolume: "380K TEU", profitabilityIndex: "78", weatherRisk: "moderate", portCongestionRisk: "low", trend: "up", activeAlerts: 2 },
    { name: "Persian Gulf Crude Export Route", origin: "Ras Tanura / Fujairah", destination: "East Asia", region: "Middle East", commodity: "Crude Oil", vesselCount: 31, delayRate: "6", avgTransitDays: "20", weeklyVolume: "15M BPD", profitabilityIndex: "96", weatherRisk: "low", portCongestionRisk: "low", trend: "stable", activeAlerts: 3 },
    { name: "Arctic Nickel Corridor", origin: "Narvik / Murmansk", destination: "North Sea / Baltic", region: "Arctic", commodity: "Nickel Ore / Metals", vesselCount: 6, delayRate: "34", avgTransitDays: "8", weeklyVolume: "420K MT", profitabilityIndex: "54", weatherRisk: "severe", portCongestionRisk: "moderate", trend: "down", activeAlerts: 4 },
    { name: "Mediterranean Consumer Goods Lane", origin: "Piraeus / Istanbul", destination: "Western Mediterranean Ports", region: "Mediterranean", commodity: "Consumer Goods / Retail", vesselCount: 18, delayRate: "22", avgTransitDays: "5", weeklyVolume: "210K TEU", profitabilityIndex: "71", weatherRisk: "moderate", portCongestionRisk: "moderate", trend: "down", activeAlerts: 2 },
    { name: "Red Sea — Cape of Good Hope Reroute", origin: "Asia", destination: "Europe", region: "Indian Ocean", commodity: "Mixed Containerized", vesselCount: 47, delayRate: "28", avgTransitDays: "32", weeklyVolume: "620K TEU", profitabilityIndex: "62", weatherRisk: "moderate", portCongestionRisk: "high", trend: "down", activeAlerts: 7 },
  ]);
  console.log("  ✓ corridors");

  console.log("\n✅ Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
