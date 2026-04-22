import { bodyShape } from '@szl-holdings/contracts/common';
import {
  auditLogsTable,
  corridorsTable,
  db,
  eventLogTable,
  maritimeExceptionsTable,
  maritimeVesselsTable,
  portsTable,
  readinessItemsTable,
  voyagesTable,
  workflowRunsTable,
  workflowsTable,
} from '@szl-holdings/db';
import { and, desc, eq, or, sql } from 'drizzle-orm';
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
import { isFlagEnabled } from '../lib/platform-flags';
import { anyQuerySchema, listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, canAccessOrgRecord, parseIdParam } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const VESSEL_TYPES = [
  'container',
  'tanker',
  'bulk',
  'cargo',
  'passenger',
  'ro-ro',
  'lpg',
  'lng',
  'chemical',
  'other',
] as const;
const VESSEL_STATUSES = [
  'active',
  'in_port',
  'at_sea',
  'anchored',
  'maintenance',
  'decommissioned',
  'off_hire',
] as const;
const VOYAGE_STATUSES = [
  'planned',
  'loading',
  'departed',
  'at_sea',
  'arrived',
  'discharging',
  'completed',
  'cancelled',
  'diverted',
] as const;

const CreateVesselSchema = z.object({
  orgId: z.number().int().optional().default(1),
  name: z.string().min(1, 'name is required'),
  imo: z.string().optional().nullable(),
  mmsi: z.string().optional().nullable(),
  callSign: z.string().optional().nullable(),
  flag: z.string().optional().nullable(),
  vesselType: z.enum(VESSEL_TYPES).optional().default('container'),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 2)
    .optional()
    .nullable(),
  grossTonnage: z.number().optional().nullable(),
  status: z.enum(VESSEL_STATUSES).optional().default('active'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const UpdateVesselSchema = z.object({
  name: z.string().min(1).optional(),
  imo: z.string().optional().nullable(),
  mmsi: z.string().optional().nullable(),
  callSign: z.string().optional().nullable(),
  flag: z.string().optional().nullable(),
  vesselType: z.enum(VESSEL_TYPES).optional(),
  yearBuilt: z.number().int().optional().nullable(),
  grossTonnage: z.number().optional().nullable(),
  status: z.enum(VESSEL_STATUSES).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  heading: z.number().min(0).max(360).optional().nullable(),
  speedOverGround: z.number().min(0).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const CreateVoyageSchema = z.object({
  orgId: z.number().int().optional().default(1),
  vesselId: z.number().int({ message: 'vesselId is required' }),
  voyageNumber: z.string().optional().nullable(),
  originPortId: z.number().int().optional().nullable(),
  destinationPortId: z.number().int().optional().nullable(),
  cargoType: z.string().optional().nullable(),
  cargoDescription: z.string().optional().nullable(),
  cargoTonnage: z.number().optional().nullable(),
  cargoValueUsd: z.number().optional().nullable(),
  status: z.enum(VOYAGE_STATUSES).optional().default('planned'),
  scheduledDepartureAt: z.string().optional().nullable(),
  scheduledArrivalAt: z.string().optional().nullable(),
  estimatedArrivalAt: z.string().optional().nullable(),
  distanceNm: z.number().optional().nullable(),
  revenueUsd: z.number().optional().nullable(),
  charterRatePerDay: z.number().optional().nullable(),
  corridorId: z.number().int().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const EXCEPTION_TYPES = [
  'eta_deviation',
  'route_deviation',
  'weather_delay',
  'port_congestion',
  'mechanical',
  'cargo_incident',
  'security_threat',
  'regulatory',
  'commercial',
  'other',
] as const;
const EXCEPTION_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const VOYAGE_READINESS_CATEGORIES = [
  'maritime',
  'operational',
  'security',
  'compliance',
  'performance',
  'financial',
  'technical',
] as const;
const READINESS_PRIORITIES_V = ['low', 'medium', 'high', 'critical'] as const;

const UpdateVoyageSchema = z.object({
  voyageNumber: z.string().optional().nullable(),
  originPortId: z.number().int().optional().nullable(),
  destinationPortId: z.number().int().optional().nullable(),
  cargoType: z.string().optional().nullable(),
  cargoDescription: z.string().optional().nullable(),
  cargoTonnage: z.number().optional().nullable(),
  cargoValueUsd: z.number().optional().nullable(),
  status: z.enum(VOYAGE_STATUSES).optional(),
  scheduledDepartureAt: z.string().optional().nullable(),
  scheduledArrivalAt: z.string().optional().nullable(),
  estimatedArrivalAt: z.string().optional().nullable(),
  actualDepartureAt: z.string().optional().nullable(),
  actualArrivalAt: z.string().optional().nullable(),
  distanceNm: z.number().optional().nullable(),
  revenueUsd: z.number().optional().nullable(),
  charterRatePerDay: z.number().optional().nullable(),
  corridorId: z.number().int().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const ExceptionAssignSchema = z.object({
  assignedTo: z.number().int({ message: 'assignedTo must be a valid user ID' }),
});

const ExceptionEscalateSchema = z.object({
  reason: z.string().optional().nullable(),
});

const ExceptionResolveSchema = z.object({
  resolution: z.string().optional().nullable(),
});

const CreateExceptionSchema = z.object({
  orgId: z.number().int().optional().default(1),
  vesselId: z.number().int().optional().nullable(),
  voyageId: z.number().int().optional().nullable(),
  signalId: z.number().int().optional().nullable(),
  exceptionType: z.enum(EXCEPTION_TYPES).optional().default('other'),
  severity: z.enum(EXCEPTION_SEVERITIES).optional().default('medium'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional().nullable(),
  valueAtRiskUsd: z.number().optional().nullable(),
  etaImpactHours: z.number().optional().nullable(),
  costImpactUsd: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const CreateVesselReadinessSchema = z.object({
  orgId: z.number().int().optional().default(1),
  category: z.enum(VOYAGE_READINESS_CATEGORIES).optional().default('maritime'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional().nullable(),
  priority: z.enum(READINESS_PRIORITIES_V).optional().default('medium'),
  notes: z.string().optional().nullable(),
});

async function vesselAuditLog(
  actionType: string,
  entityType: string,
  entityId?: string,
  payload?: Record<string, unknown>,
  actorUserId?: number,
  ip?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
  organizationId?: number,
) {
  const fullPayload: Record<string, unknown> = {
    ...payload,
    ...(ip ? { _ip: ip } : {}),
    ...(before !== undefined ? { _before: before } : {}),
    ...(after !== undefined ? { _after: after } : {}),
  };
  await db
    .insert(auditLogsTable)
    .values({
      actionType,
      entityType,
      entityId,
      payloadJson: fullPayload,
      actorUserId,
      organizationId: organizationId ?? null,
    })
    .catch((err: unknown) => {
      logger.error(
        { err, actionType, entityType, entityId },
        '[vesselAuditLog] Failed to write audit log',
      );
    });
}

const router: IRouter = Router();
const VESSELS_PRODUCT = 'vessels';

function logVesselsEvent(
  orgId: number,
  actorId: number | null,
  actorName: string,
  eventType: string,
  entityType: string,
  entityId: string | null,
) {
  db.insert(eventLogTable)
    .values({
      orgId,
      product: VESSELS_PRODUCT,
      actorId: actorId ?? undefined,
      actorName,
      eventType,
      entityType,
      entityId,
    })
    .catch(() => {});
}

async function triggerAlloyWorkflow(
  orgId: number,
  product: string,
  entityType: string,
  entityId: number,
  triggerData: Record<string, unknown>,
) {
  try {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.orgId, orgId),
          eq(workflowsTable.status, 'active'),
          eq(workflowsTable.product, 'alloy'),
        ),
      )
      .limit(1);

    if (workflow) {
      await db.insert(workflowRunsTable).values({
        orgId,
        workflowId: workflow.id,
        status: 'queued',
        input: { product, entityType, entityId, ...triggerData },
        startedAt: new Date(),
      });
    }
  } catch {}
}

function buildFleetSummary(vessels: any[]) {
  const atSea = vessels.filter((v) => v.status === 'at_sea');
  const inPort = vessels.filter((v) => v.status === 'in_port');
  const maintenance = vessels.filter((v) => v.status === 'maintenance');
  const anchored = vessels.filter((v) => v.status === 'anchored');

  return {
    total: vessels.length,
    atSea: atSea.length,
    inPort: inPort.length,
    maintenance: maintenance.length,
    anchored: anchored.length,
    active: vessels.filter((v) => v.status === 'active').length,
    utilizationRate: vessels.length > 0 ? Math.round((atSea.length / vessels.length) * 100) : 0,
  };
}

function buildMapPayload(vessels: any[], ports: any[], exceptions: any[]) {
  const vesselPoints = vessels
    .filter((v) => v.latitude && v.longitude)
    .map((v) => ({
      id: v.id,
      name: v.name,
      type: 'vessel' as const,
      lat: parseFloat(v.latitude),
      lon: parseFloat(v.longitude),
      status: v.status,
      vesselType: v.vesselType,
      heading: v.heading ? parseFloat(v.heading) : null,
      speed: v.speedOverGround ? parseFloat(v.speedOverGround) : null,
      flag: v.flag,
      hasException: exceptions.some(
        (e) => e.vesselId === v.id && !['resolved', 'dismissed'].includes(e.status),
      ),
    }));

  const portPoints = ports
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: 'port' as const,
      lat: parseFloat(p.latitude),
      lon: parseFloat(p.longitude),
      status: p.status,
      locode: p.locode,
      country: p.country,
    }));

  const exceptionPoints = exceptions
    .filter((e) => !['resolved', 'dismissed'].includes(e.status))
    .filter((e) => {
      const vessel = vessels.find((v) => v.id === e.vesselId);
      return vessel?.latitude && vessel?.longitude;
    })
    .map((e) => {
      const vessel = vessels.find((v) => v.id === e.vesselId);
      return {
        id: e.id,
        type: 'exception' as const,
        lat: parseFloat(vessel?.latitude ?? '0'),
        lon: parseFloat(vessel?.longitude ?? '0'),
        severity: e.severity,
        title: e.title,
        exceptionType: e.exceptionType,
        vesselId: e.vesselId,
      };
    });

  return { vessels: vesselPoints, ports: portPoints, exceptions: exceptionPoints };
}

function calculateEtaDrift(voyage: any): number {
  if (!voyage.scheduledArrivalAt || !voyage.estimatedArrivalAt) return 0;
  const scheduled = new Date(voyage.scheduledArrivalAt).getTime();
  const estimated = new Date(voyage.estimatedArrivalAt).getTime();
  return Math.round((estimated - scheduled) / 3600000);
}

function detectRouteDeviation(
  vessel: any,
  voyage: any,
): { deviated: boolean; severityKm?: number; reason?: string } {
  if (!voyage || !vessel.latitude || !vessel.longitude) return { deviated: false };

  const driftHours = parseFloat(voyage.etaDriftHours ?? '0');
  if (Math.abs(driftHours) > 12) {
    return {
      deviated: true,
      severityKm: Math.abs(driftHours) * 18.52,
      reason: driftHours > 0 ? 'Behind schedule — possible weather detour' : 'Ahead of schedule',
    };
  }
  return { deviated: false };
}

function computeVoyageEconomics(voyage: any) {
  const revenue = parseFloat(voyage.revenueUsd ?? '0');
  const fuelCost = parseFloat(voyage.fuelCostUsd ?? '0');
  const portCosts = parseFloat(voyage.portCostsUsd ?? '0');
  const totalCost = fuelCost + portCosts;
  const grossMargin = revenue > 0 ? ((revenue - totalCost) / revenue) * 100 : 0;
  const dailyRate = parseFloat(voyage.charterRatePerDay ?? '0');

  const scheduledDeparture = voyage.scheduledDepartureAt
    ? new Date(voyage.scheduledDepartureAt)
    : null;
  const scheduledArrival = voyage.scheduledArrivalAt ? new Date(voyage.scheduledArrivalAt) : null;
  const plannedDays =
    scheduledDeparture && scheduledArrival
      ? (scheduledArrival.getTime() - scheduledDeparture.getTime()) / 86400000
      : null;

  return {
    revenueUsd: revenue,
    fuelCostUsd: fuelCost,
    portCostsUsd: portCosts,
    totalCostUsd: totalCost,
    grossMarginPct: Math.round(grossMargin * 10) / 10,
    netProfitUsd: revenue - totalCost,
    charterRatePerDay: dailyRate,
    plannedDurationDays: plannedDays ? Math.round(plannedDays) : null,
    costPerNm: voyage.distanceNm
      ? Math.round((totalCost / parseFloat(voyage.distanceNm)) * 100) / 100
      : null,
  };
}

function buildExceptionQueue(exceptions: any[], vessels: any[]) {
  const active = exceptions.filter((e) => !['resolved', 'dismissed'].includes(e.status));
  const bySeverity = {
    critical: active.filter((e) => e.severity === 'critical'),
    high: active.filter((e) => e.severity === 'high'),
    medium: active.filter((e) => e.severity === 'medium'),
    low: active.filter((e) => e.severity === 'low'),
  };

  const totalValueAtRisk = active
    .filter((e) => e.valueAtRiskUsd)
    .reduce((sum, e) => sum + parseFloat(e.valueAtRiskUsd), 0);

  return {
    total: active.length,
    bySeverity: {
      critical: bySeverity.critical.length,
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
      low: bySeverity.low.length,
    },
    totalValueAtRiskUsd: Math.round(totalValueAtRisk),
    priorityQueue: bySeverity.critical
      .concat(bySeverity.high)
      .slice(0, 10)
      .map((e) => ({
        ...e,
        vesselName: vessels.find((v) => v.id === e.vesselId)?.name ?? 'Unknown',
      })),
  };
}

function buildMaintenanceWatch(vessels: any[]) {
  const maintenance = vessels.filter((v) => v.status === 'maintenance');
  const atRisk = vessels.filter((v) => {
    const age = v.yearBuilt ? new Date().getFullYear() - v.yearBuilt : 0;
    return age > 20 && v.status !== 'maintenance' && v.status !== 'decommissioned';
  });

  return {
    activeMaintenanceCount: maintenance.length,
    atRiskVessels: atRisk.slice(0, 5).map((v) => ({
      id: v.id,
      name: v.name,
      age: v.yearBuilt ? new Date().getFullYear() - v.yearBuilt : null,
      status: v.status,
      vesselType: v.vesselType,
    })),
    maintenanceVessels: maintenance.map((v) => ({
      id: v.id,
      name: v.name,
      vesselType: v.vesselType,
      flag: v.flag,
    })),
  };
}

function buildCorridorIntelligence(corridors: any[]) {
  const highRisk = corridors.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical');
  const activeConflictCorridors = corridors.filter(
    (c) => Array.isArray(c.activeConflicts) && c.activeConflicts.length > 0,
  );

  return {
    totalCorridors: corridors.length,
    highRiskCount: highRisk.length,
    activeConflictCount: activeConflictCorridors.length,
    riskDistribution: {
      critical: corridors.filter((c) => c.riskLevel === 'critical').length,
      high: corridors.filter((c) => c.riskLevel === 'high').length,
      moderate: corridors.filter((c) => c.riskLevel === 'moderate').length,
      low: corridors.filter((c) => c.riskLevel === 'low').length,
    },
    watchList: highRisk.slice(0, 5),
  };
}

router.get(
  '/vessels/platform/dashboard',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      // Non-elevated users get their org from auth (req.tenantOrgId).
      // Elevated admins (tenantOrgId undefined) may pass ?orgId=N to view any org; defaults to 1.
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [vessels, ports, voyages, exceptions, readinessItems, corridors] = await Promise.all([
        db
          .select()
          .from(maritimeVesselsTable)
          .where(eq(maritimeVesselsTable.orgId, orgId))
          .orderBy(desc(maritimeVesselsTable.updatedAt)),
        db
          .select()
          .from(portsTable)
          .where(or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`))
          .limit(100),
        db
          .select()
          .from(voyagesTable)
          .where(eq(voyagesTable.orgId, orgId))
          .orderBy(desc(voyagesTable.createdAt))
          .limit(50),
        db
          .select()
          .from(maritimeExceptionsTable)
          .where(eq(maritimeExceptionsTable.orgId, orgId))
          .orderBy(desc(maritimeExceptionsTable.detectedAt)),
        db
          .select()
          .from(readinessItemsTable)
          .where(
            and(
              eq(readinessItemsTable.orgId, orgId),
              eq(readinessItemsTable.product, VESSELS_PRODUCT),
            ),
          )
          .limit(20),
        db
          .select()
          .from(corridorsTable)
          .where(or(eq(corridorsTable.orgId, orgId), sql`${corridorsTable.orgId} IS NULL`))
          .orderBy(corridorsTable.riskLevel),
      ]);

      const activeVoyages = voyages.filter((v) =>
        ['departed', 'at_sea', 'loading', 'discharging'].includes(v.status),
      );
      const etaDrifts = activeVoyages
        .map((v) => ({
          voyageId: v.id,
          vesselId: v.vesselId,
          driftHours: calculateEtaDrift(v),
        }))
        .filter((d) => Math.abs(d.driftHours) > 6);

      const readinessScore =
        readinessItems.length > 0
          ? Math.round(
              (readinessItems.filter((r) => r.status === 'completed').length /
                readinessItems.length) *
                100,
            )
          : 0;

      sendSuccess(res, {
        fleetSummary: buildFleetSummary(vessels),
        mapPayload: buildMapPayload(vessels, ports, exceptions),
        exceptionQueue: buildExceptionQueue(exceptions, vessels),
        maintenanceWatch: buildMaintenanceWatch(vessels),
        corridorIntelligence: buildCorridorIntelligence(corridors),
        etaDriftAlerts: etaDrifts.slice(0, 10),
        voyageSummary: {
          total: voyages.length,
          active: activeVoyages.length,
          planned: voyages.filter((v) => v.status === 'planned').length,
          completed: voyages.filter((v) => v.status === 'completed').length,
        },
        readinessScore,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to build vessels dashboard');
    }
  },
);

router.get(
  '/vessels/platform/fleet',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);
      const status = req.query.status as string | undefined;

      const vessels = await db
        .select()
        .from(maritimeVesselsTable)
        .where(
          and(
            eq(maritimeVesselsTable.orgId, orgId),
            status
              ? eq(maritimeVesselsTable.status, status as typeof maritimeVesselsTable.status._.data)
              : undefined,
          ),
        )
        .orderBy(maritimeVesselsTable.name);

      sendSuccess(res, { vessels, summary: buildFleetSummary(vessels) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get fleet');
    }
  },
);

router.get(
  '/vessels/platform/map',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [vessels, ports, exceptions] = await Promise.all([
        db.select().from(maritimeVesselsTable).where(eq(maritimeVesselsTable.orgId, orgId)),
        db
          .select()
          .from(portsTable)
          .where(or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`))
          .limit(50),
        db
          .select()
          .from(maritimeExceptionsTable)
          .where(and(eq(maritimeExceptionsTable.orgId, orgId)))
          .orderBy(desc(maritimeExceptionsTable.detectedAt))
          .limit(50),
      ]);

      sendSuccess(res, buildMapPayload(vessels, ports, exceptions));
    } catch (err) {
      handleRouteError(res, err, 'Failed to build map payload');
    }
  },
);

router.get(
  '/vessels/platform/vessels/:id',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [vessel] = await db
        .select()
        .from(maritimeVesselsTable)
        .where(and(eq(maritimeVesselsTable.id, id), eq(maritimeVesselsTable.orgId, orgId)));
      if (!vessel) {
        sendNotFound(res, 'Vessel');
        return;
      }

      const [activeVoyages, recentExceptions] = await Promise.all([
        db
          .select()
          .from(voyagesTable)
          .where(
            and(
              eq(voyagesTable.vesselId, id),
              or(
                eq(voyagesTable.status, 'at_sea'),
                eq(voyagesTable.status, 'departed'),
                eq(voyagesTable.status, 'loading'),
              ),
            ),
          )
          .limit(1),
        db
          .select()
          .from(maritimeExceptionsTable)
          .where(
            and(eq(maritimeExceptionsTable.vesselId, id), eq(maritimeExceptionsTable.orgId, orgId)),
          )
          .orderBy(desc(maritimeExceptionsTable.detectedAt))
          .limit(5),
      ]);

      const currentVoyage = activeVoyages[0];
      const etaDrift = currentVoyage ? calculateEtaDrift(currentVoyage) : null;
      const routeDeviation = currentVoyage ? detectRouteDeviation(vessel, currentVoyage) : null;
      const economics = currentVoyage ? computeVoyageEconomics(currentVoyage) : null;

      sendSuccess(res, {
        vessel,
        currentVoyage: currentVoyage || null,
        etaDriftHours: etaDrift,
        routeDeviation,
        economics,
        recentExceptions,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get vessel detail');
    }
  },
);

router.post(
  '/vessels/platform/vessels',
  authMiddleware(),
  validateBody(
    bodyShape({
      callSign: z.unknown().optional(),
      flag: z.unknown().optional(),
      grossTonnage: z.unknown().optional(),
      imo: z.unknown().optional(),
      latitude: z.unknown().optional(),
      longitude: z.unknown().optional(),
      metadata: z.unknown().optional(),
      mmsi: z.unknown().optional(),
      name: z.unknown().optional(),
      orgId: z.unknown().optional(),
      status: z.unknown().optional(),
      vesselType: z.unknown().optional(),
      yearBuilt: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const commandEnabled = await isFlagEnabled('vessels_command_mode_enabled');
      if (!commandEnabled) {
        res.status(403).json({
          error: 'Feature not available',
          feature: 'vessels_command_mode_enabled',
          message: 'Vessel command mode is not enabled',
        });
        return;
      }
      const parsed = CreateVesselSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid vessel data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const orgId = data.orgId;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const [vessel] = await db
        .insert(maritimeVesselsTable)
        .values({
          orgId,
          name: data.name,
          imo: data.imo ?? null,
          mmsi: data.mmsi ?? null,
          callSign: data.callSign ?? null,
          flag: data.flag ?? null,
          vesselType: data.vesselType,
          yearBuilt: data.yearBuilt ?? null,
          grossTonnage: data.grossTonnage != null ? String(data.grossTonnage) : null,
          status: data.status,
          latitude: data.latitude != null ? String(data.latitude) : null,
          longitude: data.longitude != null ? String(data.longitude) : null,
          metadata: data.metadata ?? null,
        })
        .returning();

      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'vessel.created',
        'maritime_vessel',
        String(vessel.id),
      );
      await vesselAuditLog(
        'vessel.created',
        'maritime_vessel',
        String(vessel.id),
        { name: vessel.name, type: vessel.vesselType },
        req.user.id ?? undefined,
        req.ip,
        undefined,
        undefined,
        orgId,
      );
      sendCreated(res, vessel);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create vessel');
    }
  },
);

router.patch(
  '/vessels/platform/vessels/:id',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(
    bodyShape({
      grossTonnage: z.unknown().optional(),
      heading: z.unknown().optional(),
      latitude: z.unknown().optional(),
      longitude: z.unknown().optional(),
      speedOverGround: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const parsed = UpdateVesselSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid vessel update data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;

      const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
      if (data.latitude != null) updatePayload.latitude = String(data.latitude);
      if (data.longitude != null) updatePayload.longitude = String(data.longitude);
      if (data.grossTonnage != null) updatePayload.grossTonnage = String(data.grossTonnage);
      if (data.heading != null) updatePayload.heading = String(data.heading);
      if (data.speedOverGround != null)
        updatePayload.speedOverGround = String(data.speedOverGround);

      const [vessel] = await db
        .update(maritimeVesselsTable)
        .set(updatePayload as Partial<typeof maritimeVesselsTable.$inferInsert>)
        .where(and(eq(maritimeVesselsTable.id, id), eq(maritimeVesselsTable.orgId, orgId)))
        .returning();

      if (!vessel) {
        sendNotFound(res, 'Vessel');
        return;
      }
      await vesselAuditLog(
        'vessel.updated',
        'maritime_vessel',
        String(id),
        { changes: Object.keys(data) },
        req.user.id ?? undefined,
        req.ip,
        undefined,
        undefined,
        orgId,
      );
      sendSuccess(res, vessel);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update vessel');
    }
  },
);

router.get(
  '/vessels/platform/voyages',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
      const status = req.query.status as string | undefined;
      const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);

      const voyages = await db
        .select()
        .from(voyagesTable)
        .where(
          and(
            eq(voyagesTable.orgId, orgId),
            vesselId ? eq(voyagesTable.vesselId, vesselId) : undefined,
            status
              ? eq(voyagesTable.status, status as typeof voyagesTable.status._.data)
              : undefined,
          ),
        )
        .orderBy(desc(voyagesTable.createdAt))
        .limit(limit);

      const enriched = voyages.map((v) => ({
        ...v,
        etaDriftHours: calculateEtaDrift(v),
        economics: computeVoyageEconomics(v),
      }));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(voyagesTable)
        .where(eq(voyagesTable.orgId, orgId));

      sendSuccess(res, enriched, 200, { total: count, limit });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list voyages');
    }
  },
);

router.get(
  '/vessels/platform/voyages/:id',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [voyage] = await db
        .select()
        .from(voyagesTable)
        .where(and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId)));
      if (!voyage) {
        sendNotFound(res, 'Voyage');
        return;
      }

      const [vessel] = await db
        .select()
        .from(maritimeVesselsTable)
        .where(eq(maritimeVesselsTable.id, voyage.vesselId));
      const routeDeviation = detectRouteDeviation(vessel, voyage);

      sendSuccess(res, {
        ...voyage,
        etaDriftHours: calculateEtaDrift(voyage),
        economics: computeVoyageEconomics(voyage),
        routeDeviation,
        vessel: vessel || null,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get voyage');
    }
  },
);

