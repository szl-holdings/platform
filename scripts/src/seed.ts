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
  vesselsTable,
  vesselsPositionsTable,
  vesselsCargoTable,
  vesselsRoutesTable,
  firestormCampaignsTable,
  firestormLeadsTable,
  firestormAnalyticsTable,
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
    { slug: "firestorm", name: "Firestorm Marketing", description: "Campaign management and lead generation", icon: "Flame", color: "#f97316", status: "active", version: "0.3.0" },
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

  const vessels = await db.insert(vesselsTable).values([
    { name: "MV Atlantic Voyager", imo: "9876543", vesselType: "container", flag: "Panama", yearBuilt: 2019, status: "at_sea" },
    { name: "SS Pacific Guardian", imo: "9876544", vesselType: "tanker", flag: "Liberia", yearBuilt: 2021, status: "in_port" },
    { name: "MV Northern Star", imo: "9876545", vesselType: "bulk", flag: "Marshall Islands", yearBuilt: 2017, status: "at_sea" },
    { name: "SS Gulf Explorer", imo: "9876546", vesselType: "cargo", flag: "Singapore", yearBuilt: 2020, status: "anchored" },
  ]).returning();
  console.log(`  ✓ ${vessels.length} vessels`);

  await db.insert(vesselsPositionsTable).values([
    { vesselId: vessels[0].id, latitude: "40.7128000", longitude: "-74.0060000", heading: "45.00", speed: "12.50", recordedAt: new Date() },
    { vesselId: vessels[1].id, latitude: "1.3521000", longitude: "103.8198000", heading: "0.00", speed: "0.00", recordedAt: new Date() },
    { vesselId: vessels[2].id, latitude: "51.5074000", longitude: "-0.1278000", heading: "180.00", speed: "15.30", recordedAt: new Date() },
  ]);
  console.log("  ✓ vessel positions");

  await db.insert(vesselsCargoTable).values([
    { vesselId: vessels[0].id, cargoType: "Electronics", quantity: "2500.00", unit: "TEU", origin: "Shanghai", destination: "New York", status: "in_transit" },
    { vesselId: vessels[2].id, cargoType: "Iron Ore", quantity: "45000.00", unit: "MT", origin: "Sydney", destination: "Rotterdam", status: "in_transit" },
  ]);
  console.log("  ✓ vessel cargo");

  await db.insert(vesselsRoutesTable).values([
    { vesselId: vessels[0].id, originPort: "Shanghai", destinationPort: "New York", departureAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), arrivalAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: "active" },
    { vesselId: vessels[1].id, originPort: "Singapore", destinationPort: "Singapore", departureAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: "completed" },
    { vesselId: vessels[2].id, originPort: "Sydney", destinationPort: "Rotterdam", departureAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), arrivalAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: "active" },
  ]);
  console.log("  ✓ vessel routes");

  const campaigns = await db.insert(firestormCampaignsTable).values([
    { name: "Q4 Product Launch", type: "multi_channel", status: "active", budget: "25000.00", spent: "12450.00", startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { name: "Holiday Email Blast", type: "email", status: "scheduled", budget: "5000.00", spent: "0.00" },
    { name: "LinkedIn Thought Leadership", type: "social", status: "active", budget: "8000.00", spent: "3200.00" },
  ]).returning();
  console.log(`  ✓ ${campaigns.length} campaigns`);

  await db.insert(firestormLeadsTable).values([
    { campaignId: campaigns[0].id, email: "lead1@techcorp.com", firstName: "Maria", lastName: "Santos", company: "TechCorp", score: 85, status: "qualified" },
    { campaignId: campaigns[0].id, email: "lead2@innovate.io", firstName: "James", lastName: "Wilson", company: "Innovate.io", score: 62, status: "contacted" },
    { campaignId: campaigns[2].id, email: "lead3@startup.co", firstName: "Emma", lastName: "Chen", company: "Startup Co", score: 91, status: "new" },
  ]);
  console.log("  ✓ leads");

  await db.insert(firestormAnalyticsTable).values([
    { campaignId: campaigns[0].id, date: new Date(), impressions: 45000, clicks: 2250, conversions: 180, spend: "1200.00", revenue: "8500.00" },
    { campaignId: campaigns[2].id, date: new Date(), impressions: 12000, clicks: 960, conversions: 48, spend: "400.00", revenue: "2100.00" },
  ]);
  console.log("  ✓ campaign analytics");

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
