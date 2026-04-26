import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Cpu,
  Crosshair,
  Download,
  Eye,
  FileText,
  Lock,
  Shield,
} from 'lucide-react';
import { useRef, useState } from 'react';

const PHANTOM_ACCENT = '#8a8a8a';
const SENTINEL_ACCENT = '#8a8a8a';
const _ACCENT = '#f5f5f5';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type ReportType = 'phantom-campaign' | 'sentinel-findings' | 'purple-team' | 'executive-summary';

const REPORT_CONFIGS: Record<
  ReportType,
  { label: string; code: string; color: string; icon: typeof FileText; classification: string }
> = {
  'phantom-campaign': {
    label: 'PHANTOM Campaign Assessment',
    code: 'PHT-2025-0412',
    color: PHANTOM_ACCENT,
    icon: Crosshair,
    classification: 'CONFIDENTIAL // FOUO',
  },
  'sentinel-findings': {
    label: 'SENTINEL Insider Threat Report',
    code: 'SNT-2025-0412',
    color: SENTINEL_ACCENT,
    icon: Eye,
    classification: 'CONFIDENTIAL // PERSONNEL',
  },
  'purple-team': {
    label: 'Purple Team Exercise Report',
    code: 'PTE-2025-0411',
    color: '#c9b787',
    icon: Shield,
    classification: 'CONFIDENTIAL // SEC CLEARANCE',
  },
  'executive-summary': {
    label: 'Executive Intelligence Summary',
    code: 'EIS-2025-Q2',
    color: '#c9b787',
    icon: Building2,
    classification: 'CONFIDENTIAL // BOARD ONLY',
  },
};

interface ReportSection {
  id: string;
  title: string;
  classification: string;
  content: string[];
  severity?: 'critical' | 'high' | 'medium';
}

const REPORT_CONTENT: Record<
  ReportType,
  {
    title: string;
    subtitle: string;
    summary: string;
    sections: ReportSection[];
    findings: {
      id: string;
      finding: string;
      severity: 'critical' | 'high' | 'medium';
      recommendation: string;
    }[];
    stats: { label: string; value: string; color: string }[];
  }
