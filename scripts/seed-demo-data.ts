import {
  db,
  firestormAssetsTable,
  firestormWorkflowActionsTable,
  lyteActionsTable,
  lyteReadinessItemsTable,
  lyteSavedViewsTable,
  vesselsCommandWorkflowsTable,
  vesselsEventsTable,
  vesselsTable,
} from '@szl-holdings/db';

async function seedFirestorm() {
  const assets = await db
    .insert(firestormAssetsTable)
    .values([
      {
        name: 'Payment API v3',
        assetType: 'service',
        owner: 'Platform Engineering',
        criticality: 'critical',
        riskScore: '9.5',
        status: 'vulnerable',
        tags: ['payment', 'pci-dss', 'api'],
        metadata: { env: 'production', version: '3.2.1', lastScan: '2026-03-29' },
      },
      {
        name: 'Auth Service Cluster',
        assetType: 'service',
        owner: 'Security Team',
        criticality: 'critical',
        riskScore: '8.7',
        status: 'monitoring',
        tags: ['auth', 'identity', 'jwt'],
        metadata: { env: 'production', version: '2.8.0', lastScan: '2026-03-28' },
      },
      {
        name: 'Corporate VPN Gateway',
        assetType: 'network',
        owner: 'IT Infrastructure',
        criticality: 'high',
        riskScore: '8.1',
        status: 'vulnerable',
        tags: ['vpn', 'network', 'gateway'],
        metadata: { env: 'production', vendor: 'Cisco', model: 'ASA 5525-X' },
      },
      {
        name: 'Customer Data Lake',
        assetType: 'database',
        owner: 'Data Engineering',
        criticality: 'critical',
        riskScore: '7.4',
        status: 'compliant',
        tags: ['data', 'pii', 'gdpr'],
        metadata: { env: 'production', recordCount: 2400000, encrypted: true },
      },
      {
        name: 'CI/CD Pipeline',
        assetType: 'service',
        owner: 'DevOps',
        criticality: 'high',
        riskScore: '6.2',
        status: 'compliant',
        tags: ['cicd', 'deploy', 'github'],
        metadata: { env: 'production', tool: 'GitHub Actions', lastDeploy: '2026-03-30' },
      },
      {
        name: 'Employee Workstations — Fleet',
        assetType: 'endpoint',
        owner: 'IT Support',
        criticality: 'medium',
        riskScore: '4.8',
        status: 'monitoring',
        tags: ['endpoint', 'mdm', 'windows'],
        metadata: { count: 342, os: 'Windows 11', mdm: 'Intune' },
      },
      {
        name: 'API Gateway — External',
        assetType: 'network',
        owner: 'Platform Engineering',
        criticality: 'high',
        riskScore: '7.9',
        status: 'monitoring',
        tags: ['api', 'gateway', 'external'],
        metadata: { env: 'production', provider: 'AWS API Gateway', rps: 45000 },
      },
    ])
    .returning();
  const _wfActions = await db
    .insert(firestormWorkflowActionsTable)
    .values([
      {
        entityType: 'asset',
        entityId: assets[0].id,
        actionType: 'remediate',
        status: 'in_progress',
        assignedTo: 'Platform Engineering',
        notes:
          'CVE-2024-4451 exploits improper JWT validation. Apply patch 3.2.2 in maintenance window.',
        triggeredBy: 'alloy-wf-001',
      },
      {
        entityType: 'asset',
        entityId: assets[2].id,
        actionType: 'remediate',
        status: 'pending',
        assignedTo: 'IT Infrastructure',
        notes:
          'Remote code execution vulnerability in Cisco ASA firmware. Patch available, reboot required.',
        triggeredBy: 'alloy-wf-002',
      },
      {
        entityType: 'asset',
        entityId: assets[1].id,
        actionType: 'acknowledge',
        status: 'completed',
        assignedTo: 'Security Team',
        notes:
          'Review session token generation and rotation policies. Implement secure session ID regeneration.',
        triggeredBy: 'alloy-wf-003',
      },
    ])
    .returning();
}

