/**
 * In-Memory Knowledge-Base Embedding Adapter
 *
 * Thin wrapper around the shared InMemoryEmbeddingAdapter from retrieval-core,
 * seeded with the platform KB articles.  Used by the retrieval proof-chain
 * endpoint so the full two-stage pipeline runs without a remote ML service.
 */

import { InMemoryEmbeddingAdapter } from '@szl-holdings/retrieval-core';

export const kbEmbeddingAdapter = new InMemoryEmbeddingAdapter(
  [
    {
      chunkId: 'kb-getting-started-lyte',
      sourceId: 'kb/getting-started-lyte',
      content:
        'Getting started with Lyte Decision Intelligence. Lyte connects to existing approval queues task systems workflow tools. First integration signal configuration. Operational signals data source onboarding.',
      metadata: { title: 'Getting started with Decision Intelligence', category: 'Getting Started' },
    },
    {
      chunkId: 'kb-alloy-audit-trail',
      sourceId: 'kb/alloy-audit-trail',
      content:
        'Understanding the Alloy Proof Chain. Every action in Alloy generates an immutable audit record. Records every action approval inference with complete lineage. Data model retention policy export options. Compliance governance audit.',
      metadata: { title: 'Alloy Proof Chain', category: 'Governance' },
    },
    {
      chunkId: 'kb-sso-setup',
      sourceId: 'kb/sso-setup',
      content:
        'Setting up SSO with Azure AD. Configure single sign-on using Azure Active Directory or any OIDC-compatible identity provider. SCIM provisioning role mapping. OpenID Connect PKCE authentication security.',
      metadata: { title: 'SSO Setup with Azure AD', category: 'Authentication' },
    },
    {
      chunkId: 'kb-billing-plans',
      sourceId: 'kb/billing-plans',
      content:
        'Understanding billing and plan limits. Plan tiers seat limits usage metering upgrade subscription. Billing metered per seat per feature entitlement. Current period view. Upgrade process.',
      metadata: { title: 'Billing and Plan Limits', category: 'Billing' },
    },
    {
      chunkId: 'kb-data-export',
      sourceId: 'kb/data-export',
      content:
        'Exporting your data GDPR portability. Request full export organization data or submit GDPR erasure request. CCPA right to access export delete data. Export erasure request through platform.',
      metadata: { title: 'Data Export (GDPR)', category: 'Data & Privacy' },
    },
    {
      chunkId: 'kb-webhook-setup',
      sourceId: 'kb/webhook-setup',
      content:
        'Configuring outbound webhooks. Send real-time events to systems using SZL Holdings webhook system. Endpoint registration signature verification retry behavior. Real-time notifications.',
      metadata: { title: 'Outbound Webhooks', category: 'Integrations' },
    },
    {
      chunkId: 'kb-retrieval-pipeline',
      sourceId: 'kb/retrieval-pipeline',
      content:
        'Two-stage retrieval pipeline. Stage 1 embedding pass dense vector query. Stage 2 cross-encoder reranker. Reciprocal Rank Fusion RRF. Modality filtering text screenshot diagram audio transcript. Proof chain evidence lineage provenance.',
      metadata: { title: 'Retrieval Pipeline Architecture', category: 'AI Architecture' },
    },
    {
      chunkId: 'kb-memory-scopes',
      sourceId: 'kb/memory-scopes',
      content:
        'Governed memory scopes. Session memory ephemeral per-session. Domain memory 90-day TTL. Executive memory consolidated cross-domain. Compliance memory append-only 7-year retention immutable audit trail.',
      metadata: { title: 'Governed Memory Scopes', category: 'AI Architecture' },
    },
    {
      chunkId: 'kb-vessels-ais',
      sourceId: 'kb/vessels-ais',
      content:
        'Maritime intelligence Vessels. AIS signal processing pipeline. Route monitoring anomaly detection alert bus. Signal latency target 200ms. Fleet tracking port risk maritime compliance.',
      metadata: { title: 'Vessels Signal Processing', category: 'Maritime' },
    },
    {
      chunkId: 'kb-paragon-defense',
      sourceId: 'kb/paragon-defense',
      content:
        'Aegis defense and intelligence command. Threat intelligence fusion. Anomaly detection. Real-time threat monitoring. Security incident response. Classification confidential restricted.',
      metadata: { title: 'Aegis Defense Intelligence', category: 'Defense' },
    },
  ],
  'szl-kb-tfidf-v1',
);
