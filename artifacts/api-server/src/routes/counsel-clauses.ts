import {
  db,
  counselClausesTable,
  counselPlaybookRulesTable,
  counselDraftSessionsTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendForbidden, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';

const router: IRouter = Router();

function getOrgId(req: Request): string | null {
  const orgId = req.user?.orgs?.[0]?.orgId;
  if (orgId != null) return String(orgId);
  return null;
}

function requireOrgId(req: Request, res: Response): string | null {
  const orgId = getOrgId(req);
  if (!orgId) {
    sendForbidden(res, 'Organization membership required to access Clause Genome');
    return null;
  }
  return orgId;
}

const CLAUSE_TAXONOMY: Record<string, { label: string; types: string[]; description: string }> = {
  indemnification: {
    label: 'Indemnification',
    types: ['broad_form', 'limited_form', 'mutual', 'cross_indemnity'],
    description: 'Clauses allocating risk of loss between contracting parties',
  },
  limitation_of_liability: {
    label: 'Limitation of Liability',
    types: ['cap', 'exclusion', 'waiver_of_consequential', 'aggregate'],
    description: 'Clauses bounding maximum recoverable damages',
  },
  ip_ownership: {
    label: 'Intellectual Property',
    types: ['assignment', 'license', 'work_for_hire', 'retained_rights'],
    description: 'Clauses governing ownership and use of intellectual property',
  },
  confidentiality: {
    label: 'Confidentiality & NDA',
    types: ['mutual_nda', 'one_way_nda', 'trade_secret', 'return_of_materials'],
    description: 'Clauses protecting non-public information',
  },
  termination: {
    label: 'Termination',
    types: ['for_cause', 'for_convenience', 'automatic', 'cure_period'],
    description: 'Clauses governing contract termination rights',
  },
  dispute_resolution: {
    label: 'Dispute Resolution',
    types: ['arbitration', 'mediation', 'litigation', 'forum_selection', 'governing_law'],
    description: 'Clauses establishing how disputes will be resolved',
  },
  representations_warranties: {
    label: 'Representations & Warranties',
    types: ['seller_reps', 'buyer_reps', 'title', 'authority', 'no_litigation'],
    description: 'Factual statements and assurances made by parties',
  },
  force_majeure: {
    label: 'Force Majeure',
    types: ['broad', 'narrow', 'pandemic', 'regulatory_change'],
    description: 'Clauses excusing performance due to extraordinary events',
  },
  payment: {
    label: 'Payment & Fees',
    types: ['milestones', 'net_terms', 'late_fees', 'audit_rights'],
    description: 'Clauses governing payment obligations and timing',
  },
  assignment: {
    label: 'Assignment',
    types: ['anti_assignment', 'consent_required', 'change_of_control', 'permitted_successors'],
    description: 'Clauses restricting or permitting transfer of rights',
  },
};

const SEED_CLAUSES = [
  {
    clauseType: 'indemnification',
    category: 'Risk Allocation',
    title: 'Broad-Form Mutual Indemnification — Greenfield v. Apex',
    text: "Each Party (\"Indemnifying Party\") shall defend, indemnify and hold harmless the other Party and its affiliates, officers, directors, employees and agents from and against any and all losses, damages, liabilities, costs and expenses (including reasonable attorneys' fees) arising out of or related to any third-party claim resulting from: (i) any material breach of this Agreement by the Indemnifying Party; (ii) the gross negligence or wilful misconduct of the Indemnifying Party; or (iii) any infringement or alleged infringement of any intellectual property right by the Indemnifying Party.",
    matterName: 'Greenfield v. Apex',
    matterId: 'matter-001',
    documentRef: 'Settlement Agreement §12.1 (2024-03-15)',
    jurisdiction: 'New York',
    riskScore: 0.42,
    riskTags: ['mutual_exposure', 'ip_carveout', 'attorney_fee_shifting'],
    taxonomyTags: ['indemnification', 'broad_form', 'mutual'],
  },
  {
    clauseType: 'limitation_of_liability',
    category: 'Risk Allocation',
    title: 'Aggregate Cap + Consequential Exclusion — TechCo IP Matter',
    text: "NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT, IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE OR CONSEQUENTIAL DAMAGES. IN NO EVENT SHALL EITHER PARTY'S TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM AND (B) ONE HUNDRED THOUSAND DOLLARS ($100,000).",
    matterName: 'TechCo IP Dispute',
    matterId: 'matter-002',
    documentRef: 'Software License Agreement §15.3 (2023-11-20)',
    jurisdiction: 'Delaware',
    riskScore: 0.65,
    riskTags: ['cap_exposure', 'consequential_exclusion', 'high_value_contract'],
    taxonomyTags: ['limitation_of_liability', 'cap', 'exclusion', 'waiver_of_consequential'],
  },
  {
    clauseType: 'confidentiality',
    category: 'Information Protection',
    title: 'Mutual NDA — 5-Year Term — 2024-SEC-441',
    text: 'Each party agrees to hold in strict confidence and not to disclose to any third party any Confidential Information of the other party without the prior written consent of the disclosing party, except as required by applicable law, regulation or court order. "Confidential Information" means any information disclosed by one party to the other party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure. The obligations of confidentiality shall survive termination of this Agreement for a period of five (5) years.',
    matterName: '2024-SEC-441 (Securities Investigation)',
    matterId: 'matter-003',
    documentRef: 'Cooperation Agreement §4 (2024-08-01)',
    jurisdiction: 'Federal — SDNY',
    riskScore: 0.71,
    riskTags: ['sec_matter', 'regulatory_disclosure_risk', 'long_tail'],
    taxonomyTags: ['confidentiality', 'mutual_nda', 'trade_secret'],
  },
  {
    clauseType: 'ip_ownership',
    category: 'Intellectual Property',
    title: 'Work-for-Hire + IP Assignment — TechCo IP Matter',
    text: 'All deliverables, inventions, discoveries, improvements, works of authorship, and other intellectual property conceived, developed or reduced to practice by Contractor in the performance of Services under this Agreement (collectively, "Work Product") shall be deemed works made for hire. To the extent any Work Product does not qualify as a work made for hire, Contractor hereby irrevocably assigns to Company all right, title and interest in and to such Work Product, including all patent, copyright, trade secret and other intellectual property rights therein.',
    matterName: 'TechCo IP Dispute',
    matterId: 'matter-002',
    documentRef: 'Consulting Agreement §8.1 (2023-06-10)',
    jurisdiction: 'Delaware',
    riskScore: 0.58,
    riskTags: ['ownership_dispute', 'contractor_assignment', 'legacy_ip'],
    taxonomyTags: ['ip_ownership', 'assignment', 'work_for_hire'],
  },
  {
    clauseType: 'termination',
    category: 'Contract Lifecycle',
    title: 'For-Cause Termination with 30-Day Cure — Greenfield v. Apex',
    text: 'Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and such breach remains uncured for thirty (30) days after written notice of such breach is delivered to the breaching party. In addition, either party may terminate this Agreement immediately upon written notice if the other party: (i) becomes insolvent; (ii) makes an assignment for the benefit of creditors; or (iii) becomes subject to any voluntary or involuntary proceeding under any bankruptcy or insolvency law.',
    matterName: 'Greenfield v. Apex',
    matterId: 'matter-001',
    documentRef: 'Master Services Agreement §9.2 (2023-12-01)',
    jurisdiction: 'New York',
    riskScore: 0.38,
    riskTags: ['cure_period', 'insolvency_trigger'],
    taxonomyTags: ['termination', 'for_cause', 'cure_period'],
  },
  {
    clauseType: 'dispute_resolution',
    category: 'Dispute Resolution',
    title: 'Binding AAA Arbitration — 2024-SEC-441',
    text: 'Any dispute, controversy or claim arising out of or relating to this Agreement, or the breach, termination or invalidity thereof, shall be settled by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The place of arbitration shall be New York, New York. The arbitration shall be conducted by a single arbitrator mutually agreed upon by the parties. The award of the arbitrator shall be final and binding upon the parties and judgment upon such award may be entered in any court having jurisdiction thereof.',
    matterName: '2024-SEC-441 (Securities Investigation)',
    matterId: 'matter-003',
    documentRef: 'Settlement Agreement §18 (2024-08-01)',
    jurisdiction: 'Federal — SDNY',
    riskScore: 0.44,
    riskTags: ['arbitration', 'aaa', 'new_york_seat'],
    taxonomyTags: ['dispute_resolution', 'arbitration', 'governing_law'],
  },
  {
    clauseType: 'representations_warranties',
    category: 'Representations & Warranties',
    title: 'No-Litigation Representation — Apex Acquisition',
    text: 'The Company represents and warrants to Buyer that, as of the Closing Date, there is no pending or, to the Knowledge of the Company, threatened action, suit, proceeding, inquiry or investigation by or before any Governmental Authority that relates to the Company or any of its subsidiaries or that challenges or seeks to prevent, enjoin, alter or materially delay any of the transactions contemplated by this Agreement. There is no outstanding order, judgment or decree of any Governmental Authority against or affecting the Company or any of its subsidiaries.',
    matterName: 'Apex Acquisition',
    matterId: 'matter-004',
    documentRef: 'Share Purchase Agreement §3.14 (2024-05-20)',
    jurisdiction: 'Delaware',
    riskScore: 0.81,
    riskTags: ['pending_litigation', 'disclosure_risk', 'acquisition_risk', 'high_materiality'],
    taxonomyTags: ['representations_warranties', 'no_litigation', 'seller_reps'],
  },
  {
    clauseType: 'force_majeure',
    category: 'Risk Allocation',
    title: 'Broad Force Majeure with Regulatory Carveout',
    text: "Neither party shall be liable for any failure or delay in performance of its obligations under this Agreement if and to the extent such failure or delay is caused by circumstances beyond such party's reasonable control, including but not limited to acts of God, natural disasters, epidemics, pandemics, terrorist attacks, civil unrest, government sanctions, regulatory actions or changes in law. The party claiming force majeure shall provide prompt written notice to the other party and shall use commercially reasonable efforts to mitigate the effects of such event. If a force majeure event continues for more than sixty (60) days, either party may terminate this Agreement upon thirty (30) days' written notice.",
    matterName: 'TechCo IP Dispute',
    matterId: 'matter-002',
    documentRef: 'Supply Agreement §14 (2023-08-15)',
    jurisdiction: 'Delaware',
    riskScore: 0.31,
    riskTags: ['regulatory_carveout', 'pandemic', 'termination_right'],
    taxonomyTags: ['force_majeure', 'broad', 'regulatory_change'],
  },
];

const SEED_PLAYBOOK_RULES = [
  {
    clauseType: 'indemnification',
    ruleName: 'Cap Indemnification at 2x Contract Value',
    description: 'Firm standard requires indemnification obligations to be capped at 2x total contract value unless senior partner approves exception.',
    requiredLanguage: 'shall not exceed two times (2x) the total fees paid',
    prohibitedTerms: ['unlimited indemnification', 'uncapped', 'without limitation'],
    riskThreshold: 0.7,
    severity: 'high' as const,
  },
  {
    clauseType: 'limitation_of_liability',
    ruleName: 'Mutual Cap Required',
    description: 'Liability caps must be mutual — any one-sided cap will be flagged for partner review.',
    requiredLanguage: 'neither party shall be liable',
    prohibitedTerms: ['only company shall be liable', 'customer liability is unlimited'],
    riskThreshold: 0.6,
    severity: 'high' as const,
  },
  {
    clauseType: 'ip_ownership',
    ruleName: 'Retain Background IP Rights',
    description: 'Firm requires that all assignments explicitly carve out pre-existing background IP.',
    requiredLanguage: 'excluding any pre-existing intellectual property',
    prohibitedTerms: ['all intellectual property including pre-existing', 'any and all rights without exception'],
    riskThreshold: 0.65,
    severity: 'critical' as const,
  },
  {
    clauseType: 'confidentiality',
    ruleName: 'Maximum 5-Year NDA Term',
    description: 'Firm policy caps NDA obligations at 5 years post-termination for trade secret matters.',
    requiredLanguage: 'period of five (5) years',
    prohibitedTerms: ['in perpetuity', 'forever', 'indefinitely', 'without limitation in time'],
    riskThreshold: 0.5,
    severity: 'medium' as const,
  },
  {
    clauseType: 'termination',
    ruleName: 'Minimum 30-Day Cure Period',
    description: 'All for-cause termination clauses must provide at least a 30-day cure period.',
    requiredLanguage: 'thirty (30) days',
    prohibitedTerms: ['immediately without cure', 'without notice or cure'],
    riskThreshold: 0.55,
    severity: 'medium' as const,
  },
  {
    clauseType: 'dispute_resolution',
    ruleName: 'AAA or JAMS Arbitration Preferred',
    description: 'Firm prefers AAA or JAMS arbitration over ad-hoc arbitration for all matters above $500k.',
    requiredLanguage: 'American Arbitration Association',
    prohibitedTerms: ['ad-hoc arbitration', 'arbitrator appointed solely by'],
    riskThreshold: 0.45,
    severity: 'low' as const,
  },
  {
    clauseType: 'representations_warranties',
    ruleName: 'Knowledge Qualifier Required for Seller Reps',
    description: 'All seller representations must include a "to the knowledge of" qualifier to limit exposure.',
    requiredLanguage: 'to the Knowledge of the Company',
    prohibitedTerms: ['represents absolutely', 'represents and warrants without qualification'],
    riskThreshold: 0.75,
    severity: 'critical' as const,
  },
];

function buildConfidenceBand(riskScore: number) {
  const base = Math.max(0.55, 1 - riskScore * 0.6);
  return {
    lower: parseFloat((base - 0.08).toFixed(2)),
    point: parseFloat(base.toFixed(2)),
    upper: parseFloat((base + 0.08).toFixed(2)),
    label: base > 0.82 ? 'High' : base > 0.65 ? 'Moderate' : 'Low',
  };
}

function buildProvenanceEnvelope(clauseType: string, citationCount: number, corpusSize: number) {
  return {
    generatedAt: new Date().toISOString(),
    model: 'counsel-drafting-agent-v1',
    retrievalMethod: 'semantic-corpus-search',
    clauseType,
    citationCount,
    corpusSize,
    policyVerdict: 'requires_review',
    confidenceNote: 'Draft anchored to firm precedent corpus. Review before execution.',
  };
}

function buildRiskDiff(
  draftText: string,
  rules: Array<{
    id?: number;
    clauseType: string;
    ruleName: string;
    severity: string;
    requiredLanguage?: string | null;
    prohibitedTerms: unknown;
  }>,
) {
  const findings: { ruleId: string; ruleName: string; severity: string; finding: string; flagged: boolean }[] = [];
  for (const rule of rules) {
    const prohibited = (rule.prohibitedTerms as string[]).filter((t) =>
      draftText.toLowerCase().includes(t.toLowerCase()),
    );
    const hasRequired = rule.requiredLanguage
      ? draftText.toLowerCase().includes(rule.requiredLanguage.toLowerCase())
      : true;
    if (prohibited.length > 0 || !hasRequired) {
      findings.push({
        ruleId: String(rule.id ?? rule.clauseType),
        ruleName: rule.ruleName,
        severity: rule.severity,
        finding: prohibited.length > 0
          ? `Prohibited language detected: "${prohibited[0]}"`
          : `Required playbook language not present: "${rule.requiredLanguage}"`,
        flagged: true,
      });
    } else {
      findings.push({
        ruleId: String(rule.id ?? rule.clauseType),
        ruleName: rule.ruleName,
        severity: rule.severity,
        finding: 'Compliant with playbook standard',
        flagged: false,
      });
    }
  }
  const flagged = findings.filter((f) => f.flagged);
  return {
    overallCompliance: flagged.length === 0 ? 'compliant' : flagged.some((f) => f.severity === 'critical') ? 'critical_drift' : 'drift_detected',
    flaggedCount: flagged.length,
    totalRulesChecked: findings.length,
    findings,
  };
}

async function ensureOrgClauseCorpus(orgId: number): Promise<void> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(counselClausesTable)
    .where(eq(counselClausesTable.orgId, orgId));
  if ((row?.count ?? 0) > 0) return;

  for (const seed of SEED_CLAUSES) {
    await db.insert(counselClausesTable).values({
      orgId,
      clauseType: seed.clauseType,
      category: seed.category,
      title: seed.title,
      text: seed.text,
      matterId: seed.matterId,
      matterName: seed.matterName,
      documentRef: seed.documentRef,
      jurisdiction: seed.jurisdiction,
      riskScore: seed.riskScore,
      riskTags: seed.riskTags,
      taxonomyTags: seed.taxonomyTags,
      provenanceEnvelope: {
        source: seed.documentRef,
        matter: seed.matterName,
        extractedAt: '2024-09-01T00:00:00Z',
        model: 'counsel-extractor-v1',
      },
      confidenceBand: buildConfidenceBand(seed.riskScore),
    });
  }
}

