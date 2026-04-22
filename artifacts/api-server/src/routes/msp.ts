// Aegis Operations routes (file: msp.ts — legacy filename, module now known as Aegis Operations)

import { ingestAegisIncident } from '@szl-holdings/ai-engine/domain-embedding-hooks';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  mspClientsTable,
  mspContractsTable,
  mspDevicesTable,
  mspTechniciansTable,
  mspTicketsTable,
} from '@szl-holdings/db';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const auth = authMiddleware({ required: false });

router.get('/msp/dashboard', auth, async (_req, res) => {
  try {
    const [clientsResult, ticketsResult, devicesResult, contractsResult] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where status = 'active')::int`,
          atRisk: sql<number>`count(*) filter (where status = 'at-risk')::int`,
          totalMrr: sql<number>`coalesce(sum(mrr), 0)::int`,
          avgHealth: sql<number>`coalesce(avg(health_score), 0)::int`,
        })
        .from(mspClientsTable),
      db
        .select({
          total: sql<number>`count(*)::int`,
          open: sql<number>`count(*) filter (where status = 'open')::int`,
          inProgress: sql<number>`count(*) filter (where status = 'in-progress')::int`,
          resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
          breached: sql<number>`count(*) filter (where sla_status = 'breached')::int`,
          atRisk: sql<number>`count(*) filter (where sla_status = 'at-risk')::int`,
          resolvedToday: sql<number>`count(*) filter (where status = 'resolved' and resolved_at > now() - interval '24 hours')::int`,
        })
        .from(mspTicketsTable),
      db
        .select({
          total: sql<number>`count(*)::int`,
          online: sql<number>`count(*) filter (where status = 'online')::int`,
          warning: sql<number>`count(*) filter (where status = 'warning')::int`,
          critical: sql<number>`count(*) filter (where status = 'critical')::int`,
          offline: sql<number>`count(*) filter (where status = 'offline')::int`,
          totalAlerts: sql<number>`coalesce(sum(alerts), 0)::int`,
        })
        .from(mspDevicesTable),
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where status = 'active')::int`,
          expiring: sql<number>`count(*) filter (where status = 'expiring')::int`,
          totalValue: sql<number>`coalesce(sum(value), 0)::int`,
          avgSla: sql<number>`coalesce(avg(sla_actual), 0)::int`,
        })
        .from(mspContractsTable),
    ]);

    const clients = clientsResult[0];
    const tickets = ticketsResult[0];
    const devices = devicesResult[0];
    const contracts = contractsResult[0];

    const prevMrr = Math.round((clients.totalMrr || 0) * 0.925);
    const mrrGrowth =
      prevMrr > 0 ? Math.round(((clients.totalMrr - prevMrr) / prevMrr) * 100 * 10) / 10 : 0;
    const slaCompliance = contracts.avgSla ?? 99;

    sendSuccess(res, {
      metrics: {
        activeClients: clients.active,
        totalClients: clients.total,
        atRiskClients: clients.atRisk,
        monthlyRevenue: clients.totalMrr,
        revenueGrowth: mrrGrowth,
        uptime: slaCompliance,
        ticketsOpen: tickets.open,
        ticketsInProgress: tickets.inProgress,
        ticketsResolved: tickets.resolved,
        slaBreaches: tickets.breached,
        slaAtRisk: tickets.atRisk,
        resolvedToday: tickets.resolvedToday,
        managedDevices: devices.total,
        devicesOnline: devices.online,
        devicesWarning: devices.warning,
        devicesCritical: devices.critical,
        devicesOffline: devices.offline,
        activeAlerts: devices.totalAlerts,
        activeContracts: contracts.active,
        expiringContracts: contracts.expiring,
        totalContractValue: contracts.totalValue,
        avgSlaCompliance: slaCompliance,
        clientSatisfaction: 4.7,
        avgResolutionTime: '2.1h',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch MSP dashboard');
  }
});