router.post(
  '/vessels/platform/voyages',
  authMiddleware(),
  validateBody(
    bodyShape({
      cargoDescription: z.unknown().optional(),
      cargoTonnage: z.unknown().optional(),
      cargoType: z.unknown().optional(),
      cargoValueUsd: z.unknown().optional(),
      charterRatePerDay: z.unknown().optional(),
      corridorId: z.unknown().optional(),
      destinationPortId: z.unknown().optional(),
      distanceNm: z.unknown().optional(),
      estimatedArrivalAt: z.unknown().optional(),
      metadata: z.unknown().optional(),
      orgId: z.unknown().optional(),
      originPortId: z.unknown().optional(),
      revenueUsd: z.unknown().optional(),
      scheduledArrivalAt: z.unknown().optional(),
      scheduledDepartureAt: z.unknown().optional(),
      status: z.unknown().optional(),
      vesselId: z.unknown().optional(),
      voyageNumber: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateVoyageSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid voyage data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const orgId = data.orgId;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const [voyage] = await db
        .insert(voyagesTable)
        .values({
          orgId,
          vesselId: data.vesselId,
          voyageNumber: data.voyageNumber ?? null,
          originPortId: data.originPortId ?? null,
          destinationPortId: data.destinationPortId ?? null,
          cargoType: data.cargoType ?? null,
          cargoDescription: data.cargoDescription ?? null,
          cargoTonnage: data.cargoTonnage != null ? String(data.cargoTonnage) : null,
          cargoValueUsd: data.cargoValueUsd != null ? String(data.cargoValueUsd) : null,
          status: data.status,
          scheduledDepartureAt: data.scheduledDepartureAt
            ? new Date(data.scheduledDepartureAt)
            : null,
          scheduledArrivalAt: data.scheduledArrivalAt ? new Date(data.scheduledArrivalAt) : null,
          estimatedArrivalAt: data.estimatedArrivalAt ? new Date(data.estimatedArrivalAt) : null,
          distanceNm: data.distanceNm != null ? String(data.distanceNm) : null,
          revenueUsd: data.revenueUsd != null ? String(data.revenueUsd) : null,
          charterRatePerDay: data.charterRatePerDay != null ? String(data.charterRatePerDay) : null,
          corridorId: data.corridorId ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'voyage.created',
        'voyage',
        String(voyage.id),
      );
      await vesselAuditLog(
        'voyage.created',
        'voyage',
        String(voyage.id),
        { vesselId: data.vesselId, status: data.status },
        req.user.id ?? undefined,
        req.ip,
        undefined,
        undefined,
        orgId,
      );
      sendCreated(res, voyage);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create voyage');
    }
  },
);

router.patch(
  '/vessels/platform/voyages/:id',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(
    bodyShape({
      actualArrivalAt: z.unknown().optional(),
      actualDepartureAt: z.unknown().optional(),
      cargoDescription: z.unknown().optional(),
      cargoTonnage: z.unknown().optional(),
      cargoType: z.unknown().optional(),
      cargoValueUsd: z.unknown().optional(),
      charterRatePerDay: z.unknown().optional(),
      corridorId: z.unknown().optional(),
      destinationPortId: z.unknown().optional(),
      distanceNm: z.unknown().optional(),
      estimatedArrivalAt: z.unknown().optional(),
      metadata: z.unknown().optional(),
      originPortId: z.unknown().optional(),
      revenueUsd: z.unknown().optional(),
      scheduledArrivalAt: z.unknown().optional(),
      scheduledDepartureAt: z.unknown().optional(),
      status: z.unknown().optional(),
      voyageNumber: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const parsed = UpdateVoyageSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid voyage update data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;

      const [before] = await db
        .select({
          status: voyagesTable.status,
          estimatedArrivalAt: voyagesTable.estimatedArrivalAt,
        })
        .from(voyagesTable)
        .where(and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId)));
      if (!before) {
        sendNotFound(res, 'Voyage');
        return;
      }

      const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
      if (data.voyageNumber !== undefined) updatePayload.voyageNumber = data.voyageNumber;
      if (data.originPortId !== undefined) updatePayload.originPortId = data.originPortId;
      if (data.destinationPortId !== undefined)
        updatePayload.destinationPortId = data.destinationPortId;
      if (data.cargoType !== undefined) updatePayload.cargoType = data.cargoType;
      if (data.cargoDescription !== undefined)
        updatePayload.cargoDescription = data.cargoDescription;
      if (data.cargoTonnage !== undefined)
        updatePayload.cargoTonnage = data.cargoTonnage != null ? String(data.cargoTonnage) : null;
      if (data.cargoValueUsd !== undefined)
        updatePayload.cargoValueUsd =
          data.cargoValueUsd != null ? String(data.cargoValueUsd) : null;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.scheduledDepartureAt !== undefined)
        updatePayload.scheduledDepartureAt = data.scheduledDepartureAt
          ? new Date(data.scheduledDepartureAt)
          : null;
      if (data.scheduledArrivalAt !== undefined)
        updatePayload.scheduledArrivalAt = data.scheduledArrivalAt
          ? new Date(data.scheduledArrivalAt)
          : null;
      if (data.estimatedArrivalAt !== undefined)
        updatePayload.estimatedArrivalAt = data.estimatedArrivalAt
          ? new Date(data.estimatedArrivalAt)
          : null;
      if (data.actualDepartureAt !== undefined)
        updatePayload.actualDepartureAt = data.actualDepartureAt
          ? new Date(data.actualDepartureAt)
          : null;
      if (data.actualArrivalAt !== undefined)
        updatePayload.actualArrivalAt = data.actualArrivalAt
          ? new Date(data.actualArrivalAt)
          : null;
      if (data.distanceNm !== undefined)
        updatePayload.distanceNm = data.distanceNm != null ? String(data.distanceNm) : null;
      if (data.revenueUsd !== undefined)
        updatePayload.revenueUsd = data.revenueUsd != null ? String(data.revenueUsd) : null;
      if (data.charterRatePerDay !== undefined)
        updatePayload.charterRatePerDay =
          data.charterRatePerDay != null ? String(data.charterRatePerDay) : null;
      if (data.corridorId !== undefined) updatePayload.corridorId = data.corridorId;
      if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

      const [voyage] = await db
        .update(voyagesTable)
        .set(updatePayload as Partial<typeof voyagesTable.$inferInsert>)
        .where(and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId)))
        .returning();

      if (!voyage) {
        sendNotFound(res, 'Voyage');
        return;
      }
      await vesselAuditLog(
        'voyage.updated',
        'voyage',
        String(id),
        { changes: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined) },
        req.user.id ?? undefined,
        req.ip,
        { status: before.status },
        { status: voyage.status },
        orgId,
      );
      sendSuccess(res, {
        ...voyage,
        etaDriftHours: calculateEtaDrift(voyage),
        economics: computeVoyageEconomics(voyage),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update voyage');
    }
  },
);

