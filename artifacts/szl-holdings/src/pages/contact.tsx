import { useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const CONTACT_PATHS = [
  {
    audience: "Product / Platform Inquiry",
    headline: "Demo a platform or request a pilot",
    body: "Product demonstrations, pilot programs, and enterprise deployment conversations for Lyte and Vessels.",
    cta: "Start here",
    href: "mailto:hello@szlholdings.com?subject=Platform Inquiry",
  },
  {
    audience: "Service Inquiry",
    headline: "Carlota Jo — operational and residence support",
    body: "Discreet, high-trust operational support for principals and organizations with complex environments.",
    cta: "Contact",
    href: "/carlota-jo/",
  },
  {
    audience: "Strategic Partnership",
    headline: "Integration and co-development opportunities",
    body: "Integration opportunities, co-development proposals, and strategic alliance inquiries across the ecosystem.",
    cta: "Start here",
    href: "mailto:hello@szlholdings.com?subject=Strategic Partnership",
  },
  {
    audience: "Founder / Recruiting",
    headline: "Executive search, advisory, and strategic roles",
    body: "Conversations about executive roles, advisory engagements, and strategic recruiting aligned to the ecosystem.",
    cta: "Start here",
    href: "mailto:hello@szlholdings.com?subject=Recruiting Inquiry",
  },
  {
    audience: "Ecosystem / General",
    headline: "General inquiries about SZL Holdings",
    body: "Everything else — including press, research, and general ecosystem questions.",
    cta: "Start here",
    href: "mailto:hello@szlholdings.com",
  },
];

export default function ContactPage() {
  useEffect(() => {
    document.title = "Contact | SZL Holdings";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Contact SZL Holdings for ecosystem discussions, product inquiries, strategic conversations, partnerships, and founder-related opportunities.");
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />

      <main className="pt-24">
        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Contact
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "700", letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: "1.08", marginBottom: "1.25rem" }}>
                Start the right conversation.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", maxWidth: "32rem" }}>
                Choose the path that fits the conversation, and we will route it with clarity.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="max-w-[720px] space-y-3">
              {CONTACT_PATHS.map((path, i) => (
                <m.div
                  key={path.audience}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.375rem 1.5rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>
                        {path.audience}
                      </p>
                      <p style={{ fontSize: "14.5px", fontWeight: "600", color: "hsl(38,12%,90%)", marginBottom: "0.4rem", letterSpacing: "-0.005em" }}>
                        {path.headline}
                      </p>
                      <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "hsl(210,5%,54%)" }}>
                        {path.body}
                      </p>
                    </div>
                    <a
                      href={path.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "hsl(210,5%,56%)",
                        textDecoration: "none",
                        flexShrink: 0,
                        transition: "all 0.18s ease",
                        padding: "0.4rem 0.875rem",
                        borderRadius: "6px",
                        border: "1px solid hsla(0,0%,100%,0.08)",
                        marginTop: "0.25rem",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,90%)";
                        (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.14)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)";
                        (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                      }}
                    >
                      {path.cta}
                      <ArrowRight size={11} strokeWidth={2.5} />
                    </a>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