> = {
  'phantom-campaign': {
    title: 'PHANTOM Adversary Simulation — Campaign Assessment',
    subtitle: 'Operation Shadow Lattice: APT29 Nation-State Simulation',
    summary:
      'PHANTOM adversary simulation engine conducted a full-spectrum APT29-profile attack campaign against the production environment of [TARGET ORGANIZATION]. This classified assessment documents all simulated attack stages, MITRE ATT&CK mappings, detection coverage gaps identified, and recommended hardening actions to close material security control deficiencies.',
    stats: [
      { label: 'Campaign Duration', value: '127 days (simulated)', color: PHANTOM_ACCENT },
      { label: 'Attack Steps', value: '8 stages executed', color: '#c9b787' },
      { label: 'Detection Rate', value: '37.5% (3 of 8)', color: '#f5f5f5' },
      { label: 'Blast Radius', value: '94% predicted', color: '#f5f5f5' },
      { label: 'Adversary Profile', value: 'APT29 / Cozy Bear', color: '#c9b787' },
      { label: 'Financial Exposure', value: '$47.2M projected', color: '#f5f5f5' },
    ],
    sections: [
      {
        id: 's1',
        title: 'Executive Assessment',
        classification: 'CONFIDENTIAL',
        content: [
          'The PHANTOM simulation of an APT29-profile nation-state intrusion campaign against [TARGET ORGANIZATION] infrastructure reveals material and exploitable deficiencies in security detection and response capabilities.',
          'The adversary achieved dwell time of 89 simulated days before any detection event. Critical data exfiltration (47.3GB) was completed without triggering a security alert, representing a significant intelligence collection risk if executed by an actual nation-state threat actor.',
          'Only 3 of 8 simulated attack stages triggered detection events, yielding a 37.5% detection rate against this threat profile. This falls critically below the organizational target of 85% detection coverage for nation-state threat actors.',
        ],
      },
      {
        id: 's2',
        title: 'Kill Chain Analysis',
        classification: 'CONFIDENTIAL // FOUO',
        severity: 'critical',
        content: [
          'STAGE 1 — RECONNAISSANCE (Undetected): OSINT targeting via LinkedIn and passive DNS enumeration. No active scanning. Pre-compromise intelligence collection not detectable via current controls.',
          'STAGE 2 — INITIAL ACCESS (Undetected): Spearphishing with weaponized macOS PDF. Email security gateway quarantined 2 of 3 payloads; 1 delivered to target executive. Control gap: Safe Attachments not enforced for .pdf with embedded JavaScript.',
          'STAGE 5 — CREDENTIAL ACCESS (Detected): LSASS memory dump via Mimikatz variant detected by CrowdStrike behavioral AI. Alert generated but contained no automatic remediation — analyst review delayed 11 minutes.',
          'STAGE 8 — EXFILTRATION (Undetected): 47.3GB exfiltration via OneDrive sync undetected. DLP policy in audit-only mode. CASB does not monitor Microsoft 365 cloud sync volume anomalies.',
        ],
      },
      {
        id: 's3',
        title: 'MITRE ATT&CK Coverage Assessment',
        classification: 'CONFIDENTIAL',
        content: [
          'Techniques exercised: T1598.003 (Spearphishing for Info), T1566.001 (Spearphishing Attachment), T1059.001 (PowerShell), T1547.001 (Registry Run Keys), T1003.001 (LSASS Memory), T1550.002 (Pass-the-Hash), T1005 (Local Data Collection), T1567.002 (Exfil to Cloud Storage).',
          'Full detection coverage: 1 technique (T1003.001 — LSASS). Partial detection: 2 techniques. Zero coverage: 5 techniques.',
          'Highest-priority coverage gaps: T1567.002 (Exfiltration), T1550.002 (Pass-the-Hash), T1566.001 (Email-borne payload delivery).',
        ],
      },
    ],
    findings: [
      {
        id: 'f1',
        finding:
          'Cloud exfiltration undetected — DLP in audit-only mode, CASB gap on OneDrive volume anomalies',
        severity: 'critical',
        recommendation:
          'Enable DLP blocking policy for >500MB uploads to non-approved cloud storage. Deploy CASB for Microsoft 365 with anomaly detection.',
      },
      {
        id: 'f2',
        finding:
          'Pass-the-Hash lateral movement uncontrolled — SMB signing not enforced enterprise-wide',
        severity: 'critical',
        recommendation:
          'Enforce SMB signing via GPO RequireSecuritySignature=1. Implement LAPS to prevent credential reuse.',
      },
      {
        id: 'f3',
        finding: 'Email gateway allows PDF with JavaScript — partial spearphishing protection',
        severity: 'high',
        recommendation:
          'Enable Microsoft Defender Safe Attachments in block mode for all file types with active content capability.',
      },
      {
        id: 'f4',
        finding: 'LSASS detection has 11-minute analyst review delay — no automated containment',
        severity: 'high',
        recommendation:
          'Configure CrowdStrike to automatically isolate host on LSASS process access alerts with confidence >90.',
      },
    ],
  },
  'sentinel-findings': {
    title: 'SENTINEL Insider Threat Intelligence Report',
    subtitle: 'Behavioral Analytics: High-Risk Identities Q2 FY2025',
    summary:
      'This SENTINEL behavioral analytics assessment documents anomalous identity activity detected across monitored user populations during the Q2 FY2025 assessment period. Two users have been classified as active insider threat investigations based on behavioral deviation patterns, data access anomalies, and exfiltration indicators.',
    stats: [
      { label: 'Monitored Users', value: '5 active identities', color: SENTINEL_ACCENT },
      { label: 'Critical Risk Users', value: '1 (M. Rodriguez)', color: '#f5f5f5' },
      { label: 'High Risk Users', value: '1 (K. Tanaka)', color: '#c9b787' },
      { label: 'Anomalies Detected', value: '6 behavioral events', color: '#c9b787' },
      { label: 'Data Exfiltration Risk', value: '12.4GB confirmed', color: '#f5f5f5' },
      { label: 'Assessment Period', value: 'April 1–15, 2025', color: SENTINEL_ACCENT },
    ],
    sections: [
      {
        id: 's1',
        title: 'High-Priority Investigation: M. Rodriguez (VP Finance)',
        classification: 'CONFIDENTIAL // PERSONNEL',
        severity: 'critical',
        content: [
          'SENTINEL behavioral engine has assigned M. Rodriguez a risk score of 94/100 — classified as CRITICAL. This determination is based on 4 correlated anomaly events: bulk data access (264 documents, 3.1× baseline), personal cloud upload (12.4GB via OneDrive), persistent off-hours access pattern (17 of 30 days), and new unregistered device sign-in.',
          'Data access pattern analysis indicates deliberate and systematic collection of high-value intellectual property including M&A pipeline documents, strategic financial projections, customer pricing agreements, and product roadmaps.',
          "Exfiltration indicator: 12.4GB transferred to personal OneDrive account labeled 'personal photos' — DLP flagged but did not block due to policy configuration. CASB analysis confirms filenames inconsistent with personal content.",
          'Behavioral correlation: SENTINEL cross-referenced calendar data with LinkedIn connections. Analyst detected 3 calendar meetings with executives at identified competitor organization within 30-day anomaly window.',
        ],
      },
      {
        id: 's2',
        title: 'Elevated Risk: K. Tanaka (Senior DevOps Engineer)',
        classification: 'CONFIDENTIAL',
        severity: 'high',
        content: [
          'SENTINEL has assigned K. Tanaka a risk score of 76/100 — classified as HIGH. Three correlated anomalies: production database root access outside change window, VPN connection from Romania (geo-anomaly score 98/100), SSH lateral access to 8 hosts outside normal baseline.',
          'Saturday 03:44 UTC root access on PROD-DB-03 was not associated with any change management ticket. Access included queries against the customer_data table. This activity requires immediate investigation.',
          'Geographic anomaly: VPN connection from Bucharest, Romania is a 9,000-mile deviation from baseline home geo (San Francisco, CA). Device fingerprint matches registered laptop — credential compromise or physical device transport scenario should both be assessed.',
        ],
      },
    ],
    findings: [
      {
        id: 'f1',
        finding:
          'M. Rodriguez — 12.4GB data exfiltration via personal cloud storage (confirmed DLP event)',
        severity: 'critical',
        recommendation:
          'Immediately escalate to Legal and HR for covert forensic investigation. Revoke access to M&A and Strategy SharePoint libraries pending review. Preserve forensic evidence chain.',
      },
      {
        id: 'f2',
        finding:
          'K. Tanaka — Production database root access outside change window from anomalous geographic origin',
        severity: 'high',
        recommendation:
          'Freeze K. Tanaka production access pending review. Force password reset. Audit all PROD-DB-03 queries from Saturday session. Escalate to IT security and CISO.',
      },
      {
        id: 'f3',
        finding: 'DLP policy in alert-only mode — exfiltration not blocked at point of transfer',
        severity: 'high',
        recommendation:
          'Switch DLP policy from audit to block for cloud sync >500MB to personal OneDrive/Google Drive destinations.',
      },
    ],
  },
  'purple-team': {
    title: 'Purple Team Exercise — After Action Report',
    subtitle: 'APT29 Campaign Simulation: Red vs. Blue Team Assessment',
    summary:
      'This Purple Team Exercise After Action Report documents the results of a coordinated red team / blue team exercise conducted against production-representative infrastructure. The exercise simulated a full APT29-profile intrusion campaign across 7 attack stages, with simultaneous blue team response and real-time gap analysis.',
    stats: [
      { label: 'Exercise Duration', value: '7 attack phases', color: '#c9b787' },
      { label: 'Red Team Successes', value: '5 of 7 stages', color: '#f5f5f5' },
      { label: 'Blue Team Defenses', value: '2 full blocks', color: '#c9b787' },
      { label: 'Partial Detections', value: '4 events', color: '#c9b787' },
      { label: 'Coverage Gaps Found', value: '5 critical findings', color: '#f5f5f5' },
      { label: 'Detection Rate', value: '28.5% (baseline)', color: '#f5f5f5' },
    ],
    sections: [
      {
        id: 's1',
        title: 'Overall Assessment',
        classification: 'CONFIDENTIAL // SEC CLEARANCE',
        content: [
          "The Purple Team Exercise reveals the organization's defensive posture is insufficient against a sophisticated nation-state threat actor. Red team achieved 5 of 7 simulated objectives including credential theft, lateral movement, data collection, and exfiltration — all without triggering automated containment.",
          'Blue team successfully blocked the final ransomware deployment via EDR behavioral detection (CrowdStrike Falcon) — demonstrating effective endpoint protection as a last line of defense. However, earlier kill chain stages consistently evaded detection.',
          'Primary defensive gap: the absence of Credential Guard, SMB signing enforcement, and active DLP blocking creates a permissive environment for credential-based attacks and data exfiltration.',
        ],
      },
      {
        id: 's2',
        title: 'Red Team Achievements',
        classification: 'CONFIDENTIAL',
        severity: 'critical',
        content: [
          'Initial access achieved via spearphishing (1 of 3 emails delivered). Email gateway partial mitigation: needs Safe Attachments block mode.',
          'Persistence established via registry run key — Sysmon logged event but no alert threshold triggered.',
          'Credential theft succeeded: LSASS dump extracted domain admin credentials. Credential Guard not deployed.',
          'Lateral movement achieved via Pass-the-Hash across 7 servers including DC-PROD-02. SMB signing not enforced.',
          'Data exfiltration: 18.4GB via OneDrive — DLP alert-only mode failed to block. Ransomware: BLOCKED by CrowdStrike Falcon.',
        ],
      },
    ],
    findings: [
      {
        id: 'f1',
        finding:
          'Credential Guard not deployed — enables LSASS credential extraction on all endpoints',
        severity: 'critical',
        recommendation:
          'Deploy Credential Guard via Group Policy to all Windows 10/11 and Server 2016+ systems. Estimated deployment: 2 weeks.',
      },
      {
        id: 'f2',
        finding: 'SMB signing not enforced — enables Pass-the-Hash lateral movement across domain',
        severity: 'critical',
        recommendation:
          'Enable SMB signing via GPO RequireSecuritySignature. Test compatibility with legacy systems. Deploy within 30 days.',
      },
      {
        id: 'f3',
        finding: 'DLP in alert-only mode — cloud exfiltration not blocked',
        severity: 'high',
        recommendation:
          'Switch DLP from audit to active block for cloud storage destinations >500MB.',
      },
      {
        id: 'f4',
        finding: 'Email gateway delivered 1 of 3 spearphishing payloads — partial protection only',
        severity: 'high',
        recommendation:
          'Enable Safe Attachments in block mode for all file types with macro/script capability.',
      },
      {
        id: 'f5',
        finding: 'Sysmon registry alerts not threshold-tuned — persistence mechanism undetected',
        severity: 'medium',
        recommendation:
          'Review Sysmon EventID 13 (registry modification) alert thresholds. Add detection rule for HKCU Run key modifications.',
      },
    ],
  },
  'executive-summary': {
    title: 'Executive Intelligence Summary — Q2 FY2025',
    subtitle: 'Consolidated PHANTOM & SENTINEL Security Posture Assessment',
    summary:
      'This Executive Intelligence Summary consolidates findings from PHANTOM adversary simulation exercises, SENTINEL insider threat behavioral analytics, and purple team exercises conducted in Q2 FY2025. The assessment is prepared for Board of Directors and C-suite review and represents the most current picture of organizational security posture against advanced threats.',
    stats: [
      { label: 'Overall Risk Rating', value: 'ELEVATED', color: '#c9b787' },
      { label: 'Critical Findings', value: '6 unresolved', color: '#f5f5f5' },
      { label: 'Financial Exposure', value: '$47.2M (APT sim)', color: '#f5f5f5' },
      { label: 'Insider Threat Cases', value: '2 active investigations', color: '#c9b787' },
      {
        label: 'Detection Rate (Nation-State)',
        value: '37.5% — below 85% target',
        color: '#f5f5f5',
      },
      { label: 'Simulation Exercises', value: '3 completed Q2', color: PHANTOM_ACCENT },
    ],
    sections: [
      {
        id: 's1',
        title: 'Board-Level Risk Summary',
        classification: 'CONFIDENTIAL // BOARD ONLY',
        content: [
          'Three materially significant security events require Board awareness and governance action in Q2 FY2025:',
          '1. ADVERSARY SIMULATION: PHANTOM simulation of nation-state APT campaign reveals 37.5% detection rate — well below 85% target. An actual APT29 campaign would likely result in 89+ day dwell time and $47.2M financial exposure before detection.',
          '2. INSIDER THREAT: SENTINEL behavioral analytics has identified one critical-risk insider threat case (VP Finance, M. Rodriguez) actively under forensic investigation. Potential IP and M&A data exposure. Legal and HR escalation initiated.',
          '3. THIRD-PARTY RISK: 5 material security control deficiencies identified in purple team exercise — Credential Guard, SMB signing, and DLP active blocking require immediate remediation investment.',
        ],
      },
      {
        id: 's2',
        title: 'Financial Exposure Summary',
        classification: 'CONFIDENTIAL // BOARD ONLY',
        severity: 'critical',
        content: [
          'Aggregate financial exposure from simulated threat scenarios: $47.2M (nation-state), $22.8M (ransomware), $8.4M (insider theft) — total $78.4M unmitigated exposure across assessed threat profiles.',
          'Remediation investment required to close critical control gaps: estimated $2.1M (Credential Guard deployment, SMB signing enforcement, DLP upgrade, CASB deployment). ROI: $76.3M risk reduction for $2.1M investment.',
          'Cyber insurance gap analysis: current $10M policy provides partial coverage. Aggregate simulated exposure of $78.4M exceeds policy limit by $68.4M. Board should review insurance adequacy.',
        ],
      },
    ],
    findings: [
      {
        id: 'f1',
        finding: 'Nation-state detection rate 37.5% — critical gap vs. 85% organizational target',
        severity: 'critical',
        recommendation:
          'Approve $2.1M security controls remediation budget. Priority: Credential Guard, DLP active blocking, CASB deployment.',
      },
      {
        id: 'f2',
        finding: 'Active insider threat investigation — VP Finance data exfiltration risk',
        severity: 'critical',
        recommendation:
          'Board risk committee to be briefed. Ensure legal privilege protection over investigation. Forensic evidence chain verified.',
      },
      {
        id: 'f3',
        finding:
          'Cyber insurance coverage insufficient vs. simulated exposure ($10M policy vs. $78.4M exposure)',
        severity: 'high',
        recommendation:
          'Engage insurance broker to review cyber policy adequacy. Target $25-50M coverage increase.',
      },
    ],
  },
};

