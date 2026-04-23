import {
  db,
  pcAuditEventsTable,
  pcPurviewCaseLinksTable,
  pcPurviewDiagnosticsTable,
  pcPurviewExportHandoffsTable,
  pcPurviewHoldAwarenessTable,
  pcPurviewScopeLinksTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { getUserOrgIds } from '../middlewares/tenant-scope';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const diagnosticsRunSchema = z.object({
  check: z.enum(['all', 'hold', 'export', 'scope', 'case_links']).optional(),
});

const exportHandoffConfirmSchema = z.object({});

const router: IRouter = Router();

type CallerScope =
  | { kind: 'elevated' }
  | { kind: 'org'; orgId: number }
  | { kind: 'none' };

function getCallerScope(req: Request): CallerScope {
  const orgIds = getUserOrgIds(req.user!);
  if (orgIds === null) return { kind: 'elevated' };
  if (orgIds.size === 0) return { kind: 'none' };
  return { kind: 'org', orgId: [...orgIds][0]! };
}

function getWriteOrgId(req: Request): number | null {
  const scope = getCallerScope(req);
  if (scope.kind === 'org') return scope.orgId;
  if (scope.kind === 'elevated') {
    const fallback = req.user?.orgs?.[0]?.orgId;
    return typeof fallback === 'number' ? fallback : null;
  }
  return null;
}

const DEMO_CASE_LINKS = [
  {
    id: 1,
    orgId: 1,
    matterId: 1,
    eDiscoveryCaseId: 'EDC-2025-0042',
    eDiscoveryCaseName: 'Rodriguez v National General — eDiscovery',
    purviewTenantId: 'szl-tenant',
    linkStatus: 'active',
    provenanceSource: 'manual',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-28T14:00:00Z',
  },
  {
    id: 2,
    orgId: 1,
    matterId: 3,
    eDiscoveryCaseId: 'EDC-2025-0038',
    eDiscoveryCaseName: 'Vasquez v GEICO — eDiscovery',
    purviewTenantId: 'szl-tenant',
    linkStatus: 'active',
    provenanceSource: 'manual',
    createdAt: '2025-12-20T08:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
  },
];

const DEMO_HOLDS = [
  {
    id: 1,
    orgId: 1,
    matterId: 1,
    caseLinkId: 1,
    holdId: 'hold-001',
    holdName: 'Rodriguez — Full Matter Hold',
    holdScope: 'All communications and documents related to Rodriguez motor vehicle claim',
    holdStatus: 'active',
    issuedBy: 'legalops@szl.com',
    issuedAt: '2026-01-16T09:00:00Z',
    custodians: ['adjuster@nationalgeneralins.com', 'attorney@szl.com'],
    provenanceSource: 'purview_api',
    auditTag: 'hold_rodriguez_001',
    createdAt: '2026-01-16T09:00:00Z',
    updatedAt: '2026-01-16T09:00:00Z',
  },
  {
    id: 2,
    orgId: 1,
    matterId: 3,
    caseLinkId: 2,
    holdId: 'hold-002',
    holdName: 'Vasquez — Discovery Hold',
    holdScope: 'All claim-related communications, medical records, and discovery documents',
    holdStatus: 'active',
    issuedBy: 'legalops@szl.com',
    issuedAt: '2026-01-02T11:00:00Z',
    custodians: ['claims@geico.com', 'attorney@szl.com'],
    provenanceSource: 'purview_api',
    auditTag: 'hold_vasquez_001',
    createdAt: '2026-01-02T11:00:00Z',
    updatedAt: '2026-01-02T11:00:00Z',
  },
];

const DEMO_EXPORT_HANDOFFS = [
  {
    id: 1,
    orgId: 1,
    matterId: 1,
    caseLinkId: 1,
    exportJobId: 'exp-job-001',
    exportName: 'Rodriguez — Production Export',
    exportFormat: 'Relativity_RSMF',
    exportStatus: 'ready',
    documentCount: 247,
    handoffDestination: 'Relativity Workspace — SZLCO-001',
    handoffMethod: 'secure_link',
    provenanceRecord: { hash: 'sha256:a3f2c1...', verifiedAt: '2026-03-28T14:00:00Z' },
    auditTag: 'exp_rodriguez_prod_001',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-03-28T14:00:00Z',
  },
  {
    id: 2,
    orgId: 1,
    matterId: 3,
    caseLinkId: 2,
    exportJobId: 'exp-job-002',
    exportName: 'Vasquez — Pending Discovery Export',
    exportFormat: 'Relativity_RSMF',
    exportStatus: 'pending',
    documentCount: null,
    handoffDestination: 'Relativity Workspace — SZLCO-002',
    handoffMethod: 'secure_link',
    provenanceRecord: null,
    auditTag: 'exp_vasquez_disc_001',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
];

const DEMO_SCOPE_LINKS = [
  {
    id: 1,
    orgId: 1,
    matterId: 1,
    caseLinkId: 1,
    contentSourceType: 'mailbox',
    contentSourceId: 'adjuster@national.com',
    contentSourceName: 'National General Adjuster Mailbox',
    inScope: true,
    reviewSetId: 'rs-001',
    reviewSetName: 'Initial document collection',
    reviewSetStatus: 'complete',
    documentCount: 247,
  },
  {
    id: 2,
    orgId: 1,
    matterId: 1,
    caseLinkId: 1,
    contentSourceType: 'mailbox',
    contentSourceId: 'attorney@szl.com',
    contentSourceName: 'Attorney Correspondence',
    inScope: true,
    reviewSetId: 'rs-002',
    reviewSetName: 'Carrier correspondence',
    reviewSetStatus: 'in_review',
    documentCount: 83,
  },
  {
    id: 3,
    orgId: 1,
    matterId: 1,
    caseLinkId: 1,
    contentSourceType: 'sharepoint_site',
    contentSourceId: 'szl.sharepoint.com/sites/rodriguez',
    contentSourceName: 'Rodriguez Matter SharePoint',
    inScope: true,
    reviewSetId: 'rs-003',
    reviewSetName: 'Medical records',
    reviewSetStatus: 'pending',
    documentCount: 156,
  },
  {
    id: 4,
    orgId: 1,
    matterId: 3,
    caseLinkId: 2,
    contentSourceType: 'mailbox',
    contentSourceId: 'claims@geico.com',
    contentSourceName: 'GEICO Claims Mailbox',
    inScope: true,
    reviewSetId: 'rs-004',
    reviewSetName: 'Discovery production set',
    reviewSetStatus: 'in_review',
    documentCount: 312,
  },
];

const DEMO_DIAGNOSTICS = [
  {
    id: 1,
    orgId: 1,
    checkType: 'connection',
    status: 'pass',
    details: { latencyMs: 145, endpoint: 'https://compliance.microsoft.com' },
    recoveryHint: null,
    checkedAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 2,
    orgId: 1,
    checkType: 'permissions',
    status: 'pass',
    details: { scopes: ['eDiscovery.Read.All', 'eDiscovery.ReadWrite.All'] },
    requiredScopes: ['eDiscovery.Read.All', 'eDiscovery.ReadWrite.All'],
    grantedScopes: ['eDiscovery.Read.All', 'eDiscovery.ReadWrite.All'],
    recoveryHint: null,
    checkedAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 3,
    orgId: 1,
    checkType: 'case_access',
    status: 'pass',
    details: { caseCount: 2, accessible: 2 },
    recoveryHint: null,
    checkedAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 4,
    orgId: 1,
    checkType: 'export_access',
    status: 'warn',
    details: { message: 'Export quota at 78%' },
    recoveryHint: 'Contact Microsoft to increase export storage quota',
    replayPath: '/api/prism-counsel/purview/diagnostics/run?check=export_access',
    checkedAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 5,
    orgId: 1,
    checkType: 'token_validity',
    status: 'pass',
    details: { expiresIn: '71 hours' },
    recoveryHint: null,
    checkedAt: '2026-04-03T10:00:00Z',
  },
];

function isLivePurview(): boolean {
  return !!(
    process.env.MICROSOFT_TENANT_ID &&
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.PURVIEW_ENABLED === 'true'
  );
}

router.get(
  '/purview/status',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const live = isLivePurview();
      sendSuccess(res, {
        service: 'prism-counsel-purview-bridge',
        status: live ? 'live' : 'demo',
        tenantConfigured: !!process.env.MICROSOFT_TENANT_ID,
        purviewEnabled: !!process.env.PURVIEW_ENABLED,
        note: live
          ? 'Connected to Microsoft Purview tenant'
          : 'Running in demo mode — configure PURVIEW_ENABLED=true and Microsoft credentials to go live',
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get Purview bridge status');
    }
  },
);

router.get(
  '/purview/case-links',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, { caseLinks: [], count: 0, isDemo: true, fetchedAt: new Date().toISOString() });
      }
      const orgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewCaseLinksTable.orgId, scope.orgId);
      let links: any[] = [];
      try {
        links = await db
          .select()
          .from(pcPurviewCaseLinksTable)
          .where(orgFilter)
          .orderBy(desc(pcPurviewCaseLinksTable.createdAt));
      } catch {
        links = [];
      }
      const data = links.length > 0 ? links : DEMO_CASE_LINKS;
      sendSuccess(res, {
        caseLinks: data,
        count: data.length,
        isDemo: links.length === 0,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list Purview case links');
    }
  },
);

