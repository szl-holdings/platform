import { db, supportKnowledgeArticlesTable } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const DEFAULT_KB_ARTICLES = [
  {
    slug: 'getting-started-lyte',
    title: 'Getting started with KORA',
    category: 'Getting Started',
    summary: 'Learn how to connect your first data source and surface operational signals in KORA.',
    body: 'KORA connects to your existing approval queues, task systems, and workflow tools. This guide walks through your first integration and signal configuration.',
    tags: ['lyte', 'onboarding', 'integrations'],
    viewCount: 142,
    isPublished: true,
  },
  {
    slug: 'alloy-audit-trail',
    title: 'Understanding the Alloy Proof Chain',
    category: 'Governance',
    summary:
      'Every action in Alloy generates an immutable audit record. Learn how to view and export your proof chain.',
    body: 'The Alloy Proof Chain records every action, approval, and inference with complete lineage. This article explains the data model, retention policy, and export options.',
    tags: ['alloy', 'audit', 'compliance'],
    viewCount: 98,
    isPublished: true,
  },
  {
    slug: 'sso-setup',
    title: 'Setting up SSO with Azure AD',
    category: 'Authentication',
    summary:
      'Configure single sign-on using Azure Active Directory or any OIDC-compatible identity provider.',
    body: 'SZL Holdings supports OpenID Connect (OIDC) with PKCE. This guide covers Azure AD configuration, SCIM provisioning setup, and role mapping.',
    tags: ['sso', 'azure', 'oidc', 'security'],
    viewCount: 217,
    isPublished: true,
  },
  {
    slug: 'billing-plans',
    title: 'Understanding billing and plan limits',
    category: 'Billing',
    summary:
      'Learn about plan tiers, seat limits, usage metering, and how to upgrade your subscription.',
    body: 'Billing is metered per seat and per feature entitlement. This article explains how usage is calculated, how to view your current period, and how to upgrade.',
    tags: ['billing', 'plans', 'seats'],
    viewCount: 76,
    isPublished: true,
  },
  {
    slug: 'data-export',
    title: 'Exporting your data (GDPR / portability)',
    category: 'Data & Privacy',
    summary: "Request a full export of your organization's data or submit a GDPR erasure request.",
    body: 'Under GDPR and CCPA, you have the right to access, export, and delete your data. This article explains how to initiate an export or erasure request through the platform.',
    tags: ['gdpr', 'ccpa', 'data', 'privacy', 'export'],
    viewCount: 63,
    isPublished: true,
  },
  {
    slug: 'webhook-setup',
    title: 'Configuring outbound webhooks',
    category: 'Integrations',
    summary: 'Send real-time events to your systems using the SZL Holdings webhook system.',
    body: 'Webhooks let you receive real-time notifications when key events occur in your workspace. This guide covers endpoint registration, signature verification, and retry behavior.',
    tags: ['webhooks', 'integrations', 'events'],
    viewCount: 54,
    isPublished: true,
  },
];

export async function seedKnowledgeBase(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportKnowledgeArticlesTable);

    if (count > 0) {
      logger.info({ count }, '[seed-kb] Knowledge base already has articles — skipping seed');
      return;
    }

    await db
      .insert(supportKnowledgeArticlesTable)
      .values(DEFAULT_KB_ARTICLES)
      .onConflictDoNothing();
    logger.info({ seeded: DEFAULT_KB_ARTICLES.length }, '[seed-kb] Knowledge base articles seeded');
  } catch (err) {
    logger.warn({ err }, '[seed-kb] Knowledge base seed failed (non-fatal)');
  }
}
