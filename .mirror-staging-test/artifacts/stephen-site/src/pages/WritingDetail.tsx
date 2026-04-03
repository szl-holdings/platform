import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = "/api";

interface CmsPost {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  contentType: string;
  status: string;
  metaDescription: string | null;
  publishedAt: string | null;
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  "blog": "Essay",
  "case-study": "Case Study",
  "investor-letter": "Investor Letter",
  "update": "Update",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function renderMarkdown(content: string): string[][] {
  const paragraphs = content.split(/\n{2,}/).filter(p => p.trim());
  return paragraphs.map(p => [p.replace(/\n/g, " ").trim()]);
}

const STATIC_POSTS: Record<string, { title: string; date: string; tag: string; content: string[] }> = {
  "vertical-command-systems": {
    title: "The case for vertical command systems",
    date: "March 2026",
    tag: "Strategy",
    content: [
      "Generic enterprise software serves every industry equally and most industries poorly. The dominant product strategy for the past decade has been to build a horizontal tool — a platform that works for any company, in any sector, at any scale — and then expand the addressable market as broadly as possible. This has produced excellent general-purpose tooling. It has also produced a category of software that is deeply, chronically mediocre at doing the things that matter most in specific operational domains.",
      "A maritime fleet operator doesn't need a configurable workflow tool. They need a platform that understands that a vessel deviating 60 nautical miles from a standard route near a sanctioned port is not the same anomaly as one deviating in a known AIS dead zone — and that the appropriate response to each is different. A real estate operator doesn't need a CRM with custom fields. They need a platform where distress scoring is a first-class concept, not a tagged note in a contact record.",
      "Vertical command is the alternative model. A vertical command platform is built for a specific operational domain with the domain knowledge encoded in the data model, the exception logic, and the decision surfaces — not bolted on through customisation.",
      "The defensibility of vertical command comes from the same place as its complexity: the domain knowledge is genuinely difficult to replicate. A team building a maritime intelligence platform needs to understand charter economics, voyage P&L, sanctions exposure, and AIS protocol before they write a line of code. A team building a real estate intelligence platform needs to understand the NYC property ownership chain, distress signal types, and acquisition workflow before they design the database schema.",
      "This is not the same as a moat built from network effects or switching costs, though both can develop over time. The primary moat is the knowledge embedded in the product — and the depth of that embedding is what separates a vertical command platform from a horizontal tool with a maritime skin.",
      "I built Terra, Vessels, and Aegis as vertical command platforms. Each is built around a specific operational domain with deep domain intelligence in the product layer, not in a customisation layer. The evidence that this works is the reaction of operators who have used generic tools in the same category: not 'this is easier to use' but 'this is the first tool that actually understands what I do.'",
    ],
  },
  "defensive-only-cybersecurity": {
    title: "Why defensive-only is the right position in cybersecurity",
    date: "February 2026",
    tag: "Cybersecurity",
    content: [
      "The cybersecurity market has an offense problem. Penetration testing, red teaming, adversary simulation, and vulnerability research tools are valuable — but they operate in a regulatory grey zone, attract aggressive legal scrutiny, and require careful customer qualification to avoid enabling genuine harm. Building in that space requires ongoing legal overhead that has nothing to do with product quality.",
      "The defensive market is different. Threat detection, incident response, SOC operations, MSP command, and intelligence correlation are what the enterprise cybersecurity buyer actually needs to purchase in volume. They have compliance mandates that require it, insurers that assess it, and boards that ask about it quarterly. Defensive cybersecurity is not just ethically cleaner — it's commercially better positioned.",
      "When I designed Aegis, the choice to build defensive-only was deliberate and immediate. Not because offensive tools aren't interesting — they are — but because the enterprise buyer I wanted to serve is the security operations team and the MSP operator. These buyers don't want an adversary simulator. They want a unified command surface that correlates signals across their threat detection stack and surfaces the decisions they need to make in the next four hours.",
      "The more interesting question is why defensive platforms have historically been weaker than the problem demands. The answer, I think, is that most security platforms are built around the data aggregation problem — ingest all the logs, store them affordably, search them when needed. This is a reasonable starting point. It is not a command surface. A platform that stores everything and surfaces nothing is a storage platform, not a security platform.",
      "Aegis is built around the command surface problem: what does the analyst need to decide right now, and what information do they need to make that decision confidently? The data aggregation layer is necessary infrastructure. The command layer is the product.",
      "The defensive-only position also simplifies customer conversations substantially. There is no 'intended use' ambiguity with a SOC correlation platform. The customer is buying software to help them detect and respond to threats. The relationship is clean, the regulation is clear, and the product roadmap is constrained by real operator needs rather than adversarial creativity.",
    ],
  },
  "distress-intelligence-real-estate": {
    title: "Distress intelligence as a real estate operating model",
    date: "January 2026",
    tag: "Real Estate",
    content: [
      "The real estate industry has an information problem that looks like a relationships problem. Operators who consistently find deals before others credit their network, their local knowledge, their years in the market. Some of that is real. Most of it is a data advantage that has been misclassified as a social advantage.",
      "Distress signals are data. Tax arrears are filed in public records. Mortgage delinquencies surface in court filings. Permit violations are logged by city agencies. Ownership structures — LLCs layered over LLCs, often with the same registered agent — are detectable from transfer records. The operators who see deals first are not the ones with better relationships; they are the ones processing more of this data more systematically.",
      "The fundamental failure of the CRE technology market is that it has focused on the wrong moment in the acquisition cycle. Platforms that aggregate MLS listings, recent transactions, and comparable sales are useful for valuation. They are useless for sourcing. By the time a property appears in a listing or closes as a comparable sale, the sourcing opportunity is gone. The operator who wins the deal identified the distress signal weeks or months earlier.",
      "Distress intelligence as an operating model means building the capability to process these signals at scale — across an entire borough, across thousands of properties, continuously — and ranking them by acquisition urgency. It means reaching owners who haven't decided to sell yet, because the distress indicators suggest they will need to. It means operating proactively in a market that has historically been reactive.",
      "I built Terra around this thesis. The distress scoring engine is the product, not a feature. Everything else — the CRM, the market context, the deal pipeline — is built to support operators working a distress-ranked list, not to replicate what existing real estate software already does.",
      "The result is a fundamentally different workflow. Operators using Terra don't start their day by checking listings. They start by reviewing the top of their distress queue — properties that have moved materially in score since the last check — and deciding which owners to contact. It is a proactive acquisition operation, not a reactive one.",
    ],
  },
  "building-for-banks": {
    title: "Building for banks, not just VCs",
    date: "December 2025",
    tag: "Enterprise",
    content: [
      "There is a product category that VCs love and banks cannot use. It is fast, it is feature-rich, it has a beautiful onboarding experience, and it stores your data on shared infrastructure with a tenant_id column and a privacy policy that would not survive a procurement review at any regulated institution. The founders of these products have strong demo metrics. They have weak enterprise close rates.",
      "Building for banks — and by extension for any highly regulated institutional buyer — requires a different set of product priorities from the start. Auditability is not a feature. Immutable audit trails are not something you add when a customer asks. Multi-tenant data isolation is not a configuration switch. These are architectural decisions made in week one that are effectively permanent. Retrofitting them costs more than rebuilding.",
      "The institutional buyer evaluates software differently from the SMB buyer. The SMB buyer wants to know if the product works. The institutional buyer wants to know if the product fails safely — what happens when it goes wrong, who can see what, how the audit trail is preserved, how the data is isolated from other customers. These questions are not asked in a product demo. They are asked in a security review that takes six weeks and involves people who will never use the software.",
      "I designed the SZL platforms to pass these reviews by default, not by exception. Every platform in the portfolio has immutable audit logs, row-level security, schema-level tenant isolation, and role-based access with consistent semantics. This was not driven by a specific customer requirement — it was a principle applied from the start because the buyers I wanted to serve would eventually require it.",
      "The commercial payoff is that the security review is not a blocker. When an enterprise prospect asks about data isolation, the answer is not 'we can configure that for your deployment.' It is 'here is how the schema isolation works at the database level, here is the audit trail architecture, here is the access control model.' The conversation moves faster because the architecture is already the answer.",
      "Building for banks also means accepting that the sales cycle is longer, the procurement process is heavier, and the customer success motion is more intensive than in SMB markets. These are real costs. They are also reasons why established relationships in regulated sectors are genuinely durable — switching costs are high when the alternative is another six-week security review.",
    ],
  },
  "portfolio-architecture": {
    title: "The portfolio architecture: why I built six platforms at once",
    date: "November 2025",
    tag: "Founder Notes",
    content: [
      "The standard advice for technical founders is clear: find one problem, build one product, achieve product-market fit, then scale. It is good advice for most situations. It was the wrong advice for the situation I was in.",
      "I had identified a set of operational domains — maritime intelligence, real estate intelligence, cybersecurity command, AI infrastructure, enterprise observability, strategic advisory — where the underlying technical infrastructure required to build a good product was largely the same. Authentication, multi-tenant data isolation, observability, AI routing, workflow orchestration, audit trails: these are not domain-specific. They are platform capabilities that cost roughly the same to build whether you are building one product or six.",
      "The portfolio architecture is a bet on that shared infrastructure. If the fixed cost of building the platform layer is amortised across six products rather than one, and each product is better because it inherits a more mature infrastructure than it could justify building alone, the per-product economics improve substantially. The marginal cost of each new platform is lower than the last.",
      "Two years in, the thesis holds — but the coordination cost is higher than I expected. Every architectural decision made for the first platform ripples through the others. A schema change in the shared auth system requires coordinated migrations across all deployments. A breaking change in the shared component library affects every product. These coordination costs are manageable with good tooling and discipline, but they are real.",
      "What I did not anticipate fully was the strategic value of the intelligence network. The signals generated by operating six platforms in adjacent domains are genuinely useful to each other. Anomaly baselines built in Lyte help calibrate Aegis's alert thresholds. Distress patterns identified in Terra inform capital allocation conversations at SZL Holdings. The portfolio is smarter than any individual platform because it sees more of the operational picture.",
      "The honest assessment after two years: the portfolio model is right for a founder who has a clear architectural thesis and the discipline to enforce it. It is wrong for a founder who wants to run six independent products. The shared infrastructure only compounds if the architectural decisions are made consistently. Six products built on the same weak foundation compound the weakness. Six products built on a strong foundation compound the strength.",
    ],
  },
  "ai-copilot-command-surface": {
    title: "The AI copilot is not the product — the command surface is",
    date: "April 2026",
    tag: "AI & Product",
    content: [
      "Every enterprise software product released in the last eighteen months has a chat interface. This is not surprising — language models are genuinely useful, the implementation cost has dropped substantially, and the demo impact is real. What is surprising is how often the chat interface is the entire AI strategy.",
      "A chat interface that talks to an undifferentiated data store is a slightly better search box. It is useful in the same way that a faster elevator is useful — it gets you to the same destination more quickly. The destination itself has not changed. The operator asking 'what are my top five distress properties this week' is still relying on the platform's underlying data model, scoring logic, and evidence chain to make the answer meaningful.",
      "The command surface is everything below the chat box. It is the structure of the query result: not just 'here are five properties' but 'here are five properties, ranked by acquisition urgency, with the signal types that drove each score, the owner contact information we've resolved, and the comparable properties that have transacted in the last sixty days.' That specificity is not the language model's contribution. It is the platform's contribution.",
      "This matters for product strategy because the command surface is where differentiation compounds. A language model that reasons over a structured, domain-specific data model with high-quality evidence chains produces dramatically better outputs than the same model reasoning over generic tabular data. The platform that invests in the command surface — the entity resolution, the signal taxonomy, the evidence chain architecture — is building the thing that makes the AI valuable. The chat interface is just how users get to it.",
      "I built the copilots in each SZL platform — Helmsman in Vessels, Sentinel in Aegis, the Terra AI analyst — as reasoning layers over domain-specific command surfaces, not as generic chat interfaces. The language model component is roughly interchangeable. The command surface underneath is the product. This is the distinction that matters when evaluating enterprise AI claims.",
      "The practical test is simple: remove the chat interface. Does the product still have differentiated value? If yes, the AI is additive. If no, the AI is the product, and the product has no structural advantage over whatever model becomes best in class next quarter.",
    ],
  },
  "data-gravity-enterprise": {
    title: "Data gravity and the enterprise deal that never closes",
    date: "March 2026",
    tag: "Enterprise",
    content: [
      "Data gravity is the informal principle that large datasets develop a pull on the applications and services that need to interact with them. The heavier the data, the harder it is to move — and the more likely it is that new capabilities are built adjacent to where the data lives rather than requiring the data to move.",
      "In enterprise sales, data gravity is usually described as a retention mechanism: once a customer has years of operational data in your platform, the switching cost becomes enormous. This is true. What is less often discussed is the acquisition implication: the same gravity that retains existing customers makes it difficult to acquire new ones who already have heavy data somewhere else.",
      "The enterprise deal that never closes is almost always a data gravity problem. The prospect is impressed by the product. They agree it would improve their operations. They intend to migrate. They are unwilling to commit because the data migration is an unknown cost with unknown timing and a known risk of business disruption. The longer the incumbent has been in place, the heavier the data, the less likely the deal closes — regardless of product quality.",
      "There are three real approaches to the data gravity problem, and only one of them is a product strategy. The first is migration tooling: make it cheaper and safer to migrate. This is necessary but not sufficient. It reduces the cost; it does not change the risk profile of committing to a migration that is estimated in weeks and often takes months. The second is incremental adoption: run alongside the incumbent, prove value on a bounded use case, earn the right to expand. This works but requires patience and a product architecture that supports partial deployment.",
      "The third approach — and the one I've built the SZL platforms around — is to attack the data gravity problem at the architectural level. If your platform is designed to ingest and normalize data from existing systems rather than replace them, the incumbent's data becomes an input rather than an obstacle. The question changes from 'can we migrate' to 'can we connect.' Connection timelines are hours, not months.",
      "This requires building on top of an existing operational data estate, which is a different product thesis from building a system of record. It is a harder sell in some ways — 'we work alongside what you have' is less dramatic than 'replace everything with us.' In practice, it is a faster path to closed revenue and a more defensible position once the integration is established.",
    ],
  },
  "maritime-intelligence-underbuilt": {
    title: "Why maritime intelligence is the most underbuilt vertical in enterprise software",
    date: "February 2026",
    tag: "Maritime",
    content: [
      "The global maritime industry moves approximately ninety percent of world trade by volume. It operates through a network of ship operators, charterers, port authorities, insurers, freight forwarders, and flag state registrars that is genuinely complex — not artificially complex in the way that some regulated industries are, but inherently complex because the asset moves continuously across international jurisdictions with different regulatory regimes, different data availability, and different standards of documentation.",
      "Despite this scale and complexity, the software built for maritime operators is remarkably primitive. AIS data aggregation platforms exist, but most of them are data delivery services, not intelligence platforms — they surface vessel positions without contextualizing what those positions mean. Port management systems exist, but most of them are logistics operations tools that do not connect to the broader maritime intelligence picture. Risk scoring platforms exist in the compliance space, primarily for sanctions screening, but they typically address a narrow slice of the full risk landscape.",
      "The result is that maritime intelligence work — the actual job of understanding what is happening in a given region, why specific vessels are behaving anomalously, what the port congestion picture means for a specific charter commitment — is done primarily through analyst labour with limited tooling support. Experienced maritime intelligence analysts are expensive, scarce, and not scalable.",
      "The reason this vertical has been underbuilt is the same reason many complex operational verticals are underbuilt: the knowledge required to design a good product is genuinely difficult to acquire. A team building a maritime intelligence platform needs to understand AIS protocol edge cases, sanctions exposure frameworks, voyage P&L construction, charter party interpretation, and the economics of ship management — before they design the data model. Without that foundation, the product optimizes for data volume rather than operational intelligence.",
      "I built Vessels as an attempt to close this gap. The hypothesis is that the maritime operator needs a command surface, not a data feed — a platform where the anomaly detection logic is built around maritime operational knowledge, where the risk scoring reflects the actual threat landscape (dark periods, chokepoint exposure, sanctions evasion patterns, cyber vulnerability), and where the analyst's interface supports rapid contextual decision-making rather than raw data review.",
      "The underbuilding of maritime intelligence is a structural opportunity. The sector is large enough to support serious enterprise software businesses. The complexity is sufficient to create durable differentiation. The existing tooling is weak enough that genuine domain expertise in the product layer creates real competitive distance. It is exactly the kind of vertical where a command platform — built by people who understand the domain — can displace a fragmented market of data utilities.",
    ],
  },
};

function MarkdownContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).filter(p => p.trim());
  return (
    <div className="space-y-6">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (trimmed.startsWith("## ")) {
          return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-2">{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold text-foreground mt-6 mb-1">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return <p key={i} className="text-[15px] font-semibold text-foreground/90 leading-[1.8]">{trimmed.slice(2, -2)}</p>;
        }
        return (
          <p key={i} className="text-[15px] text-muted-foreground/80 leading-[1.8]">
            {trimmed.replace(/\n/g, " ")}
          </p>
        );
      })}
    </div>
  );
}

