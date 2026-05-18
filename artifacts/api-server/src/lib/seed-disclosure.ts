// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import {
  complianceControlEvidenceTable,
  complianceFrameworkControlsTable,
  db,
  disclosureRecipientsTable,
  disclosureRecordsTable,
  disclosureSubprocessorsTable,
  legalAgreementVersionsTable,
  legalAgreementsTable,
} from '@szl-holdings/db';
import { eq, isNull, sql } from 'drizzle-orm';
import { CONTROL_MAPPINGS } from '../data/compliance-control-mappings.js';

async function countOrgRows(
  table:
    | typeof disclosureRecipientsTable
    | typeof disclosureSubprocessorsTable
    | typeof legalAgreementsTable,
  orgId: number,
): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(table)
    .where(eq(table.orgId as Parameters<typeof eq>[0], orgId));
  return n;
}

async function countGlobalControlRows(): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(complianceFrameworkControlsTable)
    .where(isNull(complianceFrameworkControlsTable.orgId));
  return n;
}

export async function seedDisclosureData(orgId: number): Promise<void> {
  const hasRecipients = (await countOrgRows(disclosureRecipientsTable, orgId)) > 0;
  const hasSubprocessors = (await countOrgRows(disclosureSubprocessorsTable, orgId)) > 0;
  const hasAgreements = (await countOrgRows(legalAgreementsTable, orgId)) > 0;
  const hasControls = (await countGlobalControlRows()) > 0;

  if (!hasRecipients) {
    await db.insert(disclosureRecipientsTable).values([
      {
        orgId,
        recipientId: 'recip-001-anthropic',
        name: 'Anthropic PBC',
        type: 'subprocessor',
        country: 'US',
        legalBasis: 'contract',
        dataCategories: ['prompt_data', 'usage_metadata'],
        purposeDescription: 'Large language model inference for AI-powered features',
        contactEmail: 'privacy@anthropic.com',
        safeguards: 'SOC 2 Type II certified. DPA executed. Data not used for training.',
        isApproved: true,
        approvedAt: new Date('2026-01-15'),
        approvedBy: 'platform-team',
      },
      {
        orgId,
        recipientId: 'recip-002-openai',
        name: 'OpenAI, L.L.C.',
        type: 'subprocessor',
        country: 'US',
        legalBasis: 'contract',
        dataCategories: ['prompt_data', 'usage_metadata'],
        purposeDescription: 'LLM inference for fallback model routing',
        contactEmail: 'privacy@openai.com',
        safeguards: 'SOC 2 Type II. Enterprise DPA. Zero data retention option enabled.',
        isApproved: true,
        approvedAt: new Date('2026-01-15'),
        approvedBy: 'platform-team',
      },
      {
        orgId,
        recipientId: 'recip-003-vercel',
        name: 'Vercel Inc.',
        type: 'subprocessor',
        country: 'US',
        legalBasis: 'contract',
        dataCategories: ['access_logs', 'ip_addresses', 'request_metadata'],
        purposeDescription: 'Edge infrastructure and CDN for web application delivery',
        contactEmail: 'privacy@vercel.com',
        safeguards: 'SOC 2 Type II. Standard DPA via ToS.',
        isApproved: true,
        approvedAt: new Date('2026-01-10'),
        approvedBy: 'platform-team',
      },
      {
        orgId,
        recipientId: 'recip-004-regulators',
        name: 'SEC / FINRA (Regulatory)',
        type: 'regulator',
        country: 'US',
        legalBasis: 'legal_obligation',
        dataCategories: ['financial_records', 'compliance_reports', 'audit_logs'],
        purposeDescription: 'Regulatory reporting and examination under applicable securities law',
        safeguards: 'Statutory disclosure — no contractual safeguards applicable.',
        isApproved: true,
        approvedAt: new Date('2026-01-01'),
        approvedBy: 'general-counsel',
      },
    ]).onConflictDoNothing();
  }

  if (!hasSubprocessors) {
    await db.insert(disclosureSubprocessorsTable).values([
      {
        orgId,
        subprocessorId: 'sp-001-anthropic',
        name: 'Anthropic PBC',
        country: 'United States',
        serviceDescription: 'AI/LLM inference — Claude model family',
        dataCategories: ['prompt_data', 'usage_metadata'],
        dpaReference: 'DPA-ANTHROPIC-2026-001',
        certifications: ['SOC 2 Type II', 'ISO 27001'],
        status: 'active',
      },
      {
        orgId,
        subprocessorId: 'sp-002-openai',
        name: 'OpenAI, L.L.C.',
        country: 'United States',
        serviceDescription: 'AI/LLM inference — GPT-4 model family',
        dataCategories: ['prompt_data', 'usage_metadata'],
        dpaReference: 'DPA-OPENAI-2026-001',
        certifications: ['SOC 2 Type II'],
        status: 'active',
      },
      {
        orgId,
        subprocessorId: 'sp-003-neon',
        name: 'Neon Inc.',
        country: 'United States',
        serviceDescription: 'Serverless PostgreSQL database hosting',
        dataCategories: ['all_platform_data'],
        dpaReference: 'DPA-NEON-2026-001',
        certifications: ['SOC 2 Type II'],
        status: 'active',
      },
      {
        orgId,
        subprocessorId: 'sp-004-sendgrid',
        name: 'Twilio SendGrid',
        country: 'United States',
        serviceDescription: 'Transactional email delivery',
        dataCategories: ['email_addresses', 'notification_content'],
        dpaReference: 'DPA-SENDGRID-2026-001',
        certifications: ['SOC 2 Type II', 'ISO 27001'],
        status: 'active',
      },
    ]).onConflictDoNothing();
  }

  if (!hasAgreements) {
    const now = new Date();
    const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const pastDate = new Date('2025-06-01');

    await db.insert(legalAgreementsTable).values([
      {
        orgId,
        agreementId: 'agr-001-anthropic-dpa',
        agreementType: 'dpa',
        counterpartyName: 'Anthropic PBC',
        counterpartyEmail: 'legal@anthropic.com',
        status: 'active',
        version: '2.1',
        linkedRecipientId: 'recip-001-anthropic',
        effectiveDate: new Date('2026-01-15'),
        expiryDate: oneYear,
        sentAt: new Date('2026-01-10'),
        countersignedAt: new Date('2026-01-15'),
        tags: ['dpa', 'ai-provider', 'active'],
      },
      {
        orgId,
        agreementId: 'agr-002-openai-dpa',
        agreementType: 'dpa',
        counterpartyName: 'OpenAI, L.L.C.',
        counterpartyEmail: 'legal@openai.com',
        status: 'active',
        version: '1.0',
        linkedRecipientId: 'recip-002-openai',
        effectiveDate: new Date('2026-01-15'),
        expiryDate: sixMonths,
        sentAt: new Date('2026-01-12'),
        countersignedAt: new Date('2026-01-15'),
        tags: ['dpa', 'ai-provider', 'active'],
      },
      {
        orgId,
        agreementId: 'agr-003-partner-msa',
        agreementType: 'msa',
        counterpartyName: 'Meridian Analytics Corp.',
        counterpartyEmail: 'legal@meridian-analytics.example',
        status: 'under_review',
        version: '1.0',
        sentAt: new Date('2026-04-01'),
        tags: ['msa', 'partner', 'under-review'],
      },
      {
        orgId,
        agreementId: 'agr-004-expired-nda',
        agreementType: 'nda',
        counterpartyName: 'Apex Consulting LLC',
        counterpartyEmail: 'legal@apex-consulting.example',
        status: 'expired',
        version: '1.0',
        effectiveDate: pastDate,
        expiryDate: new Date('2026-03-01'),
        countersignedAt: pastDate,
        tags: ['nda', 'expired'],
      },
    ]).onConflictDoNothing();

    await db.insert(legalAgreementVersionsTable).values([
      {
        agreementId: 'agr-001-anthropic-dpa',
        orgId,
        version: '1.0',
        changeDescription: 'Initial DPA execution',
        authoredBy: 'general-counsel',
        status: 'superseded',
      },
      {
        agreementId: 'agr-001-anthropic-dpa',
        orgId,
        version: '2.0',
        changeDescription: 'Updated to include CCPA addendum',
        authoredBy: 'general-counsel',
        status: 'superseded',
      },
      {
        agreementId: 'agr-001-anthropic-dpa',
        orgId,
        version: '2.1',
        changeDescription: 'Renewed for 2026. Added EU SCCs annex.',
        authoredBy: 'general-counsel',
        status: 'active',
      },
    ]).onConflictDoNothing();

    await db.insert(disclosureRecordsTable).values([
      {
        orgId,
        disclosureId: 'disc-001-anthropic',
        recipientId: 'recip-001-anthropic',
        agreementId: 'agr-001-anthropic-dpa',
        dataCategories: ['prompt_data', 'usage_metadata'],
        legalBasis: 'contract',
        purposeDescription: 'LLM inference for AI-powered platform features',
        transferMechanism: 'api_integration',
        status: 'active',
        effectiveAt: new Date('2026-01-15'),
        expiresAt: oneYear,
      },
      {
        orgId,
        disclosureId: 'disc-002-openai',
        recipientId: 'recip-002-openai',
        agreementId: 'agr-002-openai-dpa',
        dataCategories: ['prompt_data', 'usage_metadata'],
        legalBasis: 'contract',
        purposeDescription: 'Fallback LLM inference',
        transferMechanism: 'api_integration',
        status: 'active',
        effectiveAt: new Date('2026-01-15'),
        expiresAt: sixMonths,
      },
      {
        orgId,
        disclosureId: 'disc-003-regulator',
        recipientId: 'recip-004-regulators',
        dataCategories: ['financial_records', 'compliance_reports'],
        legalBasis: 'legal_obligation',
        purposeDescription: 'Annual Reg BI compliance filing with FINRA',
        status: 'approved',
        effectiveAt: new Date('2026-01-01'),
      },
    ]).onConflictDoNothing();
  }

  if (!hasControls) {
    const controlValues = CONTROL_MAPPINGS.map((c) => ({
      controlId: c.id,
      orgId: null as number | null,
      framework: c.framework as 'eu-ai-act' | 'nist-ai-rmf' | 'iso-42001' | 'csa-agentic',
      controlRef: c.controlRef,
      controlTitle: c.controlTitle,
      description: c.description,
      a11oyPrimitive: c.a11oyPrimitive,
      evidenceSource: c.evidenceSource,
      freshnessThresholdDays: c.freshnessThresholdDays,
      drilldownType: c.drilldownType as
        | 'proof-ledger'
        | 'mirror-eval'
        | 'behavioral-audit'
        | 'system-card'
        | 'red-team'
        | 'covenant'
        | 'welfare'
        | 'snapshot'
        | 'glasswing'
        | 'cavd',
      drilldownDetail: c.drilldownDetail,
      isActive: true,
    }));

    await db.insert(complianceFrameworkControlsTable).values(controlValues).onConflictDoNothing();

    const evidenceValues = CONTROL_MAPPINGS.map((c) => ({
      controlId: c.id,
      orgId: null as number | null,
      evidenceStatus: c.evidenceStatus as 'fresh' | 'stale' | 'gap',
      lastEvidenceAt: new Date(c.lastEvidenceAt),
      lastAssessedAt: new Date(c.lastEvidenceAt),
      isStale: c.evidenceStatus === 'stale',
    }));

    await db.insert(complianceControlEvidenceTable).values(evidenceValues).onConflictDoNothing();
  }
}
