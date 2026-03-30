import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

const posts = [
  { slug: "accountability-gap-enterprise-ai", tag: "AI & Enterprise", title: "The accountability gap in enterprise AI", excerpt: "Most enterprise AI tools optimise for output quality. What they underinvest in is decision accountability — the trail from model recommendation to human action. This matters more than any benchmark.", date: "March 2026" },
  { slug: "command-interface-underbuilt", tag: "Product", title: "The command interface is underbuilt", excerpt: "Enterprise software excels at showing you what's wrong. It is poor at helping you decide what to do in the next ten minutes. The gap between visibility and action is where most platforms stop.", date: "February 2026" },
  { slug: "vertical-intelligence-vs-horizontal-tooling", tag: "Strategy", title: "Vertical intelligence beats horizontal tooling", excerpt: "General-purpose AI wins on breadth. But in operations with genuine domain complexity — maritime logistics, financial research, AI development — breadth is a liability. Depth is the defensible position.", date: "January 2026" },
  { slug: "multi-tenant-isolation", tag: "Engineering", title: "Multi-tenant isolation as a building material", excerpt: "Security bolted on after the fact is always weaker than security designed in from the start. True tenant isolation is a design decision about compute separation, not a configuration switch.", date: "December 2025" },
  { slug: "founding-szl-holdings", tag: "Founder Notes", title: "On building a portfolio company from scratch", excerpt: "The case for a holding structure: portfolio companies that share infrastructure but operate independently. What I've learned building SZL Holdings across five domains in eighteen months.", date: "November 2025" },
];

export function Writing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Writing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Notes, essays, and thinking</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            On enterprise software, AI infrastructure, product design, and building from first principles.
          </p>
        </div>

        <div className="space-y-px">
          {posts.map((post) => (
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
