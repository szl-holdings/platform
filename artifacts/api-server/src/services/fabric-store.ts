// fabric-store.ts — deterministic fabric data for all verticals
// Seeded RNG (mulberry32, seed=42) produces identical output to frontend data/fabric/generated.ts

// ─── RNG ─────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const VIDS = ['terra', 'vessels', 'counsel', 'carlota', 'aegis', 'lyte', 'sentra'] as const;
type VerticalId = typeof VIDS[number];
const TWIN_IDS: Record<VerticalId, string> = {
  terra: 'twin-terra', vessels: 'twin-vessels', counsel: 'twin-counsel',
  carlota: 'twin-carlota', aegis: 'twin-aegis', lyte: 'twin-lyte', sentra: 'twin-sentra',
};

// ─── Signals ──────────────────────────────────────────────────────────────────
const SIGNAL_TITLES: Record<VerticalId, readonly string[]> = {
  terra: ['Pipeline velocity declining in Southeast','Vendor SLA breach — HVAC contractor overdue','Occupancy below 92% threshold','Budget variance on renovation project','Inspection overdue — property TX-0412','Lease expiration approaching — 4 units','Document gap in acquisition package','Maintenance escalation — roof leak','Tenant complaint spike — noise issue','Cap rate compression signal','Property tax reassessment notice','Vendor insurance lapse detected','Environmental assessment pending','Parking lot resurfacing behind schedule','Fire suppression inspection overdue','Zoning variance hearing scheduled','Construction permit delay','Appraisal value divergence detected'],
  vessels: ['AIS gap detected — 4h dark window','Demurrage accruing at Rotterdam','Sanctions screening delayed','Weather disruption — typhoon track','Fuel cost spike — bunker prices up 8%','Port congestion at Singapore','Charter party clause conflict','Cargo temperature deviation','Crew certification expiring','Ballast water compliance gap','Hull inspection overdue','Route deviation detected — 12nm off course','Port state control deficiency','Bunker quality dispute','Insurance P&I renewal approaching','ETA variance exceeding 6h threshold','Cargo stowage plan conflict','Piracy risk zone transit planned'],
  counsel: ['Discovery deadline in 5 days','Missing medical records — claimant Jenkins','Filing status change — Motion granted','Expert witness availability conflict','Deposition scheduling gap','Statute of limitations approaching','Settlement demand received','Opposing counsel motion filed','Document production incomplete','Privilege review needed — 200 docs','Court scheduling conflict','Mediation window opening','Insurance coverage dispute','Witness statement inconsistency','New evidence received — surveillance','Appellate brief deadline approaching','Pro hac vice application needed'],
  carlota: ['Landscaping vendor behind schedule','HVAC maintenance window approaching','Guest arrival coordination gap','Pool service reliability concern','Staff NDA processing incomplete','Wine cellar temperature alert','Security system firmware update due','Seasonal transition prep needed','Art collection insurance renewal','Vehicle maintenance schedule conflict','Catering vendor confirmation pending','Smart home system update available','Garden irrigation system fault','Guest suite preparation needed','Holiday decoration timeline starting','Household inventory audit due'],
  aegis: ['Critical CVE detected — 12 assets exposed','Identity anomaly — lateral movement attempt','MFA bypass rate increased 3x','Vulnerability backlog at 14d MTTR','Access review overdue — 340 identities','Backup verification gap — 3 systems','Firewall rule change — unauthorized','Endpoint agent offline — 8 devices','Phishing campaign detected','Certificate expiration — production TLS','Privileged access spike detected','Security baseline drift — 12 controls','Data loss prevention alert','Third-party access review overdue','SIEM correlation rule gap','Cloud configuration drift detected','API key rotation overdue','Network segmentation violation'],
  lyte: ['Revenue KPI 4% below Q2 target','Initiative milestone slipped 2 weeks','Ownership gap — team lead transition','Decision delay — pricing approval 8d','Board reporting gap — Q1 narrative','Dependency blockage — API integration','Budget variance — marketing overspend','Stakeholder alignment gap detected','Strategic initiative stalled — 3 weeks','Customer churn signal — enterprise tier','Hiring pipeline behind target','Product roadmap conflict detected','Cross-department dependency unresolved','OKR progress behind schedule','Executive escalation — customer issue','Competitor launch detected','Partnership negotiation stalled'],
  sentra: ['Policy exception requested — Terra vendor','Rollback triggered — firewall rule reverted','Audit compilation deadline — SOC 2','Policy bypass attempt blocked','Approval queue depth — 8 items stale','Secret detected in log output','Cross-vertical policy conflict found','Rollback readiness test failed','Governance SLA approaching breach','Approval delegation chain broken','Policy version conflict detected','Emergency override used — audit required','Evidence chain gap — 2 controls','Approval latency exceeding 48h SLA','Policy enforcement exception logged','Audit finding remediation overdue','Access control policy update needed'],
};
const SIG_TYPES = ['risk','opportunity','deadline','anomaly','drift','compliance','cost','vendor','document','operational','security','legal_workflow','executive_decision'] as const;
const SIG_STATUSES = ['new','triaged','routed','approved','resolved','deferred','blocked'] as const;
const SEVERITIES = ['critical','high','medium','low'] as const;
const SOURCES = ['System monitor','Operator report','Automated scan','Vendor notification','External feed','Scheduled check','Anomaly detector','Threshold alert'] as const;

const rng = mulberry32(42);

function ts(i: number): string {
  const base = new Date('2026-04-01T00:00:00Z').getTime();
  const offset = Math.floor(i * 7200000 + rng() * 3600000);
  return new Date(base + offset).toISOString();
}

export const FABRIC_SIGNALS = VIDS.flatMap((vid, vi) => {
  const titles = SIGNAL_TITLES[vid];
  return titles.map((title, ti) => {
    const idx = vi * 18 + ti;
    return {
      id: `sig-${vid}-${String(ti + 1).padStart(3,'0')}`,
      verticalId: vid,
      twinId: TWIN_IDS[vid],
      title,
      description: `${title}. Detected by ${pick(rng, SOURCES)} and routed to ${vid} operations for review.`,
      signalType: pick(rng, SIG_TYPES),
      source: pick(rng, SOURCES),
      severity: pick(rng, SEVERITIES),
      confidence: Math.round((0.65 + rng() * 0.3) * 100) / 100,
      timestamp: ts(idx),
      relatedEntity: `${vid.toUpperCase()}-${String(Math.floor(rng() * 9000 + 1000))}`,
      recommendedAction: `Review and triage: ${title.toLowerCase()}`,
      sentraReviewRequired: rng() > 0.6,
      chainlightScenarioId: `chl-${vid}-${String(ti+1).padStart(3,'0')}`,
      proofChainAnchorId: `pca-${vid}-${String(ti+1).padStart(3,'0')}`,
      status: pick(rng, SIG_STATUSES),
    };
  });
});

// ─── Risks ────────────────────────────────────────────────────────────────────
const RISK_TITLES: Record<VerticalId, readonly string[]> = {
  terra: ['Deal slippage on Dallas industrial portfolio','Budget overrun risk — Miami renovation','Lease expiration cluster — Q3 2026','Vendor failure — electrical subcontractor','Compliance gap — fire code violation','Asset degradation — parking structure','Property tax appeal deadline risk','Environmental remediation exposure','Tenant default — anchor tenant','Occupancy rate decline trajectory','Insurance coverage gap — flood zone','Capital reserve depletion risk'],
  vessels: ['Sanctions exposure — Black Sea route','Weather disruption — Pacific typhoon track','Fuel cost spike propagation','Port congestion delay cascade','Charter party default risk','Crew visa expiration — 4 seafarers','Hull condition — class survey overdue','Cargo damage liability — reefer malfunction','P&I insurance coverage gap','Ballast water treatment system failure','Piracy risk — Gulf of Aden transit','Demurrage cost escalation'],
  counsel: ['Evidentiary gap — Rodriguez depositions','Deadline cluster — 4 filings in 72h','Expert witness conflict — Dr. Chen','Statute of limitations exposure','Adverse discovery ruling risk','Settlement authority gap','Privilege waiver risk — document review','Opposing expert report quality gap','Court scheduling conflict — parallel matters','Insurance coverage dispute escalation','Witness credibility challenge','Appeal deadline proximity'],
  carlota: ['Vendor reliability — pool service','Privacy exposure — staff onboarding','Seasonal transition delay','Security system vulnerability','Wine collection insurance lapse','Household staff retention risk','Property maintenance backlog','Guest experience quality gap','Smart home integration failure','Art storage climate control issue'],
  aegis: ['Critical vulnerability backlog — 14d MTTR','Access review overdue — 340 identities','Backup verification gap — 3 systems','Endpoint protection coverage gap','Certificate expiration cascade risk','Third-party vendor access exposure','Cloud misconfiguration propagation','API security posture degradation','SIEM detection coverage gap','Privileged access management drift','Data exfiltration vector — unmonitored','Security baseline erosion trend'],
  lyte: ['Execution drift — 3 strategic initiatives','Pricing model decision delay','Board reporting completeness gap','Revenue target miss trajectory','Talent pipeline quality decline','Product roadmap dependency conflict','Customer churn acceleration signal','Cross-department handoff failure','OKR coverage gap — 2 departments','Strategic initiative resource gap','Partnership deal stall risk'],
  sentra: ['Policy bypass attempt pattern','Audit evidence gap — 3 controls','Approval queue stale items','Cross-vertical policy contradiction','Rollback readiness degradation','Secret exposure — log scanning gap','Governance SLA breach trajectory','Policy version synchronization gap','Emergency override pattern concern'],
};
const RISK_CATS = ['operational','financial','legal_workflow','security','compliance','vendor','asset','deadline','reputation','data_quality','decision_delay','control_drift'] as const;
const RISK_STATS = ['open','mitigating','accepted','closed'] as const;
const OWNERS = ['J. Martinez','S. Chen','A. Patel','M. Johnson','R. Williams','K. Nakamura','D. Thompson','L. Garcia','B. Anderson','T. Robinson'] as const;
const MITIGATIONS = ['Escalate to domain lead','Apply compensating control','Schedule remediation sprint','Request additional evidence','Trigger approval workflow','Deploy interim workaround','Engage vendor for resolution','Activate contingency plan'] as const;