async function seedLyte() {
  const _actions = await db
    .insert(lyteActionsTable)
    .values([
      {
        title: 'Northgate Contract — Legal Review Stalled',
        description:
          'Contract stuck in legal queue 48h past SLA. $840K ARR at risk if not executed by EOM.',
        signalCategory: 'approval_latency',
        state: 'new',
        priority: 'urgent',
        owner: 'Jordan Alvarez',
        valueAtRisk: '840000',
        roleVisibility: { executive: true, operations: true },
        metadata: {
          contractId: 'NOR-2026-0312',
          dealStage: 'legal_review',
          slaBreachedAt: '2026-03-28T09:00:00Z',
        },
      },
      {
        title: 'TechCorp Onboarding — No Owner Assigned',
        description:
          'Critical onboarding step has been unassigned for 6 days. Customer escalation risk.',
        signalCategory: 'ownership_gap',
        state: 'acknowledged',
        priority: 'high',
        owner: 'Marcus Webb',
        valueAtRisk: '320000',
        roleVisibility: { operations: true, delivery: true },
        metadata: { customerId: 'TECH-0891', onboardingStep: 'technical_setup', daysPending: 6 },
      },
      {
        title: 'Q2 Revenue Forecast — 18% Drift Detected',
        description: 'Beacon forecast model shows 18% deviation from plan. $2.1M gap forming.',
        signalCategory: 'forecast_drift',
        state: 'new',
        priority: 'urgent',
        owner: 'Sarah Kim',
        valueAtRisk: '2100000',
        roleVisibility: { executive: true },
        metadata: { forecastPeriod: 'Q2-2026', planTarget: 12400000, currentTrack: 10300000 },
      },
      {
        title: 'Vendor Onboarding Pipeline — 3 Stalled',
        description: 'Three vendor workflows stuck at compliance check for 5+ days.',
        signalCategory: 'stalled_workflow',
        state: 'assigned',
        priority: 'high',
        owner: 'Riley Torres',
        assignedTo: 'Compliance Team',
        valueAtRisk: '180000',
        roleVisibility: { operations: true, delivery: true },
        metadata: {
          vendorIds: ['VEN-0045', 'VEN-0078', 'VEN-0092'],
          blockedStep: 'compliance_review',
        },
      },
      {
        title: 'Apex Logistics — Handoff Failure at Delivery',
        description: 'Customer success handoff failed; no confirmation from delivery lead.',
        signalCategory: 'handoff_failure',
        state: 'escalated',
        priority: 'urgent',
        owner: 'Alex Chen',
        valueAtRisk: '560000',
        roleVisibility: { executive: true, operations: true, delivery: true },
        metadata: {
          customerId: 'APEX-0156',
          handoffStep: 'delivery_lead_confirmation',
          escalatedAt: '2026-03-29T14:00:00Z',
        },
      },
      {
        title: 'Enterprise Deal Status Conflict — $1.2M',
        description:
          'CRM shows Closed Won but finance has not received PO. Revenue recognition at risk.',
        signalCategory: 'status_conflict',
        state: 'new',
        priority: 'high',
        owner: 'Morgan Lee',
        valueAtRisk: '1200000',
        roleVisibility: { executive: true, operations: true },
        metadata: {
          dealId: 'ENT-2026-0889',
          crmStatus: 'closed_won',
          financeStatus: 'awaiting_po',
        },
      },
      {
        title: 'Platform Launch — 3 Gates Not Cleared',
        description: 'Security review, load test sign-off, and legal clearance all pending.',
        signalCategory: 'readiness_blocker',
        state: 'assigned',
        priority: 'high',
        owner: 'Sam Park',
        assignedTo: 'Launch Team',
        valueAtRisk: '450000',
        roleVisibility: { operations: true, delivery: true },
        metadata: {
          launchDate: '2026-04-15',
          gatesBlocked: ['security_review', 'load_test', 'legal_clearance'],
        },
      },
      {
        title: 'Pipeline Hygiene — 47 Stale Opportunities',
        description:
          'Deals last touched >30 days consuming forecast capacity. Recommend close or disqualify.',
        signalCategory: 'pipeline_hygiene',
        state: 'new',
        priority: 'medium',
        owner: 'Jordan Alvarez',
        valueAtRisk: '890000',
        roleVisibility: { executive: true, operations: true },
        metadata: { staleCount: 47, totalPipelineValue: 890000, oldestDealAge: 87 },
      },
    ])
    .returning();
  await db.insert(lyteSavedViewsTable).values([
    {
      name: 'Executive Dashboard',
      description: 'High-value escalations for executive review',
      filters: { role: 'executive', priority: 'urgent' },
      isDefault: true,
    },
    {
      name: 'Ops Queue — Today',
      description: 'All open ops items due today',
      filters: { role: 'operations', state: 'new' },
      isDefault: false,
    },
    {
      name: 'Delivery Blockers',
      description: 'Readiness blockers and ownership gaps',
      filters: { role: 'delivery', signalCategory: 'readiness_blocker' },
      isDefault: false,
    },
  ]);
  await db.insert(lyteReadinessItemsTable).values([
    {
      title: 'Security Review Sign-off',
      description: 'Awaiting infosec review of payment integration. CVE-2024-3891 flagged.',
      itemType: 'launch_gate',
      status: 'blocked',
      owner: 'Riley Torres',
      dueAt: new Date(Date.now() + 3 * 86400000),
      metadata: { reviewType: 'security', cve: 'CVE-2024-3891', assignedTo: 'InfoSec Team' },
    },
    {
      title: 'Load Testing — 10K concurrent users',
      description: 'Testing in progress on staging cluster. Results expected in 48h.',
      itemType: 'launch_gate',
      status: 'in_progress',
      owner: 'Sam Park',
      dueAt: new Date(Date.now() + 2 * 86400000),
      metadata: { targetConcurrency: 10000, environment: 'staging', testTool: 'k6' },
    },
    {
      title: 'Legal Clearance — Data Processing Agreement',
      description: 'DPA with three EU vendors not yet signed.',
      itemType: 'launch_gate',
      status: 'not_started',
      owner: 'Morgan Lee',
      dueAt: new Date(Date.now() + 7 * 86400000),
      metadata: { vendorCount: 3, jurisdiction: 'EU', dpaType: 'standard_contractual_clauses' },
    },
    {
      title: 'Customer Success Handoff Checklist',
      description: 'All CS onboarding materials reviewed and approved.',
      itemType: 'milestone',
      status: 'complete',
      owner: 'Alex Chen',
      metadata: { checklistItems: 12, completedAt: '2026-03-28' },
    },
    {
      title: 'Stripe Integration — PCI DSS Attestation',
      description: 'PCI DSS SAQ-A must be submitted before processing live payments.',
      itemType: 'blocker',
      status: 'blocked',
      owner: 'Jordan Alvarez',
      dueAt: new Date(Date.now() + 1 * 86400000),
      metadata: {
        complianceStandard: 'PCI-DSS-v4',
        saqType: 'SAQ-A',
        submissionUrl: 'https://stripe.com/pci',
      },
    },
    {
      title: 'Feature Flag Rollout Plan',
      description: 'Progressive rollout plan confirmed. Feature flags configured in admin panel.',
      itemType: 'dependency',
      status: 'complete',
      owner: 'Sam Park',
      metadata: { rolloutStrategy: 'percentage', targetPercentage: 10, flagCount: 8 },
    },
    {
      title: 'Executive Sponsor Sign-off',
      description: 'Executive review of launch readiness deck pending.',
      itemType: 'owner_check',
      status: 'not_started',
      owner: 'Sarah Kim',
      dueAt: new Date(Date.now() + 4 * 86400000),
      metadata: { deckVersion: 'v3', reviewerLevel: 'C-suite' },
    },
    {
      title: 'Runbook — Incident Response During Launch',
      description: 'On-call runbook for launch window being finalized.',
      itemType: 'dependency',
      status: 'in_progress',
      owner: 'Riley Torres',
      dueAt: new Date(Date.now() + 2 * 86400000),
      metadata: { runbookVersion: 'draft-2', oncallRotation: 'engineering-leads' },
    },
  ]);
}

