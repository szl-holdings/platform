export interface Client {
  id: string;
  name: string;
  industry: string;
  healthScore: number;
  deviceCount: number;
  openTickets: number;
  criticalAlerts: number;
  contractStatus: "active" | "expiring" | "expired" | "pending";
  mrr: number;
  slaCompliance: number;
  primaryContact: string;
  contactEmail: string;
  sites: number;
  onboardedDate: string;
  lastActivity: string;
}

export const clients: Client[] = [
  { id: "c1", name: "Meridian Financial Group", industry: "Financial Services", healthScore: 94, deviceCount: 342, openTickets: 5, criticalAlerts: 0, contractStatus: "active", mrr: 28500, slaCompliance: 99.2, primaryContact: "James Whitfield", contactEmail: "j.whitfield@meridianfg.com", sites: 4, onboardedDate: "2022-03-15", lastActivity: "2 min ago" },
  { id: "c2", name: "Apex Manufacturing", industry: "Manufacturing", healthScore: 87, deviceCount: 218, openTickets: 12, criticalAlerts: 2, contractStatus: "active", mrr: 19200, slaCompliance: 96.8, primaryContact: "Linda Torres", contactEmail: "l.torres@apexmfg.com", sites: 3, onboardedDate: "2021-08-22", lastActivity: "15 min ago" },
  { id: "c3", name: "Sterling Law Partners", industry: "Legal", healthScore: 91, deviceCount: 156, openTickets: 3, criticalAlerts: 0, contractStatus: "active", mrr: 14800, slaCompliance: 98.5, primaryContact: "Robert Chen", contactEmail: "r.chen@sterlinglaw.com", sites: 2, onboardedDate: "2023-01-10", lastActivity: "1 hr ago" },
  { id: "c4", name: "BluePeak Healthcare", industry: "Healthcare", healthScore: 78, deviceCount: 489, openTickets: 18, criticalAlerts: 3, contractStatus: "expiring", mrr: 42000, slaCompliance: 94.1, primaryContact: "Dr. Sarah Kim", contactEmail: "s.kim@bluepeakhc.com", sites: 7, onboardedDate: "2020-11-05", lastActivity: "5 min ago" },
  { id: "c5", name: "Velocity Logistics", industry: "Transportation", healthScore: 82, deviceCount: 267, openTickets: 8, criticalAlerts: 1, contractStatus: "active", mrr: 22100, slaCompliance: 95.9, primaryContact: "Mark Davidson", contactEmail: "m.davidson@velocitylog.com", sites: 5, onboardedDate: "2022-06-18", lastActivity: "30 min ago" },
  { id: "c6", name: "Crestview Education", industry: "Education", healthScore: 96, deviceCount: 178, openTickets: 2, criticalAlerts: 0, contractStatus: "active", mrr: 11500, slaCompliance: 99.7, primaryContact: "Amanda Brooks", contactEmail: "a.brooks@crestviewedu.org", sites: 2, onboardedDate: "2023-04-01", lastActivity: "45 min ago" },
  { id: "c7", name: "NovaTech Solutions", industry: "Technology", healthScore: 89, deviceCount: 134, openTickets: 6, criticalAlerts: 0, contractStatus: "active", mrr: 16300, slaCompliance: 97.3, primaryContact: "Kevin Zhao", contactEmail: "k.zhao@novatech.io", sites: 1, onboardedDate: "2023-09-12", lastActivity: "10 min ago" },
  { id: "c8", name: "Pacific Realty Group", industry: "Real Estate", healthScore: 73, deviceCount: 92, openTickets: 9, criticalAlerts: 2, contractStatus: "expiring", mrr: 8900, slaCompliance: 91.4, primaryContact: "Diana Patel", contactEmail: "d.patel@pacificrealty.com", sites: 3, onboardedDate: "2021-12-20", lastActivity: "2 hr ago" },
  { id: "c9", name: "Ironclad Security", industry: "Security", healthScore: 98, deviceCount: 203, openTickets: 1, criticalAlerts: 0, contractStatus: "active", mrr: 24600, slaCompliance: 99.9, primaryContact: "Carlos Mendez", contactEmail: "c.mendez@ironcladsec.com", sites: 2, onboardedDate: "2022-09-01", lastActivity: "Just now" },
  { id: "c10", name: "Greenfield Agriculture", industry: "Agriculture", healthScore: 65, deviceCount: 87, openTickets: 14, criticalAlerts: 4, contractStatus: "expired", mrr: 0, slaCompliance: 82.3, primaryContact: "Tom Henderson", contactEmail: "t.henderson@greenfieldag.com", sites: 4, onboardedDate: "2020-05-15", lastActivity: "1 day ago" },
];