const EV_TITLES: Record<VerticalId, readonly string[]> = {
  terra: ['Property appraisal report — TX-0412','Vendor SLA compliance log — Q1 2026','Inspection report — fire suppression system','Lease agreement — anchor tenant renewal','Budget approval — Miami renovation','Environmental assessment — Phase I report','Property tax assessment notice — Dallas','Maintenance work order — roof repair','Tenant complaint log — noise abatement','Insurance certificate — flood coverage','Capital improvement plan — parking lot','Vendor insurance verification — HVAC contractor','Zoning variance application','Construction permit — electrical upgrade','Property condition assessment — annual'],
  vessels: ['AIS track log — MV Horizon Star','Sanctions screening report — OFAC','Bunker delivery receipt — Rotterdam','Charter party agreement — TC-2026-041','Port state control report — Singapore','Hull condition survey — class certificate','Cargo manifest — bill of lading','Weather routing report — Pacific crossing','Fuel quality test certificate','Crew certification bundle — officers','P&I insurance policy — annual renewal','Demurrage calculation worksheet','Ballast water treatment log','Voyage P&L settlement — VY-2026-018','Piracy risk assessment — Gulf transit'],
  counsel: ['Discovery response — CM-2024-0891','Medical records — claimant Jenkins','Expert report — Dr. Chen biomechanics','Deposition transcript — witness Rodriguez','Filing receipt — Motion to Dismiss','Settlement demand letter — $1.2M','Privilege log — document review batch','Court order — scheduling conference','Insurance coverage opinion — excess layer','Mediation brief — joint session prep','Opposing counsel motion — summary judgment','Witness statement — accident reconstruction','Appellate brief draft — final version','Document production log — batch 3','Expert engagement letter — Dr. Park'],
  carlota: ['Vendor service agreement — landscaping','Staff NDA — new hire batch Q2','Security system audit report','Wine cellar inventory — annual','Smart home system configuration log','Guest preference registry — updated','Art collection appraisal — 2026','Household maintenance schedule — Q2','HVAC service record — primary residence','Vehicle maintenance log — fleet','Catering vendor contract — events','Holiday preparation checklist','Irrigation system maintenance record','Guest suite inspection report','Insurance policy — art collection'],
  aegis: ['Vulnerability scan report — Q2 2026','Access review completion certificate','Backup recovery drill results','Penetration test report — external','Certificate inventory — production TLS','SIEM rule update changelog','Firewall rule audit report','Endpoint agent deployment manifest','Phishing simulation results — April','Cloud security baseline assessment','DLP policy coverage report','Incident response drill after-action','Third-party vendor security assessment','Security awareness training completion','API security scan results'],
  lyte: ['Revenue KPI dashboard — Q2 tracking','Initiative status report — Platform v3','Board meeting minutes — March 2026','Decision log — pricing model review','OKR scorecard — Q1 final','Cross-department dependency matrix','Marketing ROI analysis — Q1 campaigns','Customer retention report — enterprise','Hiring pipeline status — engineering','Strategic plan — FY2027 draft','Stakeholder survey results — alignment','Budget variance report — marketing','Partnership term sheet — draft','Product roadmap — Q3 plan','Executive escalation log — Q1'],
  sentra: ['Policy exception log — Q1 2026','Rollback execution record — firewall','SOC 2 Type II evidence bundle','Approval queue audit report','Policy version control log','Secret scanning coverage report','Governance SLA compliance dashboard','Emergency override justification log','Cross-vertical policy alignment matrix','Approval delegation chain registry','Audit finding remediation tracker','Policy contradiction analysis report','Access control policy — v3.2','Blocked action register — Q1','Governance training completion log'],
};

export const FABRIC_RISKS = VIDS.flatMap((vid) => {
  const titles = RISK_TITLES[vid];
  return titles.map((title, ti) => {
    const prob = Math.round((0.2 + rng() * 0.7) * 100) / 100;
    const impact = Math.round((0.3 + rng() * 0.6) * 100) / 100;
    const velocity = Math.round((0.5 + rng() * 0.5) * 100) / 100;
    return {
      id: `risk-${vid}-${String(ti+1).padStart(3,'0')}`,
      verticalId: vid,
      twinId: TWIN_IDS[vid],
      title,
      description: `${title}. Requires mitigation and monitoring through the Command Fabric governance layer.`,
      riskCategory: pick(rng, RISK_CATS),
      riskScore: Math.round(prob * impact * velocity * 100),
      probability: prob, impact, velocity,
      owner: pick(rng, OWNERS),
      mitigation: pick(rng, MITIGATIONS),
      approvalRequired: rng() > 0.4,
      evidenceIds: [`ev-${vid}-${String((ti*2) % EV_TITLES[vid].length + 1).padStart(3,'0')}`,`ev-${vid}-${String((ti*2+1) % EV_TITLES[vid].length + 1).padStart(3,'0')}`],
      relatedSignals: [`sig-${vid}-${String(ti+1).padStart(3,'0')}`],
      status: pick(rng, RISK_STATS),
      route: `/fabric/risks?id=risk-${vid}-${String(ti+1).padStart(3,'0')}`,
    };
  });
});

// ─── Decisions ────────────────────────────────────────────────────────────────
const DEC_TITLES: Record<VerticalId, readonly string[]> = {
  terra: ['Advance Dallas industrial acquisition','Approve HVAC vendor replacement','Budget exception — Miami capex overage','Renew anchor tenant lease at revised terms','Engage environmental consultant','Approve property tax appeal filing','Schedule capital improvement — parking','Authorize emergency roof repair','Approve vendor insurance waiver'],
  vessels: ['Approve route deviation — weather avoidance','Escalate sanctions screening to compliance','Authorize bunker procurement — spot market','Approve demurrage claim filing','Schedule hull inspection — dry dock','Accept charter party amendment','Approve crew overtime — port operations','Authorize cargo re-stowage','Escalate piracy risk — re-route decision'],
  counsel: ['Prepare discovery response packet','Authorize settlement negotiation range','Retain backup expert witness','File motion for extension','Approve document production scope','Schedule mediation session','Authorize deposition transcript rush','Approve expert report engagement','File appellate brief — proceed decision'],
  carlota: ['Engage replacement pool vendor','Approve staff bonus — holiday season','Schedule wine cellar maintenance','Authorize security system upgrade','Approve guest suite renovation','Engage landscape redesign vendor','Schedule art collection appraisal','Authorize smart home platform migration'],
  aegis: ['Deploy critical CVE patch — production','Approve emergency access review','Schedule backup recovery drill','Authorize firewall rule rollback','Approve endpoint agent mass update','Engage third-party pentest vendor','Authorize certificate rotation — all prod','Approve SIEM rule update package','Escalate identity anomaly investigation'],
  lyte: ['Approve pricing model revision','Assign interim Data Engineering lead','Authorize marketing budget reallocation','Approve initiative pivot — Platform v3','Schedule board strategy session','Approve cross-department resource share','Authorize customer retention package','Escalate partnership negotiation','Approve OKR target revision'],
  sentra: ['Grant Terra vendor fast-track exception','Approve policy update — access controls','Authorize rollback readiness test','Approve audit evidence remediation plan','Grant emergency override retrospective','Approve cross-vertical policy alignment','Authorize secret scanning expansion','Approve governance SLA revision'],
};
const DEC_TYPES = ['approve_vendor','escalate_risk','adjust_route','request_evidence','assign_owner','approve_patch','update_policy','schedule_service','advance_deal','prepare_attorney_packet','close_exception'] as const;
const DEC_STATS = ['draft','awaiting_review','approved','rejected','executed','deferred'] as const;

