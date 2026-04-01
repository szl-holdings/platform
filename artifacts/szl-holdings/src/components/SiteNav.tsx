import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV_LINKS_PRIMARY = [
  { label: "Platform", href: "/platform" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Trust", href: "/trust" },
  { label: "Investors", href: "/investors" },
];

const NAV_LINKS_MOBILE = [
  { label: "Platform", href: "/platform" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Trust", href: "/trust" },
  { label: "Investors", href: "/investors" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleNavClick = (label: string, href: string) => {
    analytics.navLinkClick(label, href);
  };

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
    <m.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "szl-glass" : "bg-transparent"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => handleNavClick("SZL Holdings", "/")}
        >
          <div
            className="w-8 h-8 flex items-center justify-center rounded-sm"
            style={{
              background: "linear-gradient(135deg, var(--color-szl-accent) 0%, hsla(38, 55%, 45%, 1) 100%)",
            }}
          >
            <span
              style={{
                color: "hsl(214, 16%, 4%)",
                fontWeight: 700,
                fontSize: "0.6875rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em",
              }}
            >
              SZL
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "var(--color-szl-text)",
              letterSpacing: "-0.02em",
            }}
          >
            SZL Holdings
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {NAV_LINKS_PRIMARY.map((link) => {
            const isActive = location === link.href;
            const commonStyle = {
              fontSize: "0.8125rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              transition: "color 0.2s ease",
              color: isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)",
              position: "relative" as const,
              textDecoration: "none",
            };
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.label, link.href)}
                style={commonStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)";
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: 0,
                      right: 0,
                      height: "1px",
                      background: "var(--color-szl-accent)",
                      opacity: 0.8,
                    }}
                  />
                )}
              </Link>
            );
          })}
          <Link
            href="/design-partners"
            onClick={() => handleNavClick("Request Conversation", "/design-partners")}
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              color: "hsl(210,12%,6%)",
              background: "hsl(210,8%,88%)",
              padding: "0.375rem 0.875rem",
              borderRadius: "4px",
              textDecoration: "none",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
          >
            Get in touch
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-1.5 transition-colors"
          style={{ color: "var(--color-szl-text-secondary)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
            style={{
              background: "hsla(214, 14%, 6%, 0.97)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--color-szl-border)",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {NAV_LINKS_MOBILE.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.label, link.href)}
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--color-szl-text-secondary)",
                    transition: "color 0.2s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/design-partners"
                onClick={() => handleNavClick("Get in touch", "/design-partners")}
                style={{
                  marginTop: "0.5rem",
                  display: "inline-flex",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "hsl(210,12%,6%)",
                  background: "hsl(210,8%,88%)",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  textDecoration: "none",
                  alignSelf: "flex-start",
                }}
              >
                Get in touch
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
    </>
  );
}
