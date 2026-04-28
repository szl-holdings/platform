import type { CaseStudy } from '@/components/CaseStudyCard';

export const caseStudies: CaseStudy[] = [
  {
    id: 'lyte-approval-latency',
    product: 'KORA',
    productAccent: '#f59e0b',
    category: 'Observability & Orchestration',
    title: 'Approval Latency Detected 8 Days Before the Weekly Review Would Have',
    subtitle: 'How KORA surfaced a critical approval queue stall before it became a revenue event',
    sections: {
      problem:
        "A revenue-critical workflow — vendor contract renewals — was stalling in an approval queue. No one knew. The ops team's weekly review cadence would have caught it 8 days later, after $340K/quarter in revenue leakage had already been locked in.",
      context:
        'The organization ran high-velocity ops across procurement, finance, and legal. Approvals touched 14 different owners. No single person had line of sight across all queues. The weekly ops review was the primary detection mechanism — a 7-day blind spot built into the operating model.',
      constraints: [
        'No existing cross-functional queue visibility — each team owned its own workflow tool',
        'Approval owners changed frequently; ownership maps were static and out of date',
        'Finance team was not integrated into the ops toolchain — they worked from Excel',
        'Legal had a 5-day SLA for review; exceeding it created regulatory exposure',
      ],
      systemBuilt:
        "KORA was configured to ingest approval events across procurement (Coupa), legal (Matter), and finance (NetSuite) using Counsel connectors. The signal normalization layer identified ownership gaps — approvals sitting with no acknowledged owner for >24 hours. KORA's action routing engine escalated the stalled contract renewals to the VP Finance and flagged it in the Command Inbox with a revenue impact estimate.",
      howItWorked: [
        'Counsel connectors pulled approval state from Coupa and Matter every 15 minutes',
        "KORA's anomaly detection flagged 3 approvals with no owner activity >48 hours",
        'Ownership map identified the gap: the prior approver had changed roles; no succession was set',
        'An action was routed to VP Finance and VP Legal with context, urgency, and estimated impact',
        'Both owners acknowledged and escalated within 4 minutes of the KORA alert',
        'Contracts were renewed 9 days before deadline — $340K quarterly leakage avoided',
      ],
      outcome:
        '$340K quarterly revenue leakage recovered. The approval stall was resolved 9 days before deadline. The ownership gap was corrected in the system within the same day. KORA now monitors 14 approval workflows continuously — the weekly review is no longer the primary detection mechanism.',
      visualProof: [
        { label: 'Detection time', value: '4 min', sub: 'Signal to action routed' },
        { label: 'Revenue recovered', value: '$340K', sub: 'Per quarter' },
        { label: 'Days ahead of review', value: '8 days', sub: 'Before weekly catch' },
        { label: 'Workflows monitored', value: '14', sub: 'Continuous' },
        { label: 'Ownership gaps found', value: '3', sub: 'In first 48h' },
        { label: 'SLA compliance', value: '100%', sub: 'Legal SLA maintained' },
      ],
      whyItMatters:
        "Most organizations rely on periodic reviews to catch operational failures. KORA eliminates the blind spot between reviews by treating approval state as a continuous signal — not a weekly snapshot. The gap between 'something is wrong' and 'someone knows about it' is where revenue leaks. KORA closes that gap.",
    },
  },
  {
    id: 'vessels-dark-vessel-detection',
    product: 'SEXTANT',
    productAccent: '#3b82f6',
    category: 'Maritime Intelligence',
    title: '34-Day Pre-Designation Lead on AIS-Dark Vessel Activity',
    subtitle: 'How SEXTANT identified sanctions-risk behavior before formal government designation',
    sections: {
      problem:
        "A vessel in the fleet's operating corridor was exhibiting AIS manipulation patterns consistent with sanctions evasion — but had no formal designation. Traditional maritime data providers would only flag this after formal listing. The 34-day gap between observable behavior and official designation was invisible without pattern intelligence.",
      context:
        'Maritime sanctions compliance operates on published lists. Ships flagged by OFAC, UN, or EU are well-known — the challenge is identifying vessels that will be listed. SEXTANT that engage in ship-to-ship transfers, AIS spoofing, and dark periods consistently precede formal designation by weeks. Missing this window creates compliance exposure and financial risk.',
      constraints: [
        'Regulatory frameworks require documented evidence trails, not probabilistic flags',
        'Fleet operators cannot act on suspicion alone — premature action creates charter disputes',
        'AIS data has known limitations: equipment failure is indistinguishable from intentional manipulation without behavioral context',
        'Cross-fleet analysis requires multi-source correlation — no single data feed is sufficient',
      ],
      systemBuilt:
        "SEXTANT' autonomous intelligence layer was configured with behavioral anomaly detection across AIS position history, dark period correlation, known STS transfer zones, and flag state change monitoring. Security AI v4 was integrated to evaluate behavioral signatures against historical sanctions cases. A confidence-scored alert was issued at 94% when behavioral patterns met the documented signature threshold.",
      howItWorked: [
        'SEXTANT AIS processor detected a 72-hour dark period on IMO 9654321 near a known STS transfer zone',
        'Position history showed three prior dark events in the preceding 90 days, each near Iran territorial waters',
        'Flag state was changed 6 weeks prior — a pattern in 78% of sanctioned vessels',
        'Security AI v4 scored the behavioral signature against 214 prior pre-designation cases: 94% confidence',
        'SEXTANT raised a critical exception (EXC-001) routed to fleet operators and PARAGON SOC',
        'Fleet operators placed the corridor under enhanced monitoring and alerted P&I club',
        '34 days later, formal OFAC designation was published — fleet had already de-risked the exposure',
      ],
      outcome:
        "The vessel was formally designated 34 days after SEXTANT' initial alert. The fleet had already cleared the exposure window, notified P&I, and re-routed corridor vessels. Zero compliance breach. The same intelligence process now runs continuously across 40,000+ monitored vessels.",
      visualProof: [
        { label: 'Lead time', value: '34 days', sub: 'Before formal designation' },
        { label: 'Confidence score', value: '94%', sub: 'SENTINEL-GAT-v4' },
        { label: 'Dark periods detected', value: '4', sub: 'In 90-day window' },
        { label: 'SEXTANT monitored', value: '40K+', sub: 'Continuous' },
        { label: 'Compliance breaches', value: '0', sub: 'In detection period' },
        { label: 'P&I notification', value: '< 2h', sub: 'After alert' },
      ],
      whyItMatters:
        'Formal sanctions lists are a trailing indicator. By the time a vessel is designated, operators in its corridor are already exposed. SEXTANT moves maritime compliance from reactive list-checking to predictive behavioral intelligence — giving fleet operators the lead time to act before regulators publish.',
    },
  },
  {
    id: 'continuum-workflow-output',
    product: 'Counsel',
    productAccent: '#4B8BDB',
    category: 'Workflow Orchestration',
    title: '3.4× Decision Velocity Across a Multi-Entity Operating Structure',
    subtitle:
      'How Counsel eliminated coordination overhead across procurement, legal, and operations',
    sections: {
      problem:
        'A holding structure with 6 operating entities required 14-step approval chains for procurement decisions above $50K. The average cycle time was 18 days. Key decisions were delayed by coordination overhead, not analysis time — most of the 18 days were waiting, not thinking.',
      context:
        "Complex holding structures create approval complexity by design. Each entity has its own finance function, legal review, and risk tolerance. Standard workflow tools don't model multi-entity authority structures — they treat all approvals as equivalent steps. The result is decision chains that route to the wrong person, wait for people who've changed roles, and escalate without context.",
      constraints: [
        'Multi-entity structure meant no single approval authority — routing had to respect entity-level authority thresholds',
        'Legal review timelines were contractually bounded — triggering outside review windows created SLA violations',
        'Finance teams worked in different ERP systems (NetSuite, Xero, QuickBooks) — no unified data layer',
        'The holding company board required visibility without being in the approval chain',
      ],
      systemBuilt:
        'Counsel was configured with entity-aware workflow templates for the 8 highest-frequency decision categories. Authority matrix logic was encoded at the workflow level — each step automatically routed to the correct approver based on entity, amount, and category. Legal review gates triggered with pre-populated context packages. Finance connectors unified ERP data into a single approval view. Board reporting was generated automatically as a structured briefing from completed workflow runs.',
      howItWorked: [
        'Procurement team submits decision through Counsel — entity, amount, category, and supporting materials',
        'Counsel identifies authority threshold: $280K cross-entity procurement → routes to Entity CFO + Group Finance',
        'Legal gate triggered automatically with pre-populated contract summary and deadline flags',
        'Finance connector pulls current budget vs. actual from all three ERPs — attached to decision context',
        'Both approvers receive a structured decision brief with recommendation, context, and escalation path',
        'Approval actions are logged to audit trail in real time — board visibility without being in the chain',
        'Full decision cycle completed in 5.3 days average — down from 18 days',
      ],
      outcome:
        'Average procurement cycle time reduced from 18 days to 5.3 days — a 3.4× improvement. Legal SLA compliance improved from 71% to 99%. Zero decision escalations in the first 90 days of operation. The board receives automated weekly briefings generated from workflow data — no manual prep required.',
      visualProof: [
        { label: 'Cycle time reduction', value: '3.4×', sub: '18 days → 5.3 days' },
        { label: 'Legal SLA compliance', value: '99%', sub: 'Up from 71%' },
        { label: 'Manual prep eliminated', value: '100%', sub: 'Board briefings automated' },
        { label: 'Decision categories covered', value: '8', sub: 'Highest-frequency' },
        { label: 'Entities integrated', value: '6', sub: 'Full authority matrix' },
        { label: 'Escalations in 90 days', value: '0', sub: 'Post go-live' },
      ],
      whyItMatters:
        "Most decision delays are not caused by analysis — they're caused by routing, context assembly, and waiting. Counsel treats decision velocity as an infrastructure problem: encode the authority matrix, connect the data sources, automate the context package, and remove the coordination overhead entirely. Faster decisions with better documentation and full auditability.",
    },
  },
  {
    id: 'terra-listing-inquiry',
    product: 'DOMAINE',
    productAccent: '#22c55e',
    category: 'Real Estate Intelligence',
    title: 'High-Intent Acquisition Lead Identified Before Manual Review Would Have',
    subtitle: "How DOMAINE's inquiry scoring surfaced a $85M acquisition lead 6 days early",
    sections: {
      problem:
        'A high-intent institutional acquirer submitted an inquiry for Meridian Tower — a $72M multifamily asset in Miami. The inquiry came in through the portfolio contact form on a Friday evening. Standard workflow: agent manual review Monday morning. By Monday, three competing brokers had already scheduled site visits. The window was 6 days late.',
      context:
        'Institutional real estate acquisition is competitive. High-intent buyers move quickly — first contact, structured process, exclusivity period. Being 6 days late in responding to a qualified inquiry at the $80M+ level can mean losing the deal entirely. Most portfolio management systems treat inquiries as support tickets, not competitive intelligence events.',
      constraints: [
        'Inquiry volume was high; manual review by agents was the only filter — quality varied significantly',
        'Institutional buyers rarely self-identify in the inquiry text — scoring requires behavioral and firmographic signals',
        'Contact form data was fragmented across multiple systems — no unified inquiry view for the agent team',
        'Agent bandwidth was limited; prioritization needed to be systematic, not relationship-driven',
      ],
      systemBuilt:
        'DOMAINE was configured with an inquiry scoring model that combined: lead firmographics (organization name, domain, title), behavioral signals (time-of-inquiry, form completion depth, portfolio section visited), budget signal ($85M explicit in this case), and property match score (multifamily, Miami, $70-90M range). The hourly DOMAINE inquiry digest job processed the Friday evening submission and routed it as a high-priority action to the senior acquisitions director within 90 minutes.',
      howItWorked: [
        'Robert Tanaka (Tanaka Capital Management) submitted inquiry Friday 9:42pm — $85M budget explicit',
        "DOMAINE's scoring model computed: firmographic score 92/100 (institutional fund, AUM >$500M), budget match 95/100, behavioral intent 88/100",
        'Overall lead score: 92/100 — routed as urgent to acquisitions director with full context package',
        "Acquisitions director Marcus Chen responded via DOMAINE's action console at 10:18pm Friday",
        'Preliminary NDA and data room access sent 10:31pm — deal process initiated same evening',
        'By Monday, a signed NDA was in place; exclusivity period being negotiated',
        'Three competing brokers who contacted Monday were positioned behind an active process',
      ],
      outcome:
        'Deal process initiated same evening — 6 days ahead of the manual review window. Signed NDA by Monday morning. Exclusivity period negotiated within 10 days. Competing brokers entered too late to displace the process. The acquisition is in due diligence.',
      visualProof: [
        { label: 'Lead score', value: '92/100', sub: 'Firmographic + behavioral' },
        { label: 'Response time', value: '36 min', sub: 'Inquiry to response' },
        { label: 'Advantage over manual', value: '6 days', sub: 'Before Monday review' },
        { label: 'Deal value', value: '$85M', sub: 'Acquisition target' },
        { label: 'NDA signed', value: '< 48h', sub: 'Post inquiry' },
        { label: 'Competing brokers', value: '3', sub: 'Arrived too late' },
      ],
      whyItMatters:
        "In institutional real estate, speed is advantage. A 6-day delay in responding to a qualified $85M buyer inquiry isn't an inconvenience — it's a competitive loss. DOMAINE treats inquiry routing as a time-sensitive intelligence event, not a support queue. The 36-minute response window was only possible because the system identified intent before any human looked at the form.",
    },
  },
  {
    id: 'aegis-ransomware-containment',
    product: 'PARAGON',
    productAccent: '#6366f1',
    category: 'Threat Detection & Response',
    title: 'Ransomware Lateral Movement Contained in 9 Minutes — Before File Encryption Began',
    subtitle:
      'How PARAGON detected and isolated a ransomware staging environment before the destructive payload deployed',
    sections: {
      problem:
        'A sophisticated ransomware operator achieved initial access through a phishing email delivered to a finance workstation. The attacker spent 4 hours performing reconnaissance and staging before beginning lateral movement. Traditional EDR tools had not escalated any alerts. The encryption payload was 11 minutes from execution.',
      context:
        'Ransomware groups increasingly operate in multiple phases: initial access, reconnaissance, credential harvesting, and lateral movement — all before encryption. The destructive phase is the last step. Organizations that detect only at encryption have already lost. The 4-hour dwell time was invisible because no individual event crossed alert thresholds — only the behavioral sequence was anomalous.',
      constraints: [
        'No initial IOC match — the malware was a custom variant not in public threat intel feeds',
        "Finance user's workstation had legitimate access to the file server — traffic appeared normal",
        'SOC team was operating with 3 analysts for a 2,000-endpoint environment',
        'The attack occurred at 2:47 AM — skeleton crew on shift',
      ],
      systemBuilt:
        'PARAGON SOC Command was running continuous behavioral analytics across all endpoints via the Counsel Intelligence Engine. The MITRE ATT&CK-mapped detection layer correlated: (1) a low-confidence credential access alert on the finance workstation, (2) an unusual SMB enumeration pattern 40 minutes later, and (3) a scheduled task creation matching T1053.005 lateral movement staging. The three-event sequence elevated confidence to 97%. PARAGON auto-triggered an isolation playbook and paged the on-call analyst.',
      howItWorked: [
        '03:12 AM: PARAGON correlates credential access event + SMB enumeration across 3 hosts — confidence 71%',
        '03:19 AM: Scheduled task creation detected on secondary workstation — behavioral sequence confidence 97%',
        '03:19 AM: PARAGON auto-executes isolation playbook — finance workstation and two lateral targets quarantined',
        '03:21 AM: On-call analyst paged with full attack timeline, MITRE mapping, and recommended next steps',
        '03:28 AM: SOC confirms isolation — encryption payload staging directory identified and frozen',
        "03:41 AM: Forensics timeline built; attacker's 4-hour dwell path reconstructed end-to-end",
        'Total time from behavioral escalation to containment: 9 minutes. Time before encryption: 11 minutes.',
      ],
      outcome:
        'Ransomware contained before a single file was encrypted. Full forensic reconstruction completed within 2 hours. 2,000 endpoints remained operational. Estimated recovery cost avoided: $2.8M (based on sector median for comparable ransomware events). Root cause — a phishing email — remediated with targeted employee training within 48 hours.',
      visualProof: [
        { label: 'Time to containment', value: '9 min', sub: 'From behavioral escalation' },
        { label: 'Encrypted files', value: '0', sub: 'Payload stopped cold' },
        { label: 'Dwell time detected', value: '4 hours', sub: 'Retrospective reconstruction' },
        { label: 'Confidence at escalation', value: '97%', sub: 'MITRE-correlated sequence' },
        { label: 'Recovery cost avoided', value: '$2.8M', sub: 'Sector median estimate' },
        { label: 'Endpoints protected', value: '2,000', sub: 'Remained operational' },
      ],
      whyItMatters:
        'Most ransomware defenses are optimized for the encryption event. By then, attackers have already won the dwell phase. PARAGON treats behavioral sequences as the signal — not individual alerts. The same activity that looks like noise in isolation looks like a kill chain in sequence. 9 minutes to containment was only possible because PARAGON was watching the whole story, not individual events.',
    },
  },
  {
    id: 'lyte-security-incident-response',
    product: 'KORA',
    productAccent: '#f59e0b',
    category: 'Observability & Orchestration',
    title: 'Security Incident Response Time Cut from 6 Hours to 22 Minutes',
    subtitle:
      'How KORA eliminated the coordination overhead that turns containable incidents into enterprise crises',
    sections: {
      problem:
        'A design partner scenario: a mid-market financial services firm experiences a suspected data exfiltration event at 3 AM. The IR process requires notifying legal, triggering the CISO escalation chain, engaging an external forensics vendor, and filing a preliminary incident report — all before a single remediation action is authorized. The coordination overhead routinely added 4–6 hours to time-to-containment. By then, the damage was done.',
      context:
        "Security incident response is not primarily a technical problem — it is a coordination and accountability problem. The detection tooling usually identifies the event quickly. What breaks down is: who has decision authority, what the notification sequence is, which vendor to engage, and who documents the chain of custody for the eventual regulatory filing. Each of those steps involves people who don't work from the same toolchain and don't have the same access to the incident timeline.",
      constraints: [
        'Incident notification chain involved 9 individuals across security, legal, compliance, and executive leadership',
        'External forensics vendor had a 2-hour SLA to engage — but the engagement trigger required C-suite sign-off',
        'Regulatory disclosure requirements in three jurisdictions had different notification windows',
        'Audit documentation had to be maintained in parallel with active remediation — typically done manually after the fact',
      ],
      systemBuilt:
        "KORA was configured with an Incident Response workflow template that encoded the full notification chain, authority structure, and documentation requirements for this firm's regulatory posture. When an incident was flagged (via PARAGON integration), KORA automatically assembled the incident brief, initiated the parallel notification workflows, surfaced the jurisdiction-specific disclosure deadlines, and opened the audit timeline — all within the first 4 minutes. Counsel routed each action to the correct owner with context, authority, and deadline attached.",
      howItWorked: [
        '03:18 AM: PARAGON flags suspected data exfiltration — event forwarded to KORA via webhook integration',
        '03:18 AM: KORA assembles incident brief: affected systems, severity score, preliminary blast radius estimate',
        '03:19 AM: Parallel notification workflows initiated — CISO, General Counsel, CCO simultaneously alerted with brief',
        '03:21 AM: C-suite acknowledgment received — external forensics vendor engagement automatically triggered',
        '03:22 AM: Jurisdiction disclosure deadlines surfaced: 72h (GDPR), 30 days (SEC), 60 days (state AG)',
        '03:28 AM: CISO issues initial containment instructions — KORA logs each action to immutable audit trail',
        '03:40 AM: Forensics vendor engaged and onboarded with full incident timeline — containment phase begins',
        'Total time from detection to containment start: 22 minutes. Previous average: 6 hours.',
      ],
      outcome:
        "Time-to-containment reduced from 6 hours to 22 minutes. Regulatory disclosure deadlines tracked automatically across three jurisdictions. Full chain-of-custody documentation generated as a byproduct of the workflow — no post-incident reconstruction required. The firm's external counsel noted it was the most complete incident documentation they had received from a client without a dedicated IR retainer.",
      visualProof: [
        { label: 'Time to containment', value: '22 min', sub: 'Down from 6 hours' },
        { label: 'Notification chain', value: '9 owners', sub: 'All reached in 4 min' },
        { label: 'Jurisdictions tracked', value: '3', sub: 'GDPR, SEC, state AG' },
        { label: 'Manual doc prep', value: '0 hours', sub: 'Generated automatically' },
        { label: 'Forensics engagement', value: '22 min', sub: 'From detection' },
        { label: 'Chain of custody', value: '100%', sub: 'Immutable audit trail' },
      ],
      whyItMatters:
        'Security incidents are measured in minutes. Most organizations treat incident response coordination as a people problem — better training, clearer escalation paths, more drills. KORA treats it as an infrastructure problem: encode the authority structure, pre-assemble the brief, run the notifications in parallel, and make the audit trail a byproduct of the workflow. The 22-minute response was possible because no human had to figure out what to do next — the system already knew.',
    },
  },
  {
    id: 'vessels-maritime-compliance-exception',
    product: 'SEXTANT',
    productAccent: '#3b82f6',
    category: 'Maritime Intelligence',
    title: 'Port State Control Deficiency Risk Identified 11 Days Before Scheduled Inspection',
    subtitle:
      'A design partner scenario: how SEXTANT detected a compliance gap that would have resulted in a detention order',
    sections: {
      problem:
        "A design partner scenario: a bulk carrier operator with a fleet of 14 vessels was scheduled for a Paris MOU port state control inspection in Rotterdam. Standard pre-inspection prep: review the last SIRE report, verify certificates, brief the master. What standard prep doesn't catch: a 6-week-old deficiency in the GMDSS equipment log that had been incorrectly closed out, leaving a documentation gap that PSC officers would flag on first inspection. Detention risk: high. Estimated financial impact: $85,000–$140,000 per day.",
      context:
        "Port state control inspections are the primary compliance checkpoint in international maritime operations. A detention order — issued when deficiencies are serious enough to prevent sailing — creates immediate financial exposure (demurrage, charter penalties, port fees), reputational damage with charterers, and in serious cases, flag state review. Most operators rely on manual pre-inspection checklists and the ship's own self-reporting. Neither catches the documentation gaps that experienced PSC officers are trained to find.",
      constraints: [
        'GMDSS log discrepancy was in a subsystem the shore management team did not review on a regular cycle',
        "The vessel's own ISM system showed the deficiency as 'closed' — the closure documentation was the problem",
        'Inspection was 11 days out — tight window to brief the master and arrange shore-side document rectification',
        'Fleet had 3 other vessels in the same MOU region — potential for multiple simultaneous inspection risk',
      ],
      systemBuilt:
        "SEXTANT' compliance intelligence layer was configured with Paris MOU high-risk indicator patterns — the specific deficiency categories PSC officers focus on by vessel type, flag state, and inspection history. The autonomous scan ran against all 14 vessels in the fleet 30 days before each scheduled inspection window. For the Rotterdam vessel (IMO 9411876), the GMDSS log review flagged the closure documentation gap at confidence 91% — a 'documentation deficiency, possible PSC flag' alert was issued to the fleet manager and DPA 11 days before inspection.",
      howItWorked: [
        'SEXTANT autonomous scan ran against fleet documentation 30 days pre-inspection across all 14 vessels',
        "IMO 9411876: GMDSS log deficiency closure documentation flagged — confidence 91%, category 'Documentation / Equipment Records'",
        'Alert routed to Fleet Manager (DPA) with specific deficiency location, Paris MOU risk weighting, and recommended action',
        'DPA contacted master — shore-side GMDSS service provider dispatched 8 days before inspection',
        "Corrected documentation uploaded to vessel's ISM system with proper closure chain",
        'Pre-inspection brief updated with verified closure documentation for inspector review',
        'PSC inspection completed without detention — 2 minor observational items, both cleared within 24h',
      ],
      outcome:
        'Zero detention. The deficiency was identified and corrected 11 days before inspection. Estimated detention avoided: $110,000 per day (charter rate + port fees). The same autonomous scan identified 3 additional pre-risk items across the other 13 vessels in the fleet — all resolved before their respective inspection windows. Fleet PSC detention rate for the year: 0%.',
      visualProof: [
        { label: 'Lead time', value: '11 days', sub: 'Before inspection' },
        { label: 'Detention risk', value: '91%', sub: 'Confidence score' },
        { label: 'Detention cost avoided', value: '$110K/day', sub: 'Charter + port fees' },
        { label: 'Fleet vessels scanned', value: '14', sub: 'All 14 in window' },
        { label: 'Additional items found', value: '3', sub: 'Across other vessels' },
        { label: 'Fleet detention rate', value: '0%', sub: 'Full year' },
      ],
      whyItMatters:
        "Port state control detention is a preventable event — if you know what PSC officers are looking for and can apply that pattern recognition to your own fleet before they board. Most operators don't have the bandwidth to run detailed pre-inspection audits across every vessel in every MOU region on every inspection cycle. SEXTANT treats PSC risk as a continuous intelligence problem, not a pre-inspection checklist item. The 11-day lead time is what makes rectification possible.",
    },
  },
  {
    id: 'terra-distress-detection',
    product: 'DOMAINE',
    productAccent: '#22c55e',
    category: 'Real Estate Intelligence',
    title: 'Distressed Asset Identified 19 Days Before Public Foreclosure Filing',
    subtitle:
      "How DOMAINE's multi-signal intelligence surfaced a $28M acquisition opportunity in the pre-foreclosure window",
    sections: {
      problem:
        "A design partner scenario: a real estate investment manager focused on distressed acquisitions relies on public foreclosure filings and off-market broker relationships to source deals. Both are lagging indicators — by the time a foreclosure is filed, most sophisticated buyers have already made contact. The window between 'owner is in distress' and 'foreclosure is public' is the alpha window, and it closes in days, not weeks.",
      context:
        "Distressed real estate acquisition is fundamentally an information timing problem. The owner's financial distress is visible in multiple data streams weeks before it becomes public: tax delinquency, missed utility payments, deferred maintenance, insurance lapse, and declining rental receipts relative to debt service. Most acquisition teams don't have a system that aggregates these signals at portfolio scale — they rely on broker tips and public records, both of which arrive after the best negotiating position is gone.",
      constraints: [
        'Target was a 180-unit multifamily complex in a secondary market with limited broker coverage',
        'Owner was an out-of-state LLC — no direct relationship with the GP, no history of brokered sales',
        'Public records search had a 2–3 week lag from filing to indexed search database',
        'Competing buyers with direct county relationships could access the filing 5–7 days faster than the investment team',
      ],
      systemBuilt:
        'DOMAINE was configured with a distress signal model that combined: property tax delinquency (county records integration), utility disconnection notices (state utility registry), insurance policy lapse indicators (commercial property database), maintenance permit inactivity (building department records), and rental market price deviation (listed rent vs. market comp). The multi-signal distress score for the target property crossed the 85/100 threshold 22 days before the foreclosure filing was recorded — DOMAINE issued a high-priority acquisition opportunity alert to the investment committee.',
      howItWorked: [
        'Day 1: DOMAINE detects property tax delinquency on 2 consecutive quarters — distress signal score: 34/100',
        'Day 6: Utility escalation notice detected — maintenance permit inactivity confirmed — score: 61/100',
        'Day 11: Insurance policy flag detected in commercial database — score: 78/100',
        'Day 14: Rental pricing deviation: listed rent 12% below market comp, consistent with occupancy pressure — score: 87/100',
        'Day 15: Investment committee alerted — high-priority acquisition opportunity, $28M estimated value, pre-foreclosure window',
        'Day 17: Legal team retained to research ownership structure and initiate confidential outreach',
        'Day 22: Direct contact made with GP — initial conversation about structured sale',
        'Day 34: Foreclosure filing made public — investment team was already in LOI negotiations',
      ],
      outcome:
        'LOI signed 8 days after foreclosure filing — but the negotiating position was established 12 days before the filing, when the GP was still open to a private sale. Final acquisition at 18% discount to estimated market value. The investment committee later calculated that acquiring through the public foreclosure process would have cost $3.2M more and taken 4–6 months longer to close.',
      visualProof: [
        { label: 'Lead time', value: '19 days', sub: 'Before public filing' },
        { label: 'Distress score', value: '87/100', sub: 'Multi-signal' },
        { label: 'Discount to market', value: '18%', sub: 'Final acquisition' },
        { label: 'Cost advantage', value: '$3.2M', sub: 'vs. public process' },
        { label: 'Signals correlated', value: '5', sub: 'Tax, utility, insurance, permits, rent' },
        { label: 'Time to close', value: '4–6 mo less', sub: 'vs. foreclosure process' },
      ],
      whyItMatters:
        "The distressed real estate market rewards information velocity. Every day earlier you identify a distressed owner is a day more of negotiating advantage — and a day less of competition. DOMAINE doesn't wait for public filings. It reads the operating signals that precede distress and surfaces the opportunity while the owner still has optionality. The 19-day lead was the difference between a negotiated private transaction at 18% discount and a competitive auction with no discount.",
    },
  },
  {
    id: 'carlota-jo-estate-transition',
    product: 'Carlota Jo',
    productAccent: '#c9a96e',
    category: 'Private Advisory & Estate Management',
    title:
      'Estate Transition Structured Across 4 Jurisdictions in 18 Days — With Zero Disclosed Principals',
    subtitle:
      'How Carlota Jo executed a complex, cross-border estate restructuring under strict confidentiality constraints',
    sections: {
      problem:
        "A principal family with significant real estate, liquid assets, and operating business interests across four jurisdictions needed to restructure their estate ahead of a major liquidity event. The restructuring had to proceed without disclosing the family's identity to counterparties — protecting against competitive intelligence, tax speculation, and unwanted press attention.",
      context:
        'High-net-worth estate transitions are routinely delayed by weeks or months by coordination failures: legal teams in different jurisdictions not communicating, custodians operating on incompatible timelines, family advisors working without an integrated view of the full structure. The confidentiality requirement added a layer of complexity that most institutional service providers cannot accommodate without principal disclosure.',
      constraints: [
        'Four jurisdictions with different legal and tax treatment: US, UK, Cayman, and Singapore',
        'Principal identity could not be disclosed to any external counterparty during the process',
        'Three existing family advisors (legal, tax, financial) with no shared coordination protocol',
        '18-day window before the liquidity event imposed timing constraints on the restructuring',
        'Three minor beneficiaries required independent trustee arrangements in two jurisdictions',
      ],
      systemBuilt:
        "Carlota Jo deployed a dedicated estate coordination team with jurisdiction-specific counsel in each location. A secure, compartmentalized communications protocol was established so that each counterparty worked with a Carlota Jo representative — not the principal. A single integrated timeline with daily checkpoint reviews coordinated all four legal processes in parallel. Trustee arrangements for minor beneficiaries were established through Carlota Jo's vetted fiduciary network without exposing the family.",
      howItWorked: [
        'Day 1–2: Jurisdiction mapping and legal team engagement across US, UK, Cayman, Singapore',
        'Day 3–5: Holding structure design finalized; parallel legal workstreams opened in all four jurisdictions',
        'Day 6–10: Trust instruments drafted; trustee nominations confirmed for minor beneficiaries',
        'Day 11–14: Asset transfer documentation prepared; custodian instructions issued under nominee protocol',
        'Day 15–17: Cross-jurisdictional legal signoffs completed; structure verified against tax treatment',
        'Day 18: All transfers executed. Structure in place before liquidity event. Principal identity never disclosed.',
      ],
      outcome:
        "Estate restructuring completed in 18 days across 4 jurisdictions. Principal identity protected throughout. All three minor beneficiaries' trustee arrangements established and funded. Structure validated against tax treatment in all jurisdictions. The liquidity event closed on schedule with the estate structure fully in place.",
      visualProof: [
        { label: 'Jurisdictions', value: '4', sub: 'US, UK, Cayman, Singapore' },
        { label: 'Completion time', value: '18 days', sub: 'End-to-end' },
        { label: 'Principal disclosures', value: '0', sub: 'To external parties' },
        { label: 'Advisors coordinated', value: '3', sub: 'Legal, tax, financial' },
        { label: 'Beneficiaries covered', value: '3', sub: 'Minor trust arrangements' },
        { label: 'Timeline met', value: '100%', sub: 'Before liquidity event' },
      ],
      whyItMatters:
        "Complex estate restructuring at this level typically takes 60–90 days and requires multiple rounds of principal disclosure. Carlota Jo's value is not speed alone — it is the ability to execute with precision under constraints that most service providers will not accept. When confidentiality is non-negotiable and timing is critical, having a dedicated coordination layer that sits between the principal and every counterparty is the only approach that works.",
    },
  },
];
