import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ExternalLink, FileCode,
  Globe, Database, Webhook, Terminal,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { NAV } from "@/developers/constants";
import { OverviewSection } from "@/developers/OverviewSection";
import { AuthSection } from "@/developers/AuthSection";
import { RestApiSection } from "@/developers/RestApiSection";
import { GraphQLSection } from "@/developers/GraphQLSection";
import { WebhooksSection } from "@/developers/WebhooksSection";
import { CodeSamplesSection } from "@/developers/CodeSamplesSection";
import { RateLimitsSection } from "@/developers/RateLimitsSection";
import { ErrorsSection } from "@/developers/ErrorsSection";
import { VersioningSection } from "@/developers/VersioningSection";

export default function DevelopersPage() {
  const __pageMeta = usePageMeta({
    title: "Developer Documentation — SZL Holdings",
    description:
      "API reference, authentication guides, GraphQL playground, and integration documentation for the SZL Holdings DreamStack platform.",
  });

  const [activeSection, setActiveSection] = useState("overview");
  const [expandedNav, setExpandedNav] = useState<string[]>(["overview", "authentication", "rest-api"]);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleNav = (id: string) => {
    setExpandedNav((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const parentSection = NAV.find(
              (s) => s.id === id || s.subsections?.some((sub) => sub.id === id)
            );
            if (parentSection) {
              setActiveSection(parentSection.id);
            }
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const ids = NAV.flatMap((s) => [s.id, ...(s.subsections?.map((sub) => sub.id) ?? [])]);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(214,16%,3%)" }}>
        <SiteNav />
  
        {/* Hero */}
        <div
          className="pt-32 pb-16 px-6"
          style={{
            background: "linear-gradient(180deg, hsla(218,72%,22%,0.12) 0%, transparent 100%)",
            borderBottom: "1px solid hsla(0,0%,100%,0.06)",
          }}
        >
          <div className="max-w-[1280px] mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "hsl(218,72%,65%)",
                  background: "hsla(218,72%,52%,0.1)",
                  border: "1px solid hsla(218,72%,52%,0.2)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "3px",
                }}
              >
                v0.2.0
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "hsl(142,62%,48%)",
                  background: "hsla(142,62%,42%,0.1)",
                  border: "1px solid hsla(142,62%,42%,0.2)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "3px",
                }}
              >
                stable
              </span>
            </div>
  
            <h1
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "hsl(38,10%,94%)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Developer Documentation
            </h1>
  
            <p
              className="mb-8 max-w-2xl"
              style={{
                fontSize: "1.0625rem",
                color: "hsl(214,8%,60%)",
                lineHeight: "1.7",
              }}
            >
              Complete API reference, integration guides, and interactive exploration tools
              for the SZL Holdings DreamStack platform. Build on top of the same APIs that
              power Counsel, SEXTANT, DOMAINE, and PARAGON.
            </p>
  
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Globe, label: "REST API", href: "#rest-api" },
                { icon: Database, label: "GraphQL", href: "#graphql" },
                { icon: Webhook, label: "Webhooks", href: "#webhooks" },
                { icon: Terminal, label: "Code Samples", href: "#code-samples" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(href.slice(1));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    background: "hsla(214,14%,9%,0.8)",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                    color: "hsl(214,8%,72%)",
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-display)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.14)";
                    (e.currentTarget as HTMLElement).style.color = "hsl(38,10%,88%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "hsl(214,8%,72%)";
                  }}
                >
                  <Icon size={14} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
  
        {/* Main layout */}
        <div className="max-w-[1280px] mx-auto px-6 flex gap-8 py-12">
          {/* Sidebar */}
          <aside
            className="hidden lg:block flex-shrink-0 sticky top-24 self-start"
            style={{ width: "220px", maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}
          >
            <nav className="space-y-0.5">
              {NAV.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedNav.includes(section.id);
                const isActive = activeSection === section.id;
  
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        scrollTo(section.id);
                        if (section.subsections) toggleNav(section.id);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left transition-colors duration-150"
                      style={{
                        background: isActive
                          ? "hsla(38,55%,60%,0.08)"
                          : "transparent",
                        color: isActive
                          ? "hsl(38,55%,70%)"
                          : "hsl(214,8%,62%)",
                        borderLeft: isActive
                          ? "2px solid hsl(38,55%,60%)"
                          : "2px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={13} />
                        <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-display)" }}>
                          {section.label}
                        </span>
                      </div>
                      {section.subsections && (
                        <ChevronDown
                          size={12}
                          style={{
                            transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 0.2s",
                            color: "hsl(214,8%,44%)",
                          }}
                        />
                      )}
                    </button>
  
                    <AnimatePresence>
                      {section.subsections && isExpanded && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-5 pl-3 space-y-0.5 py-1" style={{ borderLeft: "1px solid hsla(0,0%,100%,0.06)" }}>
                            {section.subsections.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => scrollTo(sub.id)}
                                className="w-full text-left px-2 py-1.5 rounded transition-colors duration-150"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "hsl(214,8%,52%)",
                                  fontFamily: "var(--font-display)",
                                }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(214,8%,78%)")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(214,8%,52%)")}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
  
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                style={{ color: "hsl(218,72%,65%)", fontSize: "0.8125rem" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,75%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,65%)")}
              >
                <ExternalLink size={13} />
                Swagger UI
              </a>
              <a
                href="/api/docs.json"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                style={{ color: "hsl(218,72%,65%)", fontSize: "0.8125rem" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,75%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,65%)")}
              >
                <FileCode size={13} />
                OpenAPI JSON
              </a>
            </div>
          </aside>
  
          {/* Content */}
          <main ref={contentRef} className="flex-1 min-w-0 space-y-16">
  
  
            <OverviewSection scrollTo={scrollTo} />
            <AuthSection />
            <RestApiSection />
            <GraphQLSection />
            <WebhooksSection />
            <CodeSamplesSection />
            <RateLimitsSection />
            <ErrorsSection />
            <VersioningSection />
  
          </main>
        </div>
  
        <SiteFooter />
      </div>
        </>
  );
}
