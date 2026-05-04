/**
 * Cross-Domain Signal Correlator
 *
 * When a signal arrives on the Prism Bus, this module checks for correlated
 * impacts across all other domains. Correlation patterns are:
 *   - maritime sanctions hit   → legal obligation check + cyber exposure scan
 *   - cyber CVE / threat alert → maritime compliance check + property risk
 *   - property distress        → legal exposure + portfolio risk
 *   - legal matter opened      → maritime compliance + cyber risk
 *
 * Each correlation entry is stored in-memory (and optionally persisted) and
 * exposed via GET /signal-correlations.
 */

import type { Signal } from '@workspace/ontology/signal';
import { randomUUID } from 'node:crypto';
import { logger } from './logger.js';

export type CorrelationStrength = 'strong' | 'moderate' | 'weak';

export interface CorrelationEntry {
  correlationId: string;
  sourceSignalId: string;
  sourceDomain: string;
  sourceType: string;
  sourceTitle: string;
  impactedDomain: string;
  impactType: string;
  impactDescription: string;
  strength: CorrelationStrength;
  confidence: number;
  recommendedAction: string;
  createdAt: string;
  /** Tenant/org that owns this correlation — set from signal.tenantId. Used
   *  to enforce per-tenant isolation when reading from the correlation store. */
  orgId?: string;
  metadata: Record<string, unknown>;
}

const MAX_ENTRIES = 500;
const correlations: CorrelationEntry[] = [];

export function getCorrelations(opts?: {
  sourceDomain?: string;
  impactedDomain?: string;
  limit?: number;
  since?: number;
  /** If provided, only return correlations that match this orgId exactly.
   *  Callers should always pass the authenticated user's orgId to prevent
   *  cross-tenant data exposure. */
  orgId?: string | null;
}): CorrelationEntry[] {
  let results = [...correlations];

  // Enforce tenant isolation — callers must pass their orgId so entries
  // belonging to other tenants are never returned.
  if (opts?.orgId !== undefined) {
    results = results.filter(
      (c) =>
        (c.orgId ?? null) === (opts.orgId ?? null),
    );
  }

  if (opts?.sourceDomain) {
    results = results.filter((c) => c.sourceDomain === opts.sourceDomain);
  }
  if (opts?.impactedDomain) {
    results = results.filter((c) => c.impactedDomain === opts.impactedDomain);
  }
  if (opts?.since) {
    const cutoff = new Date(opts.since).toISOString();
    results = results.filter((c) => c.createdAt >= cutoff);
  }

  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return results.slice(0, opts?.limit ?? 50);
}

export function clearCorrelations(): void {
  correlations.length = 0;
}

function addCorrelation(entry: CorrelationEntry): void {
  correlations.unshift(entry);
  if (correlations.length > MAX_ENTRIES) {
    correlations.splice(MAX_ENTRIES);
  }
  logger.info(
    {
      correlationId: entry.correlationId,
      sourceDomain: entry.sourceDomain,
      impactedDomain: entry.impactedDomain,
      strength: entry.strength,
    },
    '[cross-domain-correlator] Correlation detected',
  );
}

function makeCorrelation(
  signal: Signal,
  impactedDomain: string,
  impactType: string,
  impactDescription: string,
  strength: CorrelationStrength,
  confidence: number,
  recommendedAction: string,
  metadata: Record<string, unknown> = {},
): CorrelationEntry {
  return {
    correlationId: randomUUID(),
    sourceSignalId: signal.signalId,
    sourceDomain: signal.domain,
    sourceType: signal.type,
    sourceTitle: (signal.rawPayload?.title as string) ?? signal.type,
    impactedDomain,
    impactType,
    impactDescription,
    strength,
    confidence,
    recommendedAction,
    createdAt: new Date().toISOString(),
    // Inherit orgId from the originating signal so the correlation entry
    // can be filtered by tenant on read. undefined = no tenant context.
    orgId: (signal as unknown as { tenantId?: string }).tenantId ?? undefined,
    metadata: { severity: signal.severity, ...metadata },
  };
}

/**
 * Analyse a published signal and create correlation entries for impacted domains.
 * This is a synchronous, best-effort call — errors do not propagate.
 */
