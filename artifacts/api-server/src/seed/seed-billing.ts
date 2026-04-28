/**
 * seed-billing.ts
 *
 * Seeds realistic billing demo data for the investor analytics dashboard.
 * Inserts billing plans, demo organizations, subscriptions, and invoice.paid
 * revenue events spread across the last 12 months.
 *
 * Idempotent: guarded by a slug check on billing_plans and a per-event
 * idempotency_key on revenue_events. Re-running is safe.
 *
 * Only runs when isSeedDataAllowed() returns true (DEMO_MODE or
 * ENABLE_DEMO_SEED must be set in non-production environments).
 */

import { getRuntimeMode, isSeedDataAllowed } from '@szl-holdings/platform-registry';
import {
  billingPlansTable,
  db,
  organizationsTable,
  revenueEventsTable,
  subscriptionsTable,
} from '@szl-holdings/db';
import { inArray, like, sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: 'demo-starter',
    name: 'Starter',
    description: 'For small teams getting started with AI-assisted operations.',
    priceMonthly: '299.00',
    priceYearly: '2990.00',
    features: ['Up to 5 users', '10 workflows', 'Standard support'],
  },
  {
    slug: 'demo-professional',
    name: 'Professional',
    description: 'For growing teams that need advanced automation and analytics.',
    priceMonthly: '799.00',
    priceYearly: '7990.00',
    features: ['Up to 25 users', '100 workflows', 'Priority support', 'Advanced analytics'],
  },
  {
    slug: 'demo-enterprise',
    name: 'Enterprise',
    description: 'Full-platform access with dedicated infrastructure and SLA guarantees.',
    priceMonthly: '1999.00',
    priceYearly: '19990.00',
    features: [
      'Unlimited users',
      'Unlimited workflows',
      'Dedicated CSM',
      'SSO',
      'Audit logs',
      '99.9% SLA',
    ],
  },
];

// ─── Demo organizations ───────────────────────────────────────────────────────
// 22 orgs across the 12-month window. A mix of plan tiers and statuses.
// monthsAgo = months before "now" the org signed up.
// canceledAfter = months after signup when they canceled (null = still active).

interface DemoOrg {
  slug: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  planSlug: string;
  monthsAgo: number;
  canceledAfter: number | null;
}

