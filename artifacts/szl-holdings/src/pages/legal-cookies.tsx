import { m } from "framer-motion";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    title: "What are cookies?",
    body: "Cookies are small text files stored on your device when you visit a website. They allow sites to remember preferences, recognize returning visitors, and understand how pages are used. Cookies do not contain personally identifiable information on their own.",
  },
  {
    title: "How we use cookies",
    body: "SZL Holdings uses cookies for two purposes: (1) essential site functionality — session management, authentication state, and security controls that are required for the platform to operate correctly; and (2) analytics — aggregate usage data to understand how the site is navigated and which pages are most useful. We do not use cookies for advertising, retargeting, or user profiling.",
  },
  {
    title: "Essential cookies",
    body: "Essential cookies cannot be disabled without breaking core site functionality. These include session tokens for authenticated users, CSRF protection tokens, and preference settings (such as cookie consent status). These cookies are first-party and expire at session end or within a defined short window.",
  },
  {
    title: "Analytics cookies",
    body: "We use privacy-respecting analytics to understand aggregate page traffic and feature usage. Analytics data is processed in aggregate — individual visitors are not identified or tracked across sessions. You may opt out of analytics cookies at any time through our cookie preference center.",
  },
  {
    title: "Third-party cookies",
    body: "We do not embed third-party advertising networks or social media tracking pixels. Some trusted service providers used for infrastructure and analytics may set their own cookies, which are governed by their privacy policies. These service providers are contractually prohibited from using data collected through our site for their own purposes.",
  },
  {
    title: "Cookie duration",
    body: "Session cookies expire when your browser closes. Persistent cookies (such as preference settings) expire within 12 months unless you clear them earlier. Analytics cookies follow the retention settings of our analytics provider, typically 13 months.",
  },
  {
    title: "Your choices",
    body: "You can control cookies through your browser settings or our cookie preference center. Disabling essential cookies will impact site functionality, including authentication. Disabling analytics cookies will not affect your ability to use the platform.",
  },
  {
    title: "Updates to this policy",
    body: "This Cookie Policy may be updated as our use of cookies changes or as legal requirements evolve. Material changes will be communicated through the site. The date of last update appears below.",
  },
  {
    title: "Contact",
    body: "For questions about how we use cookies: privacy@szlholdings.com.",
  },
];

export default function LegalCookiesPage() {
  usePageMeta({
    title: "Cookie Policy — Legal · SZL Holdings",
    description: "SZL Holdings cookie policy — what cookies we use, why, and how to control them.",
    canonical: "https://szlholdings.com/legal/cookies",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <section style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(3rem,6vw,5rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Legal</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Cookies</span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.1, marginBottom: "1rem" }}>Cookie Policy</h1>
              <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,48%)" }}>Last updated: April 2026</p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {SECTIONS.map((section, i) => (
                <m.div
                  key={section.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(38,8%,90%)", marginBottom: "0.625rem" }}>{section.title}</h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)" }}>{section.body}</p>
                </m.div>
              ))}
            </div>

            <m.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }} style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-szl-border)", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/legal/privacy" className="szl-btn-secondary">Privacy Policy</Link>
              <Link href="/legal/terms" className="szl-btn-secondary">Terms of Service</Link>
              <Link href="/trust" className="szl-btn-ghost">Trust Center</Link>
            </m.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