export const FABRIC_DECISIONS = VIDS.flatMap((vid) => {
  const titles = DEC_TITLES[vid];
  return titles.map((title, ti) => {
    const opts = ['Approve as proposed','Approve with conditions','Defer for additional review','Reject — insufficient evidence'];
    return {
      id: `dec-${vid}-${String(ti+1).padStart(3,'0')}`,
      verticalId: vid,
      twinId: TWIN_IDS[vid],
      title,
      decisionType: pick(rng, DEC_TYPES),
      summary: `${title}. Decision routed through Command Fabric for governance review and human approval.`,
      options: opts,
      recommendedOption: pick(rng, opts),
      chainlightConfidence: Math.round((0.7 + rng() * 0.25) * 100) / 100,
      sentraApprovalState: pick(rng, DEC_STATS),
      humanOwner: pick(rng, OWNERS),
      deadline: new Date(Date.now() + Math.floor(rng() * 14 * 86400000)).toISOString().slice(0,10),
      evidenceIds: [`ev-${vid}-${String(ti % EV_TITLES[vid].length + 1).padStart(3,'0')}`],
      expectedOutcome: `Successful resolution of: ${title.toLowerCase()}`,
      downsideRisk: `Delay or failure in: ${title.toLowerCase()}`,
      status: pick(rng, DEC_STATS),
    };
  });
});