async function ensureOrgPlaybookRules(orgId: number): Promise<void> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(counselPlaybookRulesTable)
    .where(eq(counselPlaybookRulesTable.orgId, orgId));
  if ((row?.count ?? 0) > 0) return;

  for (const rule of SEED_PLAYBOOK_RULES) {
    await db.insert(counselPlaybookRulesTable).values({
      orgId,
      clauseType: rule.clauseType,
      ruleName: rule.ruleName,
      description: rule.description,
      requiredLanguage: rule.requiredLanguage,
      prohibitedTerms: rule.prohibitedTerms,
      riskThreshold: rule.riskThreshold,
      severity: rule.severity,
    });
  }
}

function formatClause(c: typeof counselClausesTable.$inferSelect) {
  return {
    id: `clause-${c.id}`,
    dbId: c.id,
    clauseType: c.clauseType,
    category: c.category,
    title: c.title,
    text: c.text,
    matterId: c.matterId,
    matterName: c.matterName,
    documentRef: c.documentRef,
    jurisdiction: c.jurisdiction,
    riskScore: c.riskScore,
    riskTags: c.riskTags as string[],
    taxonomyTags: c.taxonomyTags as string[],
    confidenceBand: (c.confidenceBand as ReturnType<typeof buildConfidenceBand>) ?? buildConfidenceBand(c.riskScore),
    provenanceEnvelope: c.provenanceEnvelope ?? {
      source: c.documentRef,
      matter: c.matterName,
      extractedAt: c.createdAt.toISOString(),
      model: 'counsel-extractor-v1',
    },
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get('/counsel/clauses/taxonomy', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    await ensureOrgClauseCorpus(orgIdInt);

    const rows = await db
      .select({ clauseType: counselClausesTable.clauseType })
      .from(counselClausesTable)
      .where(eq(counselClausesTable.orgId, orgIdInt));

    const countByType = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.clauseType] = (acc[r.clauseType] ?? 0) + 1;
      return acc;
    }, {});

    const taxonomy = Object.entries(CLAUSE_TAXONOMY).map(([key, val]) => ({
      id: key,
      ...val,
      clauseCount: countByType[key] ?? 0,
    }));

    sendSuccess(res, { taxonomy, total: taxonomy.length });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.taxonomy');
  }
});