interface PostState {
  title: string;
  date: string;
  tag: string;
  content: string | string[];
  metaDescription: string;
}

export function WritingDetail() {
  const [match, params] = useRoute("/writing/:slug");
  const slug = params?.slug || "";
  const [post, setPost] = useState<PostState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageMeta({
    title: post ? `${post.title} — Stephen Lutar` : "Stephen Lutar",
    description: post?.metaDescription || (post && typeof post.content === "string" ? post.content.slice(0, 160) : undefined),
    canonical: slug ? `${window.location.origin}/stephen/writing/${slug}` : undefined,
  });

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    fetch(`${API_BASE}/cms/posts/${slug}`, { signal: controller.signal })
      .then(r => {
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("api_error");
        return r.json();
      })
      .then(json => {
        const p: CmsPost = json.data ?? json;
        setPost({
          title: p.title,
          date: formatDate(p.publishedAt),
          tag: CONTENT_TYPE_LABEL[p.contentType] ?? "Essay",
          content: p.content ?? "",
          metaDescription: p.metaDescription ?? p.excerpt ?? "",
        });
      })
      .catch((err: Error) => {
        const staticPost = STATIC_POSTS[slug];
        if (staticPost) {
          setPost({ ...staticPost, metaDescription: staticPost.content[0]?.slice(0, 160) ?? "" });
        } else {
          void err;
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/5 rounded w-32" />
            <div className="h-8 bg-white/5 rounded w-3/4" />
            <div className="space-y-3 mt-8">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-white/5 rounded" />)}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-24 text-center">
          <p className="text-muted-foreground mb-4">Article not found</p>
          <Link href="/writing" className="text-primary hover:underline">Back to writing</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <Link href="/writing" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to writing
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-white/35 border border-white/8">{post.tag}</span>
            <span className="text-[11px] text-muted-foreground/40 font-mono">{post.date}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{post.title}</h1>
        </div>
        {typeof post.content === "string" ? (
          <MarkdownContent content={post.content} />
        ) : (
          <div className="space-y-6">
            {post.content.map((para, i) => (
              <p key={i} className="text-[15px] text-muted-foreground/80 leading-[1.8]">{para}</p>
            ))}
          </div>
        )}
        <div className="mt-14 pt-8 border-t border-white/5 flex items-center justify-between">
          <Link href="/writing" className="text-[12px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            ← All writing
          </Link>
          <Link href="/contact" className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors">
            Get in touch →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WritingDetail;
