import {
  db,
  dosXPostsTable,
  dosNewslettersTable,
  dosArticlesTable,
  dosCarouselProjectsTable,
  dosCarouselSlidesTable,
  dosContentCalendarItemsTable,
  dosLinktreeConfigTable,
  dosEditorialPillarsTable,
} from "@szl-holdings/db";
import { count, eq } from "drizzle-orm";

async function seedDistributionOS() {
  console.log("Seeding Distribution OS content...\n");

  const [xCount] = await db.select({ count: count() }).from(dosXPostsTable);
  const [nlCount] = await db.select({ count: count() }).from(dosNewslettersTable);
  const [artCount] = await db.select({ count: count() }).from(dosArticlesTable);
  const [carCount] = await db.select({ count: count() }).from(dosCarouselProjectsTable);
  const [calCount] = await db.select({ count: count() }).from(dosContentCalendarItemsTable);
  const [ltCount] = await db.select({ count: count() }).from(dosLinktreeConfigTable);

  const pillars = await db.select().from(dosEditorialPillarsTable);
  const pillarMap = Object.fromEntries(pillars.map(p => [p.slug, p.id]));

  const xPostCount = Number(xCount.count);
  if (xPostCount < 10) {
    const needed = 10 - xPostCount;
    console.log(`Adding ${needed} more X posts (have ${xPostCount}, need 10+)...`);
    const allPosts = [
      {
        postType: "thread" as const,
        body: "🧵 Introducing SZL Holdings — a vertically-integrated AI technology holding company operating across six frontier platforms.\n\nHere's what we've built, why it matters, and where we're going. (1/6)",
        status: "queued" as const,
      },
      {
        postType: "thread" as const,
        body: "SZL Holdings owns six operating companies:\n\n• Aegis — Unified Defense & SOC\n• Vessels — Maritime Intelligence\n• Terra — Real Estate Intelligence\n• Lyte — AIOps Command Center\n• PRISM Counsel — AI-Native Legal\n• Carlota Jo — Creative Consulting\n\nEach solves a specific, high-stakes problem with AI. (2/6)",
        status: "queued" as const,
      },
      {
        postType: "thread" as const,
        body: "The thesis: domain-specific AI beats general AI.\n\nA model trained on 5 years of maritime AIS anomalies doesn't compete with GPT-4 — it beats it on the specific tasks that matter to port operators and sanctions compliance teams.\n\nProprietary data moats are real moats. (3/6)",
        status: "queued" as const,
      },
      {
        postType: "thread" as const,
        body: "We didn't build a portfolio of startups. We built an ecosystem.\n\nShared infrastructure. Shared intelligence fabric. Cross-platform data flows that make each product better because the others exist.\n\n142% aggregate YoY revenue growth across the portfolio last year. (4/6)",
        status: "queued" as const,
      },
      {
        postType: "thread" as const,
        body: "What's next:\n\n• Lyte crossing $10M ARR in Q4 2026\n• Vessels enterprise expansion (maritime intel demand is at an all-time high)\n• PRISM Counsel launching contract AI for Fortune 500 legal teams\n• Cross-portfolio go-to-market motion launching this quarter\n\n(5/6)",
        status: "queued" as const,
      },
      {
        postType: "thread" as const,
        body: "If you're an operator, executive, or investor interested in:\n- AI-native enterprise intelligence\n- Maritime, security, or real estate tech\n- The SZL ecosystem\n\nFollow for weekly signal. Link in bio for the full picture.\n\n(6/6) szlholdings.com",
        status: "queued" as const,
      },
      {
        postType: "single" as const,
        body: "Aegis is not a SIEM. It's a SOC command center.\n\nThe difference: SIEMs collect logs. Aegis correlates them against active threat intelligence, runs adversarial simulations via Firestorm, and recommends response playbooks — in real time.\n\nContinuous security validation isn't a feature. It's the baseline. 🛡️",
        status: "draft" as const,
      },
      {
        postType: "single" as const,
        body: "Dark vessel activity is up 340% since 2022.\n\nAIS data alone won't catch it. You need: satellite correlation, behavioral fingerprinting, hull-to-cargo anomaly detection, and port call network analysis.\n\nVessels Maritime Intelligence sees what traditional systems can't. ⚓",
        status: "draft" as const,
      },
      {
        postType: "single" as const,
        body: "Commercial real estate intelligence is broken.\n\nMost platforms give you data. Terra gives you decisions — vacancy risk scoring, lease expiry forecasting, capital stack analysis, and market timing signals.\n\nThe operators who move first win. The data is already there. 🏗️",
        status: "draft" as const,
      },
      {
        postType: "single" as const,
        body: "AIOps is not about alerting. It's about autonomous remediation.\n\nLyte Command Center closes the loop: signal detection → root cause analysis → remediation playbook → auto-execution → confirmation.\n\n$4.2M ARR. 93% YoY growth. The market is validating the thesis. ⚡",
        status: "draft" as const,
      },
      {
        postType: "authority" as const,
        body: "The best founders I know share one trait:\n\nThey're building for the world that will exist in 5 years, not the market that exists today.\n\nThis requires a specific tolerance for looking wrong in the short run.\n\nMost people don't have it. The ones who do build things that matter.",
        status: "draft" as const,
      },
      {
        postType: "contrarian" as const,
        body: "Unpopular take:\n\nMost enterprise AI deployments are failing not because the AI is bad — but because the data foundation is.\n\nGarbage in, garbage out applies 10x harder when the model can hallucinate confidently.\n\nFix your data before you fix your model.",
        status: "draft" as const,
      },
    ];
    await db.insert(dosXPostsTable).values(allPosts.slice(0, needed + xPostCount > allPosts.length ? allPosts.length : needed));
    console.log(`✓ Added X posts (now at ${xPostCount + needed}+)`);
  } else {
    console.log(`Skipping X posts — ${xPostCount} already exist (✓ sufficient)`);
  }

  if (Number(nlCount.count) < 2) {
    console.log("Adding newsletter seed content...");
    await db.insert(dosNewslettersTable).values([
      {
        issueNumber: 101,
        title: "Signal Over Noise — Inaugural Issue: The AI Era Demands Different Intelligence",
        subtitle: "Why proprietary data moats beat general AI, what we've built, and the signal you should be watching.",
        slug: "signal-over-noise-inaugural",
        templateType: "founder-note" as const,
        pillarId: pillarMap["ai-intelligent-ops"] || null,
        introNote: "Welcome to Signal Over Noise — a weekly briefing from SZL Holdings on AI-native enterprise intelligence, operational risk, and the patterns worth paying attention to.",
        mainStoryMarkdown: `## The Main Story: Why We Built SZL Holdings

The thesis: **vertical AI integration across critical infrastructure produces compound returns that horizontal platform companies can never match.**

Five years in, the data is in. $180M+ deployed capital. 142% aggregate YoY revenue growth. Six operating companies across six verticals.

The moat is the proprietary data and operational context that general AI cannot replicate.`,
        ctaBlock: "Want the full picture? Visit szlholdings.com or book a consultation.",
        founderSignoff: "More signal next week.\n\n— Stephen Lutar\nFounder & CEO, SZL Holdings",
        status: "approved" as const,
        substackStatus: "ready" as const,
        substackUrl: "https://szlholdings.substack.com",
        notes: "Inaugural issue — approved for publication.",
      },
      {
        issueNumber: 102,
        title: "Signal Over Noise — Issue #2: The Ops Leaders Getting AI Right",
        subtitle: "Three patterns separating AI deployments that deliver ROI from the ones that quietly fail.",
        slug: "signal-over-noise-issue-2-ops-ai",
        templateType: "strategy-memo" as const,
        pillarId: pillarMap["ai-intelligent-ops"] || null,
        introNote: "This week: the operational patterns separating enterprises that are getting real AI ROI from those stuck in pilot purgatory.",
        mainStoryMarkdown: `## Three Patterns From 40+ Operator Conversations

**Pattern 1: Fix Your Data Before Your Models**
The organizations failing at AI deployment tried to layer AI onto a broken data foundation. Winners fixed data infrastructure first.

**Pattern 2: Define 'Correct' Before 'Fast'**
Winning organizations defined what a correct AI output looked like in operational terms before optimizing for speed. Most enterprises do this backwards.

**Pattern 3: Close the Human Feedback Loop**
The best AI deployments treat human feedback as a feature, not a failure mode. When a model output is wrong, capture that signal systematically and route it back to model improvement.`,
        ctaBlock: "Lyte Command Center closes the loop from AI signal to autonomous remediation. Learn more at szlholdings.com/lyte.",
        founderSignoff: "Building the signal engine one issue at a time.\n\n— Stephen Lutar\nFounder & CEO, SZL Holdings",
        status: "draft" as const,
        substackStatus: "draft" as const,
        notes: "Second issue — drafted for review.",
      },
    ]);
    console.log("✓ Added 2 newsletter seed issues");
  } else {
    console.log(`Skipping newsletters — ${nlCount.count} already exist (✓ sufficient)`);
  }

  if (Number(artCount.count) < 3) {
    console.log("Adding article seed content...");
    await db.insert(dosArticlesTable).values([
      {
        title: "Why We Built SZL Holdings: A Thesis for the AI Infrastructure Era",
        slug: "why-we-built-szl-holdings-thesis",
        articleType: "flagship-essay" as const,
        pillarId: pillarMap["founder-executive"] || null,
        excerpt: "Most holding companies are financial constructs. We built SZL Holdings as an operating thesis with capital behind it — and the first five years have validated the core logic.",
        readTimeMinutes: 15,
        tags: ["SZL Holdings", "AI", "Enterprise", "Thesis"],
        status: "published" as const,
        siteStatus: "published" as const,
        bodyMarkdown: `# Why We Built SZL Holdings

The thesis: domain-specific AI beats general AI in high-stakes environments.

Six platforms. Six verticals. One shared intelligence fabric.

$180M+ deployed capital. 142% aggregate YoY revenue growth. 91% talent retention.

The moat is the proprietary data and operational context that general AI cannot replicate.

*— Stephen Lutar, Founder & CEO, SZL Holdings*`,
        seoTitle: "Why We Built SZL Holdings | AI Infrastructure Thesis",
        seoDescription: "The founding thesis behind SZL Holdings and what five years of building has confirmed.",
        ctaType: "contact" as const,
        ctaText: "Book a consultation to discuss how the SZL ecosystem applies to your business.",
        ctaUrl: "https://szlholdings.com/contact",
      },
      {
        title: "6 Lenses of Business Observability: The Operator's Framework",
        slug: "6-lenses-business-observability-operator-framework",
        articleType: "framework" as const,
        pillarId: pillarMap["ai-intelligent-ops"] || null,
        excerpt: "Most operators have data. Few have observability. The difference is a structured framework for turning raw telemetry into decision-quality intelligence.",
        readTimeMinutes: 10,
        tags: ["Business Observability", "Operations", "Framework", "AI"],
        status: "published" as const,
        siteStatus: "published" as const,
        bodyMarkdown: `# 6 Lenses of Business Observability

**Lens 1: Infrastructure Observability** — The foundation. Compute health, network latency, storage performance.

**Lens 2: Application Observability** — Error rates, latency, throughput, feature utilization.

**Lens 3: Business Process Observability** — Where workflows stall. Cycle times on highest-value processes.

**Lens 4: Customer Experience Observability** — Real-time session analytics, churn signal detection.

**Lens 5: Financial Observability** — Real-time revenue recognition, variance attribution.

**Lens 6: Risk & Compliance Observability** — Regulatory exposure, control failures, external intelligence integration.

The value is in the correlation across all six lenses.`,
        seoTitle: "6 Lenses of Business Observability | SZL Holdings Framework",
        seoDescription: "A structured framework for converting raw business telemetry into decision-quality intelligence.",
        ctaType: "contact" as const,
        ctaText: "Learn how Lyte implements the full observability stack for your enterprise.",
        ctaUrl: "https://szlholdings.com/lyte",
      },
      {
        title: "From Noise to Signal: How AI-Native Enterprises Make Better Decisions",
        slug: "from-noise-to-signal-enterprise-decisions",
        articleType: "founder-note" as const,
        pillarId: pillarMap["founder-executive"] || null,
        excerpt: "The enterprise data problem is not scarcity — it's an abundance of noise and a scarcity of signal. Here's how AI-native enterprises build signal extraction infrastructure.",
        readTimeMinutes: 8,
        tags: ["AI", "Decision Making", "Enterprise", "Signal"],
        status: "approved" as const,
        siteStatus: "ready" as const,
        bodyMarkdown: `# From Noise to Signal

Signal is information that changes a decision.

Three fixes AI-native enterprises make:

**1. Anomaly-first analytics** — The system tells you what to investigate. You don't have to know the question.

**2. Cross-domain correlation** — The insight lives in the intersection of supply chain, financial, and customer signals.

**3. Action-linked alerts** — Signal detection → ranked recommendations → one-click execution.

At Lyte: MTTR dropped 68%. At Vessels: analysts review 3x more incidents with 40% higher confidence.

*— Stephen Lutar, Founder & CEO, SZL Holdings*`,
        seoTitle: "From Noise to Signal: AI-Native Enterprise Decision Making",
        seoDescription: "How AI-native enterprises build signal extraction infrastructure and make better decisions faster.",
        ctaType: "subscribe" as const,
        ctaText: "Get weekly signal. Subscribe to Signal Over Noise.",
        ctaUrl: "https://szlholdings.substack.com",
      },
    ]);
    console.log("✓ Added 3 articles");
  } else {
    console.log(`Skipping articles — ${artCount.count} already exist (✓ sufficient)`);
  }

  if (Number(carCount.count) < 3) {
    console.log("Adding carousel projects...");

    const [c1] = await db.insert(dosCarouselProjectsTable).values({
      title: "The SZL Ecosystem: 6 Platforms. One Intelligence Fabric.",
      slug: "szl-ecosystem-overview-launch",
      topic: "the SZL Holdings ecosystem",
      hook: "Most holding companies are financial constructs. SZL Holdings is an operating system.",
      pillarId: pillarMap["founder-executive"] || null,
      linkedinShortCaption: "Most holding companies are financial constructs. SZL Holdings is an operating system.\n\nHere's what that means in practice.\n\n↓ Swipe through ↓\n\nLearn more at szlholdings.com",
      linkedinLongCaption: "Most holding companies are financial constructs. SZL Holdings is an operating system.\n\nSix platforms. Six verticals. One shared intelligence fabric.\n\n→ Aegis: Defense & SOC\n→ Vessels: Maritime Intelligence\n→ Terra: Real Estate Intelligence\n→ Lyte: AIOps\n→ PRISM Counsel: Legal Intelligence\n→ Carlota Jo: Creative Consulting\n\n142% aggregate YoY growth. 91% retention.\n\n#AI #EnterpriseAI #SZLHoldings",
      xThreadAdaptation: "Thread: The SZL Holdings ecosystem.\n\n1/ Most holding companies are financial constructs. SZL Holdings is an operating thesis.\n2/ Six platforms, six verticals, one shared intelligence fabric.\n3/ Domain-specific AI beats general AI. The moat is the proprietary data.\n4/ 142% aggregate YoY growth. 91% talent retention. $180M+ deployed.\n→ szlholdings.com",
      instagramCaption: "Most holding companies are financial constructs. SZL Holdings is an operating system.\n\nSwipe for the full breakdown. ✦\n\n#AI #EnterpriseAI #SZLHoldings",
      visualDirectionNotes: "Dark charcoal background. Gold accents. Each platform gets its own slide. SZL logo on outro.",
      aiCarouselsImportBlock: "[Intro] SZL Holdings/6 Platforms. One Intelligence Fabric./Most holding companies are financial constructs. SZL Holdings is an operating system.\n[Slide 2] Aegis/Unified Defense & SOC. Continuous adversarial simulation.\n[Slide 3] Vessels/Maritime Intelligence. AIS anomaly detection. Dark vessel tracking.\n[Slide 4] Terra/Real Estate Intelligence. Vacancy risk. Lease expiry. Capital stack.\n[Slide 5] Lyte/$4.2M ARR. AIOps command center. 93% YoY growth.\n[Slide 6] PRISM Counsel/AI-Native Legal Intelligence. Fortune 500 legal teams.\n[Slide 7] Carlota Jo/Creative Intelligence Consulting.\n[Slide 8] The Shared Fabric/142% aggregate YoY growth. One intelligence layer.\n[Outro] SZL Holdings/szlholdings.com/Structured ventures. Clear direction.",
      ctaText: "Explore szlholdings.com",
      ctaUrl: "https://szlholdings.com",
      status: "exported" as const,
    }).returning();

    await db.insert(dosCarouselSlidesTable).values([
      { projectId: c1.id, slideNumber: 1, slideType: "intro" as const, tagline: "SZL Holdings", title: "6 Platforms. One Intelligence Fabric.", paragraph: "Most holding companies are financial constructs. SZL Holdings is an operating system." },
      { projectId: c1.id, slideNumber: 2, slideType: "content" as const, title: "Aegis — Defense & SOC", paragraph: "Unified Defense & SOC Command Center. Continuous adversarial simulation. MITRE ATT&CK automation. Real-time threat correlation." },
      { projectId: c1.id, slideNumber: 3, slideType: "content" as const, title: "Vessels — Maritime Intelligence", paragraph: "AIS anomaly detection. Dark vessel tracking. Sanctions compliance. Climate routing overlays." },
      { projectId: c1.id, slideNumber: 4, slideType: "content" as const, title: "Terra — Real Estate Intelligence", paragraph: "Vacancy risk scoring. Lease expiry forecasting. Capital stack analysis. Market timing signals." },
      { projectId: c1.id, slideNumber: 5, slideType: "content" as const, title: "Lyte — AIOps Command Center", paragraph: "$4.2M ARR. Signal-to-remediation loop. 93% YoY growth. The AIOps market is consolidating here." },
      { projectId: c1.id, slideNumber: 6, slideType: "content" as const, title: "PRISM Counsel — Legal Intelligence", paragraph: "AI-Native Legal Intelligence. Complex matter management. Built for Fortune 500 legal teams." },
      { projectId: c1.id, slideNumber: 7, slideType: "content" as const, title: "Carlota Jo — Creative Consulting", paragraph: "AI-powered content strategy. Brand intelligence. The operational model for AI-augmented creative work." },
      { projectId: c1.id, slideNumber: 8, slideType: "content" as const, title: "The Shared Intelligence Fabric", paragraph: "One intelligence layer across all six. 142% aggregate YoY revenue growth. 91% talent retention." },
      { projectId: c1.id, slideNumber: 9, slideType: "outro" as const, tagline: "SZL Holdings", title: "Explore the full ecosystem at szlholdings.com", paragraph: "Structured ventures. Clear direction.", callToAction: "szlholdings.com" },
    ]);

    const [c2] = await db.insert(dosCarouselProjectsTable).values({
      title: "6 Lenses of Business Observability: The Operator's Framework",
      slug: "6-lenses-observability-carousel",
      topic: "business observability for enterprise operators",
      hook: "Most operators have data. Very few have observability. Here's the 6-lens framework.",
      pillarId: pillarMap["ai-intelligent-ops"] || null,
      linkedinShortCaption: "Most operators have data. Very few have observability.\n\nHere's the 6-lens framework.\n\n↓ Swipe ↓\n\nFull framework at szlholdings.com/insights",
      linkedinLongCaption: "Most operators have data. Very few have observability.\n\nSix lenses every enterprise needs:\n→ Infrastructure Observability\n→ Application Observability\n→ Business Process Observability\n→ Customer Experience Observability\n→ Financial Observability\n→ Risk & Compliance Observability\n\nMost have strong Lens 1-2. Almost none have systematic Lens 5-6.\n\n#Observability #Operations #AI #SZLHoldings",
      xThreadAdaptation: "Thread: Business observability — 6 lenses for operators.\n1/ Most have Lens 1-2 (infra/app). Almost none have Lens 5-6 (financial/risk).\n2/ Lens 3: Process Observability — where workflows stall.\n3/ Lens 4: CX Observability — churn detection before customers escalate.\n4/ Lens 5-6: Financial + Risk Observability — eliminate the quarterly surprise.\n→ Full framework at szlholdings.com/insights",
      instagramCaption: "Most operators have data. Very few have observability.\n\nSwipe for the 6-lens framework. ✦\n\n#Observability #AI #SZLHoldings",
      visualDirectionNotes: "Educational explainer template. Professional design. Color-coded lenses.",
      aiCarouselsImportBlock: "[Intro] Business Observability/6 Lenses. One Framework./Most operators have data. Very few have observability.\n[Slide 2] Lens 1-2/Infrastructure & Application Observability. The baseline. Most enterprises have this.\n[Slide 3] Lens 3/Business Process Observability. Where workflows stall. Cycle times on highest-value processes.\n[Slide 4] Lens 4/Customer Experience Observability. Real-time churn detection. Proactive intervention.\n[Slide 5] Lens 5/Financial Observability. Real-time revenue. Variance attribution. No surprises.\n[Slide 6] Lens 6/Risk & Compliance Observability. Regulatory exposure. Control failures. External intelligence.\n[Outro] SZL Holdings/szlholdings.com/insights/Structured ventures. Clear direction.",
      ctaText: "Full framework at szlholdings.com/insights",
      ctaUrl: "https://szlholdings.com/insights",
      status: "ready" as const,
    }).returning();

    await db.insert(dosCarouselSlidesTable).values([
      { projectId: c2.id, slideNumber: 1, slideType: "intro" as const, tagline: "Business Observability", title: "Most operators have data. Very few have observability. Here's the 6-lens framework.", paragraph: "A breakdown for operators and executives who want decision-quality intelligence." },
      { projectId: c2.id, slideNumber: 2, slideType: "content" as const, title: "Lens 1-2: Infrastructure & Application", paragraph: "The foundation. Most enterprises have this. It's the prerequisite — not the competitive advantage." },
      { projectId: c2.id, slideNumber: 3, slideType: "content" as const, title: "Lens 3: Business Process Observability", paragraph: "Where are processes stalling? What is the cycle time on your highest-value workflows? Most organizations have no systematic answer." },
      { projectId: c2.id, slideNumber: 4, slideType: "content" as const, title: "Lens 4: Customer Experience Observability", paragraph: "Real-time session analytics, churn signal detection, proactive intervention before customers escalate." },
      { projectId: c2.id, slideNumber: 5, slideType: "content" as const, title: "Lens 5: Financial Observability", paragraph: "Real-time revenue recognition. Margin by product/segment. Variance attribution. Eliminate the quarterly surprise." },
      { projectId: c2.id, slideNumber: 6, slideType: "content" as const, title: "Lens 6: Risk & Compliance Observability", paragraph: "Monitor regulatory exposure, control failures, and operational risk with external intelligence feeds." },
      { projectId: c2.id, slideNumber: 7, slideType: "outro" as const, tagline: "SZL Holdings", title: "Full framework at szlholdings.com/insights", paragraph: "Structured ventures. Clear direction.", callToAction: "szlholdings.com/insights" },
    ]);

    const [c3] = await db.insert(dosCarouselProjectsTable).values({
      title: "From Noise to Signal: How AI-Native Enterprises Decide Faster",
      slug: "from-noise-to-signal-carousel-launch",
      topic: "AI-native enterprise decision making",
      hook: "Your enterprise has too much data and too little signal. Here's how AI-native operators fix that.",
      pillarId: pillarMap["ai-intelligent-ops"] || null,
      linkedinShortCaption: "Your enterprise has too much data and too little signal.\n\nHere's how AI-native operators fix that.\n\n↓ Swipe ↓\n\nFull playbook at szlholdings.com/insights",
      linkedinLongCaption: "Your enterprise has too much data and too little signal.\n\nThree fixes:\n1. Anomaly-first analytics\n2. Cross-domain correlation\n3. Action-linked alerts\n\nAt Lyte: MTTR dropped 68%. At Vessels: analysts review 3x more incidents with 40% higher confidence.\n\n#AI #EnterpriseAI #Operations #SZLHoldings",
      xThreadAdaptation: "Thread: From noise to signal — how AI-native enterprises decide faster.\n1/ Signal = information that changes a decision. Most dashboards deliver data, not signal.\n2/ Fix 1: Anomaly-first analytics. The system finds what matters.\n3/ Fix 2: Cross-domain correlation. Insight lives in the intersection.\n4/ Fix 3: Action-linked alerts. Not dashboards — decision infrastructure.\n→ szlholdings.com/insights",
      instagramCaption: "Too much data, too little signal.\n\nSwipe for the three fixes. ✦\n\n#AI #DataStrategy #SZLHoldings",
      visualDirectionNotes: "Arrow/signal visual motif. Dark to light progression showing noise-to-clarity transformation.",
      aiCarouselsImportBlock: "[Intro] Signal Intelligence/From Noise to Signal/Your enterprise has too much data and too little signal. Here's the fix.\n[Slide 2] The Problem/Signal = information that changes a decision. Most dashboards deliver data. Very few deliver signal.\n[Slide 3] Fix 1: Anomaly-First/The system tells you what to investigate. You don't have to know the question.\n[Slide 4] Fix 2: Cross-Domain Correlation/The insight lives at the intersection of supply chain, financial, and customer signals.\n[Slide 5] Fix 3: Action-Linked Alerts/Signal detection → recommendations → one-click execution.\n[Slide 6] The Results/Lyte: MTTR -68%. Vessels: 3x more incidents reviewed with 40% higher confidence.\n[Outro] SZL Holdings/szlholdings.com/insights/Structured ventures. Clear direction.",
      ctaText: "Full playbook at szlholdings.com/insights",
      ctaUrl: "https://szlholdings.com/insights",
      status: "draft" as const,
    }).returning();

    await db.insert(dosCarouselSlidesTable).values([
      { projectId: c3.id, slideNumber: 1, slideType: "intro" as const, tagline: "Signal Intelligence", title: "From Noise to Signal: How AI-Native Enterprises Decide Faster", paragraph: "Your enterprise has too much data and too little signal. Here's the three-step fix." },
      { projectId: c3.id, slideNumber: 2, slideType: "content" as const, title: "The Problem", paragraph: "Signal = information that changes a decision. Most dashboards deliver data. Very few deliver signal." },
      { projectId: c3.id, slideNumber: 3, slideType: "content" as const, title: "Fix 1: Anomaly-First Analytics", paragraph: "The system tells you what to investigate. You don't have to know the question in advance." },
      { projectId: c3.id, slideNumber: 4, slideType: "content" as const, title: "Fix 2: Cross-Domain Correlation", paragraph: "A supply chain delay is also a revenue risk and a customer experience signal. Correlate across domains in real time." },
      { projectId: c3.id, slideNumber: 5, slideType: "content" as const, title: "Fix 3: Action-Linked Alerts", paragraph: "Signal detection → ranked recommendations → one-click execution. Not dashboards — decision infrastructure." },
      { projectId: c3.id, slideNumber: 6, slideType: "content" as const, title: "What This Looks Like", paragraph: "Lyte: MTTR dropped 68%. Vessels: analysts review 3x more incidents with 40% higher confidence." },
      { projectId: c3.id, slideNumber: 7, slideType: "outro" as const, tagline: "SZL Holdings", title: "Full playbook at szlholdings.com/insights", paragraph: "Structured ventures. Clear direction.", callToAction: "szlholdings.com/insights" },
    ]);

    console.log("✓ Added 3 carousel projects with full slide decks");
  } else {
    console.log(`Skipping carousels — ${carCount.count} already exist (✓ sufficient)`);
  }

  if (Number(calCount.count) < 7) {
    console.log("Adding content calendar items (7-day launch schedule)...");
    const today = new Date("2026-04-08");
    const day = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d;
    };

    await db.insert(dosContentCalendarItemsTable).values([
      {
        title: "Publish 'Why We Built SZL Holdings' flagship article to site",
        contentType: "article" as const,
        channel: "site",
        status: "published" as const,
        scheduledDate: day(-2),
        owner: "Stephen Lutar",
        notes: "Flagship essay published to szlholdings.com/insights.",
        destinationUrl: "https://szlholdings.com/insights",
        targetAudience: "Enterprise operators, investors, founders",
      },
      {
        title: "Send Signal Over Noise inaugural issue via Substack",
        contentType: "newsletter" as const,
        channel: "substack",
        status: "published" as const,
        scheduledDate: day(-2),
        owner: "Stephen Lutar",
        notes: "Inaugural newsletter. AI Era positioning.",
        destinationUrl: "https://szlholdings.substack.com",
        targetAudience: "Newsletter subscribers, LinkedIn connections",
      },
      {
        title: "Publish X thread: Introducing SZL Holdings (6-part pinned thread)",
        contentType: "x-post" as const,
        channel: "x",
        status: "ready" as const,
        scheduledDate: day(-1),
        owner: "Stephen Lutar",
        notes: "6-tweet pinned thread. Pin to profile immediately after posting.",
        destinationUrl: "https://x.com/szlholdings",
        targetAudience: "X followers, enterprise tech audience",
      },
      {
        title: "Publish 'The SZL Ecosystem' carousel to LinkedIn",
        contentType: "carousel" as const,
        channel: "linkedin",
        status: "ready" as const,
        scheduledDate: day(0),
        owner: "Stephen Lutar",
        notes: "9-slide ecosystem overview. Use long LinkedIn caption.",
        destinationUrl: "https://linkedin.com/company/szl-holdings",
        targetAudience: "LinkedIn enterprise audience, CTO/COO/CIO personas",
      },
      {
        title: "Cross-post flagship article to Medium",
        contentType: "article" as const,
        channel: "medium",
        status: "planned" as const,
        scheduledDate: day(1),
        owner: "Stephen Lutar",
        notes: "Cross-post with canonical URL pointing to szlholdings.com.",
        destinationUrl: "https://medium.com/@stephen_38454",
        targetAudience: "Medium enterprise/startup/AI audience",
      },
      {
        title: "Publish '6 Lenses of Business Observability' article to site",
        contentType: "article" as const,
        channel: "site",
        status: "planned" as const,
        scheduledDate: day(2),
        owner: "Stephen Lutar",
        notes: "Framework article establishing thought leadership in observability.",
        destinationUrl: "https://szlholdings.com/insights",
        targetAudience: "COOs, ops leaders, enterprise tech buyers",
      },
      {
        title: "Publish '6 Lenses' carousel to LinkedIn",
        contentType: "carousel" as const,
        channel: "linkedin",
        status: "planned" as const,
        scheduledDate: day(2),
        owner: "Stephen Lutar",
        notes: "Framework carousel paired with article. Link to full article.",
        destinationUrl: "https://szlholdings.com/insights",
        targetAudience: "Enterprise ops leaders, COOs, AI buyers",
      },
      {
        title: "X platform spotlight posts: Vessels + Terra",
        contentType: "x-post" as const,
        channel: "x",
        status: "planned" as const,
        scheduledDate: day(3),
        owner: "Stephen Lutar",
        notes: "Two standalone spotlight tweets — Vessels maritime intelligence and Terra real estate.",
        destinationUrl: "https://x.com/szlholdings",
        targetAudience: "Maritime operators, real estate tech audience",
      },
      {
        title: "Send Signal Over Noise Issue #2 via Substack",
        contentType: "newsletter" as const,
        channel: "substack",
        status: "in-progress" as const,
        scheduledDate: day(5),
        owner: "Stephen Lutar",
        notes: "Second newsletter: 'The Ops Leaders Getting AI Right'. Three patterns from 40+ operator conversations.",
        destinationUrl: "https://szlholdings.substack.com",
        targetAudience: "Newsletter subscribers, LinkedIn enterprise audience",
      },
      {
        title: "Publish 'From Noise to Signal' article to site",
        contentType: "article" as const,
        channel: "site",
        status: "planned" as const,
        scheduledDate: day(6),
        owner: "Stephen Lutar",
        notes: "Founder note on signal extraction. Third article in week-one sequence.",
        destinationUrl: "https://szlholdings.com/insights",
        targetAudience: "Enterprise operators, AI buyers, founders",
      },
    ]);
    console.log("✓ Added 10 content calendar items (7-day launch schedule)");
  } else {
    console.log(`Skipping calendar — ${calCount.count} already exist (✓ sufficient)`);
  }

  if (Number(ltCount.count) < 8) {
    console.log("Adding linktree items with real external URLs...");
    const existing = await db.select().from(dosLinktreeConfigTable);
    const existingLabels = new Set(existing.map(e => e.label));
    const toAdd = [
      { label: "Newsletter — Get the Weekly Brief", destination: "https://szlholdings.substack.com", campaignTag: "newsletter", contentTag: "newsletter", sortOrder: 0, isActive: true },
      { label: "SZL Holdings — Platform Overview", destination: "https://szlholdings.com", campaignTag: "homepage", contentTag: "website", sortOrder: 1, isActive: true },
      { label: "Latest Insights & Analysis", destination: "https://szlholdings.com/insights", campaignTag: "insights", contentTag: "insights", sortOrder: 2, isActive: true },
      { label: "Aegis — Defense & SOC Command", destination: "https://szlholdings.com/solutions/aegis", campaignTag: "aegis", contentTag: "security", sortOrder: 3, isActive: true },
      { label: "Vessels — Maritime Intelligence", destination: "https://szlholdings.com/solutions/vessels", campaignTag: "vessels", contentTag: "maritime", sortOrder: 4, isActive: true },
      { label: "Terra — Real Estate Intelligence", destination: "https://szlholdings.com/solutions/terra", campaignTag: "terra", contentTag: "real-estate", sortOrder: 5, isActive: true },
      { label: "Lyte — AIOps Command Center", destination: "https://szlholdings.com/solutions/lyte", campaignTag: "lyte", contentTag: "automation", sortOrder: 6, isActive: true },
      { label: "PRISM Counsel — AI-Native Legal", destination: "https://szlholdings.com/solutions/prism-counsel", campaignTag: "prism-counsel", contentTag: "ai", sortOrder: 7, isActive: true },
      { label: "Carlota Jo — Creative Consulting", destination: "https://szlholdings.com/solutions/carlota-jo", campaignTag: "carlota-jo", contentTag: "consulting", sortOrder: 8, isActive: true },
      { label: "Work With Me — Private Inquiry", destination: "https://szlholdings.com/contact", campaignTag: "contact", contentTag: "portfolio", sortOrder: 9, isActive: true },
    ].filter(item => !existingLabels.has(item.label));

    if (toAdd.length > 0) {
      await db.insert(dosLinktreeConfigTable).values(toAdd);
      console.log(`✓ Added ${toAdd.length} linktree items`);
    } else {
      console.log("Linktree items already populated");
    }
  } else {
    console.log(`Skipping linktree — ${ltCount.count} already exist (✓ sufficient)`);
  }

  console.log("\n✅ Distribution OS seed complete.");
}

seedDistributionOS().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