export function correlateDomains(signal: Signal): void {
  try {
    const domain = signal.domain;
    const type = signal.type;
    const severity = signal.severity ?? 'info';
    const isCriticalOrHigh = severity === 'critical' || severity === 'high';

    // ── Maritime signals ────────────────────────────────────────────────────
    if (domain === 'maritime') {
      if (type === 'sanctions-match' || type === 'sanctions-hit') {
        // Vessels sanctions → legal obligation
        addCorrelation(
          makeCorrelation(
            signal,
            'legal',
            'sanctions-obligation',
            `Maritime sanctions match on ${(signal.rawPayload?.title as string) ?? 'vessel'} triggers mandatory legal reporting obligations and contract review.`,
            'strong',
            0.95,
            'Open a Counsel matter for sanctions compliance review immediately.',
            { triggeredBy: 'sanctions-match' },
          ),
        );
        // Vessels sanctions → cyber exposure
        addCorrelation(
          makeCorrelation(
            signal,
            'security',
            'counter-party-exposure',
            `Sanctioned counter-party may introduce cyber risk through shared OT/IT systems or data exchanges.`,
            'moderate',
            0.72,
            'Run a cyber exposure scan on all shared systems with the affected counter-party.',
            { triggeredBy: 'sanctions-match' },
          ),
        );
      }

      if (type === 'compliance-failure' || type === 'compliance-warning') {
        addCorrelation(
          makeCorrelation(
            signal,
            'legal',
            'compliance-legal-risk',
            `Maritime compliance failure may create legal liability under IMO / port-state-control regulations.`,
            'strong',
            0.88,
            'Engage legal counsel to assess exposure under applicable maritime law.',
          ),
        );
      }

      if (isCriticalOrHigh && (type === 'risk' || type === 'alert')) {
        addCorrelation(
          makeCorrelation(
            signal,
            'security',
            'maritime-threat-escalation',
            `High-severity maritime risk event warrants cross-domain cyber threat assessment.`,
            'moderate',
            0.68,
            'Escalate to Sentra for cross-domain threat analysis.',
          ),
        );
      }
    }

    // ── Security / Cyber signals ─────────────────────────────────────────────
    if (domain === 'security') {
      if (type === 'cve' || type === 'vulnerability' || type === 'threat-alert') {
        // Cyber CVE → maritime compliance check
        addCorrelation(
          makeCorrelation(
            signal,
            'maritime',
            'ot-it-vulnerability',
            `CVE/vulnerability may affect OT/IT systems aboard monitored vessels. Vessel operations may be impacted.`,
            'moderate',
            0.75,
            'Check if vulnerable systems are deployed on monitored maritime assets.',
          ),
        );
        // Cyber CVE → property risk
        if (isCriticalOrHigh) {
          addCorrelation(
            makeCorrelation(
              signal,
              'real-estate',
              'building-system-risk',
              `Critical vulnerability may affect BMS / access control systems in monitored properties.`,
              'moderate',
              0.65,
              'Verify building management systems are patched or segmented.',
            ),
          );
        }
      }

      if (type === 'incident' || type === 'breach') {
        addCorrelation(
          makeCorrelation(
            signal,
            'legal',
            'breach-notification',
            `Security incident may trigger breach notification obligations under GDPR, CCPA, or sector-specific regulations.`,
            'strong',
            0.92,
            'Engage legal counsel immediately to assess breach notification timelines.',
          ),
        );
        addCorrelation(
          makeCorrelation(
            signal,
            'maritime',
            'operational-continuity',
            `Security breach may affect maritime operations systems. Verify vessel connectivity and OT isolation.`,
            'weak',
            0.55,
            'Confirm maritime OT systems are isolated from affected corporate networks.',
          ),
        );
      }
    }

    // ── Real estate signals ──────────────────────────────────────────────────
    if (domain === 'real-estate') {
      if (type === 'distress' || type === 'distress-signal') {
        addCorrelation(
          makeCorrelation(
            signal,
            'legal',
            'distressed-asset-exposure',
            `Distressed property may have encumbrances, title defects, or outstanding litigation requiring legal due diligence.`,
            'strong',
            0.85,
            'Commission title search and litigation check before any acquisition action.',
          ),
        );
        addCorrelation(
          makeCorrelation(
            signal,
            'finance',
            'portfolio-risk',
            `Distressed property signals potential write-down or impairment in portfolio valuation.`,
            'strong',
            0.9,
            'Flag for portfolio review; update NAV model for impaired asset.',
          ),
        );
      }

      if (type === 'opportunity' || type === 'deal-update') {
        addCorrelation(
          makeCorrelation(
            signal,
            'finance',
            'capital-deployment',
            `Property opportunity may warrant capital reallocation from the fund operations dashboard.`,
            'moderate',
            0.78,
            'Review capital availability in Fund Operations before committing.',
          ),
        );
      }
    }

    // ── Legal signals ────────────────────────────────────────────────────────
    if (domain === 'legal') {
      if (type === 'matter-opened' || type === 'litigation-risk') {
        addCorrelation(
          makeCorrelation(
            signal,
            'maritime',
            'contract-compliance',
            `Legal matter may affect charter parties or maritime contracts. Review voyage compliance obligations.`,
            'moderate',
            0.7,
            'Cross-reference affected entities with active maritime contracts in Vessels.',
          ),
        );
        addCorrelation(
          makeCorrelation(
            signal,
            'security',
            'legal-discovery-exposure',
            `Active litigation creates e-discovery obligations. Ensure relevant systems and logs are preserved.`,
            'moderate',
            0.82,
            'Activate legal hold policy in Sentra for relevant data sources.',
          ),
        );
      }
    }

    // ── Finance / portfolio signals ──────────────────────────────────────────
    if (domain === 'finance' || domain === 'portfolio') {
      if (isCriticalOrHigh) {
        addCorrelation(
          makeCorrelation(
            signal,
            'legal',
            'investor-reporting',
            `Material portfolio event may trigger investor reporting obligations under fund documents.`,
            'moderate',
            0.77,
            'Review fund agreement disclosure requirements with legal counsel.',
          ),
        );
      }
    }
  } catch (err) {
    logger.warn({ err, signalId: signal.signalId }, '[cross-domain-correlator] Correlation failed');
  }
}
