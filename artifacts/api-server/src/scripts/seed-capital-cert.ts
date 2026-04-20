import {
  certificationProgramsTable,
  certificationRequirementsTable,
  certificationStatusTable,
  db,
  diligenceChecklistItemsTable,
  diligenceChecklistsTable,
  featureFlagsTable,
  investorPacketDeliverables,
  investorPacketsTable,
  lenderPacketDeliverables,
  lenderPacketsTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

async function upsertFlag(key: string, name: string, description: string) {
  const [existing] = await db
    .select()
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.key, key));
  if (!existing) {
    await db
      .insert(featureFlagsTable)
      .values({ key, name, description, isEnabled: true, rolloutPercentage: 100 });
    console.log(`Created feature flag: ${key}`);
  } else {
    console.log(`Feature flag already exists: ${key}`);
  }
}

const CERT_PROGRAMS = [
  {
    slug: 'ny-mwbe',
    name: 'New York State MWBE',
    shortName: 'NY MWBE',
    administeredBy: 'NYS Empire State Development',
    programType: 'state' as const,
    targetDemographic: 'Minority- and Women-Owned Business Enterprise',
    description:
      'State certification for minority- and women-owned businesses that enables procurement set-asides on NY state and local government contracts.',
    eligibilitySummary:
      'Business must be at least 51% owned, operated, and controlled by a minority or woman. Owner must be a US citizen or permanent resident. Business must be physically located in NYS or perform substantial business in NYS.',
    applicationUrl: 'https://ny.newnycontracts.com',
    renewalIntervalMonths: 24,
    requiresAttorneyReview: true,
    requiresCpaReview: true,
    notes:
      'Ownership and control documentation is intensive. Recommend attorney review before application.',
  },
  {
    slug: 'wosb-edwosb',
    name: 'WOSB / EDWOSB',
    shortName: 'WOSB',
    administeredBy: 'US Small Business Administration',
    programType: 'federal' as const,
    targetDemographic:
      'Women-Owned Small Business / Economically Disadvantaged Women-Owned Small Business',
    description:
      'Federal certification enabling competition for WOSB-designated federal contracts. EDWOSB adds income/asset eligibility requirements.',
    eligibilitySummary:
      'Business must be at least 51% owned and controlled by one or more women who are US citizens. Must qualify as a small business per SBA size standards. EDWOSB requires economic disadvantage determination.',
    applicationUrl: 'https://certify.sba.gov',
    renewalIntervalMonths: 12,
    requiresAttorneyReview: false,
    requiresCpaReview: true,
    notes:
      'Self-certification now replaced by SBA or third-party certifier. EDWOSB requires personal financial disclosure.',
  },
  {
    slug: 'vosb-sdvosb',
    name: 'VOSB / SDVOSB',
    shortName: 'VOSB',
    administeredBy: 'US Department of Veterans Affairs / SBA',
    programType: 'federal' as const,
    targetDemographic:
      'Veteran-Owned Small Business / Service-Disabled Veteran-Owned Small Business',
    description:
      'Federal certification for veteran-owned and service-disabled veteran-owned businesses. Enables set-asides on VA contracts and other federal procurements.',
    eligibilitySummary:
      'Business must be at least 51% owned and controlled by a veteran or service-disabled veteran. Veteran must manage day-to-day operations.',
    applicationUrl: 'https://vetcert.va.gov',
    renewalIntervalMonths: 12,
    requiresAttorneyReview: false,
    requiresCpaReview: false,
    notes:
      "VA Vets First program has its own certification track. Confirm which agency's certification is most relevant to target contracts.",
  },
  {
    slug: 'sba-8a',
    name: 'SBA 8(a) Business Development',
    shortName: '8(a)',
    administeredBy: 'US Small Business Administration',
    programType: 'federal' as const,
    targetDemographic: 'Socially and Economically Disadvantaged Small Business',
    description:
      'Nine-year federal business development program with access to sole-source and set-aside federal contracts. Includes mentorship and training.',
    eligibilitySummary:
      'Business must be at least 51% owned by socially and economically disadvantaged US citizens. Must be a small business. Owner must demonstrate good character. Two-year operating history generally required.',
    applicationUrl: 'https://certify.sba.gov',
    renewalIntervalMonths: 12,
    requiresAttorneyReview: true,
    requiresCpaReview: true,
    notes:
      'Most intensive application process. Personal net worth limit applies. Attorney and CPA review strongly recommended.',
  },
  {
    slug: 'sam-registration',
    name: 'SAM.gov Registration',
    shortName: 'SAM',
    administeredBy: 'GSA / System for Award Management',
    programType: 'federal' as const,
    targetDemographic: 'All federal contractors',
    description:
      'Mandatory registration for all entities doing business with the federal government. Required for all federal grants and contracts.',
    eligibilitySummary:
      'Any entity wishing to bid on federal contracts or apply for federal grants must register in SAM. Renewal required annually.',
    applicationUrl: 'https://sam.gov',
    renewalIntervalMonths: 12,
    requiresAttorneyReview: false,
    requiresCpaReview: false,
    notes:
      'Foundation for all federal contracting. Must be completed before applying for any federal certifications or opportunities.',
  },
];

