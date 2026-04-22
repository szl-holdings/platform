import {
  carlotaClientProfilesTable,
  carlotaInquiriesTable,
  carlotaReservationsTable,
  carlotaServicesTable,
  clientAccountsTable,
  clientDocumentsTable,
  clientMessagesTable,
  clientUpdatesTable,
  db,
} from '@szl-holdings/db';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function _daysAhead(n: number) {
  return new Date(Date.now() + n * 86400000);
}

export async function seedCarlotaClients() {

  const existing = await db
    .select({ id: carlotaServicesTable.id })
    .from(carlotaServicesTable)
    .limit(1);
  if (existing.length > 0) {
    return { skipped: true };
  }

  const ORG_ID = 1;
  const OWNER_USER_ID = 1;

  const _services = await db
    .insert(carlotaServicesTable)
    .values([
      {
        slug: 'executive-strategy',
        name: 'Executive Strategy Intensive',
        summary:
          'Bespoke 3-month executive strategy engagement for senior leaders navigating transformation.',
        description:
          'A deeply personalized, high-touch advisory program designed for C-suite executives and founders. Combines strategic planning, organizational design, stakeholder alignment, and leadership coaching.',
        icon: 'Lightbulb',
        category: 'Advisory',
        capabilities: [
          'Strategic planning',
          'Leadership alignment',
          'Board advisory',
          'Growth architecture',
          'Stakeholder mapping',
        ],
        isActive: 'true',
        sortOrder: 1,
      },
      {
        slug: 'board-readiness',
        name: 'Board Readiness Program',
        summary:
          'Comprehensive preparation for executives seeking board seats or preparing to present to boards.',
        description:
          'Includes board dynamics coaching, governance literacy, narrative construction, and rehearsal sessions with senior advisors.',
        icon: 'Users',
        category: 'Advisory',
        capabilities: [
          'Board communication coaching',
          'Governance literacy',
          'Executive narrative',
          'Investor relations',
        ],
        isActive: 'true',
        sortOrder: 2,
      },
      {
        slug: 'organizational-design',
        name: 'Organizational Design Sprint',
        summary: '10-day intensive org design engagement for companies scaling or restructuring.',
        description:
          'Maps current-state org, identifies structural inefficiencies, and delivers future-state operating model with role clarity and reporting cadence.',
        icon: 'Network',
        category: 'Consulting',
        capabilities: [
          'Org mapping',
          'Role clarity',
          'Reporting structure',
          'Team velocity analysis',
        ],
        isActive: 'true',
        sortOrder: 3,
      },
      {
        slug: 'vip-coaching',
        name: 'VIP Executive Coaching',
        summary:
          'Monthly coaching retainer for senior leaders seeking personal performance and leadership development.',
        description:
          'Ongoing monthly engagement — 4 sessions per month with Carlota Jo directly. Focus on decision-making, influence, resilience, and executive presence.',
        icon: 'Star',
        category: 'Coaching',
        capabilities: [
          'Executive presence',
          'Decision frameworks',
          'Influence and persuasion',
          'Resilience coaching',
        ],
        isActive: 'true',
        sortOrder: 4,
      },
      {
        slug: 'keynote-facilitation',
        name: 'Keynote & Facilitation',
        summary: 'Custom keynote presentations and executive offsite facilitation.',
        description:
          'Carlota Jo delivers tailored keynotes for leadership summits, board retreats, and corporate events. Includes custom content design, delivery, and post-event synthesis.',
        icon: 'Mic',
        category: 'Speaking',
        capabilities: [
          'Custom keynote',
          'Offsite facilitation',
          'Leadership summits',
          'Board retreats',
        ],
        isActive: 'true',
        sortOrder: 5,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const _clientProfiles = await db
    .insert(carlotaClientProfilesTable)
    .values([
      {
        name: 'Vanessa Holloway',
        email: 'vholloway@hollowaycap.com',
        company: 'Holloway Capital Partners',
        phone: '+1-212-555-0148',
        industry: 'Private Equity',
        notes: 'High-priority client. 3rd engagement — executive strategy retainer + VIP coaching.',
      },
      {
        name: 'James Whitmore',
        email: 'j.whitmore@axiomhealth.com',
        company: 'Axiom Health Systems',
        phone: '+1-646-555-0219',
        industry: 'Healthcare',
        notes:
          'Board readiness program. First engagement. CEO preparing for first independent board seat.',
      },
      {
        name: 'Dr. Lin Mei',
        email: 'lmei@meridianventures.com',
        company: 'Meridian Ventures',
        phone: '+1-415-555-0381',
        industry: 'Venture Capital',
        notes: 'Organizational design sprint for newly promoted leadership team.',
      },
      {
        name: 'Carlos Medina',
        email: 'cmedina@medinagroup.mx',
        company: 'Medina Group',
        phone: '+52-55-555-0142',
        industry: 'Construction & Real Estate',
        notes: 'Bilingual engagement — English/Spanish. Executive strategy for US market entry.',
      },
      {
        name: 'Priya Chakrabarti',
        email: 'priya@brightdawntech.com',
        company: 'Bright Dawn Technologies',
        phone: '+1-617-555-0472',
        industry: 'Technology',
        notes: 'VIP coaching — Series B CEO. Quarterly strategy sessions ongoing.',
      },
      {
        name: 'Rachel Ogunwale',
        email: 'rogunwale@fortislaw.com',
        company: 'Fortis Law Partners',
        phone: '+1-347-555-0519',
        industry: 'Legal Services',
        notes: 'New inquiry — keynote for annual partner summit.',
      },
    ])
    .returning();

  await db.insert(carlotaInquiriesTable).values([
    {
      name: 'Thomas Beaumont',
      email: 't.beaumont@beaumont-advisors.com',
      company: 'Beaumont Advisors',
      service: 'Executive Strategy Intensive',
      message:
        'Our firm is navigating a significant restructuring and I am looking for a strategic partner to work alongside our leadership team over the next 3–6 months. Carlota Jo was recommended by Vanessa Holloway.',
      status: 'in_progress',
    },
    {
      name: 'Dr. Sarah Kim',
      email: 'skim@stanfordmed.edu',
      company: 'Stanford Medical Center',
      service: 'Board Readiness Program',
      message:
        'I am a physician executive being considered for a public company board. I want to ensure I am properly prepared — governance, communication, and strategic fluency. Please reach out at your earliest convenience.',
      status: 'contacted',
    },
    {
      name: 'Michael Torres',
      email: 'mtorres@torresbuilds.com',
      company: 'Torres Construction Group',
      service: 'Organizational Design Sprint',
      message:
        'We grew from 80 to 240 people in 18 months and our org structure has not kept pace. Looking for a structured assessment and redesign over 2–3 weeks.',
      status: 'new',
    },
    {
      name: 'Amara Osei',
      email: 'aosei@globalimpact.org',
      company: 'Global Impact Initiative',
      service: 'Keynote & Facilitation',
      message:
        'Seeking a keynote speaker for our annual leadership conference in June. Audience of 400+ nonprofit executives. Theme: Leading Through Uncertainty.',
      status: 'new',
    },
    {
      name: 'Elena Marchetti',
      email: 'emarchetti@marchettilux.it',
      company: 'Marchetti Luxury Group',
      service: 'Executive Strategy Intensive',
      message:
        'We are expanding our luxury hospitality portfolio to the US market and need strategic guidance from someone with deep market knowledge and luxury industry experience.',
      status: 'contacted',
    },
  ]);

  const _reservations = await db
    .insert(carlotaReservationsTable)
    .values([
      {
        confirmationId: 'CJC-2026-0041',
        service: 'VIP Executive Coaching',
        tier: 'Monthly Retainer — Premium',
        date: '2026-04-22',
        time: '10:00 AM',
        name: 'Vanessa Holloway',
        email: 'vholloway@hollowaycap.com',
        company: 'Holloway Capital Partners',
        phone: '+1-212-555-0148',
        notes: 'Monthly session 4 of 12. Vanessa is preparing for Q2 board presentation.',
        status: 'confirmed',
        amount: '4500.00',
        currency: 'USD',
        paymentStatus: 'paid',
      },
      {
        confirmationId: 'CJC-2026-0042',
        service: 'Board Readiness Program',
        tier: 'Full Engagement',
        date: '2026-04-29',
        time: '9:00 AM',
        name: 'James Whitmore',
        email: 'j.whitmore@axiomhealth.com',
        company: 'Axiom Health Systems',
        notes: 'Session 1 of 8. Introduction and governance literacy foundations.',
        status: 'confirmed',
        amount: '12500.00',
        currency: 'USD',
        paymentStatus: 'paid',
      },
      {
        confirmationId: 'CJC-2026-0043',
        service: 'Executive Strategy Intensive',
        tier: '3-Month Engagement',
        date: '2026-05-05',
        time: '11:00 AM',
        name: 'Carlos Medina',
        email: 'cmedina@medinagroup.mx',
        company: 'Medina Group',
        notes: 'Kickoff session. US market entry strategy — real estate and construction sector.',
        status: 'confirmed',
        amount: '18000.00',
        currency: 'USD',
        paymentStatus: 'unpaid',
      },
      {
        confirmationId: 'CJC-2026-0038',
        service: 'Keynote & Facilitation',
        tier: 'Half-Day Keynote',
        date: '2026-03-28',
        time: '9:30 AM',
        name: 'Rachel Ogunwale',
        email: 'rogunwale@fortislaw.com',
        company: 'Fortis Law Partners',
        notes: 'Annual partner summit keynote. 60-minute talk + Q&A.',
        status: 'completed',
        amount: '8500.00',
        currency: 'USD',
        paymentStatus: 'paid',
      },
      {
        confirmationId: 'CJC-2026-0039',
        service: 'VIP Executive Coaching',
        tier: 'Monthly Retainer — Premium',
        date: '2026-04-08',
        time: '2:00 PM',
        name: 'Priya Chakrabarti',
        email: 'priya@brightdawntech.com',
        company: 'Bright Dawn Technologies',
        notes: 'Monthly coaching — Series B fundraising narrative and board management.',
        status: 'completed',
        amount: '4500.00',
        currency: 'USD',
        paymentStatus: 'paid',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const clientAccounts = await db
    .insert(clientAccountsTable)
    .values([
      {
        organizationId: ORG_ID,
        displayName: 'Holloway Capital Partners',
        primaryContactUserId: OWNER_USER_ID,
        status: 'active',
      },
      {
        organizationId: ORG_ID,
        displayName: 'Axiom Health Systems',
        primaryContactUserId: OWNER_USER_ID,
        status: 'active',
      },
      {
        organizationId: ORG_ID,
        displayName: 'Bright Dawn Technologies',
        primaryContactUserId: OWNER_USER_ID,
        status: 'active',
      },
      {
        organizationId: ORG_ID,
        displayName: 'Medina Group',
        primaryContactUserId: OWNER_USER_ID,
        status: 'onboarding',
      },
    ])
    .returning();

  await db.insert(clientDocumentsTable).values([
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[0].id,
      title: 'Executive Strategy Engagement Summary — Q1 2026',
      description:
        'Outcomes and recommendations from the Q1 executive strategy intensive with Vanessa Holloway.',
      fileType: 'pdf',
      visibility: 'client',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[0].id,
      title: 'Board Communication Framework',
      description:
        'Custom communication framework developed for Holloway Capital Partners leadership.',
      fileType: 'pdf',
      visibility: 'client',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[1].id,
      title: 'Board Readiness Assessment — James Whitmore',
      description: 'Pre-engagement governance literacy assessment and gap analysis.',
      fileType: 'pdf',
      visibility: 'client',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[2].id,
      title: 'Q1 2026 Coaching Session Notes — Priya Chakrabarti',
      description: 'Session outcomes: fundraising narrative and investor communication strategy.',
      fileType: 'pdf',
      visibility: 'client',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[3].id,
      title: 'US Market Entry Strategy — Working Draft',
      description: 'Early draft of US expansion strategic framework for Medina Group.',
      fileType: 'docx',
      visibility: 'internal',
    },
  ]);

  await db.insert(clientUpdatesTable).values([
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[0].id,
      title: 'Q1 2026 Strategy Recap & Q2 Priorities',
      summary: 'Summary of Q1 work streams, key decisions made, and recommended Q2 focus areas.',
      bodyRichtext:
        '<p>Vanessa, here is the formal recap of our Q1 engagement...</p><p>Key outcomes: board communication framework finalized, three direct reports onboarded to new decision model, Q2 investor narrative drafted.</p>',
      publishedAt: daysAgo(10),
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[1].id,
      title: 'Board Readiness Program — Module 1 Complete',
      summary:
        'Module 1 (Governance Literacy) complete. Key learnings and preparation for Module 2.',
      bodyRichtext: '<p>James, you have completed Module 1 of the Board Readiness Program...</p>',
      publishedAt: daysAgo(5),
    },
  ]);

  await db.insert(clientMessagesTable).values([
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[0].id,
      senderUserId: OWNER_USER_ID,
      subject: 'Q2 Schedule Confirmation',
      bodyRichtext:
        '<p>Vanessa — confirming our April 22nd session and proposing May 20th for the following month. Please confirm availability.</p>',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[1].id,
      senderUserId: OWNER_USER_ID,
      subject: 'Homework for Session 2',
      bodyRichtext:
        '<p>James — please review the attached board meeting agenda sample and come prepared to discuss your initial reactions to the governance framework.</p>',
    },
    {
      organizationId: ORG_ID,
      clientAccountId: clientAccounts[2].id,
      senderUserId: OWNER_USER_ID,
      subject: 'Series B Narrative Draft',
      bodyRichtext:
        '<p>Priya — I have reviewed your investor narrative draft. Below are my notes ahead of our next session...</p>',
    },
  ]);
  return { seeded: true };
}
