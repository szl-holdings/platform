#!/usr/bin/env tsx
/**
 * SZL Holdings — Diagram Generation Script
 *
 * Generates architecture and ecosystem diagrams programmatically as SVG.
 * All diagrams follow the dark-premium aesthetic.
 *
 * Usage:
 *   npx tsx scripts/media/generate-diagrams.ts
 *   npx tsx scripts/media/generate-diagrams.ts --output docs/media/diagrams
 */

import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR =
  process.argv.find((_, i) => process.argv[i - 1] === '--output') || 'docs/media/diagrams';

function generateEcosystemMapSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600" style="background:#0a0a0f;font-family:ui-sans-serif,system-ui,sans-serif">
  <defs>
    <style>
      .label { font-size:11px; fill:#94a3b8; letter-spacing:0.08em; font-weight:500; }
      .product { font-size:14px; fill:#f1f5f9; font-weight:600; }
      .desc { font-size:10px; fill:#64748b; }
      .badge { font-size:9px; font-weight:700; letter-spacing:0.05em; }
      .section-title { font-size:10px; fill:#64748b; letter-spacing:0.12em; font-weight:600; }
    </style>
    <linearGradient id="szlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#b45309;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#92400e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="lyteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d97706;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b45309;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="alloyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background grid -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5" opacity="0.4"/>
  </pattern>
  <rect width="900" height="600" fill="url(#grid)"/>

  <!-- Title -->
  <text x="450" y="40" text-anchor="middle" font-size="20" fill="#f1f5f9" font-weight="700" letter-spacing="-0.02em">SZL Holdings — Platform Ecosystem</text>
  <text x="450" y="60" text-anchor="middle" font-size="11" fill="#64748b" letter-spacing="0.1em">GOVERNED INTELLIGENCE ARCHITECTURE</text>

  <!-- SZL Holdings Core — Center -->
  <rect x="340" y="90" width="220" height="70" rx="8" fill="#1a1f2e" stroke="#b45309" stroke-width="1.5"/>
  <text x="450" y="118" text-anchor="middle" class="section-title">SZL HOLDINGS</text>
  <text x="450" y="138" text-anchor="middle" class="product" fill="#d97706">Platform Holding Company</text>
  <text x="450" y="152" text-anchor="middle" class="desc">Lyte · Counsel · Domain Packs</text>

  <!-- Lyte -->
  <rect x="60" y="220" width="200" height="90" rx="8" fill="#12160d" stroke="#d97706" stroke-width="1.5"/>
  <rect x="60" y="220" width="200" height="4" rx="2" fill="url(#lyteGrad)"/>
  <text x="160" y="248" text-anchor="middle" class="section-title" fill="#d97706">Lyte</text>
  <text x="160" y="266" text-anchor="middle" class="product">Business Observability</text>
  <text x="160" y="281" text-anchor="middle" class="desc">PRISM · Signal Timeline</text>
  <text x="160" y="295" text-anchor="middle" class="desc">Priority Queue · Exec Accountability</text>
  <rect x="72" y="302" width="50" height="14" rx="3" fill="#78350f"/>
  <text x="97" y="313" text-anchor="middle" class="badge" fill="#fbbf24">FLAGSHIP</text>

  <!-- Counsel -->
  <rect x="340" y="220" width="220" height="90" rx="8" fill="#0d1520" stroke="#0ea5e9" stroke-width="1.5"/>
  <rect x="340" y="220" width="220" height="4" rx="2" fill="url(#alloyGrad)"/>
  <text x="450" y="248" text-anchor="middle" class="section-title" fill="#0ea5e9">Counsel</text>
  <text x="450" y="266" text-anchor="middle" class="product">Execution Fabric</text>
  <text x="450" y="281" text-anchor="middle" class="desc">Signal Routing · Approval Matrix</text>
  <text x="450" y="295" text-anchor="middle" class="desc">Audit Trail · Governance Policies</text>
  <rect x="352" y="302" width="50" height="14" rx="3" fill="#0c4a6e"/>
  <text x="377" y="313" text-anchor="middle" class="badge" fill="#38bdf8">FABRIC</text>

  <!-- Aegis -->
  <rect x="60" y="390" width="185" height="80" rx="8" fill="#0f1117" stroke="#6366f1" stroke-width="1.5"/>
  <text x="152" y="418" text-anchor="middle" class="section-title" fill="#818cf8">Aegis</text>
  <text x="152" y="436" text-anchor="middle" class="product">Defense Intelligence</text>
  <text x="152" y="451" text-anchor="middle" class="desc">SOC · SOAR · MITRE ATT&amp;CK</text>
  <rect x="72" y="458" width="60" height="14" rx="3" fill="#312e81"/>
  <text x="102" y="469" text-anchor="middle" class="badge" fill="#a5b4fc">ALPHA</text>

  <!-- Vessels -->
  <rect x="265" y="390" width="185" height="80" rx="8" fill="#0d151f" stroke="#0891b2" stroke-width="1.5"/>
  <text x="357" y="418" text-anchor="middle" class="section-title" fill="#22d3ee">Vessels</text>
  <text x="357" y="436" text-anchor="middle" class="product">Maritime Intelligence</text>
  <text x="357" y="451" text-anchor="middle" class="desc">AIS · Fleet · Sanctions</text>
  <rect x="277" y="458" width="60" height="14" rx="3" fill="#0c4a6e"/>
  <text x="307" y="469" text-anchor="middle" class="badge" fill="#67e8f9">ALPHA</text>

  <!-- Terra -->
  <rect x="470" y="390" width="185" height="80" rx="8" fill="#0d1711" stroke="#16a34a" stroke-width="1.5"/>
  <text x="562" y="418" text-anchor="middle" class="section-title" fill="#4ade80">Terra</text>
  <text x="562" y="436" text-anchor="middle" class="product">Real Estate Intelligence</text>
  <text x="562" y="451" text-anchor="middle" class="desc">Distress · Pipeline · Brokers</text>
  <rect x="482" y="458" width="60" height="14" rx="3" fill="#14532d"/>
  <text x="512" y="469" text-anchor="middle" class="badge" fill="#86efac">ALPHA</text>

  <!-- Carlota Jo -->
  <rect x="675" y="390" width="185" height="80" rx="8" fill="#150e1a" stroke="#9333ea" stroke-width="1.5"/>
  <text x="767" y="418" text-anchor="middle" class="section-title" fill="#c084fc">CARLOTA JO</text>
  <text x="767" y="436" text-anchor="middle" class="product">Advisory Operations</text>
  <text x="767" y="451" text-anchor="middle" class="desc">Client Portal · Premium CRM</text>
  <rect x="687" y="458" width="50" height="14" rx="3" fill="#581c87"/>
  <text x="712" y="469" text-anchor="middle" class="badge" fill="#d8b4fe">LIVE</text>

  <!-- Connection lines -->
  <line x1="340" y1="125" x2="260" y2="220" stroke="#b45309" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
  <line x1="450" y1="160" x2="450" y2="220" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
  <line x1="560" y1="125" x2="590" y2="180" stroke="#b45309" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>

  <line x1="160" y1="310" x2="152" y2="390" stroke="#6366f1" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <line x1="250" y1="265" x2="310" y2="390" stroke="#0891b2" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <line x1="450" y1="310" x2="515" y2="390" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <line x1="560" y1="265" x2="720" y2="390" stroke="#9333ea" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>

  <!-- Footer -->
  <text x="450" y="555" text-anchor="middle" class="desc">TypeScript · React · Expo · PostgreSQL · Drizzle ORM · Vite · Apollo GraphQL · pnpm</text>
  <text x="450" y="572" text-anchor="middle" class="desc">HuggingFace AI · OIDC/PKCE · 11-role RBAC · SCIM 2.0 · Azure AD SSO</text>
  <text x="450" y="590" text-anchor="middle" font-size="8" fill="#334155">© 2026 SZL Holdings — Proprietary &amp; Confidential</text>
</svg>`;
}

function generateSignalToActionSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="900" height="500" style="background:#0a0a0f;font-family:ui-sans-serif,system-ui,sans-serif">
  <defs>
    <style>
      .step-label { font-size:11px; fill:#94a3b8; letter-spacing:0.06em; font-weight:600; }
      .step-title { font-size:13px; fill:#f1f5f9; font-weight:600; }
      .step-desc { font-size:9px; fill:#64748b; }
      .arrow { stroke:#334155; stroke-width:2; fill:none; marker-end:url(#arrowhead); }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#475569"/>
    </marker>
    <marker id="arrowhead-gold" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#d97706"/>
    </marker>
    <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9"/>
    </marker>
  </defs>

  <!-- Background grid -->
  <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5" opacity="0.3"/>
  </pattern>
  <rect width="900" height="500" fill="url(#grid2)"/>

  <!-- Title -->
  <text x="450" y="38" text-anchor="middle" font-size="18" fill="#f1f5f9" font-weight="700" letter-spacing="-0.02em">Signal → Action Architecture</text>
  <text x="450" y="56" text-anchor="middle" font-size="10" fill="#64748b" letter-spacing="0.12em">SZL HOLDINGS PLATFORM · Lyte + Counsel CORE</text>

  <!-- Step 1: Signals -->
  <rect x="30" y="90" width="130" height="120" rx="8" fill="#0f1117" stroke="#334155" stroke-width="1"/>
  <text x="95" y="112" text-anchor="middle" class="step-label" fill="#64748b">01</text>
  <text x="95" y="130" text-anchor="middle" class="step-title">Signals</text>
  <text x="95" y="148" text-anchor="middle" class="step-desc">People drift</text>
  <text x="95" y="162" text-anchor="middle" class="step-desc">Revenue stall</text>
  <text x="95" y="176" text-anchor="middle" class="step-desc">Infra anomaly</text>
  <text x="95" y="190" text-anchor="middle" class="step-desc">Security event</text>
  <text x="95" y="204" text-anchor="middle" class="step-desc">Market shift</text>

  <!-- Arrow 1→2 -->
  <line x1="160" y1="150" x2="195" y2="150" stroke="#475569" stroke-width="2" marker-end="url(#arrowhead)"/>

  <!-- Step 2: Normalization -->
  <rect x="195" y="90" width="130" height="120" rx="8" fill="#0f1117" stroke="#334155" stroke-width="1"/>
  <text x="260" y="112" text-anchor="middle" class="step-label" fill="#64748b">02</text>
  <text x="260" y="130" text-anchor="middle" class="step-title">Normalization</text>
  <text x="260" y="148" text-anchor="middle" class="step-desc">Schema validation</text>
  <text x="260" y="162" text-anchor="middle" class="step-desc">Source tagging</text>
  <text x="260" y="176" text-anchor="middle" class="step-desc">Dedup &amp; merge</text>
  <text x="260" y="190" text-anchor="middle" class="step-desc">Priority scoring</text>
  <text x="260" y="204" text-anchor="middle" class="step-desc">Counsel fabric</text>

  <!-- Arrow 2→3 -->
  <line x1="325" y1="150" x2="360" y2="150" stroke="#d97706" stroke-width="2" marker-end="url(#arrowhead-gold)" opacity="0.8"/>

  <!-- Step 3: Context Engine (Lyte) -->
  <rect x="360" y="80" width="150" height="140" rx="8" fill="#14100a" stroke="#d97706" stroke-width="1.5"/>
  <rect x="360" y="80" width="150" height="4" rx="2" fill="#d97706"/>
  <text x="435" y="104" text-anchor="middle" class="step-label" fill="#d97706">Lyte</text>
  <text x="435" y="122" text-anchor="middle" class="step-title">Context Engine</text>
  <text x="435" y="140" text-anchor="middle" class="step-desc">PRISM correlation</text>
  <text x="435" y="154" text-anchor="middle" class="step-desc">AI inference layer</text>
  <text x="435" y="168" text-anchor="middle" class="step-desc">Evidence packaging</text>
  <text x="435" y="182" text-anchor="middle" class="step-desc">Confidence scoring</text>
  <text x="435" y="196" text-anchor="middle" class="step-desc">Route decision</text>
  <text x="435" y="212" text-anchor="middle" class="step-desc">Signal timeline</text>

  <!-- Arrow 3→4 -->
  <line x1="510" y1="150" x2="545" y2="150" stroke="#0ea5e9" stroke-width="2" marker-end="url(#arrowhead-blue)" opacity="0.8"/>

  <!-- Step 4: Routing -->
  <rect x="545" y="90" width="130" height="120" rx="8" fill="#0d1520" stroke="#0ea5e9" stroke-width="1.5"/>
  <rect x="545" y="90" width="130" height="4" rx="2" fill="#0ea5e9"/>
  <text x="610" y="112" text-anchor="middle" class="step-label" fill="#0ea5e9">Counsel</text>
  <text x="610" y="130" text-anchor="middle" class="step-title">Routing Engine</text>
  <text x="610" y="148" text-anchor="middle" class="step-desc">Policy evaluation</text>
  <text x="610" y="162" text-anchor="middle" class="step-desc">Approval matrix</text>
  <text x="610" y="176" text-anchor="middle" class="step-desc">Escalation rules</text>
  <text x="610" y="190" text-anchor="middle" class="step-desc">Cost controls</text>
  <text x="610" y="204" text-anchor="middle" class="step-desc">SLA enforcement</text>

  <!-- Three branches from routing -->
  <!-- Auto-Execute -->
  <line x1="675" y1="130" x2="750" y2="100" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.7"/>
  <rect x="748" y="70" width="120" height="60" rx="6" fill="#0d1711" stroke="#16a34a" stroke-width="1"/>
  <text x="808" y="95" text-anchor="middle" class="step-title" font-size="11">Auto-Execute</text>
  <text x="808" y="110" text-anchor="middle" class="step-desc">Low-risk · Policy-approved</text>
  <text x="808" y="123" text-anchor="middle" class="step-desc">Immediate action</text>

  <!-- Approval Gate -->
  <line x1="675" y1="150" x2="748" y2="150" stroke="#d97706" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.7"/>
  <rect x="748" y="125" width="120" height="50" rx="6" fill="#14100a" stroke="#d97706" stroke-width="1"/>
  <text x="808" y="148" text-anchor="middle" class="step-title" font-size="11">Approval Gate</text>
  <text x="808" y="163" text-anchor="middle" class="step-desc">Medium risk · Human-in-loop</text>

  <!-- Human Review -->
  <line x1="675" y1="175" x2="750" y2="205" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.7"/>
  <rect x="748" y="185" width="120" height="50" rx="6" fill="#0f1117" stroke="#6366f1" stroke-width="1"/>
  <text x="808" y="208" text-anchor="middle" class="step-title" font-size="11">Human Review</text>
  <text x="808" y="223" text-anchor="middle" class="step-desc">High-risk · Analyst required</text>

  <!-- All converge to Action Execution -->
  <line x1="808" y1="130" x2="808" y2="285" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
  <line x1="808" y1="175" x2="808" y2="285" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
  <line x1="808" y1="235" x2="808" y2="285" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>

  <!-- Action Execution -->
  <rect x="698" y="285" width="220" height="55" rx="8" fill="#0f1117" stroke="#334155" stroke-width="1.5"/>
  <text x="808" y="308" text-anchor="middle" class="step-title">Action Execution</text>
  <text x="808" y="326" text-anchor="middle" class="step-desc">Webhook · API · Notification · Workflow trigger</text>

  <!-- Audit Trail -->
  <line x1="808" y1="340" x2="808" y2="370" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <rect x="698" y="370" width="220" height="55" rx="8" fill="#0a0a0f" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="808" y="393" text-anchor="middle" class="step-title">Immutable Audit Trail</text>
  <text x="808" y="411" text-anchor="middle" class="step-desc">Append-only · Actor · Timestamp · Evidence</text>

  <!-- Domain packs note -->
  <rect x="30" y="310" width="480" height="100" rx="8" fill="#0f1117" stroke="#1e293b" stroke-width="1"/>
  <text x="270" y="334" text-anchor="middle" font-size="10" fill="#64748b" letter-spacing="0.1em">DOMAIN PACKS — SAME ARCHITECTURE, VERTICAL DATA</text>
  <text x="270" y="358" text-anchor="middle" font-size="11" fill="#94a3b8">Aegis (Security)  ·  Vessels (Maritime)  ·  Terra (Real Estate)</text>
  <text x="270" y="376" text-anchor="middle" font-size="9" fill="#475569">Each domain pack connects its vertical signal sources into the same</text>
  <text x="270" y="392" text-anchor="middle" font-size="9" fill="#475569">Lyte + Counsel intelligence and execution spine.</text>

  <!-- Footer -->
  <text x="450" y="460" text-anchor="middle" font-size="9" fill="#334155">© 2026 SZL Holdings — Proprietary Architecture · Not for Distribution</text>
  <text x="450" y="475" text-anchor="middle" font-size="8" fill="#1e293b">9 schema-validated decision types · Policy-gated tool execution · Evidence-backed hybrid retrieval</text>
</svg>`;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const diagrams = [
    { name: 'ecosystem-map.svg', generate: generateEcosystemMapSVG },
    { name: 'signal-to-action-flow.svg', generate: generateSignalToActionSVG },
  ];

  for (const diagram of diagrams) {
    const outputPath = path.join(OUTPUT_DIR, diagram.name);
    const content = diagram.generate();
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
}

main();
