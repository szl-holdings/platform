import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = "/api";

interface CmsPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  contentType: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
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

const STATIC_POSTS = [
  {
    slug: "vertical-command-systems",
    tag: "Strategy",
    title: "The case for vertical command systems",
    excerpt: "Generic enterprise software serves every industry equally and most industries poorly. The next defensible category is vertical command — platforms with deep domain intelligence built into the data model, not layered on top.",
    date: "March 2026",
  },
  {
    slug: "defensive-only-cybersecurity",
    tag: "Cybersecurity",
    title: "Why defensive-only is the right position in cybersecurity",
    excerpt: "The offensive security market is crowded, regulated, and ethically complex. The defensive market — threat detection, incident command, MSP operations — is where operators live and where the durable enterprise relationships are built.",
    date: "February 2026",
  },
  {
    slug: "distress-intelligence-real-estate",
    tag: "Real Estate",
    title: "Distress intelligence as a real estate operating model",
    excerpt: "Comparable sales analysis is a trailing indicator. The operators who consistently outperform don't wait for listings — they identify distress signals early and reach owners before the asset is marketed. This is a data problem, not a relationships problem.",
    date: "January 2026",
  },
  {
    slug: "building-for-banks",
    tag: "Enterprise",
    title: "Building for banks, not just VCs",
    excerpt: "VC-funded software is optimised for growth metrics. Enterprise software bought by banks is optimised for auditability, compliance, and reliability. These are different products. The ones that try to be both usually fail at both.",
    date: "December 2025",
  },
  {
    slug: "portfolio-architecture",
    tag: "Founder Notes",
    title: "The portfolio architecture: why I built six platforms at once",
    excerpt: "The conventional wisdom for technical founders is to build one thing and scale it. I built six simultaneously. Here's the thesis behind the structure — and what the first two years taught me about whether it's right.",
    date: "November 2025",
  },
  {
    slug: "ai-copilot-command-surface",
    tag: "AI & Product",
    title: "The AI copilot is not the product — the command surface is",
    excerpt: "Everyone is adding a chat interface to their product and calling it AI. The valuable thing is not the chat interface. It is the command surface underneath: the structured intelligence, the evidence chain, the contextualised decision support. The chat box is just a way in.",
    date: "April 2026",
  },
  {
    slug: "data-gravity-enterprise",
    tag: "Enterprise",
    title: "Data gravity and the enterprise deal that never closes",
    excerpt: "Enterprise software has a gravity problem. The bigger the customer, the harder it is to displace the incumbent — not because the incumbent is good, but because moving a decade of operational data is expensive, risky, and politically difficult. Understanding this is the first step to selling around it.",
    date: "March 2026",
  },
  {
    slug: "maritime-intelligence-underbuilt",
    tag: "Maritime",
    title: "Why maritime intelligence is the most underbuilt vertical in enterprise software",
    excerpt: "The global maritime industry moves 90% of world trade, operates in a highly adversarial intelligence environment, and relies on a combination of AIS transponders, paper-based documentation, and legacy port systems that haven't changed materially since the 1990s. This is not a sector that has been well-served by software.",
    date: "February 2026",
  },
];

export function Writing() {
  const [posts, setPosts] = useState<Array<{ slug: string; tag: string; title: string; excerpt: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/cms/posts?content_type=blog&content_type=case-study`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const apiPosts: CmsPost[] = json?.data ?? [];
        if (apiPosts.length > 0) {
          setPosts(apiPosts.map(p => ({
            slug: p.slug,
            tag: CONTENT_TYPE_LABEL[p.contentType] ?? "Essay",
            title: p.title,
            excerpt: p.excerpt ?? "",
            date: formatDate(p.publishedAt),
          })));
        } else {
          setPosts(STATIC_POSTS);
        }
      })
      .catch(() => setPosts(STATIC_POSTS))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const displayPosts = loading ? STATIC_POSTS : posts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Writing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Notes, essays, and thinking</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            On enterprise software, AI infrastructure, vertical intelligence, and building from first principles.
          </p>
        </div>

        <div className="space-y-px">
          {displayPosts.map((post) => (
            <Link key={post.slug} href={`/writing/${post.slug}`}>
              <div className="group border-t border-white/5 py-7 cursor-pointer px-1 -mx-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-white/35 border border-white/8">
                    {post.tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground/40 font-mono">{post.date}</span>
                </div>
                <h2 className="text-[17px] font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-muted-foreground text-[13.5px] leading-relaxed max-w-xl">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Writing;
