import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const QUICK_LINKS = [
  { label: "Platform overview", href: "/platform" },
  { label: "Lyte — Business observability", href: "/lyte" },
  { label: "Request a demo", href: "/demo" },
  { label: "Trust Center", href: "/trust" },
  { label: "About the company", href: "/company" },
  { label: "Contact", href: "/contact" },
];

export default function NotFoundPage() {
  usePageMeta({
    title: "404 — Page not found | SZL Holdings",
    description: "The page you were looking for doesn't exist.",
    canonical: "https://szlholdings.com/404",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <section style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(4rem,10vw,8rem)", fontWeight: 700, letterSpacing: "-0.04em", color: "hsla(0,0%,100%,0.04)", lineHeight: 1, marginBottom: "1rem", userSelect: "none" }}>
                404
              </p>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Page not found
              </p>
              <h1 style={{ fontSize: "clamp(1.5rem,3.5vw,2.5rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.1, maxWidth: "24ch", marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                This page doesn't exist or was moved.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", maxWidth: "40ch", marginBottom: "2.5rem" }}>
                Use the links below to find what you're looking for, or go back to the homepage.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "3rem" }}>
                <Link
                  href="/"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "hsl(192,72%,48%)",
                    color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                >
                  Back to homepage
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/contact"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: "var(--color-szl-text-secondary)",
                    border: "1px solid var(--color-szl-border-hover)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  Contact us
                </Link>
              </div>

              <div style={{ borderTop: "1px solid var(--color-szl-border)", paddingTop: "2.5rem" }}>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                  Quick links
                </p>
                <div style={{ display: "grid", gap: "0.5rem" }} className="sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        fontSize: "0.875rem", fontWeight: 500,
                        color: "var(--color-szl-text-secondary)",
                        textDecoration: "none",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "0.375rem",
                        border: "1px solid var(--color-szl-border)",
                        transition: "color 0.18s ease, border-color 0.18s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border)"; }}
                    >
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </m.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
