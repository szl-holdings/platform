/**
 * seed-document-engine.ts
 *
 * Seeds the document engine tables with demo data:
 *   - documentTemplatesTable: one template per app (terra, aegis, carlota_jo, vessels, alloy)
 *   - contentLibraryBlocksTable: reusable section blocks
 *   - signaturesTable: one demo signed signature for an existing document (if any exist)
 *
 * Run:
 *   npx tsx src/scripts/seed-document-engine.ts
 */

import {
  db,
  documentTemplatesTable,
  contentLibraryBlocksTable,
  documentsTable,
  signaturesTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seedDocumentTemplates() {
  const existing = await db.select().from(documentTemplatesTable).limit(1);
  if (existing.length > 0) {
    console.log("  document_templates: already seeded, skipping");
    return;
  }

  const templates = [
    {
      appSource: "terra",
      title: "Deal Memo",
      slug: "terra-deal-memo",
      description: "Internal deal summary memo for commercial real estate transactions",
      documentType: "deal_memo",
      mergeFields: [
        { key: "{{client_name}}", label: "Client Name", required: true },
        { key: "{{property_address}}", label: "Property Address", required: true },
        { key: "{{deal_value}}", label: "Deal Value", required: true },
        { key: "{{closing_date}}", label: "Closing Date" },
      ],
      contentJson: {
        version: 1,
        blocks: [
          { id: "1", type: "heading1", children: [{ text: "Deal Memorandum" }] },
          { id: "2", type: "paragraph", children: [{ text: "Property: {{property_address}}" }] },
          { id: "3", type: "paragraph", children: [{ text: "Client: {{client_name}}" }] },
          { id: "4", type: "paragraph", children: [{ text: "Value: {{deal_value}}" }] },
          { id: "5", type: "paragraph", children: [{ text: "Closing: {{closing_date}}" }] },
        ],
      },
      isActive: true,
    },
    {
      appSource: "aegis",
      title: "Incident Response Plan",
      slug: "aegis-incident-response",
      description: "Standard incident response plan for security and operational incidents",
      documentType: "incident_response",
      mergeFields: [
        { key: "{{incident_id}}", label: "Incident ID", required: true },
        { key: "{{severity}}", label: "Severity", required: true },
        { key: "{{affected_system}}", label: "Affected System" },
        { key: "{{responder_name}}", label: "Lead Responder" },
      ],
      contentJson: {
        version: 1,
        blocks: [
          { id: "1", type: "heading1", children: [{ text: "Incident Response Plan — {{incident_id}}" }] },
          { id: "2", type: "paragraph", children: [{ text: "Severity: {{severity}}" }] },
          { id: "3", type: "paragraph", children: [{ text: "Affected System: {{affected_system}}" }] },
          { id: "4", type: "heading2", children: [{ text: "Response Actions" }] },
          { id: "5", type: "ordered_list", children: [{ text: "Isolate affected system" }] },
          { id: "6", type: "ordered_list", children: [{ text: "Notify stakeholders" }] },
          { id: "7", type: "ordered_list", children: [{ text: "Begin root cause analysis" }] },
        ],
      },
      isActive: true,
    },
    {
      appSource: "carlota_jo",
      title: "Consulting Agreement",
      slug: "carlota-consulting-agreement",
      description: "Standard consulting engagement agreement with retainer terms",
      documentType: "consulting_agreement",
      mergeFields: [
        { key: "{{client_name}}", label: "Client Name", required: true },
        { key: "{{engagement_start}}", label: "Start Date", required: true },
        { key: "{{retainer_amount}}", label: "Retainer Amount", required: true },
        { key: "{{scope_of_work}}", label: "Scope of Work" },
      ],
      contentJson: {
        version: 1,
        blocks: [
          { id: "1", type: "heading1", children: [{ text: "Consulting Agreement" }] },
          { id: "2", type: "paragraph", children: [{ text: "This agreement is entered into by Carlota Jo Consulting and {{client_name}}." }] },
          { id: "3", type: "heading2", children: [{ text: "Scope of Work" }] },
          { id: "4", type: "paragraph", children: [{ text: "{{scope_of_work}}" }] },
          { id: "5", type: "heading2", children: [{ text: "Compensation" }] },
          { id: "6", type: "paragraph", children: [{ text: "Monthly retainer: {{retainer_amount}}, commencing {{engagement_start}}." }] },
        ],
      },
      isActive: true,
    },
    {
      appSource: "vessels",
      title: "Voyage Charter Party",
      slug: "vessels-voyage-charter",
      description: "Voyage charter party agreement for cargo transportation",
      documentType: "charter_party",
      mergeFields: [
        { key: "{{vessel_name}}", label: "Vessel Name", required: true },
        { key: "{{voyage_number}}", label: "Voyage Number", required: true },
        { key: "{{port_of_departure}}", label: "Port of Departure" },
        { key: "{{port_of_arrival}}", label: "Port of Arrival" },
        { key: "{{cargo_description}}", label: "Cargo Description" },
      ],
      contentJson: {
        version: 1,
        blocks: [
          { id: "1", type: "heading1", children: [{ text: "Voyage Charter Party — {{vessel_name}}" }] },
          { id: "2", type: "paragraph", children: [{ text: "Voyage No: {{voyage_number}}" }] },
          { id: "3", type: "paragraph", children: [{ text: "From: {{port_of_departure}} To: {{port_of_arrival}}" }] },
          { id: "4", type: "heading2", children: [{ text: "Cargo" }] },
          { id: "5", type: "paragraph", children: [{ text: "{{cargo_description}}" }] },
        ],
      },
      isActive: true,
    },
    {
      appSource: "alloy",
      title: "Integration Approval Request",
      slug: "alloy-integration-approval",
      description: "Formal request for integration approval with sign-off workflow",
      documentType: "integration_approval",
      mergeFields: [
        { key: "{{workflow_name}}", label: "Workflow Name", required: true },
        { key: "{{requester}}", label: "Requester", required: true },
        { key: "{{integration_target}}", label: "Integration Target" },
        { key: "{{approval_deadline}}", label: "Approval Deadline" },
      ],
      contentJson: {
        version: 1,
        blocks: [
          { id: "1", type: "heading1", children: [{ text: "Integration Approval Request" }] },
          { id: "2", type: "paragraph", children: [{ text: "Workflow: {{workflow_name}}" }] },
          { id: "3", type: "paragraph", children: [{ text: "Requested by: {{requester}}" }] },
          { id: "4", type: "paragraph", children: [{ text: "Target system: {{integration_target}}" }] },
          { id: "5", type: "paragraph", children: [{ text: "Approval required by: {{approval_deadline}}" }] },
        ],
      },
      isActive: true,
    },
  ];

  await db.insert(documentTemplatesTable).values(templates as typeof documentTemplatesTable.$inferInsert[]);
  console.log(`  document_templates: inserted ${templates.length} templates`);
}

async function seedContentLibrary() {
  const existing = await db.select().from(contentLibraryBlocksTable).limit(1);
  if (existing.length > 0) {
    console.log("  content_library_blocks: already seeded, skipping");
    return;
  }

  const blocks = [
    {
      appSource: "general",
      title: "Confidentiality Notice",
      category: "disclaimer" as const,
      contentJson: {
        version: 1,
        blocks: [
          { id: "cl1", type: "horizontal_rule", children: [{ text: "" }] },
          { id: "cl2", type: "paragraph", children: [{ text: "CONFIDENTIAL: This document contains confidential information intended solely for the named recipient. Any unauthorized disclosure, copying, or distribution is strictly prohibited." }] },
        ],
      },
      tags: ["legal", "confidential", "footer"],
    },
    {
      appSource: "general",
      title: "Signature Block",
      category: "signature_block" as const,
      contentJson: {
        version: 1,
        blocks: [
          { id: "sb1", type: "horizontal_rule", children: [{ text: "" }] },
          { id: "sb2", type: "paragraph", children: [{ text: "Signed: _________________________ Date: _________________" }] },
          { id: "sb3", type: "paragraph", children: [{ text: "Name: {{client_name}}" }] },
          { id: "sb4", type: "paragraph", children: [{ text: "Title: _________________________ Organization: _________________" }] },
        ],
      },
      tags: ["signature", "signing", "legal"],
    },
    {
      appSource: "terra",
      title: "Risk Factors Section",
      category: "standard_terms" as const,
      contentJson: {
        version: 1,
        blocks: [
          { id: "rf1", type: "heading2", children: [{ text: "Risk Factors" }] },
          { id: "rf2", type: "bullet_list", children: [{ text: "Market risk: adverse movements in interest rates or cap rates" }] },
          { id: "rf3", type: "bullet_list", children: [{ text: "Environmental risk: undisclosed contamination or compliance issues" }] },
          { id: "rf4", type: "bullet_list", children: [{ text: "Tenant risk: vacancy, non-renewal, or creditworthiness of key tenants" }] },
          { id: "rf5", type: "bullet_list", children: [{ text: "Execution risk: permitting delays, construction overruns, or financing gaps" }] },
        ],
      },
      tags: ["risk", "analysis", "real-estate"],
    },
    {
      appSource: "aegis",
      title: "Escalation Matrix",
      category: "standard_terms" as const,
      contentJson: {
        version: 1,
        blocks: [
          { id: "em1", type: "heading2", children: [{ text: "Escalation Matrix" }] },
          { id: "em2", type: "table", tableData: [
            ["Severity", "Response Time", "On-Call", "Escalation Path"],
            ["P0 — Critical", "< 15 min", "All teams", "CTO → CEO"],
            ["P1 — High", "< 30 min", "Primary on-call", "Engineering Lead → CTO"],
            ["P2 — Medium", "< 2 hrs", "Rotating on-call", "Team Lead"],
            ["P3 — Low", "< 24 hrs", "Business hours", "Assigned team"],
          ], children: [{ text: "" }] },
        ],
      },
      tags: ["escalation", "incident", "response"],
    },
    {
      appSource: "vessels",
      title: "Laytime Clause",
      category: "legal_clause" as const,
      contentJson: {
        version: 1,
        blocks: [
          { id: "lt1", type: "heading2", children: [{ text: "Laytime & Demurrage" }] },
          { id: "lt2", type: "paragraph", children: [{ text: "Laytime for loading and discharging shall be 72 running hours, Saturdays, Sundays, and holidays included (SHINC). Demurrage, if incurred, shall be at the rate of USD [●] per day pro rata." }] },
          { id: "lt3", type: "paragraph", children: [{ text: "Time shall commence 6 hours after Notice of Readiness (NOR) is tendered, whether in berth or not (WIBON), whether in port or not (WIPON)." }] },
        ],
      },
      tags: ["laytime", "demurrage", "charter", "legal"],
    },
  ];

  await db.insert(contentLibraryBlocksTable).values(blocks as typeof contentLibraryBlocksTable.$inferInsert[]);
  console.log(`  content_library_blocks: inserted ${blocks.length} blocks`);
}

async function seedDemoSignature() {
  // Only seed if there are documents and if there are no existing signatures
  const docs = await db.select().from(documentsTable).limit(1);
  if (docs.length === 0) {
    console.log("  signatures: no documents found, skipping demo signature");
    return;
  }

  const existingSigs = await db.select().from(signaturesTable).limit(1);
  if (existingSigs.length > 0) {
    console.log("  signatures: already seeded, skipping");
    return;
  }

  const doc = docs[0];
  const token = randomUUID();
  await db.insert(signaturesTable).values({
    documentId: doc.id,
    signerEmail: "demo-signer@szlholdings.com",
    signerName: "Alex Meridian",
    signingOrder: 1,
    signingToken: token,
    status: "signed",
    signatureType: "typed",
    signatureData: "Alex Meridian",
    signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    consentGiven: true,
    ipAddress: "127.0.0.1",
    auditHash: randomUUID(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  console.log(`  signatures: inserted demo signed signature for document #${doc.id}`);
}

async function main() {
  console.log("Seeding Document Engine tables…");
  try {
    await seedDocumentTemplates();
    await seedContentLibrary();
    await seedDemoSignature();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
