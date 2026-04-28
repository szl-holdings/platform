export const maintenanceItems = [
  {
    id: 'm-001',
    task: 'HVAC System Inspection',
    priority: 'high',
    dueDate: '2026-04-05',
    status: 'overdue',
    cost: 12500,
    assignee: 'Facilities — R. Torres',
  },
  {
    id: 'm-002',
    task: 'Elevator Modernization Phase 2',
    priority: 'medium',
    dueDate: '2026-04-15',
    status: 'scheduled',
    cost: 85000,
    assignee: 'Capital Projects — M. Singh',
  },
  {
    id: 'm-003',
    task: 'Roof Membrane Replacement (Bldg B)',
    priority: 'medium',
    dueDate: '2026-05-01',
    status: 'scheduled',
    cost: 42000,
    assignee: 'Capital Projects — M. Singh',
  },
  {
    id: 'm-004',
    task: 'Parking Lot Resurfacing',
    priority: 'low',
    dueDate: '2026-06-15',
    status: 'planned',
    cost: 28000,
    assignee: 'Facilities — R. Torres',
  },
  {
    id: 'm-005',
    task: 'Fire Suppression System Test',
    priority: 'high',
    dueDate: '2026-04-01',
    status: 'scheduled',
    cost: 4500,
    assignee: 'Life Safety — J. Okafor',
  },
];

export const OWNERSHIP_RECORDS = {
  'prop-001': {
    entity: 'Meridian Capital Holdings LLC',
    type: 'LLC',
    jurisdiction: 'Delaware',
    principals: [
      'S. Lutar (GP — 60%)',
      'Pacific Arbor Partners (LP — 25%)',
      'Management Carry (15%)',
    ],
    lender: 'Wells Fargo Real Estate Capital',
    loanBalance: '$41.2M',
    maturityDate: '2028-06-15',
    ltv: '57%',
    dscr: '1.38x',
    counsel: 'Morrison Foerster LLP',
    lastTransfer: '2021-06-15',
    sourceLabel: 'County Recorder · ACRIS',
    freshness: 'Verified 2 days ago',
  },
  'prop-002': {
    entity: 'PHPlaza Investors LP',
    type: 'Limited Partnership',
    jurisdiction: 'California',
    principals: [
      'SZL Holdings (GP — 55%)',
      'Sovereign Capital Partners (LP — 30%)',
      'Pacific Pension Trust (LP — 15%)',
    ],
    lender: 'JPMorgan Chase Real Estate',
    loanBalance: '$63.8M',
    maturityDate: '2027-03-20',
    ltv: '59%',
    dscr: '1.22x',
    counsel: 'Latham & Watkins LLP',
    lastTransfer: '2020-03-20',
    sourceLabel: 'County Assessor · Title Report',
    freshness: 'Verified 5 days ago',
  },
  'prop-007': {
    entity: 'Skyline Lofts Chicago LLC',
    type: 'LLC',
    jurisdiction: 'Illinois',
    principals: ['S. Lutar (GP — 70%)', 'Midwest RE Fund II (LP — 30%)'],
    lender: 'Signature Bank RE Division',
    loanBalance: '$16.8M',
    maturityDate: '2026-09-14',
    ltv: '78%',
    dscr: '0.94x',
    counsel: 'Kirkland & Ellis LLP',
    lastTransfer: '2023-02-14',
    sourceLabel: 'Cook County Recorder',
    freshness: 'Verified 1 day ago',
  },
};

export const DILIGENCE_CHECKLISTS: Record<
  string,
  {
    item: string;
    status: 'complete' | 'in-progress' | 'pending' | 'flagged';
    assignee: string;
    due?: string;
    note?: string;
  }[]
> = {
  'prop-001': [
    { item: 'Title report reviewed', status: 'complete', assignee: 'Legal — M. Osei', note: 'Clear title, no liens' },
    { item: 'Phase I Environmental', status: 'complete', assignee: 'Environmental — K. Walsh', note: 'No RECs identified' },
    { item: 'Structural inspection', status: 'complete', assignee: 'Engineering — B. Park', note: 'Minor deferred maintenance only' },
    { item: 'Rent roll verification', status: 'in-progress', assignee: 'Asset Mgmt — D. Kim', due: '2026-04-10' },
    { item: 'Lease abstract review', status: 'in-progress', assignee: 'Legal — M. Osei', due: '2026-04-12' },
    { item: 'HVAC/MEP assessment', status: 'flagged', assignee: 'Engineering — B. Park', note: 'HVAC replacement may require $500K capex' },
    { item: 'Insurance review', status: 'complete', assignee: 'Risk — T. Allen' },
    { item: 'Lender estoppel', status: 'pending', assignee: 'Legal — M. Osei', due: '2026-04-20' },
  ],
  'prop-007': [
    { item: 'Title report reviewed', status: 'complete', assignee: 'Legal — M. Osei' },
    { item: 'Phase I Environmental', status: 'in-progress', assignee: 'Environmental — K. Walsh', due: '2026-04-08' },
    { item: 'Structural inspection', status: 'pending', assignee: 'Engineering — B. Park', due: '2026-04-15' },
    { item: 'Rent roll verification', status: 'flagged', assignee: 'Asset Mgmt — D. Kim', note: 'Delinquency cluster in units 4B–4F' },
    { item: 'Operating statements (T12)', status: 'in-progress', assignee: 'Finance — J. Okafor', due: '2026-04-05' },
    { item: 'Loan payoff quote', status: 'complete', assignee: 'Capital Markets — R. Torres', note: 'Maturity 9/14/26 — refinance urgency high' },
    { item: 'Lender approval / consent', status: 'pending', assignee: 'Legal — M. Osei', due: '2026-04-25' },
    { item: 'Remediation cost estimate', status: 'flagged', assignee: 'Engineering — B. Park', note: 'Deferred maintenance: ~$2.1M estimate' },
  ],
};

