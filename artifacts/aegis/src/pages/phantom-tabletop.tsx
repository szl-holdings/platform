import {
  AlertTriangle,
  Brain,
  Clock,
  FileText,
  Play,
  RotateCcw,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const PHANTOM_ACCENT = '#8a8a8a';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type ScenarioType = 'ransomware' | 'insider' | 'supply-chain' | 'cloud-breach';
type ExercisePhase = 'setup' | 'briefing' | 'active' | 'scoring' | 'complete';

interface DecisionOption {
  id: string;
  text: string;
  score: number;
  rationale: string;
  /** IDs of additional decisions to enqueue when this option is chosen */
  branchIds?: string[];
  /** A consequence inject shown immediately after this choice */
  consequence?: { text: string; severity: 'critical' | 'high' | 'medium' };
}

interface Decision {
  id: string;
  timeLimit: number;
  prompt: string;
  options: DecisionOption[];
  /** Context prefix shown when this decision was reached via a specific branch */
  branchContext?: string;
}

interface Scenario {
  id: ScenarioType;
  title: string;
  category: string;
  description: string;
  severity: 'catastrophic' | 'critical' | 'major';
  roleRequired: string;
  estimatedMinutes: number;
  /** Root decision IDs in order — the initial linear spine */
  decisions: Decision[];
  /** All decisions including branches, indexed by id */
  allDecisions: Record<string, Decision>;
  context: string;
  injects: { time: string; text: string; severity: 'critical' | 'high' | 'medium' }[];
}

const SCENARIOS: Record<ScenarioType, Scenario> = {
  ransomware: {
    id: 'ransomware',
    title: 'Operation Black Frost — Ransomware Crisis',
    category: 'Ransomware / Business Continuity',
    description:
      'ALPHV/BlackCat ransomware has encrypted 89 servers across your enterprise. Attackers demand $4.2M in 72 hours and threaten to publish 140K customer records.',
    severity: 'catastrophic',
    roleRequired: 'CISO / CEO / Board',
    estimatedMinutes: 25,
    context: `SITUATION BRIEF — 03:14 UTC Tuesday

Your SOC has detected mass ransomware encryption across enterprise infrastructure. 89 servers encrypted including ERP, finance systems, and customer databases. Backup servers targeted — shadow copies deleted.

ATTACKER MESSAGE received via encrypted email:
"Your network is controlled by BlackCat. Pay $4.2M in Bitcoin within 72 hours or 140,000 customer records published. Evidence pack: [link]"

CURRENT STATUS:
• 89 servers encrypted — operations severely impaired
• 23 servers isolated by EDR before encryption
• Backup restoration tested — last clean backup is 11 days old
• 140K customer records confirmed in attacker possession
• CEO, Board, legal counsel, and insurers notified
• Media inquiry received from Reuters at 04:42 UTC`,
    injects: [
      {
        time: 'T+15m',
        text: "Reuters publishes story: 'Major financial firm hit by ransomware — customer data at risk'",
        severity: 'critical',
      },
      {
        time: 'T+30m',
        text: 'Attacker posts 5,000 sample customer records on dark web forum as proof',
        severity: 'critical',
      },
      {
        time: 'T+2h',
        text: 'SEC staff attorney calls: potential material incident disclosure requirement under new cybersecurity rules',
        severity: 'high',
      },
      {
        time: 'T+4h',
        text: 'FBI Cyber Division arrives — advises against payment, offers decryption key negotiation assistance',
        severity: 'medium',
      },
    ],
    decisions: [
      {
        id: 'd1',
        timeLimit: 120,
        prompt:
          'It is 03:30 UTC. Your IR team estimates 18-hour recovery from 11-day-old backups. Operations are critically impaired. The $4.2M demand must be answered in 72 hours. What is your immediate priority?',
        options: [
          {
            id: 'a',
            text: 'Isolate all remaining clean systems and begin emergency backup restoration — accept operational downtime',
            score: 90,
            rationale:
              'Best practice: protect clean systems, avoid data loss expansion. Backup restoration preserves independence from attacker.',
            consequence: {
              text: 'Isolation successful — 23 clean servers protected. Backup restoration begins. Estimated recovery: 18 hours.',
              severity: 'medium',
            },
          },
          {
            id: 'b',
            text: 'Engage private ransomware negotiators while simultaneously beginning recovery — keep options open',
            score: 75,
            rationale:
              'Reasonable hedge: negotiation buys time but signals potential payment willingness. Most cyber insurers endorse this approach.',
          },
          {
            id: 'c',
            text: 'Pay the ransom immediately to restore operations fastest — business continuity is paramount',
            score: 15,
            rationale:
              'Strongly discouraged: no guarantee of decryption, funds criminal operations, no OFAC guarantee, attracts repeat targeting.',
            branchIds: ['d1-paid'],
            consequence: {
              text: 'CRITICAL: $4.2M Bitcoin payment confirmed. Attacker sent partial decryption key. Only 60% of systems recovered. Attacker now demanding $6M more for the rest.',
              severity: 'critical',
            },
          },
          {
            id: 'd',
            text: 'Do nothing until legal and insurance review — take 24 hours to assess full options',
            score: 20,
            rationale:
              'Dangerously passive: attacker timeline is 72 hours, delay enables further lateral movement and data publication.',
            branchIds: ['d1-wait'],
            consequence: {
              text: 'HIGH RISK: 24-hour delay allowed attacker to exfiltrate 50K additional customer records and begin encrypting backup storage.',
              severity: 'critical',
            },
          },
        ],
      },
      {
        id: 'd2',
        timeLimit: 90,
        prompt:
          'Reuters has published the story. Your PR team says this will be front-page news. Regulators have not been notified. Legal counsel says SEC disclosure may be required within 4 business days. What is your communications strategy?',
        options: [
          {
            id: 'a',
            text: 'Proactive customer notification immediately + SEC material event disclosure within 24 hours',
            score: 95,
            rationale:
              'Highest-scoring: builds trust, meets regulatory obligations, reduces class-action risk, demonstrates responsible governance.',
            consequence: {
              text: "Customer notification sent. SEC staff acknowledged receipt. Media coverage shifts to 'responsible disclosure' narrative.",
              severity: 'medium',
            },
          },
          {
            id: 'b',
            text: 'Hold all communications until FBI investigation concludes — no statement for 48 hours',
            score: 20,
            rationale:
              'Risky: creates information vacuum, media speculation amplifies damage, potential SEC violation if material event.',
            branchIds: ['d2-silence'],
            consequence: {
              text: 'ESCALATION: Whistleblower leaks details to CNN. Class action filed in Delaware. SEC opens formal investigation into delayed disclosure.',
              severity: 'critical',
            },
          },
          {
            id: 'c',
            text: "Acknowledge breach publicly but minimize severity — 'isolated incident, no evidence of data misuse'",
            score: 10,
            rationale:
              'Dangerous misrepresentation: 140K records confirmed stolen, misleading statements increase legal liability significantly.',
            branchIds: ['d2-minimize'],
            consequence: {
              text: 'CRISIS: Attacker published 20K records to contradict your statement. FTC and 12 state AGs investigating misleading disclosures. Board demands CISO resignation.',
              severity: 'critical',
            },
          },
          {
            id: 'd',
            text: 'Notify customers + engage regulators within 24 hours, coordinate with FBI on timing to avoid investigation compromise',
            score: 88,
            rationale:
              'Strong answer: balances regulatory compliance with law enforcement coordination. Slightly less optimal than proactive immediate disclosure.',
          },
        ],
      },
      {
        id: 'd3',
        timeLimit: 60,
        prompt:
          'FBI advises against payment. Cyber insurer has $10M policy covering ransomware. Attacker has reduced demand to $2.8M. Recovery is estimated at 21 days total. The Board is requesting your recommendation. What do you advise?',
        options: [
          {
            id: 'a',
            text: 'Do not pay — accept 21-day recovery, brief Board on total cost projection (recovery + business interruption)',
            score: 92,
            rationale:
              'Correct posture: FBI endorses no-payment, no guarantee of decryption key, criminal funding violation risk, strong recovery plan available.',
          },
          {
            id: 'b',
            text: 'Pay the reduced $2.8M — business interruption cost exceeds this, and cyber insurance covers it',
            score: 35,
            rationale:
              'Underscores moral hazard: insurance payment does not eliminate risk, OFAC sanctions risk, no guarantee of full key delivery.',
          },
          {
            id: 'c',
            text: 'Counter-offer $500K to buy more recovery time without committing to full payment',
            score: 45,
            rationale:
              'Common tactic but signals payment willingness, escalates negotiation, and delays inevitable recovery decision.',
          },
          {
            id: 'd',
            text: 'Authorize technical team to attempt ransomware decryption independently using leaked BlackCat keys',
            score: 70,
            rationale:
              'Worth attempting in parallel but should not replace recovery efforts — leaked keys may not work on all file versions.',
          },
        ],
      },
    ],
    allDecisions: {
      'd1-paid': {
        id: 'd1-paid',
        timeLimit: 75,
        branchContext: 'BRANCH: Ransom Payment Consequence',
        prompt:
          'The $4.2M Bitcoin payment has been confirmed. The attacker delivered a partial decryption key — only 60% of systems have been restored. The attacker is now demanding an additional $6M or they will publish the remaining 140K records. The FBI has learned of the payment and is considering an OFAC investigation. What do you do?',
        options: [
          {
            id: 'a',
            text: 'Stop all negotiations — shift fully to backup recovery and engage FBI proactively to get ahead of OFAC inquiry',
            score: 70,
            rationale:
              'Correct pivot: stop the bleeding, cooperate with FBI, accept partial loss. Demonstrates good faith and avoids compounding OFAC violation risk.',
          },
          {
            id: 'b',
            text: "Pay the additional $6M — you've already paid once, you need full restoration",
            score: 5,
            rationale:
              'Catastrophic: second payment confirms you will always pay. Permanent target designation. Near-certain OFAC violation. No guarantee of final key.',
          },
          {
            id: 'c',
            text: 'Engage the cyber insurer for emergency authorization of the $6M second payment',
            score: 15,
            rationale:
              'Insurer is very unlikely to authorize a second payment after the first failed. Policy breach risk and OFAC concern.',
          },
          {
            id: 'd',
            text: 'Publicly announce you have paid and name the attacker to shame them — hope they deliver the key',
            score: 20,
            rationale:
              'Counterproductive: public exposure of payment emboldens attackers and signals other ransomware groups you will pay.',
          },
        ],
      },
      'd1-wait': {
        id: 'd1-wait',
        timeLimit: 60,
        branchContext: 'BRANCH: 24-Hour Delay Consequence',
        prompt:
          "During your 24-hour wait, attackers used remaining network access to exfiltrate 50,000 additional customer records and begin encrypting backup storage. The attacker has now upped the demand to $7M due to 'increased risk exposure.' Your legal team says the delay may itself constitute a compliance failure. What is your recovery path?",
        options: [
          {
            id: 'a',
            text: 'Immediately network-isolate all remaining systems, accept full data loss, engage cyber insurer and begin legal disclosure',
            score: 65,
            rationale:
              'Late but necessary: stopping further damage is still the priority even after delay.',
          },
          {
            id: 'b',
            text: "Attempt to negotiate with attacker for the original $4.2M — delay shouldn't affect the deal",
            score: 20,
            rationale:
              'Negotiating from a weakened position: attacker now controls more data and has increased leverage.',
          },
          {
            id: 'c',
            text: 'Focus all resources on backup recovery and accept the data exposure — do not engage attacker',
            score: 75,
            rationale:
              'Correct containment approach: stop attacker access, initiate recovery, notify regulators. Delay has cost but the path forward is the same.',
          },
          {
            id: 'd',
            text: 'Engage FBI immediately and transfer all incident management to them',
            score: 55,
            rationale:
              'FBI involvement is valuable but you cannot fully transfer incident ownership — legal obligations remain with the company.',
          },
        ],
      },
      'd2-silence': {
        id: 'd2-silence',
        timeLimit: 60,
        branchContext: 'BRANCH: Communications Silence Consequence',
        prompt:
          'Your 48-hour media silence has broken: a senior employee leaked to CNN. Three class-action lawsuits have been filed in Delaware and California. The SEC has opened a formal investigation and has requested all communications related to the incident. Your stock has dropped 18% in pre-market trading. Board is calling for an emergency session. What is your immediate step?',
        options: [
          {
            id: 'a',
            text: 'Full proactive disclosure immediately — customer notification, SEC Form 8-K, Board briefing, coordinated press statement',
            score: 80,
            rationale:
              'Damage control: immediate disclosure is still better than continued silence. Shows course-correction capability to regulators.',
          },
          {
            id: 'b',
            text: "Preserve attorney-client privilege over all incident communications — limit SEC's access",
            score: 15,
            rationale:
              'Risky obstruction approach: privilege assertions on SEC requests can worsen investigation. Cooperating reduces exposure.',
          },
          {
            id: 'c',
            text: 'File the SEC 8-K now and provide customer notification in parallel — accept stock impact as inevitable',
            score: 85,
            rationale:
              'Best recovery path: regulatory compliance restored, narrative control begins returning to the company.',
          },
          {
            id: 'd',
            text: "Focus only on technical recovery — communications is the PR team's problem",
            score: 5,
            rationale:
              'Negligent leadership posture at this stage: regulatory and reputational crisis requires C-suite ownership.',
          },
        ],
      },
      'd2-minimize': {
        id: 'd2-minimize',
        timeLimit: 60,
        branchContext: 'BRANCH: Misleading Statement Consequence',
        prompt:
          "Your 'isolated incident' statement has been refuted by the attacker posting 20,000 customer records publicly. The FTC and 12 state Attorneys General have opened investigations. Board has called an emergency session demanding your resignation. SEC has issued a document preservation notice. Media is characterizing this as a cover-up. What do you do?",
        options: [
          {
            id: 'a',
            text: 'Immediate full retraction and corrected disclosure — acknowledge the scope of the breach, notify all affected customers, cooperate fully with FTC and state AGs',
            score: 75,
            rationale:
              'Only viable path: retraction with full cooperation. Minimizes criminal exposure for misleading statements and demonstrates corrective action.',
          },
          {
            id: 'b',
            text: "Stand by the original statement — 'the published records are fabricated by attackers'",
            score: 0,
            rationale:
              'Knowingly false statement: the records are authentic. Fraudulent securities disclosure compounds every existing violation.',
          },
          {
            id: 'c',
            text: 'Retain separate outside counsel for the FTC/AG investigations vs. cyber IR — manage legal exposure in parallel',
            score: 60,
            rationale:
              'Sound legal triage: separate counsel prevents conflict of interest. Does not address the disclosure failure but manages exposure.',
          },
          {
            id: 'd',
            text: 'Submit resignation and let the incoming CISO correct the record',
            score: 30,
            rationale:
              'Leadership change alone does not remediate legal liability — the organization still faces regulatory penalties and customer claims.',
          },
        ],
      },
    },
  },
  insider: {
    id: 'insider',
    title: 'Operation Quiet Exodus — Insider Theft',
    category: 'Insider Threat / Data Theft',
    description:
      'A senior finance executive is suspected of exfiltrating 264 confidential documents including IP, customer lists, and financial projections to a competitor before a planned resignation.',
    severity: 'critical',
    roleRequired: 'CISO / CHRO / Legal',
    estimatedMinutes: 20,
    context: `SITUATION BRIEF — CONFIDENTIAL

SENTINEL behavioral analytics flagged anomalous access by VP Finance M. Rodriguez:
• 264 documents accessed after-hours over 89 days — 3x baseline
• Personal OneDrive uploads detected — 12.4GB over 14 days
• Calendar shows 3 meetings with competitor executives (LinkedIn)
• HR records: no PIP, no grievance — high performer, $340K total comp

DOCUMENTS AT RISK include: Q3/Q4 financial projections, M&A pipeline (3 active targets), customer pricing agreements (142 enterprise accounts), product roadmaps 2025-2027.

NOTE: No unauthorized system access — all actions via legitimate credentials within normal business hours and some after-hours periods.`,
    injects: [
      {
        time: 'T+1h',
        text: 'Legal discovers employee signed comprehensive IP assignment agreement and non-disclosure — strong civil remedy available',
        severity: 'medium',
      },
      {
        time: 'T+3h',
        text: 'Competitor announces new product with features matching your confidential roadmap — circumstantial timing concern',
        severity: 'high',
      },
    ],
    decisions: [
      {
        id: 'd1',
        timeLimit: 90,
        prompt:
          'SENTINEL has flagged a senior VP for suspected data exfiltration. All access was with legitimate credentials. Employee is currently in the office. What is your immediate response?',
        options: [
          {
            id: 'a',
            text: 'Immediately revoke all access, escort from building, and notify legal — treat as confirmed breach',
            score: 30,
            rationale:
              'Premature: SENTINEL findings are probabilistic. Wrongful termination liability is significant without confirmed evidence.',
            branchIds: ['insider-d1-wrongful'],
            consequence: {
              text: 'RISK: Employee attorney has been retained within 2 hours. Wrongful termination claim filed. Evidence from personal OneDrive now behind legal hold.',
              severity: 'critical',
            },
          },
          {
            id: 'b',
            text: 'Begin quiet forensic investigation — preserve evidence chain while employee remains active. Do NOT alert the employee.',
            score: 88,
            rationale:
              'Best practice: covert preservation of forensic evidence, establishes intent, avoids wrongful termination, enables prosecution.',
            consequence: {
              text: 'Silent forensics in progress. Evidence chain preserved. Employee unaware of investigation.',
              severity: 'medium',
            },
          },
          {
            id: 'c',
            text: 'Confront employee directly — ask them to explain their access patterns',
            score: 15,
            rationale:
              'Destroys evidence: employee may delete files, communicate with accomplices, or claim harassment.',
            branchIds: ['insider-d1-confronted'],
            consequence: {
              text: 'CRITICAL: Employee denied wrongdoing and immediately deleted personal OneDrive account. Evidence chain destroyed. Possible hostile communications with competitor.',
              severity: 'critical',
            },
          },
          {
            id: 'd',
            text: 'Do nothing until you have definitive proof — DLP logs alone are insufficient',
            score: 40,
            rationale:
              'While caution is warranted, total inaction risks further exfiltration. Quiet monitoring is appropriate.',
          },
        ],
      },
      {
        id: 'd2',
        timeLimit: 60,
        prompt:
          'Forensic review confirms 264 documents exfiltrated to personal cloud. Employee has submitted resignation effective in 3 weeks. Legal has drafted a cease-and-desist. What action do you take regarding the resignation and customer notification?',
        options: [
          {
            id: 'a',
            text: 'Accept resignation, serve cease-and-desist, file civil suit for IP theft and breach of NDA',
            score: 85,
            rationale:
              'Strong legal posture: NDA enforcement, civil remedy, documented evidence chain. Avoid criminal referral unless scale justifies.',
          },
          {
            id: 'b',
            text: 'Immediately terminate, file criminal complaint with FBI for trade secret theft under Defend Trade Secrets Act',
            score: 70,
            rationale:
              'Valid for large-scale theft but FBI prosecution is slow. Civil remedy is faster for injunctive relief.',
          },
          {
            id: 'c',
            text: 'Allow employee to complete notice period — pursue only civil action post-departure',
            score: 20,
            rationale:
              'Risk: 3 more weeks of potential exfiltration. Should revoke sensitive access immediately even if employment continues.',
          },
          {
            id: 'd',
            text: 'Notify affected customers proactively — pricing agreements and account data are at risk',
            score: 55,
            rationale:
              'Context-dependent: premature customer notification may cause unnecessary alarm. Better to assess competitor use first.',
          },
        ],
      },
    ],
    allDecisions: {
      'insider-d1-confronted': {
        id: 'insider-d1-confronted',
        timeLimit: 60,
        branchContext: 'BRANCH: Evidence Destruction After Confrontation',
        prompt:
          'The employee deleted all personal cloud evidence after your confrontation. Without the OneDrive files, your only remaining evidence is access logs and metadata. The employee claims you violated their privacy. Your attorney says the case just became significantly weaker. How do you proceed?',
        options: [
          {
            id: 'a',
            text: 'Request emergency legal order (TRO) to preserve and recover deleted cloud files — courts can compel cloud provider forensics',
            score: 75,
            rationale:
              'Correct path: cloud providers retain deleted files for 30 days under legal hold. TRO can preserve them before destruction.',
          },
          {
            id: 'b',
            text: 'Proceed only on access log evidence — file civil suit for breach of NDA based on metadata',
            score: 55,
            rationale:
              'Viable but weaker case. Circumstantial metadata evidence combined with competitor product release timing may still support injunctive relief.',
          },
          {
            id: 'c',
            text: 'Drop the investigation — insufficient admissible evidence remains without the deleted files',
            score: 10,
            rationale:
              'Premature abandonment: legal remedies still exist. Access logs, email metadata, and forensic disk images may support the case.',
          },
          {
            id: 'd',
            text: 'Engage the competitor directly — accuse them of receiving stolen IP and demand return of documents',
            score: 20,
            rationale:
              'Without evidence, direct competitor contact is legally risky and may result in defamation exposure.',
          },
        ],
      },
      'insider-d1-wrongful': {
        id: 'insider-d1-wrongful',
        timeLimit: 60,
        branchContext: 'BRANCH: Wrongful Termination Claim',
        prompt:
          "The employee's attorney has filed a wrongful termination claim citing lack of due process. HR confirms no Performance Improvement Plan was on file. The employee's personal OneDrive evidence is now under their legal hold — you cannot access it without court order. PR is asking if this will become public. How do you manage this?",
        options: [
          {
            id: 'a',
            text: 'Immediately file your own civil complaint citing IP theft — get to court first to frame the narrative legally',
            score: 70,
            rationale:
              'Proactive legal offense shifts the frame from wrongful termination to IP defense. Requires strong access log evidence.',
          },
          {
            id: 'b',
            text: 'Offer a confidential settlement to make the wrongful termination claim disappear',
            score: 40,
            rationale:
              'Settlement avoids PR exposure but may not include an NDA strong enough to prevent the IP from being used.',
          },
          {
            id: 'c',
            text: "Engage forensic counsel to petition for court-ordered access to employee's OneDrive data before it expires",
            score: 85,
            rationale:
              'Best path: recovers the strongest evidence before 30-day cloud retention expires while managing legal conflict.',
          },
          {
            id: 'd',
            text: 'Pause all legal action pending HR investigation of the termination process',
            score: 25,
            rationale:
              'Delay forfeits cloud evidence — every day without a TRO increases risk of permanent data loss.',
          },
        ],
      },
    },
  },
  'supply-chain': {
    id: 'supply-chain',
    title: 'Operation Phantom Node — Supply Chain Compromise',
    category: 'Software Supply Chain / Third-Party Risk',
    description:
      'A widely-used open source library in your CI/CD pipeline has been compromised — a malicious package update contains backdoor code deployed to 12 production systems.',
    severity: 'critical',
    roleRequired: 'CISO / CTO / Engineering Lead',
    estimatedMinutes: 20,
    context: `SITUATION BRIEF

A security researcher has published findings that npm package 'event-stream@4.0.1' (installed in your production pipeline via 3rd-party dependency) contains obfuscated backdoor code. SBOM analysis confirms this package is present in 12 production microservices deployed in the last 6 weeks.

BACKDOOR ANALYSIS:
• Targets Bitcoin wallet credentials and SSH private keys
• Communicates to C2 at malicious-cdn.io via HTTPS
• Activation trigger: specific date/time combination (next trigger: 72 hours)
• 6 weeks of potential active compromise prior to discovery

EXPOSURE ASSESSMENT:
• 12 production services potentially backdoored
• CI/CD pipeline integrity unknown
• Build artifacts from last 6 weeks may be compromised`,
    injects: [
      {
        time: 'T+2h',
        text: 'Another company in your sector announces they were breached via the same package — confirms active exploitation',
        severity: 'critical',
      },
      {
        time: 'T+6h',
        text: 'Security researcher releases technical advisory — your company named as likely high-value target based on exposed service fingerprints',
        severity: 'high',
      },
    ],
    decisions: [
      {
        id: 'd1',
        timeLimit: 90,
        prompt:
          '12 production services may be backdoored. The malicious trigger fires in 72 hours. You can take all affected services offline (losing revenue) or deploy mitigating controls (uncertain effectiveness). What do you do?',
        options: [
          {
            id: 'a',
            text: 'Immediately take all 12 services offline, begin clean rebuild from pre-compromise artifacts',
            score: 95,
            rationale:
              'Correct: 72-hour window is narrow, known backdoor with active C2. Revenue loss is recoverable, data breach is not.',
          },
          {
            id: 'b',
            text: 'Deploy network-level blocks on C2 domains and continue operations while rebuilding in parallel',
            score: 70,
            rationale:
              'Reasonable mitigation but C2 blocking alone is insufficient — hardcoded IPs or DGA may bypass DNS blocks.',
          },
          {
            id: 'c',
            text: 'Wait for vendor patch and apply to running services — minimize disruption',
            score: 10,
            rationale:
              'Dangerous: no vendor patch exists for supply chain compromise, systems remain backdoored.',
            branchIds: ['sc-d1-triggered'],
            consequence: {
              text: 'CRITICAL: 72-hour trigger fired. Backdoor exfiltrated SSH keys and Bitcoin wallet data from all 12 services. Active exploitation confirmed.',
              severity: 'critical',
            },
          },
          {
            id: 'd',
            text: 'Implement emergency WAF rules and enhanced monitoring for 72 hours while rebuilding begins',
            score: 60,
            rationale:
              "Defense-in-depth but doesn't address root compromise. WAF provides marginal protection against backdoor.",
          },
        ],
      },
    ],
    allDecisions: {
      'sc-d1-triggered': {
        id: 'sc-d1-triggered',
        timeLimit: 60,
        branchContext: 'BRANCH: Backdoor Trigger Fired',
        prompt:
          'The backdoor trigger fired during your wait. SSH keys and secrets have been exfiltrated from all 12 services. Active exploitation is now confirmed — attacker has shell access to production. Your SBOM shows the compromised package is also present in 7 additional services discovered after initial assessment. You now have 19 compromised services. How do you respond?',
        options: [
          {
            id: 'a',
            text: 'Emergency full production shutdown — take down all 19 services, engage incident response firm, begin forensics',
            score: 85,
            rationale:
              'Only appropriate response at this stage. Active exploitation with confirmed credential theft requires immediate full containment.',
          },
          {
            id: 'b',
            text: 'Rotate all SSH keys and secrets immediately while services stay running — stop the exfiltration channel',
            score: 60,
            rationale:
              'Necessary but insufficient: the backdoor is still present and may have additional capabilities beyond key theft.',
          },
          {
            id: 'c',
            text: 'Notify all affected customers of the breach while beginning remediation',
            score: 50,
            rationale:
              'Disclosure is required but notification before containment is complete may cause premature alarm before scope is understood.',
          },
          {
            id: 'd',
            text: 'Engage the software maintainer who introduced the malicious package — attempt attribution and cooperation',
            score: 20,
            rationale:
              'Attribution is a long-term goal. Does nothing to address active compromise right now.',
          },
        ],
      },
    },
  },
  'cloud-breach': {
    id: 'cloud-breach',
    title: 'Operation Cirrus Fall — Cloud Credential Breach',
    category: 'Cloud Security / Credential Theft',
    description:
      'An AWS root account credential has been compromised. Attackers have launched 847 EC2 instances for cryptomining and accessed S3 buckets containing customer PII.',
    severity: 'critical',
    roleRequired: 'CISO / Cloud Architect / Legal',
    estimatedMinutes: 18,
    context: `SITUATION BRIEF — AWS ACCOUNT COMPROMISE

AWS billing alert triggered at 02:31 UTC: $847K unauthorized spend detected in 6 hours.

INVESTIGATION FINDINGS:
• AWS root account credentials exposed via developer GitHub repository (env file committed 3 weeks ago)
• Attackers launched 847 c5.4xlarge instances across 14 regions for cryptocurrency mining
• S3 bucket 'prod-customer-data' accessed — 2.1M customer PII records (names, emails, DOBs)
• IAM backdoor role 'SupportRole' created with Administrator permissions
• CloudTrail logs disabled in 8 regions by attacker`,
    injects: [
      {
        time: 'T+30m',
        text: 'AWS Support notifies that your account has been flagged for abuse — risk of account suspension in 4 hours',
        severity: 'critical',
      },
      {
        time: 'T+2h',
        text: 'Dark web monitoring alert: 500K of your customer records posted for sale on criminal forum',
        severity: 'critical',
      },
    ],
    decisions: [
      {
        id: 'd1',
        timeLimit: 60,
        prompt:
          'AWS root credentials are compromised. $847K unauthorized compute spend in 6 hours. S3 PII accessed. Your first action:',
        options: [
          {
            id: 'a',
            text: 'Immediately rotate root credentials, revoke all active sessions, delete backdoor IAM role, stop all unauthorized instances',
            score: 95,
            rationale:
              'Correct sequence: credential rotation then session revocation kills attacker access immediately. Backdoor role deletion prevents re-entry.',
          },
          {
            id: 'b',
            text: 'Contact AWS Support for emergency assistance — let them lead the response',
            score: 40,
            rationale:
              'AWS support is helpful but you must act immediately — waiting for AWS delays critical credential rotation.',
            branchIds: ['cb-d1-suspended'],
            consequence: {
              text: 'CRITICAL: While waiting for AWS Support callback (47 minutes), AWS suspended your account for abuse. All production systems are now offline — legitimate services down.',
              severity: 'critical',
            },
          },
          {
            id: 'c',
            text: 'Take forensic snapshots of all running instances before terminating — preserve evidence',
            score: 50,
            rationale:
              'Evidence preservation is important but not before stopping active attack. Prioritize containment first, forensics second.',
          },
          {
            id: 'd',
            text: 'Enable MFA on root account first, then assess the full scope before taking action',
            score: 75,
            rationale:
              'MFA enables immediate root access recovery but does not revoke active attacker sessions — must invalidate sessions too.',
          },
        ],
      },
    ],
    allDecisions: {
      'cb-d1-suspended': {
        id: 'cb-d1-suspended',
        timeLimit: 60,
        branchContext: 'BRANCH: Account Suspended During Wait',
        prompt:
          'AWS has suspended your account. All production systems — attacker-launched and legitimate — are now offline. Your SLA breach clock is running. Engineers cannot access AWS console to begin remediation. You must contact AWS TAM for emergency account restoration. Meanwhile, your security team discovers the IAM backdoor role was also given cross-account trust to an unknown AWS account. What is your immediate escalation path?',
        options: [
          {
            id: 'a',
            text: 'Contact AWS Account Support for emergency reinstatement, provide abuse case ID, commit to immediate remediation plan',
            score: 80,
            rationale:
              'Necessary path: account reinstatement is only possible via AWS formal process. Providing clear remediation plan accelerates restoration.',
          },
          {
            id: 'b',
            text: 'Create a new AWS account and migrate clean workloads immediately — do not wait for suspension resolution',
            score: 65,
            rationale:
              'Emergency continuity option: viable for simple workloads but complex environments may take days to migrate.',
          },
          {
            id: 'c',
            text: 'File an emergency breach notification to customers — you cannot restore services and they deserve to know',
            score: 55,
            rationale:
              'Disclosure obligation exists but premature notification before scope confirmation increases legal exposure unnecessarily.',
          },
          {
            id: 'd',
            text: 'Engage AWS forensics team to lead the investigation — they have log access you cannot reach with suspended account',
            score: 70,
            rationale:
              'AWS forensics can access CloudTrail logs from suspended account. Valuable parallel track while pursuing reinstatement.',
          },
        ],
      },
    },
  },
};

export default function PhantomTabletop() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('ransomware');
  const [phase, setPhase] = useState<ExercisePhase>('setup');
  const [decisionQueue, setDecisionQueue] = useState<string[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [consequenceLog, setConsequenceLog] = useState<
    Array<{ text: string; severity: 'critical' | 'high' | 'medium' }>
  >([]);
  const [_currentInjectIdx, _setCurrentInjectIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = SCENARIOS[selectedScenario];

  /** Unified lookup: root decisions + all branching decisions */
  const allDecisionsMap = useMemo<Record<string, Decision>>(() => {
    const m: Record<string, Decision> = {};
    scenario.decisions.forEach((d) => {
      m[d.id] = d;
    });
    Object.assign(m, scenario.allDecisions);
    return m;
  }, [scenario]);

  const currentDecisionId = decisionQueue[queueIdx];
  const currentDecision = currentDecisionId ? allDecisionsMap[currentDecisionId] : null;

  function startExercise() {
    const rootIds = scenario.decisions.map((d) => d.id);
    setPhase('briefing');
    setDecisionQueue(rootIds);
    setQueueIdx(0);
    setChoices({});
    setScores([]);
    setConsequenceLog([]);
    setTimeout(() => {
      setPhase('active');
      const first = allDecisionsMap[rootIds[0]];
      if (first) startDecisionTimer(first.timeLimit);
    }, 3000);
  }

  function startDecisionTimer(limit: number) {
    setTimeRemaining(limit);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function makeChoice(decisionId: string, optionId: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    const decision = allDecisionsMap[decisionId];
    if (!decision) return;
    const option = decision.options.find((o) => o.id === optionId);
    if (!option) return;

    setChoices((prev) => ({ ...prev, [decisionId]: optionId }));
    setScores((prev) => [...prev, option.score]);

    if (option.consequence) {
      setConsequenceLog((prev) => [...prev, option.consequence!]);
    }

    // Build the updated queue: inject branch IDs right after the current position
    const branchIds = option.branchIds ?? [];
    const updatedQueue = [
      ...decisionQueue.slice(0, queueIdx + 1),
      ...branchIds,
      ...decisionQueue.slice(queueIdx + 1),
    ];
    setDecisionQueue(updatedQueue);

    const nextId = updatedQueue[queueIdx + 1];
    if (!nextId) {
      setTimeout(() => setPhase('scoring'), 800);
    } else {
      setQueueIdx(queueIdx + 1);
      const nextDecision = allDecisionsMap[nextId];
      if (nextDecision) startDecisionTimer(nextDecision.timeLimit);
    }
  }

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('setup');
    setDecisionQueue([]);
    setQueueIdx(0);
    setChoices({});
    setScores([]);
    setConsequenceLog([]);
    setTimeRemaining(0);
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const scoreLabel =
    avgScore >= 85
      ? 'Executive Excellence'
      : avgScore >= 65
        ? 'Competent Response'
        : avgScore >= 40
          ? 'Developing Capability'
          : 'Critical Gaps Identified';
  const scoreColor =
    avgScore >= 85
      ? '#6b8f71'
      : avgScore >= 65
        ? '#c9b787'
        : avgScore >= 40
          ? '#c9b787'
          : '#f5f5f5';

  const sevColors: Record<string, string> = {
    catastrophic: '#f5f5f5',
    critical: '#c9b787',
    major: '#c9b787',
  };

  return (
    <div className="min-h-screen p-5 space-y-5" style={{ background: '#080B12' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5" style={{ color: PHANTOM_ACCENT }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: PHANTOM_ACCENT }}
            >
              PHANTOM · Executive Tabletop
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Executive Tabletop Exercise</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            AI-generated board-level crisis scenarios with timed decision trees and executive
            scoring rubrics
          </p>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 space-y-2">
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: DS.text.muted }}
            >
              Select Scenario
            </div>
            {(Object.values(SCENARIOS) as Scenario[]).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s.id as ScenarioType)}
                className="w-full text-left p-3 rounded-xl border transition-all"
                style={{
                  borderColor: selectedScenario === s.id ? 'rgba(168,85,247,0.4)' : DS.border,
                  background: selectedScenario === s.id ? 'rgba(168,85,247,0.08)' : DS.surface,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: `${sevColors[s.severity]}15`,
                      color: sevColors[s.severity],
                    }}
                  >
                    {s.severity.toUpperCase()}
                  </span>
                  <span className="text-[8px]" style={{ color: DS.text.muted }}>
                    {s.estimatedMinutes}m
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white">{s.title}</div>
                <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                  {s.category}
                </div>
              </button>
            ))}
          </div>

          <div
            className="col-span-8 rounded-xl border p-5"
            style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-4"
              style={{ color: PHANTOM_ACCENT }}
            >
              Scenario Overview
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">{scenario.title}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span
                    className="text-[8px] px-2 py-0.5 rounded font-bold"
                    style={{
                      background: `${sevColors[scenario.severity]}15`,
                      color: sevColors[scenario.severity],
                    }}
                  >
                    {scenario.severity.toUpperCase()}
                  </span>
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    {scenario.category}
                  </span>
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    · {scenario.estimatedMinutes} min
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {scenario.description}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="text-lg font-bold font-mono" style={{ color: PHANTOM_ACCENT }}>
                    {scenario.decisions.length}+
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                    Decisions
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="text-lg font-bold font-mono" style={{ color: '#c9b787' }}>
                    {scenario.injects.length}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                    Scenario Injects
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" style={{ color: '#c9b787' }} />
                  <div className="text-[9px]" style={{ color: DS.text.muted }}>
                    {scenario.roleRequired}
                  </div>
                </div>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-wider mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Upcoming Scenario Injects
                </div>
                {scenario.injects.map((inj, i) => (
                  <div key={i} className="flex gap-3 py-1.5">
                    <span
                      className="text-[8px] font-mono w-12 shrink-0"
                      style={{ color: PHANTOM_ACCENT }}
                    >
                      {inj.time}
                    </span>
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      {inj.text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={startExercise}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(168,85,247,0.25)',
                  color: PHANTOM_ACCENT,
                  border: '1px solid rgba(168,85,247,0.4)',
                }}
              >
                <Play className="w-4 h-4" /> Begin Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'briefing' && (
        <div
          className="max-w-3xl mx-auto rounded-xl border p-6"
          style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 animate-pulse" style={{ color: PHANTOM_ACCENT }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: PHANTOM_ACCENT }}
            >
              Loading Scenario…
            </span>
          </div>
          <div className="font-mono text-[11px] leading-relaxed whitespace-pre-line text-[#c9b787]/80">
            {scenario.context}
          </div>
        </div>
      )}

      {phase === 'active' && currentDecision && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
              Decision {queueIdx + 1} of {decisionQueue.length}+
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm"
              style={{
                borderColor: timeRemaining < 30 ? 'rgba(245,245,245,0.4)' : 'rgba(168,85,247,0.3)',
                background: timeRemaining < 30 ? 'rgba(245,245,245,0.08)' : 'rgba(168,85,247,0.08)',
                color: timeRemaining < 30 ? '#f5f5f5' : PHANTOM_ACCENT,
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </div>
          </div>

          {/* Consequence log — show most recent consequence from a prior choice */}
          {consequenceLog.length > 0 && (
            <div
              className="rounded-xl border px-4 py-3 flex items-start gap-3"
              style={{
                borderColor:
                  consequenceLog[consequenceLog.length - 1].severity === 'critical'
                    ? 'rgba(245,245,245,0.4)'
                    : 'rgba(201,183,135,0.3)',
                background:
                  consequenceLog[consequenceLog.length - 1].severity === 'critical'
                    ? 'rgba(245,245,245,0.06)'
                    : 'rgba(201,183,135,0.05)',
              }}
            >
              <AlertTriangle
                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                style={{
                  color:
                    consequenceLog[consequenceLog.length - 1].severity === 'critical'
                      ? '#f5f5f5'
                      : '#c9b787',
                }}
              />
              <div>
                <div
                  className="text-[9px] uppercase tracking-wider mb-0.5 font-bold"
                  style={{
                    color:
                      consequenceLog[consequenceLog.length - 1].severity === 'critical'
                        ? '#f5f5f5'
                        : '#c9b787',
                  }}
                >
                  Consequence of Previous Decision
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {consequenceLog[consequenceLog.length - 1].text}
                </p>
              </div>
            </div>
          )}

          {/* Branch context — shown only for branching decisions */}
          {currentDecision.branchContext && (
            <div
              className="rounded-xl border px-4 py-2.5 flex items-center gap-2"
              style={{ borderColor: 'rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.07)' }}
            >
              <Zap className="w-3 h-3 shrink-0" style={{ color: PHANTOM_ACCENT }} />
              <span className="text-[10px] font-bold font-mono" style={{ color: PHANTOM_ACCENT }}>
                {currentDecision.branchContext}
              </span>
            </div>
          )}

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="text-[9px] uppercase tracking-wider mb-2"
              style={{ color: DS.text.muted }}
            >
              Situation Report
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {currentDecision.prompt}
            </p>
          </div>

          <div className="space-y-2.5">
            {currentDecision.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => makeChoice(currentDecision.id, opt.id)}
                disabled={!!choices[currentDecision.id]}
                className="w-full text-left px-4 py-3.5 rounded-xl border transition-all hover:scale-[1.01]"
                style={{
                  borderColor: DS.border,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5"
                    style={{ borderColor: 'rgba(168,85,247,0.4)', color: PHANTOM_ACCENT }}
                  >
                    {opt.id.toUpperCase()}
                  </span>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    {opt.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'scoring' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div
            className="rounded-xl border p-6 text-center"
            style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}06` }}
          >
            <div
              className="text-[10px] uppercase tracking-wider mb-3"
              style={{ color: DS.text.muted }}
            >
              Executive Performance Score
            </div>
            <div className="text-6xl font-bold font-mono mb-2" style={{ color: scoreColor }}>
              {avgScore}
            </div>
            <div className="text-sm font-semibold" style={{ color: scoreColor }}>
              {scoreLabel}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5"
                  style={{
                    color: i < Math.ceil(avgScore / 20) ? '#c9b787' : 'rgba(255,255,255,0.1)',
                  }}
                  fill={i < Math.ceil(avgScore / 20) ? '#c9b787' : 'none'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {decisionQueue.map((decId, i) => {
              const d = allDecisionsMap[decId];
              if (!d) return null;
              const chosen = choices[d.id];
              const option = chosen ? d.options.find((o) => o.id === chosen) : null;
              const best = d.options.reduce((a, b) => (a.score > b.score ? a : b));
              const isBranch = !scenario.decisions.find((sd) => sd.id === d.id);
              return (
                <div
                  key={d.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: isBranch ? 'rgba(168,85,247,0.3)' : DS.border,
                    background: isBranch ? 'rgba(168,85,247,0.04)' : DS.surface,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {isBranch && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(168,85,247,0.15)', color: PHANTOM_ACCENT }}
                      >
                        BRANCH
                      </span>
                    )}
                    <span
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: DS.text.muted }}
                    >
                      Decision {i + 1}
                    </span>
                    {d.branchContext && (
                      <span className="text-[9px] font-mono" style={{ color: PHANTOM_ACCENT }}>
                        {d.branchContext}
                      </span>
                    )}
                    {option && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto"
                        style={{
                          background: `${option.score >= 80 ? '#6b8f71' : option.score >= 60 ? '#c9b787' : '#f5f5f5'}15`,
                          color:
                            option.score >= 80
                              ? '#6b8f71'
                              : option.score >= 60
                                ? '#c9b787'
                                : '#f5f5f5',
                        }}
                      >
                        {option.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mb-3" style={{ color: DS.text.muted }}>
                    {d.prompt.slice(0, 120)}…
                  </p>
                  {option && (
                    <div
                      className="p-3 rounded-lg mb-2"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div
                        className="text-[9px] uppercase tracking-wider mb-1"
                        style={{ color: DS.text.muted }}
                      >
                        Your Choice ({option.id.toUpperCase()})
                      </div>
                      <div
                        className="text-[11px] mb-1.5"
                        style={{ color: 'rgba(255,255,255,0.75)' }}
                      >
                        {option.text}
                      </div>
                      <div className="text-[10px]" style={{ color: DS.text.muted }}>
                        {option.rationale}
                      </div>
                    </div>
                  )}
                  {option && option.id !== best.id && (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(107,143,113,0.08)',
                        border: '1px solid rgba(107,143,113,0.2)',
                      }}
                    >
                      <div className="text-[9px] uppercase tracking-wider mb-1 text-[#c9b787]">
                        Optimal Answer ({best.id.toUpperCase()}) — {best.score}/100
                      </div>
                      <div className="text-[10px]" style={{ color: DS.text.muted }}>
                        {best.rationale}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: 'rgba(168,85,247,0.2)',
                color: PHANTOM_ACCENT,
                border: '1px solid rgba(168,85,247,0.35)',
              }}
            >
              <RotateCcw className="w-4 h-4" /> Try Another Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
