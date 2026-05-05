import {
  db,
  disclosureRecipientsTable,
  disclosureRecordsTable,
  legalAgreementsTable,
} from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import type { DisclosureContext } from '../a11oy/runtime/evals/mirror-eval.js';

/**
 * Resolves a DisclosureContext by querying the DB for the actual recipient,
 * record, and agreement state. This allows MirrorEval disclosure_safety scoring
 * to be grounded in persisted registry data rather than caller-provided hints.
 *
 * Returns `undefined` if the recipientId cannot be resolved (non-disclosure action).
 */
export async function resolveDisclosureContext(
  recipientId: string,
  orgId: number,
  agreementId?: string,
): Promise<DisclosureContext | undefined> {
  const [recipient] = await db
    .select({
      isApproved: disclosureRecipientsTable.isApproved,
      legalBasis: disclosureRecipientsTable.legalBasis,
    })
    .from(disclosureRecipientsTable)
    .where(
      and(
        eq(disclosureRecipientsTable.recipientId, recipientId),
        eq(disclosureRecipientsTable.orgId, orgId),
      ),
    )
    .limit(1);

  if (!recipient) return undefined;

  let agreementActive = false;
  if (agreementId) {
    const [agreement] = await db
      .select({ status: legalAgreementsTable.status })
      .from(legalAgreementsTable)
      .where(
        and(
          eq(legalAgreementsTable.agreementId, agreementId),
          eq(legalAgreementsTable.orgId, orgId),
        ),
      )
      .limit(1);
    agreementActive = agreement?.status === 'active' || agreement?.status === 'countersigned';
  } else {
    // Check if any active agreement references this recipient.
    const [linked] = await db
      .select({ agreementId: disclosureRecordsTable.agreementId })
      .from(disclosureRecordsTable)
      .where(
        and(
          eq(disclosureRecordsTable.recipientId, recipientId),
          eq(disclosureRecordsTable.orgId, orgId),
        ),
      )
      .limit(1);

    if (linked?.agreementId) {
      const [agreement] = await db
        .select({ status: legalAgreementsTable.status })
        .from(legalAgreementsTable)
        .where(
          and(
            eq(legalAgreementsTable.agreementId, linked.agreementId),
            eq(legalAgreementsTable.orgId, orgId),
          ),
        )
        .limit(1);
      agreementActive = agreement?.status === 'active' || agreement?.status === 'countersigned';
    }
  }

  return {
    hasLegalBasis: recipient.legalBasis !== 'other' && !!recipient.legalBasis,
    recipientApproved: recipient.isApproved,
    agreementActive,
    recipientId,
    agreementId,
  };
}