export const ACTION_ITEMS: Record<
  string,
  {
    id: string;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    owner: string;
    ownerRole: string;
    due: string;
    status: 'open' | 'in-progress' | 'resolved';
    action: string;
  }[]
> = {
  'prop-007': [
    { id: 'act-001', issue: 'Occupancy at 68.4% — 30 units vacant', severity: 'critical', owner: 'D. Kim', ownerRole: 'Asset Mgmt', due: '2026-04-15', status: 'in-progress', action: 'Activate leasing incentive program; engage Compass multifamily team' },
    { id: 'act-002', issue: 'Sterling Design Studio — 45 days past due, $6,400', severity: 'critical', owner: 'T. Allen', ownerRole: 'Risk & Collections', due: '2026-04-07', status: 'open', action: 'Demand letter sent; escalate to eviction counsel if unpaid by Apr 7' },
    { id: 'act-003', issue: 'Loan maturity Sept 2026 — DSCR at 0.94x', severity: 'critical', owner: 'R. Torres', ownerRole: 'Capital Markets', due: '2026-05-01', status: 'open', action: 'Engage lender for maturity extension; simultaneously market for refi' },
    { id: 'act-004', issue: 'Deferred maintenance estimate $2.1M', severity: 'high', owner: 'B. Park', ownerRole: 'Engineering', due: '2026-04-30', status: 'open', action: 'Complete scope + bid by Apr 30; include in lender remediation plan' },
  ],
  'prop-005': [
    { id: 'act-005', issue: 'Retail occupancy 78.1% — 7 units vacant', severity: 'high', owner: 'D. Kim', ownerRole: 'Asset Mgmt', due: '2026-04-20', status: 'open', action: 'Tenant incentive program — 3 months free rent for 5+ year leases' },
    { id: 'act-006', issue: 'Luna Boutique lease expiring Jun 2026', severity: 'medium', owner: 'M. Osei', ownerRole: 'Legal', due: '2026-05-01', status: 'open', action: 'Send renewal proposal with updated market terms' },
  ],
  'prop-001': [
    { id: 'act-007', issue: 'HVAC Building B overdue maintenance', severity: 'medium', owner: 'R. Torres', ownerRole: 'Facilities', due: '2026-04-05', status: 'in-progress', action: 'Vendor contracted; work order #WO-2026-0847 active' },
    { id: 'act-008', issue: 'Horizon Tech Labs lease expires May 2026', severity: 'medium', owner: 'M. Osei', ownerRole: 'Legal', due: '2026-04-15', status: 'open', action: 'Schedule renewal conversation; assess market rate delta' },
  ],
};

export const SOURCE_LABELS: Record<string, { source: string; freshness: string; confidence: string }> = {
  'prop-001': { source: 'Internal → Asset Management System', freshness: 'Updated 2h ago', confidence: 'High' },
  'prop-002': { source: 'Internal → Asset Management System', freshness: 'Updated 3h ago', confidence: 'High' },
  'prop-003': { source: 'Internal → Asset Management System', freshness: 'Updated 5h ago', confidence: 'High' },
  'prop-004': { source: 'Internal → Asset Management System', freshness: 'Updated 1h ago', confidence: 'High' },
  'prop-005': { source: 'Internal → Asset Management System', freshness: 'Updated 4h ago', confidence: 'Medium' },
  'prop-006': { source: 'Internal → Asset Management System', freshness: 'Updated 2h ago', confidence: 'High' },
  'prop-007': { source: 'Internal → Asset Management System', freshness: 'Updated 30m ago', confidence: 'High' },
  'prop-008': { source: 'Internal → Asset Management System', freshness: 'Updated 6h ago', confidence: 'High' },
};
