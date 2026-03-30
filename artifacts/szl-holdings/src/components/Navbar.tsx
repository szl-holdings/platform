import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Ecosystem", href: "#portfolio" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
  { label: "Founder", href: "/stephen/" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <m.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
        scrolled
          ? "bg-[hsla(210,12%,5%,0.94)] backdrop-blur-xl border-b border-[hsla(0,0%,100%,0.06)] shadow-[0_1px_24px_hsla(0,0%,0%,0.36)]"
          : "bg-transparent"
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[60px] flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group" aria-label="SZL Holdings">
          <div className="w-7 h-7 rounded-[6px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(210, 12%, 24%), hsl(210, 10%, 18%))",
              border: "1px solid hsla(0,0%,100%,0.10)",
            }}
          >
            <span style={{
              color: "hsl(38,12%,94%)",
              fontWeight: "700",
              fontSize: "11px",
              letterSpacing: "-0.02em",
              fontFamily: "system-ui",
            }}>S</span>
          </div>
          <span style={{
            color: "hsl(38,12%,94%)",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "-0.01em",
          }}>
            SZL Holdings
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              style={{
                color: "hsl(210,5%,58%)",
                fontSize: "13px",
                fontWeight: "500",
                padding: "0.375rem 0.875rem",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "color 0.18s ease, background 0.18s ease",
                letterSpacing: "-0.003em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)";
                (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,58%)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "0.5rem",
              padding: "0.4375rem 1.125rem",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              letterSpacing: "-0.005em",
              color: "hsl(210,12%,6%)",
              background: "hsl(210,8%,84%)",
              border: "1px solid transparent",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px hsla(0,0%,0%,0.20)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,84%)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Get in touch
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md transition-colors duration-200"
          style={{ color: "hsl(210,5%,58%)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,58%)"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "hsla(210,12%,6%,0.98)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid hsla(0,0%,100%,0.06)",
              overflow: "hidden",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: "hsl(210,5%,62%)",
                    fontSize: "15px",
                    fontWeight: "500",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    transition: "color 0.18s ease, background 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,62%)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: "hsl(210,12%,6%)",
                  background: "hsl(210,8%,84%)",
                  transition: "all 0.18s ease",
                }}
              >
                Get in touch
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
