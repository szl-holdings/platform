import { bodyShape } from '@szl-holdings/contracts/common';
import { auditLogsTable, db } from '@szl-holdings/db';
import { durableJobQueue } from '@szl-holdings/forge-runtime';
import { type IRouter, Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { ingestCsvBuffer } from '../lib/terra-csv-ingestion';
import {
  getDistressPropertyById,
  getIngestionStats,
  searchDistressAlerts,
  searchDistressedProperties,
} from '../lib/terra-distress-service';
import {
  NYC_EXTENDED_INGESTION_JOB_TYPE,
  type NycExtendedIngestionJobPayload,
} from '../lib/terra-nyc-extended-ingestion';
import { NYC_INGESTION_JOB_TYPE } from '../lib/terra-nyc-ingestion';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

async function auditLog(
  actionType: string,
  entityType: string,
  entityId?: string,
  payload?: Record<string, unknown>,
  actorUserId?: number,
) {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType,
      entityId,
      payloadJson: payload ?? {},
      actorUserId,
    });
  } catch {
    /* non-fatal */
  }
}

router.get(
  '/terra/distress/search',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const {
        borough,
        county,
        zip,
        propertyType,
        distressType,
        minValue,
        maxValue,
        sort,
        q,
        limit,
        offset,
      } = req.query;

      const str = (v: unknown): string | undefined =>
        typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : undefined;
      const properties = await searchDistressedProperties({
        borough: str(borough),
        county: str(county),
        zip: str(zip),
        propertyType: str(propertyType),
        distressType: str(distressType),
        minValue: minValue ? Number(minValue) : undefined,
        maxValue: maxValue ? Number(maxValue) : undefined,
        sort: str(sort),
        q: str(q),
        limit: limit ? Math.min(Number(limit), 500) : 100,
        offset: offset ? Number(offset) : 0,
      });

      sendSuccess(res, {
        source:
          'Terra Distress Intelligence Engine — NYC ACRIS + County Records + Tax Liens + Auction Registry',
        count: properties.length,
        properties,
        fetchedAt: new Date().toISOString(),
        connectors: [
          'NYC ACRIS',
          'Kings/Queens/Bronx/NY/Richmond County Courts',
          'NYC Dept of Finance',
          'FDIC REO',
          'MLS Delta Signal',
          'NYSCEF',
        ],
        dataAbstractionLayer: 'v2.0 — PostgreSQL-backed, real data pipeline',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to search distressed properties');
    }
  },
);