async function seedVessels() {
  const vessels = await db
    .insert(vesselsTable)
    .values([
      { name: 'Atlantic Pioneer', vesselType: 'cargo', flag: 'MT', status: 'at_sea' },
      { name: 'Pacific Guardian', vesselType: 'container', flag: 'PA', status: 'at_sea' },
      { name: 'Nordic Crest', vesselType: 'bulk', flag: 'NO', status: 'in_port' },
      { name: 'Singapore Star', vesselType: 'tanker', flag: 'SG', status: 'anchored' },
    ])
    .returning();
  const vesselIds = vessels.map((v) => v.id);
  const events = await db
    .insert(vesselsEventsTable)
    .values([
      {
        vesselId: vesselIds[0],
        eventType: 'eta_drift',
        severity: 'critical',
        status: 'open',
        title: 'ETA Drift — 34h delay on Atlantic Pioneer',
        description:
          'Route delay due to Strait of Gibraltar congestion. Port slot at Rotterdam at risk.',
        consequenceData: {
          delayHours: 34,
          marginImpact: 420000,
          routePressure: 'high',
          fuelImpact: 18000,
          portSlotRisk: true,
        },
      },
      {
        vesselId: vesselIds[1],
        eventType: 'route_deviation',
        severity: 'warning',
        status: 'acknowledged',
        title: 'Route Deviation — Pacific Guardian off optimal lane',
        description: 'Vessel deviated 42nm from planned route due to weather system.',
        consequenceData: {
          deviationNm: 42,
          fuelImpact: 24000,
          weatherRisk: 'moderate',
          etaImpact: 8,
        },
        assignedTo: 'Helmsman AI',
        acknowledgedAt: new Date(),
      },
      {
        vesselId: vesselIds[2],
        eventType: 'maintenance_watch',
        severity: 'warning',
        status: 'open',
        title: 'Engine Maintenance Watch — Nordic Crest',
        description: 'Predictive maintenance flag: Main engine bearing wear at 78% threshold.',
        consequenceData: {
          componentRisk: 'main_engine',
          wearPct: 78,
          inspectionDue: 'Rotterdam',
          operationalRisk: 'medium',
        },
      },
      {
        vesselId: vesselIds[3],
        eventType: 'port_congestion',
        severity: 'watch',
        status: 'assigned',
        title: 'Port Congestion — Singapore Anchorage',
        description: 'Average wait time at Singapore increased to 4.2 days.',
        consequenceData: { waitDays: 4.2, congestionTrend: 'increasing', revenueImpact: 95000 },
        assignedTo: 'Ops Team',
      },
      {
        vesselId: vesselIds[0],
        eventType: 'weather_pressure',
        severity: 'critical',
        status: 'open',
        title: 'Severe Weather — Typhoon Track Intersecting Route',
        description:
          'Tropical storm tracking to intercept planned route. Rerouting required within 6h window.',
        consequenceData: {
          windKnots: 55,
          waveHeightM: 8.5,
          routePressure: 'severe',
          rerouting: 'recommended',
        },
      },
    ])
    .returning();
  await db.insert(vesselsCommandWorkflowsTable).values([
    {
      eventId: events[0].id,
      vesselId: vesselIds[0],
      workflowType: 'escalation',
      status: 'in_progress',
      assignedTo: 'Fleet Operations Director',
      notes:
        'Escalated to director due to $420K margin impact. Counsel routing intervention triggered.',
      alloyWorkflowRef: 'alloy-wf-vessels-001',
    },
    {
      eventId: events[4].id,
      vesselId: vesselIds[0],
      workflowType: 'route_intervention',
      status: 'in_progress',
      assignedTo: 'Helmsman AI',
      notes:
        'Alternative route via north Atlantic corridor calculated. ETA penalty: 8h vs 34h typhoon delay.',
      alloyWorkflowRef: 'alloy-wf-vessels-002',
    },
    {
      eventId: events[1].id,
      vesselId: vesselIds[1],
      workflowType: 'owner_assignment',
      status: 'completed',
      assignedTo: 'Second Officer Chen',
      notes:
        'Route deviation acknowledged. Monitoring fuel burn. No intervention required at this stage.',
      completedAt: new Date(),
    },
  ]);
}

async function main() {

  try {
    await seedFirestorm();
    await seedLyte();
    await seedVessels();
    process.exit(0);
  } catch (_err) {
    process.exit(1);
  }
}

main();
