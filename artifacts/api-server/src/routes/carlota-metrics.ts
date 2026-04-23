import { carlotaEngagementsTable, carlotaTeamMembersTable, db } from '@szl-holdings/db';
import { desc, like, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';

/* -----------------------------------------------------------------------
 * Carlota Jo — Public metrics endpoints for dashboard KPIs
 *
 * Serves team capacity and engagement summary data for useConsultingMetrics.
 * Intentionally unauthenticated — same pattern as carlota-time-tracking.ts.
 * Seeded on first request if the table is empty.
 * -----------------------------------------------------------------------*/

const router: IRouter = Router();

// ── Seed data (mirrors operationalData.ts TEAM / ENGAGEMENTS) ─────────────────

const SEED_TEAM = [
  {
    id: 'm1',
    name: 'Carlota Jo',
    title: 'Lead Advisor',
    dayRate: 2200,
    skills: ['Strategy', 'Brand', 'M&A', 'Exec Advisory', 'Healthcare'],
    allocations: [
      { engagement: 'Growth Strategy', client: 'Luminary Brands', pct: 30, weeks: 'Apr–Jun', color: '#B8960C' },
      { engagement: 'M&A Advisory', client: 'Vertex Capital', pct: 40, weeks: 'Apr–May', color: '#7C3AED' },
      { engagement: 'Business Development', client: 'Internal', pct: 20, weeks: 'Ongoing', color: '#94A3B8' },
    ],
    utilisation: 90,
    capacity: 100,
    status: 'optimal' as const,
  },
  {
    id: 'm2',
    name: 'Dr. Priya Rajan',
    title: 'Healthcare Transformation',
    dayRate: 1800,
    skills: ['Digital Transformation', 'EHR', 'Clinical Ops', 'Change Mgmt'],
    allocations: [
      { engagement: 'Digital Health Strategy', client: 'Solaris Health', pct: 60, weeks: 'Jun–Aug', color: '#059669' },
      { engagement: 'Proposal Support', client: 'Internal', pct: 10, weeks: 'Apr', color: '#94A3B8' },
    ],
    utilisation: 70,
    capacity: 100,
    status: 'under' as const,
  },
  {
    id: 'm3',
    name: 'James Whitmore',
    title: 'Brand & Marketing',
    dayRate: 1400,
    skills: ['Brand Strategy', 'DTC', 'Positioning', 'Consumer Insights'],
    allocations: [
      { engagement: 'Brand Repositioning', client: 'Kestrel Brands', pct: 50, weeks: 'May–Jun', color: '#DC2626' },
      { engagement: 'Brand Positioning Sprint', client: 'Kestrel Brands', pct: 20, weeks: 'May', color: '#F87171' },
    ],
    utilisation: 70,
    capacity: 100,
    status: 'under' as const,
  },
  {
    id: 'm4',
    name: 'Sofia Andersson',
    title: 'Financial Services & M&A',
    dayRate: 2200,
    skills: ['M&A Advisory', 'Financial Modelling', 'Market Entry', 'PE'],
    allocations: [
      { engagement: 'M&A Advisory', client: 'Vertex Capital', pct: 80, weeks: 'Apr–May', color: '#7C3AED' },
      { engagement: 'Portfolio Strategy', client: 'Aurelius PE', pct: 20, weeks: 'Apr', color: '#0284C7' },
    ],
    utilisation: 100,
    capacity: 100,
    status: 'over' as const,
  },
  {
    id: 'm5',
    name: 'Kai Okonkwo',
    title: 'Organisational Design',
    dayRate: 1600,
    skills: ['Org Design', 'Culture', 'Leadership Dev', 'HRBP'],
    allocations: [
      { engagement: 'Org Design Phase 2', client: 'Clearfield Manufacturing', pct: 50, weeks: 'Apr–May', color: '#D97706' },
    ],
    utilisation: 50,
    capacity: 100,
    status: 'bench' as const,
  },
];

const SEED_ENGAGEMENTS = [
  {
    externalId: 'eng-seed-e1',
    client: 'Luminary Brands',
    engagement: 'Growth Strategy Phase 2',
    status: 'active',
    feeType: 'fixed',
    contractedValue: '84000',
    invoiced: '42000',
    collected: '42000',
    costToDate: '28400',
    forecastedCost: '58000',
    marginTarget: 38,
    phase: 'Strategy Development',
    rateRealisationPct: 96,
    writeOffs: '1200',
    scopeCreepHours: 8,
    startDate: 'Jan 2026',
    endDate: 'Jun 2026',
    alerts: ['Scope creep detected: 8 uncompensated hours in brand workshop session'],
  },
  {
    externalId: 'eng-seed-e2',
    client: 'Vertex Capital Partners',
    engagement: 'M&A Advisory',
    status: 'active',
    feeType: 'time-and-materials',
    contractedValue: '120000',
    invoiced: '28000',
    collected: '28000',
    costToDate: '19800',
    forecastedCost: '92000',
    marginTarget: 42,
    phase: 'Discovery & Due Diligence',
    rateRealisationPct: 100,
    writeOffs: '0',
    scopeCreepHours: 0,
    startDate: 'Apr 2026',
    endDate: 'Aug 2026',
    alerts: [],
  },
  {
    externalId: 'eng-seed-e3',
    client: 'Aurelius Private Equity',
    engagement: 'Portfolio Strategy Masterclass',
    status: 'complete',
    feeType: 'fixed',
    contractedValue: '16800',
    invoiced: '16800',
    collected: '16800',
    costToDate: '8200',
    forecastedCost: '8200',
    marginTarget: 45,
    phase: 'Completed',
    rateRealisationPct: 100,
    writeOffs: '0',
    scopeCreepHours: 0,
    startDate: 'Mar 2026',
    endDate: 'Mar 2026',
    alerts: [],
  },
  {
    externalId: 'eng-seed-e4',
    client: 'Oasis Wellness',
    engagement: 'Digital Strategy & DTC Build',
    status: 'at-risk',
    feeType: 'fixed',
    contractedValue: '62000',
    invoiced: '46500',
    collected: '40300',
    costToDate: '44200',
    forecastedCost: '68000',
    marginTarget: 35,
    phase: 'Phase 3 — Implementation',
    rateRealisationPct: 81,
    writeOffs: '4800',
    scopeCreepHours: 22,
    startDate: 'Oct 2025',
    endDate: 'Apr 2026',
    alerts: [
      'Budget overrun: forecasted cost £6,000 above contracted value',
      'Rate realisation at 81% — £4,800 written off year-to-date',
      '22 uncompensated hours from scope changes — consider amendment',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureTeamSeeded() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carlotaTeamMembersTable);
  if (count > 0) return;
  await db
    .insert(carlotaTeamMembersTable)
    .values(
      SEED_TEAM.map((m) => ({
        id: m.id,
        name: m.name,
        title: m.title,
        skills: m.skills,
        allocations: m.allocations,
        utilisation: m.utilisation,
        capacity: m.capacity,
        status: m.status,
        dayRate: m.dayRate,
        isSeeded: true,
      })),
    )
    .onConflictDoNothing();
}

/**
 * Seed the `eng-seed-*` engagement rows if they are absent.
 * Real user/org engagements use different externalId patterns (e.g. `eng-{orgId}-{i}`)
 * so this check is safe even when real engagements exist in the table.
 */
async function ensureEngagementsSeeded() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carlotaEngagementsTable)
    .where(sql`external_id LIKE 'eng-seed-%'`);
  if (count > 0) return;
  await db
    .insert(carlotaEngagementsTable)
    .values(SEED_ENGAGEMENTS)
    .onConflictDoNothing();
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/booking/team', async (_req, res) => {
  try {
    await ensureTeamSeeded();
    const rows = await db
      .select()
      .from(carlotaTeamMembersTable)
      .orderBy(carlotaTeamMembersTable.id);
    sendSuccess(res, rows, 200, { total: rows.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list team members');
  }
});

router.get('/booking/engagements-summary', async (_req, res) => {
  try {
    await ensureEngagementsSeeded();
    // Return only seed rows so real org engagements are never leaked via this public endpoint.
    const rows = await db
      .select()
      .from(carlotaEngagementsTable)
      .where(like(carlotaEngagementsTable.externalId, 'eng-seed-%'))
      .orderBy(desc(carlotaEngagementsTable.createdAt));
    const mapped = rows.map((r) => ({
      id: r.externalId,
      client: r.client,
      engagement: r.engagement,
      status: r.status,
      feeType: r.feeType,
      contractedValue: Number(r.contractedValue),
      invoiced: Number(r.invoiced),
      collected: Number(r.collected),
      costToDate: Number(r.costToDate),
      forecastedCost: Number(r.forecastedCost),
      marginTarget: r.marginTarget,
      phase: r.phase,
      rateRealisationPct: r.rateRealisationPct,
      writeOffs: Number(r.writeOffs),
      scopeCreepHours: r.scopeCreepHours,
      startDate: r.startDate,
      endDate: r.endDate,
      alerts: r.alerts ?? [],
    }));
    sendSuccess(res, mapped, 200, { total: mapped.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list engagements summary');
  }
});

export default router;
