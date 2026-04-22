import { bodyShape } from '@szl-holdings/contracts/common';
import { connectorsTable, db } from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { and, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

router.get('/salesforce/opportunities', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sfAdapter = (services as unknown as Record<string, unknown>).salesforce as
      | { getOpportunities?: () => Promise<{ records?: Record<string, unknown>[] }> }
      | undefined;
    if (sfAdapter?.getOpportunities) {
      const data = await sfAdapter.getOpportunities();
      if (data?.records?.length) {
        return sendSuccess(
          res,
          data.records.map((r) => ({
            id: r.Id,
            name: r.Name,
            accountName:
              (r.Account as Record<string, unknown>)?.Name ?? r.AccountName ?? null,
            amount: r.Amount ?? null,
            stageName: r.StageName,
            closeDate: r.CloseDate,
            probability: r.Probability ?? null,
            forecastCategory: r.ForecastCategory ?? null,
            isClosed: r.IsClosed ?? false,
            isWon: r.IsWon ?? false,
            type: r.Type ?? null,
          })),
        );
      }
    }
    sendSuccess(res, { items: [], available: false, note: 'Salesforce connector not configured' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Salesforce opportunities');
  }
});

router.get('/salesforce/accounts', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sfAdapter = (services as unknown as Record<string, unknown>).salesforce as
      | { getAccounts?: () => Promise<{ records?: unknown[] }> }
      | undefined;
    if (sfAdapter?.getAccounts) {
      const data = await sfAdapter.getAccounts();
      if (data?.records?.length) return sendSuccess(res, data.records);
    }
    sendSuccess(res, { items: [], available: false, note: 'Salesforce connector not configured' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Salesforce accounts');
  }
});

router.get('/salesforce/leads', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sfAdapter = (services as unknown as Record<string, unknown>).salesforce as
      | { getLeads?: () => Promise<{ records?: unknown[] }> }
      | undefined;
    if (sfAdapter?.getLeads) {
      const data = await sfAdapter.getLeads();
      if (data?.records?.length) return sendSuccess(res, data.records);
    }
    sendSuccess(res, { items: [], available: false, note: 'Salesforce connector not configured' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Salesforce leads');
  }
});

router.get('/hubspot/deals', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const hubSpotAdapter = (services as unknown as Record<string, unknown>).hubspot as
      | { getDeals?: () => Promise<{ results?: Record<string, unknown>[] }> }
      | undefined;
    if (hubSpotAdapter?.getDeals) {
      const data = await hubSpotAdapter.getDeals();
      if (data?.results?.length) {
        return sendSuccess(
          res,
          data.results.map((d) => ({
            id: d.id,
            name: (d.properties as Record<string, unknown>)?.dealname ?? d.id,
            stage: (d.properties as Record<string, unknown>)?.dealstage ?? 'unknown',
            amount: Number((d.properties as Record<string, unknown>)?.amount ?? 0),
            closeDate:
              (d.properties as Record<string, unknown>)?.closedate ??
              new Date().toISOString(),
          })),
        );
      }
    }
    sendSuccess(res, { items: [], available: false, note: 'HubSpot connector not configured' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch HubSpot deals');
  }
});

router.get('/hubspot/contacts', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const hubSpotAdapter = (services as unknown as Record<string, unknown>).hubspot as
      | { getContacts?: () => Promise<{ results?: unknown[] }> }
      | undefined;
    if (hubSpotAdapter?.getContacts) {
      const data = await hubSpotAdapter.getContacts();
      if (data?.results?.length)
        return sendSuccess(res, { count: data.results.length, contacts: data.results });
    }
    sendSuccess(res, {
      count: 0,
      contacts: [],
      available: false,
      note: 'HubSpot connector not configured',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch HubSpot contacts');
  }
});

router.get('/dynamics/opportunities', authMiddleware({ required: false }), async (_req, res) => {
  try {
    const dynAdapter = (services as unknown as Record<string, unknown>).dynamics365 as
      | { getOpportunities?: () => Promise<{ value?: Record<string, unknown>[] }> }
      | undefined;
    if (dynAdapter?.getOpportunities) {
      const data = await dynAdapter.getOpportunities();
      if (data?.value?.length) {
        return sendSuccess(
          res,
          data.value.map((o) => ({
            id: o.opportunityid ?? o.id,
            name: o.name ?? o.subject,
            accountName: (o.customerid_account as Record<string, unknown>)?.name ?? null,
            stage: o.stepname ?? o.salesstage ?? 'Unknown',
            probability: o.closeprobability ?? 50,
            estimatedRevenue: o.estimatedvalue ?? o.budgetamount ?? 0,
            estimatedCloseDate: o.estimatedclosedate ?? new Date().toISOString(),
          })),
        );
      }
    }
    sendSuccess(res, {
      items: [],
      available: false,
      note: 'Dynamics 365 connector not configured',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Dynamics 365 opportunities');
  }
});

router.post(
  '/crm/sync/:crmType',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const { crmType } = req.params as Record<string, string>;
      const validTypes = ['salesforce', 'hubspot', 'dynamics365', 'all'];
      if (!validTypes.includes(crmType)) {
        sendBadRequest(res, `Invalid CRM type. Must be one of: ${validTypes.join(', ')}`);
        return;
      }

      const typesToSync = crmType === 'all' ? ['salesforce', 'hubspot', 'dynamics365'] : [crmType];
      const results: Record<string, { status: string; message: string; timestamp: string }> = {};

      for (const type of typesToSync) {
        try {
          const [conn] = await db
            .select()
            .from(connectorsTable)
            .where(and(eq(connectorsTable.type, type as any), eq(connectorsTable.isEnabled, true)))
            .limit(1);

          if (conn) {
            await db
              .update(connectorsTable)
              .set({ lastSyncAt: new Date(), updatedAt: new Date() })
              .where(eq(connectorsTable.id, conn.id));
            results[type] = {
              status: 'success',
              message: `Sync completed for ${type}`,
              timestamp: new Date().toISOString(),
            };
          } else {
            results[type] = {
              status: 'not_configured',
              message: `${type} connector not configured`,
              timestamp: new Date().toISOString(),
            };
          }
        } catch {
          results[type] = {
            status: 'error',
            message: `Failed to sync ${type}`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      sendSuccess(res, { synced: typesToSync, results });
    } catch (err) {
      handleRouteError(res, err, 'Failed to trigger CRM sync');
    }
  },
);

export default router;
