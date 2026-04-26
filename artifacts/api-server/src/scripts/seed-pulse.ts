/**
 * seed-pulse.ts
 *
 * Seeds 30+ days of Pulse briefing history:
 *   • pulse_briefings   — daily executive intelligence briefs
 *   • pulse_exec_briefs — per-domain exec summaries
 *   • pulse_dissents    — analyst dissent records
 *   • pulse_custom_briefs — on-demand research briefs
 *
 * Idempotent: skips if data already present.
 * Shared entity IDs are consistent with seed-aegis, seed-terra-full,
 * seed-marine-extended so cross-links resolve to real records.
 */

import {
  db,
  pulseBriefingsTable,
  pulseCustomBriefsTable,
  pulseDissentsTable,
  pulseExecBriefsTable,
} from '@szl-holdings/db';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function dateStr(n: number) {
  const d = daysAgo(n);
  return d.toISOString().slice(0, 10);
}

const _DOMAINS = ['aegis', 'vessels', 'terra', 'lyte', 'carlota-jo', 'platform'] as const;

const RISK_LEVELS = ['critical', 'high', 'elevated', 'moderate', 'low'] as const;
const RISK_WEIGHTS = [0.05, 0.12, 0.28, 0.4, 0.15];

function pickRisk(): string {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < RISK_WEIGHTS.length; i++) {
    cum += RISK_WEIGHTS[i]!;
    if (r < cum) return RISK_LEVELS[i]!;
  }
  return 'moderate';
}

function conf(base: number, variance: number): string {
  return String(Math.min(0.99, Math.max(0.5, base + (Math.random() - 0.5) * variance)).toFixed(2));
}

const HEADLINES = [
  'Maritime sanctions risk elevated — three vessels under active screening',
  'Aegis red team identifies critical auth bypass in payment API',
  'Terra distress pipeline flags 12 high-opportunity auction assets',
  'Lyte AIOps anomaly score spike — three portfolio companies affected',
  'SZL Holdings Q1 deployment velocity up 22% — governance gates holding',
  'Vessels fleet dark-period anomaly resolved — IMO 9876543 cleared',
  'Carlota Jo Q2 client pipeline ahead of target by $480K',
  'Counsel matter closures accelerate — 8 settlements in 48 hours',
  'Aegis SOC playbook triggered — ransomware precursor pattern detected',
  'Terra: Harlem auction cluster — 4 properties within acquisition window',
  'Cross-domain entity drift alert — 3 CST nodes require verification',
  'Alloy governance ceiling breach — 2 agent runs paused pending review',
  'Vessels: Panamax fleet repositioning signals demand shift in Atlantic lanes',
  'Lyte observability: latency spike in PRISM document-review pipeline',
  'Aegis compliance calendar — 14 controls due for attestation this week',
  'Terra: NYC tax-lien sale Q2 registration opens — 47 tracked assets',
  'SZL Holdings board deck finalized — roadshow begins in 18 days',
  'Vessels: Red Sea re-routing cost impact — $0.8M projected over 30 days',
  'Carlota Jo: new advisory inquiry from Fortune 500 CHRO — high fit',
  'Aegis: MITRE ATT&CK detection coverage improved to 74% — up 6pp',
  'Terra: Brooklyn multifamily cap rates compressing — adjust models',
  'Alloy AI decisions queue — 3 pending human approvals over 24h threshold',
  'Lyte: revenue intelligence signal — Vessels ARR tracking $200K above plan',
  'PRISM: discovery phase acceleration — AI document review 3x baseline',
  'Vessels: cargo insurance renewal — 2 vessels flagged for rate increase',
  'Aegis: OT/ICS scan completed — 0 critical findings in industrial segment',
  'Terra: Westchester commercial corridor showing early distress clustering',
  'SZL Holdings: LP portal — 2 new capital inquiries from Tier-1 funds',
  'Carlota Jo: board readiness cohort — 4 executives cleared for placement',
  'Constellation graph: 847 active cross-domain nodes, 2,341 edges verified',
];

