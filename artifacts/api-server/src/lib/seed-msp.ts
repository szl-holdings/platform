import { isSeedDataAllowed, getRuntimeMode } from "@szl-holdings/config";
import { db } from "@szl-holdings/db";
import {
  mspClientsTable,
  mspTechniciansTable,
  mspTicketsTable,
  mspDevicesTable,
  mspContractsTable,
} from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function seedMspData(): Promise<void> {
  if (!isSeedDataAllowed()) {
    const mode = getRuntimeMode();
    throw new Error(
      `[seed-msp] Attempted to seed MSP demo data in ${mode} mode. ` +
        `Seed data is only permitted in local-dev, internal-preview, and demo modes.`,
    );
  }
  const existing = await db.select({ c: sql<number>`count(*)::int` }).from(mspClientsTable);
  if (existing[0].c > 0) {
    logger.debug("[msp-seed] MSP data already seeded, skipping.");
    return;
  }

  logger.info("[msp-seed] Seeding MSP demo data...");

  const clients = await db.insert(mspClientsTable).values([
    { name: "Meridian Corp", industry: "Financial Services", status: "at-risk", healthScore: 62, deviceCount: 284, openTickets: 3, mrr: 14800, costToServe: 9200, churnRisk: 72, tickets30d: 14, contactName: "Tom Bradley", contactEmail: "tbradley@meridiancorp.com", city: "New York", state: "NY", slaTarget: 99, slaActual: 97, tags: ["enterprise", "financial"] },
    { name: "Atlas Industries", industry: "Manufacturing", status: "active", healthScore: 88, deviceCount: 198, openTickets: 1, mrr: 9400, costToServe: 5100, churnRisk: 18, tickets30d: 3, contactName: "Linda Wu", contactEmail: "lwu@atlasindustries.com", city: "Chicago", state: "IL", slaTarget: 99, slaActual: 99, tags: ["manufacturing"] },
    { name: "Vertex Labs", industry: "Technology", status: "active", healthScore: 95, deviceCount: 156, openTickets: 1, mrr: 7200, costToServe: 3800, churnRisk: 8, tickets30d: 2, contactName: "Sara Kim", contactEmail: "skim@vertexlabs.io", city: "Austin", state: "TX", slaTarget: 99, slaActual: 99, tags: ["tech", "startup"] },
    { name: "Pinnacle Health", industry: "Healthcare", status: "active", healthScore: 74, deviceCount: 312, openTickets: 2, mrr: 16200, costToServe: 10900, churnRisk: 41, tickets30d: 9, contactName: "Dr. Eric Mason", contactEmail: "emason@pinnaclehealth.org", city: "Boston", state: "MA", slaTarget: 99, slaActual: 98, tags: ["healthcare", "hipaa", "enterprise"] },
    { name: "NovaTech", industry: "Technology", status: "at-risk", healthScore: 41, deviceCount: 89, openTickets: 4, mrr: 5100, costToServe: 4800, churnRisk: 84, tickets30d: 21, contactName: "Jake Torres", contactEmail: "jtorres@novatech.com", city: "San Jose", state: "CA", slaTarget: 99, slaActual: 95, tags: ["tech", "high-risk"] },
    { name: "Solaris Energy", industry: "Energy", status: "active", healthScore: 98, deviceCount: 245, openTickets: 0, mrr: 11600, costToServe: 5800, churnRisk: 5, tickets30d: 1, contactName: "Maria Santos", contactEmail: "msantos@solarisenergy.com", city: "Houston", state: "TX", slaTarget: 99, slaActual: 99, tags: ["energy", "enterprise"] },
    { name: "Greenfield Education", industry: "Education", status: "active", healthScore: 85, deviceCount: 124, openTickets: 1, mrr: 4800, costToServe: 2900, churnRisk: 12, tickets30d: 4, contactName: "Principal Davis", contactEmail: "pdavis@greenfield.edu", city: "Denver", state: "CO", slaTarget: 99, slaActual: 98, tags: ["education"] },
    { name: "Horizon Logistics", industry: "Logistics", status: "active", healthScore: 79, deviceCount: 178, openTickets: 2, mrr: 8200, costToServe: 5200, churnRisk: 28, tickets30d: 7, contactName: "Frank Liu", contactEmail: "fliu@horizonlogistics.com", city: "Memphis", state: "TN", slaTarget: 99, slaActual: 97, tags: ["logistics"] },
    { name: "Quantum Analytics", industry: "Analytics", status: "active", healthScore: 91, deviceCount: 67, openTickets: 1, mrr: 6400, costToServe: 3200, churnRisk: 10, tickets30d: 2, contactName: "Dr. Patel", contactEmail: "rpatel@quantumalytics.com", city: "Seattle", state: "WA", slaTarget: 99, slaActual: 99, tags: ["analytics", "data"] },
    { name: "Harbor Legal", industry: "Legal", status: "active", healthScore: 83, deviceCount: 94, openTickets: 1, mrr: 5900, costToServe: 3400, churnRisk: 15, tickets30d: 3, contactName: "Jennifer Walsh", contactEmail: "jwalsh@harborlegal.com", city: "Philadelphia", state: "PA", slaTarget: 99, slaActual: 98, tags: ["legal", "compliance"] },
    { name: "Summit Healthcare", industry: "Healthcare", status: "active", healthScore: 77, deviceCount: 203, openTickets: 2, mrr: 9400, costToServe: 6100, churnRisk: 33, tickets30d: 8, contactName: "CEO Nguyen", contactEmail: "tnguyen@summithealthcare.org", city: "Nashville", state: "TN", slaTarget: 99, slaActual: 97, tags: ["healthcare", "hipaa"] },
    { name: "Coastal Properties", industry: "Real Estate", status: "active", healthScore: 68, deviceCount: 45, openTickets: 1, mrr: 3200, costToServe: 2100, churnRisk: 38, tickets30d: 5, contactName: "Bob Reyes", contactEmail: "breyes@coastalprops.com", city: "Miami", state: "FL", slaTarget: 99, slaActual: 96, tags: ["real-estate", "small-business"] },
  ]).returning();

  logger.info({ count: clients.length }, "[msp-seed] Clients inserted");

  const technicians = await db.insert(mspTechniciansTable).values([
    { name: "James Kirkpatrick", email: "jkirkpatrick@szl-msp.com", status: "on-site", specialties: ["Server", "Network", "Cloud"], currentJob: "Meridian Corp — Server Migration", location: "Downtown Financial District", eta: null, completedToday: 2, rating: "4.9", certifications: ["CCNA", "Azure Solutions Architect", "CompTIA Server+"] },
    { name: "Sarah Mitchell", email: "smitchell@szl-msp.com", status: "traveling", specialties: ["Endpoint", "Deployment", "MDM"], currentJob: "Vertex Labs — Workstation Setup", location: "En route — Tech Park", eta: "15 min", completedToday: 3, rating: "4.8", certifications: ["CompTIA A+", "JAMF Admin", "Intune"] },
    { name: "David Rodriguez", email: "drodriguez@szl-msp.com", status: "available", specialties: ["Security", "Compliance", "Firewall"], currentJob: null, location: "HQ — Ready for dispatch", eta: null, completedToday: 1, rating: "4.7", certifications: ["CISSP", "CompTIA Security+", "Palo Alto PCNSA"] },
    { name: "Lisa Chen", email: "lchen@szl-msp.com", status: "on-site", specialties: ["Network", "Wireless", "VoIP"], currentJob: "Horizon Logistics — Switch Replacement", location: "Industrial Park B", eta: null, completedToday: 2, rating: "4.9", certifications: ["CCNP", "Meraki ECMS", "CompTIA Network+"] },
    { name: "Mark Thompson", email: "mthompson@szl-msp.com", status: "off-duty", specialties: ["Server", "Backup", "Storage"], currentJob: null, location: "Off-duty", eta: null, completedToday: 4, rating: "4.6", certifications: ["VMware VCP", "Veeam VMCE", "CompTIA Server+"] },
    { name: "Priya Anand", email: "panand@szl-msp.com", status: "available", specialties: ["Cloud", "AWS", "Azure"], currentJob: null, location: "HQ — Ready for dispatch", eta: null, completedToday: 2, rating: "4.9", certifications: ["AWS Solutions Architect", "Azure Administrator", "GCP Associate"] },
    { name: "Carlos Mendez", email: "cmendez@szl-msp.com", status: "available", specialties: ["Endpoint", "Security", "SIEM"], currentJob: null, location: "HQ — Remote-capable", eta: null, completedToday: 1, rating: "4.7", certifications: ["CompTIA CySA+", "Microsoft Sentinel", "Splunk Core"] },
  ]).returning();

  logger.info({ count: technicians.length }, "[msp-seed] Technicians inserted");

  const clientMap = Object.fromEntries(clients.map(c => [c.name, c.id]));
  const techMap = Object.fromEntries(technicians.map(t => [t.name, t.id]));

  const now = new Date();
  const h = (hours: number) => new Date(now.getTime() + hours * 3600000);
  const ago = (hours: number) => new Date(now.getTime() - hours * 3600000);

  const tickets = [
    { ticketNumber: "TKT-5001", subject: "Email server migration - Phase 2", description: "Phase 2 of email migration from Exchange 2016 to Exchange Online. Mailboxes for finance dept pending.", clientId: clientMap["Meridian Corp"], clientName: "Meridian Corp", priority: "high" as const, status: "in-progress" as const, assigneeId: techMap["James Kirkpatrick"], assigneeName: "James Kirkpatrick", category: "Infrastructure", slaDeadline: h(2), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5002", subject: "VPN connectivity intermittent failures", description: "Multiple users reporting VPN drops. Cisco AnyConnect timeouts noted. Logs show IKE phase 2 errors.", clientId: clientMap["Atlas Industries"], clientName: "Atlas Industries", priority: "critical" as const, status: "open" as const, assigneeName: "Unassigned", category: "Network", slaDeadline: h(1), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5003", subject: "New workstation setup for 5 employees", description: "New hires onboarding. Need imaging, domain join, software installation per standard build.", clientId: clientMap["Vertex Labs"], clientName: "Vertex Labs", priority: "low" as const, status: "in-progress" as const, assigneeId: techMap["Sarah Mitchell"], assigneeName: "Sarah Mitchell", category: "Endpoint", slaDeadline: h(6), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5004", subject: "HIPAA compliance audit preparation", description: "Annual HIPAA audit. Need to review access logs, encryption status, and BAA documentation.", clientId: clientMap["Pinnacle Health"], clientName: "Pinnacle Health", priority: "high" as const, status: "in-progress" as const, assigneeId: techMap["David Rodriguez"], assigneeName: "David Rodriguez", category: "Compliance", slaDeadline: h(24), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5005", subject: "Ransomware alert investigation", description: "CrowdStrike Falcon detected suspicious process chain on WORKSTATION-NV-22. Isolation pending review.", clientId: clientMap["NovaTech"], clientName: "NovaTech", priority: "critical" as const, status: "in-progress" as const, assigneeId: techMap["James Kirkpatrick"], assigneeName: "James Kirkpatrick", category: "Security", slaDeadline: h(-0.5), slaStatus: "breached" as const, resolvedAt: null },
    { ticketNumber: "TKT-5006", subject: "Office 365 license renewal", description: "O365 Business Premium licenses expiring. Need to renew 45 seats and add 3 new.", clientId: clientMap["Greenfield Education"], clientName: "Greenfield Education", priority: "medium" as const, status: "waiting" as const, assigneeId: techMap["Sarah Mitchell"], assigneeName: "Sarah Mitchell", category: "Licensing", slaDeadline: h(48), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5007", subject: "Backup failure on primary NAS", description: "Veeam backup job failed with error E0078. NAS storage at 94% capacity. Immediate attention needed.", clientId: clientMap["Horizon Logistics"], clientName: "Horizon Logistics", priority: "high" as const, status: "open" as const, assigneeName: "Unassigned", category: "Backup", slaDeadline: h(4), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5008", subject: "Network switch replacement — Building C", description: "Cisco Catalyst 2960 switch failed. Temporary workaround in place. Replacement shipped.", clientId: clientMap["Meridian Corp"], clientName: "Meridian Corp", priority: "medium" as const, status: "resolved" as const, assigneeId: techMap["Lisa Chen"], assigneeName: "Lisa Chen", category: "Network", slaDeadline: h(-120), slaStatus: "on-track" as const, resolvedAt: ago(2) },
    { ticketNumber: "TKT-5009", subject: "Firewall rule audit & update", description: "Quarterly firewall review. Several outdated deny rules flagged. Palo Alto PA-3260 config review.", clientId: clientMap["Pinnacle Health"], clientName: "Pinnacle Health", priority: "high" as const, status: "open" as const, assigneeName: "Unassigned", category: "Security", slaDeadline: h(8), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5010", subject: "Server performance degradation", description: "SQL Server 2019 CPU pegged at 95% during business hours. Queries running 10x slower than baseline.", clientId: clientMap["Meridian Corp"], clientName: "Meridian Corp", priority: "high" as const, status: "in-progress" as const, assigneeId: techMap["James Kirkpatrick"], assigneeName: "James Kirkpatrick", category: "Server", slaDeadline: h(3), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5011", subject: "Wi-Fi dead zones reported in office", description: "3 meeting rooms and west wing reporting no Wi-Fi. Meraki MR46 AP likely failed.", clientId: clientMap["Atlas Industries"], clientName: "Atlas Industries", priority: "medium" as const, status: "open" as const, assigneeName: "Unassigned", category: "Network", slaDeadline: h(8), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5012", subject: "Active Directory sync errors", description: "Azure AD Connect sync failing with error 8344. Users unable to login to cloud apps.", clientId: clientMap["NovaTech"], clientName: "NovaTech", priority: "critical" as const, status: "open" as const, assigneeName: "Unassigned", category: "Identity", slaDeadline: h(1), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5013", subject: "SSL certificate expiring in 7 days", description: "Wildcard cert for *.pinnaclehealth.org expires in 7 days. Renewal with DigiCert pending.", clientId: clientMap["Pinnacle Health"], clientName: "Pinnacle Health", priority: "medium" as const, status: "waiting" as const, assigneeId: techMap["David Rodriguez"], assigneeName: "David Rodriguez", category: "Security", slaDeadline: h(72), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5014", subject: "Printer offline — accounting department", description: "HP LaserJet Pro M404dn showing offline. Paper jam cleared but still not responding.", clientId: clientMap["Harbor Legal"], clientName: "Harbor Legal", priority: "low" as const, status: "open" as const, assigneeName: "Unassigned", category: "Hardware", slaDeadline: h(24), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5015", subject: "DDoS attack detected — mitigation active", description: "400Gbps volumetric DDoS attack detected. Cloudflare Magic Transit engaged. Traffic scrubbing active.", clientId: clientMap["NovaTech"], clientName: "NovaTech", priority: "critical" as const, status: "in-progress" as const, assigneeId: techMap["David Rodriguez"], assigneeName: "David Rodriguez", category: "Security", slaDeadline: h(-1), slaStatus: "breached" as const, resolvedAt: null },
    { ticketNumber: "TKT-5016", subject: "Cloud migration planning — Azure", description: "Initial assessment for migrating on-prem infrastructure to Azure. Scope: 14 VMs, 3TB data.", clientId: clientMap["Solaris Energy"], clientName: "Solaris Energy", priority: "medium" as const, status: "waiting" as const, assigneeId: techMap["Priya Anand"], assigneeName: "Priya Anand", category: "Cloud", slaDeadline: h(120), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5017", subject: "Spam filter tuning — high false positive rate", description: "Microsoft Defender for O365 blocking legitimate vendor emails. 23 false positives reported this week.", clientId: clientMap["Greenfield Education"], clientName: "Greenfield Education", priority: "medium" as const, status: "in-progress" as const, assigneeId: techMap["Carlos Mendez"], assigneeName: "Carlos Mendez", category: "Email", slaDeadline: h(8), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5018", subject: "New employee IT onboarding x3", description: "3 new hires start Monday. Need laptops imaged, accounts created, software installed, and orientation.", clientId: clientMap["Quantum Analytics"], clientName: "Quantum Analytics", priority: "low" as const, status: "open" as const, assigneeName: "Unassigned", category: "Endpoint", slaDeadline: h(48), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5019", subject: "Storage array critical alert", description: "NetApp FAS8300 reporting disk failure in shelf 2. RAID reconstruction at 34%.", clientId: clientMap["Horizon Logistics"], clientName: "Horizon Logistics", priority: "critical" as const, status: "in-progress" as const, assigneeId: techMap["Mark Thompson"], assigneeName: "Mark Thompson", category: "Storage", slaDeadline: h(2), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5020", subject: "VoIP quality degradation", description: "MOS scores dropping to 2.1 on multiple extensions. QoS policy on Cisco router may have been changed.", clientId: clientMap["Horizon Logistics"], clientName: "Horizon Logistics", priority: "high" as const, status: "open" as const, assigneeName: "Unassigned", category: "VoIP", slaDeadline: h(4), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5021", subject: "SIEM alert — brute force attempt", description: "Splunk detected 847 failed login attempts from 203.0.113.45 over 2 hours targeting RDP.", clientId: clientMap["Summit Healthcare"], clientName: "Summit Healthcare", priority: "critical" as const, status: "open" as const, assigneeId: techMap["Carlos Mendez"], assigneeName: "Carlos Mendez", category: "Security", slaDeadline: h(1), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5022", subject: "EHR system slowness", description: "Epic EHR response times degraded. Users reporting 15-30 second load times vs normal 3 seconds.", clientId: clientMap["Summit Healthcare"], clientName: "Summit Healthcare", priority: "high" as const, status: "in-progress" as const, assigneeId: techMap["James Kirkpatrick"], assigneeName: "James Kirkpatrick", category: "Application", slaDeadline: h(3), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5023", subject: "Patch management monthly cycle", description: "Monthly patching window for 198 endpoints. Windows Server 2022 KB5034129 and security rollup.", clientId: clientMap["Atlas Industries"], clientName: "Atlas Industries", priority: "medium" as const, status: "resolved" as const, assigneeId: techMap["Mark Thompson"], assigneeName: "Mark Thompson", category: "Patch", slaDeadline: h(-48), slaStatus: "on-track" as const, resolvedAt: ago(4) },
    { ticketNumber: "TKT-5024", subject: "Business continuity test — DR failover", description: "Annual DR test. Failover to Azure Site Recovery. RTO target: 4 hours, RPO: 1 hour.", clientId: clientMap["Meridian Corp"], clientName: "Meridian Corp", priority: "high" as const, status: "waiting" as const, assigneeId: techMap["Priya Anand"], assigneeName: "Priya Anand", category: "Disaster Recovery", slaDeadline: h(72), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5025", subject: "Multi-factor authentication rollout", description: "MFA rollout for all 89 users. Microsoft Authenticator deployment via Intune conditional access.", clientId: clientMap["NovaTech"], clientName: "NovaTech", priority: "high" as const, status: "in-progress" as const, assigneeId: techMap["Carlos Mendez"], assigneeName: "Carlos Mendez", category: "Identity", slaDeadline: h(24), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5026", subject: "Conference room AV system upgrade", description: "Replacing legacy Polycom with Microsoft Teams Rooms. 4 rooms total, 2 completed.", clientId: clientMap["Quantum Analytics"], clientName: "Quantum Analytics", priority: "low" as const, status: "in-progress" as const, assigneeId: techMap["Sarah Mitchell"], assigneeName: "Sarah Mitchell", category: "AV", slaDeadline: h(48), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5027", subject: "Managed antivirus alert — trojan detected", description: "Malwarebytes flagged Win32.Emotet on COASTAL-PC-07. Quarantine applied. Full scan initiated.", clientId: clientMap["Coastal Properties"], clientName: "Coastal Properties", priority: "critical" as const, status: "open" as const, assigneeName: "Unassigned", category: "Security", slaDeadline: h(1), slaStatus: "at-risk" as const, resolvedAt: null },
    { ticketNumber: "TKT-5028", subject: "Network documentation update", description: "Post-switch replacement, network diagrams need updating. Visio files and IP schema need refreshing.", clientId: clientMap["Harbor Legal"], clientName: "Harbor Legal", priority: "low" as const, status: "open" as const, assigneeName: "Unassigned", category: "Documentation", slaDeadline: h(72), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5029", subject: "Exchange calendar sync issues", description: "Outlook calendar not syncing with mobile devices for 6 users. Exchange Autodiscover misconfigured.", clientId: clientMap["Greenfield Education"], clientName: "Greenfield Education", priority: "medium" as const, status: "open" as const, assigneeName: "Unassigned", category: "Email", slaDeadline: h(8), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5030", subject: "UPS battery replacement", description: "APC Smart-UPS 3000 self-test failed. Battery age 4.5 years. Replacement required before storm season.", clientId: clientMap["Atlas Industries"], clientName: "Atlas Industries", priority: "low" as const, status: "open" as const, assigneeName: "Unassigned", category: "Hardware", slaDeadline: h(96), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5031", subject: "Zero trust network access pilot", description: "Piloting Zscaler ZPA to replace VPN for 25 users. Configuration and testing phase.", clientId: clientMap["Solaris Energy"], clientName: "Solaris Energy", priority: "medium" as const, status: "in-progress" as const, assigneeId: techMap["Priya Anand"], assigneeName: "Priya Anand", category: "Network", slaDeadline: h(48), slaStatus: "on-track" as const, resolvedAt: null },
    { ticketNumber: "TKT-5032", subject: "Disk encryption compliance audit", description: "BitLocker compliance check across all 94 endpoints. 7 machines found unencrypted.", clientId: clientMap["Harbor Legal"], clientName: "Harbor Legal", priority: "high" as const, status: "resolved" as const, assigneeId: techMap["Carlos Mendez"], assigneeName: "Carlos Mendez", category: "Compliance", slaDeadline: h(-24), slaStatus: "on-track" as const, resolvedAt: ago(6) },
  ];

  await db.insert(mspTicketsTable).values(tickets);
  logger.info({ count: tickets.length }, "[msp-seed] Tickets inserted");

  const deviceTypes = ["server", "workstation", "workstation", "workstation", "network", "firewall", "printer"] as const;
  const osOptions: Record<string, string[]> = {
    server: ["Windows Server 2022", "Windows Server 2019", "Ubuntu 22.04 LTS", "Red Hat Enterprise Linux 9"],
    workstation: ["Windows 11 Pro", "Windows 10 Pro", "macOS 14 Sonoma", "Ubuntu 22.04"],
    network: ["Cisco IOS 17.x", "Juniper JunOS 22.x", "Cisco NX-OS", "Meraki MX"],
    firewall: ["Palo Alto PAN-OS 11", "Fortinet FortiOS 7.4", "Check Point R81.20", "pfSense 2.7"],
    printer: ["HP Firmware", "Brother Firmware", "Canon Firmware"],
  };

  const deviceData = [];
  let devNum = 100;

  for (const client of clients) {
    const count = Math.floor((client.deviceCount ?? 0) / 15) + 3;
    for (let j = 0; j < count; j++) {
      const type = deviceTypes[j % deviceTypes.length];
      const statusRoll = Math.random();
      const status = statusRoll < 0.75 ? "online" : statusRoll < 0.88 ? "warning" : statusRoll < 0.95 ? "critical" : "offline";
      const osArr = osOptions[type] || ["Windows 11 Pro"];
      const os = osArr[Math.floor(Math.random() * osArr.length)];
      const prefix = type === "server" ? "SRV" : type === "workstation" ? "WS" : type === "network" ? "SW" : type === "firewall" ? "FW" : "PR";
      const num = devNum++;
      const cpu = Math.round(20 + Math.random() * 60);
      const memory = Math.round(30 + Math.random() * 55);
      const disk = Math.round(25 + Math.random() * 65);

      deviceData.push({
        deviceId: `DEV-${String(num).padStart(4, "0")}`,
        hostname: `${prefix}-${client.name.replace(/\s/g, "").toUpperCase().slice(0, 6)}-${String(num).padStart(3, "0")}`,
        clientId: client.id,
        clientName: client.name,
        type,
        os,
        ipAddress: `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        site: `${client.city || "HQ"} - Main`,
        status,
        cpu: status === "offline" ? 0 : cpu,
        memory: status === "offline" ? 0 : memory,
        disk: status === "offline" ? 0 : disk,
        alerts: status === "critical" ? Math.floor(Math.random() * 3) + 1 : status === "warning" ? (Math.random() > 0.5 ? 1 : 0) : 0,
        patchesPending: Math.floor(Math.random() * 12),
        threats: status === "critical" && Math.random() > 0.7 ? 1 : 0,
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 600000)),
      });
    }
  }

  await db.insert(mspDevicesTable).values(deviceData as any);
  logger.info({ count: deviceData.length }, "[msp-seed] Devices inserted");

  const contracts = await db.insert(mspContractsTable).values([
    { name: "Meridian Corp — Enterprise MSA", clientId: clientMap["Meridian Corp"], clientName: "Meridian Corp", type: "managed-services", status: "active", value: 177600, mrr: 14800, startDate: "2024-01-01", endDate: "2026-12-31", slaTarget: 99, slaActual: 97, renewalProbability: 75, notes: "Enterprise managed services. Includes 24/7 NOC, unlimited onsite hours, cloud management.", terms: { responseTime: "1h critical, 4h high", noHours: "24/7", onsite: "unlimited", cloudManagement: true } },
    { name: "Atlas Industries — Standard MSA", clientId: clientMap["Atlas Industries"], clientName: "Atlas Industries", type: "managed-services", status: "active", value: 112800, mrr: 9400, startDate: "2023-07-01", endDate: "2025-06-30", slaTarget: 99, slaActual: 99, renewalProbability: 88, notes: "Standard MSP coverage. Manufacturing environment.", terms: { responseTime: "2h critical, 8h high", noHours: "8x5", onsite: "40hrs/month" } },
    { name: "Pinnacle Health — HIPAA Compliance Package", clientId: clientMap["Pinnacle Health"], clientName: "Pinnacle Health", type: "security", status: "expiring", value: 194400, mrr: 16200, startDate: "2024-04-01", endDate: "2025-03-31", slaTarget: 99, slaActual: 98, renewalProbability: 82, notes: "HIPAA-covered MSP. BAA in place. Includes vCISO, compliance audits, SIEM.", terms: { responseTime: "1h critical, 2h high", noHours: "24/7", hipaaBaa: true, vciso: true } },
    { name: "Vertex Labs — Startup Growth Package", clientId: clientMap["Vertex Labs"], clientName: "Vertex Labs", type: "managed-services", status: "active", value: 86400, mrr: 7200, startDate: "2024-09-01", endDate: "2026-08-31", slaTarget: 99, slaActual: 99, renewalProbability: 94, notes: "Startup-optimized package. Cloud-first, endpoint focused.", terms: { responseTime: "2h critical, 8h high", noHours: "8x5", cloudFirst: true } },
    { name: "NovaTech — Break/Fix + Security Retainer", clientId: clientMap["NovaTech"], clientName: "NovaTech", type: "break-fix", status: "pending-renewal", value: 61200, mrr: 5100, startDate: "2023-01-01", endDate: "2025-12-31", slaTarget: 99, slaActual: 95, renewalProbability: 45, notes: "Break/fix with security incident retainer. High-risk client — multiple incidents.", terms: { responseTime: "2h critical, NBD high", incidentRetainer: "10hrs/month" } },
    { name: "Solaris Energy — Enterprise Cloud + Security", clientId: clientMap["Solaris Energy"], clientName: "Solaris Energy", type: "cloud", status: "active", value: 139200, mrr: 11600, startDate: "2024-06-01", endDate: "2027-05-31", slaTarget: 99, slaActual: 99, renewalProbability: 96, notes: "Full cloud management. Azure Government. OT/IT convergence security.", terms: { responseTime: "1h critical, 4h high", noHours: "24/7", cloudManagement: true, otSecurity: true } },
    { name: "Greenfield Education — EDU Bundle", clientId: clientMap["Greenfield Education"], clientName: "Greenfield Education", type: "managed-services", status: "active", value: 57600, mrr: 4800, startDate: "2024-08-01", endDate: "2026-07-31", slaTarget: 99, slaActual: 98, renewalProbability: 89, notes: "Education sector bundle. Device management for students + staff, filtering, compliance.", terms: { responseTime: "4h critical, NBD", noHours: "8x5", contentFiltering: true } },
    { name: "Horizon Logistics — Ops MSA", clientId: clientMap["Horizon Logistics"], clientName: "Horizon Logistics", type: "managed-services", status: "active", value: 98400, mrr: 8200, startDate: "2024-03-01", endDate: "2026-02-28", slaTarget: 99, slaActual: 97, renewalProbability: 79, notes: "24/7 ops support. Warehouse network, WMS integration, fleet device management.", terms: { responseTime: "1h critical, 4h high", noHours: "24/7", warehouseOps: true } },
    { name: "Quantum Analytics — Data Platform MSA", clientId: clientMap["Quantum Analytics"], clientName: "Quantum Analytics", type: "managed-services", status: "active", value: 76800, mrr: 6400, startDate: "2024-11-01", endDate: "2026-10-31", slaTarget: 99, slaActual: 99, renewalProbability: 91, notes: "Data infrastructure management. AWS + Snowflake. SOC 2 compliance support.", terms: { responseTime: "2h critical, 8h high", noHours: "8x5", dataOps: true } },
  ]).returning();

  logger.info({ count: contracts.length }, "[msp-seed] Contracts inserted");
  logger.info("[msp-seed] MSP demo seed complete");
}
