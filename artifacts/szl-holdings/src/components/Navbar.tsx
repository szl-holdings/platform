import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Alloy", href: "/alloy", external: "/alloy/" },
  { label: "Lyte", href: "/lyte", external: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels", external: "/vessels/" },
  { label: "Trust", href: "/trust" },
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

  const fontStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  };

  return (
    <>
      <a
        href="#main-content"
        className="skip-to-content"
        style={{
          position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden",
          zIndex: 9999, background: "hsl(192,72%,48%)", color: "#000", padding: "0.5rem 1rem",
          fontSize: "0.875rem", fontWeight: 600, borderRadius: "0 0 0.25rem 0.25rem",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "0";
          e.currentTarget.style.width = "auto";
          e.currentTarget.style.height = "auto";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
          e.currentTarget.style.width = "1px";
          e.currentTarget.style.height = "1px";
        }}
      >
        Skip to main content
      </a>
      <m.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
          scrolled
            ? "backdrop-blur-xl border-b shadow-[0_1px_28px_hsla(0,0%,0%,0.42)]"
            : "bg-transparent"
        }`}
        style={{
          background: scrolled ? "hsla(210,12%,5%,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid hsla(0,0%,100%,0.07)" : "none",
          ...fontStyle,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="SZL Holdings">
          <div className="w-7 h-7 flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(210, 12%, 22%), hsl(210, 10%, 16%))",
              border: "1px solid hsla(0,0%,100%,0.12)",
              borderRadius: "4px",
            }}
          >
            <span style={{
              color: "hsl(38,12%,92%)",
              fontWeight: "700",
              fontSize: "10px",
              letterSpacing: "-0.02em",
              fontFamily: "system-ui",
            }}>SZL</span>
          </div>
          <span style={{
            color: "hsl(38,12%,92%)",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "-0.012em",
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
                    color: isActive ? "hsl(38,12%,88%)" : "hsl(210,5%,52%)",
                    fontSize: "13px",
                    fontWeight: "500",
                    padding: "0.375rem 0.875rem",
                    borderRadius: "4px",
                    textDecoration: "none",
                    transition: "color 0.18s ease, background 0.18s ease",
                    letterSpacing: "-0.003em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,92%)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,52%)";
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
                  color: isActive ? "hsl(38,12%,88%)" : "hsl(210,5%,52%)",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "0.375rem 0.875rem",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "color 0.18s ease, background 0.18s ease",
                  letterSpacing: "-0.003em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,92%)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,52%)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          className="md:hidden flex items-center justify-center"
          style={{
            width: "36px",
            height: "36px",
            background: "transparent",
            border: "1px solid hsla(0,0%,100%,0.08)",
            borderRadius: "4px",
            color: "hsl(210,5%,60%)",
            cursor: "pointer",
          }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
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
              background: "hsla(210,12%,5%,0.97)",
              borderBottom: "1px solid hsla(0,0%,100%,0.07)",
              overflow: "hidden",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isExternal = !!link.external;
                if (isExternal) {
                  return (
                    <a
                      key={link.href}
                      href={link.external}
                      style={{
                        color: "hsl(210,5%,60%)",
                        fontSize: "14px",
                        fontWeight: "500",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "4px",
                        textDecoration: "none",
                        transition: "color 0.18s ease",
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
                      color: "hsl(210,5%,60%)",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "4px",
                      textDecoration: "none",
                      transition: "color 0.18s ease",
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
    </>
  );
}