const DEMO_ORGS: DemoOrg[] = [
  // Enterprise – all still active (strong retention story)
  { slug: 'demo-nexus-corp', name: 'Nexus Corp', plan: 'enterprise', planSlug: 'demo-enterprise', monthsAgo: 12, canceledAfter: null },
  { slug: 'demo-irongate-capital', name: 'Irongate Capital', plan: 'enterprise', planSlug: 'demo-enterprise', monthsAgo: 11, canceledAfter: null },
  { slug: 'demo-stratosphere-ai', name: 'Stratosphere AI', plan: 'enterprise', planSlug: 'demo-enterprise', monthsAgo: 9, canceledAfter: null },
  { slug: 'demo-meridian-health', name: 'Meridian Health', plan: 'enterprise', planSlug: 'demo-enterprise', monthsAgo: 7, canceledAfter: null },
  { slug: 'demo-vantage-systems', name: 'Vantage Systems', plan: 'enterprise', planSlug: 'demo-enterprise', monthsAgo: 5, canceledAfter: null },

  // Professional – mostly active, two churned
  { slug: 'demo-cobalt-labs', name: 'Cobalt Labs', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 12, canceledAfter: null },
  { slug: 'demo-prism-analytics', name: 'Prism Analytics', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 11, canceledAfter: null },
  { slug: 'demo-harborview-logistics', name: 'Harborview Logistics', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 10, canceledAfter: null },
  { slug: 'demo-cedar-ridge-finance', name: 'Cedar Ridge Finance', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 9, canceledAfter: null },
  { slug: 'demo-verity-solutions', name: 'Verity Solutions', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 8, canceledAfter: null },
  { slug: 'demo-atlas-consulting', name: 'Atlas Consulting', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 7, canceledAfter: 4 },
  { slug: 'demo-summit-digital', name: 'Summit Digital', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 6, canceledAfter: null },
  { slug: 'demo-beacon-realty', name: 'Beacon Realty', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 5, canceledAfter: null },
  { slug: 'demo-quorum-tech', name: 'Quorum Tech', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 4, canceledAfter: 2 },
  { slug: 'demo-nova-intelligence', name: 'Nova Intelligence', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 3, canceledAfter: null },
  { slug: 'demo-parallax-ventures', name: 'Parallax Ventures', plan: 'professional', planSlug: 'demo-professional', monthsAgo: 2, canceledAfter: null },

  // Starter – a couple churned, a few recent
  { slug: 'demo-groundwork-media', name: 'Groundwork Media', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 12, canceledAfter: 5 },
  { slug: 'demo-crestline-studios', name: 'Crestline Studios', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 10, canceledAfter: 3 },
  { slug: 'demo-pinebrook-agency', name: 'Pinebrook Agency', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 8, canceledAfter: null },
  { slug: 'demo-verdant-ops', name: 'Verdant Ops', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 6, canceledAfter: null },
  { slug: 'demo-ridgeline-advisory', name: 'Ridgeline Advisory', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 4, canceledAfter: null },
  { slug: 'demo-trident-cloud', name: 'Trident Cloud', plan: 'starter', planSlug: 'demo-starter', monthsAgo: 2, canceledAfter: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthsBack(n: number): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

function addMonths(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCMonth(next.getUTCMonth() + n);
  return next;
}

/** Generate an idempotency key for a revenue event. */
function revenueKey(orgSlug: string, month: Date): string {
  const y = month.getUTCFullYear();
  const m = String(month.getUTCMonth() + 1).padStart(2, '0');
  return `seed-billing:invoice.paid:${orgSlug}:${y}-${m}`;
}

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedBillingData(): Promise<void> {
  if (!isSeedDataAllowed()) {
    const mode = getRuntimeMode();
    throw new Error(
      `[seed-billing] Attempted to seed demo data in ${mode} mode. ` +
        `Set DEMO_MODE=true or ENABLE_DEMO_SEED=true to enable seeding in non-production environments.`,
    );
  }

  // ── Idempotency guard: skip only if BOTH plans AND revenue events exist ──
  // We check both because on the first run revenue_events may not have existed
  // as a table yet (migration race), leaving plans/orgs seeded but events empty.
  const existingPlans = await db
    .select({ slug: billingPlansTable.slug })
    .from(billingPlansTable)
    .where(
      inArray(
        billingPlansTable.slug,
        PLANS.map((p) => p.slug),
      ),
    );

  const [{ revenueEventCount }] = await db
    .select({ revenueEventCount: sql<number>`count(*)::int` })
    .from(revenueEventsTable)
    .where(like(revenueEventsTable.idempotencyKey, 'seed-billing:%'));

  if (existingPlans.length === PLANS.length && revenueEventCount > 0) {
    logger.info('[seed-billing] Demo billing data already seeded — skipping');
    return;
  }

  logger.info('[seed-billing] Seeding demo billing plans, subscriptions, and revenue events…');

  // ── 1. Billing plans ──────────────────────────────────────────────────────
  const insertedPlans = await db
    .insert(billingPlansTable)
    .values(
      PLANS.map((p) => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        features: p.features,
        isActive: true,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: billingPlansTable.id, slug: billingPlansTable.slug });

  // Build a lookup from slug → id (covers pre-existing rows too)
  const allPlanRows = await db
    .select({ id: billingPlansTable.id, slug: billingPlansTable.slug })
    .from(billingPlansTable)
    .where(
      inArray(
        billingPlansTable.slug,
        PLANS.map((p) => p.slug),
      ),
    );
  const planIdBySlug = Object.fromEntries(allPlanRows.map((r) => [r.slug, r.id]));

  logger.info(
    { inserted: insertedPlans.length },
    '[seed-billing] Billing plans upserted',
  );

  // ── 2. Demo organizations ────────────────────────────────────────────────
  const orgValues = DEMO_ORGS.map((o) => ({
    slug: o.slug,
    name: o.name,
    plan: o.plan,
    status: (o.canceledAfter !== null && o.canceledAfter === 0 ? 'inactive' : 'active') as
      | 'active'
      | 'inactive'
      | 'suspended',
    createdAt: monthsBack(o.monthsAgo),
  }));

  await db.insert(organizationsTable).values(orgValues).onConflictDoNothing();

  // Fetch org IDs
  const orgRows = await db
    .select({ id: organizationsTable.id, slug: organizationsTable.slug })
    .from(organizationsTable)
    .where(
      inArray(
        organizationsTable.slug,
        DEMO_ORGS.map((o) => o.slug),
      ),
    );
  const orgIdBySlug = Object.fromEntries(orgRows.map((r) => [r.slug, r.id]));

  logger.info(
    { count: orgRows.length },
    '[seed-billing] Demo organizations ready',
  );

  // ── 3. Subscriptions ──────────────────────────────────────────────────────
  // Find which demo orgs already have a subscription so we skip those on re-run.
  // subscriptions has no unique constraint on org_id or stripe_subscription_id
  // so we cannot rely on onConflictDoNothing — we must pre-filter instead.
  const demoOrgIds = Object.values(orgIdBySlug).filter(Boolean) as number[];
  const existingSubOrgIds = new Set<number>();

  if (demoOrgIds.length > 0) {
    const existingSubs = await db
      .select({ orgId: subscriptionsTable.orgId })
      .from(subscriptionsTable)
      .where(inArray(subscriptionsTable.orgId, demoOrgIds));
    for (const row of existingSubs) {
      existingSubOrgIds.add(row.orgId);
    }
  }

  const subscriptionValues = DEMO_ORGS.flatMap((o) => {
    const orgId = orgIdBySlug[o.slug];
    const planId = planIdBySlug[o.planSlug];
    if (!orgId || !planId) return [];
    // Skip if this org already has a subscription row (idempotency)
    if (existingSubOrgIds.has(orgId)) return [];

    const createdAt = monthsBack(o.monthsAgo);
    const canceledAt =
      o.canceledAfter !== null ? addMonths(createdAt, o.canceledAfter) : null;

    const periodStart = createdAt;
    const periodEnd = canceledAt ?? new Date();

    return [
      {
        orgId,
        planId,
        status: (canceledAt ? 'canceled' : 'active') as
          | 'active'
          | 'trialing'
          | 'past_due'
          | 'canceled'
          | 'paused',
        stripeSubscriptionId: `demo_sub_${o.slug.replace('demo-', '')}`,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt,
        createdAt,
      },
    ];
  });

  if (subscriptionValues.length > 0) {
    await db.insert(subscriptionsTable).values(subscriptionValues);
  }

  logger.info(
    { count: subscriptionValues.length, skipped: existingSubOrgIds.size },
    '[seed-billing] Demo subscriptions inserted',
  );

  // ── 4. Revenue events (invoice.paid per billing month) ───────────────────
  const revenueEventValues: Array<{
    eventType: 'invoice.paid';
    product: string;
    customerId: string;
    subscriptionId: string;
    invoiceId: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
    occurredAt: Date;
  }> = [];

  const now = new Date();
  const planAmountBySlug: Record<string, string> = Object.fromEntries(
    PLANS.map((p) => [p.slug, p.priceMonthly]),
  );

  for (const org of DEMO_ORGS) {
    const signupDate = monthsBack(org.monthsAgo);
    const cancelDate = org.canceledAfter !== null ? addMonths(signupDate, org.canceledAfter) : null;

    // Walk each billing month the subscription was active
    let billingMonth = new Date(signupDate);
    billingMonth.setUTCDate(1);
    billingMonth.setUTCHours(0, 0, 0, 0);

    const endDate = cancelDate ?? now;

    while (billingMonth <= endDate) {
      // Don't emit future events
      if (billingMonth > now) break;

      const key = revenueKey(org.slug, billingMonth);
      const amount = planAmountBySlug[org.planSlug] ?? '299.00';

      revenueEventValues.push({
        eventType: 'invoice.paid',
        product: 'platform',
        customerId: `demo_cus_${org.slug.replace('demo-', '')}`,
        subscriptionId: `demo_sub_${org.slug.replace('demo-', '')}`,
        invoiceId: `demo_inv_${org.slug.replace('demo-', '')}_${billingMonth.getUTCFullYear()}_${billingMonth.getUTCMonth() + 1}`,
        amount,
        currency: 'usd',
        idempotencyKey: key,
        occurredAt: new Date(billingMonth),
      });

      billingMonth = addMonths(billingMonth, 1);
    }
  }

  if (revenueEventValues.length > 0) {
    await db
      .insert(revenueEventsTable)
      .values(revenueEventValues)
      .onConflictDoNothing();
  }

  logger.info(
    { count: revenueEventValues.length },
    '[seed-billing] Revenue events inserted',
  );

  logger.info(
    {
      plans: PLANS.length,
      orgs: DEMO_ORGS.length,
      subscriptions: subscriptionValues.length,
      revenueEvents: revenueEventValues.length,
    },
    '[seed-billing] Demo billing seed complete',
  );
}
