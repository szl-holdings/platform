import { bodyShape } from '@szl-holdings/contracts/common';
import type { IRouter } from 'express';
import { z } from 'zod';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import {
  and,
  authMiddleware,
  db,
  eq,
  handleRouteError,
  pool,
  scoreDistressProperty,
  sendBadRequest,
  sendSuccess,
  sql,
  terraDealsTable,
  terraDistressPropertiesTable,
  terraLeadsTable,
  terraSavedOpportunitiesTable,
} from './_shared.js';

export function register(router: IRouter): void {
  router.post(
    '/terra/distress/ai-score',
    authMiddleware({ required: true }),
    validateBody(
      bodyShape({
        propertyId: z.unknown().optional(),
      }),
    ),
    async (req, res) => {
      try {
        const body = req.body ?? {};
        const { propertyId } = body;

        if (!propertyId) {
          sendBadRequest(res, 'propertyId is required');
          return;
        }

        let propRows = await db
          .select()
          .from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.externalId, String(propertyId)))
          .limit(1);

        if (propRows.length === 0) {
          const numId = parseInt(String(propertyId), 10);
          if (!Number.isNaN(numId)) {
            propRows = await db
              .select()
              .from(terraDistressPropertiesTable)
              .where(eq(terraDistressPropertiesTable.id, numId))
              .limit(1);
          }
        }

        if (propRows.length === 0) {
          res.status(404).json({ error: 'Distress property not found' });
          return;
        }

        const prop = propRows[0]!;
        const result = await scoreDistressProperty(prop);

        await db
          .update(terraDistressPropertiesTable)
          .set({
            opportunityScore: result.score,
            confidenceLevel: result.confidence,
            scoreRationale: result.reasoning,
            updatedAt: new Date(),
          })
          .where(eq(terraDistressPropertiesTable.id, prop.id));

        sendSuccess(res, {
          propertyId: prop.externalId ?? String(prop.id),
          address: prop.address,
          ...result,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to AI-score property');
      }
    },
  );

  router.get('/terra/broker/overview', authMiddleware({ required: false }), async (_req, res) => {
    try {
      const [
        totalDistress,
        savedOps,
        totalLeads,
        convertedLeads,
        totalDeals,
        closedDeals,
        boroughCounts,
        scoreDistribution,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(terraSavedOpportunitiesTable),
        db
          .select({ count: sql<number>`count(*)` })
          .from(terraLeadsTable)
          .where(eq(terraLeadsTable.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(terraLeadsTable)
          .where(and(eq(terraLeadsTable.isActive, true), eq(terraLeadsTable.stage, 'converted'))),
        db
          .select({ count: sql<number>`count(*)` })
          .from(terraDealsTable)
          .where(eq(terraDealsTable.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(terraDealsTable)
          .where(and(eq(terraDealsTable.isActive, true), eq(terraDealsTable.stage, 'closed'))),
        db
          .select({
            borough: terraDistressPropertiesTable.borough,
            count: sql<number>`count(*)`,
            avgScore: sql<number>`round(avg(${terraDistressPropertiesTable.opportunityScore}))`,
          })
          .from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.isActive, true))
          .groupBy(terraDistressPropertiesTable.borough)
          .orderBy(sql`count(*) desc`),
        db
          .select({
            bucket: sql<string>`
            CASE
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
              ELSE '0-39'
            END`,
            count: sql<number>`count(*)`,
          })
          .from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.isActive, true))
          .groupBy(sql`
            CASE
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
              ELSE '0-39'
            END`)
          .orderBy(sql`
            CASE
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
              WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
              ELSE '0-39'
            END desc`),
      ]);

      sendSuccess(res, {
        metrics: {
          totalDistressOpportunities: Number(totalDistress[0]?.count ?? 0),
          savedOpportunities: Number(savedOps[0]?.count ?? 0),
          totalLeads: Number(totalLeads[0]?.count ?? 0),
          convertedLeads: Number(convertedLeads[0]?.count ?? 0),
          leadConversionRate: totalLeads[0]?.count
            ? Math.round(
                (Number(convertedLeads[0]?.count ?? 0) / Number(totalLeads[0].count)) * 100,
              )
            : 0,
          totalDeals: Number(totalDeals[0]?.count ?? 0),
          closedDeals: Number(closedDeals[0]?.count ?? 0),
        },
        topBoroughs: boroughCounts.map((b) => ({
          borough: b.borough,
          count: Number(b.count),
          avgScore: Number(b.avgScore),
        })),
        scoreDistribution: scoreDistribution.map((s) => ({
          range: s.bucket,
          count: Number(s.count),
        })),
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch broker overview');
    }
  });

  router.get(
    '/terra/distress/dashboard',
    authMiddleware({ required: false }),
    async (_req, res) => {
      try {
        const [
          summaryResult,
          byTypeResult,
          byBoroughResult,
          byCountyResult,
          top10Result,
          scoreDistResult,
        ] = await Promise.all([
          pool.query(`
          SELECT
            count(*) as total,
            sum(estimated_value) as total_value,
            round(avg(estimated_value)) as avg_value,
            sum(case when opportunity_score >= 70 then 1 else 0 end) as high_opportunity,
            count(*) filter (where filing_date >= (current_date - interval '30 days')::text) as recent_filings
          FROM terra_distress_properties
          WHERE is_active = true
        `),
          pool.query(`
          SELECT
            distress_type,
            count(*) as count,
            round(avg(opportunity_score)) as avg_score,
            sum(estimated_value) as total_value
          FROM terra_distress_properties
          WHERE is_active = true
          GROUP BY distress_type
          ORDER BY count(*) DESC
        `),
          pool.query(`
          SELECT
            borough,
            count(*) as count,
            round(avg(opportunity_score)) as avg_score,
            sum(case when opportunity_score >= 70 then 1 else 0 end) as high_count
          FROM terra_distress_properties
          WHERE is_active = true
          GROUP BY borough
          ORDER BY count(*) DESC
        `),
          pool.query(`
          SELECT
            county,
            count(*) as count,
            round(avg(opportunity_score)) as avg_score
          FROM terra_distress_properties
          WHERE is_active = true
          GROUP BY county
          ORDER BY count(*) DESC
          LIMIT 15
        `),
          pool.query(`
          SELECT
            id, external_id, address, borough, county, zip_code,
            distress_type, stage, opportunity_score, estimated_value,
            owner_name, owner_type, days_in_distress, confidence_level,
            filing_date, auction_date
          FROM terra_distress_properties
          WHERE is_active = true
          ORDER BY opportunity_score DESC
          LIMIT 10
        `),
          pool.query(`
          SELECT
            CASE
              WHEN opportunity_score >= 85 THEN '85-100'
              WHEN opportunity_score >= 70 THEN '70-84'
              WHEN opportunity_score >= 55 THEN '55-69'
              WHEN opportunity_score >= 40 THEN '40-54'
              ELSE '0-39'
            END as bucket,
            count(*) as count,
            round(avg(opportunity_score)) as avg_score
          FROM terra_distress_properties
          WHERE is_active = true
          GROUP BY 1
          ORDER BY min(opportunity_score) DESC
        `),
        ]);

        const s = summaryResult.rows[0];

        sendSuccess(res, {
          summary: {
            totalDistressedProperties: Number(s.total ?? 0),
            recentFilings30d: Number(s.recent_filings ?? 0),
            totalDistressValue: Number(s.total_value ?? 0),
            avgDistressValue: Math.round(Number(s.avg_value ?? 0)),
            highOpportunity: Number(s.high_opportunity ?? 0),
          },
          byDistressType: byTypeResult.rows.map((t: Record<string, unknown>) => ({
            type: t.distress_type,
            count: Number(t.count),
            avgScore: Number(t.avg_score),
            totalValue: Number(t.total_value),
          })),
          byBorough: byBoroughResult.rows.map((b: Record<string, unknown>) => ({
            borough: b.borough,
            count: Number(b.count),
            avgScore: Number(b.avg_score),
            highOpportunityCount: Number(b.high_count),
          })),
          byCounty: byCountyResult.rows.map((c: Record<string, unknown>) => ({
            county: c.county,
            count: Number(c.count),
            avgScore: Number(c.avg_score),
          })),
          top10Properties: top10Result.rows.map((p: Record<string, unknown>) => ({
            id: p.external_id ?? String(p.id),
            address: p.address,
            borough: p.borough,
            county: p.county,
            zipCode: p.zip_code,
            distressType: p.distress_type,
            stage: p.stage,
            opportunityScore: Number(p.opportunity_score),
            estimatedValue: Number(p.estimated_value),
            ownerName: p.owner_name,
            ownerType: p.owner_type,
            daysInDistress: p.days_in_distress,
            confidenceLevel: p.confidence_level,
            filingDate: p.filing_date,
            auctionDate: p.auction_date,
          })),
          scoreDistribution: scoreDistResult.rows.map((s: Record<string, unknown>) => ({
            range: s.bucket,
            count: Number(s.count),
            avgScore: Number(s.avg_score),
          })),
          generatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch distress dashboard');
      }
    },
  );

  router.get(
    '/terra/investor/opportunities',
    authMiddleware({ required: false }),
    validateQuery(listQuerySchema),
    async (req, res) => {
      try {
        const { minScore, borough, type, limit, offset } = req.query;
        const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
        const scoreThreshold = minScore ? Number(minScore) : 70;

        const conditions = [
          eq(terraDistressPropertiesTable.isActive, true),
          sql`${terraDistressPropertiesTable.opportunityScore} >= ${scoreThreshold}`,
        ];
        if (borough) conditions.push(eq(terraDistressPropertiesTable.borough, str(borough) as any));
        if (type) conditions.push(eq(terraDistressPropertiesTable.distressType, str(type) as any));

        const lim = Math.min(Number(limit ?? 100), 500);
        const off = Number(offset ?? 0);

        const [properties, totalCount, avgScore, totalValue] = await Promise.all([
          db
            .select()
            .from(terraDistressPropertiesTable)
            .where(and(...conditions))
            .orderBy(sql`${terraDistressPropertiesTable.opportunityScore} desc`)
            .limit(lim)
            .offset(off),
          db
            .select({ count: sql<number>`count(*)` })
            .from(terraDistressPropertiesTable)
            .where(and(...conditions)),
          db
            .select({
              avg: sql<number>`round(avg(${terraDistressPropertiesTable.opportunityScore}))`,
            })
            .from(terraDistressPropertiesTable)
            .where(and(...conditions)),
          db
            .select({
              total: sql<number>`sum(${terraDistressPropertiesTable.estimatedValue}::numeric)`,
            })
            .from(terraDistressPropertiesTable)
            .where(and(...conditions)),
        ]);

        sendSuccess(res, {
          summary: {
            totalCount: Number(totalCount[0]?.count ?? 0),
            avgScore: Number(avgScore[0]?.avg ?? 0),
            totalValue: Number(totalValue[0]?.total ?? 0),
          },
          properties: properties.map((p) => ({
            id: p.externalId ?? String(p.id),
            address: p.address,
            borough: p.borough,
            county: p.county,
            zipCode: p.zipCode,
            propertyType: p.propertyType,
            distressType: p.distressType,
            stage: p.stage,
            opportunityScore: p.opportunityScore,
            confidenceLevel: p.confidenceLevel,
            estimatedValue: Number(p.estimatedValue),
            debtAmount: p.debtAmount ? Number(p.debtAmount) : null,
            lienAmount: p.lienAmount ? Number(p.lienAmount) : null,
            equityPercent: p.debtAmount
              ? Math.round(
                  ((Number(p.estimatedValue) - Number(p.debtAmount)) / Number(p.estimatedValue)) *
                    100,
                )
              : null,
            ownerName: p.ownerName,
            ownerType: p.ownerType,
            daysInDistress: p.daysInDistress,
            auctionDate: p.auctionDate,
            filingDate: p.filingDate,
            sqft: p.sqft,
            yearBuilt: p.yearBuilt,
            scoreRationale: p.scoreRationale,
            tags: p.tags,
          })),
          criteria: {
            minScore: scoreThreshold,
            borough: str(borough) ?? 'all',
            type: str(type) ?? 'all',
          },
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch investor opportunities');
      }
    },
  );
}