router.get(
  '/vessels/platform/exceptions',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);
      const status = req.query.status as string | undefined;
      const severity = req.query.severity as string | undefined;
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
      const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);

      const exceptions = await db
        .select()
        .from(maritimeExceptionsTable)
        .where(
          and(
            eq(maritimeExceptionsTable.orgId, orgId),
            status
              ? eq(
                  maritimeExceptionsTable.status,
                  status as typeof maritimeExceptionsTable.status._.data,
                )
              : undefined,
            severity
              ? eq(
                  maritimeExceptionsTable.severity,
                  severity as typeof maritimeExceptionsTable.severity._.data,
                )
              : undefined,
            vesselId ? eq(maritimeExceptionsTable.vesselId, vesselId) : undefined,
          ),
        )
        .orderBy(desc(maritimeExceptionsTable.detectedAt))
        .limit(limit);

      const vessels = await db
        .select({ id: maritimeVesselsTable.id, name: maritimeVesselsTable.name })
        .from(maritimeVesselsTable)
        .where(eq(maritimeVesselsTable.orgId, orgId));

      const enriched = exceptions.map((e) => ({
        ...e,
        vesselName: vessels.find((v) => v.id === e.vesselId)?.name ?? null,
      }));

      sendSuccess(res, enriched, 200, { total: enriched.length, limit });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list exceptions');
    }
  },
);