export interface Ticket {
  id: string;
  title: string;
  client: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "waiting" | "resolved" | "closed";
  assignee: string;
  category: string;
  createdAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  lastUpdate: string;
  description: string;
}

export const tickets: Ticket[] = [
  { id: "TKT-1001", title: "Server down - Production SQL cluster unresponsive", client: "BluePeak Healthcare", priority: "critical", status: "in-progress", assignee: "Alex Rivera", category: "Infrastructure", createdAt: "2026-03-29T08:15:00Z", slaDeadline: "2026-03-29T09:15:00Z", slaBreached: false, lastUpdate: "12 min ago", description: "Primary SQL cluster not responding to connections. All dependent applications affected." },
  { id: "TKT-1002", title: "Email relay failure - Outbound messages queuing", client: "Meridian Financial Group", priority: "high", status: "open", assignee: "Unassigned", category: "Email", createdAt: "2026-03-29T07:45:00Z", slaDeadline: "2026-03-29T11:45:00Z", slaBreached: false, lastUpdate: "45 min ago", description: "Exchange Online connector failing. 200+ messages in queue." },
  { id: "TKT-1003", title: "VPN tunnel drops intermittently", client: "Sterling Law Partners", priority: "medium", status: "in-progress", assignee: "Maria Santos", category: "Network", createdAt: "2026-03-28T14:30:00Z", slaDeadline: "2026-03-29T14:30:00Z", slaBreached: false, lastUpdate: "2 hr ago", description: "Site-to-site VPN dropping every 30 minutes. Affecting remote office connectivity." },
  { id: "TKT-1004", title: "Ransomware alert - Suspicious file encryption detected", client: "Apex Manufacturing", priority: "critical", status: "in-progress", assignee: "Alex Rivera", category: "Security", createdAt: "2026-03-29T06:30:00Z", slaDeadline: "2026-03-29T07:00:00Z", slaBreached: true, lastUpdate: "3 min ago", description: "EDR flagged suspicious encryption activity on 3 endpoints. Isolated and investigating." },
  { id: "TKT-1005", title: "Printer fleet offline after firmware update", client: "Crestview Education", priority: "low", status: "waiting", assignee: "Jake Thompson", category: "Devices", createdAt: "2026-03-28T09:00:00Z", slaDeadline: "2026-03-30T09:00:00Z", slaBreached: false, lastUpdate: "5 hr ago", description: "12 network printers went offline after scheduled firmware push. Waiting on vendor patch." },
  { id: "TKT-1006", title: "Azure AD sync failing - New users not provisioning", client: "NovaTech Solutions", priority: "high", status: "in-progress", assignee: "Maria Santos", category: "Identity", createdAt: "2026-03-29T05:00:00Z", slaDeadline: "2026-03-29T09:00:00Z", slaBreached: true, lastUpdate: "1 hr ago", description: "AD Connect sync stopped. 15 new hires cannot access systems." },
  { id: "TKT-1007", title: "Backup job failed - Nightly incremental", client: "Pacific Realty Group", priority: "high", status: "open", assignee: "Unassigned", category: "Backup", createdAt: "2026-03-29T03:00:00Z", slaDeadline: "2026-03-29T11:00:00Z", slaBreached: false, lastUpdate: "6 hr ago", description: "Veeam backup job for file server failed with insufficient storage error." },
  { id: "TKT-1008", title: "Slow network performance - Branch office", client: "Velocity Logistics", priority: "medium", status: "in-progress", assignee: "Jake Thompson", category: "Network", createdAt: "2026-03-28T16:00:00Z", slaDeadline: "2026-03-29T16:00:00Z", slaBreached: false, lastUpdate: "3 hr ago", description: "Users reporting slow file access and Teams call quality issues at Denver branch." },
  { id: "TKT-1009", title: "License compliance audit preparation", client: "Ironclad Security", priority: "low", status: "open", assignee: "Sarah Chen", category: "Compliance", createdAt: "2026-03-27T10:00:00Z", slaDeadline: "2026-04-03T10:00:00Z", slaBreached: false, lastUpdate: "1 day ago", description: "Prepare Microsoft 365 license audit report for annual compliance review." },
  { id: "TKT-1010", title: "Firewall rule change request - New application", client: "Apex Manufacturing", priority: "medium", status: "waiting", assignee: "Alex Rivera", category: "Security", createdAt: "2026-03-28T11:00:00Z", slaDeadline: "2026-03-29T11:00:00Z", slaBreached: false, lastUpdate: "8 hr ago", description: "Need to open ports 8443-8445 for new ERP application deployment." },
  { id: "TKT-1011", title: "Workstation deployment - 25 new machines", client: "Meridian Financial Group", priority: "medium", status: "in-progress", assignee: "Sarah Chen", category: "Deployment", createdAt: "2026-03-25T09:00:00Z", slaDeadline: "2026-03-31T17:00:00Z", slaBreached: false, lastUpdate: "4 hr ago", description: "Image, configure, and deploy 25 new Dell workstations for Q2 expansion." },
  { id: "TKT-1012", title: "Critical patch deployment - CVE-2026-1234", client: "All Clients", priority: "critical", status: "in-progress", assignee: "Alex Rivera", category: "Patching", createdAt: "2026-03-29T01:00:00Z", slaDeadline: "2026-03-29T13:00:00Z", slaBreached: false, lastUpdate: "30 min ago", description: "Emergency Windows Server patch for actively exploited vulnerability. 847 servers to patch." },
];

