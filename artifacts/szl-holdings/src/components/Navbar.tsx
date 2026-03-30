import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Alloy", href: "/alloy", external: "/alloy/" },
  { label: "Lyte", href: "/lyte", external: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels", external: "/vessels/" },
  { label: "Carlota Jo", href: "/carlota-jo", external: "/carlota-jo/" },
  { label: "Founder", href: "/founder" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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
        <Link href="/" className="flex items-center gap-3 group" aria-label="SZL Holdings">
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
            }}>SZL</span>
          </div>
          <span style={{
            color: "hsl(38,12%,94%)",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "-0.01em",
          }}>
            SZL Holdings
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            const isExternal = !!link.external;
            if (isExternal) {
              return (
                <a
                  key={link.href}
                  href={link.external}
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
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? "hsl(38,12%,94%)" : "hsl(210,5%,58%)",
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
                  (e.currentTarget as HTMLElement).style.color = isActive ? "hsl(38,12%,94%)" : "hsl(210,5%,58%)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </Link>
            );
          })}
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
              {navLinks.map((link) => {
                if (link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.external}
                      style={{
                        color: "hsl(210,5%,62%)",
                        fontSize: "15px",
                        fontWeight: "500",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "6px",
                        textDecoration: "none",
                        transition: "color 0.18s ease, background 0.18s ease",
                      }}
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
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
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