function ClassificationBanner({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="text-center py-1.5 text-[9px] font-bold tracking-widest uppercase font-mono"
      style={{ background: `${color}15`, color, borderBottom: `1px solid ${color}20` }}
    >
      ██ {text} ██
    </div>
  );
}

const SEV_COLORS: Record<string, string> = {
  critical: '#f5f5f5',
  high: '#c9b787',
  medium: '#c9b787',
};

export default function ThreatSimReport() {
  const [selectedType, setSelectedType] = useState<ReportType>('phantom-campaign');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportDate] = useState(() =>
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  );
  const reportRef = useRef<HTMLDivElement>(null);

  const config = REPORT_CONFIGS[selectedType];
  const report = REPORT_CONTENT[selectedType];
  const ConfigIcon = config.icon;

  function exportPDF() {
    const win = window.open('', '_blank', 'width=900,height=720');
    if (!win) return;

    const SEV: Record<string, string> = { critical: '#f5f5f5', high: '#c9b787', medium: '#c9b787' };
    const accent = config.color;
    const reportDate = new Date().toISOString().slice(0, 10);

    const bannerHtml = `<div style="background:${accent};color:#fff;text-align:center;padding:6px 0;font-size:9px;font-weight:800;letter-spacing:4px;font-family:'Courier New',monospace;">${config.classification}</div>`;

    const statsHtml = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">${report.stats
      .map(
        (s) =>
          `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 10px;">
        <div style="font-size:11px;font-weight:bold;font-family:'Courier New',monospace;color:${s.color};">${s.value}</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.4);margin-top:2px;">${s.label}</div>
      </div>`,
      )
      .join('')}</div>`;

    const sectionsHtml = report.sections
      .map(
        (section) =>
          `<div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:8px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#fff;">${section.title}</span>
          <span style="font-size:7px;font-family:'Courier New',monospace;padding:2px 5px;border-radius:3px;background:${accent}15;color:${accent};">${section.classification}</span>
          ${section.severity ? `<span style="font-size:7px;padding:2px 5px;border-radius:3px;font-weight:bold;background:${SEV[section.severity]}15;color:${SEV[section.severity]};">${section.severity.toUpperCase()}</span>` : ''}
        </div>
        <div style="padding-left:10px;border-left:2px solid ${accent}20;">
          ${section.content.map((para) => `<p style="font-size:10px;line-height:1.6;margin:0 0 5px;color:rgba(255,255,255,0.65);">${para}</p>`).join('')}
        </div>
      </div>`,
      )
      .join('');

    const findingsHtml = `<div style="margin-bottom:16px;">
      <div style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#fff;margin-bottom:10px;">Findings &amp; Recommendations</div>
      ${report.findings
        .map(
          (f) =>
            `<div style="border-radius:7px;padding:10px 12px;margin-bottom:8px;border:1px solid ${SEV[f.severity]}20;background:${SEV[f.severity]}04;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:7px;padding:2px 5px;border-radius:3px;font-weight:bold;background:${SEV[f.severity]}15;color:${SEV[f.severity]};">${f.severity.toUpperCase()}</span>
            <span style="font-size:9px;font-weight:600;color:#fff;">${f.finding}</span>
          </div>
          <p style="font-size:8px;color:rgba(255,255,255,0.55);margin:0;line-height:1.5;padding-left:12px;">&#10003; ${f.recommendation}</p>
        </div>`,
        )
        .join('')}
    </div>`;

    const footerHtml = `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:8px;font-family:'Courier New',monospace;">
      <span style="color:rgba(255,255,255,0.3);">GENERATED BY PHANTOM/SENTINEL PARAGON ENGINE · ${reportDate}</span>
      <span style="color:${accent};font-weight:bold;">${config.classification}</span>
    </div>`;

    const body = `
      ${bannerHtml}
      <div style="padding:20px 24px;background:#060810;">
        <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid ${accent}20;">
          <div style="font-size:8px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:3px;">${config.code} · ${reportDate}</div>
          <div style="font-size:8px;font-family:'Courier New',monospace;color:rgba(255,255,255,0.35);margin-bottom:6px;">Prepared by: PHANTOM/SENTINEL Engine · PARAGON Defense Platform</div>
          <h2 style="font-size:14px;font-weight:bold;color:#fff;margin:0 0 3px;">${report.title}</h2>
          <div style="font-size:11px;color:${accent};">${report.subtitle}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid ${accent}15;border-radius:8px;padding:12px;margin-bottom:16px;">
          <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:3px;color:${accent};font-family:'Courier New',monospace;margin-bottom:6px;">EXECUTIVE SUMMARY</div>
          <p style="font-size:11px;line-height:1.6;color:rgba(255,255,255,0.75);margin:0;">${report.summary}</p>
        </div>
        ${statsHtml}
        ${sectionsHtml}
        ${findingsHtml}
        ${footerHtml}
      </div>
      ${bannerHtml}`;

    win.document.write(
      `<!DOCTYPE html><html><head><title>${report.title}</title><style>*{box-sizing:border-box;font-family:'Courier New',monospace;}body{background:#060810;color:rgba(255,255,255,0.85);margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{size:A4;margin:10mm 14mm;}</style></head><body>${body}</body></html>`,
    );
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  }

  function generate() {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2200);
  }

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
              PHANTOM / SENTINEL · Report Generator
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Threat Simulation Report Generator</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            Export classified-style intelligence assessments from PHANTOM simulations and SENTINEL
            behavioral findings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(
          Object.entries(REPORT_CONFIGS) as [ReportType, (typeof REPORT_CONFIGS)[ReportType]][]
        ).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setGenerated(false);
              }}
              className="text-left p-3 rounded-xl border transition-all"
              style={{
                borderColor: selectedType === type ? `${cfg.color}40` : DS.border,
                background: selectedType === type ? `${cfg.color}08` : DS.surface,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${cfg.color}15` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="text-[10px] font-bold text-white">{cfg.label}</div>
              <div className="text-[8px] mt-1 font-mono" style={{ color: cfg.color }}>
                {cfg.code}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-4 rounded-xl border p-4 space-y-4"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: DS.text.muted }}
          >
            Report Configuration
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Report Type
              </div>
              <div className="text-[11px] font-semibold text-white">{config.label}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Report Code
              </div>
              <div className="text-[11px] font-mono" style={{ color: config.color }}>
                {config.code}
              </div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Classification
              </div>
              <div className="text-[10px] font-bold font-mono" style={{ color: config.color }}>
                {config.classification}
              </div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Report Date
              </div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {reportDate}
              </div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Sections
              </div>
              <div className="text-[11px]">{report.sections.length} classified sections</div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                Findings
              </div>
              <div className="text-[11px]">{report.findings.length} findings with remediation</div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: `${config.color}20`,
              color: config.color,
              border: `1px solid ${config.color}35`,
            }}
          >
            {generating ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> Generate Report
              </>
            )}
          </button>

          {generated && (
            <button
              onClick={exportPDF}
              className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{
                background: `${config.color}18`,
                color: config.color,
                border: `1px solid ${config.color}30`,
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export PDF Brief
            </button>
          )}
        </div>

        <div className="col-span-8">
          {!generated && !generating && (
            <div
              className="h-full flex items-center justify-center rounded-xl border"
              style={{ borderColor: DS.border, background: DS.surface, minHeight: 400 }}
            >
              <div className="text-center">
                <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: DS.text.muted }} />
                <p className="text-[11px]" style={{ color: DS.text.muted }}>
                  Configure report parameters and click Generate
                </p>
                <p className="text-[10px] mt-1" style={{ color: DS.text.muted }}>
                  Classified intelligence assessment format
                </p>
              </div>
            </div>
          )}

          {generating && (
            <div
              className="h-full flex items-center justify-center rounded-xl border"
              style={{
                borderColor: `${config.color}20`,
                background: `${config.color}04`,
                minHeight: 400,
              }}
            >
              <div className="text-center space-y-3">
                <Cpu className="w-8 h-8 mx-auto animate-spin" style={{ color: config.color }} />
                <p className="text-[12px] font-mono" style={{ color: config.color }}>
                  Compiling intelligence assessment…
                </p>
                <div className="space-y-1 text-left max-w-xs mx-auto">
                  {[
                    'Loading PHANTOM campaign results…',
                    'Querying SENTINEL behavioral data…',
                    'Applying classification markings…',
                    'Generating executive findings…',
                    'Formatting classified brief…',
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[9px] font-mono"
                      style={{ color: DS.text.muted }}
                    >
                      <CheckCircle
                        className="w-2.5 h-2.5 shrink-0"
                        style={{ color: config.color }}
                      />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {generated && (
            <div
              ref={reportRef}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: `${config.color}30` }}
            >
              <ClassificationBanner text={config.classification} color={config.color} />

              <div className="p-5 space-y-5" style={{ background: '#060810' }}>
                <div className="border-b pb-4" style={{ borderColor: `${config.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}20` }}
                    >
                      <ConfigIcon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div
                        className="text-[8px] font-mono uppercase tracking-widest"
                        style={{ color: config.color }}
                      >
                        {config.code} · {reportDate}
                      </div>
                      <div className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                        Prepared by: PHANTOM/SENTINEL Engine · PARAGON Defense Platform
                      </div>
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-white">{report.title}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: config.color }}>
                    {report.subtitle}
                  </p>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${config.color}15`,
                  }}
                >
                  <div
                    className="text-[8px] uppercase tracking-widest mb-2 font-mono font-bold"
                    style={{ color: config.color }}
                  >
                    EXECUTIVE SUMMARY
                  </div>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {report.summary}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {report.stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg p-2.5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-[10px] font-bold font-mono" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {report.sections.map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-white">
                        {section.title}
                      </div>
                      <span
                        className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${config.color}15`, color: config.color }}
                      >
                        {section.classification}
                      </span>
                      {section.severity && (
                        <span
                          className="text-[7px] px-1.5 py-0.5 rounded font-bold"
                          style={{
                            background: `${SEV_COLORS[section.severity]}15`,
                            color: SEV_COLORS[section.severity],
                          }}
                        >
                          {section.severity.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div
                      className="space-y-2 pl-2 border-l-2"
                      style={{ borderColor: `${config.color}20` }}
                    >
                      {section.content.map((para, i) => (
                        <p
                          key={i}
                          className="text-[10px] leading-relaxed"
                          style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-3 text-white">
                    Findings & Recommendations
                  </div>
                  <div className="space-y-2.5">
                    {report.findings.map((f) => (
                      <div
                        key={f.id}
                        className="rounded-xl p-3 border"
                        style={{
                          borderColor: `${SEV_COLORS[f.severity]}20`,
                          background: `${SEV_COLORS[f.severity]}04`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                            style={{
                              background: `${SEV_COLORS[f.severity]}15`,
                              color: SEV_COLORS[f.severity],
                            }}
                          >
                            {f.severity.toUpperCase()}
                          </span>
                          <AlertTriangle
                            className="w-3 h-3"
                            style={{ color: SEV_COLORS[f.severity] }}
                          />
                          <span className="text-[10px] font-semibold text-white">{f.finding}</span>
                        </div>
                        <div className="flex items-start gap-1.5 pl-4">
                          <CheckCircle
                            className="w-2.5 h-2.5 mt-0.5 shrink-0"
                            style={{ color: '#6b8f71' }}
                          />
                          <p
                            className="text-[9px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.55)' }}
                          >
                            {f.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="border-t pt-3 flex items-center justify-between"
                  style={{ borderColor: `${config.color}15` }}
                >
                  <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                    GENERATED BY PHANTOM/SENTINEL PARAGON ENGINE · {reportDate}
                  </span>
                  <span className="text-[8px] font-mono font-bold" style={{ color: config.color }}>
                    {config.classification}
                  </span>
                </div>
              </div>

              <ClassificationBanner text={config.classification} color={config.color} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
