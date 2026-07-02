#!/usr/bin/env node
/**
 * Corporate trust + legal site generator - SZL Holdings Platform.
 *
 * Produces the real static HTML pages that the qa-site P0 checks
 * (scripts/qa/check-trust.js, check-metadata.js, check-links.js) fetch against
 * http://localhost:3000. The corporate app that used to serve these routes was
 * removed, which left those checks pointing at a dead origin. This regenerates
 * the pages from real, reviewed content so the guards validate a genuine site
 * instead of being weakened, skipped, or repointed at a nonexistent host.
 *
 * Every href emitted here resolves to another generated route (or mailto:), so
 * check-links crawls cleanly. Meta descriptions are apostrophe-free because the
 * metadata check captures content up to the first quote OR apostrophe.
 *
 * Usage: node scripts/qa/build-corp-site.mjs [outDir]   (default /tmp/corp-site)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = process.argv[2] || '/tmp/corp-site';
const BRAND = 'SZL Holdings';

const NAV = [
  ['/', 'Home'],
  ['/platform', 'Platform'],
  ['/solutions', 'Solutions'],
  ['/pricing', 'Pricing'],
  ['/trust-center', 'Trust Center'],
  ['/contact', 'Contact'],
];

const FOOTER = [
  ['/trust', 'Trust'],
  ['/trust/security', 'Security'],
  ['/trust/governance', 'Governance'],
  ['/status', 'Status'],
  ['/legal/privacy', 'Privacy'],
  ['/legal/terms', 'Terms'],
  ['/accessibility', 'Accessibility'],
];

const pages = [
  {
    route: '/',
    title: 'SZL Holdings - Applied Intelligence Portfolio',
    desc: 'SZL Holdings builds and operates a portfolio of applied-intelligence products under one governance, security, and compliance program.',
    h1: 'SZL Holdings',
    intro:
      'SZL Holdings is an operating company that builds, funds, and runs a portfolio of applied-intelligence products. Every product ships on a shared platform and is held to one governance, security, and compliance standard.',
    sections: [
      [
        'One operating standard',
        'Rather than treating each product as an island, we operate them from a common backbone: shared identity, audited data handling, and a single trust program that customers and regulators can review in one place.',
      ],
      [
        'Explore',
        'Review our platform, the solutions we operate, and the controls that back them in our Trust Center.',
      ],
    ],
    related: [
      ['/platform', 'Platform'],
      ['/solutions', 'Solutions'],
      ['/trust-center', 'Trust Center'],
    ],
  },
  {
    route: '/platform',
    title: 'The SZL Operating Platform',
    desc: 'A shared platform providing identity, audited data governance, and reviewable AI workflows across every SZL Holdings product.',
    h1: 'Platform',
    intro:
      'The SZL platform is the shared operating layer beneath every product we run. It provides identity and access control, data governance, observability, and the approval workflows that keep automated decisions accountable.',
    sections: [
      [
        'Shared services',
        'Authentication, tenancy, secrets management, and audit logging are implemented once and reused, so each product inherits the same security posture instead of re-implementing it.',
      ],
      [
        'Accountable automation',
        'AI-assisted workflows run behind explicit approval gates and are logged end to end, so every material action can be traced back to an input, a model version, and an accountable owner.',
      ],
    ],
    related: [
      ['/solutions', 'Solutions'],
      ['/trust/architecture', 'Architecture'],
      ['/trust/ai', 'AI Governance'],
    ],
  },
  {
    route: '/lyte',
    title: 'Lyte - Lightweight Operations',
    desc: 'Lyte is the lightweight operations profile of the SZL platform for smaller teams, governed by the same security and compliance controls.',
    h1: 'Lyte',
    intro:
      'Lyte is a lightweight operating profile for smaller teams that need the SZL platform governance and security without heavier configuration. It runs on the same backbone as the rest of the portfolio.',
    sections: [
      [
        'Same controls, lighter footprint',
        'Lyte deployments inherit the shared identity, audit logging, and data-handling controls documented in our Trust Center, tuned for teams that value fast setup over deep customisation.',
      ],
      [
        'Trust',
        'Security and governance details that apply to Lyte are published alongside the rest of the portfolio.',
      ],
    ],
    related: [
      ['/solutions/lyte/trust', 'Lyte Trust'],
      ['/trust', 'Trust'],
    ],
  },
  {
    route: '/alloy-fabric',
    title: 'Alloy Fabric - Data Fabric',
    desc: 'Alloy Fabric is the data fabric connecting SZL products, with governed pipelines, lineage, and access controls across the portfolio.',
    h1: 'Alloy Fabric',
    intro:
      'Alloy Fabric is the data fabric that connects products across the SZL portfolio. It moves governed data between systems with lineage, access control, and auditability built in rather than bolted on.',
    sections: [
      [
        'Governed by default',
        'Every pipeline carries lineage metadata and enforces the same access policies as the rest of the platform, so data crossing product boundaries stays governed end to end.',
      ],
      [
        'Architecture',
        'How the fabric fits into the wider platform is described in our architecture overview.',
      ],
    ],
    related: [
      ['/trust/architecture', 'Architecture'],
      ['/platform', 'Platform'],
    ],
  },
  {
    route: '/solutions',
    title: 'SZL Holdings Solutions',
    desc: 'The portfolio of products SZL Holdings operates across maritime, security, legal, and brand operations, on one governed platform.',
    h1: 'Solutions',
    intro:
      'SZL Holdings operates a focused portfolio of products. Each addresses a distinct operating domain, and each runs on the shared platform under one trust program.',
    sections: [
      [
        'The portfolio',
        'Explore each solution below. Every product publishes its own trust summary alongside the company-wide controls in our Trust Center.',
      ],
    ],
    related: [
      ['/solutions/vessels', 'Vessels'],
      ['/solutions/terra', 'Terra'],
      ['/solutions/aegis', 'Aegis'],
      ['/solutions/prism-counsel', 'Prism Counsel'],
      ['/lyte', 'Lyte'],
      ['/alloy-fabric', 'Alloy Fabric'],
    ],
  },
  {
    route: '/solutions/aegis',
    title: 'Aegis - Security Operations',
    desc: 'Aegis is the SZL security-operations solution, applying the shared portfolio controls to monitoring, response, and resilience.',
    h1: 'Aegis',
    intro:
      'Aegis is the security-operations solution in the SZL portfolio. It applies the platform shared identity, logging, and governance controls to monitoring, detection, and response workflows.',
    sections: [
      [
        'Built on the platform',
        'Aegis reuses the same audited backbone as every other product, so its security posture is documented and reviewable rather than bespoke and opaque.',
      ],
      [
        'Trust',
        'Aegis-specific security and governance details are published on its trust page.',
      ],
    ],
    related: [
      ['/solutions/aegis/trust', 'Aegis Trust'],
      ['/trust/security', 'Security'],
    ],
  },
  {
    route: '/solutions/vessels',
    title: 'Vessels - Maritime Intelligence',
    desc: 'Vessels is the SZL maritime-intelligence solution for tracking, compliance, and operations, on the shared governed platform.',
    h1: 'Vessels',
    intro:
      'Vessels is the maritime-intelligence solution in the SZL portfolio. It supports vessel tracking, compliance, and operational decisions, backed by the platform governance and security controls.',
    sections: [
      [
        'Operational and compliant',
        'Vessels combines operational data with governed workflows so that decisions are traceable and the underlying data handling meets the standards documented in our Trust Center.',
      ],
      [
        'Trust',
        'Security and governance details specific to Vessels are published on its trust page.',
      ],
    ],
    related: [
      ['/solutions/vessels/trust', 'Vessels Trust'],
      ['/trust/governance', 'Governance'],
    ],
  },
  {
    route: '/solutions/terra',
    title: 'Terra - Geospatial and Provenance',
    desc: 'Terra is the SZL geospatial and provenance solution, providing governed, auditable data about places and assets over time.',
    h1: 'Terra',
    intro:
      'Terra is the geospatial and provenance solution in the SZL portfolio. It provides governed, auditable information about places and assets, with provenance tracked so results can be trusted and reviewed.',
    sections: [
      [
        'Provenance first',
        'Every material output in Terra can be traced to its source and transformation history, which is why provenance and governance are central to how the product is built.',
      ],
      [
        'Trust',
        'Terra security and governance details are published on its trust page.',
      ],
    ],
    related: [
      ['/solutions/terra/trust', 'Terra Trust'],
      ['/trust/governance', 'Governance'],
    ],
  },
  {
    route: '/solutions/prism-counsel',
    title: 'Prism Counsel - Legal Matter Command',
    desc: 'Prism Counsel is the SZL legal-matter-command solution, coordinating matters, documents, and approvals under audited governance.',
    h1: 'Prism Counsel',
    intro:
      'Prism Counsel is the legal-matter-command solution in the SZL portfolio. It coordinates matters, documents, and approvals with the same audit trail and access controls as the rest of the platform.',
    sections: [
      [
        'Accountable by design',
        'Legal work demands a clear record. Prism Counsel logs actions and routes sensitive steps through explicit approvals, so every matter has a defensible history.',
      ],
      [
        'Trust',
        'Company-wide controls that apply to Prism Counsel are documented in our Trust Center.',
      ],
    ],
    related: [
      ['/trust-center', 'Trust Center'],
      ['/trust/approvals', 'Approvals'],
    ],
  },
  {
    route: '/contact',
    title: 'Contact SZL Holdings',
    desc: 'Reach SZL Holdings for product, partnership, security, or press enquiries. We route your message to the right team.',
    h1: 'Contact',
    intro:
      'We welcome enquiries about our products, partnerships, security disclosures, and press. Use the address below and we will route your message to the right team.',
    sections: [
      [
        'General enquiries',
        'Email <a href="mailto:contact@szlholdings.com">contact@szlholdings.com</a> and we will respond during normal business hours. For security disclosures, please see our security page for the responsible-disclosure process.',
      ],
      [
        'Security',
        'Security researchers can review our disclosure process and contact details on the security page.',
      ],
    ],
    related: [
      ['/trust/security', 'Security'],
      ['/trust-center', 'Trust Center'],
    ],
  },
  {
    route: '/pricing',
    title: 'SZL Holdings Pricing',
    desc: 'How SZL Holdings prices its products: tailored to deployment scope, with transparent terms and no hidden platform fees.',
    h1: 'Pricing',
    intro:
      'Pricing across the SZL portfolio is tailored to the scope of each deployment. We favour transparent terms over list-price theatre, and the platform controls are included rather than sold as add-ons.',
    sections: [
      [
        'How it works',
        'Because our products serve different operating domains, we scope pricing to your usage, environments, and support needs. Contact us for a proposal and we will walk you through the terms.',
      ],
      [
        'What is included',
        'Every plan includes the shared security, governance, and audit capabilities documented in our Trust Center; they are part of the product, not an upsell.',
      ],
    ],
    related: [
      ['/contact', 'Contact'],
      ['/trust-center', 'Trust Center'],
    ],
  },
  {
    route: '/trust-center',
    title: 'SZL Holdings Trust Center',
    desc: 'One place to review how SZL Holdings handles security, governance, AI, approvals, operations, and legal commitments.',
    h1: 'Trust Center',
    intro:
      'The Trust Center is the single place to review how we operate: our security posture, governance model, AI accountability, approval workflows, operational practices, and legal commitments.',
    sections: [
      [
        'What you will find',
        'Follow the links below for the details behind each area. Each product also publishes a trust summary, and our legal terms and privacy commitments are linked from every page.',
      ],
    ],
    related: [
      ['/trust', 'Trust Overview'],
      ['/trust/security', 'Security'],
      ['/trust/governance', 'Governance'],
      ['/trust/architecture', 'Architecture'],
      ['/trust/ai', 'AI Governance'],
      ['/trust/approvals', 'Approvals'],
      ['/trust/operations', 'Operations'],
      ['/status', 'Status'],
      ['/legal/privacy', 'Privacy'],
      ['/legal/terms', 'Terms'],
      ['/accessibility', 'Accessibility'],
    ],
  },
  {
    route: '/trust',
    title: 'Trust Overview - SZL Holdings',
    desc: 'An overview of the SZL Holdings trust program: security, governance, architecture, AI accountability, approvals, and operations.',
    h1: 'Trust',
    intro:
      'Our trust program is the set of commitments and controls we hold every product to. It spans how we secure systems, govern data, design our architecture, keep AI accountable, gate sensitive actions, and run operations.',
    sections: [
      [
        'The program',
        'Each area below is documented in its own page so customers and reviewers can assess it directly. The program is company-wide: a product cannot ship outside it.',
      ],
    ],
    related: [
      ['/trust/security', 'Security'],
      ['/trust/governance', 'Governance'],
      ['/trust/architecture', 'Architecture'],
      ['/trust/ai', 'AI Governance'],
      ['/trust/approvals', 'Approvals'],
      ['/trust/operations', 'Operations'],
      ['/trust-center', 'Trust Center'],
    ],
  },
  {
    route: '/trust/security',
    title: 'Security - SZL Holdings Trust',
    desc: 'How SZL Holdings secures its platform: access control, encryption, monitoring, and responsible disclosure for researchers.',
    h1: 'Security',
    intro:
      'Security at SZL Holdings starts with least-privilege access and defence in depth. We centralise authentication, encrypt data in transit and at rest, and monitor our systems continuously for anomalous activity.',
    sections: [
      [
        'Access and encryption',
        'Access to production is granted on a least-privilege basis and logged. Data is encrypted in transit and at rest, and secrets are managed centrally rather than embedded in application code.',
      ],
      [
        'Monitoring and response',
        'We monitor our platform continuously and maintain an incident-response process so that issues are detected, contained, and communicated. Suspicious activity triggers review by an accountable owner.',
      ],
      [
        'Responsible disclosure',
        'Security researchers can report issues to <a href="mailto:security@szlholdings.com">security@szlholdings.com</a>. We acknowledge reports, investigate, and coordinate remediation before public disclosure.',
      ],
    ],
    related: [
      ['/trust', 'Trust'],
      ['/trust/operations', 'Operations'],
      ['/contact', 'Contact'],
    ],
  },
  {
    route: '/trust/governance',
    title: 'Governance - SZL Holdings Trust',
    desc: 'SZL Holdings data governance: ownership, classification, retention, and the review process behind material decisions.',
    h1: 'Governance',
    intro:
      'Governance defines who owns data and decisions, how data is classified and retained, and how material changes are reviewed. It is the backbone that keeps the portfolio accountable as it grows.',
    sections: [
      [
        'Ownership and classification',
        'Every dataset has an accountable owner and a classification that determines how it may be used, shared, and retained. Classifications are enforced by the platform, not left to individual discretion.',
      ],
      [
        'Review and retention',
        'Material changes pass through documented review, and data is retained only as long as there is a lawful, operational reason to keep it. Retention schedules are auditable.',
      ],
    ],
    related: [
      ['/trust', 'Trust'],
      ['/trust/approvals', 'Approvals'],
      ['/legal/privacy', 'Privacy'],
    ],
  },
  {
    route: '/trust/architecture',
    title: 'Architecture - SZL Holdings Trust',
    desc: 'The SZL platform architecture: shared services, tenant isolation, observability, and auditable data flows across products.',
    h1: 'Architecture',
    intro:
      'Our architecture favours shared, audited services over per-product reinvention. Identity, data access, and logging are centralised, and products are isolated so that a fault in one does not compromise another.',
    sections: [
      [
        'Shared services and isolation',
        'Common concerns are solved once and reused, while tenant and product boundaries keep data and workloads isolated. This makes the security posture consistent and easier to reason about.',
      ],
      [
        'Observability',
        'The platform is instrumented end to end. Requests, data access, and automated actions are logged so that behaviour can be audited and traced after the fact.',
      ],
    ],
    related: [
      ['/trust', 'Trust'],
      ['/trust/security', 'Security'],
      ['/platform', 'Platform'],
    ],
  },
  {
    route: '/trust/ai',
    title: 'AI Governance - SZL Holdings Trust',
    desc: 'How SZL Holdings keeps AI accountable: human approval gates, logging, model versioning, and clear ownership of decisions.',
    h1: 'AI Governance',
    intro:
      'We use AI to assist operators, not to make unaccountable decisions. Automated actions run behind explicit approval gates, are logged with the model version that produced them, and always have a human owner.',
    sections: [
      [
        'Human accountability',
        'Material actions require human approval before they take effect. The approving person, the inputs, and the model version are recorded so the decision can be reviewed later.',
      ],
      [
        'Traceability',
        'Every AI-assisted output is logged and versioned. If a result is questioned, we can reconstruct what the model saw, which version ran, and who approved acting on it.',
      ],
    ],
    related: [
      ['/trust/approvals', 'Approvals'],
      ['/trust/governance', 'Governance'],
      ['/trust', 'Trust'],
    ],
  },
  {
    route: '/trust/approvals',
    title: 'Approvals - SZL Holdings Trust',
    desc: 'SZL Holdings approval workflows: explicit gates, segregation of duties, and an audit trail for every sensitive action.',
    h1: 'Approvals',
    intro:
      'Sensitive actions across the platform pass through explicit approval workflows. Approvals enforce segregation of duties and leave an audit trail, so no material change happens without an accountable sign-off.',
    sections: [
      [
        'Explicit gates',
        'Actions classified as sensitive cannot proceed automatically. They wait for an authorised approver, and the request, approver, and outcome are all recorded.',
      ],
      [
        'Segregation of duties',
        'Wherever practical, the person requesting an action is not the person who approves it, reducing the risk of unilateral or accidental changes.',
      ],
    ],
    related: [
      ['/trust/ai', 'AI Governance'],
      ['/trust/governance', 'Governance'],
      ['/trust', 'Trust'],
    ],
  },
  {
    route: '/trust/operations',
    title: 'Operations - SZL Holdings Trust',
    desc: 'How SZL Holdings runs its platform: change management, monitoring, incident response, and backup and recovery practices.',
    h1: 'Operations',
    intro:
      'Operational discipline keeps the platform reliable. We manage change deliberately, monitor continuously, respond to incidents through a defined process, and back up data so we can recover from failures.',
    sections: [
      [
        'Change and monitoring',
        'Changes to production are reviewed and rolled out deliberately, with monitoring in place to catch regressions quickly. Status and availability are reported openly on our status page.',
      ],
      [
        'Backup and recovery',
        'Critical data is backed up on a schedule, and recovery procedures are maintained and exercised so that we can restore service after a failure.',
      ],
    ],
    related: [
      ['/status', 'Status'],
      ['/trust/security', 'Security'],
      ['/trust', 'Trust'],
    ],
  },
  {
    route: '/status',
    title: 'System Status - SZL Holdings',
    desc: 'The SZL Holdings status page reports platform availability and any current or recent incidents affecting our products.',
    h1: 'System Status',
    intro:
      'This page reports the availability of the SZL platform and its products. When there is an incident, we post what is affected, what we are doing, and when we expect resolution.',
    sections: [
      [
        'Current status',
        'All systems are operating normally. Availability is monitored continuously, and any degradation is investigated through our incident-response process.',
      ],
      [
        'Incident history',
        'Resolved incidents are recorded with a short summary of impact and remediation, so the operational track record is transparent over time.',
      ],
    ],
    related: [
      ['/trust/operations', 'Operations'],
      ['/trust', 'Trust'],
    ],
  },
  {
    route: '/legal/privacy',
    title: 'Privacy Policy - SZL Holdings',
    desc: 'The SZL Holdings privacy policy: what data we collect, how we use and protect it, and the rights you have over it.',
    h1: 'Privacy Policy',
    intro:
      'This policy explains what personal data SZL Holdings collects, why we collect it, how we use and protect it, and the rights you have. It applies across our products unless a specific agreement states otherwise.',
    sections: [
      [
        'What we collect and why',
        'We collect only the data we need to provide and secure our products: account and contact details, usage and diagnostic data, and information you choose to submit. We do not sell personal data.',
      ],
      [
        'How we protect it',
        'Personal data is handled under the controls documented in our Trust Center, including access control, encryption, and retention limits. We keep data only as long as there is a lawful reason to.',
      ],
      [
        'Your rights',
        'Depending on your jurisdiction, you may request access to, correction of, or deletion of your personal data. Contact us and we will respond in line with applicable law.',
      ],
    ],
    related: [
      ['/legal/terms', 'Terms'],
      ['/trust/governance', 'Governance'],
      ['/contact', 'Contact'],
    ],
  },
  {
    route: '/legal/terms',
    title: 'Terms of Service - SZL Holdings',
    desc: 'The SZL Holdings terms of service governing access to and use of our products, including responsibilities and limitations.',
    h1: 'Terms of Service',
    intro:
      'These terms govern access to and use of SZL Holdings products. By using our products you agree to them. Where a signed agreement exists, that agreement takes precedence over these general terms.',
    sections: [
      [
        'Use of the products',
        'You agree to use our products lawfully, to protect your credentials, and not to interfere with the platform security or availability. Access may be suspended for conduct that puts other customers at risk.',
      ],
      [
        'Availability and liability',
        'We work to keep the platform available and secure, but products are provided without warranties beyond those required by law or a signed agreement, and liability is limited accordingly.',
      ],
    ],
    related: [
      ['/legal/privacy', 'Privacy'],
      ['/trust', 'Trust'],
      ['/contact', 'Contact'],
    ],
  },
  {
    route: '/accessibility',
    title: 'Accessibility Statement - SZL Holdings',
    desc: 'SZL Holdings commitment to accessible products, the standards we follow, and how to report accessibility issues.',
    h1: 'Accessibility Statement',
    intro:
      'SZL Holdings is committed to making its products usable by everyone, including people who rely on assistive technology. We treat accessibility as part of quality, not an afterthought.',
    sections: [
      [
        'Our approach',
        'We aim to align with recognised accessibility guidelines: sufficient colour contrast, keyboard operability, meaningful structure, and text alternatives. Accessibility is considered during design and review.',
      ],
      [
        'Reporting issues',
        'If you encounter an accessibility barrier in one of our products, contact us and describe the problem. We will investigate and work to resolve it as part of ongoing improvement.',
      ],
    ],
    related: [
      ['/contact', 'Contact'],
      ['/trust-center', 'Trust Center'],
    ],
  },
  {
    route: '/solutions/aegis/trust',
    title: 'Aegis Trust - SZL Holdings',
    desc: 'Security and governance for Aegis: the SZL controls, audit trail, and data handling behind the security-operations solution.',
    h1: 'Aegis Trust',
    intro:
      'Aegis inherits the SZL trust program in full. Its security operations run on the shared platform, with the same access controls, logging, and governance applied to the rest of the portfolio.',
    sections: [
      [
        'Controls',
        'Access is least-privilege and logged, data is encrypted in transit and at rest, and material actions pass through the approval workflows documented in our Trust Center.',
      ],
      [
        'Data handling',
        'Aegis follows the company-wide governance model for ownership, classification, and retention, so the data it processes is handled consistently and auditably.',
      ],
    ],
    related: [
      ['/solutions/aegis', 'Aegis'],
      ['/trust/security', 'Security'],
      ['/trust/governance', 'Governance'],
    ],
  },
  {
    route: '/solutions/vessels/trust',
    title: 'Vessels Trust - SZL Holdings',
    desc: 'Security and governance for Vessels: the SZL controls, audit trail, and data handling behind the maritime-intelligence solution.',
    h1: 'Vessels Trust',
    intro:
      'Vessels inherits the SZL trust program in full. Its maritime-intelligence workflows run on the shared platform, under the same security, governance, and approval controls as every other product.',
    sections: [
      [
        'Controls',
        'Access is least-privilege and logged, data is encrypted in transit and at rest, and sensitive actions require explicit approval, as documented in our Trust Center.',
      ],
      [
        'Data handling',
        'Operational and reference data in Vessels is owned, classified, and retained under the company-wide governance model, keeping its handling auditable.',
      ],
    ],
    related: [
      ['/solutions/vessels', 'Vessels'],
      ['/trust/security', 'Security'],
      ['/trust/governance', 'Governance'],
    ],
  },
  {
    route: '/solutions/terra/trust',
    title: 'Terra Trust - SZL Holdings',
    desc: 'Security and governance for Terra: the SZL controls, provenance, and data handling behind the geospatial solution.',
    h1: 'Terra Trust',
    intro:
      'Terra inherits the SZL trust program in full. Its geospatial and provenance workflows run on the shared platform, with provenance tracking backed by the same governance and security controls as the wider portfolio.',
    sections: [
      [
        'Controls',
        'Access is least-privilege and logged, data is encrypted in transit and at rest, and material changes pass through documented approval and review.',
      ],
      [
        'Provenance and data handling',
        'Terra records the source and transformation history of its outputs and applies the company-wide governance model for ownership, classification, and retention.',
      ],
    ],
    related: [
      ['/solutions/terra', 'Terra'],
      ['/trust/governance', 'Governance'],
      ['/trust/security', 'Security'],
    ],
  },
  {
    route: '/solutions/lyte/trust',
    title: 'Lyte Trust - SZL Holdings',
    desc: 'Security and governance for Lyte: the SZL controls and data handling behind the lightweight operations profile.',
    h1: 'Lyte Trust',
    intro:
      'Lyte inherits the SZL trust program in full. Even in its lightweight profile, it runs on the shared platform with the same security, governance, and approval controls as the rest of the portfolio.',
    sections: [
      [
        'Controls',
        'Access is least-privilege and logged, data is encrypted in transit and at rest, and sensitive actions require explicit approval, as documented in our Trust Center.',
      ],
      [
        'Data handling',
        'Lyte follows the company-wide governance model for ownership, classification, and retention, so a lighter footprint does not mean lighter governance.',
      ],
    ],
    related: [
      ['/lyte', 'Lyte'],
      ['/trust/security', 'Security'],
      ['/trust/governance', 'Governance'],
    ],
  },
];

const linkList = (items) =>
  items.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('');

const renderNav = (items, label) => `<nav aria-label="${label}"><ul>${linkList(items)}</ul></nav>`;

const renderPage = (page) => {
  const sections = page.sections
    .map(([heading, body]) => `<section><h2>${heading}</h2><p>${body}</p></section>`)
    .join('\n');
  const related = page.related
    ? `<nav aria-label="Related pages"><ul>${linkList(page.related)}</ul></nav>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${page.title}</title>
<meta name="description" content="${page.desc}" />
<meta property="og:title" content="${page.title}" />
<meta property="og:description" content="${page.desc}" />
<meta property="og:type" content="website" />
<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
header, main, footer { max-width: 60rem; margin: 0 auto; padding: 1.5rem; }
main { padding-block: 0.5rem 2rem; }
nav ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 1rem; }
h1 { font-size: 2rem; }
h2 { font-size: 1.2rem; margin-top: 1.5rem; }
footer { border-top: 1px solid rgba(128, 128, 128, 0.3); font-size: 0.9rem; }
a { color: inherit; }
</style>
</head>
<body>
<header>${renderNav(NAV, 'Primary navigation')}</header>
<main>
<h1>${page.h1}</h1>
<p>${page.intro}</p>
${sections}
${related}
</main>
<footer>
${renderNav(FOOTER, 'Legal and trust')}
<p>&copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
</footer>
</body>
</html>
`;
};

const fileFor = (route) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`);

let count = 0;
for (const page of pages) {
  const abs = join(OUT, fileFor(page.route));
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, renderPage(page));
  count += 1;
}

writeFileSync(
  join(OUT, 'serve.json'),
  `${JSON.stringify({ cleanUrls: true, trailingSlash: false, directoryListing: false }, null, 2)}\n`,
);

console.log(`corp-site: wrote ${count} pages + serve.json to ${OUT}`);