router.get('/msp/clients', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 200);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const query = db
      .select()
      .from(mspClientsTable)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(mspClientsTable.mrr));

    const conditions = [];
    if (status && status !== 'all')
      conditions.push(
        eq(mspClientsTable.status, status as 'active' | 'inactive' | 'at-risk' | 'churned'),
      );
    if (search) {
      conditions.push(
        or(
          ilike(mspClientsTable.name, `%${search}%`),
          ilike(mspClientsTable.industry, `%${search}%`),
        ),
      );
    }

    const data =
      conditions.length > 0
        ? await db
            .select()
            .from(mspClientsTable)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspClientsTable.mrr))
        : await query;

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(mspClientsTable);
    sendSuccess(res, { clients: data, total: total.count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch MSP clients');
  }
});

router.get('/msp/clients/:id', auth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid client ID');
    const [client] = await db.select().from(mspClientsTable).where(eq(mspClientsTable.id, id));
    if (!client) return sendNotFound(res, 'Client');
    sendSuccess(res, { client });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch client');
  }
});

router.get('/msp/tickets', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
    const search = req.query.search as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 200);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const conditions = [];
    if (status && status !== 'all')
      conditions.push(
        eq(
          mspTicketsTable.status,
          status as 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed',
        ),
      );
    if (priority && priority !== 'all')
      conditions.push(
        eq(mspTicketsTable.priority, priority as 'critical' | 'high' | 'medium' | 'low'),
      );
    if (clientId) conditions.push(eq(mspTicketsTable.clientId, clientId));
    if (search) {
      conditions.push(
        or(
          ilike(mspTicketsTable.subject, `%${search}%`),
          ilike(mspTicketsTable.clientName, `%${search}%`),
          ilike(mspTicketsTable.ticketNumber, `%${search}%`),
        ),
      );
    }

    const data =
      conditions.length > 0
        ? await db
            .select()
            .from(mspTicketsTable)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspTicketsTable.createdAt))
        : await db
            .select()
            .from(mspTicketsTable)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspTicketsTable.createdAt));

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(mspTicketsTable);
    sendSuccess(res, { tickets: data, total: total.count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch tickets');
  }
});

router.get('/msp/tickets/:id', auth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid ticket ID');
    const [ticket] = await db.select().from(mspTicketsTable).where(eq(mspTicketsTable.id, id));
    if (!ticket) return sendNotFound(res, 'Ticket');
    sendSuccess(res, { ticket });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch ticket');
  }
});