router.get(
  '/vessels/platform/exceptions/:id',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [exc] = await db
        .select()
        .from(maritimeExceptionsTable)
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }

      const vessel = exc.vesselId
        ? (
            await db
              .select({
                id: maritimeVesselsTable.id,
                name: maritimeVesselsTable.name,
                vesselType: maritimeVesselsTable.vesselType,
                flag: maritimeVesselsTable.flag,
              })
              .from(maritimeVesselsTable)
              .where(eq(maritimeVesselsTable.id, exc.vesselId))
              .limit(1)
          )[0]
        : null;
      const voyage = exc.voyageId
        ? (
            await db.select().from(voyagesTable).where(eq(voyagesTable.id, exc.voyageId)).limit(1)
          )[0]
        : null;

      sendSuccess(res, { ...exc, vessel: vessel ?? null, voyage: voyage ?? null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get exception');
    }
  },
);

router.post(
  '/vessels/platform/exceptions/:id/acknowledge',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const [before] = await db
        .select({ status: maritimeExceptionsTable.status })
        .from(maritimeExceptionsTable)
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
      if (!before) {
        sendNotFound(res, 'Exception');
        return;
      }

      const [exc] = await db
        .update(maritimeExceptionsTable)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)))
        .returning();

      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'exception.acknowledged',
        'maritime_exception',
        String(id),
      );
      await vesselAuditLog(
        'exception.acknowledged',
        'maritime_exception',
        String(id),
        {},
        req.user.id ?? undefined,
        req.ip,
        { status: before.status },
        { status: 'acknowledged' },
        orgId,
      );
      sendSuccess(res, exc);
    } catch (err) {
      handleRouteError(res, err, 'Failed to acknowledge exception');
    }
  },
);

