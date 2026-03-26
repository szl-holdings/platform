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
  lyteProductsTable,
  lyteOrdersTable,
  lyteOrderItemsTable,
  dreamscapeProjectsTable,
  dreamscapeAssetsTable,
  dreamscapeReviewsTable,
  readinessAssessmentsTable,
  readinessChecklistsTable,
  readinessFindingsTable,
} from "@workspace/db";
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
    { key: "lyte_checkout_v2", name: "Checkout V2", description: "New streamlined checkout experience", isEnabled: false, rolloutPercentage: 0 },
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

  await db.insert(appsRegistryTable).values([
    { slug: "stephen-site", name: "Stephen L. Portfolio", description: "Personal portfolio and consulting showcase", icon: "Globe", color: "#6366f1", status: "active", version: "1.0.0", isPublic: true },
    { slug: "vessels", name: "Vessels Tracker", description: "Maritime vessel tracking and cargo management", icon: "Ship", color: "#06b6d4", status: "active", version: "0.5.0" },
    { slug: "firestorm", name: "Firestorm Security", description: "Security assessment simulation and risk scoring", icon: "Flame", color: "#f97316", status: "active", version: "0.3.0" },
    { slug: "lyte", name: "Lyte Commerce", description: "E-commerce product and order management", icon: "ShoppingBag", color: "#a855f7", status: "coming_soon", version: "0.1.0" },
    { slug: "dreamscape", name: "Dreamscape Creative", description: "Creative asset management and review", icon: "Palette", color: "#ec4899", status: "coming_soon", version: "0.1.0" },
    { slug: "readiness", name: "Readiness Assessments", description: "Compliance and readiness assessment tools", icon: "Shield", color: "#10b981", status: "active", version: "0.4.0" },
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
    { name: "Lyte E-commerce MVP", description: "Minimum viable product for Lyte online store", status: "on-hold" },
    { name: "Dreamscape Asset Pipeline", description: "Creative asset ingestion and review workflow", status: "active" },
    { name: "Readiness Compliance Audit", description: "Q1 operational readiness audit framework", status: "completed" },
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

  const products = await db.insert(lyteProductsTable).values([
    { name: "Premium Wireless Headphones", sku: "LYTE-WH-001", description: "Noise-canceling over-ear headphones", category: "Electronics", price: "29900", stockQuantity: 150, isActive: true },
    { name: "Minimalist Desk Lamp", sku: "LYTE-DL-001", description: "LED desk lamp with adjustable brightness", category: "Home Office", price: "7900", stockQuantity: 300, isActive: true },
    { name: "Organic Cotton T-Shirt", sku: "LYTE-TS-001", description: "Sustainably sourced cotton t-shirt", category: "Apparel", price: "3500", stockQuantity: 500, isActive: true },
    { name: "Smart Water Bottle", sku: "LYTE-WB-001", description: "Temperature-tracking insulated bottle", category: "Accessories", price: "4900", stockQuantity: 200, isActive: true },
  ]).returning();
  console.log(`  ✓ ${products.length} Lyte products`);

  const orders = await db.insert(lyteOrdersTable).values([
    { orderNumber: "LYTE-2024-0001", customerEmail: "customer1@example.com", customerName: "Alice Johnson", status: "delivered", subtotal: "33400", tax: "2672", total: "36072" },
    { orderNumber: "LYTE-2024-0002", customerEmail: "customer2@example.com", customerName: "Bob Smith", status: "processing", subtotal: "29900", tax: "2392", total: "32292" },
  ]).returning();

  await db.insert(lyteOrderItemsTable).values([
    { orderId: orders[0].id, productId: products[1].id, productName: "Minimalist Desk Lamp", quantity: 1, unitPrice: "7900" },
    { orderId: orders[0].id, productId: products[2].id, productName: "Organic Cotton T-Shirt", quantity: 2, unitPrice: "3500" },
    { orderId: orders[1].id, productId: products[0].id, productName: "Premium Wireless Headphones", quantity: 1, unitPrice: "29900" },
  ]);
  console.log("  ✓ Lyte orders");

  const dProjects = await db.insert(dreamscapeProjectsTable).values([
    { name: "SZL Brand Identity", type: "brand_identity", clientName: "SZL Holdings", status: "approved", mood: "Professional, Modern, Bold", colorPalette: { primary: "#6366f1", secondary: "#a855f7", accent: "#06b6d4" } },
    { name: "Lyte Product Packaging", type: "packaging", clientName: "Lyte Commerce", status: "in_progress", mood: "Clean, Minimal, Premium" },
    { name: "Firestorm Landing Pages", type: "web_design", clientName: "Firestorm Marketing", status: "review", mood: "Energetic, Conversion-focused" },
  ]).returning();
  console.log(`  ✓ ${dProjects.length} Dreamscape projects`);

  await db.insert(dreamscapeAssetsTable).values([
    { projectId: dProjects[0].id, name: "Logo Primary", type: "vector", width: 800, height: 400 },
    { projectId: dProjects[0].id, name: "Brand Guidelines PDF", type: "other" },
    { projectId: dProjects[1].id, name: "Box Design Mockup", type: "mockup", width: 1200, height: 900 },
  ]);
  console.log("  ✓ Dreamscape assets");

  await db.insert(dreamscapeReviewsTable).values([
    { projectId: dProjects[0].id, reviewerName: "Stephen L.", status: "approved", comment: "Brand identity looks excellent. Colors and typography align perfectly with our vision." },
    { projectId: dProjects[1].id, reviewerName: "Morgan Blake", status: "changes_requested", comment: "The packaging design is good but needs more contrast on the label text for accessibility." },
    { projectId: dProjects[2].id, reviewerName: "Casey Torres", status: "pending", comment: "Reviewing the landing page wireframes for conversion optimization." },
  ]);
  console.log("  ✓ Dreamscape reviews");

  const assessments = await db.insert(readinessAssessmentsTable).values([
    { name: "Q1 Operational Readiness", category: "operational", status: "completed", overallScore: "87.50", assessorName: "Alex Rivera", completedAt: new Date() },
    { name: "Security Compliance Audit", category: "security", status: "in_progress", overallScore: "72.00", assessorName: "Stephen L." },
    { name: "Financial Health Check", category: "financial", status: "draft", assessorName: "Jordan Chen" },
  ]).returning();
  console.log(`  ✓ ${assessments.length} readiness assessments`);

  await db.insert(readinessChecklistsTable).values([
    { assessmentId: assessments[0].id, title: "Backup & Recovery Plan", priority: "critical", isCompleted: true, completedAt: new Date() },
    { assessmentId: assessments[0].id, title: "Incident Response Procedures", priority: "high", isCompleted: true, completedAt: new Date() },
    { assessmentId: assessments[0].id, title: "Staff Training Records", priority: "medium", isCompleted: false },
    { assessmentId: assessments[1].id, title: "Penetration Testing", priority: "critical", isCompleted: false },
    { assessmentId: assessments[1].id, title: "Access Control Review", priority: "high", isCompleted: true, completedAt: new Date() },
  ]);
  console.log("  ✓ readiness checklists");

  await db.insert(readinessFindingsTable).values([
    { assessmentId: assessments[1].id, title: "Outdated SSL Certificates", description: "Two internal services have SSL certificates expiring within 30 days", severity: "high", status: "in_progress", recommendation: "Implement automated certificate renewal with Let's Encrypt" },
    { assessmentId: assessments[1].id, title: "Missing MFA on Admin Accounts", description: "3 admin accounts do not have multi-factor authentication enabled", severity: "critical", status: "open", recommendation: "Enforce MFA for all admin-level accounts immediately" },
  ]);
  console.log("  ✓ readiness findings");

  console.log("\n✅ Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
