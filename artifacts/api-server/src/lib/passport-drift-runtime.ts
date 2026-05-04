/**
 * Passport Drift Runtime — Auto-Proposal on SLO Drift
 *
 * Registers a DriftSignal handler on the module-level driftDetector singleton.
 * When a live passport's cost/latency/accuracy crosses declared SLO thresholds:
 *
 *   1) A `proposed` successor passport record is inserted into the registry
 *      with the current timestamp, version bump, parentPassportId, and a
 *      system placeholder signature (not cryptographically valid; the operator
 *      must review, revise, and re-sign before activation).
 *
 *   2) A Covenant Policy approval request is auto-filed with the observed deltas
 *      pre-filled, linking to the successor passport id so the approver can act
 *      directly from the queue.
 *
 * The handler never auto-approves and never auto-activates — it only proposes.
 *
 * Wire-up call: call registerDriftProposalHandler() once at server startup.
 */

import { db, modelPassportsTable } from '@szl-holdings/db';
import { driftDetector } from '@szl-holdings/model-passport';
import { eq } from 'drizzle-orm';
import { logger } from './logger.js';

const DRIFT_SYSTEM_SIGNER = 'DRIFT_SYSTEM_PROPOSED_SIGNATURE';

let registered = false;

export function registerDriftProposalHandler(): void {
  if (registered) return;
  registered = true;

  driftDetector.onDrift(async (signal) => {
    let successorPassportId: string | null = null;

    try {
      const [currentRow] = await db
        .select()
        .from(modelPassportsTable)
        .where(eq(modelPassportsTable.id, signal.passportId))
        .limit(1);

      if (currentRow) {
        const versionParts = (currentRow.version ?? '1.0.0').split('.').map(Number);
        const nextPatch = (versionParts[2] ?? 0) + 1;
        const nextVersion = `${versionParts[0] ?? 1}.${versionParts[1] ?? 0}.${nextPatch}`;
        successorPassportId = `${currentRow.id}_drift_${Date.now().toString(36)}`;

        const currentSignedJson = currentRow.signedJson as Record<string, unknown>;
        const currentPassport = (currentSignedJson.passport ?? {}) as Record<string, unknown>;

        const successorPassport = {
          ...currentPassport,
          identity: {
            ...(currentPassport.identity as Record<string, unknown> ?? {}),
            id: successorPassportId,
            version: nextVersion,
            createdAt: new Date().toISOString(),
          },
          state: 'proposed',
          provenance: {
            ...(currentPassport.provenance as Record<string, unknown> ?? {}),
            parentPassportId: signal.passportId,
          },
        };

        await db
          .insert(modelPassportsTable)
          .values({
            id: successorPassportId,
            tenantId: currentRow.tenantId,
            displayName: `[DRIFT REVISION] ${currentRow.displayName} v${nextVersion}`,
            version: nextVersion,
            provider: currentRow.provider,
            providerModelId: currentRow.providerModelId,
            quantTier: currentRow.quantTier,
            lanes: currentRow.lanes,
            state: 'proposed',
            signedJson: {
              passport: successorPassport,
              signature: DRIFT_SYSTEM_SIGNER,
              signerPublicKey: DRIFT_SYSTEM_SIGNER,
              provenanceHash: DRIFT_SYSTEM_SIGNER,
              signedAt: new Date().toISOString(),
              metadata: {
                driftProposed: true,
                sourceDriftSignal: signal,
              },
            } as unknown as Record<string, unknown>,
            signature: DRIFT_SYSTEM_SIGNER,
            signerPublicKey: DRIFT_SYSTEM_SIGNER,
            provenanceHash: DRIFT_SYSTEM_SIGNER,
            downgradeTo: currentRow.downgradeTo,
            costPer1kTokensUsd: currentRow.costPer1kTokensUsd,
            p50LatencyMs: currentRow.p50LatencyMs,
            p95LatencyMs: currentRow.p95LatencyMs,
            evalPassRate: currentRow.evalPassRate,
            autonomyTier: currentRow.autonomyTier,
            approvals: [],
          })
          .onConflictDoNothing();

        logger.info(
          {
            passportId: signal.passportId,
            successorPassportId,
            dimensions: signal.dimensions,
          },
          '[passport-drift] Proposed successor passport created in registry',
        );
      }
    } catch (err) {
      logger.error(
        { err, passportId: signal.passportId },
        '[passport-drift] Failed to create successor passport — approval request will still be filed',
      );
    }

    try {
      const { createApprovalRequest } = await import('@szl-holdings/covenant-policy');

      const dimensionSummary = signal.dimensions.join(', ');
      const deltaLines: string[] = [];

      if (signal.deltas.costDeltaPct != null) {
        deltaLines.push(
          `Cost +${signal.deltas.costDeltaPct.toFixed(1)}% above declared ` +
          `(avg $${signal.measured.avgCostUsd.toFixed(4)}/call vs ` +
          `$${signal.declared.costPer1kTokensUsd.toFixed(4)}/1k tokens declared)`,
        );
      }
      if (signal.deltas.latencyDeltaPct != null) {
        deltaLines.push(
          `P95 latency +${signal.deltas.latencyDeltaPct.toFixed(1)}% above declared ` +
          `(${Math.round(signal.measured.p95LatencyMs)}ms vs ` +
          `${Math.round(signal.declared.p95LatencyMs)}ms declared)`,
        );
      }
      if (signal.deltas.accuracyDrop != null) {
        deltaLines.push(
          `Accuracy drop ${(signal.deltas.accuracyDrop * 100).toFixed(1)}pp below declared ` +
          `(${((signal.measured.avgAccuracy ?? 0) * 100).toFixed(1)}% vs ` +
          `${(signal.declared.evalPassRate * 100).toFixed(1)}% declared)`,
        );
      }

      const description =
        `Sustained SLO drift detected on passport '${signal.passportId}' ` +
        `across dimension(s): ${dimensionSummary}.\n\n` +
        `Observed over ${signal.measured.sampleCount} samples in the last rolling window:\n` +
        deltaLines.map((l) => `  • ${l}`).join('\n') +
        (successorPassportId
          ? `\n\nA proposed successor passport '${successorPassportId}' has been created in the ` +
            `registry (state: proposed). Review, revise, and re-sign it before approving activation.`
          : '') +
        `\n\nAuto-proposed by drift detector at ${signal.detectedAt}. ` +
        `Review and approve to replace this passport, or dismiss to acknowledge.`;

      const approval = await createApprovalRequest({
        orgId: null,
        resourceType: 'model_passport.drift_revision',
        resourceId: signal.passportId,
        title: `SLO drift: ${dimensionSummary} — passport ${signal.passportId}`,
        description,
        actionClass: 'model_governance',
        priority: 'high',
        requestedById: null,
        requestedByRole: 'system',
        requiredApproverRole: 'approver',
        correlationId: signal.passportId,
        serviceAttribution: 'passport-drift-detector',
        payload: {
          passportId: signal.passportId,
          successorPassportId,
          detectedAt: signal.detectedAt,
          dimensions: signal.dimensions,
          deltas: signal.deltas,
          measured: signal.measured,
          declared: signal.declared,
          thresholds: signal.thresholds,
          autoProposed: true,
        },
      });

      logger.warn(
        {
          passportId: signal.passportId,
          dimensions: signal.dimensions,
          approvalRequestId: approval.id,
          successorPassportId,
          deltas: signal.deltas,
        },
        '[passport-drift] SLO drift detected — successor proposed + approval request filed',
      );
    } catch (err) {
      logger.error(
        { err, passportId: signal.passportId, dimensions: signal.dimensions },
        '[passport-drift] Failed to file drift approval request',
      );
    }
  });

  logger.info(
    '[passport-drift] Drift proposal handler registered — SLO violations will auto-propose successors + file approval requests',
  );
}