export interface Device {
  id: string;
  hostname: string;
  type: "server" | "workstation" | "network" | "printer" | "mobile" | "firewall";
  client: string;
  site: string;
  status: "online" | "warning" | "critical" | "offline";
  os: string;
  lastSeen: string;
  ipAddress: string;
  cpu: number;
  memory: number;
  disk: number;
  alerts: number;
}

export const devices: Device[] = [
  { id: "d1", hostname: "MFG-SQL-01", type: "server", client: "Meridian Financial Group", site: "HQ - Chicago", status: "online", os: "Windows Server 2022", lastSeen: "Just now", ipAddress: "10.1.1.10", cpu: 45, memory: 72, disk: 68, alerts: 0 },
  { id: "d2", hostname: "MFG-DC-01", type: "server", client: "Meridian Financial Group", site: "HQ - Chicago", status: "online", os: "Windows Server 2022", lastSeen: "Just now", ipAddress: "10.1.1.5", cpu: 22, memory: 58, disk: 41, alerts: 0 },
  { id: "d3", hostname: "APX-PROD-DB", type: "server", client: "Apex Manufacturing", site: "Plant - Detroit", status: "warning", os: "Ubuntu 22.04 LTS", lastSeen: "2 min ago", ipAddress: "172.16.0.50", cpu: 89, memory: 91, disk: 78, alerts: 2 },
  { id: "d4", hostname: "BPH-SQL-CLUSTER", type: "server", client: "BluePeak Healthcare", site: "Main Campus", status: "critical", os: "Windows Server 2022", lastSeen: "15 min ago", ipAddress: "10.5.1.20", cpu: 0, memory: 0, disk: 85, alerts: 5 },
  { id: "d5", hostname: "FW-EDGE-01", type: "firewall", client: "Sterling Law Partners", site: "Downtown Office", status: "online", os: "FortiOS 7.4", lastSeen: "Just now", ipAddress: "192.168.1.1", cpu: 35, memory: 42, disk: 15, alerts: 0 },
  { id: "d6", hostname: "VL-SW-CORE", type: "network", client: "Velocity Logistics", site: "Denver Branch", status: "warning", os: "Cisco IOS-XE 17.9", lastSeen: "1 min ago", ipAddress: "10.3.0.1", cpu: 65, memory: 78, disk: 22, alerts: 1 },
  { id: "d7", hostname: "CE-WKS-LAB01", type: "workstation", client: "Crestview Education", site: "Science Building", status: "online", os: "Windows 11 Pro", lastSeen: "5 min ago", ipAddress: "10.8.10.101", cpu: 12, memory: 45, disk: 52, alerts: 0 },
  { id: "d8", hostname: "NT-APP-01", type: "server", client: "NovaTech Solutions", site: "Cloud - AWS", status: "online", os: "Amazon Linux 2023", lastSeen: "Just now", ipAddress: "10.0.1.15", cpu: 38, memory: 62, disk: 44, alerts: 0 },
  { id: "d9", hostname: "PR-NAS-01", type: "server", client: "Pacific Realty Group", site: "Main Office", status: "warning", os: "Synology DSM 7.2", lastSeen: "10 min ago", ipAddress: "192.168.5.100", cpu: 55, memory: 80, disk: 92, alerts: 3 },
  { id: "d10", hostname: "IC-FW-HA01", type: "firewall", client: "Ironclad Security", site: "SOC - Austin", status: "online", os: "Palo Alto PAN-OS 11", lastSeen: "Just now", ipAddress: "10.10.0.1", cpu: 28, memory: 35, disk: 18, alerts: 0 },
  { id: "d11", hostname: "GF-IOT-GW", type: "network", client: "Greenfield Agriculture", site: "Field Station Alpha", status: "offline", os: "Embedded Linux", lastSeen: "1 day ago", ipAddress: "10.20.1.1", cpu: 0, memory: 0, disk: 0, alerts: 4 },
  { id: "d12", hostname: "MFG-PRINT-FLEET", type: "printer", client: "Crestview Education", site: "Admin Building", status: "offline", os: "HP FutureSmart 5.6", lastSeen: "5 hr ago", ipAddress: "10.8.20.50", cpu: 0, memory: 0, disk: 0, alerts: 1 },
];