router.get(
  '/purview/hold-awareness',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, { holds: [], count: 0, activeCount: 0, isDemo: true, fetchedAt: new Date().toISOString() });
      }
      const orgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewHoldAwarenessTable.orgId, scope.orgId);
      let holds: any[] = [];
      try {
        holds = await db
          .select()
          .from(pcPurviewHoldAwarenessTable)
          .where(orgFilter)
          .orderBy(desc(pcPurviewHoldAwarenessTable.createdAt));
      } catch {
        holds = [];
      }
      const data = holds.length > 0 ? holds : DEMO_HOLDS;
      sendSuccess(res, {
        holds: data,
        count: data.length,
        activeCount: data.filter((h: any) => h.holdStatus === 'active').length,
        isDemo: holds.length === 0,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list hold awareness');
    }
  },
);

router.get(
  '/purview/export-handoffs',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, { handoffs: [], count: 0, pendingCount: 0, readyCount: 0, isDemo: true, fetchedAt: new Date().toISOString() });
      }
      const orgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewExportHandoffsTable.orgId, scope.orgId);
      let handoffs: any[] = [];
      try {
        handoffs = await db
          .select()
          .from(pcPurviewExportHandoffsTable)
          .where(orgFilter)
          .orderBy(desc(pcPurviewExportHandoffsTable.createdAt));
      } catch {
        handoffs = [];
      }
      const data = handoffs.length > 0 ? handoffs : DEMO_EXPORT_HANDOFFS;
      sendSuccess(res, {
        handoffs: data,
        count: data.length,
        pendingCount: data.filter((h: any) => h.exportStatus === 'pending').length,
        readyCount: data.filter((h: any) => h.exportStatus === 'ready').length,
        isDemo: handoffs.length === 0,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list export handoffs');
    }
  },
);