function makeBriefingSections(day: number) {
  const risk = pickRisk();
  return [
    {
      id: `sec-aegis-${day}`,
      domain: 'aegis',
      title: 'Security & Threat Intelligence',
      riskLevel: risk,
      confidence: conf(0.88, 0.08),
      summary:
        day % 5 === 0
          ? 'Aegis SOC detected ransomware precursor indicators across 3 endpoints. Containment playbook triggered automatically. MITRE T1059 and T1486 patterns confirmed.'
          : 'Routine scan cycle completed. 2 new high-severity findings added to backlog. Hardening controls on track — 89% coverage maintained.',
      keyFindings: [
        {
          id: `f-${day}-1`,
          title: 'Payment API IDOR finding — remediation owner assigned',
          severity: 'critical',
          sourceId: `firestorm-finding-${day}`,
        },
        {
          id: `f-${day}-2`,
          title: 'Azure AD conditional access gap — MFA enforcement pending',
          severity: 'high',
          sourceId: 'finding-azure-ad-001',
        },
        {
          id: `f-${day}-3`,
          title: 'Jenkins CI pipeline secret exposure — secrets rotated',
          severity: 'high',
          sourceId: 'finding-jenkins-001',
        },
      ],
      signals: [
        { type: 'alert', count: 2 + (day % 4), domain: 'aegis' },
        { type: 'finding', count: 5 + (day % 8), domain: 'aegis' },
      ],
    },
    {
      id: `sec-vessels-${day}`,
      domain: 'vessels',
      title: 'Maritime Fleet Intelligence',
      riskLevel: day % 7 === 0 ? 'elevated' : 'moderate',
      confidence: conf(0.82, 0.1),
      summary:
        day % 7 === 0
          ? 'IMO 9876543 (MV Horizon Star) returned to AIS after 18-hour dark period. Route consistent with declared manifest — cleared after secondary screening.'
          : 'Fleet operating normally. 47 vessels tracked. 3 in declared slow-steam mode due to Atlantic weather system. Cargo delays projected < 12 hours.',
      keyFindings: [
        {
          id: `f-v-${day}-1`,
          title: 'AIS dark period resolved — IMO 9876543',
          severity: day % 7 === 0 ? 'high' : 'info',
          sourceId: 'vessel-imo-9876543',
        },
        {
          id: `f-v-${day}-2`,
          title: 'Red Sea alternate route cost tracking active',
          severity: 'medium',
          sourceId: 'vessel-routing-q2',
        },
      ],
      signals: [{ type: 'fleet_event', count: 3 + (day % 5), domain: 'vessels' }],
    },
    {
      id: `sec-terra-${day}`,
      domain: 'terra',
      title: 'Real Estate Distress Intelligence',
      riskLevel: 'low',
      confidence: conf(0.91, 0.05),
      summary: `${12 + (day % 8)} distress opportunities active in pipeline. Brooklyn multifamily concentration rising. ${day % 4 === 0 ? '3 auction windows closing this week — recommend immediate outreach on dp-seed-002 and dp-seed-008.' : 'No immediate auction deadlines. Outreach queue has 6 active engagements.'}`,
      keyFindings: [
        {
          id: `f-t-${day}-1`,
          title: '234 W 145th St auction — acquisition window',
          severity: 'high',
          sourceId: 'dp-seed-002',
        },
        {
          id: `f-t-${day}-2`,
          title: 'Tax-lien cluster — Flushing/Queens corridor',
          severity: 'medium',
          sourceId: 'dp-seed-006',
        },
      ],
      signals: [{ type: 'property', count: 12 + (day % 8), domain: 'terra' }],
    },
    {
      id: `sec-lyte-${day}`,
      domain: 'lyte',
      title: 'Business Observability & Revenue Intelligence',
      riskLevel: 'low',
      confidence: conf(0.85, 0.07),
      summary: `Portfolio ARR tracking $${(42.8 + day * 0.03).toFixed(1)}M aggregate. Vessels AIOps leading performance — NRR at 127%. Lyte anomaly score nominal across 4 monitored entities.`,
      keyFindings: [
        {
          id: `f-l-${day}-1`,
          title: 'Vessels ARR $200K above plan — Q2 tracking',
          severity: 'info',
          sourceId: 'lyte-signal-vessels-arr',
        },
        {
          id: `f-l-${day}-2`,
          title: 'PRISM document review latency spike — monitoring',
          severity: 'medium',
          sourceId: 'lyte-signal-prism-latency',
        },
      ],
      signals: [{ type: 'revenue_signal', count: 4 + (day % 3), domain: 'lyte' }],
    },
  ];
}