// ─── Outcomes ─────────────────────────────────────────────────────────────────
const OUTCOME_TEMPLATES: Record<VerticalId, readonly { predicted: string; actual: string; lesson: string }[]> = {
  terra: [
    {predicted:'Deal closes within 45 days',actual:'Deal closed in 52 days — vendor delay',lesson:'Build 15% buffer into deal timelines for vendor dependencies'},
    {predicted:'Occupancy stabilizes above 93%',actual:'Occupancy reached 94.2%',lesson:'Tenant retention incentives effective at current rate'},
    {predicted:'Budget holds within 5% variance',actual:'Budget exceeded by 7% — material cost spike',lesson:'Lock material pricing at contract signing for renovations'},
    {predicted:'Vendor remediation within SLA',actual:'Vendor completed 1 day early',lesson:'Escalation protocol effective for SLA enforcement'},
    {predicted:'Lease renewal at market rate',actual:'Renewal at 2% below market — tenant retention priority',lesson:'Below-market renewals acceptable when vacancy cost exceeds discount'},
    {predicted:'Inspection closes clean',actual:'Inspection flagged minor electrical issue',lesson:'Pre-inspection walkthroughs reduce surprise findings by 60%'},
    {predicted:'Property tax appeal reduces assessment 8%',actual:'Assessment reduced 6%',lesson:'Comparable selection methodology needs refinement for suburban properties'},
    {predicted:'Environmental assessment clears',actual:'Phase I clean — no further action',lesson:'Pre-screening with desktop review saves 40% on clean sites'},
    {predicted:'Capital improvement on schedule',actual:'Completed 3 weeks late — permit delay',lesson:'Submit permit applications 30 days earlier for municipality X'},
    {predicted:'Vendor replacement improves SLA',actual:'New vendor meeting 98% SLA — improvement confirmed',lesson:'Vendor scorecard system accurately predicts replacement outcomes'},
    {predicted:'Tenant complaint resolution within 48h',actual:'Resolved in 36h',lesson:'Dedicated response team reduces complaint resolution time 25%'},
    {predicted:'Cap rate holds within 10bps',actual:'Cap rate compressed 15bps — market movement',lesson:'Monthly market comps needed for volatile submarkets'},
  ],
  vessels: [
    {predicted:'Voyage completes within ETA window',actual:'Arrived 8h late — weather deviation',lesson:'Weather-adjusted ETA models need 12h buffer for monsoon season'},
    {predicted:'Sanctions screening clears',actual:'Cleared after 3 additional checks',lesson:'Pre-screening reduces clearance time by 40% for repeat counterparties'},
    {predicted:'Fuel cost within 5% of estimate',actual:'Fuel cost 3% under estimate',lesson:'Slow steaming saves 6-8% fuel on Pacific routes in current market'},
    {predicted:'No demurrage incurred',actual:'Demurrage at $12,000 — port congestion',lesson:'Singapore congestion patterns predictable with 5-day AIS density analysis'},
    {predicted:'Charter renewed at improved rate',actual:'Charter renewed — rate flat',lesson:'Market leverage limited in current oversupply conditions'},
    {predicted:'Route optimization saves 2 days',actual:'Saved 1.5 days — current adjustment needed',lesson:'Real-time ocean current data improves route optimization by 20%'},
    {predicted:'AIS coverage maintained 100%',actual:'AIS gap of 2h detected — equipment malfunction',lesson:'AIS equipment redundancy reduces dark window risk significantly'},
    {predicted:'Port state control passes clean',actual:'One deficiency noted — fire equipment',lesson:'Monthly fire equipment checks prevent PSC deficiencies'},
    {predicted:'Cargo loaded within window',actual:'Loading delayed 6h — crane availability',lesson:'Pre-book cranes 72h in advance for high-traffic ports'},
    {predicted:'Ballast water treatment compliant',actual:'Compliant — treatment system functioned correctly',lesson:'Quarterly calibration maintains treatment effectiveness'},
    {predicted:'Insurance P&I renewal at same terms',actual:'Renewal with 5% premium increase — claims history',lesson:'Loss prevention investment reduces P&I premiums over 24-month horizon'},
    {predicted:'Crew rotation on schedule',actual:'Rotation delayed 2 days — visa processing',lesson:'Begin visa processing 45 days before rotation date'},
  ],
  counsel: [
    {predicted:'Discovery response filed on time',actual:'Filed 1 day early',lesson:'Assembly buffer of 3 days prevents deadline stress'},
    {predicted:'Evidence completeness reaches 95%',actual:'Reached 92% — 3 records outstanding',lesson:'Medical records requests should begin at matter intake, not discovery'},
    {predicted:'Expert deposition strengthens case',actual:'Expert performance rated strong by attorney',lesson:'Pre-deposition prep session improves expert performance significantly'},
    {predicted:'Settlement within authority range',actual:'Settlement below authority — favorable outcome',lesson:'Evidence quality drives settlement outcomes more than negotiation tactics'},
    {predicted:'Filing accepted by court',actual:'Accepted — no deficiencies',lesson:'Court-specific formatting checklists eliminate rejection risk'},
    {predicted:'Mediation produces resolution',actual:'Mediation reached partial agreement',lesson:'Pre-mediation brief exchange improves resolution rate by 30%'},
    {predicted:'Document production complete',actual:'Completed with 2 privilege log additions',lesson:'Privilege review automation reduces manual review time by 50%'},
    {predicted:'Expert report quality meets threshold',actual:'Report exceeded expectations — comprehensive analysis',lesson:'Detailed expert engagement letter produces better work product'},
    {predicted:'Motion granted in full',actual:'Motion granted in part — partial relief',lesson:'Narrower motions with targeted relief tend to succeed more fully'},
    {predicted:'Matter cycle time within benchmark',actual:'Cycle time 10% below benchmark',lesson:'Early case assessment reduces overall matter duration consistently'},
    {predicted:'Attorney review completed on schedule',actual:'Review completed — 2 issues flagged',lesson:'Structured review checklists catch 30% more issues than narrative review'},
    {predicted:'Court date maintained',actual:'Court date held as scheduled',lesson:'Proactive judge communication reduces continuance risk'},
  ],
  carlota: [
    {predicted:'Vendor service window maintained',actual:'Window maintained — vendor arrived on time',lesson:'Confirmed vendor 24h in advance reduces no-show rate to near zero'},
    {predicted:'Preference honored for event',actual:'All preferences met — guest satisfaction high',lesson:'Preference registry with version dates prevents stale preference errors'},
    {predicted:'Maintenance completed before season',actual:'Completed 1 week before deadline',lesson:'Seasonal maintenance calendar with 2-week buffer works well'},
    {predicted:'Staff onboarding completed securely',actual:'All NDAs processed — background checks clear',lesson:'Parallel processing of NDA and background check saves 5 days'},
    {predicted:'Smart home update deployed cleanly',actual:'Update successful — one device required manual restart',lesson:'Phased rollout to non-critical devices first reduces disruption risk'},
    {predicted:'Guest experience rated excellent',actual:'Experience rated excellent by principal',lesson:'Pre-arrival walkthrough with checklist ensures quality consistently'},
    {predicted:'Art collection appraisal on schedule',actual:'Appraisal completed — 2 pieces need re-evaluation',lesson:'Market-based appraisals should be refreshed annually for volatile categories'},
    {predicted:'Security system upgrade completed',actual:'Upgrade completed — firmware verified',lesson:'Vendor-managed firmware updates more reliable than self-managed'},
    {predicted:'Wine cellar temperature maintained',actual:'Temperature held within 0.5F of target',lesson:'Dual-sensor monitoring catches HVAC drift before threshold breach'},
    {predicted:'Holiday prep completed on time',actual:'Prep completed 2 days early',lesson:'Starting holiday prep 6 weeks out instead of 4 reduces stress'},
  ],
  aegis: [
    {predicted:'Critical CVE patched within 72h',actual:'Patched in 48h — accelerated deployment',lesson:'Pre-approved emergency patch workflow reduces MTTR by 40%'},
    {predicted:'Access review completes within SLA',actual:'Completed — 12 accounts deprovisioned',lesson:'Automated access review reminders increase completion rate by 60%'},
    {predicted:'Backup recovery drill succeeds',actual:'Recovery successful — 2h RTO achieved',lesson:'Quarterly drills maintain team readiness and verify backup integrity'},
    {predicted:'Endpoint agent coverage reaches 100%',actual:'Coverage at 99.2% — 3 legacy devices excluded',lesson:'Legacy device exemption policy needed with compensating controls'},
    {predicted:'Certificate rotation completed clean',actual:'All certificates rotated — no service disruption',lesson:'Automated certificate management eliminates manual rotation errors'},
    {predicted:'Pentest report clean of critical findings',actual:'One high finding identified — remediated in 5d',lesson:'Continuous pentest engagement catches issues between annual assessments'},
    {predicted:'SIEM rules tuned — false positive rate drops',actual:'False positive rate reduced 35%',lesson:'Quarterly SIEM tuning sprints maintain detection quality'},
    {predicted:'Firewall rule cleanup reduces attack surface',actual:'Removed 42 unused rules — 15% reduction',lesson:'Monthly firewall hygiene reviews prevent rule bloat'},
    {predicted:'Phishing simulation — click rate below 5%',actual:'Click rate at 3.2%',lesson:'Monthly micro-training more effective than quarterly deep sessions'},
    {predicted:'Cloud configuration aligned to baseline',actual:'Aligned — 2 exceptions documented',lesson:'Infrastructure-as-code enforcement prevents configuration drift'},
    {predicted:'DLP policy covers all sensitive data types',actual:'Coverage at 94% — 2 new data types identified',lesson:'Data classification refresh needed quarterly for evolving data landscape'},
    {predicted:'Incident response drill completes successfully',actual:'Drill completed — communication gap identified',lesson:'Include business stakeholders in IR drills, not just security team'},
  ],
  lyte: [
    {predicted:'Revenue KPI recovers to target',actual:'Recovery to 98% of target — gap closing',lesson:'Early intervention on KPI drift prevents full-quarter misses'},
    {predicted:'Initiative milestone back on track',actual:'Milestone achieved with 3-day delay',lesson:'Dedicated resource allocation for blocked initiatives accelerates recovery'},
    {predicted:'Ownership gap resolved within 2 weeks',actual:'Interim owner assigned in 5 days',lesson:'Pre-identified succession candidates reduce ownership gap duration'},
    {predicted:'Decision velocity improves 20%',actual:'Velocity improved 15%',lesson:'Decision deadline enforcement alone improves velocity by 10-15%'},
    {predicted:'Board report quality meets standard',actual:'Board report rated excellent',lesson:'Structured narrative template plus data dashboard improves board satisfaction'},
    {predicted:'Cross-department dependency resolved',actual:'Dependency resolved — API delivered',lesson:'Weekly cross-department standup prevents dependency escalations'},
    {predicted:'Marketing ROI within expected range',actual:'ROI exceeded expectation by 12%',lesson:'Data-driven campaign selection outperforms intuition-based allocation'},
    {predicted:'Customer retention campaign effective',actual:'Churn reduced 8% in target segment',lesson:'Proactive outreach before renewal window doubles retention rate'},
    {predicted:'Hiring pipeline fills target roles',actual:'Filled 80% of target roles — 2 remaining',lesson:'Structured interview process reduces time-to-hire by 20%'},
    {predicted:'OKR attainment reaches 80%',actual:'OKR attainment at 76%',lesson:'Quarterly OKR check-ins with calibration improve end-of-period attainment'},
    {predicted:'Partnership deal closes',actual:'Deal closed with modified terms',lesson:'Flexibility on non-critical terms accelerates partnership closure'},
  ],
  sentra: [
    {predicted:'Policy exception resolved within SLA',actual:'Resolved in 20h — within 24h SLA',lesson:'Pre-defined exception criteria reduce review time by 50%'},
    {predicted:'Rollback executed cleanly',actual:'Rollback successful — no service impact',lesson:'Automated rollback scripts with pre-validated checkpoints are essential'},
    {predicted:'Audit evidence gap closed',actual:'Gap closed — 3 controls now have attestation',lesson:'Continuous evidence collection prevents audit-time scrambles'},
    {predicted:'Approval queue depth returns to normal',actual:'Queue depth normalized within 48h',lesson:'Auto-escalation for stale approvals prevents queue buildup'},
    {predicted:'Policy contradiction resolved',actual:'Contradiction resolved — unified policy issued',lesson:'Cross-vertical policy review board prevents contradictions at creation time'},
    {predicted:'Secret scanning coverage expanded',actual:'Coverage expanded to all repositories',lesson:'Automated secret scanning in CI/CD pipeline catches 95% of exposures'},
    {predicted:'Governance SLA maintained',actual:'SLA maintained — 99.1% compliance',lesson:'SLA monitoring dashboards drive accountability without manual tracking'},
    {predicted:'Emergency override audit completed',actual:'Audit completed — all overrides justified',lesson:'Real-time override justification capture simplifies retrospective audit'},
    {predicted:'Policy version sync achieved',actual:'All verticals on latest policy version',lesson:'Automated policy distribution with acknowledgment tracking ensures coverage'},
    {predicted:'Approval delegation chain repaired',actual:'Chain repaired — backup reviewers assigned',lesson:'Mandatory backup reviewer assignment prevents delegation chain failures'},
  ],
};

export const FABRIC_OUTCOMES = VIDS.flatMap((vid) => {
  const templates = OUTCOME_TEMPLATES[vid];
  return templates.map((t, ti) => {
    const predErr = Math.round(rng() * 25) / 100;
    const rBefore = Math.round((0.4 + rng() * 0.5) * 100) / 100;
    return {
      id: `out-${vid}-${String(ti+1).padStart(3,'0')}`,
      verticalId: vid,
      twinId: TWIN_IDS[vid],
      originatingDecisionId: `dec-${vid}-${String(Math.min(ti+1, DEC_TITLES[vid].length)).padStart(3,'0')}`,
      predictedOutcome: t.predicted,
      actualOutcome: t.actual,
      predictionError: predErr,
      rewardScore: Math.round((0.6 + rng() * 0.35) * 100) / 100,
      riskBefore: rBefore,
      riskAfter: Math.round(rBefore * (0.3 + rng() * 0.5) * 100) / 100,
      evidenceCompleteness: Math.round((0.8 + rng() * 0.18) * 100) / 100,
      operatorFeedback: rng() > 0.5 ? 'Outcome aligned with expectation' : 'Minor variance — acceptable',
      lessonLearned: t.lesson,
      policyUpdateCandidate: rng() > 0.6,
      reviewed: rng() > 0.3,
      route: `/fabric/outcomes?id=out-${vid}-${String(ti+1).padStart(3,'0')}`,
    };
  });
});

// ─── Evidence ─────────────────────────────────────────────────────────────────
const EV_TYPES_LIST = ['document','ticket','email_summary','system_event','scanner_result','inspection_note','legal_workflow_note','voyage_signal','vendor_update','executive_decision','approval_record','audit_event','policy_clause'] as const;
const EV_SOURCES = ['Internal system','Vendor portal','Court filing system','Port authority','Compliance platform','Manual entry','Automated collection','External audit'] as const;
const EV_STATS = ['collected','verified','disputed','archived'] as const;