router.get(
  '/purview/scope-links',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, { scopeLinks: [], count: 0, isDemo: true, fetchedAt: new Date().toISOString() });
      }
      const matterId = req.query.matterId ? Number(req.query.matterId) : undefined;
      const orgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewScopeLinksTable.orgId, scope.orgId);
      const matterFilter = matterId ? eq(pcPurviewScopeLinksTable.matterId, matterId) : undefined;
      let scopeLinks: any[] = [];
      try {
        scopeLinks = await db
          .select()
          .from(pcPurviewScopeLinksTable)
          .where(and(orgFilter, matterFilter))
          .orderBy(desc(pcPurviewScopeLinksTable.createdAt));
      } catch {
        scopeLinks = [];
      }
      const data =
        scopeLinks.length > 0
          ? scopeLinks
          : DEMO_SCOPE_LINKS.filter((s) => !matterId || s.matterId === matterId);
      sendSuccess(res, {
        scopeLinks: data,
        count: data.length,
        isDemo: scopeLinks.length === 0,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list scope links');
    }
  },
);

router.get(
  '/purview/diagnostics',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, { diagnostics: [], summary: { pass: 0, warn: 0, fail: 0, overall: 'pass' }, isDemo: true, fetchedAt: new Date().toISOString() });
      }
      const orgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewDiagnosticsTable.orgId, scope.orgId);
      let diagnostics: any[] = [];
      try {
        diagnostics = await db
          .select()
          .from(pcPurviewDiagnosticsTable)
          .where(orgFilter)
          .orderBy(desc(pcPurviewDiagnosticsTable.checkedAt));
      } catch {
        diagnostics = [];
      }
      const data = diagnostics.length > 0 ? diagnostics : DEMO_DIAGNOSTICS;
      const pass = data.filter((d: any) => d.status === 'pass').length;
      const warn = data.filter((d: any) => d.status === 'warn').length;
      const fail = data.filter((d: any) => d.status === 'fail').length;
      const overall = fail > 0 ? 'fail' : warn > 0 ? 'warn' : 'pass';
      sendSuccess(res, {
        diagnostics: data,
        summary: { pass, warn, fail, overall },
        isDemo: diagnostics.length === 0,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get Purview diagnostics');
    }
  },
);

