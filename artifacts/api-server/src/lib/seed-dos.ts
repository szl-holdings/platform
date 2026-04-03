import {
  db,
  dosCampaignsTable,
  dosLeadsTable,
  dosIntegrationStatusTable,
  dosCampaignLinksTable,
} from "@szl-holdings/db";
import { computeLeadScore } from "./lead-scoring";

export async function seedDosData(): Promise<void> {
  console.log("[dos-seed] Starting Distribution OS seed...");

  const existingCampaigns = await db.select().from(dosCampaignsTable);
  const existingSlugs = new Set(existingCampaigns.map(c => c.slug));

  const seedCampaigns = [
    { name: "Founder LinkedIn Spring 2025", slug: "founder-linkedin-spring-2025", description: "Founder-led content campaign on LinkedIn targeting enterprise operators and MSP buyers.", status: "active" as const, owner: "Stephen", totalClicks: 142, totalConversions: 8 },
    { name: "Newsletter — Weekly Brief Launch", slug: "newsletter-weekly-brief-launch", description: "Campaign to grow newsletter subscriber base via bio links, X, and Substack cross-posts.", status: "active" as const, owner: "Stephen", totalClicks: 87, totalConversions: 23 },
    { name: "Lyte Product Launch Q2", slug: "lyte-product-launch-q2", description: "Campaign for Lyte product awareness targeting SMB IT teams and MSPs.", status: "draft" as const, owner: "Stephen", totalClicks: 0, totalConversions: 0 },
  ];

  const createdCampaigns: Record<string, number> = {};
  for (const c of seedCampaigns) {
    if (!existingSlugs.has(c.slug)) {
      const [created] = await db.insert(dosCampaignsTable).values(c).returning();
      createdCampaigns[c.slug] = created.id;
    } else {
      const existing = existingCampaigns.find(ec => ec.slug === c.slug);
      if (existing) createdCampaigns[c.slug] = existing.id;
    }
  }

  const existingLeads = await db.select().from(dosLeadsTable);
  const existingEmails = new Set(existingLeads.map(l => l.email));

  const seedLeads = [
    {
      name: "Marcus Webb",
      email: "marcus.webb@vertexops.com",
      company: "Vertex Operations",
      role: "VP of Engineering",
      interestArea: "lyte",
      budget: "25k-50k",
      message: "We've been evaluating MSP tooling for three months. Lyte looks like exactly what we've been missing. Can we schedule a call?",
      source: "linkedin",
      medium: "organic",
      campaign: "founder-linkedin-spring-2025",
      landingPage: "/lyte",
      stage: "warm" as const,
      score: computeLeadScore({ email: "marcus.webb@vertexops.com", budget: "25k-50k", source: "linkedin", landingPage: "/lyte", message: "We've been evaluating MSP tooling for three months. Lyte looks like exactly what we've been missing. Can we schedule a call?", visitCount: 3 }),
      owner: "Stephen",
      lastAction: "Replied to LinkedIn DM",
      consent: true,
    },
    {
      name: "Priya Nair",
      email: "priya@cloudshift.io",
      company: "Cloudshift",
      role: "Founder",
      interestArea: "alloy",
      budget: "10k-25k",
      message: "Found you through the newsletter. The Alloy positioning resonates deeply. Would love a 20-minute call.",
      source: "newsletter",
      medium: "email",
      campaign: "newsletter-weekly-brief-launch",
      landingPage: "/alloy",
      stage: "qualified" as const,
      score: computeLeadScore({ email: "priya@cloudshift.io", budget: "10k-25k", source: "newsletter", landingPage: "/alloy", message: "Found you through the newsletter. The Alloy positioning resonates deeply. Would love a 20-minute call.", visitCount: 2 }),
      owner: "Stephen",
      lastAction: "Scheduled intro call",
      consent: true,
    },
    {
      name: "Daniel Osei",
      email: "daniel.osei@gmail.com",
      company: null,
      role: null,
      interestArea: "general",
      budget: null,
      message: "Interesting stuff",
      source: "direct",
      medium: null,
      campaign: "founder-linkedin-spring-2025",
      landingPage: "/",
      stage: "new" as const,
      score: computeLeadScore({ email: "daniel.osei@gmail.com", budget: null, source: "direct", landingPage: "/", message: "Interesting stuff" }),
      owner: null,
      lastAction: null,
      consent: true,
    },
  ];

  for (const lead of seedLeads) {
    if (!existingEmails.has(lead.email)) {
      await db.insert(dosLeadsTable).values(lead);
    }
  }

  const existingIntegrations = await db.select().from(dosIntegrationStatusTable);
  const existingProviders = new Set(existingIntegrations.map(i => i.provider));
  const integrationProviders = [
    { provider: "x", authMode: "oauth2" as const, status: "disconnected" as const },
    { provider: "substack", authMode: "api-key" as const, status: "mock" as const },
    { provider: "medium", authMode: "api-key" as const, status: "disconnected" as const },
    { provider: "linkedin", authMode: "oauth2" as const, status: "disconnected" as const },
    { provider: "linktree", authMode: "manual" as const, status: "disconnected" as const },
    { provider: "email", authMode: "api-key" as const, status: "disconnected" as const },
  ];
  for (const int of integrationProviders) {
    if (!existingProviders.has(int.provider)) {
      await db.insert(dosIntegrationStatusTable).values(int);
    }
  }

  console.log("[dos-seed] Distribution OS seed complete.");
}