export const FABRIC_EVIDENCE = VIDS.flatMap((vid) => {
  const titles = EV_TITLES[vid];
  return titles.map((title, ti) => ({
    id: `ev-${vid}-${String(ti+1).padStart(3,'0')}`,
    verticalId: vid,
    title,
    evidenceType: pick(rng, EV_TYPES_LIST),
    sourceSystem: pick(rng, EV_SOURCES),
    summary: `${title}. Collected and anchored in the Proof Chain for auditability.`,
    authorityScore: Math.round((0.6 + rng() * 0.35) * 100) / 100,
    relatedSignals: [`sig-${vid}-${String(Math.min(ti+1, SIGNAL_TITLES[vid].length)).padStart(3,'0')}`],
    relatedRisks: [`risk-${vid}-${String(Math.min(ti+1, RISK_TITLES[vid].length)).padStart(3,'0')}`],
    relatedDecisions: [`dec-${vid}-${String(Math.min(ti+1, DEC_TITLES[vid].length)).padStart(3,'0')}`],
    relatedOutcomes: [`out-${vid}-${String(Math.min(ti+1, OUTCOME_TEMPLATES[vid].length)).padStart(3,'0')}`],
    proofChainAnchorId: `pca-${vid}-${String(ti+1).padStart(3,'0')}`,
    status: pick(rng, EV_STATS),
    route: `/fabric/evidence?id=ev-${vid}-${String(ti+1).padStart(3,'0')}`,
  }));
});

// ─── Domain Twins ─────────────────────────────────────────────────────────────
export const DOMAIN_TWINS = [
  { id:'twin-terra', verticalId:'terra', name:'TerraTwin', description:'Tracks properties, vendors, pipeline risk, asset exceptions, and deal outcomes across the real estate portfolio.', healthScore:91, signalVolume:342, activeRisks:14, pendingDecisions:7, openApprovals:3, outcomeVelocity:82, evidenceCompleteness:88, chainlightConfidence:0.87, sentraGovernanceState:'green', psycheGovernanceState:'green', argoLearningStatus:'active — 12 lessons last 30d', proofChainCoverage:94, topSignals:['Pipeline velocity slowing in Southeast region','Vendor SLA breach — HVAC contractor 3d overdue','Occupancy dip below 92% threshold at property TX-0412'], topRisks:['Deal slippage on Dallas industrial portfolio','Budget overrun risk on Miami renovation','Lease expiration cluster — Q3 2026'], nextBestActions:['Escalate vendor SLA breach to operations lead','Schedule portfolio review for Q3 lease cluster','Request updated appraisal for Dallas industrial'], linkedRoutes:['/terra','/fabric/risks','/fabric/evidence'] },
  { id:'twin-vessels', verticalId:'vessels', name:'VesselsTwin', description:'Tracks voyages, AIS gaps, sanctions flags, cost exposure, and port exceptions across the maritime fleet.', healthScore:88, signalVolume:518, activeRisks:19, pendingDecisions:11, openApprovals:5, outcomeVelocity:76, evidenceCompleteness:85, chainlightConfidence:0.82, sentraGovernanceState:'amber', psycheGovernanceState:'green', argoLearningStatus:'active — 18 lessons last 30d', proofChainCoverage:91, topSignals:['AIS gap detected — MV Horizon Star, 4h dark window','Demurrage accruing at Rotterdam — 2d over laycan','Sanctions screening delayed for Novorossiysk-bound cargo'], topRisks:['Sanctions exposure on Black Sea route','Weather disruption — Typhoon track crossing Pacific route','Fuel cost spike — bunker prices up 8% WoW'], nextBestActions:['Trigger manual AIS reconciliation for MV Horizon Star','Escalate Rotterdam demurrage to chartering desk','Re-screen Novorossiysk cargo with updated OFAC list'], linkedRoutes:['/vessels','/fabric/signals','/fabric/risks'] },
  { id:'twin-counsel', verticalId:'counsel', name:'CounselTwin', description:'Tracks matters, deadlines, evidence gaps, attorney-review packets, and filing posture across the legal portfolio.', healthScore:93, signalVolume:214, activeRisks:8, pendingDecisions:6, openApprovals:2, outcomeVelocity:89, evidenceCompleteness:92, chainlightConfidence:0.91, sentraGovernanceState:'green', psycheGovernanceState:'green', argoLearningStatus:'active — 8 lessons last 30d', proofChainCoverage:96, topSignals:['Discovery deadline in 5d — Matter CM-2024-0891','Missing medical records for claimant Jenkins','Filing status change — Motion to Dismiss granted in part'], topRisks:['Evidentiary gap on claimant Rodriguez depositions','Deadline cluster — 4 filings due within 72h window','Expert witness availability conflict — Dr. Chen'], nextBestActions:['Assemble discovery packet for CM-2024-0891','Request medical records from provider network','Schedule backup expert for Dr. Chen conflict'], linkedRoutes:['/counsel','/fabric/evidence','/fabric/decisions'] },
  { id:'twin-carlota', verticalId:'carlota', name:'CarlotaTwin', description:'Tracks household operations, residence service, vendors, preferences, and privacy controls across the family office.', healthScore:95, signalVolume:87, activeRisks:4, pendingDecisions:3, openApprovals:1, outcomeVelocity:94, evidenceCompleteness:90, chainlightConfidence:0.93, sentraGovernanceState:'green', psycheGovernanceState:'green', argoLearningStatus:'passive — 3 lessons last 30d', proofChainCoverage:88, topSignals:['Landscaping vendor 2d behind spring schedule','HVAC maintenance window approaching — primary residence','Guest arrival coordination gap — Memorial Day weekend'], topRisks:['Vendor reliability concern — pool service provider','Privacy exposure — new staff onboarding incomplete','Seasonal transition delay — summer property prep'], nextBestActions:['Confirm landscaping vendor recovery plan','Schedule HVAC pre-season service','Complete staff NDA processing for new hires'], linkedRoutes:['/carlota-jo','/fabric/outcomes'] },
  { id:'twin-aegis', verticalId:'aegis', name:'AegisTwin', description:'Tracks vulnerabilities, identities, controls, incidents, and remediation across the security posture.', healthScore:86, signalVolume:891, activeRisks:23, pendingDecisions:9, openApprovals:6, outcomeVelocity:71, evidenceCompleteness:83, chainlightConfidence:0.79, sentraGovernanceState:'amber', psycheGovernanceState:'amber', argoLearningStatus:'active — 22 lessons last 30d', proofChainCoverage:89, topSignals:['Critical CVE-2026-3891 detected — 12 assets exposed','Identity anomaly — service account lateral movement attempt','Control drift — MFA bypass rate increased 3x in 7d'], topRisks:['Unresolved critical vulnerability backlog at 14d MTTR','Access review overdue — 340 identities pending','Backup verification gap — 3 systems untested in 90d'], nextBestActions:['Prioritize CVE-2026-3891 patch across exposed assets','Trigger emergency access review for dormant service accounts','Schedule backup recovery drill for untested systems'], linkedRoutes:['/aegis','/fabric/risks','/fabric/signals'] },
  { id:'twin-lyte', verticalId:'lyte', name:'LyteTwin', description:'Tracks initiatives, KPIs, dependencies, owners, and executive decisions across business operations.', healthScore:90, signalVolume:256, activeRisks:11, pendingDecisions:8, openApprovals:4, outcomeVelocity:85, evidenceCompleteness:87, chainlightConfidence:0.88, sentraGovernanceState:'green', psycheGovernanceState:'green', argoLearningStatus:'active — 14 lessons last 30d', proofChainCoverage:92, topSignals:['Revenue KPI 4% below Q2 target','Initiative "Platform v3" milestone slipped 2 weeks','Ownership gap — Data Engineering lead transition'], topRisks:['Execution drift on 3 strategic initiatives','Decision delay — pricing model approval blocked 8d','Board reporting gap — Q1 narrative incomplete'], nextBestActions:['Escalate revenue KPI gap to CRO with root cause analysis','Assign interim owner for Data Engineering initiatives','Schedule pricing model decision session with CFO'], linkedRoutes:['/lyte','/fabric/decisions','/fabric/outcomes'] },
  { id:'twin-sentra', verticalId:'sentra', name:'SentraTwin', description:'Tracks approvals, blocked actions, policy decisions, audit events, and rollback readiness across the governance plane.', healthScore:94, signalVolume:412, activeRisks:6, pendingDecisions:5, openApprovals:8, outcomeVelocity:91, evidenceCompleteness:95, chainlightConfidence:0.94, sentraGovernanceState:'green', psycheGovernanceState:'green', argoLearningStatus:'active — 9 lessons last 30d', proofChainCoverage:98, topSignals:['Policy exception requested — Terra vendor fast-track','Rollback triggered — Aegis firewall rule change reverted','Audit compilation deadline — SOC 2 Type II in 14d'], topRisks:['Policy bypass attempt detected — automated action blocked','Audit evidence gap — 3 controls missing attestation','Approval queue depth — 8 items > 48h old'], nextBestActions:['Review Terra vendor fast-track exception against policy','Validate Aegis firewall rollback completeness','Assign auditor for SOC 2 evidence gap remediation'], linkedRoutes:['/sentra','/fabric/evidence','/fabric/decisions'] },
] as const;