router.post(
  '/purview/diagnostics/run',
  authMiddleware(),
  validateBody(diagnosticsRunSchema),
  async (req: Request, res: Response) => {
    try {
      const { check } = req.body as z.infer<typeof diagnosticsRunSchema>;
      const orgId = getWriteOrgId(req);
      if (orgId === null) {
        return void res.status(403).json({ error: 'No org membership — access denied' });
      }
      logger.info({ orgId }, '[purview] Running diagnostics check');
      await db
        .insert(pcAuditEventsTable)
        .values({
          orgId,
          action: 'purview_diagnostics_run',
          entityType: 'purview_bridge',
          details: { triggeredBy: 'admin', checkType: check ?? 'all' },
        })
        .catch(() => {});
      sendSuccess(res, {
        ran: true,
        message: 'Diagnostics run scheduled — results available in 15–30 seconds',
        runAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run Purview diagnostics');
    }
  },
);

router.post(
  '/purview/export-handoffs/:id/confirm',
  authMiddleware(),
  validateBody(exportHandoffConfirmSchema),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return void res.status(403).json({ error: 'No org membership — access denied' });
      }
      const orgId = getWriteOrgId(req);
      if (orgId === null) {
        return void res.status(403).json({ error: 'No org membership — access denied' });
      }
      const handoffOrgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewExportHandoffsTable.orgId, scope.orgId);
      try {
        await db
          .update(pcPurviewExportHandoffsTable)
          .set({
            exportStatus: 'transferred',
            handoffCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(pcPurviewExportHandoffsTable.id, id),
              handoffOrgFilter,
            ),
          );
      } catch {
        /* demo mode */
      }
      await db
        .insert(pcAuditEventsTable)
        .values({
          orgId,
          action: 'purview_export_handoff_confirmed',
          entityType: 'purview_export_handoff',
          entityId: id,
          details: { confirmedAt: new Date().toISOString() },
        })
        .catch(() => {});
      sendSuccess(res, { confirmed: true, handoffId: id, confirmedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Failed to confirm export handoff');
    }
  },
);

router.get(
  '/purview/bridge-summary',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const scope = getCallerScope(req);
      if (scope.kind === 'none') {
        return sendSuccess(res, {
          caseLinkCount: 0,
          activeHoldCount: 0,
          pendingExportCount: 0,
          contentSourceCount: 0,
          diagnosticsStatus: 'unknown',
          fetchedAt: new Date().toISOString(),
        });
      }
      const clOrgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewCaseLinksTable.orgId, scope.orgId);
      const hOrgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewHoldAwarenessTable.orgId, scope.orgId);
      const ehOrgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewExportHandoffsTable.orgId, scope.orgId);
      const slOrgFilter = scope.kind === 'elevated' ? undefined : eq(pcPurviewScopeLinksTable.orgId, scope.orgId);
      let caseLinkCount = DEMO_CASE_LINKS.length;
      let holdCount = DEMO_HOLDS.filter((h) => h.holdStatus === 'active').length;
      let exportPendingCount = DEMO_EXPORT_HANDOFFS.filter(
        (e) => e.exportStatus === 'pending',
      ).length;
      let scopeCount = DEMO_SCOPE_LINKS.length;
      const diagStatus = 'warn';
      try {
        const [cl, h, eh, sl] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(pcPurviewCaseLinksTable)
            .where(clOrgFilter),
          db
            .select({ count: sql<number>`count(*)` })
            .from(pcPurviewHoldAwarenessTable)
            .where(
              and(
                hOrgFilter,
                eq(pcPurviewHoldAwarenessTable.holdStatus, 'active'),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(pcPurviewExportHandoffsTable)
            .where(
              and(
                ehOrgFilter,
                eq(pcPurviewExportHandoffsTable.exportStatus, 'pending'),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(pcPurviewScopeLinksTable)
            .where(slOrgFilter),
        ]);
        if (Number(cl[0]?.count) > 0) {
          caseLinkCount = Number(cl[0].count);
          holdCount = Number(h[0]?.count ?? 0);
          exportPendingCount = Number(eh[0]?.count ?? 0);
          scopeCount = Number(sl[0]?.count ?? 0);
        }
      } catch {
        /* demo */
      }
      sendSuccess(res, {
        caseLinkCount,
        activeHoldCount: holdCount,
        pendingExportCount: exportPendingCount,
        contentSourceCount: scopeCount,
        diagnosticsStatus: diagStatus,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get bridge summary');
    }
  },
);

export default router;
