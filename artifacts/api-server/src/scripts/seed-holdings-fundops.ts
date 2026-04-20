import {
  capitalArtifactsTable,
  capTablePlaceholdersTable,
  db,
  diligenceChecklistItemsTable,
  diligenceChecklistsTable,
  financialModelsTable,
  fundLpReportsTable,
  fundNavRecordsTable,
  fundPortfolioFinancialsTable,
  fundPortfolioKpisTable,
  fundraisingMilestonesTable,
  holdingsInquiriesTable,
  holdingsLeadershipTable,
  holdingsMetricsTable,
  holdingsMilestonesTable,
  holdingsVenturesTable,
  investorPacketDeliverables,
  investorPacketsTable,
  lenderPacketDeliverables,
  lenderPacketsTable,
  useOfFundsVersionsTable,
} from '@szl-holdings/db';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function daysAhead(n: number) {
  return new Date(Date.now() + n * 86400000);
}

export async function seedHoldingsFundops() {
  console.log('[seed-holdings-fundops] Starting Holdings & Fund Ops seed...');

  const existing = await db
    .select({ id: holdingsVenturesTable.id })
    .from(holdingsVenturesTable)
    .limit(1);
  if (existing.length > 0) {
    console.log('[seed-holdings-fundops] Ventures already seeded, skipping main block.');
    await seedFundNavLpReports();
    return { skipped: true };
  }

  const ventures = await db
    .insert(holdingsVenturesTable)
    .values([
      {
        slug: 'vessels-maritime',
        name: 'Vessels Maritime Intelligence',
        description:
          'AI-powered maritime fleet management, cargo logistics, and real-time vessel intelligence platform for global shipping operations.',
        sector: 'Maritime Technology',
        status: 'active',
        stage: 'Series A',
        founded: '2022',
        website: 'https://vessels.szlholdings.com',
        color: '#06b6d4',
        metrics: { arr: '$2.8M', customers: 14, nrr: '118%', runway: '22 months' },
        metadata: { employees: 28, hq: 'New York, NY' },
      },
      {
        slug: 'prism-counsel',
        name: 'PRISM Counsel',
        description:
          'AI-native legal operations platform for plaintiff law firms — matter management, demand readiness, and settlement intelligence at scale.',
        sector: 'Legal Technology',
        status: 'active',
        stage: 'Seed',
        founded: '2023',
        website: 'https://prismcounsel.szlholdings.com',
        color: '#7c3aed',
        metrics: { arr: '$840K', customers: 6, nrr: '142%', runway: '18 months' },
        metadata: { employees: 12, hq: 'New York, NY' },
      },
      {
        slug: 'lyte-aiops',
        name: 'Lyte AIOps',
        description:
          'Business observability and AI-driven operational intelligence platform — signal detection, anomaly tracking, and executive decision support.',
        sector: 'Enterprise Software',
        status: 'growth',
        stage: 'Series A',
        founded: '2021',
        website: 'https://lyte.szlholdings.com',
        color: '#0ea5e9',
        metrics: { arr: '$4.2M', customers: 31, nrr: '127%', runway: '28 months' },
        metadata: { employees: 41, hq: 'New York, NY' },
      },
      {
        slug: 'terra-realestate',
        name: 'Terra Real Estate Intelligence',
        description:
          'Distressed property intelligence and deal sourcing platform for real estate investors in the NYC metropolitan area.',
        sector: 'PropTech',
        status: 'active',
        stage: 'Seed',
        founded: '2023',
        website: 'https://terra.szlholdings.com',
        color: '#10b981',
        metrics: { arr: '$620K', customers: 22, nrr: '108%', runway: '14 months' },
        metadata: { employees: 8, hq: 'New York, NY' },
      },
      {
        slug: 'aegis-security',
        name: 'Aegis Defense & Intelligence',
        description:
          'Unified cybersecurity command center — threat detection, MITRE ATT&CK mapping, compliance, and SOC operations for enterprise security teams.',
        sector: 'Cybersecurity',
        status: 'active',
        stage: 'Seed',
        founded: '2024',
        website: 'https://aegis.szlholdings.com',
        color: '#ef4444',
        metrics: { arr: '$380K', customers: 4, nrr: '135%', runway: '20 months' },
        metadata: { employees: 9, hq: 'New York, NY' },
      },
      {
        slug: 'carlota-jo-consulting',
        name: 'Carlota Jo Consulting',
        description:
          'Boutique luxury consulting firm — strategic advisory, executive coaching, and high-value client management services.',
        sector: 'Professional Services',
        status: 'active',
        stage: 'Bootstrapped',
        founded: '2020',
        website: 'https://carlotajo.com',
        color: '#f59e0b',
        metrics: { arr: '$1.1M', customers: 18, nrr: '94%', runway: 'operating profitably' },
        metadata: { employees: 6, hq: 'New York, NY' },
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`[seed-holdings-fundops] Seeded ${ventures.length} ventures`);

  const milestones = await db
    .insert(holdingsMilestonesTable)
    .values([
      {
        ventureId: ventures[0].id,
        title: 'Launched AIS Real-Time Tracking',
        description:
          'Integrated MarineTraffic AIS feed for live vessel position updates across all fleet tiers.',
        date: '2024-03-15',
        category: 'product',
        icon: 'Ship',
      },
      {
        ventureId: ventures[0].id,
        title: 'Signed Pacific Fleet Contract',
        description: 'Closed anchor customer — 8-vessel Pacific fleet at $180K ARR.',
        date: '2024-07-22',
        category: 'revenue',
        icon: 'DollarSign',
      },
      {
        ventureId: ventures[0].id,
        title: 'Series A — $4.2M Raised',
        description: 'Closed Series A round led by Maritime Ventures Partners.',
        date: '2025-01-10',
        category: 'fundraising',
        icon: 'TrendingUp',
      },
      {
        ventureId: ventures[1].id,
        title: 'PRISM Platform Beta Launch',
        description:
          'Launched beta with 3 NYC plaintiff law firms — demand readiness and AI forecasting core features.',
        date: '2024-09-01',
        category: 'product',
        icon: 'Scale',
      },
      {
        ventureId: ventures[1].id,
        title: 'PRISM NY Compliance Module',
        description:
          'Released NY-specific no-fault clock rules, disclaimer tracking, and venue velocity engine.',
        date: '2025-02-14',
        category: 'product',
        icon: 'Shield',
      },
      {
        ventureId: ventures[2].id,
        title: 'Lyte Command Center GA',
        description:
          'General availability launch with full Alloy workflow integration and executive dashboard.',
        date: '2023-11-08',
        category: 'product',
        icon: 'Monitor',
      },
      {
        ventureId: ventures[2].id,
        title: '30 Enterprise Customers',
        description: 'Crossed 30 paid enterprise customers milestone — ARR $4.2M.',
        date: '2025-03-01',
        category: 'revenue',
        icon: 'Users',
      },
      {
        ventureId: ventures[3].id,
        title: 'NYC Distress Property Engine Launch',
        description:
          'Live data ingestion from NYC court records, ACRIS, and DOF tax lien feeds — 500+ active properties.',
        date: '2024-06-20',
        category: 'product',
        icon: 'Building',
      },
      {
        ventureId: ventures[4].id,
        title: 'Aegis SOC Command Center Beta',
        description:
          'First 4 enterprise SOC customers onboarded. MITRE ATT&CK integration fully operational.',
        date: '2025-01-20',
        category: 'product',
        icon: 'Shield',
      },
      {
        ventureId: ventures[5].id,
        title: 'Carlota Jo Client Portal Launch',
        description:
          'Launched private client portal for document sharing, service reservations, and secure messaging.',
        date: '2024-11-15',
        category: 'product',
        icon: 'Users',
      },
    ])
    .returning();

  console.log(`[seed-holdings-fundops] Seeded ${milestones.length} milestones`);

  await db.insert(holdingsMetricsTable).values([
    {
      ventureId: ventures[0].id,
      label: 'ARR',
      value: '$2.8M',
      change: '+42%',
      period: 'YoY',
      category: 'revenue',
    },
    {
      ventureId: ventures[0].id,
      label: 'Customers',
      value: '14',
      change: '+8',
      period: 'YoY',
      category: 'growth',
    },
    {
      ventureId: ventures[0].id,
      label: 'NRR',
      value: '118%',
      change: '+6pp',
      period: 'YoY',
      category: 'retention',
    },
    { ventureId: ventures[0].id, label: 'Runway', value: '22 months', category: 'financial' },
    {
      ventureId: ventures[1].id,
      label: 'ARR',
      value: '$840K',
      change: '+210%',
      period: 'YoY',
      category: 'revenue',
    },
    {
      ventureId: ventures[1].id,
      label: 'Law Firm Clients',
      value: '6',
      change: '+5',
      period: 'YoY',
      category: 'growth',
    },
    {
      ventureId: ventures[1].id,
      label: 'NRR',
      value: '142%',
      change: '+28pp',
      period: 'YoY',
      category: 'retention',
    },
    {
      ventureId: ventures[2].id,
      label: 'ARR',
      value: '$4.2M',
      change: '+38%',
      period: 'YoY',
      category: 'revenue',
    },
    {
      ventureId: ventures[2].id,
      label: 'Enterprise Customers',
      value: '31',
      change: '+12',
      period: 'YoY',
      category: 'growth',
    },
    {
      ventureId: ventures[2].id,
      label: 'NRR',
      value: '127%',
      change: '+9pp',
      period: 'YoY',
      category: 'retention',
    },
    {
      ventureId: ventures[3].id,
      label: 'Active Properties Tracked',
      value: '530+',
      change: '+280',
      period: 'QoQ',
      category: 'product',
    },
    {
      ventureId: ventures[3].id,
      label: 'ARR',
      value: '$620K',
      change: '+88%',
      period: 'YoY',
      category: 'revenue',
    },
    {
      ventureId: ventures[4].id,
      label: 'ARR',
      value: '$380K',
      change: 'first year',
      period: 'YTD',
      category: 'revenue',
    },
    {
      ventureId: ventures[5].id,
      label: 'ARR',
      value: '$1.1M',
      change: '+12%',
      period: 'YoY',
      category: 'revenue',
    },
    {
      ventureId: ventures[5].id,
      label: 'Active Client Engagements',
      value: '18',
      change: '+3',
      period: 'YoY',
      category: 'growth',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded metrics`);

  await db.insert(holdingsLeadershipTable).values([
    {
      name: 'Stephen L.',
      title: 'Founder & Chief Executive Officer',
      bio: 'Technology strategist and entrepreneur. Builder of the SZL Holdings ecosystem across maritime, legal, security, and real estate verticals.',
      sortOrder: 1,
    },
    {
      name: 'Alex Rivera',
      title: 'Chief Operating Officer',
      bio: 'Operations executive with 12 years scaling enterprise software companies. Previously VP Ops at a Series B logistics SaaS.',
      sortOrder: 2,
    },
    {
      name: 'Jordan Chen',
      title: 'Chief Data & Analytics Officer',
      bio: 'Data science leader with deep expertise in real-time systems and AI/ML infrastructure.',
      sortOrder: 3,
    },
    {
      name: 'Morgan Blake',
      title: 'Chief Marketing Officer',
      bio: 'B2B growth leader with experience scaling vertical SaaS companies from seed to Series B.',
      sortOrder: 4,
    },
    {
      name: 'Casey Torres',
      title: 'VP of Product Design',
      bio: 'Product and design leader. Crafts enterprise UX systems that prioritize clarity and operational speed.',
      sortOrder: 5,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded leadership`);

  await db.insert(holdingsInquiriesTable).values([
    {
      name: 'Marcus Okonkwo',
      email: 'mokonkwo@atlanticpartners.com',
      company: 'Atlantic Investment Partners',
      subject: 'Co-investment inquiry — PRISM Counsel round',
      message:
        "We are tracking the legal tech space and PRISM Counsel's traction is impressive. Interested in discussing co-investment opportunity in the current round.",
      status: 'read',
    },
    {
      name: 'Sarah Lindqvist',
      email: 's.lindqvist@nordvest.vc',
      company: 'Nordvest Venture Capital',
      subject: 'Portfolio overview meeting request',
      message:
        'Reviewing maritime and logistics investments. Would like to schedule a call to understand the Vessels platform and SZL Holdings portfolio strategy.',
      status: 'replied',
    },
    {
      name: 'David Park',
      email: 'dpark@harborbridge.com',
      company: 'Harbor Bridge Capital',
      subject: 'Strategic partnership inquiry',
      message:
        'We manage a $450M maritime-focused fund and see strong synergy with Vessels. Open to exploring strategic partnership or investment.',
      status: 'new',
    },
    {
      name: 'Yemi Adeyemi',
      email: 'yemi@techbridge.io',
      company: 'TechBridge Accelerator',
      subject: 'Terra Real Estate — accelerator partnership',
      message:
        "TechBridge focuses on PropTech and would love to discuss a partnership that could extend Terra's distribution to our 200+ investor network.",
      status: 'new',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded inquiries`);

  await db.insert(fundPortfolioFinancialsTable).values([
    {
      companySlug: 'vessels-maritime',
      companyName: 'Vessels Maritime Intelligence',
      periodType: 'quarterly',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      reportingStatus: 'final',
      revenue: '700000',
      revenuePriorPeriod: '520000',
      grossProfit: '525000',
      grossMarginPct: '0.75',
      operatingExpenses: '440000',
      ebitda: '85000',
      netIncome: '62000',
      cashAndEquivalents: '3200000',
      totalAssets: '4100000',
      totalLiabilities: '800000',
      totalEquity: '3300000',
      operatingCashFlow: '95000',
      freeCashFlow: '72000',
      burnRate: '-72000',
      runwayMonths: '22',
      capitalRaised: '4200000',
    },
    {
      companySlug: 'lyte-aiops',
      companyName: 'Lyte AIOps',
      periodType: 'quarterly',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      reportingStatus: 'final',
      revenue: '1050000',
      revenuePriorPeriod: '800000',
      grossProfit: '840000',
      grossMarginPct: '0.80',
      operatingExpenses: '720000',
      ebitda: '120000',
      netIncome: '88000',
      cashAndEquivalents: '4800000',
      totalAssets: '5900000',
      totalLiabilities: '1100000',
      totalEquity: '4800000',
      operatingCashFlow: '140000',
      freeCashFlow: '105000',
      burnRate: '-105000',
      runwayMonths: '28',
      capitalRaised: '6500000',
    },
    {
      companySlug: 'prism-counsel',
      companyName: 'PRISM Counsel',
      periodType: 'quarterly',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      reportingStatus: 'submitted',
      revenue: '210000',
      revenuePriorPeriod: '95000',
      grossProfit: '168000',
      grossMarginPct: '0.80',
      operatingExpenses: '195000',
      ebitda: '-27000',
      netIncome: '-31000',
      cashAndEquivalents: '680000',
      totalAssets: '820000',
      totalLiabilities: '140000',
      totalEquity: '680000',
      operatingCashFlow: '-28000',
      freeCashFlow: '-35000',
      burnRate: '35000',
      runwayMonths: '18',
      capitalRaised: '850000',
    },
    {
      companySlug: 'carlota-jo-consulting',
      companyName: 'Carlota Jo Consulting',
      periodType: 'quarterly',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      reportingStatus: 'final',
      revenue: '275000',
      revenuePriorPeriod: '248000',
      grossProfit: '220000',
      grossMarginPct: '0.80',
      operatingExpenses: '165000',
      ebitda: '55000',
      netIncome: '48000',
      cashAndEquivalents: '420000',
      totalAssets: '510000',
      totalLiabilities: '90000',
      totalEquity: '420000',
      operatingCashFlow: '52000',
      freeCashFlow: '48000',
      runwayMonths: '99',
      capitalRaised: '0',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded portfolio financials`);

  await db.insert(fundPortfolioKpisTable).values([
    {
      companySlug: 'vessels-maritime',
      companyName: 'Vessels Maritime Intelligence',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      mrr: '233333',
      arr: '2800000',
      mrrGrowthPct: '0.0842',
      totalCustomers: 14,
      newCustomers: 3,
      churnedCustomers: 0,
      churnRatePct: '0',
      netRevenueRetentionPct: '1.18',
      cac: '18500',
      ltv: '420000',
      ltvCacRatio: '22.7',
      paybackPeriodMonths: '9.6',
      headcount: 28,
      revenuePerEmployee: '100000',
    },
    {
      companySlug: 'lyte-aiops',
      companyName: 'Lyte AIOps',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      mrr: '350000',
      arr: '4200000',
      mrrGrowthPct: '0.0627',
      totalCustomers: 31,
      newCustomers: 4,
      churnedCustomers: 1,
      churnRatePct: '0.0323',
      netRevenueRetentionPct: '1.27',
      cac: '12000',
      ltv: '380000',
      ltvCacRatio: '31.7',
      paybackPeriodMonths: '7.2',
      headcount: 41,
      revenuePerEmployee: '102400',
    },
    {
      companySlug: 'prism-counsel',
      companyName: 'PRISM Counsel',
      periodLabel: 'Q1 2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      mrr: '70000',
      arr: '840000',
      mrrGrowthPct: '0.1421',
      totalCustomers: 6,
      newCustomers: 2,
      churnedCustomers: 0,
      churnRatePct: '0',
      netRevenueRetentionPct: '1.42',
      cac: '8200',
      ltv: '280000',
      ltvCacRatio: '34.1',
      paybackPeriodMonths: '5.8',
      headcount: 12,
      revenuePerEmployee: '70000',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded portfolio KPIs`);

  const capitalArtifacts = await db
    .insert(capitalArtifactsTable)
    .values([
      {
        slug: 'financial-model-12mo-q2-2026',
        name: '12-Month Operating Model — Q2 2026',
        artifactType: 'financial_model',
        version: 3,
        status: 'complete',
        ownedBy: 'Stephen L.',
        notes:
          'Approved by board. Reflects platform fee restructuring and Vessels enterprise contract MRR.',
      },
      {
        slug: 'investor-pitch-deck-series-a',
        name: 'Pitch Deck — Series A Round',
        artifactType: 'investor_packet',
        version: 4,
        status: 'under_review',
        ownedBy: 'Stephen L.',
        notes: 'Updated with Q1 2026 actuals. Awaiting CFO sign-off before investor outreach.',
      },
      {
        slug: 'exec-summary-lender-package',
        name: 'Executive Summary — Lender Package',
        artifactType: 'lender_packet',
        version: 2,
        status: 'complete',
        ownedBy: 'Stephen L.',
        notes: 'Two-page executive summary tailored for commercial lenders.',
      },
      {
        slug: 'cap-table-placeholder-structure',
        name: 'Cap Table — Placeholder Structure',
        artifactType: 'cap_table',
        version: 1,
        status: 'draft',
        ownedBy: 'Stephen L.',
        notes: 'Placeholder structure pending legal entity formation completion.',
      },
      {
        slug: 'use-of-funds-series-a',
        name: 'Use of Funds — Series A $12M',
        artifactType: 'other',
        version: 1,
        status: 'complete',
        ownedBy: 'Stephen L.',
        notes: 'Approved. $12M deployment: 40% product, 30% GTM, 15% ops, 15% working capital.',
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`[seed-holdings-fundops] Seeded capital artifacts`);

  const lenderPackets = await db
    .insert(lenderPacketsTable)
    .values([
      {
        title: 'SZL Holdings — Commercial Credit Facility Application',
        lenderType: 'bank',
        targetAmount: '2500000',
        useOfFunds: 'Receivables bridge (60%), infrastructure (24%), working capital (16%)',
        status: 'in_diligence',
        completionPct: 72,
        targetSubmitDate: daysAhead(7),
        notes:
          'Working with East Coast Commercial Bank. Recurring revenue covenant negotiations ongoing.',
      },
      {
        title: 'SZL Holdings — Revenue-Based Financing Inquiry',
        lenderType: 'other',
        targetAmount: '1200000',
        useOfFunds: 'ARR-backed working capital — bridge to Series A close',
        status: 'drafting',
        completionPct: 30,
        targetSubmitDate: daysAhead(60),
        notes: 'Exploring RBF as bridge to Series A. ARR of $840K MRR supports this facility size.',
      },
    ])
    .returning();

  console.log(`[seed-holdings-fundops] Seeded lender packets`);

  await db.insert(lenderPacketDeliverables).values([
    {
      packetId: lenderPackets[0].id,
      deliverableKey: 'exec_summary',
      title: 'Executive Summary',
      description: '2-page company overview, business model, and funding ask',
      status: 'final',
      version: 2,
      artifactId: capitalArtifacts[2].id,
      sortOrder: 1,
    },
    {
      packetId: lenderPackets[0].id,
      deliverableKey: 'financial_model',
      title: '12-Month Financial Model',
      description: 'Detailed P&L, cash flow, and debt service coverage model',
      status: 'final',
      version: 3,
      artifactId: capitalArtifacts[0].id,
      sortOrder: 2,
    },
    {
      packetId: lenderPackets[0].id,
      deliverableKey: 'arr_detail',
      title: 'ARR Detail & Contract Schedule',
      description: 'Customer MRR breakdown with contract terms and renewal dates',
      status: 'reviewed',
      version: 1,
      sortOrder: 3,
    },
    {
      packetId: lenderPackets[0].id,
      deliverableKey: 'bank_statements',
      title: '12-Month Bank Statements',
      description: 'Business bank account statements — last 12 months',
      status: 'not_started',
      version: 1,
      sortOrder: 4,
    },
    {
      packetId: lenderPackets[1].id,
      deliverableKey: 'arr_schedule',
      title: 'ARR Schedule & Growth Projection',
      description: 'Monthly ARR with forward 12-month projection',
      status: 'draft_complete',
      version: 1,
      sortOrder: 1,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded lender deliverables`);

  const investorPackets = await db
    .insert(investorPacketsTable)
    .values([
      {
        title: 'SZL Holdings — Series A Investment Round',
        investorType: 'series_a',
        targetAmount: '$12,000,000',
        raiseStructure:
          'Priced equity round — preferred shares, 1x non-participating liquidation preference',
        status: 'in_outreach',
        completionPct: 88,
        targetCloseDate: daysAhead(90),
        notes:
          'In active conversations with 4 institutional leads. Targeting $12M at $45M pre-money valuation.',
      },
      {
        title: 'SZL Holdings — Strategic Investor Package',
        investorType: 'strategic',
        targetAmount: '$3,000,000',
        raiseStructure:
          'Strategic investment with commercial partnership — preferred shares + revenue share option',
        status: 'in_diligence',
        completionPct: 65,
        targetCloseDate: daysAhead(60),
        notes: 'In diligence with maritime logistics group. Strategic partner scenario.',
      },
    ])
    .returning();

  console.log(`[seed-holdings-fundops] Seeded investor packets`);

  await db.insert(investorPacketDeliverables).values([
    {
      packetId: investorPackets[0].id,
      deliverableKey: 'pitch_deck',
      title: 'Investor Pitch Deck',
      description:
        '24-slide narrative pitch deck — problem, solution, market, traction, team, financials, ask',
      status: 'reviewed',
      version: 4,
      artifactId: capitalArtifacts[1].id,
      sortOrder: 1,
    },
    {
      packetId: investorPackets[0].id,
      deliverableKey: 'financial_model',
      title: 'Operating Model — 24 Months',
      description: 'Forward 24-month model with base, bull, and bear scenarios',
      status: 'reviewed',
      version: 3,
      artifactId: capitalArtifacts[0].id,
      sortOrder: 2,
    },
    {
      packetId: investorPackets[0].id,
      deliverableKey: 'use_of_funds',
      title: 'Use of Funds',
      description: '$12M use of funds with 18-month deployment schedule',
      status: 'final',
      version: 1,
      artifactId: capitalArtifacts[4].id,
      sortOrder: 3,
    },
    {
      packetId: investorPackets[0].id,
      deliverableKey: 'customer_references',
      title: 'Customer Reference List',
      description: '5 reference customers with NPS data and case studies',
      status: 'draft_complete',
      version: 1,
      sortOrder: 4,
    },
    {
      packetId: investorPackets[0].id,
      deliverableKey: 'cap_table',
      title: 'Cap Table',
      description: 'Current cap table with proposed post-money scenario',
      status: 'draft_complete',
      version: 1,
      artifactId: capitalArtifacts[3].id,
      sortOrder: 5,
    },
    {
      packetId: investorPackets[1].id,
      deliverableKey: 'strategic_memo',
      title: 'Strategic Partnership Memo',
      description: 'One-page strategic rationale and partnership structure overview',
      status: 'final',
      version: 2,
      sortOrder: 1,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded investor deliverables`);

  await db.insert(fundraisingMilestonesTable).values([
    {
      packetType: 'investor',
      packetId: investorPackets[0].id,
      title: 'Complete Pitch Deck v4',
      milestoneType: 'preparation',
      status: 'completed',
      targetDate: daysAgo(30),
      completedAt: daysAgo(28),
      owner: 'Stephen L.',
    },
    {
      packetType: 'investor',
      packetId: investorPackets[0].id,
      title: 'Warm intro to Tier 1 leads (target: 8)',
      milestoneType: 'outreach',
      status: 'in_progress',
      targetDate: daysAhead(14),
      owner: 'Stephen L.',
      notes: '4 of 8 intros made. 3 partner calls scheduled.',
    },
    {
      packetType: 'investor',
      packetId: investorPackets[0].id,
      title: 'Term sheet received',
      milestoneType: 'diligence',
      status: 'pending',
      targetDate: daysAhead(45),
      owner: 'Stephen L.',
    },
    {
      packetType: 'investor',
      packetId: investorPackets[0].id,
      title: 'Legal documentation & close',
      milestoneType: 'close',
      status: 'pending',
      targetDate: daysAhead(90),
      owner: 'Legal / Stephen L.',
    },
    {
      packetType: 'lender',
      packetId: lenderPackets[0].id,
      title: 'Submit complete lender package',
      milestoneType: 'preparation',
      status: 'in_progress',
      targetDate: daysAhead(7),
      owner: 'CFO',
      notes: 'Bank statements and ARR schedule still outstanding.',
    },
    {
      packetType: 'lender',
      packetId: lenderPackets[0].id,
      title: 'Credit committee review',
      milestoneType: 'diligence',
      status: 'pending',
      targetDate: daysAhead(30),
      owner: 'East Coast Commercial Bank',
    },
    {
      packetType: 'lender',
      packetId: lenderPackets[0].id,
      title: 'Facility agreement signed & funded',
      milestoneType: 'close',
      status: 'pending',
      targetDate: daysAhead(45),
      owner: 'Legal / CFO',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded fundraising milestones`);

  await db.insert(financialModelsTable).values([
    {
      title: '12-Month Operating Model — Q2 2026',
      modelType: '12_month_operating',
      status: 'approved',
      version: 3,
      assumptions:
        'ARR growth 12% MoM through Q3, slowing to 8% in Q4. Headcount +4 in product, +2 in GTM. Vessels enterprise contract ($120K/yr) included from May. COGS at 22% of revenue.',
      notes: 'Board-approved. Do not modify without CFO + CEO alignment.',
      artifactId: capitalArtifacts[0].id,
    },
    {
      title: 'Revenue Assumptions — Platform + Services',
      modelType: 'revenue_assumptions',
      status: 'in_review',
      version: 2,
      assumptions:
        'Platform subscription: 3 tiers ($1.2K, $3.5K, $8K/mo). Services revenue: 15% of platform ARR. Enterprise: custom. 120-day ramp for new enterprise contracts.',
      notes: 'Revised upward after Vessels enterprise contract signed.',
    },
    {
      title: 'Use of Funds Model — $12M Series A',
      modelType: 'use_of_funds',
      status: 'approved',
      version: 1,
      assumptions:
        'Product/Engineering: 40% ($4.8M). GTM: 30% ($3.6M). Operations/G&A: 15% ($1.8M). Working capital reserve: 15% ($1.8M). 18-month runway at planned burn.',
      artifactId: capitalArtifacts[4].id,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded financial models`);

  await db.insert(useOfFundsVersionsTable).values([
    {
      title: 'Series A — $12M Use of Funds',
      packetType: 'investor',
      packetId: investorPackets[0].id,
      version: 1,
      totalAmount: '$12,000,000',
      allocationJson: {
        'Product & Engineering': '40% ($4.8M)',
        'Sales & Marketing': '30% ($3.6M)',
        'Operations & G&A': '15% ($1.8M)',
        'Working Capital Reserve': '15% ($1.8M)',
      },
      rationale:
        'Product-led growth thesis: majority of capital deployed into platform capabilities that drive land-and-expand across maritime, legal, and security verticals.',
      status: 'final',
    },
    {
      title: 'Credit Facility — $2.5M Use of Funds',
      packetType: 'lender',
      packetId: lenderPackets[0].id,
      version: 1,
      totalAmount: '$2,500,000',
      allocationJson: {
        'Receivables Bridge': '60% ($1.5M)',
        'Infrastructure & Platform': '24% ($600K)',
        'Working Capital': '16% ($400K)',
      },
      rationale:
        'Non-dilutive capital to bridge receivables gap while enterprise contracts ramp to full MRR recognition.',
      status: 'final',
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded use of funds versions`);

  const diligenceChecklists = await db
    .insert(diligenceChecklistsTable)
    .values([
      {
        title: 'Series A Investor Diligence Checklist',
        checklistType: 'investor',
        packetType: 'investor',
        status: 'active',
        completionPct: 68,
        notes: 'Standard Series A data room package. Currently in active investor diligence.',
      },
      {
        title: 'Commercial Lender Diligence Checklist',
        checklistType: 'lender',
        packetType: 'lender',
        status: 'active',
        completionPct: 55,
        notes: 'East Coast Commercial Bank standard package for SaaS credit facilities.',
      },
    ])
    .returning();

  await db.insert(diligenceChecklistItemsTable).values([
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'incorporation_docs',
      title: 'Certificate of Incorporation & Bylaws',
      category: 'Legal',
      isRequired: true,
      status: 'complete',
      sortOrder: 1,
    },
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'cap_table_current',
      title: 'Current Cap Table (409A)',
      category: 'Legal',
      isRequired: true,
      status: 'in_progress',
      sortOrder: 2,
      notes: '409A valuation in progress with external firm.',
    },
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'customer_contracts',
      title: 'Material Customer Contracts (>$50K ARR)',
      category: 'Revenue',
      isRequired: true,
      status: 'complete',
      sortOrder: 3,
    },
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'financial_statements_3yr',
      title: '3-Year Financial Statements (audited or CPA-reviewed)',
      category: 'Financial',
      isRequired: true,
      status: 'in_progress',
      sortOrder: 4,
      notes: 'CPA review engagement started. Expected 3 weeks.',
    },
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'ip_ownership',
      title: 'IP Assignment Agreements — All Founders & Engineers',
      category: 'Legal/IP',
      isRequired: true,
      status: 'complete',
      sortOrder: 5,
    },
    {
      checklistId: diligenceChecklists[0].id,
      itemKey: 'product_roadmap',
      title: '12-Month Product Roadmap',
      category: 'Product',
      isRequired: false,
      status: 'complete',
      sortOrder: 6,
    },
    {
      checklistId: diligenceChecklists[1].id,
      itemKey: 'arr_schedule',
      title: 'ARR Schedule with Contract Terms',
      category: 'Revenue',
      isRequired: true,
      status: 'complete',
      sortOrder: 1,
    },
    {
      checklistId: diligenceChecklists[1].id,
      itemKey: 'bank_statements_12m',
      title: '12-Month Business Bank Statements',
      category: 'Financial',
      isRequired: true,
      status: 'not_started',
      sortOrder: 2,
    },
    {
      checklistId: diligenceChecklists[1].id,
      itemKey: 'debt_schedule',
      title: 'Existing Debt Schedule',
      category: 'Financial',
      isRequired: true,
      status: 'complete',
      sortOrder: 3,
    },
    {
      checklistId: diligenceChecklists[1].id,
      itemKey: 'accounts_receivable',
      title: 'Accounts Receivable Aging Schedule',
      category: 'Financial',
      isRequired: true,
      status: 'in_progress',
      sortOrder: 4,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded diligence checklists and items`);

  await db.insert(capTablePlaceholdersTable).values([
    {
      holderName: 'Stephen L. (Founder)',
      holderType: 'founder',
      shareClass: 'Common',
      sharesPlaceholder: '4,500,000',
      ownershipPct: '45%',
      vestingSchedule: '4-year, 1-year cliff',
      isActive: true,
      sortOrder: 1,
    },
    {
      holderName: 'Co-Founder (TBD)',
      holderType: 'founder',
      shareClass: 'Common',
      sharesPlaceholder: '1,500,000',
      ownershipPct: '15%',
      vestingSchedule: '4-year, 1-year cliff',
      isActive: true,
      sortOrder: 2,
    },
    {
      holderName: 'Employee Option Pool',
      holderType: 'option_pool',
      shareClass: 'Common Options',
      sharesPlaceholder: '1,500,000',
      ownershipPct: '15%',
      vestingSchedule: 'Standard 4-year, 1-year cliff per grant',
      isActive: true,
      sortOrder: 3,
    },
    {
      holderName: 'Advisor Pool',
      holderType: 'advisor',
      shareClass: 'Common Options',
      sharesPlaceholder: '300,000',
      ownershipPct: '3%',
      vestingSchedule: '2-year monthly vest',
      isActive: true,
      sortOrder: 4,
    },
    {
      holderName: 'Series A Investors (reserved)',
      holderType: 'investor',
      shareClass: 'Preferred — Series A',
      sharesPlaceholder: '2,200,000 (post-money estimate)',
      ownershipPct: '~22% post-money',
      vestingSchedule: 'N/A',
      notes: '1x non-participating liquidation preference. Pro-rata rights.',
      isActive: true,
      sortOrder: 5,
    },
  ]);

  console.log(`[seed-holdings-fundops] Seeded cap table placeholders`);

  await seedFundNavLpReports();

  console.log('[seed-holdings-fundops] Holdings & Fund Ops seed complete.');
  return { seeded: true };
}

/**
 * Seeds fund-level NAV snapshots and quarterly LP reports so the NAV dashboard
 * charts render with live data instead of falling back to hardcoded fixtures.
 * Idempotent: skips silently if records already exist.
 */
export async function seedFundNavLpReports() {
  const existingFin = await db
    .select({ id: fundPortfolioFinancialsTable.id })
    .from(fundPortfolioFinancialsTable)
    .limit(1);
  if (existingFin.length === 0) {
    await db.insert(fundPortfolioFinancialsTable).values([
      {
        companySlug: 'vessels-maritime',
        companyName: 'Vessels Maritime Intelligence',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'final',
        revenue: '700000',
        revenuePriorPeriod: '520000',
        grossProfit: '525000',
        grossMarginPct: '0.75',
        operatingExpenses: '440000',
        ebitda: '85000',
        netIncome: '62000',
        cashAndEquivalents: '3200000',
        totalAssets: '4100000',
        totalLiabilities: '800000',
        totalEquity: '3300000',
        operatingCashFlow: '95000',
        freeCashFlow: '72000',
        burnRate: '-72000',
        runwayMonths: '22',
        capitalRaised: '4200000',
      },
      {
        companySlug: 'lyte-aiops',
        companyName: 'Lyte AIOps',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'final',
        revenue: '1050000',
        revenuePriorPeriod: '800000',
        grossProfit: '840000',
        grossMarginPct: '0.80',
        operatingExpenses: '720000',
        ebitda: '120000',
        netIncome: '88000',
        cashAndEquivalents: '4800000',
        totalAssets: '5900000',
        totalLiabilities: '1100000',
        totalEquity: '4800000',
        operatingCashFlow: '140000',
        freeCashFlow: '105000',
        burnRate: '-105000',
        runwayMonths: '28',
        capitalRaised: '6500000',
      },
      {
        companySlug: 'prism-counsel',
        companyName: 'PRISM Counsel',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'submitted',
        revenue: '210000',
        revenuePriorPeriod: '95000',
        grossProfit: '168000',
        grossMarginPct: '0.80',
        operatingExpenses: '195000',
        ebitda: '-27000',
        netIncome: '-31000',
        cashAndEquivalents: '680000',
        totalAssets: '820000',
        totalLiabilities: '140000',
        totalEquity: '680000',
        operatingCashFlow: '-28000',
        freeCashFlow: '-35000',
        burnRate: '35000',
        runwayMonths: '18',
        capitalRaised: '850000',
      },
      {
        companySlug: 'terra-realestate',
        companyName: 'Terra Real Estate Intelligence',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'final',
        revenue: '155000',
        revenuePriorPeriod: '82000',
        grossProfit: '124000',
        grossMarginPct: '0.80',
        operatingExpenses: '180000',
        ebitda: '-25000',
        netIncome: '-28000',
        cashAndEquivalents: '540000',
        totalAssets: '640000',
        totalLiabilities: '100000',
        totalEquity: '540000',
        operatingCashFlow: '-22000',
        freeCashFlow: '-30000',
        burnRate: '30000',
        runwayMonths: '14',
        capitalRaised: '750000',
      },
      {
        companySlug: 'aegis-security',
        companyName: 'Aegis Defense & Intelligence',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'submitted',
        revenue: '95000',
        revenuePriorPeriod: '0',
        grossProfit: '76000',
        grossMarginPct: '0.80',
        operatingExpenses: '165000',
        ebitda: '-70000',
        netIncome: '-72000',
        cashAndEquivalents: '780000',
        totalAssets: '900000',
        totalLiabilities: '120000',
        totalEquity: '780000',
        operatingCashFlow: '-65000',
        freeCashFlow: '-72000',
        burnRate: '72000',
        runwayMonths: '20',
        capitalRaised: '1100000',
      },
      {
        companySlug: 'carlota-jo-consulting',
        companyName: 'Carlota Jo Consulting',
        periodType: 'quarterly',
        periodLabel: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        reportingStatus: 'final',
        revenue: '275000',
        revenuePriorPeriod: '248000',
        grossProfit: '220000',
        grossMarginPct: '0.80',
        operatingExpenses: '165000',
        ebitda: '55000',
        netIncome: '48000',
        cashAndEquivalents: '420000',
        totalAssets: '510000',
        totalLiabilities: '90000',
        totalEquity: '420000',
        operatingCashFlow: '52000',
        freeCashFlow: '48000',
        runwayMonths: '99',
        capitalRaised: '0',
      },
    ]);
    console.log('[seed-holdings-fundops] Seeded 6 portfolio financial records');
  } else {
    console.log('[seed-holdings-fundops] Portfolio financials already present, skipping.');
  }

  const existingNav = await db
    .select({ id: fundNavRecordsTable.id })
    .from(fundNavRecordsTable)
    .limit(1);
  if (existingNav.length === 0) {
    // 6 quarterly NAV snapshots, Q4 2024 → Q1 2026. Cents-denominated integers.
    await db.insert(fundNavRecordsTable).values([
      {
        navDate: '2024-12-31',
        totalNavCents: 56_000_000_00,
        calledCapitalCents: 44_000_000_00,
        uncalledCommitmentsCents: 76_000_000_00,
        distributedCents: 1_800_000_00,
        unrealizedValueCents: 54_200_000_00,
        managementFeesPaidCents: 320_000_00,
        carryAccruedCents: 18_000_00,
        grossIrr: '18.6000',
        netIrr: '15.2000',
        tvpi: '1.3100',
        dpi: '0.0900',
        rvpi: '1.2200',
        notes: 'Q4 2024 close — pre-Vessels Series A allocation',
      },
      {
        navDate: '2025-03-31',
        totalNavCents: 62_400_000_00,
        calledCapitalCents: 48_000_000_00,
        uncalledCommitmentsCents: 72_000_000_00,
        distributedCents: 3_200_000_00,
        unrealizedValueCents: 59_200_000_00,
        managementFeesPaidCents: 480_000_00,
        carryAccruedCents: 42_000_00,
        grossIrr: '22.4000',
        netIrr: '18.4000',
        tvpi: '1.4800',
        dpi: '0.1800',
        rvpi: '1.3000',
        notes: 'Q1 2025 mark — Vessels Series A close',
      },
      {
        navDate: '2025-06-30',
        totalNavCents: 68_800_000_00,
        calledCapitalCents: 52_000_000_00,
        uncalledCommitmentsCents: 68_000_000_00,
        distributedCents: 3_200_000_00,
        unrealizedValueCents: 65_600_000_00,
        managementFeesPaidCents: 642_000_00,
        carryAccruedCents: 110_000_00,
        grossIrr: '25.8000',
        netIrr: '21.3000',
        tvpi: '1.6600',
        dpi: '0.3000',
        rvpi: '1.3600',
        notes: 'Q2 2025 mark',
      },
      {
        navDate: '2025-09-30',
        totalNavCents: 74_200_000_00,
        calledCapitalCents: 56_000_000_00,
        uncalledCommitmentsCents: 64_000_000_00,
        distributedCents: 5_800_000_00,
        unrealizedValueCents: 68_400_000_00,
        managementFeesPaidCents: 806_000_00,
        carryAccruedCents: 204_000_00,
        grossIrr: '28.2000',
        netIrr: '24.1000',
        tvpi: '1.8200',
        dpi: '0.4100',
        rvpi: '1.4100',
        notes: 'Q3 2025 mark — PRISM Counsel revenue inflection',
      },
      {
        navDate: '2025-12-31',
        totalNavCents: 79_100_000_00,
        calledCapitalCents: 58_400_000_00,
        uncalledCommitmentsCents: 61_600_000_00,
        distributedCents: 7_200_000_00,
        unrealizedValueCents: 71_900_000_00,
        managementFeesPaidCents: 972_000_00,
        carryAccruedCents: 332_000_00,
        grossIrr: '30.4000',
        netIrr: '26.8000',
        tvpi: '1.9800',
        dpi: '0.5200',
        rvpi: '1.4600',
        notes: 'Q4 2025 year-end mark',
      },
      {
        navDate: '2026-03-31',
        totalNavCents: 84_200_000_00,
        calledCapitalCents: 62_000_000_00,
        uncalledCommitmentsCents: 58_000_000_00,
        distributedCents: 9_400_000_00,
        unrealizedValueCents: 74_800_000_00,
        managementFeesPaidCents: 1_140_000_00,
        carryAccruedCents: 488_000_00,
        grossIrr: '32.1000',
        netIrr: '28.4000',
        tvpi: '2.1000',
        dpi: '0.6200',
        rvpi: '1.4800',
        notes: 'Q1 2026 mark-to-market — Lyte enterprise expansion',
      },
    ]);
    console.log('[seed-holdings-fundops] Seeded 6 quarterly NAV records');
  } else {
    console.log('[seed-holdings-fundops] NAV records already present, skipping.');
  }

  const existingReports = await db
    .select({ id: fundLpReportsTable.id })
    .from(fundLpReportsTable)
    .limit(1);
  if (existingReports.length === 0) {
    await db.insert(fundLpReportsTable).values([
      {
        reportType: 'quarterly',
        reportingPeriod: 'Q1 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        version: 1,
        status: 'approved',
        grossIrr: '32.1000',
        netIrr: '28.4000',
        tvpi: '2.1000',
        dpi: '0.6200',
        rvpi: '1.4800',
        fundNav: '84200000.00',
        totalCommitments: '120000000.00',
        calledCapital: '62000000.00',
        distributedCapital: '9400000.00',
        unrealizedValue: '74800000.00',
        managementFeesAccrued: '1140000.00',
        managementFeesPaid: '1140000.00',
        carriedInterestAccrued: '488000.00',
        carriedInterestPaid: '0.00',
        preferredReturnAccrued: '1240000.00',
        preferredReturnRate: '0.0800',
        carryRate: '0.2000',
        managementFeeRate: '0.0200',
        narrativeSummary:
          'Strong quarter driven by Lyte enterprise expansion and Vessels NRR holding above 118%. NAV per unit reached $1.402.',
        approvedBy: 'Stephen L.',
      },
      {
        reportType: 'quarterly',
        reportingPeriod: 'Q4 2025',
        periodStart: '2025-10-01',
        periodEnd: '2025-12-31',
        version: 1,
        status: 'distributed',
        grossIrr: '30.4000',
        netIrr: '26.8000',
        tvpi: '1.9800',
        dpi: '0.5200',
        rvpi: '1.4600',
        fundNav: '79100000.00',
        totalCommitments: '120000000.00',
        calledCapital: '58400000.00',
        distributedCapital: '7200000.00',
        unrealizedValue: '71900000.00',
        managementFeesAccrued: '972000.00',
        managementFeesPaid: '972000.00',
        carriedInterestAccrued: '332000.00',
        carriedInterestPaid: '0.00',
        preferredReturnAccrued: '1168000.00',
        preferredReturnRate: '0.0800',
        carryRate: '0.2000',
        managementFeeRate: '0.0200',
        narrativeSummary:
          'Year-end mark. Distributions returned $2.0M to LPs in Q4. PRISM Counsel ARR doubled YoY.',
        approvedBy: 'Stephen L.',
        approvedAt: new Date('2026-01-12'),
        distributedAt: new Date('2026-01-15'),
      },
      {
        reportType: 'quarterly',
        reportingPeriod: 'Q3 2025',
        periodStart: '2025-07-01',
        periodEnd: '2025-09-30',
        version: 1,
        status: 'distributed',
        grossIrr: '28.2000',
        netIrr: '24.1000',
        tvpi: '1.8200',
        dpi: '0.4100',
        rvpi: '1.4100',
        fundNav: '74200000.00',
        totalCommitments: '120000000.00',
        calledCapital: '56000000.00',
        distributedCapital: '5800000.00',
        unrealizedValue: '68400000.00',
        managementFeesAccrued: '806000.00',
        managementFeesPaid: '806000.00',
        carriedInterestAccrued: '204000.00',
        carriedInterestPaid: '0.00',
        preferredReturnAccrued: '1120000.00',
        preferredReturnRate: '0.0800',
        carryRate: '0.2000',
        managementFeeRate: '0.0200',
        narrativeSummary:
          'PRISM Counsel revenue inflection. $2.6M distribution to LPs from Vessels secondary.',
        approvedBy: 'Stephen L.',
        approvedAt: new Date('2025-10-10'),
        distributedAt: new Date('2025-10-12'),
      },
      {
        reportType: 'quarterly',
        reportingPeriod: 'Q2 2025',
        periodStart: '2025-04-01',
        periodEnd: '2025-06-30',
        version: 1,
        status: 'distributed',
        grossIrr: '25.8000',
        netIrr: '21.3000',
        tvpi: '1.6600',
        dpi: '0.3000',
        rvpi: '1.3600',
        fundNav: '68800000.00',
        totalCommitments: '120000000.00',
        calledCapital: '52000000.00',
        distributedCapital: '3200000.00',
        unrealizedValue: '65600000.00',
        managementFeesAccrued: '642000.00',
        managementFeesPaid: '642000.00',
        carriedInterestAccrued: '110000.00',
        carriedInterestPaid: '0.00',
        preferredReturnAccrued: '1040000.00',
        preferredReturnRate: '0.0800',
        carryRate: '0.2000',
        managementFeeRate: '0.0200',
        narrativeSummary: 'Steady quarter. Lyte AIOps crossed 25 enterprise customers.',
        approvedBy: 'Stephen L.',
        approvedAt: new Date('2025-07-12'),
        distributedAt: new Date('2025-07-14'),
      },
      {
        reportType: 'quarterly',
        reportingPeriod: 'Q1 2025',
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        version: 1,
        status: 'distributed',
        grossIrr: '22.4000',
        netIrr: '18.4000',
        tvpi: '1.4800',
        dpi: '0.1800',
        rvpi: '1.3000',
        fundNav: '62400000.00',
        totalCommitments: '120000000.00',
        calledCapital: '48000000.00',
        distributedCapital: '3200000.00',
        unrealizedValue: '59200000.00',
        managementFeesAccrued: '480000.00',
        managementFeesPaid: '480000.00',
        carriedInterestAccrued: '42000.00',
        carriedInterestPaid: '0.00',
        preferredReturnAccrued: '960000.00',
        preferredReturnRate: '0.0800',
        carryRate: '0.2000',
        managementFeeRate: '0.0200',
        narrativeSummary:
          'Vessels Series A closed at $4.2M. Fund NAV crossed $60M for the first time.',
        approvedBy: 'Stephen L.',
        approvedAt: new Date('2025-04-12'),
        distributedAt: new Date('2025-04-14'),
      },
    ]);
    console.log('[seed-holdings-fundops] Seeded 5 quarterly LP reports');
  } else {
    console.log('[seed-holdings-fundops] LP reports already present, skipping.');
  }
}