// ─── Verticals ────────────────────────────────────────────────────────────────
const ALL_VIDS = VIDS as readonly VerticalId[];

export const VERTICALS = [
  { id:'terra', name:'Terra', tagline:'Real estate intelligence and property command.', maturityStage:'operational', priorityLevel:'high', route:'/terra', colorToken:'#c9b787', icon:'▣', coreEntities:['property','asset','deal','pipeline','vendor','tenant','inspection','lease','budget','maintenance event'], keyMetrics:['Portfolio NOI','Occupancy rate','Cap rate spread','Maintenance backlog','Vendor SLA compliance'], connectedA11oyLayers:['Signal Mesh','Chainlight','Proof Chain','Sentra','Argo'], innovationSeed:{ name:'Property Consequence Simulator', description:'Models cascading impact on portfolio NOI when a property-level risk materializes — vendor failure, occupancy drop, or capex spike.', researchBasis:'Adapted from Monte Carlo portfolio stress testing (Glasserman 2003) and causal inference chains (Pearl 2009).', capability:'Run "what-if" scenarios per property and see downstream impact on fund-level returns before the risk arrives.' } },
  { id:'vessels', name:'Vessels', tagline:'Maritime intelligence, voyage economics, and fleet-risk command.', maturityStage:'operational', priorityLevel:'critical', route:'/vessels', colorToken:'#8a8a8a', icon:'⚓', coreEntities:['vessel','voyage','port','route','AIS signal','charter','cargo','sanctions screen','fuel cost','weather event'], keyMetrics:['Fleet utilization','Voyage P&L','Sanctions clearance rate','AIS coverage','Demurrage exposure'], connectedA11oyLayers:['Signal Mesh','Chainlight','Proof Chain','Sentra','Argo'], innovationSeed:{ name:'Voyage Cascade Analyzer', description:'Traces how one maritime event — port closure, weather system, sanctions flag — propagates across the fleet as a dependency cascade.', researchBasis:'Adapted from network contagion models (Barabasi 2002) and supply-chain disruption propagation (Ivanov & Dolgui 2020).', capability:'Detect second-order fleet impacts from a single event before they materialize — e.g., one port delay cascading into 4 vessels missing their laycan windows.' } },
  { id:'counsel', name:'Counsel', tagline:'Legal matter command, deadline intelligence, and proof-backed workflows.', maturityStage:'operational', priorityLevel:'high', route:'/counsel', colorToken:'#c9b787', icon:'⚖', coreEntities:['matter','claimant','policy','filing','deadline','evidence','demand','response','attorney review','court date'], keyMetrics:['Deadline compliance','Evidence completeness','Matter cycle time','Filing accuracy','Attorney utilization'], connectedA11oyLayers:['Signal Mesh','Proof Chain','Sentra','Verity','Hermes'], innovationSeed:{ name:'Matter Posture Predictor', description:'Uses outcome memory from resolved matters to estimate disposition probability for active cases based on evidence completeness, deadline compliance, and opposing posture.', researchBasis:'Adapted from survival analysis (Cox proportional hazards) and legal analytics (Katz et al. 2017, Supreme Court prediction).', capability:'Surface a disposition probability band for each active matter, updated daily as evidence and deadline data change.' } },
  { id:'carlota', name:'Carlota Jo', tagline:'Private residence and family-office operations command.', maturityStage:'seed', priorityLevel:'medium', route:'/carlota-jo', colorToken:'#c9b787', icon:'◎', coreEntities:['residence','household asset','vendor','staff task','event','maintenance issue','family preference','travel plan','inventory','service schedule'], keyMetrics:['Service SLA','Preference satisfaction','Vendor reliability','Maintenance currency','Privacy compliance'], connectedA11oyLayers:['Signal Mesh','Sentra','Proof Chain','Argo'], innovationSeed:{ name:'Preference Drift Detector', description:'Detects when household preferences shift over time by comparing current service patterns against historical preference memory, flagging divergence before it becomes friction.', researchBasis:'Adapted from concept drift detection (Lu et al. 2018) and recommendation system preference evolution (Koren 2009, Netflix Prize temporal dynamics).', capability:'Alert estate managers when a preference is stale — e.g., seasonal food preferences, temperature settings, or vendor selection criteria have shifted.' } },
  { id:'aegis', name:'Aegis', tagline:'Cybersecurity, defense operations, and control assurance command.', maturityStage:'scaling', priorityLevel:'critical', route:'/aegis', colorToken:'#f5f5f5', icon:'⬡', coreEntities:['asset','identity','vulnerability','control','incident','alert','policy','evidence','ticket','remediation'], keyMetrics:['MTTD','MTTR','Vulnerability backlog','Control coverage','Compliance score'], connectedA11oyLayers:['Signal Mesh','Chainlight','Proof Chain','Sentra','Pallas'], innovationSeed:{ name:'Control Entropy Monitor', description:'Measures the rate at which security controls degrade over time — patches go stale, access reviews slip, backup tests fail — and predicts which controls will breach thresholds next.', researchBasis:'Adapted from information entropy (Shannon 1948) applied to control effectiveness decay curves and reliability engineering (Weibull analysis).', capability:'Predict which controls will fail before they fail, based on their historical entropy trajectory — not just current state.' } },
  { id:'lyte', name:'Lyte', tagline:'Business observability and executive decision intelligence.', maturityStage:'operational', priorityLevel:'high', route:'/lyte', colorToken:'#c9b787', icon:'◆', coreEntities:['initiative','KPI','owner','dependency','decision','risk','milestone','report','department','workflow'], keyMetrics:['Decision velocity','KPI attainment','Initiative health','Ownership clarity','Board readiness'], connectedA11oyLayers:['Signal Mesh','Chainlight','PSYCHE','Hermes','Pallas'], innovationSeed:{ name:'Decision Cascade Map', description:'Visualizes how one executive decision creates a dependency chain across departments and initiatives — showing which downstream decisions are blocked, accelerated, or invalidated.', researchBasis:'Adapted from directed acyclic graph theory (Kahn topological sort, 1962) and organizational decision network analysis (March & Simon, bounded rationality).', capability:'Before approving a decision, see its full blast radius — which 3 other decisions it unblocks and which 2 it forces to re-evaluate.' } },
  { id:'sentra', name:'Sentra', tagline:'Security, policy, approval, and audit control plane.', maturityStage:'scaling', priorityLevel:'critical', route:'/sentra', colorToken:'#b08d52', icon:'⬢', coreEntities:['approval','policy','exception','blocked action','audit event','secret fingerprint','rollback plan','risk score','control','reviewer'], keyMetrics:['Approval latency','Policy coverage','Audit completeness','Rollback readiness','Exception rate'], connectedA11oyLayers:['Covenant','Proof Chain','PSYCHE','Axiom','Verity'], innovationSeed:{ name:'Policy Contradiction Scanner', description:'Detects conflicting policies across verticals — e.g., Terra vendor onboarding policy allows 48h turnaround while Sentra requires 5-day compliance review, creating an unresolvable conflict.', researchBasis:'Adapted from formal constraint satisfaction (Dechter 2003) and policy algebra (Becker et al., XACML conflict detection).', capability:'Before a new policy is enacted, scan it against all existing policies across all verticals and surface contradictions with resolution recommendations.' } },
] as const;