router.post(
  '/vessels/platform/exceptions/:id/assign',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const parsed = ExceptionAssignSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'assignedTo (number) required', parsed.error.flatten().fieldErrors);
        return;
      }
      const { assignedTo } = parsed.data;

      const [beforeExc] = await db
        .select({
          status: maritimeExceptionsTable.status,
          assignedTo: maritimeExceptionsTable.assignedTo,
        })
        .from(maritimeExceptionsTable)
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
      if (!beforeExc) {
        sendNotFound(res, 'Exception');
        return;
      }

      const [exc] = await db
        .update(maritimeExceptionsTable)
        .set({
          status: 'assigned',
          assignedTo,
          updatedAt: new Date(),
        })
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)))
        .returning();

      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'exception.assigned',
        'maritime_exception',
        String(id),
      );
      await vesselAuditLog(
        'exception.assigned',
        'maritime_exception',
        String(id),
        { assignedTo },
        req.user.id ?? undefined,
        req.ip,
        { status: beforeExc.status, assignedTo: beforeExc.assignedTo },
        { status: 'assigned', assignedTo },
        orgId,
      );
      sendSuccess(res, exc);
    } catch (err) {
      handleRouteError(res, err, 'Failed to assign exception');
    }
  },
);

router.post(
  '/vessels/platform/exceptions/:id/escalate',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(
    bodyShape({
      reason: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const escalateParsed = ExceptionEscalateSchema.safeParse(req.body);
      if (!escalateParsed.success) {
        sendBadRequest(res, 'Invalid escalate data', escalateParsed.error.flatten().fieldErrors);
        return;
      }
      const reason = escalateParsed.data.reason ?? null;

      const [beforeEsc] = await db
        .select({
          status: maritimeExceptionsTable.status,
          severity: maritimeExceptionsTable.severity,
        })
        .from(maritimeExceptionsTable)
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
      if (!beforeEsc) {
        sendNotFound(res, 'Exception');
        return;
      }

      const [exc] = await db
        .update(maritimeExceptionsTable)
        .set({
          status: 'escalated',
          severity: 'critical',
          updatedAt: new Date(),
          metadata: {
            escalatedAt: new Date().toISOString(),
            escalatedBy: req.user.displayName ?? 'system',
            reason,
          },
        })
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)))
        .returning();

      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'exception.escalated',
        'maritime_exception',
        String(id),
      );
      await vesselAuditLog(
        'exception.escalated',
        'maritime_exception',
        String(id),
        { reason },
        req.user.id ?? undefined,
        req.ip,
        { status: beforeEsc.status, severity: beforeEsc.severity },
        { status: 'escalated', severity: 'critical' },
        orgId,
      );
      await triggerAlloyWorkflow(orgId, VESSELS_PRODUCT, 'maritime_exception', id, {
        action: 'escalate',
        exceptionId: id,
        severity: 'critical',
        vesselId: exc.vesselId,
        voyageId: exc.voyageId,
        exceptionType: exc.exceptionType,
        title: exc.title,
      });
      sendSuccess(res, exc);
    } catch (err) {
      handleRouteError(res, err, 'Failed to escalate exception');
    }
  },
);