const CERT_REQUIREMENTS: Record<
  string,
  Array<{
    requirementKey: string;
    title: string;
    description: string;
    category: string;
    isRequired: boolean;
    requiresReview: boolean;
    reviewType: string;
  }>
> = {
  'ny-mwbe': [
    {
      requirementKey: 'ownership_51',
      title: '51%+ Minority/Women Ownership',
      description:
        'Documented proof of at least 51% ownership by qualifying minority or women individuals.',
      category: 'ownership',
      isRequired: true,
      requiresReview: true,
      reviewType: 'attorney',
    },
    {
      requirementKey: 'control_demonstration',
      title: 'Day-to-Day Control Demonstration',
      description:
        'Evidence that the qualifying owner exercises control over business operations, not just ownership.',
      category: 'control',
      isRequired: true,
      requiresReview: true,
      reviewType: 'attorney',
    },
    {
      requirementKey: 'us_citizenship',
      title: 'US Citizenship or Permanent Resident Status',
      description: 'Proof of citizenship or permanent residency for all qualifying owners.',
      category: 'identity',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'nys_nexus',
      title: 'New York State Business Nexus',
      description: 'Physical location in NYS or substantial business activity in NYS.',
      category: 'operational',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'financial_statements',
      title: 'Business Financial Statements',
      description: 'Most recent two years of business financial statements or tax returns.',
      category: 'financials',
      isRequired: true,
      requiresReview: true,
      reviewType: 'cpa',
    },
    {
      requirementKey: 'articles_formation',
      title: 'Articles of Organization/Incorporation',
      description: 'State-filed formation documents.',
      category: 'legal',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'operating_agreement',
      title: 'Operating Agreement or Bylaws',
      description: 'Current operating agreement, shareholder agreement, or bylaws.',
      category: 'legal',
      isRequired: true,
      requiresReview: true,
      reviewType: 'attorney',
    },
  ],
  'wosb-edwosb': [
    {
      requirementKey: 'ownership_51_women',
      title: '51%+ Women Ownership',
      description: 'Proof of at least 51% ownership by qualifying women who are US citizens.',
      category: 'ownership',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'management_control',
      title: 'Management and Control by Women',
      description:
        'Evidence that qualifying women make long-term decisions and manage day-to-day operations.',
      category: 'control',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'sba_size_standard',
      title: 'SBA Small Business Size Standard',
      description: 'Business must not exceed SBA size standards for its NAICS code.',
      category: 'operational',
      isRequired: true,
      requiresReview: true,
      reviewType: 'cpa',
    },
    {
      requirementKey: 'edwosb_financial_disclosure',
      title: 'EDWOSB Personal Financial Disclosure',
      description:
        'For EDWOSB designation: personal financial disclosure showing economic disadvantage.',
      category: 'financials',
      isRequired: false,
      requiresReview: true,
      reviewType: 'cpa',
    },
    {
      requirementKey: 'naics_code_eligibility',
      title: 'NAICS Code Eligibility',
      description: 'Business operates in an industry underrepresented by women under WOSB program.',
      category: 'operational',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
  ],
  'sam-registration': [
    {
      requirementKey: 'ein_or_ssn',
      title: 'EIN (Employer Identification Number)',
      description: 'Valid EIN from the IRS.',
      category: 'legal',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'uei',
      title: 'Unique Entity Identifier (UEI)',
      description: 'SAM.gov-assigned UEI for the entity.',
      category: 'legal',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'naics_codes',
      title: 'Primary and Secondary NAICS Codes',
      description: "Accurate NAICS codes representing the business's primary capabilities.",
      category: 'operational',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'banking_info',
      title: 'Banking / ACH Information',
      description: 'Bank account information for receiving federal payments.',
      category: 'financials',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
    {
      requirementKey: 'annual_renewal',
      title: 'Annual Renewal Tracking',
      description: 'SAM registration expires annually. Lapsed registration disqualifies bidding.',
      category: 'operational',
      isRequired: true,
      requiresReview: false,
      reviewType: 'none',
    },
  ],
};

const LENDER_DELIVERABLES = [
  {
    deliverableKey: 'business_plan',
    title: 'Business Plan',
    description:
      'Bank-ready business plan covering market, operations, team, and financial projections.',
    sortOrder: 1,
  },
  {
    deliverableKey: 'use_of_funds_memo',
    title: 'Use of Funds Memo',
    description:
      'Structured memo explaining how loan proceeds will be deployed and expected returns.',
    sortOrder: 2,
  },
  {
    deliverableKey: 'operating_model_12m',
    title: '12-Month Operating Model',
    description:
      'Month-by-month revenue, expense, and cash flow projections for the next 12 months.',
    sortOrder: 3,
  },
  {
    deliverableKey: 'operating_model_24m',
    title: '24-Month Operating Model',
    description: '24-month projections showing path to profitability or debt serviceability.',
    sortOrder: 4,
  },
  {
    deliverableKey: 'cash_flow_view',
    title: 'Cash Flow Summary',
    description: 'Summary cash flow view showing operating, investing, and financing activities.',
    sortOrder: 5,
  },
  {
    deliverableKey: 'debt_service_view',
    title: 'Debt Service Coverage Analysis',
    description: 'Projected DSCR analysis demonstrating ability to service proposed loan.',
    sortOrder: 6,
  },
  {
    deliverableKey: 'founder_background',
    title: 'Founder / Principal Background Summary',
    description: 'Narrative bio and professional background of all principals.',
    sortOrder: 7,
  },
  {
    deliverableKey: 'company_structure',
    title: 'Company Structure Summary',
    description: 'Legal structure, ownership, and organizational chart.',
    sortOrder: 8,
  },
  {
    deliverableKey: 'revenue_assumptions',
    title: 'Revenue Assumptions Sheet',
    description:
      'Detailed documentation of all revenue assumptions underlying financial projections.',
    sortOrder: 9,
  },
  {
    deliverableKey: 'risk_mitigation',
    title: 'Risk / Mitigation Sheet',
    description: 'Key business risks identified and corresponding mitigation strategies.',
    sortOrder: 10,
  },
];

const INVESTOR_DELIVERABLES = [
  {
    deliverableKey: 'investor_memo',
    title: 'Investor Memo',
    description:
      'Structured investment memo covering opportunity, market, traction, team, and ask.',
    sortOrder: 1,
  },
  {
    deliverableKey: 'deck_outline',
    title: 'Investor Deck Outline',
    description: 'Slide-by-slide outline for investor presentation deck.',
    sortOrder: 2,
  },
  {
    deliverableKey: 'one_pager',
    title: 'One-Page Company Summary',
    description: 'Concise one-page overview for initial investor conversations.',
    sortOrder: 3,
  },
  {
    deliverableKey: 'data_room_checklist',
    title: 'Data Room Checklist',
    description: 'Structured list of all documents to prepare for investor due diligence.',
    sortOrder: 4,
  },
  {
    deliverableKey: 'cap_table_structure',
    title: 'Cap Table Placeholder Structure',
    description: 'Pre-money cap table placeholder showing founder ownership and option pool.',
    sortOrder: 5,
  },
  {
    deliverableKey: 'product_architecture',
    title: 'Product Architecture Summary',
    description: 'Non-technical summary of product architecture and IP positioning.',
    sortOrder: 6,
  },
  {
    deliverableKey: 'traction_narrative',
    title: 'Traction Narrative',
    description: 'Structured narrative of key traction metrics, milestones, and momentum.',
    sortOrder: 7,
  },
  {
    deliverableKey: 'use_of_proceeds',
    title: 'Use of Proceeds Model',
    description:
      'Detailed model showing how investment proceeds will be deployed and milestones funded.',
    sortOrder: 8,
  },
  {
    deliverableKey: 'milestone_raise_plan',
    title: 'Milestone-Based Raise Plan',
    description: 'Map of raise milestones, tranches, and what each tranche unlocks.',
    sortOrder: 9,
  },
];

async function seedCertPrograms() {
  for (const program of CERT_PROGRAMS) {
    const [existing] = await db
      .select()
      .from(certificationProgramsTable)
      .where(eq(certificationProgramsTable.slug, program.slug));
    if (existing) {
      console.log(`Cert program already exists: ${program.slug}`);
      continue;
    }
    const [inserted] = await db.insert(certificationProgramsTable).values(program).returning();
    console.log(`Created cert program: ${program.slug} (id: ${inserted.id})`);

    await db.insert(certificationStatusTable).values({
      programId: inserted.id,
      overallStatus: 'not_started',
      readinessScore: 0,
    });
    console.log(`Created initial status for: ${program.slug}`);

    const reqList = CERT_REQUIREMENTS[program.slug];
    if (reqList) {
      for (let i = 0; i < reqList.length; i++) {
        const req = reqList[i];
        await db.insert(certificationRequirementsTable).values({
          programId: inserted.id,
          requirementKey: req.requirementKey,
          title: req.title,
          description: req.description,
          category: req.category as
            | 'ownership'
            | 'control'
            | 'documentation'
            | 'financials'
            | 'operational'
            | 'legal'
            | 'identity'
            | 'other',
          isRequired: req.isRequired,
          requiresReview: req.requiresReview,
          reviewType: req.reviewType as 'attorney' | 'cpa' | 'both' | 'none',
          sortOrder: i,
        });
      }
      console.log(`Created ${reqList.length} requirements for: ${program.slug}`);
    }
  }
}

async function seedCapitalPackets() {
  const [existingLender] = await db
    .select()
    .from(lenderPacketsTable)
    .where(eq(lenderPacketsTable.title, 'SBA 7(a) Lender Packet — v1'));
  if (!existingLender) {
    const [packet] = await db
      .insert(lenderPacketsTable)
      .values({
        title: 'SBA 7(a) Lender Packet — v1',
        lenderType: 'sba',
        status: 'drafting',
        completionPct: 0,
        notes:
          'Initial SBA 7(a) loan application packet. Template structure seeded — fill in actual data as available.',
      })
      .returning();

    for (const d of LENDER_DELIVERABLES) {
      await db.insert(lenderPacketDeliverables).values({
        packetId: packet.id,
        deliverableKey: d.deliverableKey,
        title: d.title,
        description: d.description,
        status: 'not_started',
        version: 1,
        sortOrder: d.sortOrder,
      });
    }
    console.log(`Created lender packet with ${LENDER_DELIVERABLES.length} deliverables`);
  } else {
    console.log('Lender packet already exists');
  }

  const [existingInvestor] = await db
    .select()
    .from(investorPacketsTable)
    .where(eq(investorPacketsTable.title, 'Angel Round Investor Packet — v1'));
  if (!existingInvestor) {
    const [packet] = await db
      .insert(investorPacketsTable)
      .values({
        title: 'Angel Round Investor Packet — v1',
        investorType: 'angel',
        status: 'drafting',
        completionPct: 0,
        notes:
          'Initial angel round investor packet. Template structure seeded — fill in actual data as available.',
      })
      .returning();

    for (const d of INVESTOR_DELIVERABLES) {
      await db.insert(investorPacketDeliverables).values({
        packetId: packet.id,
        deliverableKey: d.deliverableKey,
        title: d.title,
        description: d.description,
        status: 'not_started',
        version: 1,
        sortOrder: d.sortOrder,
      });
    }
    console.log(`Created investor packet with ${INVESTOR_DELIVERABLES.length} deliverables`);
  } else {
    console.log('Investor packet already exists');
  }
}

async function seedDiligenceChecklists() {
  const [existing] = await db
    .select()
    .from(diligenceChecklistsTable)
    .where(eq(diligenceChecklistsTable.title, 'Lender Diligence Checklist — Standard'));
  if (!existing) {
    const [checklist] = await db
      .insert(diligenceChecklistsTable)
      .values({
        title: 'Lender Diligence Checklist — Standard',
        checklistType: 'lender',
        packetType: 'lender',
        status: 'active',
        completionPct: 0,
      })
      .returning();

    const lenderItems = [
      {
        itemKey: '3yr_tax_returns',
        title: '3 Years Business Tax Returns',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: '2yr_personal_returns',
        title: '2 Years Personal Tax Returns (all owners 20%+)',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'ytd_financials',
        title: 'YTD Financial Statements',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'balance_sheet',
        title: 'Current Balance Sheet',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'debt_schedule',
        title: 'Existing Debt Schedule',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'articles_incorporation',
        title: 'Articles of Incorporation / Organization',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'operating_agreement_bylaws',
        title: 'Operating Agreement or Bylaws',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'ein_verification',
        title: 'EIN Verification Letter (IRS CP-575)',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'business_license',
        title: 'Business License(s)',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'owner_id',
        title: 'Government-Issued Photo ID (all owners 20%+)',
        category: 'Identity',
        isRequired: true,
      },
      {
        itemKey: 'owner_resume',
        title: 'Owner Resume / Professional Background',
        category: 'Background',
        isRequired: false,
      },
      {
        itemKey: 'business_plan_doc',
        title: 'Business Plan Document',
        category: 'Plan',
        isRequired: true,
      },
    ];

    for (let i = 0; i < lenderItems.length; i++) {
      await db.insert(diligenceChecklistItemsTable).values({
        checklistId: checklist.id,
        itemKey: lenderItems[i].itemKey,
        title: lenderItems[i].title,
        category: lenderItems[i].category,
        isRequired: lenderItems[i].isRequired,
        status: 'not_started',
        sortOrder: i,
      });
    }
    console.log(`Created lender diligence checklist with ${lenderItems.length} items`);
  } else {
    console.log('Lender diligence checklist already exists');
  }

  const [existingInv] = await db
    .select()
    .from(diligenceChecklistsTable)
    .where(eq(diligenceChecklistsTable.title, 'Investor Data Room Checklist — Standard'));
  if (!existingInv) {
    const [checklist] = await db
      .insert(diligenceChecklistsTable)
      .values({
        title: 'Investor Data Room Checklist — Standard',
        checklistType: 'data_room',
        packetType: 'investor',
        status: 'active',
        completionPct: 0,
      })
      .returning();

    const investorItems = [
      {
        itemKey: 'corp_docs',
        title: 'Corporate Formation Documents',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'cap_table_current',
        title: 'Current Cap Table',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'ip_summary',
        title: 'IP Summary / Patent Filings',
        category: 'IP',
        isRequired: false,
      },
      {
        itemKey: 'product_screenshots',
        title: 'Product Screenshots / Demo Access',
        category: 'Product',
        isRequired: true,
      },
      {
        itemKey: 'financials_hist',
        title: 'Historical Financial Statements',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'financial_projections',
        title: 'Financial Projections (3-year)',
        category: 'Financial',
        isRequired: true,
      },
      {
        itemKey: 'customer_list',
        title: 'Customer List / Reference Contacts',
        category: 'Traction',
        isRequired: false,
      },
      {
        itemKey: 'contracts',
        title: 'Key Customer / Partner Contracts',
        category: 'Legal',
        isRequired: true,
      },
      {
        itemKey: 'team_bios',
        title: 'Team Bios / LinkedIn Profiles',
        category: 'Team',
        isRequired: true,
      },
      {
        itemKey: 'market_analysis',
        title: 'Market Size Analysis / TAM-SAM-SOM',
        category: 'Market',
        isRequired: false,
      },
    ];

    for (let i = 0; i < investorItems.length; i++) {
      await db.insert(diligenceChecklistItemsTable).values({
        checklistId: checklist.id,
        itemKey: investorItems[i].itemKey,
        title: investorItems[i].title,
        category: investorItems[i].category,
        isRequired: investorItems[i].isRequired,
        status: 'not_started',
        sortOrder: i,
      });
    }
    console.log(`Created investor data room checklist with ${investorItems.length} items`);
  } else {
    console.log('Investor data room checklist already exists');
  }
}

async function main() {
  console.log('Seeding capital & certification data...');
  await upsertFlag(
    'capital_readiness_os_enabled',
    'Capital Readiness OS',
    'Enables the Capital Readiness module for bank/angel packet building and diligence tracking.',
  );
  await upsertFlag(
    'certification_os_enabled',
    'Certification OS',
    'Enables the Certification & Procurement Readiness module.',
  );
  await seedCertPrograms();
  await seedCapitalPackets();
  await seedDiligenceChecklists();
  console.log('Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