// ─── Agents ───────────────────────────────────────────────────────────────────
export const FABRIC_AGENTS = [
  { id:'agent-atlas', name:'Atlas', role:"Maps each vertical's entities, workflows, risks, and evidence into a navigable command graph.", verticalCoverage:ALL_VIDS, inputTypes:['entity registry','workflow definition','risk register','evidence catalogue'], outputTypes:['command graph','entity map','relationship index','coverage report'], governanceLimits:['Read-only mapping','No entity creation','No workflow execution'], route:'/fabric/twins' },
  { id:'agent-sentra', name:'Sentra', role:'Controls approvals, policy enforcement, audit trail integrity, rollback readiness, and safety gates across all verticals.', verticalCoverage:ALL_VIDS, inputTypes:['approval request','policy check','action proposal','rollback trigger'], outputTypes:['approval decision','policy verdict','audit entry','rollback plan'], governanceLimits:['Cannot self-approve','Human escalation required for exceptions','No policy creation without review'], route:'/sentra' },
  { id:'agent-chainlight', name:'Chainlight', role:'Models probabilities, scenarios, state transitions, and consequence chains for risk and decision support.', verticalCoverage:ALL_VIDS, inputTypes:['risk parameters','decision options','historical outcomes','environmental signals'], outputTypes:['scenario model','probability distribution','consequence chain','confidence score'], governanceLimits:['Advisory only','No autonomous execution','Confidence bands required on all outputs'], route:'/fabric/risks' },
  { id:'agent-psyche', name:'PSYCHE', role:'Observes cognitive-governance signals: reasoning traces, self-model consistency, volition markers, objections, and revision events.', verticalCoverage:ALL_VIDS, inputTypes:['reasoning trace','self-model snapshot','objection event','revision log'], outputTypes:['governance signal','consistency score','volition report','cognitive health metric'], governanceLimits:['Observation only','No intervention authority','Reports to Sentra'], route:'/fabric/twins' },
  { id:'agent-argo', name:'Argo', role:'Learns from outcomes, tracks prediction errors, and recommends operating-model improvements across verticals.', verticalCoverage:ALL_VIDS, inputTypes:['outcome record','prediction error','operator feedback','lesson learned'], outputTypes:['improvement recommendation','policy update candidate','learning report','accuracy trend'], governanceLimits:['Recommendations only','No autonomous policy changes','Human review required'], route:'/fabric/outcomes' },
  { id:'agent-verity', name:'Verity', role:'Validates evidence quality, authority scores, contradiction detection, and source lineage across all proof chains.', verticalCoverage:ALL_VIDS, inputTypes:['evidence item','source metadata','related claims','chain anchor'], outputTypes:['authority score','contradiction flag','lineage report','verification status'], governanceLimits:['Validation only','No evidence creation','Cannot alter proof chain'], route:'/fabric/evidence' },
  { id:'agent-axiom', name:'Axiom', role:'Interprets doctrine, covenant constraints, policy clauses, and decision boundaries for all verticals.', verticalCoverage:ALL_VIDS, inputTypes:['doctrine reference','covenant clause','policy query','constraint check'], outputTypes:['interpretation','constraint verdict','policy alignment score','boundary report'], governanceLimits:['Interpretation only','No doctrine creation','Escalates ambiguity to human'], route:'/governance' },
  { id:'agent-hermes', name:'Hermes', role:'Generates executive summaries, stakeholder updates, customer-safe reports, and attorney-review packets.', verticalCoverage:ALL_VIDS, inputTypes:['decision record','outcome data','risk summary','evidence bundle'], outputTypes:['executive brief','stakeholder update','customer-safe report','attorney packet'], governanceLimits:['No sensitive data in outputs','Human review before distribution','Redaction enforced'], route:'/brief' },
  { id:'agent-hephaestus', name:'Hephaestus', role:'Produces implementation packets, remediation plans, rollout schedules, and change summaries for operational execution.', verticalCoverage:ALL_VIDS, inputTypes:['decision output','remediation requirement','rollout plan','change request'], outputTypes:['implementation packet','remediation plan','rollout schedule','change summary'], governanceLimits:['Plan generation only','No autonomous execution','Sentra approval required before rollout'], route:'/actions' },
  { id:'agent-pallas', name:'Pallas', role:'Prioritizes risks, decisions, and investment across verticals using cross-domain impact analysis.', verticalCoverage:ALL_VIDS, inputTypes:['risk register','decision queue','investment proposal','resource constraint'], outputTypes:['priority ranking','investment recommendation','resource allocation','trade-off analysis'], governanceLimits:['Advisory only','No budget authority','Human approval for all reallocation'], route:'/fabric/decisions' },
] as const;

// ─── Roadmap ──────────────────────────────────────────────────────────────────
export const ROADMAP_PHASES = [
  { id:'phase-1', phase:1, title:'Visual Command Fabric', description:'Seeded data, vertical cockpit, universal schemas, cross-links, and executive command view across all verticals.', items:['Cross-vertical signal mesh with unified schema','Domain Command Twins for each vertical','Seeded risk, decision, and evidence data','Executive cockpit with ecosystem KPIs','Vertical profile cards with health scoring','Cross-vertical routing and navigation'], status:'complete', verticalImpact:ALL_VIDS },
  { id:'phase-2', phase:2, title:'Workflow Intelligence', description:'Real connector adapters, ticket and task ingestion, document ingestion, approval routing, and evidence bundles.', items:['Connector adapters for vertical-specific data sources','Ticket and task ingestion from operational systems','Document ingestion with classification and routing','Approval routing with Sentra governance enforcement','Evidence bundle assembly for audit and compliance','Real-time signal ingestion from connected systems'], status:'active', verticalImpact:ALL_VIDS },
  { id:'phase-3', phase:3, title:'Consequence Modeling', description:'Chainlight scenario modeling, risk simulations, decision confidence scoring, and prediction error tracking.', items:['Chainlight scenario modeling for cross-vertical risks','Monte Carlo risk simulations with seeded parameters','Decision confidence scoring with evidence weighting','Prediction error tracking and Argo learning feedback','Consequence chain visualization across verticals','What-if analysis for executive decision support'], status:'planned', verticalImpact:ALL_VIDS },
  { id:'phase-4', phase:4, title:'Governed Execution', description:'Sentra approval enforcement, rollback readiness, audit trails, and human-reviewed execution across all verticals.', items:['Sentra approval enforcement for all high-impact actions','Automated rollback readiness verification','Immutable audit trails with Proof Chain anchoring','Human-reviewed execution with approval gates','Emergency override protocol with retrospective audit','Cross-vertical governance SLA monitoring'], status:'planned', verticalImpact:ALL_VIDS },
  { id:'phase-5', phase:5, title:'Learning Ecosystem', description:'Argo outcome learning, policy recommendations, and vertical-specific improvement loops.', items:['Argo outcome learning with prediction error feedback','Policy update recommendations from outcome patterns','Vertical-specific improvement loops with domain context','Cross-vertical lesson transfer and pattern sharing','Operating model evolution tracking and versioning','Recommendation confidence calibration'], status:'planned', verticalImpact:ALL_VIDS },
  { id:'phase-6', phase:6, title:'Enterprise Trust Layer', description:'Compliance exports, board reports, customer-safe summaries, and security posture evidence for enterprise trust.', items:['SOC 2 / ISO 27001 compliance evidence exports','Board-ready operating briefs with governance posture','Customer-safe summaries with redaction enforcement','Security posture evidence with continuous attestation','Regulatory reporting templates for each vertical','Trust score computation across the ecosystem'], status:'planned', verticalImpact:ALL_VIDS },
] as const;

// ─── KPIs helper ──────────────────────────────────────────────────────────────
export function deriveFabricKpis() {
  const twins = DOMAIN_TWINS;
  const avgHealth = Math.round(twins.reduce((s, t) => s + t.healthScore, 0) / twins.length);
  const avgConf = Math.round((twins.reduce((s, t) => s + t.chainlightConfidence, 0) / twins.length) * 100) / 100;
  const avgEvComp = Math.round(twins.reduce((s, t) => s + t.evidenceCompleteness, 0) / twins.length);
  const avgOutVel = Math.round(twins.reduce((s, t) => s + t.outcomeVelocity, 0) / twins.length);
  return {
    verticalHealth: avgHealth,
    activeSignals: FABRIC_SIGNALS.filter(s => s.status === 'new' || s.status === 'triaged').length,
    openRisks: FABRIC_RISKS.filter(r => r.status === 'open' || r.status === 'mitigating').length,
    pendingDecisions: FABRIC_DECISIONS.filter(d => d.status === 'draft' || d.status === 'awaiting_review').length,
    approvalQueue: twins.reduce((s, t) => s + t.openApprovals, 0),
    evidenceCompleteness: avgEvComp,
    outcomeVelocity: avgOutVel,
    chainlightConfidence: avgConf,
  };
}