router.post(
  '/vessels/platform/exceptions/:id/resolve',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(
    bodyShape({
      resolution: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const resolveParsed = ExceptionResolveSchema.safeParse(req.body);
      if (!resolveParsed.success) {
        sendBadRequest(res, 'Invalid resolve data', resolveParsed.error.flatten().fieldErrors);
        return;
      }
      const resolution = resolveParsed.data.resolution ?? null;

      const [beforeRes] = await db
        .select({
          status: maritimeExceptionsTable.status,
          severity: maritimeExceptionsTable.severity,
        })
        .from(maritimeExceptionsTable)
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
      if (!beforeRes) {
        sendNotFound(res, 'Exception');
        return;
      }

      const [exc] = await db
        .update(maritimeExceptionsTable)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          updatedAt: new Date(),
          metadata: { resolution, resolvedBy: req.user.displayName ?? 'system' },
        })
        .where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)))
        .returning();

      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'exception.resolved',
        'maritime_exception',
        String(id),
      );
      await vesselAuditLog(
        'exception.resolved',
        'maritime_exception',
        String(id),
        { resolution },
        req.user.id ?? undefined,
        req.ip,
        { status: beforeRes.status, severity: beforeRes.severity },
        { status: 'resolved', resolution },
        orgId,
      );
      sendSuccess(res, exc);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve exception');
    }
  },
);

