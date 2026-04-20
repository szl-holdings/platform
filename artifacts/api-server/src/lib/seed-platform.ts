import { getRuntimeMode, isSeedDataAllowed } from '@szl-holdings/config';
import {
  actionsTable,
  artifactsTable,
  corridorsTable,
  db,
  featureFlagsTable,
  maritimeExceptionsTable,
  maritimeVesselsTable,
  organizationsTable,
  orgMembersTable,
  platformSignalsTable,
  portsTable,
  readinessItemsTable,
  usersTable,
  voyagesTable,
  workflowRunsTable,
  workflowsTable,
} from '@szl-holdings/db';
import { productsTable } from '@szl-holdings/db/schema/canonical';
import { eq, sql } from 'drizzle-orm';

async function tableHasData(table: any, sectionName: string): Promise<boolean> {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
    return count > 0;
  } catch (err) {
    console.error(
      `[seed-platform] ERROR while checking whether table for section "${sectionName}" has data:`,
      err,
    );
    throw err;
  }
}

async function runSection<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[seed-platform] ERROR in section "${name}":`, err);
    throw err;
  }
}

export async function seedPlatformData(): Promise<void> {
  if (!isSeedDataAllowed()) {
    const mode = getRuntimeMode();
    throw new Error(
      `[seed-platform] Attempted to seed demo data in ${mode} mode. ` +
        `Seed data is only permitted in local-dev, internal-preview, and demo modes. ` +
        `Set DEMO_MODE=true or ENABLE_DEMO_SEED=true to enable seeding in non-production environments.`,
    );
  }
  console.log('[seed-platform] Starting platform seed data...');

  const orgsExist = await tableHasData(organizationsTable, 'organizations');
  const signalsExist = await tableHasData(platformSignalsTable, 'platform_signals');
  const vesselsExist = await tableHasData(maritimeVesselsTable, 'maritime_vessels');
  const voyagesExist = await tableHasData(voyagesTable, 'voyages');
  const exceptionsExist = await tableHasData(maritimeExceptionsTable, 'maritime_exceptions');

  if (orgsExist && signalsExist && vesselsExist && voyagesExist && exceptionsExist) {
    console.log('[seed-platform] Platform data already seeded, skipping...');
    return;
  }

  const { alloyOrg, lyteOrg, vesselsOrg } = await runSection('organizations', async () => {
    const [alloyOrg] = await db
      .insert(organizationsTable)
      .values({
        name: 'Alloy Demo Corp',
        slug: 'alloy-demo',
        orgType: 'platform_customer',
        status: 'active',
        plan: 'enterprise',
      })
      .onConflictDoNothing()
      .returning();

    const [lyteOrg] = await db
      .insert(organizationsTable)
      .values({
        name: 'Lyte Command Demo',
        slug: 'lyte-demo',
        orgType: 'platform_customer',
        status: 'active',
        plan: 'professional',
      })
      .onConflictDoNothing()
      .returning();

    const [vesselsOrg] = await db
      .insert(organizationsTable)
      .values({
        name: 'Vessels Maritime Demo',
        slug: 'vessels-demo',
        orgType: 'maritime_operator',
        status: 'active',
        plan: 'enterprise',
      })
      .onConflictDoNothing()
      .returning();

    return { alloyOrg, lyteOrg, vesselsOrg };
  });

  async function resolveOrgId(returned: { id: number } | undefined, slug: string): Promise<number> {
    if (returned?.id) return returned.id;
    const [existing] = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, slug));
    if (!existing?.id) {
      throw new Error(`[seed-platform] Could not resolve org id for slug "${slug}"`);
    }
    return existing.id;
  }

  const seedOrgId = await resolveOrgId(alloyOrg, 'alloy-demo');
  const seedLyteOrgId = await resolveOrgId(lyteOrg, 'lyte-demo');
  const seedVesselsOrgId = await resolveOrgId(vesselsOrg, 'vessels-demo');

  await runSection('products', () =>
    db
      .insert(productsTable)
      .values([
        {
          key: 'alloy',
          name: 'Alloy',
          description:
            'Execution Fabric — signal ingest, workflow orchestration, artifact management',
          category: 'platform' as const,
          isActive: true,
        },
        {
          key: 'lyte',
          name: 'Lyte Command Center',
          description: 'Business telemetry and ops signal management for MSPs',
          category: 'ops' as const,
          isActive: true,
        },
        {
          key: 'vessels',
          name: 'Vessels Maritime Intelligence',
          description: 'Maritime fleet monitoring, voyage management, and exception handling',
          category: 'maritime' as const,
          isActive: true,
        },
        {
          key: 'terra',
          name: 'Terra',
          description: 'Predictive intelligence and business analytics',
          category: 'intelligence' as const,
          isActive: true,
        },
        {
          key: 'inca',
          name: 'INCA AI Research Command',
          description: 'AI research orchestration and knowledge management',
          category: 'intelligence' as const,
          isActive: true,
        },
      ])
      .onConflictDoNothing(),
  );

  await runSection('feature_flags', () =>
    db
      .insert(featureFlagsTable)
      .values([
        {
          key: 'alloy.signal_ingest',
          name: 'Alloy Signal Ingest',
          description: 'Enable signal ingest API for Alloy',
          isEnabled: true,
          scope: 'product',
          product: 'alloy',
          rolloutPercentage: 100,
        },
        {
          key: 'alloy.workflow_engine',
          name: 'Alloy Workflow Engine',
          description: 'Enable workflow CRUD and run management',
          isEnabled: true,
          scope: 'product',
          product: 'alloy',
          rolloutPercentage: 100,
        },
        {
          key: 'alloy.artifact_approval',
          name: 'Alloy Artifact Approval',
          description: 'Enable artifact approve/reject flow',
          isEnabled: true,
          scope: 'product',
          product: 'alloy',
          rolloutPercentage: 100,
        },
        {
          key: 'lyte.dashboard',
          name: 'Lyte Dashboard',
          description: 'Enable role-aware dashboard',
          isEnabled: true,
          scope: 'product',
          product: 'lyte',
          rolloutPercentage: 100,
        },
        {
          key: 'lyte.signal_lifecycle',
          name: 'Lyte Signal Lifecycle',
          description: 'Enable full signal lifecycle (ack/assign/escalate/resolve/override)',
          isEnabled: true,
          scope: 'product',
          product: 'lyte',
          rolloutPercentage: 100,
        },
        {
          key: 'vessels.voyage_economics',
          name: 'Vessels Voyage Economics',
          description: 'Enable voyage economics computation',
          isEnabled: true,
          scope: 'product',
          product: 'vessels',
          rolloutPercentage: 100,
        },
        {
          key: 'vessels.eta_drift',
          name: 'Vessels ETA Drift',
          description: 'Enable ETA drift calculation and alerts',
          isEnabled: true,
          scope: 'product',
          product: 'vessels',
          rolloutPercentage: 100,
        },
        {
          key: 'platform.executive_views',
          name: 'Executive View Mode',
          description: 'Enable read-only executive dashboard payloads',
          isEnabled: true,
          scope: 'role',
          requiredPlatformRole: 'executive_viewer',
          rolloutPercentage: 100,
        },
      ])
      .onConflictDoNothing(),
  );

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600000);
  const dayAgo = new Date(now.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  if (!signalsExist) {
    await runSection('platform_signals (alloy)', () =>
      db
        .insert(platformSignalsTable)
        .values([
          {
            orgId: seedOrgId,
            source: 'connector:datadog',
            sourceType: 'connector',
            title: 'Production API latency spike — P99 > 8s',
            body: 'API gateway P99 response time exceeded 8 seconds for 15 consecutive minutes. Affecting 23% of requests.',
            severity: 'critical',
            status: 'processed',
            normalizedScore: '92.5',
            valueAtRisk: '450000',
            metadata: {
              category: 'performance',
              tags: ['api', 'latency', 'sla', 'production'],
              whatHappened: 'Production API latency spiked to P99 > 8000ms across all endpoints',
              nextAction: 'Escalate to on-call engineering, initiate incident runbook',
            },
            receivedAt: new Date(now.getTime() - 7200000),
            processedAt: new Date(now.getTime() - 6900000),
          },
          {
            orgId: seedOrgId,
            source: 'connector:stripe',
            sourceType: 'connector',
            title: 'Payment processing failure rate elevated — 4.2%',
            body: 'Stripe webhook failure rate increased from 0.3% to 4.2% in the past 2 hours. 147 failed transactions.',
            severity: 'high',
            status: 'processing',
            normalizedScore: '78.0',
            valueAtRisk: '352800',
            metadata: {
              category: 'revenue',
              tags: ['payments', 'stripe', 'webhooks'],
              whatHappened: 'Payment webhook failure rate 14x normal — 147 transactions impacted',
            },
            receivedAt: hourAgo,
          },
          {
            orgId: seedOrgId,
            source: 'connector:security',
            sourceType: 'connector',
            title: 'Suspicious login pattern — 47 failed attempts from new IP range',
            body: '47 failed login attempts detected from IP range 195.34.xx.xx (Romania) targeting admin accounts in 8 minutes.',
            severity: 'high',
            status: 'processed',
            normalizedScore: '85.0',
            valueAtRisk: '2000000',
            metadata: {
              category: 'security',
              tags: ['security', 'login', 'threat'],
              whatHappened:
                'Credential stuffing attempt detected — 47 attempts targeting 12 admin accounts',
            },
            receivedAt: new Date(now.getTime() - 1800000),
            processedAt: new Date(now.getTime() - 1500000),
          },
          {
            orgId: seedOrgId,
            source: 'monitoring:cloudwatch',
            sourceType: 'monitoring',
            title: 'Database connection pool exhausted',
            body: 'RDS connection pool reached 98% capacity. New connections being queued. Latency degrading.',
            severity: 'critical',
            status: 'new',
            normalizedScore: '95.0',
            valueAtRisk: '800000',
            metadata: { category: 'infrastructure', tags: ['database', 'rds', 'connections'] },
            receivedAt: new Date(now.getTime() - 900000),
          },
          {
            orgId: seedOrgId,
            source: 'connector:github',
            sourceType: 'connector',
            title: 'CI/CD pipeline failure — main branch blocked',
            body: '27 consecutive build failures on main branch. Deployment pipeline blocked since 14:22 UTC.',
            severity: 'medium',
            status: 'processed',
            normalizedScore: '45.0',
            valueAtRisk: '25000',
            metadata: { category: 'engineering', tags: ['ci', 'deployment', 'github'] },
            receivedAt: dayAgo,
            processedAt: new Date(dayAgo.getTime() + 14400000),
          },
        ])
        .onConflictDoNothing(),
    );

    await runSection('platform_signals (lyte)', () =>
      db
        .insert(platformSignalsTable)
        .values([
          {
            orgId: seedLyteOrgId,
            source: 'connector:pagerduty',
            sourceType: 'connector',
            title: 'Critical customer environment down — Acme Corp',
            body: 'Acme Corp production environment unresponsive. 3 services down. SLA timer running at T+47min.',
            severity: 'critical',
            status: 'processing',
            normalizedScore: '98.0',
            valueAtRisk: '150000',
            metadata: {
              category: 'incident',
              tags: ['customer', 'sla', 'incident', 'acme'],
              whatHappened: 'Acme Corp prod environment unresponsive — 3 core services down',
            },
            receivedAt: new Date(now.getTime() - 2820000),
          },
          {
            orgId: seedLyteOrgId,
            source: 'monitoring:backup',
            sourceType: 'monitoring',
            title: 'Backup failure — GlobalTech DR site',
            body: 'Nightly backup job failed for GlobalTech DR environment. 3 consecutive failures. Last successful backup: 72 hours ago.',
            severity: 'high',
            status: 'new',
            normalizedScore: '72.0',
            valueAtRisk: '500000',
            metadata: { category: 'backup', tags: ['backup', 'dr', 'compliance', 'globaltech'] },
            receivedAt: hourAgo,
          },
          {
            orgId: seedLyteOrgId,
            source: 'connector:antivirus',
            sourceType: 'connector',
            title: 'Potential malware detected — retail client endpoint',
            body: 'EDR solution flagged suspicious process execution on retail client endpoint. Quarantine pending approval.',
            severity: 'high',
            status: 'processed',
            normalizedScore: '88.0',
            valueAtRisk: '2500000',
            metadata: { category: 'security', tags: ['malware', 'edr', 'endpoint', 'retail'] },
            receivedAt: new Date(now.getTime() - 5400000),
            processedAt: new Date(now.getTime() - 5100000),
          },
        ])
        .onConflictDoNothing(),
    );

    await runSection('actions', () =>
      db
        .insert(actionsTable)
        .values([
          {
            orgId: seedOrgId,
            product: 'alloy',
            title: 'Investigate API latency root cause',
            description:
              'Deep dive into API gateway logs, database query patterns, and infra metrics to identify root cause of P99 spike.',
            actionType: 'investigation',
            status: 'in_progress',
            priority: 'critical',
          },
          {
            orgId: seedOrgId,
            product: 'alloy',
            title: 'Implement connection pool fix',
            description:
              'Deploy updated connection pool configuration to staging, validate, promote to production.',
            actionType: 'remediation',
            status: 'pending',
            priority: 'critical',
          },
          {
            orgId: seedLyteOrgId,
            product: 'lyte',
            title: 'Restore Acme Corp services',
            description:
              'Execute service restoration runbook for Acme Corp. Steps: 1) Check VM health 2) Restart services in order 3) Validate connectivity',
            actionType: 'remediation',
            status: 'in_progress',
            priority: 'critical',
          },
          {
            orgId: seedLyteOrgId,
            product: 'lyte',
            title: 'Isolate GlobalTech malware endpoint',
            description:
              'Network isolation of affected endpoint, forensic image capture, submit to threat intel platform.',
            actionType: 'investigation',
            status: 'pending',
            priority: 'high',
          },
        ])
        .onConflictDoNothing(),
    );

    const [wf1] = await runSection('workflows (critical_signal_response)', () =>
      db
        .insert(workflowsTable)
        .values({
          orgId: seedOrgId,
          product: 'alloy',
          name: 'Critical Signal Response',
          description:
            'Auto-triggered workflow for critical severity signals — assessment, notification, escalation, remediation',
          triggerType: 'signal',
          triggerConfig: { severity: 'critical', autoTrigger: true } as any,
          steps: [
            { id: 'assess', name: 'Auto-Assessment', type: 'auto', config: { timeout: 60 } },
            {
              id: 'notify_pager',
              name: 'PagerDuty Alert',
              type: 'notification',
              config: { service: 'pagerduty', urgency: 'high' },
            },
            {
              id: 'notify_slack',
              name: 'Slack War Room',
              type: 'notification',
              config: { channel: '#incidents' },
            },
            {
              id: 'investigate',
              name: 'Engineer Investigation',
              type: 'manual',
              config: { sla: 1800 },
            },
            {
              id: 'remediate',
              name: 'Remediation Steps',
              type: 'manual',
              config: { playbook: 'critical-response-v2' },
            },
            { id: 'verify', name: 'Verification & Close', type: 'auto', config: {} },
          ] as any,
          status: 'active',
          runCount: 12,
          lastRunAt: hourAgo,
        })
        .returning(),
    );

    await runSection('workflows (additional)', () =>
      db
        .insert(workflowsTable)
        .values([
          {
            orgId: seedOrgId,
            product: 'alloy',
            name: 'Weekly Compliance Report',
            description:
              'Generates and distributes weekly compliance status report to stakeholders',
            triggerType: 'schedule',
            triggerConfig: { cron: '0 9 * * 1' } as any,
            steps: [
              { id: 'gather', name: 'Gather Signals', type: 'auto', config: {} },
              {
                id: 'generate',
                name: 'Generate Report',
                type: 'auto',
                config: { template: 'compliance-weekly' },
              },
              { id: 'review', name: 'Human Review', type: 'manual', config: { sla: 86400 } },
              {
                id: 'distribute',
                name: 'Distribute',
                type: 'notification',
                config: { recipients: 'exec-team' },
              },
            ] as any,
            status: 'active',
            runCount: 8,
          },
          {
            orgId: seedLyteOrgId,
            product: 'lyte',
            name: 'Incident Response — MSP Tier 1',
            description: 'Standard incident response workflow for MSP tier 1 incidents',
            triggerType: 'signal',
            triggerConfig: { severity: ['critical', 'high'], product: 'lyte' } as any,
            steps: [
              { id: 'triage', name: 'Triage', type: 'auto', config: {} },
              { id: 'assign', name: 'Assign Engineer', type: 'manual', config: { sla: 300 } },
              { id: 'investigate', name: 'Investigation', type: 'manual', config: {} },
              { id: 'remediate', name: 'Remediation', type: 'manual', config: {} },
              {
                id: 'document',
                name: 'Post-Incident Report',
                type: 'manual',
                config: { sla: 86400 },
              },
            ] as any,
            status: 'active',
            runCount: 47,
          },
        ])
        .onConflictDoNothing(),
    );

    if (wf1) {
      await runSection('workflow_runs', () =>
        db
          .insert(workflowRunsTable)
          .values([
            {
              orgId: seedOrgId,
              workflowId: wf1.id,
              status: 'completed',
              startedAt: new Date(now.getTime() - 7200000),
              completedAt: new Date(now.getTime() - 3600000),
              output: { success: true, stepsCompleted: 6 } as any,
              stepResults: [
                {
                  stepId: 'assess',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
                {
                  stepId: 'notify_pager',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
                {
                  stepId: 'notify_slack',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
                {
                  stepId: 'investigate',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
                {
                  stepId: 'remediate',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
                {
                  stepId: 'verify',
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
              ] as any,
              retryCount: 0,
              maxRetries: 3,
            },
            {
              orgId: seedOrgId,
              workflowId: wf1.id,
              status: 'running',
              startedAt: hourAgo,
              retryCount: 0,
              maxRetries: 3,
            },
          ])
          .onConflictDoNothing(),
      );
    }
  } // end if (!signalsExist)

  const seedMaritime = !vesselsExist || !voyagesExist || !exceptionsExist;
  if (seedMaritime) {
    const portValues = [
      {
        name: 'Port of Shanghai',
        locode: 'CNSHA',
        country: 'China',
        region: 'Asia Pacific',
        latitude: '31.2304',
        longitude: '121.4737',
        portType: 'container' as const,
        status: 'congested' as const,
        avgCongestionDays: '3.2',
        weeklyCapacityTeu: 142000,
      },
      {
        name: 'Port of Singapore',
        locode: 'SGSIN',
        country: 'Singapore',
        region: 'Southeast Asia',
        latitude: '1.2655',
        longitude: '103.8196',
        portType: 'container' as const,
        status: 'open' as const,
        avgCongestionDays: '1.8',
        weeklyCapacityTeu: 89000,
      },
      {
        name: 'Port of Rotterdam',
        locode: 'NLRTM',
        country: 'Netherlands',
        region: 'Europe',
        latitude: '51.9225',
        longitude: '4.4792',
        portType: 'multipurpose' as const,
        status: 'open' as const,
        avgCongestionDays: '0.8',
        weeklyCapacityTeu: 58000,
      },
      {
        name: 'Jebel Ali',
        locode: 'AEJEA',
        country: 'UAE',
        region: 'Middle East',
        latitude: '24.9858',
        longitude: '55.0555',
        portType: 'container' as const,
        status: 'open' as const,
        avgCongestionDays: '1.4',
        weeklyCapacityTeu: 52000,
      },
      {
        name: 'Port of Los Angeles',
        locode: 'USLAX',
        country: 'USA',
        region: 'North America',
        latitude: '33.7278',
        longitude: '-118.2606',
        portType: 'container' as const,
        status: 'open' as const,
        avgCongestionDays: '2.1',
        weeklyCapacityTeu: 43000,
      },
      {
        name: 'Colombo Port',
        locode: 'LKCMB',
        country: 'Sri Lanka',
        region: 'South Asia',
        latitude: '6.9271',
        longitude: '79.8612',
        portType: 'container' as const,
        status: 'open' as const,
        avgCongestionDays: '1.1',
        weeklyCapacityTeu: 28000,
      },
    ];

    const insertedPorts = await runSection('ports', () =>
      db.insert(portsTable).values(portValues).onConflictDoNothing().returning(),
    );

    const corridorValues = [
      {
        name: 'Strait of Malacca',
        description: "Key passage between Indian Ocean and Pacific — world's busiest shipping lane",
        riskLevel: 'moderate' as const,
        distanceNm: '500',
        avgTransitDays: '1.5',
        geopoliticalRisk: 45,
        pirateRisk: 35,
        weatherRisk: 20,
        activeConflicts: ['Piracy incidents'] as any,
      },
      {
        name: 'Suez Canal Corridor',
        description: 'Critical Europe-Asia route through Egypt',
        riskLevel: 'high' as const,
        distanceNm: '193',
        avgTransitDays: '0.5',
        geopoliticalRisk: 67,
        pirateRisk: 15,
        weatherRisk: 25,
        activeConflicts: ['Houthi missile attacks on Red Sea shipping'] as any,
      },
      {
        name: 'Bab el-Mandeb',
        description: 'Narrowest chokepoint connecting Red Sea to Gulf of Aden',
        riskLevel: 'critical' as const,
        distanceNm: '20',
        avgTransitDays: '0.1',
        geopoliticalRisk: 91,
        pirateRisk: 60,
        weatherRisk: 30,
        activeConflicts: [
          'Active Houthi drone and missile attacks',
          'Iranian proxy activity',
        ] as any,
      },
      {
        name: 'Strait of Hormuz',
        description: 'Critical Persian Gulf oil transit chokepoint',
        riskLevel: 'high' as const,
        distanceNm: '35',
        avgTransitDays: '0.1',
        geopoliticalRisk: 82,
        pirateRisk: 20,
        weatherRisk: 25,
        activeConflicts: ['Iranian naval presence', 'Mine threat'] as any,
      },
      {
        name: 'Panama Canal Corridor',
        description: "Americas' primary Pacific-Atlantic link",
        riskLevel: 'low' as const,
        distanceNm: '80',
        avgTransitDays: '0.5',
        geopoliticalRisk: 28,
        pirateRisk: 5,
        weatherRisk: 35,
        activeConflicts: [] as any,
      },
      {
        name: 'Cape of Good Hope Route',
        description: 'Alternative to Suez — avoiding Red Sea risk',
        riskLevel: 'moderate' as const,
        distanceNm: '3500',
        avgTransitDays: '12',
        geopoliticalRisk: 25,
        pirateRisk: 30,
        weatherRisk: 75,
        activeConflicts: ['Severe weather exposure'] as any,
      },
    ];

    const insertedCorridors = await runSection('corridors', () =>
      db.insert(corridorsTable).values(corridorValues).onConflictDoNothing().returning(),
    );

    const vesselValues = [
      {
        orgId: seedVesselsOrgId,
        name: 'MV Oceanic Fortune',
        imo: 'IMO9876543',
        mmsi: '123456789',
        callSign: 'VCOF',
        flag: 'Panama',
        vesselType: 'container' as const,
        yearBuilt: 2019,
        grossTonnage: '98400',
        deadweightTonnage: '104600',
        status: 'at_sea' as const,
        latitude: '13.5',
        longitude: '57.8',
        heading: '285',
        speedOverGround: '18.4',
        lastPositionAt: new Date(now.getTime() - 1800000),
      },
      {
        orgId: seedVesselsOrgId,
        name: 'MT Pacific Star',
        imo: 'IMO7654321',
        mmsi: '987654321',
        callSign: 'VTPS',
        flag: 'Liberia',
        vesselType: 'tanker' as const,
        yearBuilt: 2016,
        grossTonnage: '65000',
        deadweightTonnage: '110000',
        status: 'at_sea' as const,
        latitude: '22.3',
        longitude: '113.9',
        heading: '195',
        speedOverGround: '14.2',
        lastPositionAt: new Date(now.getTime() - 900000),
      },
      {
        orgId: seedVesselsOrgId,
        name: 'MV Atlantic Pioneer',
        imo: 'IMO5432198',
        mmsi: '543219876',
        callSign: 'VMAP',
        flag: 'Marshall Islands',
        vesselType: 'bulk' as const,
        yearBuilt: 2012,
        grossTonnage: '43200',
        deadweightTonnage: '82000',
        status: 'in_port' as const,
        latitude: '51.9225',
        longitude: '4.4792',
        lastPositionAt: new Date(now.getTime() - 86400000),
      },
      {
        orgId: seedVesselsOrgId,
        name: 'MV Nordic Eagle',
        imo: 'IMO3210987',
        mmsi: '321098765',
        callSign: 'VKNE',
        flag: 'Norway',
        vesselType: 'cargo' as const,
        yearBuilt: 2008,
        grossTonnage: '12800',
        deadweightTonnage: '18000',
        status: 'maintenance' as const,
        latitude: '59.9139',
        longitude: '10.7522',
        lastPositionAt: new Date(now.getTime() - 7 * 86400000),
      },
      {
        orgId: seedVesselsOrgId,
        name: 'MV Southern Cross',
        imo: 'IMO1987654',
        mmsi: '198765432',
        callSign: 'VASC',
        flag: 'Australia',
        vesselType: 'ro-ro' as const,
        yearBuilt: 2021,
        grossTonnage: '34500',
        deadweightTonnage: '8200',
        status: 'at_sea' as const,
        latitude: '-12.4',
        longitude: '131.9',
        heading: '042',
        speedOverGround: '20.1',
        lastPositionAt: new Date(now.getTime() - 600000),
      },
    ];

    let insertedVessels = await runSection('maritime_vessels', () =>
      db.insert(maritimeVesselsTable).values(vesselValues).onConflictDoNothing().returning(),
    );
    if (insertedVessels.length === 0) {
      insertedVessels = await runSection(
        'maritime_vessels (lookup existing)',
        async () =>
          (await db
            .select()
            .from(maritimeVesselsTable)
            .where(eq(maritimeVesselsTable.orgId, seedVesselsOrgId))) as typeof insertedVessels,
      );
    }

    if (insertedVessels.length >= 3) {
      const vessel1 = insertedVessels[0];
      const vessel2 = insertedVessels[1];
      const vessel3 = insertedVessels[2];

      const corridor1 = insertedCorridors.find((c) => c.name.includes('Bab el-Mandeb'));
      const corridor2 = insertedCorridors.find((c) => c.name.includes('Malacca'));
      const port1 = insertedPorts.find((p) => p.locode === 'AEJEA');
      const port2 = insertedPorts.find((p) => p.locode === 'SGSIN');
      const port3 = insertedPorts.find((p) => p.locode === 'NLRTM');

      await runSection('voyages', () =>
        db
          .insert(voyagesTable)
          .values([
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel1.id,
              voyageNumber: 'OF-2026-047',
              originPortId: port1?.id ?? null,
              destinationPortId: port3?.id ?? null,
              cargoType: 'General Cargo / Electronics',
              cargoDescription: 'Consumer electronics, automotive parts — mixed container load',
              cargoTonnage: '28400',
              cargoValueUsd: '142000000',
              status: 'at_sea',
              scheduledDepartureAt: new Date(now.getTime() - 8 * 86400000),
              actualDepartureAt: new Date(now.getTime() - 8 * 86400000),
              scheduledArrivalAt: new Date(now.getTime() + 6 * 86400000),
              estimatedArrivalAt: new Date(now.getTime() + 6.5 * 86400000),
              distanceNm: '11200',
              fuelConsumedMt: '380',
              fuelCostUsd: '456000',
              portCostsUsd: '82000',
              revenueUsd: '1240000',
              charterRatePerDay: '78000',
              etaDriftHours: '12',
              corridorId: corridor1?.id ?? null,
            },
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel2.id,
              voyageNumber: 'PS-2026-031',
              originPortId: port2?.id ?? null,
              destinationPortId: port1?.id ?? null,
              cargoType: 'Crude Oil',
              cargoDescription: 'Light crude oil — 85,000 MT',
              cargoTonnage: '85000',
              cargoValueUsd: '76500000',
              status: 'at_sea',
              scheduledDepartureAt: new Date(now.getTime() - 3 * 86400000),
              actualDepartureAt: new Date(now.getTime() - 3 * 86400000),
              scheduledArrivalAt: new Date(now.getTime() + 4 * 86400000),
              estimatedArrivalAt: new Date(now.getTime() + 4 * 86400000),
              distanceNm: '4800',
              fuelConsumedMt: '145',
              fuelCostUsd: '174000',
              portCostsUsd: '45000',
              revenueUsd: '2100000',
              charterRatePerDay: '125000',
              etaDriftHours: '0',
              corridorId: corridor2?.id ?? null,
            },
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel3.id,
              voyageNumber: 'AP-2026-022',
              originPortId: port3?.id ?? null,
              destinationPortId: port1?.id ?? null,
              cargoType: 'Bulk Grain',
              cargoDescription: 'Wheat — 75,000 MT',
              cargoTonnage: '75000',
              cargoValueUsd: '28500000',
              status: 'arrived',
              scheduledDepartureAt: new Date(now.getTime() - 20 * 86400000),
              actualDepartureAt: new Date(now.getTime() - 20 * 86400000),
              scheduledArrivalAt: new Date(now.getTime() - 1 * 86400000),
              estimatedArrivalAt: new Date(now.getTime() - 1 * 86400000),
              actualArrivalAt: new Date(now.getTime() - 18 * 3600000),
              distanceNm: '8700',
              fuelConsumedMt: '420',
              fuelCostUsd: '504000',
              portCostsUsd: '95000',
              revenueUsd: '890000',
              charterRatePerDay: '42000',
              etaDriftHours: '0',
            },
          ])
          .onConflictDoNothing(),
      );

      await runSection('maritime_exceptions', () =>
        db
          .insert(maritimeExceptionsTable)
          .values([
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel1.id,
              exceptionType: 'route_deviation',
              severity: 'high',
              title: 'MV Oceanic Fortune — Route deviation — Bab el-Mandeb avoidance',
              description:
                'Vessel deviating south of planned route to avoid Houthi attack zone. ETA impact +12 hours.',
              status: 'acknowledged',
              valueAtRiskUsd: '142000000',
              etaImpactHours: '12',
              costImpactUsd: '96000',
              detectedAt: new Date(now.getTime() - 14400000),
              acknowledgedAt: new Date(now.getTime() - 13800000),
              metadata: {
                alternateRoute: 'Cape of Good Hope detour segment',
                riskZone: 'Bab el-Mandeb',
              } as any,
            },
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel2.id,
              exceptionType: 'weather_delay',
              severity: 'medium',
              title: 'MT Pacific Star — Tropical cyclone warning — Course adjustment required',
              description:
                'Tropical cyclone developing 200nm north of vessel track. Wind gusts forecast 85 knots.',
              status: 'new',
              valueAtRiskUsd: '76500000',
              etaImpactHours: '6',
              costImpactUsd: '48000',
              detectedAt: new Date(now.getTime() - 3600000),
              metadata: {
                cycloneCategory: 2,
                forecastPath: 'Northern diversion recommended',
              } as any,
            },
            {
              orgId: seedVesselsOrgId,
              vesselId: vessel3.id,
              exceptionType: 'port_congestion',
              severity: 'medium',
              title: 'MV Atlantic Pioneer — Port congestion delay — Rotterdam',
              description:
                'Port of Rotterdam anchorage queue increased to 31 vessels. Expected delay 18-24 hours for berth allocation.',
              status: 'resolved',
              valueAtRiskUsd: '28500000',
              etaImpactHours: '22',
              costImpactUsd: '38000',
              detectedAt: new Date(now.getTime() - 3 * 86400000),
              resolvedAt: new Date(now.getTime() - 20 * 3600000),
              metadata: { berthAllocated: true, resolvedAt: '02:30 local time' } as any,
            },
            {
              orgId: seedVesselsOrgId,
              vesselId: insertedVessels[4]?.id ?? vessel1.id,
              exceptionType: 'security_threat',
              severity: 'critical',
              title: 'MV Southern Cross — Security alert — Unauthorized vessel approach',
              description:
                'Unknown small vessel approaching at high speed off coast of Gulf of Aden. Master requesting naval escort.',
              status: 'escalated',
              valueAtRiskUsd: '50000000',
              etaImpactHours: '24',
              costImpactUsd: '0',
              detectedAt: new Date(now.getTime() - 1800000),
              metadata: {
                nearestNavalAsset: 'HMS Richmond — ETA 4h',
                coastGuardNotified: true,
              } as any,
            },
          ])
          .onConflictDoNothing(),
      );
    }
  } // end if (seedMaritime)

  await runSection('readiness_items', () =>
    db
      .insert(readinessItemsTable)
      .values([
        {
          orgId: seedOrgId,
          product: 'alloy',
          category: 'operational',
          title: 'Signal routing rules configured for all connectors',
          description: 'All 12 active connectors have severity routing rules defined',
          status: 'completed',
          priority: 'high',
          score: '100',
          targetScore: '100',
        },
        {
          orgId: seedOrgId,
          product: 'alloy',
          category: 'security',
          title: 'Workflow audit trail enabled',
          description: 'All workflow runs must produce audit log entries',
          status: 'completed',
          priority: 'high',
          score: '100',
          targetScore: '100',
        },
        {
          orgId: seedOrgId,
          product: 'alloy',
          category: 'compliance',
          title: 'SOC2 artifact retention policy configured',
          description: 'Artifacts must be retained for 90 days minimum per compliance requirements',
          status: 'in_progress',
          priority: 'critical',
          score: '65',
          targetScore: '100',
        },
        {
          orgId: seedVesselsOrgId,
          product: 'vessels',
          category: 'maritime',
          title: 'SOLAS compliance documentation current',
          description: 'All vessels must have current SOLAS certificates uploaded and verified',
          status: 'in_progress',
          priority: 'critical',
          score: '72',
          targetScore: '100',
        },
        {
          orgId: seedVesselsOrgId,
          product: 'vessels',
          category: 'operational',
          title: 'Emergency contact tree verified for all 5 vessels',
          description: '24/7 emergency contacts for masters, owners, and agents must be current',
          status: 'not_started',
          priority: 'high',
          score: '0',
          targetScore: '100',
        },
        {
          orgId: seedVesselsOrgId,
          product: 'vessels',
          category: 'security',
          title: 'Anti-piracy measures implemented on Red Sea routes',
          description:
            'BMP5 procedures must be followed and documented for all vessels transiting high-risk areas',
          status: 'completed',
          priority: 'critical',
          score: '100',
          targetScore: '100',
        },
        {
          orgId: seedLyteOrgId,
          product: 'lyte',
          category: 'operational',
          title: 'Incident response playbooks reviewed Q1 2026',
          description: 'All 8 tier-1 incident playbooks must be reviewed and signed off annually',
          status: 'completed',
          priority: 'high',
          score: '100',
          targetScore: '100',
        },
        {
          orgId: seedLyteOrgId,
          product: 'lyte',
          category: 'compliance',
          title: 'Customer SLA dashboards deployed',
          description: 'All 23 MSP customers must have live SLA visibility dashboards',
          status: 'in_progress',
          priority: 'high',
          score: '60',
          targetScore: '100',
        },
      ])
      .onConflictDoNothing(),
  );

  console.log('[seed-platform] Platform seed data complete.');
}

if (process.argv[1]?.includes('seed-platform')) {
  seedPlatformData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