router.get(
  '/terra/distress/property/:id',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
      const property = await getDistressPropertyById(id);

      if (!property) {
        res.status(404).json({ error: 'Distressed property not found', id });
        return;
      }

      const equityPercent = property.debtAmount
        ? Math.round(
            ((property.estimatedValue - property.debtAmount) / property.estimatedValue) * 100,
          )
        : null;

      sendSuccess(res, {
        property,
        analysis: {
          equityPercent,
          debtToValue: property.debtAmount
            ? Math.round((property.debtAmount / property.estimatedValue) * 100)
            : null,
          opportunityWindow:
            property.distressType === 'auction' && property.auctionDate
              ? `Auction ${property.auctionDate} — act now`
              : property.daysInDistress < 90
                ? 'Early stage — direct outreach recommended'
                : property.daysInDistress > 200
                  ? 'Advanced distress — seller likely motivated'
                  : 'Mid-stage — approaching resolution point',
          suggestedStrategy:
            property.opportunityScore >= 85
              ? 'Direct acquisition or note purchase — high priority'
              : property.opportunityScore >= 70
                ? 'Direct outreach to owner — medium priority'
                : 'Monitor — lower priority, add to watchlist',
          aiInsight: `${property.scoreRationale}. Suggested outreach: Contact ${property.ownerName} directly via attorney of record or certified mail. Mention ability to close quickly and take subject to existing debt.`,
        },
        conversionActions: {
          convertToLead: {
            endpoint: '/api/terra/convert/distress-to-lead',
            payload: { propertyId: property.externalId ?? String(property.id) },
            description: 'Create a CRM lead from this distress property',
          },
          convertToDeal: {
            endpoint: '/api/terra/convert/lead-to-deal',
            requiresLeadId: true,
            description: 'Promote an existing lead to a deal (requires convertToLead first)',
          },
          assignAgent: { endpoint: '/api/lyte/assignments', payload: { propertyId: property.id } },
          triggerOutreach: {
            endpoint: '/api/alloy/workflows/trigger',
            payload: { trigger: 'distress-outreach', propertyId: property.id },
          },
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch distress property detail');
    }
  },
);

router.get(
  '/terra/distress/nearby',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { lat, lng, radiusMiles, limit } = req.query;
      const latNum = lat ? Number(lat) : NaN;
      const lngNum = lng ? Number(lng) : NaN;
      const latitude = !Number.isNaN(latNum) && latNum >= -90 && latNum <= 90 ? latNum : null;
      const longitude = !Number.isNaN(lngNum) && lngNum >= -180 && lngNum <= 180 ? lngNum : null;
      const radiusNum = radiusMiles ? Number(radiusMiles) : 2;
      const lim = !Number.isNaN(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 50) : 10;

      let borough: string | undefined;
      if (latitude !== null && longitude !== null) {
        if (latitude > 40.78 && longitude > -73.93) borough = 'Bronx';
        else if (latitude > 40.65 && latitude <= 40.78 && longitude > -73.97 && longitude <= -73.9)
          borough = 'Queens';
        else if (latitude <= 40.65 && longitude > -73.97) borough = 'Brooklyn';
        else if (longitude <= -74.05) borough = 'Staten Island';
        else borough = 'Manhattan';
      }

      const properties = await searchDistressedProperties({
        borough,
        sort: 'opportunityScore',
        limit: lim,
        offset: 0,
      });

      sendSuccess(res, {
        source: 'Terra Nearby Distress Engine — GPS Borough Proximity',
        count: properties.length,
        properties,
        searchParams: {
          lat: latitude,
          lng: longitude,
          radiusMiles: !Number.isNaN(radiusNum) ? radiusNum : 2,
          resolvedBorough: borough ?? 'All',
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch nearby distress properties');
    }
  },
);

router.get(
  '/terra/distress/alerts',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { borough, type, severity, limit } = req.query;

      const alerts = await searchDistressAlerts({
        borough: borough as string | undefined,
        type: type as string | undefined,
        severity: severity as string | undefined,
        limit: limit ? Math.min(Number(limit), 200) : 50,
      });

      sendSuccess(res, {
        alerts,
        count: alerts.length,
        alertRules: [
          {
            rule: 'new-foreclosure-in-zip',
            description: 'New lis pendens filed in watched zip codes',
            active: true,
          },
          {
            rule: 'lien-filed',
            description: 'New tax lien filed on tracked properties',
            active: true,
          },
          { rule: 'auction-approaching', description: 'Auction date within 14 days', active: true },
          {
            rule: 'price-drop-signal',
            description: 'Listing price reduced 5%+ from original',
            active: true,
          },
          {
            rule: 'distressed-listing-added',
            description: 'New distressed property added to engine',
            active: true,
          },
        ],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch distress alerts');
    }
  },
);

router.get(
  '/terra/distress/score',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { id } = req.query;

      let properties;
      if (id) {
        const p = await getDistressPropertyById(id as string);
        if (!p) {
          res.status(404).json({ error: 'Property not found' });
          return;
        }
        properties = [p];
      } else {
        properties = await searchDistressedProperties({ limit: 100 });
      }

      const scores = properties.map((p) => ({
        id: p.id,
        address: p.address,
        borough: p.borough,
        opportunityScore: p.opportunityScore,
        confidenceLevel: p.confidenceLevel,
        scoreRationale: p.scoreRationale,
        scoreBreakdown: {
          distressTypeWeight:
            p.distressType === 'auction' ? 30 : p.distressType === 'pre-foreclosure' ? 25 : 20,
          timeInDistressWeight: Math.min(p.daysInDistress / 10, 20),
          equityWeight: p.debtAmount
            ? Math.round(((p.estimatedValue - p.debtAmount) / p.estimatedValue) * 25)
            : 15,
          locationDemandWeight: ['Manhattan', 'Brooklyn'].includes(p.borough) ? 15 : 10,
          listingHistoryWeight: p.distressType === 'expired-listing' ? 10 : 5,
        },
        investorOpportunityScore: p.opportunityScore,
        likelihoodOfSale:
          p.opportunityScore >= 80
            ? 'High (70-85%)'
            : p.opportunityScore >= 60
              ? 'Medium (40-70%)'
              : 'Low (10-40%)',
      }));

      sendSuccess(res, {
        scores,
        scoringMethodology: {
          version: '2.0',
          factors: [
            'Distress type',
            'Time in distress',
            'Property value vs debt',
            'Borough location demand',
            'Listing history',
            'Price changes',
          ],
          scale: '0–100 (100 = highest opportunity)',
          confidenceLevels: { high: '>80% data completeness', medium: '50–80%', low: '<50%' },
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch opportunity scores');
    }
  },
);

router.post(
  '/terra/distress/ingest/csv',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops', 'analyst', 'seller'),
  upload.single('file'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({ error: "No CSV file uploaded. Use multipart/form-data with field name 'file'." });
        return;
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const sourceLabel = (req.body?.source as string) ?? req.file.originalname ?? 'uploaded_csv';

      await auditLog(
        'csv_upload_started',
        'terra_distress',
        undefined,
        {
          sourceLabel,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        },
        req.user?.id,
      );

      const result = await ingestCsvBuffer(csvContent, sourceLabel, req.user?.id);

      await auditLog(
        'csv_upload_completed',
        'terra_distress',
        String(result.runId),
        {
          sourceLabel,
          recordsInserted: result.recordsInserted,
          recordsSkipped: result.recordsSkipped,
          recordsFailed: result.recordsFailed,
          alertsGenerated: result.alertsGenerated,
        },
        req.user?.id,
      );

      res.status(result.recordsFailed > 0 && result.recordsInserted === 0 ? 422 : 200).json({
        success: result.recordsInserted > 0 || result.recordsSkipped > 0,
        runId: result.runId,
        recordsFetched: result.recordsFetched,
        recordsInserted: result.recordsInserted,
        recordsSkipped: result.recordsSkipped,
        recordsFailed: result.recordsFailed,
        alertsGenerated: result.alertsGenerated,
        errors: result.errors,
        message: `Ingested ${result.recordsInserted} new properties, ${result.recordsSkipped} duplicates skipped, ${result.alertsGenerated} alerts generated.`,
      });
    } catch (err) {
      handleRouteError(res, err, 'CSV ingestion failed');
    }
  },
);

router.post(
  '/terra/distress/ingest/nyc-open-data',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops'),
  validateBody(
    bodyShape({
      filter: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const ALL_SOURCES: Array<
        'acris' | 'acris_master' | 'foreclosure_filings' | 'dof_liens' | 'hpd_violations'
      > = ['acris', 'acris_master', 'foreclosure_filings', 'dof_liens', 'hpd_violations'];
      const VALID_SOURCE_KEYS = new Set(ALL_SOURCES);

      const rawSources = req.body?.sources as string[] | undefined;
      if (rawSources !== undefined) {
        const invalid = rawSources.filter(
          (s) => !VALID_SOURCE_KEYS.has(s as (typeof ALL_SOURCES)[number]),
        );
        if (invalid.length > 0) {
          res.status(400).json({
            error: `Unknown source(s): ${invalid.join(', ')}. Valid: ${ALL_SOURCES.join(', ')}`,
          });
          return;
        }
      }
      const sources = (rawSources as typeof ALL_SOURCES | undefined) ?? ALL_SOURCES;

      await auditLog(
        'nyc_open_data_pull_triggered',
        'terra_distress',
        undefined,
        { sources },
        req.user?.id,
      );

      const job = await durableJobQueue.enqueue(NYC_INGESTION_JOB_TYPE, { sources });

      sendSuccess(res, {
        message: 'NYC Open Data ingestion job enqueued',
        jobId: job.id,
        sources,
        estimatedDurationMs: sources.length * 60000,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enqueue NYC data pull');
    }
  },
);

router.post(
  '/terra/distress/ingest/nyc-extended',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops'),
  validateBody(
    bodyShape({
      filter: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const ALL_SOURCES: NycExtendedIngestionJobPayload['sources'] = [
        'rolling_sales',
        'tax_lien_sale_list',
        'hpd_complaints',
        'dob_violations',
        'nyc_311',
        'acris_parties',
      ];
      const VALID = new Set(ALL_SOURCES);

      const rawSources = req.body?.sources as string[] | undefined;
      if (rawSources !== undefined) {
        const invalid = rawSources.filter(
          (s) => !VALID.has(s as NycExtendedIngestionJobPayload['sources'][number]),
        );
        if (invalid.length > 0) {
          res.status(400).json({
            error: `Unknown source(s): ${invalid.join(', ')}. Valid: ${ALL_SOURCES.join(', ')}`,
          });
          return;
        }
      }
      const sources =
        (rawSources as NycExtendedIngestionJobPayload['sources'] | undefined) ?? ALL_SOURCES;

      await auditLog(
        'nyc_extended_pull_triggered',
        'terra_distress',
        undefined,
        { sources },
        req.user?.id,
      );

      const job = await durableJobQueue.enqueue(NYC_EXTENDED_INGESTION_JOB_TYPE, { sources });

      sendSuccess(res, {
        message: 'NYC Extended Open Data ingestion job enqueued',
        jobId: job.id,
        sources,
        estimatedDurationMs: sources.length * 90000,
        availableSources: {
          rolling_sales: 'NYC DOF Rolling Property Sales (usep-8jbt)',
          tax_lien_sale_list: 'NYC Tax Lien Sale List (9rz4-mjek)',
          hpd_complaints: 'NYC HPD Complaints (uwyv-629c)',
          dob_violations: 'NYC DOB Violations (3h2n-5cm9)',
          nyc_311: 'NYC 311 Property Complaints (erm2-nwe9)',
          acris_parties: 'NYC ACRIS Parties — LLC Ownership Tracing (636b-3b5g)',
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enqueue NYC extended data pull');
    }
  },
);

router.get(
  '/terra/distress/ingestion/stats',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops', 'analyst'),
  async (_req, res) => {
    try {
      const stats = await getIngestionStats();
      sendSuccess(res, stats);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch ingestion stats');
    }
  },
);

export default router;