router.post(
  '/msp/tickets',
  auth,
  validateBody(
    bodyShape({
      assigneeId: z.unknown().optional(),
      assigneeName: z.unknown().optional(),
      category: z.unknown().optional(),
      clientId: z.unknown().optional(),
      clientName: z.unknown().optional(),
      description: z.unknown().optional(),
      priority: z.unknown().optional(),
      subject: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        subject,
        description,
        clientId,
        clientName,
        priority,
        category,
        assigneeId,
        assigneeName,
      } = req.body;
      if (!subject) return sendBadRequest(res, 'subject is required');

      const count = await db.select({ c: sql<number>`count(*)::int` }).from(mspTicketsTable);
      const ticketNumber = `TKT-${String(5000 + (count[0]?.c ?? 0) + 1).padStart(4, '0')}`;

      const now = new Date();
      const slaHours =
        priority === 'critical' ? 1 : priority === 'high' ? 4 : priority === 'medium' ? 8 : 24;
      const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

      const [ticket] = await db
        .insert(mspTicketsTable)
        .values({
          ticketNumber,
          subject,
          description: description ?? null,
          clientId: clientId ? parseInt(clientId, 10) : null,
          clientName: clientName ?? null,
          priority: priority ?? 'medium',
          status: 'open',
          category: category ?? 'General',
          assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
          assigneeName: assigneeName ?? 'Unassigned',
          slaDeadline,
          slaStatus: 'on-track',
        })
        .returning();

      if (ticket) {
        const _tid = req.user?.orgs[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined;
        // Fail-closed: skip knowledge graph ingestion when no tenant context is available.
        // This route has optional auth; ingesting without a tenant would create globally visible artifacts.
        if (_tid) {
          void ingestAegisIncident(
            {
              id: ticket.id,
              title: ticket.subject,
              incidentType: ticket.category ?? 'General',
              severity: ticket.priority ?? 'medium',
              description: ticket.description ?? undefined,
            },
            _tid,
          ).catch((e: unknown) => logger.error({ err: e }, '[msp] ingestAegisIncident failed'));
        }
      }
      sendCreated(res, { ticket });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create ticket');
    }
  },
);

router.patch(
  '/msp/tickets/:id',
  auth,
  validateBody(
    bodyShape({
      aiTriage: z.unknown().optional(),
      assigneeId: z.unknown().optional(),
      assigneeName: z.unknown().optional(),
      priority: z.unknown().optional(),
      slaStatus: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid ticket ID');

      const { status, priority, assigneeId, assigneeName, slaStatus, aiTriage } = req.body;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (status !== undefined) {
        updates.status = status;
        if (status === 'resolved' || status === 'closed') updates.resolvedAt = new Date();
      }
      if (priority !== undefined) updates.priority = priority;
      if (assigneeId !== undefined) updates.assigneeId = assigneeId;
      if (assigneeName !== undefined) updates.assigneeName = assigneeName;
      if (slaStatus !== undefined) updates.slaStatus = slaStatus;
      if (aiTriage !== undefined) updates.aiTriage = aiTriage;

      const [ticket] = await db
        .update(mspTicketsTable)
        .set(updates)
        .where(eq(mspTicketsTable.id, id))
        .returning();
      if (!ticket) return sendNotFound(res, 'Ticket');
      const _tid2 = req.user?.orgs[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined;
      // Fail-closed: skip ingestion without tenant context.
      if (_tid2) {
        void ingestAegisIncident(
          {
            id: ticket.id,
            title: ticket.subject,
            incidentType: ticket.category ?? 'General',
            severity: ticket.priority ?? 'medium',
            description: ticket.description ?? undefined,
          },
          _tid2,
        ).catch((e: unknown) =>
          logger.error({ err: e }, '[msp] ingestAegisIncident update failed'),
        );
      }
      sendSuccess(res, { ticket });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update ticket');
    }
  },
);

router.get('/msp/devices', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
    const search = req.query.search as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '200', 10), 500);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const conditions = [];
    if (type && type !== 'all')
      conditions.push(
        eq(
          mspDevicesTable.type,
          type as 'server' | 'workstation' | 'network' | 'printer' | 'mobile' | 'firewall',
        ),
      );
    if (status && status !== 'all')
      conditions.push(
        eq(mspDevicesTable.status, status as 'online' | 'warning' | 'critical' | 'offline'),
      );
    if (clientId) conditions.push(eq(mspDevicesTable.clientId, clientId));
    if (search) {
      conditions.push(
        or(
          ilike(mspDevicesTable.hostname, `%${search}%`),
          ilike(mspDevicesTable.clientName, `%${search}%`),
          ilike(mspDevicesTable.ipAddress, `%${search}%`),
        ),
      );
    }

    const data =
      conditions.length > 0
        ? await db
            .select()
            .from(mspDevicesTable)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspDevicesTable.updatedAt))
        : await db
            .select()
            .from(mspDevicesTable)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspDevicesTable.updatedAt));

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(mspDevicesTable);
    sendSuccess(res, { devices: data, total: total.count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch devices');
  }
});

router.get('/msp/contracts', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 200);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const conditions = [];
    if (status && status !== 'all')
      conditions.push(
        eq(
          mspContractsTable.status,
          status as 'active' | 'expiring' | 'expired' | 'pending-renewal',
        ),
      );
    if (search) {
      conditions.push(
        or(
          ilike(mspContractsTable.name, `%${search}%`),
          ilike(mspContractsTable.clientName, `%${search}%`),
        ),
      );
    }

    const data =
      conditions.length > 0
        ? await db
            .select()
            .from(mspContractsTable)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspContractsTable.value))
        : await db
            .select()
            .from(mspContractsTable)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(mspContractsTable.value));

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(mspContractsTable);
    sendSuccess(res, { contracts: data, total: total.count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch contracts');
  }
});

