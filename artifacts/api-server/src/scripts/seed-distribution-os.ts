import {
  db,
  dosArticlesTable,
  dosAuthorProfilesTable,
  dosCampaignLinksTable,
  dosCampaignsTable,
  dosCarouselProjectsTable,
  dosCarouselSlidesTable,
  dosContentCalendarItemsTable,
  dosCtaBlocksTable,
  dosDistributionTargetsTable,
  dosEditorialPillarsTable,
  dosLeadsTable,
  dosNewslettersTable,
  dosSiteSettingsTable,
  dosXPostsTable,
} from '@szl-holdings/db';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function daysAhead(n: number) {
  return new Date(Date.now() + n * 86400000);
}

export async function seedDistributionOS() {

  const existing = await db
    .select({ id: dosEditorialPillarsTable.id })
    .from(dosEditorialPillarsTable)
    .limit(1);
  if (existing.length > 0) {
    return { skipped: true };
  }

  const pillars = await db
    .insert(dosEditorialPillarsTable)
    .values([
      {
        name: 'AI & Autonomous Operations',
        slug: 'ai-autonomous-ops',
        description:
          'Perspectives on AI-native software, autonomous agents, and the future of enterprise automation.',
        color: '#6366f1',
        isFavorite: true,
        sortOrder: 1,
      },
      {
        name: 'Maritime & Logistics Intelligence',
        slug: 'maritime-logistics',
        description:
          'Deep analysis of global shipping, freight markets, and maritime technology transformation.',
        color: '#06b6d4',
        isFavorite: true,
        sortOrder: 2,
      },
      {
        name: 'Legal Technology',
        slug: 'legal-technology',
        description:
          'The intersection of AI and the legal industry — practice management, demand intelligence, and access to justice.',
        color: '#7c3aed',
        isFavorite: false,
        sortOrder: 3,
      },
      {
        name: 'Founder Operating System',
        slug: 'founder-os',
        description:
          'Strategic frameworks and operational playbooks for technical founders building B2B companies.',
        color: '#f59e0b',
        isFavorite: true,
        sortOrder: 4,
      },
      {
        name: 'Cybersecurity & Trust',
        slug: 'cybersecurity-trust',
        description:
          'Enterprise security intelligence, threat landscape analysis, and building secure-by-default systems.',
        color: '#ef4444',
        isFavorite: false,
        sortOrder: 5,
      },
      {
        name: 'Real Estate & Capital Markets',
        slug: 'real-estate-capital',
        description:
          'Distressed property intelligence, PropTech, and alternative investment in NYC real estate.',
        color: '#10b981',
        isFavorite: false,
        sortOrder: 6,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const authors = await db
    .insert(dosAuthorProfilesTable)
    .values([
      {
        name: 'Stephen L.',
        slug: 'stephen-l',
        title: 'Founder & CEO, SZL Holdings',
        bioShort:
          'Builder of AI-native platforms across maritime, legal, security, and real estate. Writing about autonomous systems, vertical AI, and the future of enterprise software.',
        bioLong:
          "Stephen L. is the founder and CEO of SZL Holdings, an AI-native platform ecosystem serving maritime operators, plaintiff law firms, cybersecurity teams, and real estate investors. He writes extensively on autonomous agents, AI operating systems, and the practical reality of building AI-first products in specialized verticals. His work appears across the company's content properties and speaks directly to operators, technical founders, and enterprise buyers.",
        linkedinUrl: 'https://linkedin.com/in/stephenl',
        xUrl: 'https://x.com/stephenl',
        websiteUrl: 'https://stephenlutar.com',
        isDefault: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db
    .insert(dosSiteSettingsTable)
    .values([
      { key: 'company_name', value: 'SZL Holdings', category: 'company', label: 'Company Name' },
      {
        key: 'company_tagline',
        value: 'AI-native platforms for specialized verticals',
        category: 'company',
        label: 'Company Tagline',
      },
      {
        key: 'company_website',
        value: 'https://szlholdings.com',
        category: 'company',
        label: 'Company Website',
      },
      { key: 'x_handle', value: '@szlholdings', category: 'social', label: 'X Handle' },
      {
        key: 'linkedin_company_url',
        value: 'https://linkedin.com/company/szl-holdings',
        category: 'social',
        label: 'LinkedIn Company URL',
      },
      {
        key: 'substack_url',
        value: 'https://szlholdings.substack.com',
        category: 'integration',
        label: 'Substack URL',
      },
      { key: 'default_author_id', value: '1', category: 'author', label: 'Default Author ID' },
      {
        key: 'default_cta_type',
        value: 'subscribe',
        category: 'publishing',
        label: 'Default CTA Type',
      },
      {
        key: 'default_cta_text',
        value: 'Subscribe to The Operator',
        category: 'publishing',
        label: 'Default CTA Text',
      },
      {
        key: 'publishing_timezone',
        value: 'America/New_York',
        category: 'publishing',
        label: 'Publishing Timezone',
      },
    ])
    .onConflictDoNothing();

  const campaigns = await db
    .insert(dosCampaignsTable)
    .values([
      {
        name: 'Q2 2026 AI Platform Launch',
        slug: 'q2-2026-ai-platform-launch',
        description:
          'Content campaign supporting the Alloy AI platform general availability announcement.',
        status: 'active',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-06-30'),
        owner: 'Stephen L.',
        totalClicks: 1840,
        totalConversions: 142,
      },
      {
        name: 'Maritime Intelligence Series',
        slug: 'maritime-intelligence-series',
        description:
          'Deep-dive content series on AI applications in maritime operations, fleet management, and cargo optimization.',
        status: 'active',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-07-31'),
        owner: 'Stephen L.',
        totalClicks: 2240,
        totalConversions: 188,
      },
      {
        name: 'Legal Tech Thought Leadership',
        slug: 'legal-tech-thought-leadership',
        description:
          'Positioning SZL Holdings as the leading voice on AI in plaintiff legal practice.',
        status: 'draft',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-09-30'),
        owner: 'Stephen L.',
        totalClicks: 0,
        totalConversions: 0,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const articles = await db
    .insert(dosArticlesTable)
    .values([
      {
        title:
          "The Agent-First Enterprise: Why Autonomous AI Is Not a Feature — It's the Architecture",
        subtitle:
          'A framework for rebuilding enterprise workflows with autonomous agents at the center, not the edge.',
        slug: 'agent-first-enterprise-architecture',
        pillarId: pillars[0]?.id,
        authorId: authors[0]?.id,
        articleType: 'flagship-essay',
        targetAudience: 'CTO/CPO and technical founders in enterprise SaaS',
        thesis:
          'Organizations that retrofit AI onto legacy workflows will lose to those who design autonomous agent workflows from the ground up.',
        summary:
          'This essay argues that the fundamental unit of enterprise work is shifting from the human task to the agent-mediated task, and that companies who treat AI as a feature layer will be disrupted by those treating it as architecture.',
        excerpt:
          "We are building the wrong way. Not wrong in execution — wrong in the underlying model. Adding AI to existing workflows assumes the workflow is the right atom of work. It isn't. The agent is.",
        bodyMarkdown: `## The Legacy Trap\n\nMost enterprise AI deployments follow a familiar pattern: identify a manual task, automate it with a model, declare victory. The task list shortens. Productivity gains are logged. Investors are satisfied.\n\nBut the trap is subtle. By optimizing tasks, you entrench the workflow. And the workflow was designed for humans.\n\n## The Agent-First Alternative\n\nAgent-first architecture starts differently. Instead of asking "what task should we automate?" it asks: "If we had an autonomous agent with access to our data, our tools, and our domain knowledge — what would the right workflow look like?"\n\nThe answer is almost never the existing one.\n\n## What Changes\n\n- Decision cycles compress from days to minutes\n- Human judgment is reserved for edge cases and high-stakes exceptions\n- Workflows are defined by capability chains, not org chart reporting lines\n- The operating model becomes: observe → reason → act → learn\n\n## Implications for Enterprise Buyers\n\nThe organizations winning with AI are not buying AI features. They are building AI substrates — agent registries, skill inventories, knowledge graphs, and governance layers that make autonomous operation safe and auditable.\n\nThis is not theoretical. This is what we built across SZL Holdings' portfolio.`,
        readTimeMinutes: 12,
        seoTitle: 'Agent-First Enterprise Architecture | SZL Holdings',
        seoDescription:
          'Why autonomous AI is not a feature but a fundamental architectural shift. A framework for building agent-first enterprise workflows.',
        tags: ['AI', 'autonomous agents', 'enterprise software', 'architecture'],
        keywords: [
          'agent-first',
          'autonomous AI',
          'enterprise AI',
          'AI agents',
          'workflow automation',
        ],
        ctaType: 'subscribe',
        ctaText: 'Subscribe to The Operator — weekly AI strategy for enterprise builders',
        status: 'published',
        siteStatus: 'published',
        xStatus: 'sent',
        mediumStatus: 'published',
        substackStatus: 'published',
        approvedForAutoSend: true,
        reviewRequired: false,
        publishedSiteAt: daysAgo(14),
        publishedXAt: daysAgo(14),
        publishedMediumAt: daysAgo(13),
        publishedSubstackAt: daysAgo(13),
        campaignId: campaigns[0]?.id,
      },
      {
        title:
          'Baltic Exchange Decoded: What Shipping Rates Actually Tell You About the Global Economy',
        subtitle:
          "A practitioner's guide to reading the BDI, FFA markets, and freight rate signals for non-shipping professionals.",
        slug: 'baltic-exchange-decoded-shipping-rates-global-economy',
        pillarId: pillars[1]?.id,
        authorId: authors[0]?.id,
        articleType: 'framework',
        targetAudience: 'Investors, commodity traders, supply chain executives',
        thesis:
          "The Baltic Dry Index and freight rate markets are leading indicators most mainstream analysts ignore because they don't know how to read them.",
        summary:
          "A practitioner's guide to interpreting shipping rate data — BDI, time charter rates, bunker fuel prices — as real-time intelligence on global demand, trade flows, and economic health.",
        excerpt:
          "Every day the Baltic Exchange publishes data that most sophisticated investors ignore. Not because it's irrelevant — it's among the most accurate real-time economic indicators available. They ignore it because it requires context most don't have.",
        readTimeMinutes: 10,
        tags: ['shipping', 'freight markets', 'Baltic Dry Index', 'global economy', 'maritime'],
        keywords: [
          'Baltic Dry Index',
          'BDI',
          'freight rates',
          'shipping intelligence',
          'maritime economics',
        ],
        ctaType: 'subscribe',
        ctaText: 'Get maritime intelligence in your inbox every week',
        status: 'published',
        siteStatus: 'published',
        xStatus: 'sent',
        substackStatus: 'published',
        approvedForAutoSend: true,
        reviewRequired: false,
        publishedSiteAt: daysAgo(7),
        publishedXAt: daysAgo(7),
        publishedSubstackAt: daysAgo(6),
        campaignId: campaigns[1]?.id,
      },
      {
        title:
          'Why AI Will Not Replace Your Plaintiff Attorney — But Will Fire Every Lazy Insurance Adjuster',
        subtitle:
          'The actual impact of AI on plaintiff law firms: not replacement, but radical asymmetry.',
        slug: 'ai-plaintiff-law-insurance-adjuster-asymmetry',
        pillarId: pillars[2]?.id,
        authorId: authors[0]?.id,
        articleType: 'contrarian-pov',
        targetAudience: 'Plaintiff attorneys, legal tech buyers, litigation finance',
        thesis:
          'AI in plaintiff law creates massive asymmetric advantage for attorneys willing to use it — while insurers are slower to adapt.',
        summary:
          "Counter-narrative to the 'AI will replace lawyers' claim. In plaintiff law specifically, AI does the opposite: it empowers attorneys who use it to operate like firms 10x their size.",
        excerpt:
          "The insurance industry has been running AI playbooks for 20 years. Claims triage, fraud detection, reserve modeling. What they have not done is given that intelligence to plaintiffs. We're changing that.",
        readTimeMinutes: 8,
        tags: ['legal AI', 'plaintiff law', 'insurance', 'legal tech', 'settlement intelligence'],
        keywords: [
          'AI plaintiff law',
          'legal AI',
          'settlement forecasting',
          'insurance claims',
          'Counsel',
        ],
        ctaType: 'demo',
        ctaText: 'See Counsel in action',
        ctaUrl: 'https://prismcounsel.szlholdings.com',
        status: 'in-review',
        siteStatus: 'draft',
        xStatus: 'draft',
        approvedForAutoSend: false,
        reviewRequired: true,
        publishTargetDate: daysAhead(5),
        campaignId: campaigns[2]?.id,
      },
      {
        title: "The Founder's Governance Debt Problem",
        subtitle:
          'How AI-native companies are accumulating governance debt faster than they can pay it down.',
        slug: 'founders-governance-debt-problem',
        pillarId: pillars[3]?.id,
        authorId: authors[0]?.id,
        articleType: 'founder-memo',
        targetAudience: 'Technical founders, CTOs, platform engineering leads',
        thesis:
          'Every AI feature shipped without governance infrastructure creates debt that compounds — and becomes impossible to pay down at scale.',
        summary:
          'A memo for founders on the quiet accumulation of AI governance debt: cost controls, access policies, audit trails, and model routing. Cheap now. Catastrophic later.',
        excerpt:
          'You are shipping AI features. Your team is moving fast. Customers are happy. You have approximately 6–12 months before governance debt becomes existential.',
        readTimeMinutes: 7,
        tags: ['AI governance', 'founder advice', 'platform engineering', 'enterprise AI'],
        keywords: [
          'AI governance',
          'governance debt',
          'AI policy',
          'cost controls',
          'founder operating system',
        ],
        status: 'approved',
        siteStatus: 'ready',
        xStatus: 'ready',
        approvedForAutoSend: true,
        reviewRequired: false,
        publishTargetDate: daysAhead(2),
      },
      {
        title: '10 Security Mistakes That Take Down Series B Companies',
        subtitle:
          "A security engineer's brutal post-mortem on the most common and preventable catastrophic failures.",
        slug: 'security-mistakes-series-b-companies',
        pillarId: pillars[4]?.id,
        authorId: authors[0]?.id,
        articleType: 'operator-checklist',
        targetAudience: 'Engineering leaders, CTOs, security teams at Series A/B companies',
        thesis:
          'Series B companies fail at security not from sophisticated attacks — from the same 10 preventable mistakes.',
        summary:
          'A no-mercy checklist of the security failures that sink growing companies: unauthenticated Redis, leaked secrets in source code, over-privileged IAM roles, and 7 more.',
        excerpt:
          'I have seen all 10 of these in the last 18 months. Some in one company. If you can check every item on this list with confidence, you are in the top 10% of security posture at your stage.',
        readTimeMinutes: 9,
        tags: ['security', 'startup security', 'cybersecurity', 'engineering'],
        keywords: [
          'startup security',
          'cybersecurity checklist',
          'Series B security',
          'infrastructure security',
        ],
        status: 'draft',
        siteStatus: 'draft',
        xStatus: 'none',
        approvedForAutoSend: false,
        reviewRequired: true,
        publishTargetDate: daysAhead(21),
      },
    ])
    .onConflictDoNothing()
    .returning();

  const newsletters = await db
    .insert(dosNewslettersTable)
    .values([
      {
        issueNumber: 14,
        title: 'The Operator — Issue 14: Agent Architectures & Maritime Rate Signals',
        subtitle:
          'This week: building agent-first platforms, reading the BDI, and why governance debt is coming for you.',
        slug: 'the-operator-issue-14',
        templateType: 'weekly-briefing',
        pillarId: pillars[0]?.id,
        authorId: authors[0]?.id,
        introNote:
          "Welcome back to The Operator. This week I want to connect two threads: autonomous agent architecture (what we're building) and Baltic freight markets (what we're seeing in our maritime platform). The link is in how both require reading second-order signals.",
        mainStoryMarkdown:
          "## Agent-First Is the Next Platform Shift\n\nEvery platform shift has a canonical architecture that separates winners from laggards. For mobile, it was the native app. For cloud, it was the 12-factor app. For AI, it's going to be the agent-native platform.\n\nI've spent the past 6 months watching how our customers at Vessels, Counsel, and Aegis actually use AI versus what they asked for. The pattern is consistent: the value is not in the feature. It's in the workflow change that the feature enables.\n\nMore on this in Friday's full piece.",
        status: 'published',
        substackStatus: 'published',
        substackUrl: 'https://szlholdings.substack.com/p/the-operator-14',
        publishedAt: daysAgo(7),
        campaignId: campaigns[0]?.id,
      },
      {
        issueNumber: 15,
        title: 'The Operator — Issue 15: AI Governance Debt & The Insurer Intelligence Gap',
        subtitle:
          'Governance debt is compounding quietly. And why plaintiff attorneys using AI are going to embarrass the insurance industry.',
        slug: 'the-operator-issue-15',
        templateType: 'weekly-briefing',
        pillarId: pillars[0]?.id,
        authorId: authors[0]?.id,
        introNote:
          'Two things on my mind this week: the quiet accumulation of AI governance debt in fast-moving companies, and a counterintuitive thesis on AI in plaintiff law.',
        status: 'approved',
        substackStatus: 'ready',
        publishedAt: daysAhead(1),
        campaignId: campaigns[0]?.id,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const carousels = await db
    .insert(dosCarouselProjectsTable)
    .values([
      {
        title: 'The 5 Signals That Tell You a Vessel Is About to Have a Problem',
        slug: 'vessel-problem-signals-carousel',
        topic: 'Maritime fleet intelligence — early warning signals',
        hook: 'Most maritime incidents are predictable 48–72 hours before they happen. Here are 5 signals operators miss.',
        pillarId: pillars[1]?.id,
        linkedinShortCaption:
          '5 signals that tell you a vessel is about to have a problem. Most operators miss all of them. Thread 🧵',
        linkedinLongCaption:
          "In maritime operations, most serious incidents have a fingerprint 48–72 hours before they happen.\n\nHere are 5 signals we monitor at Vessels that predict problems before they become emergencies:\n\n[See carousel]\n\nWe've built these signals into our fleet intelligence platform — but you don't need the platform to start monitoring them.",
        xThreadAdaptation:
          "5 signals that tell you a vessel is about to have a problem:\n\n1/ AIS dark periods > 30 min off-route\n2/ Fuel consumption > 12% above voyage plan\n3/ Main engine temperature outliers on remote monitoring\n4/ Port congestion spike at destination (> 3.5 day anchor wait)\n5/ Route chokepoint weather model divergence > 6 hours\n\nMost maritime incidents are predictable. Most operators don't have the systems to see the prediction.",
        status: 'ready',
        articleId: articles[1]?.id,
      },
      {
        title: 'AI Governance Debt: The 4-Stage Collapse',
        slug: 'ai-governance-debt-stages-carousel',
        topic: 'AI governance — the compounding failure pattern',
        hook: "AI governance debt doesn't fail all at once. It fails in stages. Here's the pattern.",
        pillarId: pillars[3]?.id,
        linkedinShortCaption:
          "AI governance debt doesn't fail all at once. It fails in 4 stages. Are you in stage 1 or stage 3?",
        xThreadAdaptation:
          "AI governance debt has a 4-stage collapse pattern:\n\nStage 1: Invisible debt. Shipping AI features, no cost controls, no audit. Everything works.\n\nStage 2: Surprise bills. AI costs spike unexpectedly. Manual investigation required.\n\nStage 3: Security incidents. Unauthenticated model access, data leakage via prompts.\n\nStage 4: Compliance crisis. Customer asks for audit trail. You don't have one.\n\nWhich stage are you in?",
        status: 'ready',
        articleId: articles[3]?.id,
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db.insert(dosCarouselSlidesTable).values([
    {
      projectId: carousels[0]?.id,
      slideNumber: 1,
      slideType: 'intro',
      tagline: 'MARITIME INTELLIGENCE',
      title: '5 Signals That Tell You a Vessel Is About to Have a Problem',
      callToAction: 'Swipe to see the signals →',
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 2,
      slideType: 'content',
      tagline: 'Signal #1',
      title: 'AIS Dark Period > 30 Minutes Off-Route',
      paragraph:
        "When a vessel goes dark on AIS tracking while deviating from its planned route, it's a red flag — not normal weather avoidance.",
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 3,
      slideType: 'content',
      tagline: 'Signal #2',
      title: 'Fuel Consumption > 12% Above Voyage Plan',
      paragraph:
        'Excess fuel burn compounds costs and often signals mechanical issues, poor trim, or hull fouling. $470/MT bunker prices make this expensive fast.',
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 4,
      slideType: 'content',
      tagline: 'Signal #3',
      title: 'Engine Temperature Outliers on Remote Monitoring',
      paragraph:
        'Elevated exhaust temperatures on individual cylinders is a predictive failure signature. Ignored, it becomes an engine failure at sea.',
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 5,
      slideType: 'content',
      tagline: 'Signal #4',
      title: 'Destination Port Congestion Spike > 3.5 Days Anchor Wait',
      paragraph:
        "Port congestion creates demurrage exposure. By the time your vessel arrives, you've missed the optimal anchor window.",
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 6,
      slideType: 'content',
      tagline: 'Signal #5',
      title: 'Route Weather Model Divergence > 6 Hours',
      paragraph:
        'When weather routing models diverge by more than 6 hours on predicted conditions, the vessel is flying blind on route risk.',
    },
    {
      projectId: carousels[0]?.id,
      slideNumber: 7,
      slideType: 'outro',
      tagline: 'THE BOTTOM LINE',
      title: 'Most Maritime Incidents Are Predictable',
      paragraph:
        'You need the right data and the right alerts. We built Vessels to surface all 5 signals in one place.',
      callToAction: 'Learn more at vessels.szlholdings.com',
    },
  ]);

  await db
    .insert(dosXPostsTable)
    .values([
      {
        sourceType: 'article',
        sourceId: articles[0]?.id,
        postType: 'thread',
        body: 'Most enterprise AI implementations are wrong at the architecture level. Not the model — the architecture. A thread on agent-first design 🧵',
        status: 'sent',
        sentAt: daysAgo(14),
        externalPostId: 'x-post-001',
        campaignId: campaigns[0]?.id,
      },
      {
        sourceType: 'article',
        sourceId: articles[0]?.id,
        postType: 'authority',
        body: 'The fundamental unit of enterprise work is shifting from the human task to the agent-mediated task. Organizations that treat AI as a feature layer will lose to those treating it as architecture.',
        status: 'sent',
        sentAt: daysAgo(14),
        externalPostId: 'x-post-002',
        campaignId: campaigns[0]?.id,
      },
      {
        sourceType: 'article',
        sourceId: articles[1]?.id,
        postType: 'thread',
        body: "The Baltic Dry Index is one of the most accurate real-time economic indicators available. Most investors ignore it because they don't know how to read it. Here's the framework 🧵",
        status: 'sent',
        sentAt: daysAgo(7),
        externalPostId: 'x-post-003',
        campaignId: campaigns[1]?.id,
      },
      {
        sourceType: 'carousel',
        sourceId: carousels[0]?.id,
        postType: 'single',
        body: "5 signals that tell you a vessel is about to have a problem. Most operators miss all of them. Here's what we watch at @vessels 👇",
        status: 'queued',
        scheduledFor: daysAhead(1),
        campaignId: campaigns[1]?.id,
      },
      {
        sourceType: 'article',
        sourceId: articles[2]?.id,
        postType: 'contrarian',
        body: "Hot take: AI will not replace your plaintiff attorney. It will fire every lazy insurance adjuster. Here's why the intelligence asymmetry is going to be wild 🧵",
        status: 'draft',
        scheduledFor: daysAhead(5),
        campaignId: campaigns[2]?.id,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(dosCampaignLinksTable)
    .values([
      {
        campaignId: campaigns[0]?.id,
        name: 'Substack subscribe CTA',
        source: 'substack',
        medium: 'newsletter',
        campaign: 'q2-ai-launch',
        destination: 'https://szlholdings.com/subscribe',
        fullUrl:
          'https://szlholdings.com/subscribe?utm_source=substack&utm_medium=newsletter&utm_campaign=q2-ai-launch',
        clicks: 284,
        conversions: 42,
      },
      {
        campaignId: campaigns[0]?.id,
        name: 'X bio link — AI platform article',
        source: 'x',
        medium: 'social',
        campaign: 'q2-ai-launch',
        destination: 'https://szlholdings.com/insights/agent-first-enterprise-architecture',
        fullUrl:
          'https://szlholdings.com/insights/agent-first-enterprise-architecture?utm_source=x&utm_medium=social&utm_campaign=q2-ai-launch',
        clicks: 891,
        conversions: 48,
      },
      {
        campaignId: campaigns[1]?.id,
        name: 'Maritime article — LinkedIn share',
        source: 'linkedin',
        medium: 'social',
        campaign: 'maritime-series',
        destination:
          'https://szlholdings.com/insights/baltic-exchange-decoded-shipping-rates-global-economy',
        fullUrl:
          'https://szlholdings.com/insights/baltic-exchange-decoded-shipping-rates-global-economy?utm_source=linkedin&utm_medium=social&utm_campaign=maritime-series',
        clicks: 1420,
        conversions: 88,
      },
      {
        campaignId: campaigns[1]?.id,
        name: 'Vessels product demo CTA',
        source: 'newsletter',
        medium: 'email',
        campaign: 'maritime-series',
        destination: 'https://vessels.szlholdings.com/demo',
        fullUrl:
          'https://vessels.szlholdings.com/demo?utm_source=newsletter&utm_medium=email&utm_campaign=maritime-series',
        clicks: 320,
        conversions: 52,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(dosLeadsTable)
    .values([
      {
        name: 'Marcus Chen',
        email: 'mchen@arcticshipping.com',
        company: 'Arctic Shipping LLC',
        role: 'CEO',
        interestArea: 'Maritime AI / Vessels platform',
        budget: '$50K–$150K annually',
        source: 'linkedin',
        medium: 'social',
        campaign: 'maritime-series',
        landingPage: '/insights/baltic-exchange-decoded',
        stage: 'qualified',
        score: 82,
        tags: ['shipping', 'enterprise'],
      },
      {
        name: 'Dr. Patricia Williams',
        email: 'pwilliams@brennanlaw.com',
        company: 'Brennan & Associates LLP',
        role: 'Managing Partner',
        interestArea: 'Counsel / Legal AI',
        budget: 'Under $50K',
        source: 'x',
        medium: 'social',
        campaign: 'legal-tech-thought-leadership',
        landingPage: '/insights/ai-plaintiff-law',
        stage: 'warm',
        score: 74,
        tags: ['legal', 'smb'],
      },
      {
        name: 'James Okonkwo',
        email: 'jokonkwo@harbortrade.com',
        company: 'Harbor Trade Partners',
        role: 'Head of Trading',
        interestArea: 'Commodity trading / Vessels platform',
        budget: '$150K+',
        source: 'substack',
        medium: 'newsletter',
        campaign: 'maritime-series',
        landingPage: '/',
        stage: 'proposal-candidate',
        score: 91,
        tags: ['trading', 'maritime', 'enterprise'],
      },
      {
        name: 'Ava Rodriguez',
        email: 'arodriguez@nextcybersec.com',
        company: 'NextCyber Security',
        role: 'CISO',
        interestArea: 'Aegis / Cybersecurity platform',
        budget: '$50K–$150K annually',
        source: 'linkedin',
        medium: 'social',
        campaign: 'q2-ai-launch',
        landingPage: '/aegis',
        stage: 'qualified',
        score: 68,
        tags: ['security', 'enterprise'],
      },
      {
        name: 'Thomas Beauchamp',
        email: 'tbeauchamp@horizonproperties.com',
        company: 'Horizon Properties Group',
        role: 'VP Acquisitions',
        interestArea: 'Terra / Real estate intelligence',
        budget: 'Under $50K',
        source: 'x',
        medium: 'social',
        campaign: 'q2-ai-launch',
        landingPage: '/terra',
        stage: 'new',
        score: 42,
        tags: ['real-estate', 'smb'],
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(dosDistributionTargetsTable)
    .values([
      {
        contentType: 'article',
        contentId: articles[0]?.id,
        channel: 'site',
        status: 'published',
        actualDate: daysAgo(14),
        externalUrl: 'https://szlholdings.com/insights/agent-first-enterprise-architecture',
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[0]?.id,
        channel: 'x',
        status: 'published',
        actualDate: daysAgo(14),
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[0]?.id,
        channel: 'substack',
        status: 'published',
        actualDate: daysAgo(13),
        externalUrl: 'https://szlholdings.substack.com/p/agent-first-enterprise',
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[1]?.id,
        channel: 'site',
        status: 'published',
        actualDate: daysAgo(7),
        externalUrl: 'https://szlholdings.com/insights/baltic-exchange-decoded',
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[1]?.id,
        channel: 'x',
        status: 'published',
        actualDate: daysAgo(7),
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[2]?.id,
        channel: 'site',
        status: 'planned',
        plannedDate: daysAhead(5),
        owner: 'Stephen L.',
      },
      {
        contentType: 'article',
        contentId: articles[3]?.id,
        channel: 'site',
        status: 'planned',
        plannedDate: daysAhead(2),
        owner: 'Stephen L.',
      },
      {
        contentType: 'newsletter',
        contentId: newsletters[0]?.id,
        channel: 'substack',
        status: 'published',
        actualDate: daysAgo(7),
        externalUrl: 'https://szlholdings.substack.com/p/the-operator-14',
        owner: 'Stephen L.',
      },
      {
        contentType: 'newsletter',
        contentId: newsletters[1]?.id,
        channel: 'substack',
        status: 'planned',
        plannedDate: daysAhead(1),
        owner: 'Stephen L.',
      },
      {
        contentType: 'carousel',
        contentId: carousels[0]?.id,
        channel: 'linkedin',
        status: 'ready',
        plannedDate: daysAhead(1),
        owner: 'Stephen L.',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(dosContentCalendarItemsTable)
    .values([
      {
        title: "The Founder's Governance Debt Problem — Publish",
        contentType: 'article',
        contentId: articles[3]?.id,
        pillarId: pillars[3]?.id,
        status: 'planned',
        scheduledDate: daysAhead(2),
        owner: 'Stephen L.',
        notes: 'Approved. Schedule X + newsletter teaser same day.',
      },
      {
        title: 'Vessel Problem Signals Carousel — LinkedIn',
        contentType: 'carousel',
        contentId: carousels[0]?.id,
        pillarId: pillars[1]?.id,
        status: 'ready',
        scheduledDate: daysAhead(1),
        owner: 'Stephen L.',
      },
      {
        title: 'Issue 15 Newsletter Send',
        contentType: 'newsletter',
        contentId: newsletters[1]?.id,
        pillarId: pillars[0]?.id,
        status: 'planned',
        scheduledDate: daysAhead(1),
        owner: 'Stephen L.',
      },
      {
        title: 'AI Plaintiff Law Article — Final Review',
        contentType: 'article',
        contentId: articles[2]?.id,
        pillarId: pillars[2]?.id,
        status: 'in-progress',
        scheduledDate: daysAhead(4),
        owner: 'Stephen L.',
      },
      {
        title: '10 Security Mistakes Article — Draft',
        contentType: 'article',
        contentId: articles[4]?.id,
        pillarId: pillars[4]?.id,
        status: 'idea',
        scheduledDate: daysAhead(18),
        owner: 'Stephen L.',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(dosCtaBlocksTable)
    .values([
      {
        name: 'The Operator Newsletter Subscribe',
        type: 'subscribe',
        headline: 'Get The Operator — weekly AI strategy',
        body: 'Join 2,400+ founders, operators, and investors reading The Operator every week.',
        buttonText: 'Subscribe Free',
        buttonUrl: 'https://szlholdings.substack.com',
        isDefault: true,
      },
      {
        name: 'Vessels Platform Demo CTA',
        type: 'demo',
        headline: 'See Vessels Fleet Intelligence in Action',
        body: 'Real-time AIS tracking, route optimization, marine insurance, and fleet exception management — all in one platform.',
        buttonText: 'Request Demo',
        buttonUrl: 'https://vessels.szlholdings.com/demo',
        isDefault: false,
      },
      {
        name: 'Counsel Demo CTA',
        type: 'demo',
        headline: 'Try Counsel for Your Law Firm',
        body: 'Demand readiness scoring, settlement forecasting, and AI-powered matter intelligence for plaintiff law.',
        buttonText: 'Schedule a Demo',
        buttonUrl: 'https://prismcounsel.szlholdings.com/demo',
        isDefault: false,
      },
    ])
    .onConflictDoNothing();
  return { seeded: true };
}