router.get('/counsel/clauses/clauses', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    await ensureOrgClauseCorpus(orgIdInt);

    const { clauseType, matterId, minRisk, maxRisk } = req.query as Record<string, string>;

    const conditions = [eq(counselClausesTable.orgId, orgIdInt)];
    if (clauseType) conditions.push(eq(counselClausesTable.clauseType, clauseType));
    if (matterId) conditions.push(eq(counselClausesTable.matterId, matterId));
    if (minRisk) conditions.push(gte(counselClausesTable.riskScore, parseFloat(minRisk)));
    if (maxRisk) conditions.push(lte(counselClausesTable.riskScore, parseFloat(maxRisk)));

    const rows = await db
      .select()
      .from(counselClausesTable)
      .where(and(...conditions))
      .orderBy(desc(counselClausesTable.riskScore));

    sendSuccess(res, {
      clauses: rows.map(formatClause),
      total: rows.length,
      taxonomy: CLAUSE_TAXONOMY,
      provenance: {
        source: 'counsel-clause-genome',
        retrievedAt: new Date().toISOString(),
        corpusVersion: '1.0.0',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.list');
  }
});

router.get('/counsel/clauses/clauses/:id', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    const { id } = req.params;
    const dbId = parseInt(id.replace('clause-', ''), 10);
    if (Number.isNaN(dbId)) return sendBadRequest(res, 'Invalid clause ID');

    const [clause] = await db
      .select()
      .from(counselClausesTable)
      .where(and(eq(counselClausesTable.id, dbId), eq(counselClausesTable.orgId, orgIdInt)));

    if (!clause) return sendNotFound(res, 'Clause');

    const related = await db
      .select()
      .from(counselClausesTable)
      .where(
        and(
          eq(counselClausesTable.orgId, orgIdInt),
          eq(counselClausesTable.clauseType, clause.clauseType),
          sql`${counselClausesTable.id} != ${dbId}`,
        ),
      )
      .limit(5);

    sendSuccess(res, {
      clause: {
        ...formatClause(clause),
        relatedClauses: related.map((r) => ({
          id: `clause-${r.id}`,
          title: r.title,
          matterName: r.matterName,
          documentRef: r.documentRef,
          riskScore: r.riskScore,
        })),
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.get');
  }
});

router.get('/counsel/matters/:matterId/clauses', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    await ensureOrgClauseCorpus(orgIdInt);

    const { matterId } = req.params;
    let rows = await db
      .select()
      .from(counselClausesTable)
      .where(and(eq(counselClausesTable.orgId, orgIdInt), eq(counselClausesTable.matterId, matterId)))
      .orderBy(desc(counselClausesTable.riskScore));

    const matchedMatter = rows.length > 0;
    if (!matchedMatter) {
      rows = await db
        .select()
        .from(counselClausesTable)
        .where(eq(counselClausesTable.orgId, orgIdInt))
        .orderBy(desc(counselClausesTable.riskScore));
    }

    sendSuccess(res, {
      clauses: rows.map(formatClause),
      total: rows.length,
      matterId,
      scope: matchedMatter ? 'matter' : 'corpus',
    });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.by-matter');
  }
});