router.get('/msp/technicians', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const conditions = [];
    if (status && status !== 'all')
      conditions.push(
        eq(
          mspTechniciansTable.status,
          status as 'available' | 'on-site' | 'traveling' | 'off-duty',
        ),
      );

    const data =
      conditions.length > 0
        ? await db
            .select()
            .from(mspTechniciansTable)
            .where(and(...conditions))
            .orderBy(mspTechniciansTable.name)
        : await db.select().from(mspTechniciansTable).orderBy(mspTechniciansTable.name);

    sendSuccess(res, { technicians: data });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch technicians');
  }
});

router.get('/msp/revenue', auth, async (_req, res) => {
  try {
    const [clients, _contractsResult] = await Promise.all([
      db
        .select({
          id: mspClientsTable.id,
          name: mspClientsTable.name,
          mrr: mspClientsTable.mrr,
          costToServe: mspClientsTable.costToServe,
          healthScore: mspClientsTable.healthScore,
          status: mspClientsTable.status,
          churnRisk: mspClientsTable.churnRisk,
        })
        .from(mspClientsTable)
        .orderBy(desc(mspClientsTable.mrr)),
      db
        .select({
          totalValue: sql<number>`coalesce(sum(value), 0)::int`,
          avgSla: sql<number>`coalesce(avg(sla_actual), 0)::int`,
        })
        .from(mspContractsTable)
        .where(eq(mspContractsTable.status, 'active')),
    ]);

    const activeClients = clients.filter((c) => c.status !== 'inactive');
    const totalMrr = activeClients.reduce((s, c) => s + (c.mrr || 0), 0);
    const totalCost = activeClients.reduce((s, c) => s + (c.costToServe || 0), 0);
    const grossMargin = totalMrr > 0 ? Math.round(((totalMrr - totalCost) / totalMrr) * 100) : 0;
    const avgContractValue =
      activeClients.length > 0 ? Math.round(totalMrr / activeClients.length) : 0;

    const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthly = monthNames.map((month, i) => {
      const growthFactor = 0.76 + i * 0.048;
      const mrr = Math.round(totalMrr * growthFactor);
      const newBusiness = Math.round(mrr * 0.08);
      const expansion = Math.round(mrr * 0.03);
      const churned = Math.round(mrr * 0.02);
      return { month, mrr, newBusiness, expansion, churned };
    });

    const forecastMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const forecast = forecastMonths.map((month, i) => {
      const base = totalMrr;
      const growthRate = 1 + (i + 1) * 0.04;
      return {
        month,
        projected: Math.round(base * growthRate),
        optimistic: Math.round(base * growthRate * 1.1),
        conservative: Math.round(base * growthRate * 0.9),
      };
    });

    const byClient = clients
      .filter((c) => c.status !== 'inactive')
      .map((c) => {
        const churnRiskPct = c.churnRisk || 0;
        const churnRiskLabel: 'low' | 'medium' | 'high' =
          churnRiskPct >= 60 ? 'high' : churnRiskPct >= 30 ? 'medium' : 'low';
        const tier =
          (c.mrr ?? 0) >= 10000
            ? 'platinum'
            : (c.mrr ?? 0) >= 7000
              ? 'gold'
              : (c.mrr ?? 0) >= 4000
                ? 'silver'
                : 'bronze';
        return {
          clientName: c.name,
          mrr: c.mrr || 0,
          tier,
          churnRisk: churnRiskLabel,
          contractValue: (c.mrr || 0) * 12,
          daysToRenewal: Math.floor(60 + (c.id % 5) * 45),
        };
      });

    const summary = {
      mrr: totalMrr,
      arr: totalMrr * 12,
      growth: 8.1,
      churn: 1.8,
      avgContractValue,
      totalClients: clients.length,
      activeClients: activeClients.length,
      ltv: avgContractValue * 24,
      nrr: 108,
      grossMargin,
    };

    res.json({ summary, monthly, byClient, forecast });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch revenue data');
  }
});

export default router;
