/**
 * Demo Narrative 3: Maritime / Sanctions / Fleet Operations Lens
 *
 * Scenario: Arcturus Shipping — MV Soltana goes dark (AIS off) for 134 minutes
 * near a sanctions-sensitive corridor. SEXTANT detects the anomaly, enriches
 * it with OFAC screening and weather context, generates an operator action plan,
 * Fleet Ops Director approves rerouting, and an immutable voyage record is created.
 *
 * Signal → Context → Recommendation → Approval → Execution → Outcome → Executive Summary
 */

export const MARITIME_NARRATIVE = {
  id: 'maritime',
  title: 'Maritime / Sanctions / Fleet Operations Lens',
  personas: ['fleet-operator', 'compliance-auditor'],
  org: 'Arcturus Shipping',
  duration: '12 minutes',

  scenario: {
    name: 'MV Soltana — AIS Dark Event & Sanctions Corridor Proximity',
    summary:
      'MV Soltana (IMO 9812347) ceased AIS transmission for 134 minutes while transiting a sanctions-sensitive corridor near the Strait of Hormuz. Helmsman detected the gap, cross-referenced OFAC watch lists, and identified a route deviation. Fleet Ops Director was notified within 6 minutes of signal detection.',
    vessel: 'MV Soltana',
    imo: '9812347',
    flag: 'Marshall Islands',
    cargo: 'Refined petroleum products — $3.2M',
    routeFrom: 'Fujairah, UAE',
    routeTo: 'Karachi, Pakistan',
    darkEventDuration: '134 minutes',
    sanctionsRisk: 'Elevated — corridor proximity to Iranian waters',
  },

  entities: {
    org: {
      id: 'demo-org-arcturus',
      name: 'Arcturus Shipping',
      sector: 'Maritime / Energy Logistics',
      fleet: 22,
      activeVoyages: 8,
    },
    vessel: {
      id: 'demo-vessel-soltana',
      name: 'MV Soltana',
      imo: '9812347',
      mmsi: '538009241',
      type: 'Product Tanker',
      flag: 'Marshall Islands',
      dwt: 37400,
      yearBuilt: 2019,
      operator: 'Arcturus Shipping',
    },
    voyage: {
      id: 'demo-voyage-sol-001',
      status: 'in-progress',
      origin: 'Fujairah, UAE',
      destination: 'Karachi, Pakistan',
      departedAt: '2026-04-13T06:00:00Z',
      estimatedArrival: '2026-04-15T18:00:00Z',
      cargoType: 'Refined Petroleum Products',
      cargoValue: 3200000,
      charterer: 'Meridian Energy Trading',
    },
    signal: {
      id: 'demo-signal-mar-001',
      type: 'ais_dark_event',
      severity: 'critical',
      title: 'MV Soltana — AIS dark 134 min, sanctions corridor proximity',
      body: 'MV Soltana ceased AIS transmission at 2026-04-14T11:23:00Z. Reappeared 2026-04-14T13:37:00Z at a position inconsistent with expected route. Last known position: 26.4°N 56.8°E — within 18nm of Iranian territorial waters. Route deviation: 34nm eastward. OFAC screening triggered.',
      source: 'SEXTANT Helmsman — AIS Telemetry',
      confidence: 0.89,
      detectedAt: '2026-04-14T13:43:00Z',
      reappearPosition: { lat: 26.4, lon: 56.8 },
      deviationNm: 34,
    },
    context: {
      id: 'demo-context-mar-001',
      summary:
        'Helmsman assembled 7 signals from AIS, OFAC, weather, port data, and commercial context.',
      signals: [
        {
          source: 'AIS',
          signal: '134-minute blackout — position inconsistent with declared route on reappearance',
        },
        {
          source: 'OFAC',
          signal: 'Corridor flagged — within 18nm of Iranian waters during dark period',
        },
        {
          source: 'OFAC',
          signal: 'Charterer (Meridian Energy Trading) clear — no sanctions match',
        },
        {
          source: 'Weather',
          signal: 'NWS marine forecast: sea state 2, wind 12kt — blackout not weather-related',
        },
        {
          source: 'Ports',
          signal: 'No declared port call, no anchor record in the blackout window',
        },
        {
          source: 'Cargo',
          signal: 'Refined petroleum products — OFAC strict liability regime applies',
        },
        {
          source: 'Voyage P&L',
          signal: 'Current revenue exposure if detained: $840,000 (demurrage + cargo delay)',
        },
      ],
    },
    recommendation: {
      id: 'demo-rec-mar-001',
      agent: 'Helmsman',
      action:
        'Hold port approach at Karachi anchorage pending OFAC clearance review. File voyage incident report. Notify P&I Club within 24 hours. Reroute if OFAC cannot clear within 6 hours.',
      rationale:
        'The dark event and position deviation create a sanctions due diligence obligation under OFAC strict liability. Proceeding to port without clearance exposes Arcturus to civil penalties. Weather conditions rule out technical causes. Holding at anchorage preserves optionality while OFAC review runs — total exposure cap at $840K vs. potential OFAC fine of $1.3M+ per violation.',
      confidence: 0.91,
      requiresApproval: true,
      approvalRole: 'operator',
      generatedAt: '2026-04-14T13:47:00Z',
    },
    approval: {
      id: 'demo-approval-mar-001',
      approver: 'Captain James Wren (Fleet Ops Director)',
      decision: 'approved',
      note: 'Agreed. Hold at anchorage. I am calling the P&I Club now. Notify the charterer — they need to know the eta impact.',
      approvedAt: '2026-04-14T13:52:00Z',
      durationToApproval: '5 minutes',
    },
    execution: {
      id: 'demo-execution-mar-001',
      steps: [
        {
          step: 1,
          action: 'Master notified — hold at Karachi anchorage (18.8°N 67.1°E)',
          via: 'SEXTANT Crew Comms Connector',
        },
        {
          step: 2,
          action: 'Voyage incident report created — reference INC-2026-0414-001',
          via: 'Counsel Workflow',
        },
        {
          step: 3,
          action: 'P&I Club notified — UK P&I, case ref P24-0887',
          via: 'Counsel Email Connector',
        },
        {
          step: 4,
          action: 'OFAC internal clearance review initiated — Compliance team assigned',
          via: 'Counsel Workflow',
        },
        {
          step: 5,
          action: 'Charterer notified — ETA revised from 2026-04-15T18:00Z to 2026-04-16T06:00Z',
          via: 'Counsel Email Connector',
        },
      ],
      completedAt: '2026-04-14T14:15:00Z',
    },
    outcome: {
      id: 'demo-outcome-mar-001',
      summary:
        'OFAC clearance granted in 4.5 hours. No sanctions match confirmed. Vessel cleared to proceed. ETA revision: 12 hours. Demurrage claim filed with charterer.',
      ofacResult: 'Cleared — no sanctions match',
      hoursToClearing: 4.5,
      financialImpact: 'Demurrage $112,000 — recoverable from charterer under voyage charter terms',
      regulatoryStatus: 'Incident report filed; P&I notified within 24-hour window',
      recordedAt: '2026-04-14T18:30:00Z',
    },
    executiveSummary: {
      id: 'demo-exsummary-mar-001',
      headline: 'MV Soltana OFAC event resolved — vessel cleared, voyage record complete',
      body: 'A 134-minute AIS dark event near a sanctions corridor was detected, assessed, and contained in under 5 hours. OFAC clearance confirmed. No sanctions exposure. Incident report filed. Full voyage audit record available for flag state, port authority, and P&I review. Demurrage of $112,000 recoverable.',
      generatedAt: '2026-04-14T19:00:00Z',
    },
    auditTrail: {
      id: 'demo-audit-mar-001',
      entries: [
        {
          timestamp: '2026-04-14T11:23:00Z',
          event: 'AIS transmission ceased',
          actor: 'System',
          source: 'AIS Telemetry',
        },
        {
          timestamp: '2026-04-14T13:37:00Z',
          event: 'AIS transmission restored — position anomaly detected',
          actor: 'Helmsman Agent',
          source: 'AIS Telemetry',
        },
        {
          timestamp: '2026-04-14T13:43:00Z',
          event: 'OFAC screening triggered — corridor proximity flag',
          actor: 'Helmsman Agent',
          source: 'OFAC API',
        },
        {
          timestamp: '2026-04-14T13:47:00Z',
          event: 'Action recommendation generated — hold at anchorage',
          actor: 'Helmsman Agent',
          source: 'SEXTANT Recommendation Engine',
        },
        {
          timestamp: '2026-04-14T13:52:00Z',
          event: 'Recommendation approved — Captain James Wren',
          actor: 'James Wren',
          source: 'SEXTANT Approval Gate',
        },
        {
          timestamp: '2026-04-14T14:15:00Z',
          event:
            'All execution steps confirmed — master notified, P&I notified, charterer notified',
          actor: 'Counsel Workflow',
          source: 'Execution Record',
        },
        {
          timestamp: '2026-04-14T18:30:00Z',
          event: 'OFAC clearance received — vessel cleared to proceed',
          actor: 'Robert Tanner (CCO)',
          source: 'OFAC Internal Review',
        },
      ],
    },
  },

  talkingScript: [
    {
      step: 'Dark Event Detection',
      duration: '2 min',
      narrative:
        'James Wren opens the SEXTANT fleet dashboard. Helmsman has already surfaced a critical alert: MV Soltana went dark for 134 minutes and reappeared 34nm off the declared route near Iranian waters. OFAC screening is already running.',
      showIn: ['vessels/fleet/dashboard', 'vessels/incidents/soltana'],
      roleSwitch: 'fleet-operator',
    },
    {
      step: 'Voyage Context',
      duration: '2 min',
      narrative:
        'The Voyage Twin shows everything: AIS track, cargo, charterer OFAC status, weather during blackout, P&L exposure. 7 signals assembled automatically. Revenue at risk: $840,000. Weather rules out technical causes.',
      showIn: ['vessels/voyage-twin/sol-001', 'vessels/sanctions'],
      roleSwitch: 'fleet-operator',
    },
    {
      step: 'Action Plan',
      duration: '2 min',
      narrative:
        'Helmsman recommends hold at anchorage, incident report, P&I notification. Rationale cites OFAC strict liability, financial exposure, and the weather ruling. James sees the recommendation with its evidence chain.',
      showIn: ['vessels/recommendation/mar-001', 'vessels/evidence'],
      roleSwitch: 'fleet-operator',
    },
    {
      step: 'Operator Approval',
      duration: '2 min',
      narrative:
        "James approves in 5 minutes — notes he's calling P&I directly. Counsel executes: master notified, incident report filed, P&I notified, charterer updated. Everything logged with attribution.",
      showIn: ['vessels/approval-gate', 'vessels/execution/mar-001'],
      roleSwitch: 'fleet-operator',
    },
    {
      step: 'Auditor View',
      duration: '2 min',
      narrative:
        'Switch to Robert Tanner — Compliance Officer. He sees the full voyage audit trail: every event, every decision, every actor, every timestamp. He exports the incident package for the flag state and P&I Club.',
      showIn: ['vessels/audit-trail', 'vessels/export'],
      roleSwitch: 'compliance-auditor',
    },
    {
      step: 'Outcome',
      duration: '2 min',
      narrative:
        'OFAC clears the vessel in 4.5 hours. Voyage resumes. Demurrage of $112,000 is recoverable. Executive summary is auto-generated. The full voyage record is preserved — defensible in any inquiry.',
      showIn: ['vessels/outcome', 'vessels/executive-summary'],
      roleSwitch: 'fleet-operator',
    },
  ],
};

export type MaritimeNarrative = typeof MARITIME_NARRATIVE;
