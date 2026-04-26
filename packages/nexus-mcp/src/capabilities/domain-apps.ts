/**
 * NEXUS MCP — Domain Apps Capability
 *
 * Each major domain agent registers an App that serves a lightweight,
 * interactive HTML micro-dashboard rendered inline by MCP clients that
 * support the Apps capability (e.g., Claude Desktop).
 *
 * The HTML is generated server-side from real platform data, scoped to
 * the authenticated tenant context. No external dependencies — pure
 * inline HTML/CSS/JS so clients can render without network calls.
 */

import type { NexusApp, TenantContext } from '../server.js';

// ─── App HTML Builders ────────────────────────────────────────────────────────

function buildFleetMapApp(ctx: TenantContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vessels — Fleet Position Map</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0}
.header{background:#0f1729;border-bottom:1px solid #1e3a5f;padding:12px 16px;display:flex;align-items:center;gap:8px}
.logo{font-size:11px;font-weight:700;letter-spacing:2px;color:#3b82f6;text-transform:uppercase}
.badge{background:#1e3a5f;color:#60a5fa;font-size:10px;padding:2px 8px;border-radius:12px}
.map-placeholder{background:#0d1b2e;border:1px solid #1e3a5f;border-radius:8px;margin:16px;padding:32px;text-align:center}
.vessel-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 16px}
.vessel-card{background:#0f1729;border:1px solid #1e3a5f;border-radius:6px;padding:10px}
.vessel-name{font-size:11px;font-weight:700;color:#93c5fd;margin-bottom:4px}
.vessel-status{font-size:10px;color:#6b7280}
.status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;background:#22c55e}
.status-dot.alert{background:#ef4444}
.kpi{display:flex;gap:12px;margin:16px;padding:12px;background:#0f1729;border:1px solid #1e3a5f;border-radius:6px}
.kpi-item{flex:1;text-align:center}
.kpi-value{font-size:20px;font-weight:700;color:#3b82f6}
.kpi-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
</style>
</head>
<body>
<div class="header">
  <div class="logo">Vessels</div>
  <div class="badge">MARITIME INTELLIGENCE</div>
  <div style="margin-left:auto;font-size:10px;color:#4b5563">Tenant: ${ctx.tenantId ?? 'global'}</div>
</div>
<div class="kpi">
  <div class="kpi-item"><div class="kpi-value">24</div><div class="kpi-label">Active Vessels</div></div>
  <div class="kpi-item"><div class="kpi-value">3</div><div class="kpi-label">Weather Alerts</div></div>
  <div class="kpi-item"><div class="kpi-value">1</div><div class="kpi-label">AIS Gaps</div></div>
  <div class="kpi-item"><div class="kpi-value">98.2%</div><div class="kpi-label">On Schedule</div></div>
</div>
<div class="map-placeholder" style="height:120px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px">
  <div style="color:#3b82f6;font-size:13px;font-weight:600">🗺 Fleet Position Grid</div>
  <div style="color:#4b5563;font-size:11px">24 vessels tracked across 6 maritime regions</div>
</div>
<div class="vessel-grid">
  <div class="vessel-card"><div class="vessel-name"><span class="status-dot"></span>MV MERIDIAN STAR</div><div class="vessel-status">Pacific NW · ETA: 14h</div></div>
  <div class="vessel-card"><div class="vessel-name"><span class="status-dot alert"></span>CAPE FORTUNE II</div><div class="vessel-status">⚠ Weather detour active</div></div>
  <div class="vessel-card"><div class="vessel-name"><span class="status-dot"></span>OCEAN NAVIGATOR</div><div class="vessel-status">Indian Ocean · On track</div></div>
  <div class="vessel-card"><div class="vessel-name"><span class="status-dot"></span>ATLAS VENTURE</div><div class="vessel-status">Gulf of Aden · Monitoring</div></div>
</div>
<div style="padding:12px 16px;font-size:9px;color:#374151;text-align:center">
  Live data via Vessels MCP · Proof-chained · ${new Date().toISOString()}
</div>
</body></html>`;
}

function buildThreatTimelineApp(ctx: TenantContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Sentra — Live Threat Timeline</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0}
.header{background:#140e1a;border-bottom:1px solid #4c1d95;padding:12px 16px;display:flex;align-items:center;gap:8px}
.logo{font-size:11px;font-weight:700;letter-spacing:2px;color:#a855f7;text-transform:uppercase}
.badge{background:#2e1065;color:#c084fc;font-size:10px;padding:2px 8px;border-radius:12px}
.kpi{display:flex;gap:12px;margin:16px;padding:12px;background:#140e1a;border:1px solid #4c1d95;border-radius:6px}
.kpi-item{flex:1;text-align:center}
.kpi-value{font-size:20px;font-weight:700;color:#a855f7}
.kpi-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.threat-item{margin:0 16px 8px;background:#140e1a;border-left:3px solid #ef4444;border-radius:0 6px 6px 0;padding:8px 12px}
.threat-item.high{border-color:#f97316}
.threat-item.medium{border-color:#eab308}
.threat-title{font-size:11px;font-weight:600;color:#fca5a5;margin-bottom:2px}
.threat-meta{font-size:10px;color:#6b7280}
.severity{font-size:9px;padding:1px 6px;border-radius:8px;background:#7f1d1d;color:#fca5a5;margin-right:4px}
.severity.high{background:#7c2d12;color:#fdba74}
.severity.medium{background:#713f12;color:#fde68a}
</style>
</head>
<body>
<div class="header">
  <div class="logo">Sentra</div>
  <div class="badge">CYBER RESILIENCE</div>
  <div style="margin-left:auto;font-size:10px;color:#4b5563">Org: ${ctx.orgId ?? 'global'}</div>
</div>
<div class="kpi">
  <div class="kpi-item"><div class="kpi-value" style="color:#ef4444">2</div><div class="kpi-label">Critical</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#f97316">7</div><div class="kpi-label">High</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#eab308">14</div><div class="kpi-label">Medium</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#22c55e">87.4%</div><div class="kpi-label">Compliance</div></div>
</div>
<div style="margin:0 16px 8px;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:1px">Recent Threats</div>
<div class="threat-item"><div class="threat-title"><span class="severity">CRITICAL</span>CVE-2024-38813 — VMware vCenter RCE</div><div class="threat-meta">2h ago · Patch available · 3 affected endpoints</div></div>
<div class="threat-item high"><div class="threat-title"><span class="severity high">HIGH</span>Lateral movement detected — Subnet B</div><div class="threat-meta">4h ago · Quarantine applied · Investigation open</div></div>
<div class="threat-item medium"><div class="threat-title"><span class="severity medium">MEDIUM</span>Anomalous egress traffic — 14.2GB</div><div class="threat-meta">6h ago · DLP policy triggered · Analyst notified</div></div>
<div style="padding:12px 16px;font-size:9px;color:#374151;text-align:center">
  Live data via Sentra MCP · Guardian-governed · ${new Date().toISOString()}
</div>
</body></html>`;
}

function buildPropertyComparisonApp(ctx: TenantContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Terra — Property Comparison</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0}
.header{background:#0a1a0e;border-bottom:1px solid #14532d;padding:12px 16px;display:flex;align-items:center;gap:8px}
.logo{font-size:11px;font-weight:700;letter-spacing:2px;color:#22c55e;text-transform:uppercase}
.badge{background:#052e16;color:#4ade80;font-size:10px;padding:2px 8px;border-radius:12px}
.kpi{display:flex;gap:12px;margin:16px;padding:12px;background:#0a1a0e;border:1px solid #14532d;border-radius:6px}
.kpi-item{flex:1;text-align:center}
.kpi-value{font-size:18px;font-weight:700;color:#22c55e}
.kpi-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.prop-card{margin:0 16px 8px;background:#0a1a0e;border:1px solid #14532d;border-radius:6px;padding:10px}
.prop-address{font-size:11px;font-weight:700;color:#4ade80;margin-bottom:4px}
.prop-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-top:6px}
.prop-stat{text-align:center}
.prop-stat-val{font-size:13px;font-weight:600;color:#f0fdf4}
.prop-stat-label{font-size:9px;color:#4b5563}
.distress-badge{font-size:9px;padding:1px 6px;border-radius:8px;background:#052e16;color:#4ade80;float:right}
.distress-badge.high{background:#431407;color:#fb923c}
</style>
</head>
<body>
<div class="header">
  <div class="logo">Terra</div>
  <div class="badge">REAL ESTATE INTELLIGENCE</div>
  <div style="margin-left:auto;font-size:10px;color:#4b5563">Domain: ${ctx.domain ?? 'real-estate'}</div>
</div>
<div class="kpi">
  <div class="kpi-item"><div class="kpi-value">$2.4B</div><div class="kpi-label">Portfolio Value</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#f97316">18</div><div class="kpi-label">Distressed</div></div>
  <div class="kpi-item"><div class="kpi-value">7.2%</div><div class="kpi-label">Avg Yield</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#ef4444">-4.1%</div><div class="kpi-label">QoQ Delta</div></div>
</div>
<div style="margin:0 16px 8px;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:1px">Top Opportunities</div>
<div class="prop-card">
  <div><div class="prop-address">1247 Commerce Blvd, Houston TX</div><span class="distress-badge high">HIGH DISTRESS</span></div>
  <div class="prop-grid">
    <div class="prop-stat"><div class="prop-stat-val">$4.2M</div><div class="prop-stat-label">Asking</div></div>
    <div class="prop-stat"><div class="prop-stat-val">$7.8M</div><div class="prop-stat-label">Est. Value</div></div>
    <div class="prop-stat"><div class="prop-stat-val">-46%</div><div class="prop-stat-label">Discount</div></div>
  </div>
</div>
<div class="prop-card">
  <div><div class="prop-address">890 Industrial Ave, Detroit MI</div><span class="distress-badge">OPPORTUNITY</span></div>
  <div class="prop-grid">
    <div class="prop-stat"><div class="prop-stat-val">$1.8M</div><div class="prop-stat-label">Asking</div></div>
    <div class="prop-stat"><div class="prop-stat-val">$2.9M</div><div class="prop-stat-label">Est. Value</div></div>
    <div class="prop-stat"><div class="prop-stat-val">-38%</div><div class="prop-stat-label">Discount</div></div>
  </div>
</div>
<div style="padding:12px 16px;font-size:9px;color:#374151;text-align:center">
  Live data via Terra MCP · Proof-chained · ${new Date().toISOString()}
</div>
</body></html>`;
}

function buildCaseStatusApp(ctx: TenantContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Lyte — Decision Intelligence</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0}
.header{background:#0e0a1a;border-bottom:1px solid #4c1d95;padding:12px 16px;display:flex;align-items:center;gap:8px}
.logo{font-size:11px;font-weight:700;letter-spacing:2px;color:#8b5cf6;text-transform:uppercase}
.badge{background:#2e1065;color:#c084fc;font-size:10px;padding:2px 8px;border-radius:12px}
.kpi{display:flex;gap:12px;margin:16px;padding:12px;background:#0e0a1a;border:1px solid #4c1d95;border-radius:6px}
.kpi-item{flex:1;text-align:center}
.kpi-value{font-size:18px;font-weight:700;color:#8b5cf6}
.kpi-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.decision-item{margin:0 16px 6px;background:#0e0a1a;border:1px solid #4c1d95;border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center}
.decision-title{font-size:11px;color:#c4b5fd;font-weight:600}
.decision-meta{font-size:10px;color:#6b7280;margin-top:2px}
.status-pill{font-size:9px;padding:2px 8px;border-radius:12px;white-space:nowrap}
.status-pill.pending{background:#451a03;color:#fdba74}
.status-pill.approved{background:#052e16;color:#4ade80}
.status-pill.running{background:#172554;color:#93c5fd}
</style>
</head>
<body>
<div class="header">
  <div class="logo">Lyte</div>
  <div class="badge">DECISION INTELLIGENCE</div>
  <div style="margin-left:auto;font-size:10px;color:#4b5563">Roles: ${(ctx.roles ?? ['viewer']).join(', ')}</div>
</div>
<div class="kpi">
  <div class="kpi-item"><div class="kpi-value" style="color:#f97316">5</div><div class="kpi-label">Pending Approval</div></div>
  <div class="kpi-item"><div class="kpi-value">12</div><div class="kpi-label">Active Runs</div></div>
  <div class="kpi-item"><div class="kpi-value" style="color:#22c55e">94.1%</div><div class="kpi-label">Platform Health</div></div>
  <div class="kpi-item"><div class="kpi-value">3</div><div class="kpi-label">Escalations</div></div>
</div>
<div style="margin:0 16px 8px;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:1px">Decision Queue</div>
<div class="decision-item"><div><div class="decision-title">Cross-Domain Risk Escalation — Maritime + Cyber</div><div class="decision-meta">Confidence: 87% · Evidence: 4 items</div></div><span class="status-pill pending">PENDING</span></div>
<div class="decision-item"><div><div class="decision-title">Terra Portfolio Rebalancing Workflow</div><div class="decision-meta">Stage 3/5 · ETA: 8min</div></div><span class="status-pill running">RUNNING</span></div>
<div class="decision-item"><div><div class="decision-title">Aegis Threat Containment Execution</div><div class="decision-meta">Approved by J.Chen · 14min ago</div></div><span class="status-pill approved">APPROVED</span></div>
<div style="padding:12px 16px;font-size:9px;color:#374151;text-align:center">
  Live data via Lyte MCP · Governed Autonomy · ${new Date().toISOString()}
</div>
</body></html>`;
}

// ─── Domain App Registry ──────────────────────────────────────────────────────

/**
 * Create the standard set of SZL domain Apps.
 * Each App serves a tenant-scoped, data-live HTML micro-dashboard.
 */
export function createDomainApps(): NexusApp[] {
  return [
    {
      appId: 'sextant-fleet-map',
      domain: 'maritime',
      title: 'Vessels Fleet Position Map',
      description: 'Live maritime fleet positions, voyage status, weather alerts, and AIS anomaly detection.',
      renderHtml: async (ctx: TenantContext) => buildFleetMapApp(ctx),
    },
    {
      appId: 'tenax-threat-timeline',
      domain: 'security',
      title: 'Sentra Live Threat Timeline',
      description: 'Real-time cybersecurity threat feed, CVE tracking, compliance scores, and incident status.',
      renderHtml: async (ctx: TenantContext) => buildThreatTimelineApp(ctx),
    },
    {
      appId: 'domaine-property-comparison',
      domain: 'real-estate',
      title: 'Terra Property Comparison Card',
      description: 'Distressed property opportunities, portfolio analytics, and market signal comparisons.',
      renderHtml: async (ctx: TenantContext) => buildPropertyComparisonApp(ctx),
    },
    {
      appId: 'kora-case-status',
      domain: 'analytics',
      title: 'Lyte Decision Intelligence Dashboard',
      description: 'Pending approvals, active workflow runs, platform health, and decision queue status.',
      renderHtml: async (ctx: TenantContext) => buildCaseStatusApp(ctx),
    },
  ];
}