function makeRecommendedActions(day: number) {
  return [
    {
      id: `act-${day}-1`,
      priority: 'critical',
      domain: 'aegis',
      action: 'Approve security patch deployment for payment-api-v3 — window closes in 6 hours',
      owner: 'Security Operations',
      dueBy: daysAgo(-0.25).toISOString(),
      autonomyLevel: 'human_approval_required',
    },
    {
      id: `act-${day}-2`,
      priority: 'high',
      domain: 'terra',
      action: `Review and approve outreach for ${day % 2 === 0 ? '234 W 145th St (Manhattan, auction Apr 10)' : '1847 Flatbush Ave (Brooklyn, pre-foreclosure)'}`,
      owner: 'Terra Acquisition Team',
      dueBy: daysAgo(-1).toISOString(),
      autonomyLevel: 'recommend_and_wait',
    },
    {
      id: `act-${day}-3`,
      priority: 'medium',
      domain: 'vessels',
      action:
        'Confirm Red Sea re-routing cost authorization for MV Atlantic Voyager — $0.8M impact',
      owner: 'Fleet Operations',
      dueBy: daysAgo(-2).toISOString(),
      autonomyLevel: 'autonomous_with_log',
    },
  ];
}

export async function seedPulse() {

  const briefings: (typeof pulseBriefingsTable.$inferInsert)[] = [];
  const execBriefs: (typeof pulseExecBriefsTable.$inferInsert)[] = [];

  for (let day = 30; day >= 0; day--) {
    const briefId = `brief-${dateStr(day)}`;
    const risk = day < 5 ? (day === 2 ? 'critical' : 'high') : pickRisk();
    const confidence = parseFloat(conf(0.87, 0.08));
    const headline = HEADLINES[day % HEADLINES.length]!;

    briefings.push({
      id: briefId,
      date: dateStr(day),
      edition: day === 0 ? 'Morning Edition' : 'Daily Intelligence',
      classification: 'confidential',
      status: 'published',
      overallRisk: risk,
      overallConfidence: String(confidence),
      headline,
      leadSentence: `Across ${3 + (day % 3)} active domains, SZL Holdings intelligence systems processed ${1200 + day * 12} signals, surfacing ${2 + (day % 4)} priority actions requiring executive attention.`,
      domains: ['aegis', 'vessels', 'terra', 'lyte'],
      sections: makeBriefingSections(day),
      recommendedActions: makeRecommendedActions(day),
      generatedAt: daysAgo(day),
      createdAt: daysAgo(day),
    });

    for (const domain of ['aegis', 'vessels', 'terra', 'lyte'] as const) {
      const execId = `exec-${domain}-${dateStr(day)}`;
      execBriefs.push({
        id: execId,
        briefingId: briefId,
        domain,
        status: 'published',
        headline: `${domain.charAt(0).toUpperCase() + domain.slice(1)} — ${headline.length > 60 ? `${headline.slice(0, 60)}…` : headline}`,
        situation: `${domain} domain operating within defined autonomy envelope. ${domain === 'aegis' ? '3 open critical findings requiring human review.' : domain === 'vessels' ? '47 vessels tracked, 2 flagged for screening.' : domain === 'terra' ? '12 active distress opportunities in pipeline.' : 'ARR tracking above plan across 3 monitored entities.'}`,
        autonomyTier: domain === 'aegis' ? 'tier-2' : 'tier-3',
        confidence: String(parseFloat(conf(0.88, 0.06))),
        overallRisk: domain === 'aegis' && day < 3 ? 'critical' : 'moderate',
        verifierStatus: 'passed',
        verifierFeedback: 'All citations resolved. Entity provenance verified.',
        whatWeBelieve: [
          {
            claim: `${domain} operations nominal — no systemic anomalies detected`,
            confidence: 0.91,
          },
          {
            claim: 'Cross-domain entity graph consistent with last verified snapshot',
            confidence: 0.87,
          },
        ],
        whyCitations: [
          {
            sourceId: `cst-node-${domain}-primary`,
            sourceLabel: `Constellation — ${domain} primary node`,
            type: 'constellation_entity',
          },
          {
            sourceId: `signal-${domain}-${day}`,
            sourceLabel: 'Platform signal bus',
            type: 'platform_signal',
          },
        ],
        whatWeRecommend: [
          {
            action: `Continue monitoring ${domain} — no immediate escalation required`,
            priority: 'routine',
            autonomy: 'autonomous_with_log',
          },
        ],
        sourceTraceIds: [`trace-${domain}-${day}-001`],
        entityProvenance: [
          { entityId: `cst-${domain}-001`, domain, resolvedAt: daysAgo(day).toISOString() },
        ],
        sections: [],
        scheduled: true,
        generatedAt: daysAgo(day),
        createdAt: daysAgo(day),
      });
    }
  }

  await db.insert(pulseBriefingsTable).values(briefings).onConflictDoNothing();

  await db.insert(pulseExecBriefsTable).values(execBriefs).onConflictDoNothing();

  const dissentBriefId = briefings.find((b) => b.date === dateStr(5))?.id ?? briefings[0]?.id;
  const dissents: (typeof pulseDissentsTable.$inferInsert)[] = [
    {
      dissentId: 'dissent-001',
      briefingId: dissentBriefId,
      sectionId: `sec-vessels-5`,
      sectionTitle: 'Maritime Fleet Intelligence',
      dissentingView:
        'The 18-hour AIS dark period for IMO 9876543 should remain open for secondary screening. Route consistency alone is insufficient — vessel was in proximity to sanctioned entity at waypoint 3.',
      basis:
        'OFAC Consolidated Sanctions List cross-reference against last known port call. Historical pattern analysis shows 3 similar events in 24 months.',
      impactIfCorrect:
        'Potential OFAC compliance breach. Cargo manifest would require independent verification before port clearance.',
      filedBy: 'Vessels Intelligence Analyst — M. Rodriguez',
      filedAt: daysAgo(5),
      status: 'acknowledged',
      resolution:
        'Secondary review completed — no sanctions match confirmed. IMO cleared after OFAC API re-query.',
      resolvedAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      dissentId: 'dissent-002',
      briefingId: briefings.find((b) => b.date === dateStr(12))?.id ?? briefings[0]?.id,
      sectionId: `sec-terra-12`,
      sectionTitle: 'Real Estate Distress Intelligence',
      dissentingView:
        'Opportunity score of 92 for 234 W 145th St is overstated. Comparable Harlem transactions in Q4 2025 show 8-12% discounts to estimated value — model inputs may be stale.',
      basis:
        'REBNY comparables database pulled 2026-04-05. Cap rate compression in upper Manhattan has reversed since Q3 2025.',
      impactIfCorrect:
        'Acquisition model overpays by $400-600K. Projected IRR drops from 18% to 12%.',
      filedBy: 'Terra Acquisition Analyst — K. Wilson',
      filedAt: daysAgo(12),
      status: 'resolved',
      resolution:
        'Model refreshed with Q1 2026 comps. Estimated value adjusted to $3.95M. Opportunity score revised to 88. Acquisition thesis intact.',
      resolvedAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      dissentId: 'dissent-003',
      briefingId: briefings.find((b) => b.date === dateStr(2))?.id ?? briefings[0]?.id,
      sectionId: `sec-aegis-2`,
      sectionTitle: 'Security & Threat Intelligence',
      dissentingView:
        'Ransomware precursor classification is premature. T1059 pattern match rate was 67% — below our 80% threshold for automatic playbook trigger.',
      basis:
        'Internal threshold policy: PSP-2024-07 requires ≥80% confidence for autonomous playbook activation. Current run was at 67%.',
      impactIfCorrect:
        'Playbook triggered 14 minutes of unnecessary service interruption on staging cluster. False positive rate increasing — model needs retraining.',
      filedBy: 'Aegis SOC Lead — J. Chen',
      filedAt: daysAgo(2),
      status: 'under_review',
      updatedAt: daysAgo(1),
    },
    {
      dissentId: 'dissent-004',
      briefingId: briefings.find((b) => b.date === dateStr(18))?.id ?? briefings[0]?.id,
      sectionId: `sec-lyte-18`,
      sectionTitle: 'Business Observability & Revenue Intelligence',
      dissentingView:
        'Vessels NRR reported at 127% is based on trailing 6 months — TTM shows 119%. Executive deck should show TTM to avoid overstating expansion trajectory.',
      basis:
        'NRR calculation methodology not standardized across portfolio. Trailing 6-month vs TTM diverge when a large renewal occurred in month 8.',
      impactIfCorrect:
        'Investor deck NRR overstated by 8pp — material misrepresentation risk in upcoming roadshow materials.',
      filedBy: 'Lyte Finance Controller — L. Nguyen',
      filedAt: daysAgo(18),
      status: 'resolved',
      resolution:
        'Metric corrected to TTM basis. All investor materials updated. NRR reported as 119% TTM.',
      resolvedAt: daysAgo(17),
      updatedAt: daysAgo(17),
    },
    {
      dissentId: 'dissent-005',
      briefingId: briefings.find((b) => b.date === dateStr(7))?.id ?? briefings[0]?.id,
      sectionId: `sec-aegis-7`,
      sectionTitle: 'Security & Threat Intelligence',
      dissentingView:
        'Payment API IDOR remediation timeline of 7 days is too long given CVSS 9.3. SZL security policy PSP-2024-03 mandates critical findings patched within 48 hours.',
      basis:
        'PSP-2024-03: Critical (CVSS ≥9.0) findings must be remediated and verified within 48 hours of confirmation.',
      impactIfCorrect:
        'Non-compliance with internal security SLA. Potential breach window remains open 5 additional days beyond policy mandate.',
      filedBy: 'Aegis Compliance Officer — R. Davis',
      filedAt: daysAgo(7),
      status: 'acknowledged',
      updatedAt: daysAgo(6),
    },
  ];

  await db.insert(pulseDissentsTable).values(dissents).onConflictDoNothing();

  const customBriefs: (typeof pulseCustomBriefsTable.$inferInsert)[] = [
    {
      requestId: 'custom-001',
      topic: 'Red Sea shipping disruption — SZL Vessels exposure assessment',
      entity: 'SZL Holdings — Vessels Maritime Intelligence',
      scenario:
        'Ongoing Houthi attacks in Red Sea forcing Atlantic re-routing — cost impact and timeline analysis',
      domains: ['vessels', 'lyte'],
      agents: ['maritime-intelligence', 'revenue-intelligence'],
      requestedAt: daysAgo(8),
      status: 'complete',
      briefingId: briefings.find((b) => b.date === dateStr(7))?.id,
    },
    {
      requestId: 'custom-002',
      topic: 'NYC multifamily distress clustering — Q2 2026 opportunity map',
      entity: 'Terra Real Estate Intelligence',
      scenario:
        'Rising interest rates and Q2 auction calendar — identify top 10 acquisition targets by IRR',
      domains: ['terra', 'lyte'],
      agents: ['terra-intelligence', 'financial-modeling'],
      requestedAt: daysAgo(14),
      status: 'complete',
      briefingId: briefings.find((b) => b.date === dateStr(13))?.id,
    },
    {
      requestId: 'custom-003',
      topic: 'Azure AD credential exposure blast radius analysis',
      entity: 'Aegis — Security Operations',
      scenario:
        'If Azure AD admin account compromised — what lateral movement paths exist to critical systems?',
      domains: ['aegis'],
      agents: ['threat-intelligence', 'asset-mapping'],
      requestedAt: daysAgo(3),
      status: 'complete',
      briefingId: briefings.find((b) => b.date === dateStr(2))?.id,
    },
    {
      requestId: 'custom-004',
      topic: 'Counsel — Q2 demand letter pipeline velocity',
      entity: 'Counsel',
      scenario:
        'Is demand letter generation pace consistent with Q2 settlement targets? What are the bottlenecks?',
      domains: ['lyte'],
      agents: ['legal-operations', 'revenue-intelligence'],
      requestedAt: daysAgo(1),
      status: 'generating',
    },
  ];

  await db.insert(pulseCustomBriefsTable).values(customBriefs).onConflictDoNothing();

  return {
    briefings: briefings.length,
    execBriefs: execBriefs.length,
    dissents: dissents.length,
    customBriefs: customBriefs.length,
  };
}
