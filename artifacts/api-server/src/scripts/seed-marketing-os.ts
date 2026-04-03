import {
  db,
  dosEditorialPillarsTable,
  dosCarouselProjectsTable,
  dosContentCalendarItemsTable,
} from "@szl-holdings/db";
import { eq } from "drizzle-orm";

async function seedMarketingOS() {
  console.log("Seeding Marketing OS: pillars, carousel ideas, calendar items…");

  const existingPillars = await db.select().from(dosEditorialPillarsTable);
  if (existingPillars.length === 0) {
    await db.insert(dosEditorialPillarsTable).values([
      { name: "Maritime & Supply Chain Intelligence", slug: "maritime-supply-chain", description: "Operational risk, vessel intelligence, port dynamics, and global supply chain resilience.", color: "#4a90b8", isFavorite: true, sortOrder: 1 },
      { name: "Founder & Executive Leadership", slug: "founder-executive", description: "Decision-making frameworks, operator mindset, and leadership at scale.", color: "#d4a054", isFavorite: true, sortOrder: 2 },
      { name: "Enterprise Technology Adoption", slug: "enterprise-tech", description: "How enterprises evaluate, adopt, and get ROI from complex technology investments.", color: "#9c5adc", isFavorite: true, sortOrder: 3 },
      { name: "AI & Intelligent Operations", slug: "ai-intelligent-ops", description: "Practical AI use cases for operations, risk, and decision intelligence.", color: "#5a9c5a", isFavorite: false, sortOrder: 4 },
      { name: "Capital Readiness & Investor Relations", slug: "capital-readiness", description: "How operators and founders prepare for capital raises, due diligence, and investor communication.", color: "#c45a4a", isFavorite: false, sortOrder: 5 },
    ]);
    console.log("✓ Seeded 5 editorial pillars (3 favorites)");
  } else {
    console.log(`Skipping pillars — ${existingPillars.length} already exist`);
  }

  const pillars = await db.select().from(dosEditorialPillarsTable);
  const pillarMap = Object.fromEntries(pillars.map(p => [p.slug, p.id]));

  const existingCarousels = await db.select().from(dosCarouselProjectsTable);
  if (existingCarousels.length === 0) {
    await db.insert(dosCarouselProjectsTable).values([
      {
        title: "5 Supply Chain Risk Signals Every Operator Misses",
        slug: "supply-chain-risk-signals-operators-miss",
        topic: "supply chain risk management",
        hook: "Most operators focus on the obvious risks. These 5 signals are the ones that blindside you.",
        pillarId: pillarMap["maritime-supply-chain"],
        ctaText: "Book a risk intelligence session.",
        ctaUrl: "/contact",
        status: "idea",
        visualDirectionNotes: "Template: Educational Explainer. Brand colors gold/dark. Risk icons per slide.",
        aiCarouselsImportBlock: "[Intro] Maritime Intelligence/5 Supply Chain Risk Signals Every Operator Misses/A breakdown for operators who can't afford to be blindsided.\n[Slide 2] Signal 1: Port Congestion Leading Indicators/Most operators react to congestion. The signal precedes it by 72 hours — if you know where to look.\n[Slide 3] Signal 2: Flag State Anomalies/Sudden re-flagging of key vessels is rarely random. It's an indicator of regulatory arbitrage or sanctions exposure.\n[Slide 4] Signal 3: Freight Rate Velocity/Rate acceleration (not level) is the predictive signal. By the time rates spike, the window has closed.\n[Slide 5] Signal 4: Carrier Capacity Reallocation/When carriers silently reallocate capacity, routes that look operational aren't. This shows up in AIS data before announcements.\n[Slide 6] Signal 5: Supplier Financial Stress Indicators/A supplier in covenant breach will delay your shipment before they tell you. The financial signals are trackable.\n[Slide 7] The Core Insight/These signals are in your data. You need a system to surface them in time to act.\n[Outro] SZL Holdings/Book a risk intelligence session./We help operators build early-warning systems for supply chain risk./Contact us at szlholdings.com",
      },
      {
        title: "The Contrarian's Guide to Enterprise AI Adoption",
        slug: "contrarian-guide-enterprise-ai-adoption",
        topic: "enterprise AI adoption",
        hook: "Everyone is rushing to deploy AI. The operators winning are the ones who slowed down first.",
        pillarId: pillarMap["enterprise-tech"],
        ctaText: "Download the AI readiness framework.",
        ctaUrl: "/resources",
        status: "draft",
        visualDirectionNotes: "Template: Contrarian POV. Contrast colors, bold assertions per slide.",
        aiCarouselsImportBlock: "[Intro] Enterprise Technology/The Contrarian's Guide to Enterprise AI Adoption/For operators who want results, not demos.\n[Slide 2] The Mainstream View/The consensus says: move fast, pilot everything, fail fast. Every vendor endorses this approach.\n[Slide 3] Why That's Wrong/Organizations that adopt AI without an integration-first strategy average 14 months to production and 3x overrun on initial budget.\n[Slide 4] The Evidence/Our portfolio data shows: disciplined adopters achieve ROI 60% faster than rapid experimenters.\n[Slide 5] The Alternative Approach/Instead of piloting first, map your decision architecture first. AI should augment decisions, not create new processes.\n[Slide 6] The Nuance/Speed matters — but the right speed. Deliberate adoption with clear use-case prioritization outperforms spray-and-pray.\n[Outro] SZL Holdings/Download the AI readiness framework./Practical guidance for enterprise leaders who want results./szlholdings.com/resources",
      },
      {
        title: "Before You Raise Capital: The 10-Point Operator Checklist",
        slug: "before-you-raise-capital-checklist",
        topic: "capital raise readiness",
        hook: "Founders who struggle to close rounds often fail on the same 10 points. Every single time.",
        pillarId: pillarMap["capital-readiness"],
        ctaText: "Get a capital readiness assessment.",
        ctaUrl: "/contact",
        status: "idea",
        visualDirectionNotes: "Template: Operator Checklist. Clean numbered layout, checkmark icons.",
      },
      {
        title: "What a Vessel's AIS Data Actually Tells You",
        slug: "vessel-ais-data-breakdown",
        topic: "AIS vessel tracking and intelligence",
        hook: "AIS data is publicly available. What most operators do with it is wrong.",
        pillarId: pillarMap["maritime-supply-chain"],
        ctaText: "See Vessels Intelligence in action.",
        ctaUrl: "/vessels",
        status: "idea",
        visualDirectionNotes: "Template: Educational Explainer. Maritime imagery, data visualization references.",
      },
      {
        title: "The Founder's Framework for High-Stakes Decisions",
        slug: "founder-framework-high-stakes-decisions",
        topic: "high-stakes decision-making",
        hook: "Every founder has a decision they wish they'd made differently. Here's the framework that prevents it.",
        pillarId: pillarMap["founder-executive"],
        ctaText: "Follow for more from the founder's desk.",
        ctaUrl: "/founder",
        status: "ready",
        visualDirectionNotes: "Template: Founder Story. Personal, direct tone. Minimal design.",
      },
      {
        title: "5 AI Use Cases That Actually Deliver ROI in Operations",
        slug: "ai-use-cases-operations-roi",
        topic: "operational AI ROI",
        hook: "Not all AI is created equal. These 5 use cases have the highest verified ROI in operations.",
        pillarId: pillarMap["ai-intelligent-ops"],
        ctaText: "Explore AI-powered operations with SZL.",
        ctaUrl: "/contact",
        status: "idea",
        visualDirectionNotes: "Template: Educational Explainer. Clean data-forward design, ROI callouts.",
      },
      {
        title: "Myth vs. Reality: Enterprise Software Procurement",
        slug: "myth-vs-reality-enterprise-procurement",
        topic: "enterprise software procurement",
        hook: "The biggest myths about enterprise software buying — from someone who has been on both sides.",
        pillarId: pillarMap["enterprise-tech"],
        ctaText: "Download the enterprise buyer guide.",
        ctaUrl: "/resources",
        status: "draft",
        visualDirectionNotes: "Template: Myth vs. Reality. Two-column contrast layout, fact-based callouts.",
      },
      {
        title: "How to Read a Maritime Intelligence Report",
        slug: "how-to-read-maritime-intelligence-report",
        topic: "maritime intelligence reporting",
        hook: "You're getting maritime intelligence reports. Here's how to actually use them to make decisions.",
        pillarId: pillarMap["maritime-supply-chain"],
        ctaText: "See a live maritime intelligence demo.",
        ctaUrl: "/vessels",
        status: "idea",
        visualDirectionNotes: "Template: Educational Explainer. Report layout references, annotated screenshots.",
      },
      {
        title: "The Executive's Enterprise AI Readiness Checklist",
        slug: "executive-enterprise-ai-readiness-checklist",
        topic: "enterprise AI readiness",
        hook: "Is your organization actually ready for enterprise AI? Most aren't — and don't know it.",
        pillarId: pillarMap["ai-intelligent-ops"],
        ctaText: "Book an AI readiness assessment.",
        ctaUrl: "/contact",
        status: "idea",
        visualDirectionNotes: "Template: Enterprise Readiness Checklist. Structured, authoritative layout.",
      },
      {
        title: "The Trend Operators Can't Ignore: Intelligent Supply Chains",
        slug: "trend-intelligent-supply-chains",
        topic: "intelligent supply chain technology",
        hook: "Intelligent supply chains aren't coming. They're already here — and they're reshaping competitive advantage.",
        pillarId: pillarMap["maritime-supply-chain"],
        ctaText: "Stay ahead. Subscribe to our weekly intelligence briefing.",
        ctaUrl: "/newsletter-landing",
        status: "idea",
        visualDirectionNotes: "Template: Trend Reaction. Forward-looking, momentum-driven design.",
      },
    ]);
    console.log("✓ Seeded 10 carousel ideas");
  } else {
    console.log(`Skipping carousels — ${existingCarousels.length} already exist`);
  }

  const existingCalendar = await db.select().from(dosContentCalendarItemsTable);
  if (existingCalendar.length === 0) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await db.insert(dosContentCalendarItemsTable).values([
      { title: "5 Supply Chain Risk Signals — Carousel", contentType: "carousel", pillarId: pillarMap["maritime-supply-chain"], channel: "linkedin", status: "planned", scheduledDate: nextWeek, notes: "Hero carousel for Q2 maritime intelligence push." },
      { title: "The Contrarian's Guide to Enterprise AI — Carousel", contentType: "carousel", pillarId: pillarMap["enterprise-tech"], channel: "linkedin", status: "in-progress", scheduledDate: twoWeeks, notes: "Pair with the AI Readiness article." },
      { title: "Weekly Intelligence Briefing #14", contentType: "newsletter", pillarId: pillarMap["maritime-supply-chain"], channel: "substack", status: "planned", scheduledDate: nextWeek, notes: "Focus: AIS intelligence + supply chain risk. Include carousel teaser." },
    ]);
    console.log("✓ Seeded 3 content calendar items");
  } else {
    console.log(`Skipping calendar — ${existingCalendar.length} already exist`);
  }

  console.log("Marketing OS seed complete.");
}

seedMarketingOS().catch(console.error);
