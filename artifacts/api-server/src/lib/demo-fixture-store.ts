/**
 * Demo Fixture Store — SZL Holdings Platform
 *
 * Provides seeded, in-memory fixture data for key API paths.
 * Used exclusively when APP_MODE=demo to serve realistic responses
 * without touching the live database.
 *
 * - get(path):   Returns fixture data for an exact or prefix match, or null.
 * - reset():     Reloads all fixtures to their initial seeded state.
 * - demoActive:  True when APP_MODE=demo (checked at runtime).
 */

export interface DemoFixture {
  status?: number;
  data: unknown;
}

const NOW = () => new Date().toISOString();

function buildFixtures(): Map<string, DemoFixture> {
  const m = new Map<string, DemoFixture>();

  m.set("/api/vessels", {
    data: {
      vessels: [
        { id: "v001", name: "MV Horizon Star", imo: "9876543", flag: "Panama", type: "Container", status: "underway", speed: 14.2, heading: 185, lat: 25.7617, lng: -80.1918, cargo: "Electronics", destination: "Miami, FL", eta: "2026-04-20T08:00:00Z", riskScore: 12 },
        { id: "v002", name: "MV Pacific Venture", imo: "9654321", flag: "Liberia", type: "Bulk Carrier", status: "at_anchor", speed: 0, heading: 0, lat: 51.5074, lng: 0.1278, cargo: "Grain", destination: "Rotterdam, NL", eta: "2026-04-22T14:00:00Z", riskScore: 28 },
        { id: "v003", name: "MV Constellation", imo: "9456789", flag: "Marshall Islands", type: "Tanker", status: "underway", speed: 12.8, heading: 270, lat: 35.6762, lng: 139.6503, cargo: "Crude Oil", destination: "Singapore", eta: "2026-04-25T06:00:00Z", riskScore: 45 },
        { id: "v004", name: "MV Arctic Eagle", imo: "9234567", flag: "Norway", type: "LNG Carrier", status: "in_port", speed: 0, heading: 0, lat: 59.9139, lng: 10.7522, cargo: "LNG", destination: "Oslo, NO", eta: "2026-04-19T10:00:00Z", riskScore: 8 },
        { id: "v005", name: "MV Southern Cross", imo: "9012345", flag: "Bahamas", type: "Container", status: "underway", speed: 16.5, heading: 95, lat: -33.8688, lng: 151.2093, cargo: "General Cargo", destination: "Auckland, NZ", eta: "2026-04-28T12:00:00Z", riskScore: 15 },
      ],
      total: 5,
      page: 1,
      pageSize: 25,
    },
  });

  m.set("/api/aegis/alerts", {
    data: {
      alerts: [
        { id: "a001", severity: "critical", title: "Lateral Movement Detected", description: "Unusual east-west traffic between internal subnets", source: "SIEM", status: "open", createdAt: "2026-04-18T01:15:00Z", asset: "srv-prod-db-01", tactic: "Lateral Movement" },
        { id: "a002", severity: "high", title: "Brute Force Login Attempt", description: "235 failed SSH attempts from 198.51.100.42", source: "IDS", status: "investigating", createdAt: "2026-04-18T00:45:00Z", asset: "bastion-host-01", tactic: "Initial Access" },
        { id: "a003", severity: "medium", title: "Anomalous Outbound Data Transfer", description: "3.2 GB transferred to unknown external endpoint", source: "DLP", status: "open", createdAt: "2026-04-17T23:30:00Z", asset: "workstation-eng-04", tactic: "Exfiltration" },
        { id: "a004", severity: "low", title: "Certificate Expiry Warning", description: "TLS certificate for api.internal expires in 14 days", source: "PKI Monitor", status: "acknowledged", createdAt: "2026-04-17T22:00:00Z", asset: "api.internal", tactic: "N/A" },
      ],
      total: 4,
      open: 2,
      critical: 1,
    },
  });

  m.set("/api/terra", {
    data: {
      properties: [
        { id: "t001", address: "4821 Meridian Blvd, Miami, FL 33101", type: "Commercial", value: 2850000, distressScore: 82, status: "pre-foreclosure", sqft: 18500, yearBuilt: 2004, occupancy: 0.34, ltv: 1.12, daysDelinquent: 145 },
        { id: "t002", address: "1702 Harbor View Dr, Tampa, FL 33602", type: "Multifamily", value: 1640000, distressScore: 67, status: "lis-pendens", sqft: 12200, yearBuilt: 1998, occupancy: 0.58, ltv: 0.98, daysDelinquent: 89 },
        { id: "t003", address: "332 Industrial Pkwy, Orlando, FL 32801", type: "Industrial", value: 4200000, distressScore: 91, status: "reo", sqft: 45000, yearBuilt: 1995, occupancy: 0, ltv: 0.85, daysDelinquent: 380 },
        { id: "t004", address: "9104 Coastal Hwy, Jacksonville, FL 32207", type: "Retail", value: 890000, distressScore: 55, status: "default", sqft: 6800, yearBuilt: 2011, occupancy: 0.71, ltv: 0.87, daysDelinquent: 62 },
      ],
      total: 4,
      totalValue: 9580000,
    },
  });

  m.set("/api/health", {
    data: { status: "ok", mode: "demo", version: "0.0.0", uptime: 99.98 },
  });

  m.set("/api/healthz", {
    data: { status: "ok", mode: "demo" },
  });

  m.set("/api/notifications", {
    data: {
      notifications: [
        { id: 1, title: "Fleet Risk Score Updated", body: "MV Constellation risk score increased to 45", type: "alert", read: false, createdAt: "2026-04-18T01:00:00Z" },
        { id: 2, title: "New Distressed Property Signal", body: "Industrial property in Orlando flagged as REO", type: "signal", read: false, createdAt: "2026-04-17T23:00:00Z" },
        { id: 3, title: "Governance Approval Required", body: "Bulk export request awaiting executive sign-off", type: "approval", read: true, createdAt: "2026-04-17T21:00:00Z" },
      ],
      unreadCount: 2,
    },
  });

  m.set("/api/dashboard/metrics", {
    data: {
      revenue: { current: 4280000, previous: 3950000, change: 8.4 },
      activeVessels: 5,
      openAlerts: 3,
      distressedProperties: 4,
      governanceScore: 94.2,
      aiDecisionsToday: 127,
      humansInTheLoop: 3,
    },
  });

  m.set("/api/audit", {
    data: {
      events: [
        { id: "au001", action: "entity.update", actor: "demo-user", target: "vessel:v001", at: "2026-04-18T01:10:00Z", result: "success" },
        { id: "au002", action: "alert.acknowledge", actor: "demo-user", target: "alert:a004", at: "2026-04-17T22:05:00Z", result: "success" },
        { id: "au003", action: "report.export", actor: "demo-user", target: "fleet-summary", at: "2026-04-17T20:30:00Z", result: "success" },
      ],
      total: 3,
    },
  });

  m.set("/api/lyte", {
    data: {
      signals: [
        { id: "s001", name: "Revenue Velocity", value: 4280000, trend: "up", change: 8.4, unit: "USD", domain: "finance", severity: "healthy" },
        { id: "s002", name: "Fleet On-Time Delivery", value: 94.2, trend: "stable", change: 0.3, unit: "%", domain: "operations", severity: "healthy" },
        { id: "s003", name: "Security Posture Score", value: 76, trend: "down", change: -4.1, unit: "pts", domain: "security", severity: "warning" },
        { id: "s004", name: "Property Pipeline Value", value: 9580000, trend: "up", change: 12.7, unit: "USD", domain: "real-estate", severity: "healthy" },
      ],
    },
  });

  return m;
}

class DemoFixtureStore {
  private fixtures: Map<string, DemoFixture>;

  constructor() {
    this.fixtures = buildFixtures();
  }

  get isDemoMode(): boolean {
    const raw = (process.env["APP_MODE"] ?? "").toLowerCase().trim();
    if (raw === "demo") return true;
    const demoMode = process.env["DEMO_MODE"];
    if (demoMode === "true" || demoMode === "1") return true;
    const appEnv = (process.env["APP_ENV"] ?? "").toLowerCase();
    return appEnv === "demo";
  }

  reset(): void {
    this.fixtures = buildFixtures();
  }

  get(path: string): DemoFixture | null {
    const exact = this.fixtures.get(path);
    if (exact) return exact;

    for (const [prefix, fixture] of this.fixtures) {
      if (path.startsWith(prefix + "/") || path.startsWith(prefix + "?")) {
        return fixture;
      }
    }
    return null;
  }

  get size(): number {
    return this.fixtures.size;
  }
}

export const demoFixtureStore = new DemoFixtureStore();