// ─── Agent Identity Registry data ─────────────────────────────────────────────
export const AGENT_IDENTITIES = [
  { id:'aid-cascade', name:'Cascade Navigator', spiffeUri:'spiffe://a11oy.szl/agents/cascade-navigator', certFingerprint:'SHA256:9f:3a:b2:c1:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6', certIssued:'2026-03-01T00:00:00Z', certExpires:'2027-03-01T00:00:00Z', trustScore:970, trustTier:'sovereign', behaviorBaseline:94.2, currentBehavior:96.8, driftPct:0.4, driftStatus:'stable', capabilities:['eta-monitoring','port-cost-analysis','route-optimization','demurrage-calc'], permissions:[{action:'read:vessel-data',scope:'all-vessels',granted:true},{action:'write:voyage-plan',scope:'assigned-vessels',granted:true},{action:'execute:port-standby',scope:'with-approval',granted:true},{action:'read:financial-data',scope:'maritime-only',granted:true},{action:'execute:trade',scope:'any',granted:false}], vertical:'vessels-maritime', riskClassification:'High', lastActivity:'2026-04-25T10:34:00Z' },
  { id:'aid-counsel', name:'Counsel Sentinel', spiffeUri:'spiffe://a11oy.szl/agents/counsel-sentinel', certFingerprint:'SHA256:a1:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7', certIssued:'2026-02-15T00:00:00Z', certExpires:'2027-02-15T00:00:00Z', trustScore:990, trustTier:'sovereign', behaviorBaseline:97.4, currentBehavior:98.1, driftPct:0.2, driftStatus:'stable', capabilities:['deadline-tracking','doc-review','matter-monitoring','risk-scoring'], permissions:[{action:'read:matter-records',scope:'all-matters',granted:true},{action:'write:matter-status',scope:'assigned-matters',granted:true},{action:'execute:escalation',scope:'with-approval',granted:true},{action:'read:privileged-docs',scope:'with-privilege-gate',granted:true},{action:'execute:filing',scope:'any',granted:false}], vertical:'prism-counsel', riskClassification:'Critical', lastActivity:'2026-04-25T08:10:00Z' },
  { id:'aid-guardian', name:'Guardian', spiffeUri:'spiffe://a11oy.szl/agents/guardian', certFingerprint:'SHA256:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8', certIssued:'2026-01-01T00:00:00Z', certExpires:'2027-01-01T00:00:00Z', trustScore:990, trustTier:'sovereign', behaviorBaseline:98.1, currentBehavior:99.0, driftPct:0.1, driftStatus:'stable', capabilities:['threat-intel','posture-assessment','incident-triage','perimeter-hardening'], permissions:[{action:'read:threat-feeds',scope:'all-sources',granted:true},{action:'write:firewall-rules',scope:'perimeter-only',granted:true},{action:'execute:auto-escalate',scope:'up-to-HIGH',granted:true},{action:'execute:isolate-host',scope:'with-ciso-approval',granted:true},{action:'read:classified',scope:'any',granted:false}], vertical:'aegis-defense', riskClassification:'Critical', lastActivity:'2026-04-25T18:56:00Z' },
  { id:'aid-pipeline', name:'Pipeline Oracle', spiffeUri:'spiffe://a11oy.szl/agents/pipeline-oracle', certFingerprint:'SHA256:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9', certIssued:'2026-03-15T00:00:00Z', certExpires:'2027-03-15T00:00:00Z', trustScore:910, trustTier:'sovereign', behaviorBaseline:88.6, currentBehavior:91.2, driftPct:1.8, driftStatus:'watch', capabilities:['pipeline-analysis','deal-scoring','forecast-modeling','churn-prediction'], permissions:[{action:'read:crm-data',scope:'all-accounts',granted:true},{action:'write:crm-activity',scope:'assigned-accounts',granted:true},{action:'execute:outreach',scope:'with-approval',granted:true},{action:'execute:deal-close',scope:'any',granted:false},{action:'write:bulk-email',scope:'any',granted:false}], vertical:'lyte-revenue', riskClassification:'Medium', lastActivity:'2026-04-25T09:25:00Z' },
  { id:'aid-terra', name:'DOMAINE Analyst', spiffeUri:'spiffe://a11oy.szl/agents/terra-analyst', certFingerprint:'SHA256:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1', certIssued:'2026-04-01T00:00:00Z', certExpires:'2027-04-01T00:00:00Z', trustScore:880, trustTier:'trusted', behaviorBaseline:85.0, currentBehavior:88.4, driftPct:2.8, driftStatus:'watch', capabilities:['cap-rate-tracking','portfolio-analysis','valuation-modeling','comp-analysis'], permissions:[{action:'read:property-data',scope:'portfolio-only',granted:true},{action:'write:valuation-model',scope:'assigned-portfolios',granted:true},{action:'execute:loi-draft',scope:'with-approval',granted:true},{action:'execute:acquisition',scope:'any',granted:false}], vertical:'terra-real-estate', riskClassification:'Medium', lastActivity:'2026-04-25T16:45:00Z' },
  { id:'aid-watchdog', name:'Fabric Watchdog', spiffeUri:'spiffe://a11oy.szl/agents/fabric-watchdog', certFingerprint:'SHA256:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1:b2', certIssued:'2026-01-01T00:00:00Z', certExpires:'2027-01-01T00:00:00Z', trustScore:1000, trustTier:'sovereign', behaviorBaseline:100.0, currentBehavior:100.0, driftPct:0.0, driftStatus:'stable', capabilities:['health-probe','proof-verification','layer-monitoring','latency-tracking'], permissions:[{action:'read:all-metrics',scope:'fabric-layers',granted:true},{action:'execute:health-check',scope:'all-layers',granted:true},{action:'write:any',scope:'any',granted:false}], vertical:'alloy-core', riskClassification:'Low', lastActivity:'2026-04-26T10:00:00Z' },
];

export const AGENT_TRUST_EDGES = [
  { from:'aid-cascade', to:'aid-guardian', relation:'sanctions-verification', strength:0.95 },
  { from:'aid-cascade', to:'aid-counsel', relation:'demurrage-clause-interp', strength:0.88 },
  { from:'aid-counsel', to:'aid-guardian', relation:'privilege-gate-review', strength:0.82 },
  { from:'aid-pipeline', to:'aid-counsel', relation:'contract-review', strength:0.78 },
  { from:'aid-pipeline', to:'aid-terra', relation:'cross-vertical-pipeline', strength:0.72 },
  { from:'aid-terra', to:'aid-cascade', relation:'port-adjacent-asset-impact', strength:0.65 },
  { from:'aid-watchdog', to:'aid-cascade', relation:'health-monitoring', strength:0.99 },
  { from:'aid-watchdog', to:'aid-guardian', relation:'health-monitoring', strength:0.99 },
  { from:'aid-watchdog', to:'aid-counsel', relation:'health-monitoring', strength:0.99 },
  { from:'aid-watchdog', to:'aid-pipeline', relation:'health-monitoring', strength:0.97 },
  { from:'aid-watchdog', to:'aid-terra', relation:'health-monitoring', strength:0.97 },
  { from:'aid-guardian', to:'aid-cascade', relation:'threat-intel-feed', strength:0.91 },
];

// ─── RAG Collections ───────────────────────────────────────────────────────────
export const RAG_COLLECTIONS = [
  { id:'kc-1', name:'Governance Policies', description:'All covenant policies, constitution, compliance frameworks', documentCount:847, chunkCount:12340, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-3600000).toISOString(), sizeBytes:234000000, vertical:'Governance' },
  { id:'kc-2', name:'Deal Intelligence', description:'Deal memos, approval chains, revenue forecasts, pipeline data', documentCount:2341, chunkCount:45600, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-1800000).toISOString(), sizeBytes:567000000, vertical:'Revenue' },
  { id:'kc-3', name:'Security Findings', description:'Vulnerability reports, threat intel, incident post-mortems', documentCount:1567, chunkCount:23400, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-7200000).toISOString(), sizeBytes:345000000, vertical:'Security' },
  { id:'kc-4', name:'Agent Execution History', description:'Workcell traces, proof packets, agent decision logs', documentCount:8934, chunkCount:134500, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-900000).toISOString(), sizeBytes:1230000000, vertical:'Operations' },
  { id:'kc-5', name:'Maritime Intelligence', description:'Vessel positions, port schedules, compliance records, sanctions data', documentCount:4567, chunkCount:67800, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-14400000).toISOString(), sizeBytes:890000000, vertical:'Maritime' },
  { id:'kc-6', name:'Legal Corpus', description:'Case law, filings, contract templates, regulatory updates', documentCount:3456, chunkCount:89000, embeddingModel:'BAAI/bge-m3', lastIngested: new Date(Date.now()-28800000).toISOString(), sizeBytes:678000000, vertical:'Legal' },
];
