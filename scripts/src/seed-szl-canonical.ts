import {
  db,
  szlProductsTable,
  szlVesselsTable,
  szlPortsTable,
  szlRoutesTable,
  szlVoyagesTable,
  szlSignalsTable,
  szlActionsTable,
  szlWorkflowsTable,
  szlWorkflowRunsTable,
  szlApprovalsTable,
  szlExceptionsTable,
  szlReadinessItemsTable,
  szlFeatureFlagsTable,
  organizationsTable,
  type SzlSignal,
  type SzlPort,
} from "@szl-holdings/db";

async function seedCanonical() {
  console.log("Seeding SZL canonical data...");

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  const productRows = await db.insert(szlProductsTable).values([
    { slug: "szl-holdings", name: "SZL Holdings", description: "Parent holding company — portfolio, ventures, strategic oversight", productType: "platform", isActive: true },
    { slug: "alloy", name: "Alloy", description: "Execution fabric and predictive intelligence engine powering Lyte and Vessels", productType: "platform", parentSlug: "szl-holdings", isActive: true },
    { slug: "lyte", name: "Lyte", description: "Business observability command center — signals, ownership, approvals, escalations", productType: "platform", parentSlug: "alloy", isActive: true },
    { slug: "lyte-readiness", name: "Lyte Readiness", description: "First-class readiness and maturity assessment module within Lyte", productType: "module", parentSlug: "lyte", isActive: true },
    { slug: "vessels", name: "Vessels", description: "Maritime intelligence — fleet operations, voyage economics, AIS anomaly detection", productType: "vertical", parentSlug: "alloy", isActive: true },
    { slug: "carlota-jo", name: "Carlota Jo Consulting", description: "Principal advisory layer — strategic engagements and service delivery", productType: "service", parentSlug: "szl-holdings", isActive: true },
    { slug: "stephen", name: "Stephen Lutar — Founder Identity", description: "Canonical founder narrative and platform architecture story", productType: "platform", parentSlug: "szl-holdings", isActive: true },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${productRows.length} products`);

  // ─── DEMO PORTS ───────────────────────────────────────────────────────────
  const portRows = await db.insert(szlPortsTable).values([
    { unlocode: "SGSIN", name: "Port of Singapore", country: "SG", region: "Southeast Asia", latitude: "1.264", longitude: "103.820", portType: "commercial", riskLevel: "low" },
    { unlocode: "CNSHA", name: "Port of Shanghai", country: "CN", region: "East Asia", latitude: "31.233", longitude: "121.474", portType: "commercial", riskLevel: "low" },
    { unlocode: "NLRTM", name: "Port of Rotterdam", country: "NL", region: "Northwest Europe", latitude: "51.902", longitude: "4.470", portType: "commercial", riskLevel: "low" },
    { unlocode: "USHOU", name: "Port of Houston", country: "US", region: "Gulf of Mexico", latitude: "29.727", longitude: "-95.283", portType: "commercial", riskLevel: "low" },
    { unlocode: "AEDXB", name: "Port of Dubai (Jebel Ali)", country: "AE", region: "Middle East", latitude: "24.987", longitude: "55.063", portType: "commercial", riskLevel: "medium" },
    { unlocode: "JPYOK", name: "Port of Yokohama", country: "JP", region: "East Asia", latitude: "35.443", longitude: "139.650", portType: "commercial", riskLevel: "low" },
    { unlocode: "GBFXT", name: "Port of Felixstowe", country: "GB", region: "Northwest Europe", latitude: "51.953", longitude: "1.349", portType: "commercial", riskLevel: "low" },
    { unlocode: "BRSSZ", name: "Port of Santos", country: "BR", region: "South America", latitude: "-23.953", longitude: "-46.332", portType: "commercial", riskLevel: "medium" },
    { unlocode: "ZAELS", name: "Port Elizabeth", country: "ZA", region: "Sub-Saharan Africa", latitude: "-33.962", longitude: "25.624", portType: "commercial", riskLevel: "medium" },
    { unlocode: "IDDKS", name: "Port of Dumai", country: "ID", region: "Southeast Asia", latitude: "1.682", longitude: "101.445", portType: "commercial", riskLevel: "medium" },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${portRows.length} ports`);

  // ─── DEMO ORG (if not exists) ──────────────────────────────────────────────
  const [demoOrg] = await db.insert(organizationsTable).values({
    name: "SZL Holdings Demo",
    slug: "szl-demo",
    orgType: "demo",
    status: "active",
    plan: "enterprise",
  }).onConflictDoNothing().returning();
  const orgId = demoOrg?.id ?? 1;

  // ─── VESSELS ──────────────────────────────────────────────────────────────
  const vesselRows = await db.insert(szlVesselsTable).values([
    { orgId, imo: "9321483", mmsi: "477112300", name: "MV Meridian Star", vesselClass: "Panamax", vesselType: "container", flag: "SG", yearBuilt: 2018, grossTonnageMt: "65000.00", utilizationPct: "87.5", fuelEfficiencyScore: "82.3", maintenanceStatus: "ok", readinessScore: "91.0", operationalStatus: "at_sea" },
    { orgId, imo: "9445543", mmsi: "636019001", name: "MV Pacific Voyager", vesselClass: "Suezmax", vesselType: "tanker", flag: "LR", yearBuilt: 2015, grossTonnageMt: "158000.00", utilizationPct: "72.1", fuelEfficiencyScore: "74.8", maintenanceStatus: "scheduled", readinessScore: "78.5", operationalStatus: "in_port" },
    { orgId, imo: "9502789", mmsi: "440100230", name: "MV Atlantic Bridge", vesselClass: "Post-Panamax", vesselType: "cargo", flag: "KR", yearBuilt: 2020, grossTonnageMt: "95000.00", utilizationPct: "93.2", fuelEfficiencyScore: "88.1", maintenanceStatus: "ok", readinessScore: "95.2", operationalStatus: "at_sea" },
    { orgId, imo: "9678234", mmsi: "235011290", name: "MV Northern Spirit", vesselClass: "Handymax", vesselType: "bulk", flag: "GB", yearBuilt: 2016, grossTonnageMt: "42000.00", utilizationPct: "65.4", fuelEfficiencyScore: "71.2", maintenanceStatus: "overdue", readinessScore: "62.0", operationalStatus: "maintenance" },
    { orgId, imo: "9783456", mmsi: "548001120", name: "MV Southern Cross", vesselClass: "Aframax", vesselType: "tanker", flag: "PH", yearBuilt: 2019, grossTonnageMt: "112000.00", utilizationPct: "81.9", fuelEfficiencyScore: "80.5", maintenanceStatus: "ok", readinessScore: "88.4", operationalStatus: "at_sea" },
    { orgId, imo: "9234512", mmsi: "311050850", name: "MV Coral Reef", vesselClass: "Feedermax", vesselType: "container", flag: "BS", yearBuilt: 2014, grossTonnageMt: "28000.00", utilizationPct: "58.7", fuelEfficiencyScore: "65.9", maintenanceStatus: "scheduled", readinessScore: "71.3", operationalStatus: "anchored" },
    { orgId, imo: "9112344", mmsi: "215012890", name: "MV Aegean Dream", vesselClass: "VLCC", vesselType: "tanker", flag: "MT", yearBuilt: 2012, grossTonnageMt: "298000.00", utilizationPct: "79.3", fuelEfficiencyScore: "69.4", maintenanceStatus: "in_progress", readinessScore: "75.8", operationalStatus: "in_port" },
    { orgId, imo: "9567823", mmsi: "372012310", name: "MV Caribbean Wind", vesselClass: "Panamax", vesselType: "bulk", flag: "PA", yearBuilt: 2017, grossTonnageMt: "77000.00", utilizationPct: "88.6", fuelEfficiencyScore: "85.2", maintenanceStatus: "ok", readinessScore: "92.1", operationalStatus: "at_sea" },
    { orgId, imo: "9890123", mmsi: "265012780", name: "MV Baltic Arrow", vesselClass: "Ice-class", vesselType: "cargo", flag: "SE", yearBuilt: 2021, grossTonnageMt: "18000.00", utilizationPct: "94.5", fuelEfficiencyScore: "91.7", maintenanceStatus: "ok", readinessScore: "97.0", operationalStatus: "at_sea" },
    { orgId, imo: "9345678", mmsi: "431012560", name: "MV Osaka Maru", vesselClass: "Post-Panamax", vesselType: "container", flag: "JP", yearBuilt: 2018, grossTonnageMt: "120000.00", utilizationPct: "90.1", fuelEfficiencyScore: "87.6", maintenanceStatus: "ok", readinessScore: "93.5", operationalStatus: "at_sea" },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${vesselRows.length} vessels`);

  // ─── ROUTES ───────────────────────────────────────────────────────────────
  const portLookup = Object.fromEntries(portRows.map((p) => [p.unlocode as string, p.id]));
  const routeInserts = [];
  if (portLookup["CNSHA"] && portLookup["NLRTM"]) {
    routeInserts.push({ orgId, name: "Asia–Europe Main Line", originPortId: portLookup["CNSHA"], destinationPortId: portLookup["NLRTM"], distanceNm: "11200.00", avgTransitDays: "25.5", riskLevel: "low" as const });
  }
  if (portLookup["SGSIN"] && portLookup["AEDXB"]) {
    routeInserts.push({ orgId, name: "Singapore–Middle East", originPortId: portLookup["SGSIN"], destinationPortId: portLookup["AEDXB"], distanceNm: "3850.00", avgTransitDays: "9.0", riskLevel: "medium" as const });
  }
  if (portLookup["USHOU"] && portLookup["NLRTM"]) {
    routeInserts.push({ orgId, name: "Gulf–Europe Transatlantic", originPortId: portLookup["USHOU"], destinationPortId: portLookup["NLRTM"], distanceNm: "5400.00", avgTransitDays: "12.0", riskLevel: "low" as const });
  }
  if (portLookup["JPYOK"] && portLookup["USHOU"]) {
    routeInserts.push({ orgId, name: "Trans-Pacific East", originPortId: portLookup["JPYOK"], destinationPortId: portLookup["USHOU"], distanceNm: "9500.00", avgTransitDays: "21.0", riskLevel: "low" as const });
  }
  if (portLookup["BRSSZ"] && portLookup["NLRTM"]) {
    routeInserts.push({ orgId, name: "South America–Europe", originPortId: portLookup["BRSSZ"], destinationPortId: portLookup["NLRTM"], distanceNm: "5600.00", avgTransitDays: "13.0", riskLevel: "medium" as const });
  }
  if (portLookup["ZAELS"] && portLookup["SGSIN"]) {
    routeInserts.push({ orgId, name: "Cape Route – East Africa", originPortId: portLookup["ZAELS"], destinationPortId: portLookup["SGSIN"], distanceNm: "6800.00", avgTransitDays: "16.0", riskLevel: "medium" as const });
  }
  if (portLookup["AEDXB"] && portLookup["GBFXT"]) {
    routeInserts.push({ orgId, name: "Middle East–UK", originPortId: portLookup["AEDXB"], destinationPortId: portLookup["GBFXT"], distanceNm: "6200.00", avgTransitDays: "14.5", riskLevel: "medium" as const });
  }
  if (portLookup["CNSHA"] && portLookup["USHOU"]) {
    routeInserts.push({ orgId, name: "China–US Gulf", originPortId: portLookup["CNSHA"], destinationPortId: portLookup["USHOU"], distanceNm: "12400.00", avgTransitDays: "28.0", riskLevel: "low" as const });
  }

  const routeRows = routeInserts.length > 0
    ? await db.insert(szlRoutesTable).values(routeInserts).onConflictDoNothing().returning()
    : [];
  console.log(`  ✓ ${routeRows.length} routes`);

  // ─── VOYAGES ──────────────────────────────────────────────────────────────
  const now = new Date();
  const vessels = vesselRows;
  const routes = routeRows;

  if (vessels.length > 0 && routes.length > 0) {
    const voyageRows = await db.insert(szlVoyagesTable).values([
      {
        orgId, vesselId: vessels[0]?.id, routeId: routes[0]?.id, voyageNumber: "VOY-2026-001",
        status: "active", departedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        estimatedArrivalAt: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
        revenueEstimateCents: 480000000, costEstimateCents: 312000000, marginEstimateCents: 168000000,
        delayEstimateHours: "0.00", cargoDescription: "Consumer electronics, 3,200 TEU",
      },
      {
        orgId, vesselId: vessels[2]?.id, routeId: routes[2]?.id, voyageNumber: "VOY-2026-002",
        status: "active", departedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        estimatedArrivalAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        revenueEstimateCents: 220000000, costEstimateCents: 143000000, marginEstimateCents: 77000000,
        delayEstimateHours: "6.50", cargoDescription: "Automotive parts and chemicals",
      },
      {
        orgId, vesselId: vessels[4]?.id, routeId: routes[1]?.id, voyageNumber: "VOY-2026-003",
        status: "delayed", departedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        estimatedArrivalAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        revenueEstimateCents: 390000000, costEstimateCents: 287000000, marginEstimateCents: 103000000,
        delayEstimateHours: "18.00", cargoDescription: "Crude oil, 112,000 MT",
      },
      {
        orgId, vesselId: vessels[7]?.id, routeId: routes[3]?.id, voyageNumber: "VOY-2026-004",
        status: "active", departedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        estimatedArrivalAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        revenueEstimateCents: 310000000, costEstimateCents: 195000000, marginEstimateCents: 115000000,
        delayEstimateHours: "0.00", cargoDescription: "Iron ore bulk, 77,000 MT",
      },
      {
        orgId, vesselId: vessels[8]?.id, routeId: routes[7]?.id ?? routes[0]?.id, voyageNumber: "VOY-2026-005",
        status: "active", departedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        estimatedArrivalAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        revenueEstimateCents: 145000000, costEstimateCents: 89000000, marginEstimateCents: 56000000,
        delayEstimateHours: "0.00", cargoDescription: "General cargo — mixed",
      },
    ]).onConflictDoNothing().returning();
    console.log(`  ✓ ${voyageRows.length} voyages`);
  }

  // ─── LYTE SIGNALS ─────────────────────────────────────────────────────────
  const signalRows = await db.insert(szlSignalsTable).values([
    {
      orgId, productSlug: "lyte", source: "AWS CloudWatch", sourceType: "monitoring",
      severity: "critical", title: "RDS Primary replication lag exceeds 120s — us-east-1",
      body: "prod-db-01 binlog replication lag at 127s. Write IOPS at 42k (provisioned 40k). Failover risk if lag exceeds 300s.",
      whyItMatters: "Payment processing depends on this DB. A failover causes 30-60s downtime and $480K/hr revenue loss.",
      valueAtRiskCents: 80000000, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "db-lag-2026-03-30", detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "PagerDuty", sourceType: "monitoring",
      severity: "critical", title: "Payment pipeline stalled — Stripe webhook queue depth 14.2k",
      body: "Stripe webhook processor queue depth at 14,200 (baseline <500). Payments delayed up to 8 minutes.",
      whyItMatters: "$2.3M in in-flight payments are delayed. Each 10-min delay increases chargeback risk by 12%.",
      valueAtRiskCents: 230000000, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "stripe-queue-2026-03-30", detectedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Datadog APM", sourceType: "monitoring",
      severity: "high", title: "API Gateway p99 latency 8.4s — Kong ingress controller",
      body: "p99 latency at 8.4s against a 2s SLA threshold. Affects 12% of checkout requests.",
      whyItMatters: "High latency increases cart abandonment. Historical data: +1s latency = -7% conversion.",
      valueAtRiskCents: 45000000, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "api-latency-2026-03-30", detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "AWS GuardDuty", sourceType: "monitoring",
      severity: "high", title: "IAM credential exfiltration — prod account 441902834",
      body: "EC2 instance metadata credentials accessed from external IP 198.51.100.42. Prod worker role affected.",
      whyItMatters: "Potential unauthorized access to production resources. Immediate containment needed.",
      valueAtRiskCents: null, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "security-exfil-2026-03-30", detectedAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Sentry", sourceType: "monitoring",
      severity: "high", title: "auth-service v3.14.2 CrashLoopBackOff — OAuth token validation",
      body: "2,400 error events/hr. TypeError at token validation middleware. Enterprise SSO broken for 8 customers.",
      whyItMatters: "8 enterprise customers ($4.2M ARR combined) cannot log in via SSO. Breach of SLA.",
      valueAtRiskCents: 420000000, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "auth-crash-2026-03-30", detectedAt: new Date(now.getTime() - 35 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Datadog", sourceType: "monitoring",
      severity: "high", title: "Redis cluster memory 91% — eviction policy active",
      body: "ElastiCache prod cluster (6-node r6g.2xlarge) at 91% memory. volatile-lru eviction removing session keys.",
      whyItMatters: "Session key eviction causes user logouts. 23 customer support tickets opened in last 2 hours.",
      valueAtRiskCents: 12000000, confidence: "medium", ownerState: "assigned", status: "acknowledged",
      correlationId: "redis-memory-2026-03-30", detectedAt: new Date(now.getTime() - 50 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Stripe", sourceType: "webhook",
      severity: "high", title: "Payment decline rate 12.3% — issuer_decline_code spike",
      body: "Decline rate at 12.3% (baseline 2.1%). Primary code: insufficient_funds. Weekend payroll gap suspected.",
      whyItMatters: "Elevated decline rate reduces revenue and increases refund overhead. $340K impact over 4h.",
      valueAtRiskCents: 34000000, confidence: "medium", ownerState: "unassigned", status: "new",
      correlationId: "payment-decline-2026-03-30", detectedAt: new Date(now.getTime() - 40 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "GitHub Actions", sourceType: "monitoring",
      severity: "medium", title: "Deploy pipeline main→prod OOM killed after 45m",
      body: "Docker build stage killed. Build context 14GB (expected 2GB). node_modules cache invalidation suspected.",
      whyItMatters: "P1 hotfix for payment pipeline blocked. Every 30min delay extends the Stripe incident.",
      valueAtRiskCents: null, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "deploy-blocked-2026-03-30", detectedAt: new Date(now.getTime() - 55 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Terra", sourceType: "monitoring",
      severity: "medium", title: "Q1 revenue forecast drift — 8.3% below plan as of EOD",
      body: "Forecast model updated: Q1 close at $8.7M vs $9.5M plan. Primary drivers: payment decline rate and SSO outage.",
      whyItMatters: "Board reporting Q1 actuals next week. Forecast miss without explanation damages credibility.",
      valueAtRiskCents: 80000000, confidence: "medium", ownerState: "unassigned", status: "new",
      correlationId: "q1-forecast-2026-03-30", detectedAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Terra", sourceType: "monitoring",
      severity: "medium", title: "TechCorp account — usage down 35%, NPS drop 42 pts",
      body: "TechCorp (acct-4821) 30-day API usage down 35%. Support ticket volume up 80%. Competitor evaluation confirmed.",
      whyItMatters: "$480K ARR at risk. Alloy model: 88% churn probability without executive engagement in 12h.",
      valueAtRiskCents: 48000000, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "techcorp-churn-2026-03-30", detectedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Terra", sourceType: "monitoring",
      severity: "medium", title: "Northgate contract approval SLA breach — 48h overdue",
      body: "Contract 840K ARR. Legal team at 94% capacity. VP Legal unavailable until Monday. Q1 close window: 6 days.",
      whyItMatters: "Missing Q1 close window = no revenue recognition this quarter. $840K deferred to Q2.",
      valueAtRiskCents: 84000000, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "northgate-approval-2026-03-30", detectedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte-readiness", source: "Lyte Readiness", sourceType: "manual",
      severity: "medium", title: "NIST CSF gap — 3 critical controls unresolved, audit in 14 days",
      body: "3 critical controls lack evidence. Audit scheduled 2026-04-13. Gap closure rate: 2.1/week (need 4.5/week).",
      whyItMatters: "SOC 2 certification renewal requires passing this audit. Loss = 4 enterprise prospects stalled.",
      valueAtRiskCents: 180000000, confidence: "high", ownerState: "assigned", status: "new",
      correlationId: "nist-gap-2026-03-30", detectedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "vessels", source: "AIS", sourceType: "monitoring",
      severity: "high", title: "MV Pacific Voyager — 18h delay, weather diversion",
      body: "Tropical storm diversion via Cape of Good Hope adds 1,100nm. ETA shifted 18h. Customer notification required.",
      whyItMatters: "$390K voyage. Late arrival fee triggers: $45K. Customer SLA breach possible.",
      valueAtRiskCents: 4500000, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "voyage-delay-003-2026-03-30", detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "vessels", source: "Maintenance System", sourceType: "monitoring",
      severity: "high", title: "MV Northern Spirit — main engine overhaul overdue 12 days",
      body: "Class survey overdue. Engine hours: 19,240 (service interval: 18,000). Lloyd's Register flag raised.",
      whyItMatters: "Operating overdue = insurance invalidation risk. Immediate dry-dock needed. $2.1M vessel downtime.",
      valueAtRiskCents: 210000000, confidence: "high", ownerState: "unassigned", status: "new",
      correlationId: "maintenance-overdue-004-2026-03-30", detectedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "vessels", source: "Weather API", sourceType: "connector",
      severity: "medium", title: "Beaufort 9 forecast — Strait of Malacca, 48h window",
      body: "Storm system tracking NE. Three vessels (incl. MV Meridian Star) in risk corridor. Reroute options available.",
      whyItMatters: "Beaufort 9 causes structural stress. Rerouting adds 16h but reduces hull insurance claim risk.",
      valueAtRiskCents: 8000000, confidence: "medium", ownerState: "unassigned", status: "new",
      correlationId: "weather-malacca-2026-03-30", detectedAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Terra", sourceType: "monitoring",
      severity: "low", title: "Apex Logistics vendor onboarding — compliance step has no owner",
      body: "Compliance step unowned for 6 days. Blocking 6 downstream vendor onboardings. Process gap from team reorg.",
      whyItMatters: "Each blocked onboarding costs ~$53K in delayed procurement savings. 6 × $53K = $318K.",
      valueAtRiskCents: 31800000, confidence: "medium", ownerState: "unassigned", status: "new",
      correlationId: "apex-onboard-2026-03-30", detectedAt: new Date(now.getTime() - 144 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Finance System", sourceType: "connector",
      severity: "low", title: "SEC filing Q1 — CFO sign-off pending 36h",
      body: "10-Q filing due 2026-04-02. CFO approval queue depth: 14 items. Current processing rate: 2.1/day.",
      whyItMatters: "SEC late filing penalty: $50K–$500K. Regulatory credibility impact with upcoming Series B.",
      valueAtRiskCents: 50000000, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "sec-filing-2026-03-30", detectedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "CloudFlare", sourceType: "monitoring",
      severity: "low", title: "CDN cache hit ratio dropped to 62% — purge event",
      body: "CloudFront cache hit ratio from 94% to 62% after unplanned purge. Origin load 4x baseline. Warming ~45min.",
      whyItMatters: "Increased origin load spikes infra costs $12K/hr. Resolved when cache warms.",
      valueAtRiskCents: 1200000, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "cdn-purge-2026-03-30", detectedAt: new Date(now.getTime() - 55 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Terra", sourceType: "monitoring",
      severity: "low", title: "Lambda cold starts +340% — order-processor post-deploy",
      body: "Cold start rate at 340% above baseline after deploy. Affects 6% of order processing requests.",
      whyItMatters: "Elevated cold starts increase p99 latency during peak. Non-critical but contributes to API SLA risk.",
      valueAtRiskCents: null, confidence: "medium", ownerState: "unassigned", status: "new",
      correlationId: "lambda-cold-2026-03-30", detectedAt: new Date(now.getTime() - 35 * 60 * 1000),
    },
    {
      orgId, productSlug: "lyte", source: "Datadog", sourceType: "monitoring",
      severity: "stable", title: "PostgreSQL connection pool 95% utilized — non-critical",
      body: "RDS proxy max_connections at 95%. Application team aware. Scale event scheduled for tomorrow.",
      whyItMatters: "At current growth rate, hits 100% in 18h. Pre-emptive scale planned. No action urgency.",
      valueAtRiskCents: null, confidence: "high", ownerState: "assigned", status: "acknowledged",
      correlationId: "pg-pool-2026-03-30", detectedAt: new Date(now.getTime() - 75 * 60 * 1000),
    },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${signalRows.length} signals`);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  const criticalSignal = signalRows.find((s: SzlSignal) => s.correlationId === "db-lag-2026-03-30");
  const paymentSignal = signalRows.find((s: SzlSignal) => s.correlationId === "stripe-queue-2026-03-30");
  const churnSignal = signalRows.find((s: SzlSignal) => s.correlationId === "techcorp-churn-2026-03-30");
  const northgateSignal = signalRows.find((s: SzlSignal) => s.correlationId === "northgate-approval-2026-03-30");
  const maintenanceSignal = signalRows.find((s: SzlSignal) => s.correlationId === "maintenance-overdue-004-2026-03-30");

  const actionRows = await db.insert(szlActionsTable).values([
    {
      orgId, signalId: criticalSignal?.id, title: "Initiate manual RDS failover to standby — prod-db-01",
      description: "Trigger controlled failover to minimize replication lag risk. Coordinate with DBA team for 30s connection drop.",
      actionState: "in_progress", escalationState: "none", estimatedValueProtectedCents: 80000000,
      dueAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    },
    {
      orgId, signalId: paymentSignal?.id, title: "Scale Stripe webhook processor — 3x replica count",
      description: "Increase processor replicas from 2 to 6. Update HPA min/max. Monitor queue depth.",
      actionState: "open", escalationState: "escalated", estimatedValueProtectedCents: 230000000,
      dueAt: new Date(now.getTime() + 60 * 60 * 1000),
    },
    {
      orgId, signalId: churnSignal?.id, title: "CEO-to-CEO outreach — TechCorp executive engagement",
      description: "Direct outreach from CEO. Approved 30% retention discount if confirmed. 12h action window.",
      actionState: "assigned", escalationState: "escalated", estimatedValueProtectedCents: 48000000,
      dueAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
    },
    {
      orgId, signalId: northgateSignal?.id, title: "Reroute Northgate contract to CFO backup approver",
      description: "VP Legal unavailable until Monday. CFO has delegated signing authority. Initiate reroute.",
      actionState: "in_progress", escalationState: "none", estimatedValueProtectedCents: 84000000,
      dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    },
    {
      orgId, signalId: maintenanceSignal?.id, title: "Schedule MV Northern Spirit emergency dry-dock",
      description: "Contact Lloyd's Register and nearest dry-dock facility. Reroute current voyage to nearest safe port.",
      actionState: "open", escalationState: "none", estimatedValueProtectedCents: 210000000,
      dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      orgId, signalId: null, title: "Assign owner to Apex Logistics compliance step",
      description: "Team reorg left this step orphaned. Assign to procurement compliance lead or temp contractor.",
      actionState: "open", escalationState: "none", estimatedValueProtectedCents: 31800000,
      dueAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
    },
    {
      orgId, signalId: null, title: "Close NIST CSF critical control gaps — 3 controls, 14 days",
      description: "Prioritize AC-2, RA-5, and SC-28. Assign DRI per control. Daily standup with CISO.",
      actionState: "assigned", escalationState: "none", estimatedValueProtectedCents: 180000000,
      dueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${actionRows.length} actions`);

  // ─── WORKFLOWS ────────────────────────────────────────────────────────────
  const workflowRows = await db.insert(szlWorkflowsTable).values([
    { orgId, name: "Contract Approval — Standard Track", triggerType: "event", approvalRequired: true, configJson: { sla_hours: 48, escalate_after_hours: 24 }, isActive: true },
    { orgId, name: "Customer Churn Intervention", triggerType: "signal", approvalRequired: true, configJson: { confidence_threshold: 0.75, impact_floor_cents: 10000000 }, isActive: true },
    { orgId, name: "Incident Response — P1 Automated Runbook", triggerType: "signal", approvalRequired: false, configJson: { severity: "critical", auto_escalate: true }, isActive: true },
    { orgId, name: "Vendor Onboarding — Compliance Check", triggerType: "manual", approvalRequired: true, configJson: { steps: ["identity", "compliance", "contract", "activation"] }, isActive: true },
    { orgId, name: "Voyage Exception Notification", triggerType: "event", approvalRequired: false, configJson: { notify_stakeholders: true, threshold_delay_hours: 4 }, isActive: true },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${workflowRows.length} workflows`);

  // ─── READINESS ITEMS ──────────────────────────────────────────────────────
  const readinessRows = await db.insert(szlReadinessItemsTable).values([
    {
      orgId, productSlug: "lyte-readiness", title: "SOC 2 Type II — Evidence Collection Complete",
      description: "All 87 controls require evidence. 64 complete. 23 in progress. 3 critical unresolved.",
      category: "compliance", status: "at_risk", readinessScore: "73.6",
      blockerSummary: "AC-2 (Access Control), RA-5 (Risk Assessment), SC-28 (Data Protection) evidence incomplete",
      dueDate: new Date("2026-04-13"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Payment Infrastructure Resilience",
      description: "RDS failover, Stripe queue scaling, and API gateway SLA compliance.",
      category: "technical", status: "at_risk", readinessScore: "58.0",
      blockerSummary: "Active P1 incidents: RDS replication lag, Stripe queue depth, API latency breach",
      dueDate: new Date("2026-04-01"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Series B Due Diligence Readiness",
      description: "Financial models, cap table, customer references, product roadmap documentation.",
      category: "financial", status: "on_track", readinessScore: "82.0",
      dueDate: new Date("2026-05-15"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Enterprise SSO Implementation — 5 Priority Accounts",
      description: "SSO via SAML for top 5 enterprise accounts. auth-service v3.14.2 currently in CrashLoopBackOff.",
      category: "technical", status: "blocked", readinessScore: "40.0",
      blockerSummary: "auth-service crash loop blocks all SSO deployments. Rollback to v3.14.1 pending DB migration.",
      dependencyJson: { depends_on: ["auth-service-stabilization", "db-migration-rollback"], blockers_count: 2 },
      dueDate: new Date("2026-04-30"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Maritime Ops Deployment — Vessels V2",
      description: "V2 Vessels platform deployment with real-time AIS, voyage economics, and exception alerting.",
      category: "operational", status: "on_track", readinessScore: "88.5",
      dueDate: new Date("2026-04-15"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Alloy Execution Fabric — Production Hardening",
      description: "Workflow engine capacity, approval state machine testing, and escalation path validation.",
      category: "technical", status: "on_track", readinessScore: "79.0",
      dueDate: new Date("2026-05-01"),
    },
    {
      orgId, productSlug: "lyte-readiness", title: "Operator Team Readiness — Lyte Training",
      description: "7 operators trained on Lyte command center. 4 certified. 3 in progress.",
      category: "people", status: "on_track", readinessScore: "71.4",
      dueDate: new Date("2026-04-30"),
    },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${readinessRows.length} readiness items`);

  // ─── EXCEPTIONS ───────────────────────────────────────────────────────────
  const voyageDelaySignal = signalRows.find((s: SzlSignal) => s.correlationId === "voyage-delay-003-2026-03-30");
  const weatherSignal = signalRows.find((s: SzlSignal) => s.correlationId === "weather-malacca-2026-03-30");

  await db.insert(szlExceptionsTable).values([
    {
      orgId, entityType: "signal", entityId: voyageDelaySignal?.id,
      severity: "high", title: "MV Pacific Voyager — Late arrival penalty triggered",
      whyItMatters: "$45K late arrival fee applies if vessel arrives >18h past ETA. Customer SLA breach possible.",
      estimatedImpactCents: 4500000, status: "open", detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      orgId, entityType: "signal", entityId: weatherSignal?.id,
      severity: "medium", title: "Storm rerouting decision required — 48h window",
      whyItMatters: "Beaufort 9 exposes MV Meridian Star to structural risk. Reroute costs $180K but avoids hull claim.",
      estimatedImpactCents: 18000000, status: "open", detectedAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      orgId, entityType: "signal", entityId: paymentSignal?.id,
      severity: "critical", title: "Payment processor SLA breach — 8min delay threshold exceeded",
      whyItMatters: "Enterprise payment SLA is 3min. 6 enterprise accounts at breach risk. Contractual penalty: $120K.",
      estimatedImpactCents: 12000000, status: "open", detectedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
  ]).onConflictDoNothing();
  console.log("  ✓ exceptions");

  // ─── FEATURE FLAGS ─────────────────────────────────────────────────────────
  const flagRows = await db.insert(szlFeatureFlagsTable).values([
    { key: "lyte_readiness_enabled", name: "Lyte Readiness Module", description: "Enable the Lyte Readiness maturity assessment module", isEnabled: true, rolloutPercentage: 100, product: "lyte" },
    { key: "lyte_value_at_risk_enabled", name: "Lyte Value at Risk Calculations", description: "Show value_at_risk_cents on signals and exceptions in the Lyte UI", isEnabled: true, rolloutPercentage: 100, product: "lyte" },
    { key: "vessels_command_mode_enabled", name: "Vessels Command Mode", description: "Full voyage exception and escalation command mode in Vessels", isEnabled: true, rolloutPercentage: 100, product: "vessels" },
    { key: "alloy_admin_enabled", name: "Alloy Admin Console", description: "Enable the Alloy workflow/DAG admin console", isEnabled: false, rolloutPercentage: 0, product: "alloy" },
    { key: "lyte_approval_workflow_v2", name: "Approval Workflow V2", description: "New approval state machine with escalation paths and SLA timers", isEnabled: true, rolloutPercentage: 100, product: "lyte" },
    { key: "vessels_fuel_efficiency_scoring", name: "Vessels Fuel Efficiency Scoring", description: "Real-time fuel efficiency scoring per voyage", isEnabled: true, rolloutPercentage: 80, product: "vessels" },
    { key: "alloy_predictive_intelligence", name: "Alloy Predictive Intelligence", description: "Confidence-weighted predictions and risk scenario modeling in Alloy", isEnabled: false, rolloutPercentage: 0, product: "alloy" },
    { key: "demo_mode_enabled", name: "Demo Mode", description: "Use seed/mock data for all product surfaces. Disables live API writes.", isEnabled: true, rolloutPercentage: 100, product: null },
    { key: "staging_features_enabled", name: "Staging Features", description: "Enable pre-production features not yet ready for production", isEnabled: false, rolloutPercentage: 0, product: null },
    { key: "lyte_owner_state_tracking", name: "Lyte Owner State Tracking", description: "Track owner_state on signals (assigned/unassigned/ambiguous/stale/escalated)", isEnabled: true, rolloutPercentage: 100, product: "lyte" },
  ]).onConflictDoNothing().returning();
  console.log(`  ✓ ${flagRows.length} feature flags`);

  console.log("\nSZL canonical seed complete.");
}

seedCanonical().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