export interface Contract {
  id: string;
  client: string;
  type: "managed-services" | "break-fix" | "project" | "security" | "cloud";
  name: string;
  startDate: string;
  endDate: string;
  value: number;
  status: "active" | "expiring" | "expired" | "pending-renewal";
  slaTarget: number;
  slaActual: number;
  coveredDevices: number;
  renewalProbability: number;
  notes: string;
}

export const contracts: Contract[] = [
  { id: "ct1", client: "Meridian Financial Group", type: "managed-services", name: "Enterprise Managed IT", startDate: "2025-04-01", endDate: "2028-03-31", value: 342000, status: "active", slaTarget: 99.5, slaActual: 99.2, coveredDevices: 342, renewalProbability: 95, notes: "3-year agreement with annual CPI adjustment" },
  { id: "ct2", client: "Apex Manufacturing", type: "managed-services", name: "Full Stack MSP", startDate: "2024-09-01", endDate: "2026-08-31", value: 230400, status: "active", slaTarget: 99.0, slaActual: 96.8, coveredDevices: 218, renewalProbability: 82, notes: "Includes OT network monitoring" },
  { id: "ct3", client: "BluePeak Healthcare", type: "managed-services", name: "HIPAA Compliant IT", startDate: "2024-01-01", endDate: "2026-06-30", value: 504000, status: "expiring", slaTarget: 99.9, slaActual: 94.1, coveredDevices: 489, renewalProbability: 68, notes: "HIPAA BAA in place. SLA concerns need addressing before renewal." },
  { id: "ct4", client: "Sterling Law Partners", type: "managed-services", name: "Legal IT Services", startDate: "2025-01-01", endDate: "2027-12-31", value: 177600, status: "active", slaTarget: 99.5, slaActual: 98.5, coveredDevices: 156, renewalProbability: 91, notes: "Includes eDiscovery support and document management" },
  { id: "ct5", client: "Velocity Logistics", type: "managed-services", name: "Fleet IT Operations", startDate: "2025-07-01", endDate: "2027-06-30", value: 265200, status: "active", slaTarget: 99.0, slaActual: 95.9, coveredDevices: 267, renewalProbability: 85, notes: "GPS and IoT device management included" },
  { id: "ct6", client: "Crestview Education", type: "managed-services", name: "Education IT Bundle", startDate: "2025-08-01", endDate: "2027-07-31", value: 138000, status: "active", slaTarget: 99.0, slaActual: 99.7, coveredDevices: 178, renewalProbability: 98, notes: "Summer maintenance windows. Student device management." },
  { id: "ct7", client: "NovaTech Solutions", type: "cloud", name: "Cloud Infrastructure", startDate: "2025-10-01", endDate: "2026-09-30", value: 195600, status: "active", slaTarget: 99.9, slaActual: 97.3, coveredDevices: 134, renewalProbability: 88, notes: "AWS and Azure hybrid cloud management" },
  { id: "ct8", client: "Pacific Realty Group", type: "managed-services", name: "Basic IT Support", startDate: "2024-01-01", endDate: "2026-04-30", value: 106800, status: "expiring", slaTarget: 98.0, slaActual: 91.4, coveredDevices: 92, renewalProbability: 45, notes: "Client considering switching providers. Schedule QBR." },
  { id: "ct9", client: "Ironclad Security", type: "security", name: "Advanced Security Ops", startDate: "2025-09-01", endDate: "2028-08-31", value: 295200, status: "active", slaTarget: 99.99, slaActual: 99.9, coveredDevices: 203, renewalProbability: 99, notes: "24/7 SOC monitoring. Co-managed SIEM." },
  { id: "ct10", client: "Greenfield Agriculture", type: "break-fix", name: "On-Demand Support", startDate: "2025-01-01", endDate: "2025-12-31", value: 0, status: "expired", slaTarget: 95.0, slaActual: 82.3, coveredDevices: 0, renewalProbability: 20, notes: "T&M billing. Client has outstanding invoices." },
];

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  source: string;
  client: string;
  timestamp: string;
  acknowledged: boolean;
  category: string;
}

