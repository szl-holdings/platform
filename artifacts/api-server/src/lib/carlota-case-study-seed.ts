/**
 * Carlota Jo Case Study Seed
 *
 * Seeds the "Mid-market SaaS competitor encroachment, Q3 2026" named case study
 * scenario so the end-to-end journey from /consulting-os → /competitive-radar →
 * /strategic-diagnostic → /concierge → /pulse lights up with coherent,
 * live + cached data and a single A11oy deep-link.
 *
 * The scenario is seeded only once (idempotent) and tagged with the case study
 * slug so the front-end can surface it via the `/carlota/case-study/saas-encroachment-q3-2026`
 * endpoint.
 */

import { db, carlotaScenariosTable, carlotaDiagnosticsTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

const CASE_STUDY_LABEL = 'Mid-market SaaS competitor encroachment, Q3 2026';
const CASE_STUDY_SLUG  = 'saas-encroachment-q3-2026';
const A11OY_DEEP_LINK  = '/carlota-jo/consulting-os?scenario=saas-encroachment-q3-2026&ref=a11oy';

export const CASE_STUDY_SCENARIO = {
  label: CASE_STUDY_LABEL,
  slug: CASE_STUDY_SLUG,
  a11oyDeepLink: A11OY_DEEP_LINK,
  details:
    'A mid-market SaaS company operating in the professional-services enablement space ' +
    'is facing aggressive encroachment from two well-funded competitors who have ' +
    'shipped adjacent features and are actively targeting the same ICP. ' +
    'Q3 2026 strategic window: 90 days to reposition or risk material ARR churn.',
  competitors: ['Salesforce Professional Services', 'HubSpot Consulting Hub', 'Gainsight'],
  industries: ['SaaS', 'Professional Services', 'B2B Software'],
  horizon: '90 days',
  journeySteps: [
    { step: 1, page: '/consulting-os',      label: 'Consulting OS',        description: 'Surface intelligence and roadmap on the OS dashboard' },
    { step: 2, page: '/competitive-radar',  label: 'Competitive Radar',    description: 'View live competitor signals from Wayback CDX, GDELT, hiring boards' },
    { step: 3, page: '/strategic-diagnostic', label: 'Strategic Diagnostic', description: 'Run full diagnostic intake for the encroachment scenario' },
    { step: 4, page: '/concierge',          label: 'Concierge',            description: 'Review per-client anomaly digest and escalation recommendations' },
    { step: 5, page: '/pulse',              label: 'Advisory Pulse',       description: 'Executive brief with live metrics and engagement trajectory' },
  ],
};

export const CASE_STUDY_DIAGNOSTIC = {
  companyName: 'Meridian Cloud Services',
  industry: 'SaaS / Professional Services Enablement',
  stage: 'growth',
  primaryMarket: 'Mid-market B2B (50–500 seat accounts)',
  topCompetitors: 'Salesforce Professional Services, HubSpot Consulting Hub, Gainsight',
  horizon: '90 days',
  report: {
    executiveSummary:
      'Meridian Cloud Services faces a 90-day inflection point as Salesforce and HubSpot ' +
      'ship overlapping features targeting the same mid-market ICP. The Q3 window demands ' +
      'a deliberate repositioning — leaning into Meridian\'s depth of professional-services ' +
      'domain expertise and multi-vendor workflow orchestration, which neither incumbent ' +
      'replicates at the same fidelity.',
    marketPosition: {
      score: 63,
      summary:
        'Meridian holds a defensible position in professional-services enablement but ' +
        'faces share compression as incumbents close the feature gap. Differentiation on ' +
        'depth-of-domain and workflow orchestration must be operationalised now.',
      strengths: [
        'Deep domain expertise in professional-services workflows not replicated by CRM platforms',
        'Established multi-vendor orchestration connectors (NetSuite, Clio, Procore) — 18-month moat',
        'NPS 82 — significantly above SaaS category median (41)',
      ],
      gaps: [
        'Brand recognition below both primary competitors in sub-500 seat segment',
        'Product surface area narrower than Salesforce platform — prospect comparison disadvantage',
        'Field sales coverage thin in key geographies (DACH, ANZ)',
      ],
    },
    competitiveLandscape: {
      dynamics:
        'Salesforce Professional Services and HubSpot Consulting Hub are both shipping ' +
        'Q3 features that overlap with Meridian\'s core offering. Gainsight is converging ' +
        'from the CS side. The window to establish category leadership is 60–90 days.',
      threats: [
        'Salesforce Q3 release: Professional Services Accelerator — direct feature overlap on project tracking',
        'HubSpot Consulting Hub expansion to 50-seat tier — price undercut risk on entry deals',
        'Gainsight roadmap: CS Workflow Builder entering the professional-services orchestration space',
      ],
      whitespace: [
        'Multi-vendor workflow orchestration for firms using 4+ SaaS platforms — no incumbent owns this',
        'AI-augmented engagement delivery QA — differentiated, high-value, not yet commoditised',
        'Vertical depth: legal, architecture, accounting — professional-services verticals where Salesforce is shallow',
      ],
    },
    growthOpportunities: {
      primary:
        'Double down on multi-vendor orchestration positioning — no incumbent replicates the depth. ' +
        'Ship the "Meridian Universal Connector" story as a differentiated wedge into existing accounts.',
      secondary:
        'Launch a professional-services vertical specialisation program (legal, architecture, accounting) ' +
        'to establish premium pricing power and category definition before incumbents catch up.',
      adjacent:
        'Build a channel program targeting boutique consulting practices (≤ 50 consultants) — they use ' +
        'Meridian-compatible tools and lack budget for Salesforce; high-velocity land-and-expand potential.',
      timeframe: '90 days',
    },
    riskRegister: {
      critical: [
        'Salesforce Q3 ship closes 40% of Meridian\'s feature differentiation gap — reposition required within 60 days',
        'Three top-20 accounts on renewal in Q3 — combined ARR concentration risk of 31%',
      ],
      moderate: [
        'HubSpot sub-50-seat tier pricing undercuts Meridian entry-level deals by ~35%',
        'Engineering roadmap over-stretched — Q3 features competing with the connector investment',
        'CS team thin: 3 CSMs covering 87 growth-tier accounts — churn risk if competitor reps circle',
      ],
      watch: [
        'Gainsight CS Workflow Builder entering orchestration space — monitor; not a threat before Q1 2027',
        'Regulatory: EU AI Act applicability to AI-augmented service delivery — compliance review needed',
      ],
    },
    mlForecasts: {
      strategicMoveForecast: {
        competitor: 'Salesforce Professional Services',
        probability: 0.76,
        predictedAction: 'Professional Services Accelerator general availability + pricing update',
        horizon: '60 days',
        calibration: 'isotonic',
        topFeatures: [
          { feature: 'productPageAdditions', contribution: 0.31 },
          { feature: 'hiringVelocity30d', contribution: 0.24 },
          { feature: 'websiteChangeDeltaScore', contribution: 0.21 },
        ],
      },
      engagementRoadmapKPI: {
        milestones: [
          { name: 'Connector Differentiation Messaging Live', forecastDays: 21, p10: 14, p90: 30 },
          { name: 'Vertical Specialisation Program Launched', forecastDays: 60, p10: 45, p90: 75 },
          { name: 'Net ARR Stabilised (encroachment arrested)', forecastDays: 90, p10: 75, p90: 110 },
        ],
        kpiTarget: 'Q3 ARR churn rate < 4.5%',
        predictedOutcomeScore: 74,
      },
    },
  },
};

let caseStudySeeded = false;

export async function ensureCaseStudySeeded(): Promise<{ seeded: boolean; diagnosticId?: string }> {
  if (caseStudySeeded) return { seeded: false };

  try {
    // Check if scenario already seeded
    const existing = await db
      .select({ id: carlotaScenariosTable.id })
      .from(carlotaScenariosTable)
      .where(eq(carlotaScenariosTable.label, CASE_STUDY_LABEL))
      .limit(1);

    if (existing.length > 0) {
      caseStudySeeded = true;
      return { seeded: false };
    }

    // Seed scenario
    await db.insert(carlotaScenariosTable).values({
      externalId: `sc-case-study-${CASE_STUDY_SLUG}`,
      organizationId: null,
      clientAccountId: null,
      createdByUserId: 1,
      label: CASE_STUDY_LABEL,
      details: CASE_STUDY_SCENARIO.details,
      context: {
        slug: CASE_STUDY_SLUG,
        a11oyDeepLink: A11OY_DEEP_LINK,
        competitors: CASE_STUDY_SCENARIO.competitors,
        journeySteps: CASE_STUDY_SCENARIO.journeySteps,
        isCaseStudy: true,
      },
      result: CASE_STUDY_DIAGNOSTIC.report,
    }).onConflictDoNothing();

    // Seed diagnostic
    const [diagRow] = await db.insert(carlotaDiagnosticsTable).values({
      externalId: `dx-case-study-${CASE_STUDY_SLUG}`,
      organizationId: null,
      clientAccountId: null,
      createdByUserId: 1,
      companyName: CASE_STUDY_DIAGNOSTIC.companyName,
      industry: CASE_STUDY_DIAGNOSTIC.industry,
      stage: CASE_STUDY_DIAGNOSTIC.stage,
      report: CASE_STUDY_DIAGNOSTIC.report as Record<string, unknown>,
    }).onConflictDoNothing().returning();

    caseStudySeeded = true;
    logger.info({ slug: CASE_STUDY_SLUG }, '[carlota-case-study] Case study seeded');
    return { seeded: true, diagnosticId: diagRow?.externalId };
  } catch (err) {
    logger.warn({ err }, '[carlota-case-study] Could not seed case study (non-fatal)');
    return { seeded: false };
  }
}

export function getCaseStudyMeta() {
  return {
    slug: CASE_STUDY_SLUG,
    label: CASE_STUDY_LABEL,
    a11oyDeepLink: A11OY_DEEP_LINK,
    journeySteps: CASE_STUDY_SCENARIO.journeySteps,
    competitors: CASE_STUDY_SCENARIO.competitors,
    horizon: CASE_STUDY_SCENARIO.horizon,
    industries: CASE_STUDY_SCENARIO.industries,
  };
}
