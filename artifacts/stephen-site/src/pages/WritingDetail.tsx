import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";

const posts: Record<string, { title: string; date: string; tag: string; content: string[] }> = {
  "accountability-gap-enterprise-ai": {
    title: "The accountability gap in enterprise AI",
    date: "March 2026",
    tag: "AI & Enterprise",
    content: [
      "Most enterprise AI tools optimise for output quality. What they underinvest in is decision accountability — the trail from model recommendation to human action.",
      "A confidence score of 91% tells you how certain the model is. It tells you nothing about why the model reached that conclusion, which data it weighted most heavily, or whether that data is representative of the current situation.",
      "In operations where decisions have real consequences — maritime compliance, intelligence analysis, financial risk — 'the model said so' is not a defensible audit trail.",
      "The next generation of enterprise AI platforms will be judged not by benchmark performance, but by whether they can demonstrate their reasoning to a regulator, a board, or a post-incident review.",
      "This is why I built explainability as a core layer in INCA — not as an optional feature, but as the foundation of every model output. The intelligence cycle has to be traceable from first signal to final decision.",
      "Companies that build this in from the start will have a structural advantage over those trying to bolt it on later.",
    ],
  },
  "command-interface-underbuilt": {
    title: "The command interface is underbuilt",
    date: "February 2026",
    tag: "Product",
    content: [
      "Enterprise software excels at showing you what's wrong. It is systematically poor at helping you decide what to do about it in the next ten minutes.",
      "The dominant enterprise UX pattern is a dashboard: metrics, charts, tables. It answers 'what is happening?' reasonably well. It answers 'what should I do?' almost not at all.",
      "In maritime operations, a fleet manager looking at an ETA deviation alert needs to know: which vessels are affected, what the downstream schedule impact is, what the options are, and what the cost difference between those options looks like. A map with a dot that's moved off course gives them none of this.",
      "Command mode — the interface I built for Vessels — is an attempt to fill this gap. It prioritises actionable information over comprehensive information. It answers the question you need to answer in the next hour, not the question you might need to answer in a quarterly review.",
      "I believe the most defensible enterprise products of the next five years will be the ones that close the gap between visibility and action.",
    ],
  },
  "vertical-intelligence-vs-horizontal-tooling": {
    title: "Vertical intelligence beats horizontal tooling",
    date: "January 2026",
    tag: "Strategy",
    content: [
      "General-purpose AI tools optimise for breadth. They are designed to work across every industry, every workflow, every use case. This is a reasonable strategy for a platform company.",
      "But in operations with genuine domain complexity, breadth is often a liability. A maritime intelligence platform that doesn't understand charter economics, voyage P&L, and sanctions exposure is not a maritime platform — it's a generic data visualisation tool with a map.",
      "The most durable enterprise platforms are built for a specific operational domain where the data model, the exception logic, the decision context, and the vocabulary are deeply understood.",
      "Understanding maritime means knowing the difference between TCE and spot rate, understanding what a deviation from a standard route means in the context of sanctions exposure, and knowing when a maintenance flag becomes a fleet availability problem.",
      "This depth is not buildable from first principles by a team that serves every industry. It requires domain commitment — and that commitment is the moat.",
    ],
  },
  "multi-tenant-isolation": {
    title: "Multi-tenant isolation as a building material",
    date: "December 2025",
    tag: "Engineering",
    content: [
      "Security bolted on after the fact is always weaker than security designed in from the start.",
      "True multi-tenant isolation goes beyond storing data in separate database rows with a tenant_id column. It means separate compute contexts, separate credential namespaces, separate audit chains, and separate encryption key management.",
      "When you're handling sensitive data — fleet voyage economics, intelligence signals, client advisory materials — the bar is higher than most platforms meet. A single join that spans tenant boundaries, a shared cache without proper key isolation, a logging system that aggregates across tenants: any of these can become a security incident.",
      "The platforms I build treat isolation as a building material, not a compliance checkbox. This adds complexity up front and slows initial development. It also means you never have to explain to an enterprise customer why their data appeared in another organisation's audit log.",
    ],
  },
  "founding-szl-holdings": {
    title: "On building a portfolio company from scratch",
    date: "November 2025",
    tag: "Founder Notes",
    content: [
      "The portfolio company model is unusual for a founder-led business. Most founders build one product, find product-market fit, and scale it. The portfolio model bets on something different: that shared infrastructure, shared brand, and shared capital allocation can create more value across a set of complementary domain-specific platforms than any single platform could generate alone.",
      "The case for this model rests on a few beliefs. First, that domain-specific AI platforms have more durable defensibility than horizontal tools. Second, that shared infrastructure — authentication, observability, component libraries, AI routing — reduces the marginal cost of each new platform substantially. Third, that a strong holding brand can transfer trust across different product categories.",
      "Eighteen months in, building across five domains simultaneously, I've learned that the shared infrastructure thesis holds — but the coordination cost is higher than I expected. Every architectural decision made for one product ripples through the others. This is a feature when you get it right, and a liability when you don't.",
    ],
  },
};

export function WritingDetail() {
  const [match, params] = useRoute("/writing/:slug");
  const slug = params?.slug || "";
  const post = posts[slug];

  if (!post) {
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
        <div className="prose prose-invert max-w-none space-y-5">
          {post.content.map((para, i) => (
            <p key={i} className="text-[15px] text-muted-foreground/80 leading-[1.75]">{para}</p>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WritingDetail;