export const alerts: Alert[] = [
  { id: "a1", severity: "critical", title: "SQL Cluster Node Failure", source: "BPH-SQL-CLUSTER", client: "BluePeak Healthcare", timestamp: "2026-03-29T08:12:00Z", acknowledged: true, category: "Infrastructure" },
  { id: "a2", severity: "critical", title: "Ransomware Activity Detected", source: "APX-WKS-15", client: "Apex Manufacturing", timestamp: "2026-03-29T06:28:00Z", acknowledged: true, category: "Security" },
  { id: "a3", severity: "critical", title: "Critical CVE Patch Required", source: "Global", client: "All Clients", timestamp: "2026-03-29T01:00:00Z", acknowledged: true, category: "Patching" },
  { id: "a4", severity: "warning", title: "Disk Space Above 90%", source: "PR-NAS-01", client: "Pacific Realty Group", timestamp: "2026-03-29T07:30:00Z", acknowledged: false, category: "Storage" },
  { id: "a5", severity: "warning", title: "High CPU Utilization", source: "APX-PROD-DB", client: "Apex Manufacturing", timestamp: "2026-03-29T07:15:00Z", acknowledged: false, category: "Performance" },
  { id: "a6", severity: "warning", title: "VPN Tunnel Flapping", source: "FW-SLP-01", client: "Sterling Law Partners", timestamp: "2026-03-28T14:28:00Z", acknowledged: true, category: "Network" },
  { id: "a7", severity: "warning", title: "Core Switch High Memory", source: "VL-SW-CORE", client: "Velocity Logistics", timestamp: "2026-03-29T06:00:00Z", acknowledged: false, category: "Network" },
  { id: "a8", severity: "critical", title: "IoT Gateway Unreachable", source: "GF-IOT-GW", client: "Greenfield Agriculture", timestamp: "2026-03-28T08:00:00Z", acknowledged: false, category: "Connectivity" },
  { id: "a9", severity: "info", title: "Backup Completed Successfully", source: "MFG-BKP-01", client: "Meridian Financial Group", timestamp: "2026-03-29T04:00:00Z", acknowledged: false, category: "Backup" },
  { id: "a10", severity: "info", title: "Windows Updates Installed", source: "CE-WKS-LAB01", client: "Crestview Education", timestamp: "2026-03-29T03:00:00Z", acknowledged: false, category: "Patching" },
  { id: "a11", severity: "warning", title: "AD Sync Failure", source: "NT-DC-01", client: "NovaTech Solutions", timestamp: "2026-03-29T05:00:00Z", acknowledged: true, category: "Identity" },
  { id: "a12", severity: "info", title: "SSL Certificate Renewal Due in 30 Days", source: "IC-WEB-01", client: "Ironclad Security", timestamp: "2026-03-29T00:00:00Z", acknowledged: false, category: "Compliance" },
];

export interface Technician {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "available" | "busy" | "on-call" | "off";
  activeTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
  specializations: string[];
  currentTask: string;
  utilization: number;
}