router.post(
  '/vessels/platform/exceptions',
  authMiddleware(),
  validateBody(
    bodyShape({
      costImpactUsd: z.unknown().optional(),
      description: z.unknown().optional(),
      etaImpactHours: z.unknown().optional(),
      exceptionType: z.unknown().optional(),
      metadata: z.unknown().optional(),
      orgId: z.unknown().optional(),
      severity: z.unknown().optional(),
      signalId: z.unknown().optional(),
      title: z.unknown().optional(),
      valueAtRiskUsd: z.unknown().optional(),
      vesselId: z.unknown().optional(),
      voyageId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateExceptionSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid exception data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const orgId = data.orgId;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const [exc] = await db
        .insert(maritimeExceptionsTable)
        .values({
          orgId,
          vesselId: data.vesselId ?? null,
          voyageId: data.voyageId ?? null,
          signalId: data.signalId ?? null,
          exceptionType: data.exceptionType,
          severity: data.severity,
          title: data.title,
          description: data.description ?? null,
          status: 'new',
          valueAtRiskUsd: data.valueAtRiskUsd != null ? String(data.valueAtRiskUsd) : null,
          etaImpactHours: data.etaImpactHours != null ? String(data.etaImpactHours) : null,
          costImpactUsd: data.costImpactUsd != null ? String(data.costImpactUsd) : null,
          detectedAt: new Date(),
          metadata: data.metadata ?? null,
        })
        .returning();

      logVesselsEvent(
        orgId,
        req.user.id ?? null,
        req.user.displayName ?? 'system',
        'exception.created',
        'maritime_exception',
        String(exc.id),
      );
      await vesselAuditLog(
        'exception.created',
        'maritime_exception',
        String(exc.id),
        { exceptionType: data.exceptionType, severity: data.severity },
        req.user.id ?? undefined,
        req.ip,
        undefined,
        undefined,
        orgId,
      );
      sendCreated(res, exc);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create exception');
    }
  },
);

router.get(
  '/vessels/platform/routes',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
      const status = req.query.status as string | undefined;

      const voyages = await db
        .select()
        .from(voyagesTable)
        .where(
          and(
            eq(voyagesTable.orgId, orgId),
            vesselId ? eq(voyagesTable.vesselId, vesselId) : undefined,
            status
              ? eq(voyagesTable.status, status as typeof voyagesTable.status._.data)
              : undefined,
          ),
        )
        .orderBy(desc(voyagesTable.createdAt))
        .limit(100);

      const enriched = voyages.map((v) => ({
        ...v,
        etaDriftHours: calculateEtaDrift(v),
        economics: computeVoyageEconomics(v),
      }));

      sendSuccess(res, { routes: enriched, total: enriched.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list routes');
    }
  },
);

router.get(
  '/vessels/platform/routes/:id',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const [voyage] = await db
        .select()
        .from(voyagesTable)
        .where(and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId)));
      if (!voyage) {
        sendNotFound(res, 'Route');
        return;
      }

      const vesselRows = voyage.vesselId
        ? await db
            .select()
            .from(maritimeVesselsTable)
            .where(eq(maritimeVesselsTable.id, voyage.vesselId))
            .limit(1)
        : [];
      const vessel = vesselRows[0] ?? null;
      const routeDeviation = vessel ? detectRouteDeviation(vessel, voyage) : null;

      sendSuccess(res, {
        ...voyage,
        etaDriftHours: calculateEtaDrift(voyage),
        economics: computeVoyageEconomics(voyage),
        routeDeviation,
        vessel: vessel ?? null,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get route');
    }
  },
);

