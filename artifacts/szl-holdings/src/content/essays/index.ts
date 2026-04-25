export interface Essay {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  category: 'doctrine' | 'architecture' | 'strategy' | 'operations' | 'memo';
  readTime: number;
  excerpt: string;
  body: string;
}

export const ESSAYS: Essay[] = [
  {
    slug: 'governed-autonomy',
    title: 'Governed Autonomy',
    subtitle: 'Why the right constraint produces the right freedom',
    date: '2026-01-14',
    category: 'doctrine',
    readTime: 7,
    excerpt:
      "Every AI system eventually runs into the same problem: the thing it optimizes for isn't quite the thing you wanted. The solution isn't more intelligence — it's better structure.",
    body: `
<p>Every AI system eventually runs into the same problem: the thing it optimizes for isn't quite the thing you wanted. The solution isn't more intelligence — it's better structure.</p>

<p>Governed Autonomy is the operating doctrine I built SZL around. It's not a compliance framework. It's not a safety checklist. It's an architectural posture that says: AI agents advise, humans confirm, and the proof chain records everything.</p>

<h3>The false choice</h3>

<p>Most AI system designs present a false choice: full automation (where things happen without humans in the loop) versus human-in-the-loop (where humans approve everything, negating the speed benefit). Neither is right.</p>

<p>Full automation creates systems that are fast until they're catastrophically wrong. Human-in-the-loop creates systems that are safe but so slow they lose to the alternatives. The real answer is to make the loop itself intelligent — to ensure human confirmation is required for things that matter and absent for things that don't.</p>

<p>That requires a system that knows the difference. That's not a feature. That's an architectural property.</p>

<h3>What the doctrine actually demands</h3>

<p>Governed Autonomy has three requirements.</p>

<p>First: every AI recommendation must be traceable. Not just a log entry — a record that shows what data the system was trained on, what the signal state was at decision time, what confidence the model assigned, and what alternatives were considered. If you can't reconstruct why a recommendation was made, you can't govern it.</p>

<p>Second: the approval surface must be designed. Most systems present approval as a pop-up: "Are you sure?" That's not governance. Governance means surfacing the right information at the right moment so the human can make an informed decision, not just rubber-stamp a machine. The UI is a governance artifact.</p>

<p>Third: the audit record must be immutable. Not a database table that can be edited — a proof chain that shows state transitions and is structurally resistant to retroactive modification. FORGE's proof chain is not a legal requirement (though it satisfies legal requirements). It's an engineering requirement. You cannot have governed systems without tamper-evident records.</p>

<h3>Why constraint creates capability</h3>

<p>Here's the counterintuitive result: governed systems can do more, not less.</p>

<p>When operators trust that a system won't act autonomously in ways that cause enterprise damage, they give it access to more sensitive systems. When regulators can see a complete audit trail, they approve deployment in higher-stakes environments. When executives can see that AI outputs are bounded by explainable criteria, they let those outputs reach decision surfaces.</p>

<p>Ungoverned AI gets deployed in low-stakes environments where its speed advantage is also its lowest value. Governed AI gets deployed where it actually matters.</p>

<p>That's not a coincidence. That's the architecture working.</p>
    `.trim(),
  },
  {
    slug: 'one-spine-six-verticals',
    title: 'One Spine, Six Verticals',
    subtitle: 'The architectural bet behind the SZL portfolio',
    date: '2025-11-08',
    category: 'architecture',
    readTime: 9,
    excerpt:
      "The hardest architectural question I faced in building SZL wasn't technical. It was whether to build six separate companies or one company with six faces.",
    body: `
<p>The hardest architectural question I faced in building SZL wasn't technical. It was whether to build six separate companies or one company with six faces. The answer — one spine, six verticals — shaped everything that followed.</p>

<h3>What a "spine" actually means</h3>

<p>FORGE is the execution fabric. It handles workflow orchestration, AI agent coordination, connector management, signal ingestion, approval routing, and audit logging. Every other platform in the SZL portfolio runs on top of it. KORA doesn't have its own workflow engine. SEXTANT doesn't have its own audit system. DOMAINE doesn't have its own approval layer. They're all FORGE surfaces.</p>

<p>This is not a cost-cutting measure. It's a compounding bet.</p>

<p>When we improve FORGE's confidence scoring, every vertical gets better predictions. When we add a new connector to FORGE, every vertical gains that integration. When we harden FORGE's proof chain, every vertical gets stronger audit evidence. The marginal cost of adding capability to the fabric is near zero per vertical — it's already there.</p>

<h3>The failure mode this avoids</h3>

<p>Most enterprise software portfolios are built by acquisition or by opportunistic construction. Company A buys Company B because they're in adjacent markets. Now they have two separate engineering teams, two separate schemas, two separate security models, and two separate audit systems. Every integration is a bespoke project. Every compliance audit requires two separate reports.</p>

<p>This is the default. It's also slow, expensive, and strategically fragile. When your moat is "we have integrations," your moat dissolves when someone builds the same integrations cheaper.</p>

<p>When your moat is "the fabric beneath the verticals compounds with every vertical we add," the moat deepens as you grow. Adding a seventh vertical doesn't add one-seventh more value — it multiplies the existing infrastructure utilization across a wider surface.</p>

<h3>What this demands of each vertical</h3>

<p>The architectural discipline required to make this work is significant. Each vertical has to be built to its own operational vocabulary while exposing its core functionality through the shared fabric's interface contracts.</p>

<p>DOMAINE speaks in property signals, deal stages, and ownership graphs. SEXTANT speaks in vessel tracks, port calls, and route anomalies. PARAGON speaks in threat vectors, indicator correlations, and incident timelines. They're genuinely different domains. The discipline is building each in its native language while routing consequential actions through FORGE.</p>

<p>This means the vertical teams must resist the temptation to build their own execution logic. Every time you build a workflow inside a vertical instead of in FORGE, you create a governance gap. The rule is simple: if it touches data, it goes through the fabric. If it makes a recommendation, it goes through FORGE. If it executes an action, the proof chain sees it.</p>

<h3>The compound result</h3>

<p>Today, we can build a new vertical in a fraction of the time it would take building from scratch. The connector library, the auth system, the audit infrastructure, the AI reasoning layer, the approval surfaces — all of it exists. What remains is the domain model and the front-end product skin. That's real. That's leverage.</p>

<p>The bet was right. The discipline required to collect the winnings remains ongoing.</p>
    `.trim(),
  },
  {
    slug: 'the-signal-problem',
    title: 'The Signal Problem',
    subtitle: 'Why enterprise software is drowning in data and starving for intelligence',
    date: '2025-09-22',
    category: 'strategy',
    readTime: 6,
    excerpt:
      "Enterprise organizations don't lack data. They lack the capacity to act on what the data is telling them, at the moment it needs to be acted on.",
    body: `
<p>Enterprise organizations don't lack data. They have too much. The problem is not data availability — it's signal conversion: the process of taking raw operational data and turning it into a decision that a person can act on right now.</p>

<h3>What signals are and why they're different from data</h3>

<p>A signal is not a metric. A metric tells you what happened. A signal tells you that something requires attention, by whom, and with what urgency. The difference is interpretive context.</p>

<p>Your monitoring system knows that API latency increased by 40ms. That's a metric. Whether that 40ms increase is a signal depends on: what SLA that API is subject to, whether that SLA has a customer attached, what the customer's contract states about latency, and whether the current increase is trend-acceleration or a one-time spike.</p>

<p>Converting that metric into a signal requires context that lives in multiple systems. The monitoring data is in one system. The SLA is in a contract database. The customer record is in your CRM. The trend data is in your analytics platform. No current monitoring tool holds all of it. The analyst who would connect these sources does so manually, hours after the event.</p>

<h3>The cost of signal latency</h3>

<p>Every enterprise problem has a latency window. If you catch a compliance deviation in the first hour, it's a correctable incident. After 24 hours, it may be a reportable event. After a week, it may be a regulatory finding.</p>

<p>If you catch a vendor risk signal before contract renewal, you can renegotiate terms. After renewal, you've locked in the exposure for another year.</p>

<p>If you catch an ownership gap in an operational process before it causes a failure, it's a configuration fix. After it causes a customer-affecting failure, it's a post-mortem.</p>

<p>The business value of faster signal conversion is not marginal. It's often the difference between a correctable situation and an expensive one. And it compounds: organizations with faster signal-to-action cycles accumulate fewer incidents, better contracts, and stronger operational records than equivalents with slower cycles.</p>

<h3>Why current tools don't solve this</h3>

<p>Observability platforms show you what's happening in your infrastructure. CRM platforms show you what's happening in your customer relationships. ERP platforms show you what's happening in your supply chain. But each lives in its silo. Cross-system signal detection — the kind that catches a pattern that only exists when you connect data from three systems — requires building bespoke integrations or doing it manually.</p>

<p>AI point solutions help analysts ask questions but don't proactively surface what matters. They wait to be prompted. An enterprise that has to remember to ask the right questions is still running on human working memory, with all its limits.</p>

<p>KORA exists to close this gap. It's not a monitoring tool. It's a signal conversion layer — the piece of infrastructure that sits between raw data and executable human action, with governance built into the pipeline.</p>
    `.trim(),
  },
  {
    slug: 'building-without-fake-traction',
    title: 'Building Without Fake Traction',
    subtitle: 'A memo on discipline in an era of performance',
    date: '2025-07-03',
    category: 'memo',
    readTime: 5,
    excerpt:
      "The startup media environment rewards the appearance of momentum. This creates a systematic pressure toward fake traction — announcements, partnerships, and metrics that look like growth but aren't.",
    body: `
<p>The startup media environment rewards the appearance of momentum. This creates a systematic pressure toward fake traction — announcements, partnerships, and metrics that look like growth but aren't.</p>

<p>I've watched founders announce "enterprise pilots" with companies that downloaded a trial. I've seen "ARR" figures that include committed contracts not yet renewed, or worse, letters of intent. I've read partnership announcements between two startups with a combined six months of runway, each hoping to borrow the other's credibility.</p>

<p>I find this deeply unserious, and I've built SZL to be the opposite.</p>

<h3>What the discipline actually looks like</h3>

<p>No announcement before the fact. We don't announce integrations before they're shipped. We don't announce design partners before there's a signed agreement. We don't announce platform launches before the platform is live and tested.</p>

<p>No metric without a definition. If I reference a number — deal pipeline, table count, endpoint count — I can show you the source. Not a slide with a footnote that says "estimated," but the actual database query or audit record that produced it.</p>

<p>No partnership that isn't operational. A partnership announcement is an operational claim: these two organizations are doing something together that creates real output. If there's no output, there's no partnership. There may be a business development relationship, a negotiation, a letter of intent. Those are real things with real value. They're not partnerships.</p>

<h3>Why this is strategic, not just ethical</h3>

<p>In a market full of performance, the operator who shows only what is real becomes a reliable source. Investors learn that when SZL reports a number, it's auditable. Design partners learn that when SZL commits to a feature, it ships. Analysts learn that when SZL describes architecture, it's live code, not a slide.</p>

<p>That reputation is slow to build and very hard to replicate. It's also a genuine differentiator. The enterprise buyer who has been burned by demo-ware is hungry for an operator who will show them working software before asking for a signature.</p>

<p>This doesn't mean hiding problems. If an integration broke, I say so. If a launch date moved, I say so. Discipline is not about presenting a perfect surface — it's about presenting an accurate one.</p>

<h3>The cost</h3>

<p>Fake traction can accelerate fundraising. A founder willing to overstate metrics can look more fundable than one who is honest about where they are. I've accepted this cost.</p>

<p>The alternative — raising on inflated numbers and then having to defend them — is a much larger cost. Not just because of the cap table dynamics or the legal exposure, but because it warps the company's operating reality. Teams start to believe their own announcements. Strategy gets built on manufactured momentum. Eventually, reality presents itself.</p>

<p>Better to build at the pace of truth.</p>
    `.trim(),
  },
  {
    slug: 'what-design-partners-actually-get',
    title: 'What Design Partners Actually Get',
    subtitle: "The structure of the first engagement and why it's built that way",
    date: '2026-03-01',
    category: 'memo',
    readTime: 6,
    excerpt:
      "A design partner engagement is not a trial. It's a structured proof exercise, and the distinction matters.",
    body: `
<p>A design partner engagement is not a trial. It's a structured proof exercise, and the distinction matters.</p>

<p>A trial is vendor-led: the vendor configures their software for your environment and asks you to evaluate it. The risk is all yours. If the software doesn't perform, you've spent months on an evaluation and have nothing to show for it.</p>

<p>A proof exercise is collaborative. We identify one workflow in your operating environment that has a measurable inefficiency — approval latency, ownership gaps, risk detection failure, signal noise. We instrument it together. We define what success looks like before we start. We build the baseline together. Then we run the workflow through the governed intelligence layer and measure the delta.</p>

<p>The output is not "the software works." The output is documented evidence of improvement on a real process, with an audit-grade record of every step.</p>

<h3>What I put in</h3>

<p>Direct founder access. You work with me, not an account manager. Every architecture decision, every integration challenge, every product question goes through the person who built it.</p>

<p>Time. A design partner engagement is not a side project. I treat it as a primary operating priority for the duration of the engagement. That means real responsiveness, not scheduled check-ins.</p>

<p>Honest feedback loops. If your use case doesn't fit, I'll tell you. If the software has a gap that's relevant to your workflow, I'll tell you and tell you when it's scheduled to close. If the proof doesn't land, we figure out why together — and that analysis has value regardless of whether you become a customer.</p>

<h3>What you put in</h3>

<p>One real workflow. Not a demo environment, not sanitized test data. A real operating workflow with real inputs, real users, and a real performance baseline.</p>

<p>Operator access. The people who actually run the workflow need to be in the room, at least for the first two weeks. Not their managers — the operators. They know where the friction is. They'll tell us what we're missing.</p>

<p>Feedback. Unfiltered. The design partner relationship only produces value if you tell me what doesn't work. I need to know when the UI is wrong, when the signal classification is off, when the approval surface is in the wrong place. That feedback is the point.</p>

<h3>What comes after</h3>

<p>If the proof lands, we define an expansion scope together. The pilot architecture is built to expand — that's not marketing language, it's an engineering constraint I imposed on myself. The same fabric that runs one workflow runs ten. We negotiate commercial terms based on the documented evidence from the pilot, not projections.</p>

<p>If the proof doesn't land, I want to understand why. Every engagement that ends without a commercial result still produces architecture intelligence that improves the platform. That's not nothing.</p>

<p>Apply if you have a real problem you want to solve with real evidence. I'll respond directly.</p>
    `.trim(),
  },
];

export function getEssay(slug: string): Essay | undefined {
  return ESSAYS.find((e) => e.slug === slug);
}

export function getEssaysByCategory(category: Essay['category']): Essay[] {
  return ESSAYS.filter((e) => e.category === category);
}
