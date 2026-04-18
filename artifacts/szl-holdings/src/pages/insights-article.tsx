import { useLocation, useParams } from "wouter";
import { m } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Twitter,
  Linkedin,
  Link2,
  ChevronRight,
  User,
} from "lucide-react";
import { getInsightBySlug, getRelatedInsights } from "@/data/insights";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  "Annual Letter": "text-amber-600 bg-amber-50 border-amber-200",
  "Maritime Intelligence": "text-sky-700 bg-sky-50 border-sky-200",
  "Cybersecurity": "text-red-700 bg-red-50 border-red-200",
  "AI/ML": "text-violet-700 bg-violet-50 border-violet-200",
  "Real Estate": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Creative Tech": "text-pink-700 bg-pink-50 border-pink-200",
  "Operations": "text-indigo-700 bg-indigo-50 border-indigo-200",
};

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-szl-text">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : text;
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="font-[var(--font-display)] text-3xl sm:text-4xl font-extrabold text-szl-text mb-8 leading-tight tracking-tight">
          {line.slice(2)}
        </h1>
      );
      i++;
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="font-[var(--font-display)] text-xl font-bold text-szl-text mt-10 mb-4 tracking-tight">
          {line.slice(3)}
        </h2>
      );
      i++;
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="font-[var(--font-display)] text-base font-bold text-szl-text mt-8 mb-3 tracking-tight">
          {line.slice(4)}
        </h3>
      );
      i++;
    } else if (line.startsWith("*") && line.endsWith("*") && line.length > 2 && !line.startsWith("**")) {
      nodes.push(
        <p key={key++} className="text-szl-text-secondary text-sm italic mb-6 leading-relaxed">
          {line.slice(1, -1)}
        </p>
      );
      i++;
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc pl-5 mb-5 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="text-szl-text-secondary text-[15px] leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      nodes.push(
        <p key={key++} className="text-szl-text-secondary leading-relaxed mb-5 text-[15px]">
          {renderInline(line)}
        </p>
      );
      i++;
    }
  }

  return nodes;
}

export default function InsightsArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [copied, setCopied] = useState(false);
  const [, navigate] = useLocation();

  const article = getInsightBySlug(slug);
  const related = getRelatedInsights(slug, 3);

  const canonicalUrl = article ? `https://szlholdings.com/insights/${article.slug}` : "https://szlholdings.com/insights";

  usePageMeta({
    title: article ? `${article.title} | SZL Holdings Insights` : "Article Not Found | SZL Holdings",
    description: article?.excerpt,
    canonical: canonicalUrl,
    ogImage: "https://szlholdings.com/opengraph.jpg",
  });

  useEffect(() => {
    if (!article) return;
    const articleLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt,
      "author": {
        "@type": "Person",
        "name": article.author,
        "jobTitle": article.authorTitle,
        "url": "https://szlholdings.com/founder",
      },
      "publisher": {
        "@type": "Organization",
        "name": "SZL Holdings",
        "logo": { "@type": "ImageObject", "url": "https://szlholdings.com/opengraph.jpg" },
      },
      "datePublished": article.date,
      "url": `https://szlholdings.com/insights/${article.slug}`,
      "articleSection": article.category,
      "keywords": article.tags.join(", "),
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "SZL Holdings", "item": "https://szlholdings.com/" },
          { "@type": "ListItem", "position": 2, "name": "Insights", "item": "https://szlholdings.com/insights" },
          { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://szlholdings.com/insights/${article.slug}` },
        ],
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "article-ld";
    script.textContent = JSON.stringify(articleLd);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("article-ld");
      if (el) el.remove();
    };
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 pt-24">
          <p className="text-szl-text-secondary text-lg">Article not found.</p>
          <button
            onClick={() => navigate("/insights")}
            className="flex items-center gap-2 text-sm font-semibold text-szl-primary"
          >
            <ArrowLeft size={14} />
            Back to Insights
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="pt-24">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => navigate("/insights")}
              className="inline-flex items-center gap-2 text-xs font-medium text-szl-text-secondary hover:text-szl-text transition-colors mb-8 bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Back to Insights
            </button>
          </m.div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-16">
            <m.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[article.category] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                  <Tag size={9} />
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-szl-text-muted">
                  <Clock size={11} />
                  {article.readTime} min read
                </span>
                <span className="flex items-center gap-1 text-xs text-szl-text-muted">
                  <Calendar size={11} />
                  {article.date}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-8">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-szl-bg-secondary border border-szl-border text-szl-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="max-w-none">
                {renderMarkdown(article.content)}
              </div>

              <div className="mt-12 pt-8 border-t border-szl-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-szl-primary/10 flex items-center justify-center">
                    <User size={18} className="text-szl-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-szl-text text-sm">{article.author}</p>
                    <p className="text-xs text-szl-text-muted">{article.authorTitle}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-szl-border">
                <p className="text-xs font-semibold text-szl-text-secondary uppercase tracking-widest mb-3">
                  Share this article
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-szl-border text-xs font-medium text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover transition-colors"
                  >
                    <Twitter size={13} />
                    Twitter
                  </a>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-szl-border text-xs font-medium text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover transition-colors"
                  >
                    <Linkedin size={13} />
                    LinkedIn
                  </a>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-szl-border text-xs font-medium text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover transition-colors cursor-pointer bg-transparent"
                  >
                    <Link2 size={13} />
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            </m.article>

            <aside className="hidden lg:block">
              <m.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="sticky top-28 space-y-8"
              >
                {related.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">
                      Related Articles
                    </h4>
                    <div className="space-y-4">
                      {related.map((r) => (
                        <button
                          key={r.slug}
                          onClick={() => navigate(`/insights/${r.slug}`)}
                          className="group block w-full text-left p-4 rounded-xl border border-szl-border hover:border-szl-primary/40 hover:bg-szl-bg-secondary transition-all bg-transparent cursor-pointer"
                        >
                          <span className={`inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2 ${CATEGORY_COLORS[r.category] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                            {r.category}
                          </span>
                          <p className="text-xs font-semibold text-szl-text group-hover:text-szl-accent transition-colors leading-snug mb-2">
                            {r.title}
                          </p>
                          <span className="flex items-center gap-1 text-[10px] text-szl-text-muted">
                            <Clock size={9} />
                            {r.readTime} min read
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-xl bg-szl-bg-secondary border border-szl-border">
                  <div className="w-7 h-7 rounded-md bg-szl-primary flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-xs">S</span>
                  </div>
                  <p className="text-xs font-semibold text-szl-text mb-1">About SZL Holdings</p>
                  <p className="text-[11px] text-szl-text-secondary leading-relaxed mb-3">
                    A governed operational intelligence platform — six domain packs built on a shared governed decision loop.
                  </p>
                  <button
                    onClick={() => navigate("/insights")}
                    className="flex items-center gap-1 text-[11px] font-semibold text-szl-primary hover:gap-2 transition-all bg-transparent border-0 cursor-pointer"
                  >
                    More Insights <ChevronRight size={11} />
                  </button>
                </div>
              </m.div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
