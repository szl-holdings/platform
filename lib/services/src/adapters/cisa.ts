import { ServiceAdapter } from "../base.js";

export interface CisaKevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
}

export interface MitreAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  platforms: string[];
  subtechnique: boolean;
  detection: string;
  mitigation: string;
}

const DEMO_CISA_KEV: CisaKevEntry[] = [
  { cveID: "CVE-2023-23397", vendorProject: "Microsoft", product: "Outlook", vulnerabilityName: "Microsoft Outlook Privilege Escalation Vulnerability", dateAdded: "2023-03-14", shortDescription: "Microsoft Outlook contains a privilege escalation vulnerability that allows for a NTLM Hash disclosure forced by opening a specially crafted email.", requiredAction: "Apply updates per vendor instructions.", dueDate: "2023-04-04", knownRansomwareCampaignUse: "Unknown", notes: "" },
  { cveID: "CVE-2021-44228", vendorProject: "Apache", product: "Log4j2", vulnerabilityName: "Apache Log4j2 Remote Code Execution Vulnerability", dateAdded: "2021-12-10", shortDescription: "Apache Log4j2 contains a remote code execution vulnerability. JNDI features used in configuration, log messages, or parameters do not protect against attacker-controlled LDAP and other endpoints.", requiredAction: "Apply updates per vendor instructions. Implement mitigations.", dueDate: "2021-12-24", knownRansomwareCampaignUse: "Known", notes: "Log4Shell" },
  { cveID: "CVE-2024-3400", vendorProject: "Palo Alto Networks", product: "PAN-OS", vulnerabilityName: "Palo Alto Networks PAN-OS Command Injection Vulnerability", dateAdded: "2024-04-12", shortDescription: "Palo Alto Networks PAN-OS contains a command injection vulnerability in the GlobalProtect feature.", requiredAction: "Apply mitigations per vendor instructions.", dueDate: "2024-04-19", knownRansomwareCampaignUse: "Unknown", notes: "Critical zero-day under active exploitation" },
];

export class CisaAdapter extends ServiceAdapter {
  readonly name = "cisa";
  readonly description = "CISA Known Exploited Vulnerabilities (KEV) and threat feeds — free public API, no key required";
  readonly requiredEnvVars: string[] = [];

  get supportsMockMode(): boolean { return true; }
  get status(): import("../base.js").ServiceStatus { return "LIVE_CONFIGURED"; }

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
      method: "HEAD",
      headers: { "User-Agent": "SZL-CISA/1.0" },
    });
    if (!res.ok) throw new Error(`CISA KEV returned ${res.status}`);
  }

  async getKnownExploitedVulnerabilities(limit = 20): Promise<CisaKevEntry[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
        signal: controller.signal,
        headers: { "User-Agent": "SZL-CISA/1.0", Accept: "application/json" },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`CISA HTTP ${res.status}`);
      const data = await res.json() as { vulnerabilities?: CisaKevEntry[] };
      if (!data.vulnerabilities || !Array.isArray(data.vulnerabilities)) throw new Error("No KEV data");
      return data.vulnerabilities.slice(-limit).reverse();
    } catch {
      return [...DEMO_CISA_KEV];
    }
  }

  async searchKev(query: string): Promise<CisaKevEntry[]> {
    const all = await this.getKnownExploitedVulnerabilities(100);
    const q = query.toLowerCase();
    return all.filter(v =>
      v.cveID.toLowerCase().includes(q) ||
      v.vendorProject.toLowerCase().includes(q) ||
      v.product.toLowerCase().includes(q) ||
      v.vulnerabilityName.toLowerCase().includes(q),
    );
  }

  async getHighPriorityKev(): Promise<CisaKevEntry[]> {
    const all = await this.getKnownExploitedVulnerabilities(50);
    return all.filter(v => v.knownRansomwareCampaignUse === "Known");
  }
}