export const technicians: Technician[] = [
  { id: "t1", name: "Alex Rivera", role: "Senior Engineer", avatar: "AR", status: "busy", activeTickets: 4, resolvedToday: 3, avgResponseTime: "8 min", specializations: ["Security", "Infrastructure", "Patching"], currentTask: "TKT-1004: Ransomware investigation", utilization: 95 },
  { id: "t2", name: "Maria Santos", role: "Network Specialist", avatar: "MS", status: "busy", activeTickets: 3, resolvedToday: 5, avgResponseTime: "12 min", specializations: ["Network", "Firewall", "VPN"], currentTask: "TKT-1003: VPN tunnel troubleshooting", utilization: 82 },
  { id: "t3", name: "Jake Thompson", role: "Field Technician", avatar: "JT", status: "busy", activeTickets: 2, resolvedToday: 4, avgResponseTime: "15 min", specializations: ["Devices", "Deployment", "Hardware"], currentTask: "TKT-1008: Network performance analysis", utilization: 68 },
  { id: "t4", name: "Sarah Chen", role: "Systems Administrator", avatar: "SC", status: "available", activeTickets: 2, resolvedToday: 6, avgResponseTime: "10 min", specializations: ["Cloud", "Identity", "Compliance"], currentTask: "TKT-1011: Workstation deployment", utilization: 55 },
  { id: "t5", name: "Devon Marshall", role: "Help Desk Lead", avatar: "DM", status: "on-call", activeTickets: 0, resolvedToday: 8, avgResponseTime: "5 min", specializations: ["Tier 1", "Email", "Office 365"], currentTask: "On-call rotation", utilization: 40 },
  { id: "t6", name: "Rachel Kim", role: "Cloud Architect", avatar: "RK", status: "available", activeTickets: 1, resolvedToday: 2, avgResponseTime: "20 min", specializations: ["AWS", "Azure", "Cloud Migration"], currentTask: "Infrastructure planning", utilization: 45 },
  { id: "t7", name: "Omar Hassan", role: "Security Analyst", avatar: "OH", status: "off", activeTickets: 0, resolvedToday: 0, avgResponseTime: "7 min", specializations: ["SOC", "SIEM", "Incident Response"], currentTask: "Off duty", utilization: 0 },
  { id: "t8", name: "Lisa Park", role: "Project Manager", avatar: "LP", status: "available", activeTickets: 0, resolvedToday: 0, avgResponseTime: "N/A", specializations: ["Projects", "Onboarding", "QBR"], currentTask: "Q2 planning", utilization: 30 },
];

export const revenueData = [
  { month: "Oct", mrr: 165200, expenses: 98500, profit: 66700, clients: 9 },
  { month: "Nov", mrr: 172400, expenses: 101200, profit: 71200, clients: 9 },
  { month: "Dec", mrr: 175800, expenses: 105400, profit: 70400, clients: 10 },
  { month: "Jan", mrr: 181600, expenses: 108900, profit: 72700, clients: 10 },
  { month: "Feb", mrr: 184300, expenses: 106200, profit: 78100, clients: 10 },
  { month: "Mar", mrr: 187900, expenses: 109800, profit: 78100, clients: 10 },
];

export const uptimeData = [
  { service: "Email & Exchange", uptime: 99.97, incidents: 1 },
  { service: "Active Directory", uptime: 99.85, incidents: 3 },
  { service: "VPN Gateway", uptime: 98.92, incidents: 7 },
  { service: "Firewall Cluster", uptime: 99.99, incidents: 0 },
  { service: "Backup Systems", uptime: 99.45, incidents: 4 },
  { service: "DNS/DHCP", uptime: 99.98, incidents: 1 },
  { service: "Cloud Services", uptime: 99.91, incidents: 2 },
  { service: "Monitoring Platform", uptime: 100.0, incidents: 0 },
];

export const incidentTimeline = [
  { time: "08:15", event: "SQL Cluster failure detected at BluePeak Healthcare", severity: "critical" as const },
  { time: "08:12", event: "Auto-remediation attempted on BPH-SQL-CLUSTER", severity: "info" as const },
  { time: "07:45", event: "Email relay failure at Meridian Financial Group", severity: "warning" as const },
  { time: "07:30", event: "Storage alert: PR-NAS-01 disk at 92%", severity: "warning" as const },
  { time: "07:15", event: "CPU spike on APX-PROD-DB (89%)", severity: "warning" as const },
  { time: "06:30", event: "Ransomware detection at Apex Manufacturing", severity: "critical" as const },
  { time: "06:28", event: "Endpoints APX-WKS-15,16,17 auto-isolated", severity: "critical" as const },
  { time: "05:00", event: "AD Connect sync failure at NovaTech Solutions", severity: "warning" as const },
  { time: "04:00", event: "All nightly backups completed (9/10 success)", severity: "info" as const },
  { time: "03:00", event: "Windows Updates deployed to Crestview Education", severity: "info" as const },
  { time: "01:00", event: "CVE-2026-1234 emergency patch alert published", severity: "critical" as const },
];
