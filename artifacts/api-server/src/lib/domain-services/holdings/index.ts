// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface HoldingsStoragePort {
  listVentures(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  getVenture(id: number): Promise<unknown | null>;
  getVentureBySlug(slug: string): Promise<unknown | null>;
  listMetrics(args: { ventureId: number; limit: number }): Promise<unknown[]>;
  listMilestones(args: { ventureId: number; limit: number }): Promise<unknown[]>;
  listInquiries(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  createInquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
  }): Promise<unknown>;
}

// ─── Trust Center — Static Compliance Data ────────────────────────────────────

export interface TrustFramework {
  name: string;
  status: string;
  scope: string;
  expiry: string;
}

export interface TrustCertification {
  name: string;
  date: string;
  issuer: string;
}

export interface TrustCenterStatus {
  lastAuditDate: string;
  nextReviewDate: string;
  overallScore: number;
  frameworks: TrustFramework[];
  certifications: TrustCertification[];
}

export function getTrustCenterStatus(): TrustCenterStatus {
  return {
    lastAuditDate: '2026-01-15',
    nextReviewDate: '2026-07-15',
    overallScore: 94,
    frameworks: [
      {
        name: 'ISO 27001',
        status: 'certified',
        scope: 'Information Security Management',
        expiry: 'Dec 2026',
      },
      {
        name: 'SOC 2 Type II',
        status: 'certified',
        scope: 'Security, Availability, Confidentiality',
        expiry: 'Mar 2027',
      },
      { name: 'GDPR', status: 'compliant', scope: 'EU Data Protection', expiry: 'Ongoing' },
      { name: 'StateRAMP', status: 'in-progress', scope: 'US Federal Cloud', expiry: 'Q3 2026' },
      {
        name: 'ITAR',
        status: 'compliant',
        scope: 'Defense Technology Controls',
        expiry: 'Ongoing',
      },
    ],
    certifications: [
      { name: 'Pentest by Cobalt Strike', date: 'Jan 2026', issuer: 'Cobalt Strike' },
      { name: 'AWS Security Partner Certified', date: 'Nov 2025', issuer: 'Amazon Web Services' },
      { name: 'Zero Trust Architecture', date: 'Sep 2025', issuer: 'CISA' },
      { name: 'DISA STIGs Applied', date: 'Dec 2025', issuer: 'DISA' },
    ],
  };
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listHoldingsVentures(
  storage: HoldingsStoragePort,
  args: { status?: string; limit?: number; offset?: number },
) {
  return storage.listVentures({
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function getHoldingsVenture(storage: HoldingsStoragePort, id: number) {
  return storage.getVenture(id);
}

export async function getHoldingsVentureBySlug(storage: HoldingsStoragePort, slug: string) {
  return storage.getVentureBySlug(slug);
}

export async function listHoldingsMetrics(
  storage: HoldingsStoragePort,
  args: { ventureId: number; limit?: number },
) {
  return storage.listMetrics({ ventureId: args.ventureId, limit: args.limit ?? 20 });
}

export async function listHoldingsMilestones(
  storage: HoldingsStoragePort,
  args: { ventureId: number; limit?: number },
) {
  return storage.listMilestones({ ventureId: args.ventureId, limit: args.limit ?? 20 });
}

export async function listHoldingsInquiries(
  storage: HoldingsStoragePort,
  args: { status?: string; limit?: number; offset?: number },
) {
  return storage.listInquiries({
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function createHoldingsInquiry(
  storage: HoldingsStoragePort,
  data: { name: string; email: string; subject: string; message: string },
) {
  return storage.createInquiry({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    status: 'new',
  });
}