router.get(
  '/vessels/platform/ports',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

      const ports = await db
        .select()
        .from(portsTable)
        .where(or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`))
        .orderBy(portsTable.name);

      sendSuccess(res, ports);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list ports');
    }
  },
);

router.get(
  '/vessels/platform/corridors',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const corridorEnabled = await isFlagEnabled('vessels_corridor_intelligence_enabled');
      if (!corridorEnabled) {
        res.status(403).json({
          error: 'Feature not available',
          feature: 'vessels_corridor_intelligence_enabled',
          fallback: {
            corridors: [],
            intelligence: { totalCorridors: 0, highRiskCount: 0, activeConflictCount: 0 },
          },
        });
        return;
      }
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

      const corridors = await db
        .select()
        .from(corridorsTable)
        .where(or(eq(corridorsTable.orgId, orgId), sql`${corridorsTable.orgId} IS NULL`))
        .orderBy(corridorsTable.riskLevel);

      sendSuccess(res, { corridors, intelligence: buildCorridorIntelligence(corridors) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get corridors');
    }
  },
);

router.get(
  '/vessels/platform/readiness',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgId =
        req.tenantOrgId ?? (req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1);

      const items = await db
        .select()
        .from(readinessItemsTable)
        .where(
          and(
            eq(readinessItemsTable.orgId, orgId),
            eq(readinessItemsTable.product, VESSELS_PRODUCT),
          ),
        )
        .orderBy(readinessItemsTable.priority);

      const byCategory: Record<string, any[]> = {};
      for (const item of items) {
        if (!byCategory[item.category]) byCategory[item.category] = [];
        byCategory[item.category].push(item);
      }

      const overallScore =
        items.length > 0
          ? Math.round((items.filter((i) => i.status === 'completed').length / items.length) * 100)
          : 0;

      sendSuccess(res, { items, byCategory, overallScore, totalItems: items.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get readiness');
    }
  },
);

router.post(
  '/vessels/platform/readiness',
  authMiddleware(),
  validateBody(
    bodyShape({
      category: z.unknown().optional(),
      description: z.unknown().optional(),
      notes: z.unknown().optional(),
      orgId: z.unknown().optional(),
      priority: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateVesselReadinessSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid readiness data', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const orgId = data.orgId;
      if (!req.user || !canAccessOrgRecord(req.user, orgId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const [item] = await db
        .insert(readinessItemsTable)
        .values({
          orgId,
          product: VESSELS_PRODUCT,
          category: data.category,
          title: data.title,
          description: data.description ?? null,
          status: 'not_started',
          priority: data.priority,
          ownerId: req.user.id ?? null,
          notes: data.notes ?? null,
        } as any)
        .returning();

      await vesselAuditLog(
        'readiness.created',
        'vessel_readiness',
        String(item.id),
        { category: data.category, priority: data.priority },
        req.user.id ?? undefined,
        req.ip,
        undefined,
        undefined,
        orgId,
      );
      sendCreated(res, item);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create readiness item');
    }
  },
);

export default router;