const draftBodySchema = z.object({
  clauseType: z.string().min(1),
  context: z.string().optional(),
  matterId: z.string().optional(),
  jurisdiction: z.string().optional(),
});

router.post('/counsel/clauses/draft', validateBody(draftBodySchema), async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    const { clauseType, context, matterId } = req.body as z.infer<typeof draftBodySchema>;
    const category = CLAUSE_TAXONOMY[clauseType];
    if (!category) return sendBadRequest(res, `Unknown clause type: ${clauseType}. See /taxonomy.`);

    await ensureOrgClauseCorpus(orgIdInt);

    const [{ corpusTotal }] = await db
      .select({ corpusTotal: count() })
      .from(counselClausesTable)
      .where(eq(counselClausesTable.orgId, orgIdInt));

    const precedents = await db
      .select()
      .from(counselClausesTable)
      .where(and(eq(counselClausesTable.orgId, orgIdInt), eq(counselClausesTable.clauseType, clauseType)))
      .orderBy(asc(counselClausesTable.riskScore))
      .limit(5);

    let draftText: string;
    const citations: Array<{
      matterId: string | null;
      matterName: string | null;
      documentRef: string | null;
      riskScore: number;
      jurisdiction: string | null;
      excerpt: string;
    }> = [];

    if (precedents.length === 0) {
      draftText = `[Draft ${clauseType.replace(/_/g, ' ')} clause — no precedent found in corpus. Provide context and retry.]`;
    } else {
      const primary = precedents[0];
      draftText = context
        ? `${primary.text}\n\n[CONTEXT NOTE: Adapted for ${context}. Validate jurisdiction-specific requirements before execution.]`
        : primary.text;
      for (const p of precedents) {
        citations.push({
          matterId: p.matterId,
          matterName: p.matterName,
          documentRef: p.documentRef,
          riskScore: p.riskScore,
          jurisdiction: p.jurisdiction,
          excerpt: p.text.substring(0, 120) + '…',
        });
      }
    }

    await ensureOrgPlaybookRules(orgIdInt);
    const rules = await db
      .select()
      .from(counselPlaybookRulesTable)
      .where(and(eq(counselPlaybookRulesTable.orgId, orgIdInt), eq(counselPlaybookRulesTable.clauseType, clauseType)));

    const riskDiff = buildRiskDiff(draftText, rules);
    const provenanceEnvelope = buildProvenanceEnvelope(clauseType, citations.length, corpusTotal);
    const avgRisk = citations.length > 0
      ? citations.reduce((a, c) => a + c.riskScore, 0) / citations.length
      : 0.5;
    const confidenceBand = buildConfidenceBand(avgRisk);

    const [session] = await db
      .insert(counselDraftSessionsTable)
      .values({
        orgId: orgIdInt,
        clauseType,
        context: context ?? null,
        matterId: matterId ?? null,
        draftText,
        citations,
        provenanceEnvelope,
        confidenceBand,
        riskDiff,
      })
      .returning({ id: counselDraftSessionsTable.id });

    sendSuccess(res, {
      draft: {
        id: session?.id ?? null,
        clauseType,
        category: category.label,
        text: draftText,
        citations,
        provenanceEnvelope,
        confidenceBand,
        riskDiff,
        matterId: matterId ?? null,
        generatedAt: new Date().toISOString(),
        status: 'draft',
        policyVerdict: 'requires_review',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.draft');
  }
});

router.get('/counsel/clauses/playbook', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    await ensureOrgPlaybookRules(orgIdInt);

    const rules = await db
      .select()
      .from(counselPlaybookRulesTable)
      .where(eq(counselPlaybookRulesTable.orgId, orgIdInt))
      .orderBy(asc(counselPlaybookRulesTable.clauseType));

    sendSuccess(res, {
      playbook: rules.map((r) => ({
        id: r.id,
        clauseType: r.clauseType,
        ruleName: r.ruleName,
        description: r.description,
        requiredLanguage: r.requiredLanguage,
        prohibitedTerms: r.prohibitedTerms as string[],
        riskThreshold: r.riskThreshold,
        severity: r.severity,
        isActive: r.isActive,
      })),
      total: rules.length,
      updatedAt: rules[0]?.updatedAt?.toISOString() ?? new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.playbook');
  }
});

const riskDiffBodySchema = z.object({
  draftText: z.string().min(1),
  clauseType: z.string().optional(),
});

router.post('/counsel/clauses/risk-diff', validateBody(riskDiffBodySchema), async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const orgIdInt = parseInt(orgId, 10);

    const { draftText, clauseType } = req.body as z.infer<typeof riskDiffBodySchema>;

    await ensureOrgPlaybookRules(orgIdInt);

    const baseConditions = [
      eq(counselPlaybookRulesTable.orgId, orgIdInt),
      eq(counselPlaybookRulesTable.isActive, true),
    ] as const;

    const rules = await db
      .select()
      .from(counselPlaybookRulesTable)
      .where(
        clauseType
          ? and(...baseConditions, eq(counselPlaybookRulesTable.clauseType, clauseType))
          : and(...baseConditions),
      );

    if (rules.length === 0) {
      return sendSuccess(res, {
        riskDiff: {
          overallCompliance: 'no_rules',
          flaggedCount: 0,
          totalRulesChecked: 0,
          findings: [],
          note: clauseType
            ? `No playbook rules configured for clause type: ${clauseType}`
            : 'No playbook rules configured for this org.',
        },
        clauseType: clauseType ?? 'all',
        checkedAt: new Date().toISOString(),
      });
    }

    const riskDiff = buildRiskDiff(draftText, rules);
    sendSuccess(res, { riskDiff, clauseType: clauseType ?? 'all', checkedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, 'counsel-clauses.risk-diff');
  }
});

export default router;
