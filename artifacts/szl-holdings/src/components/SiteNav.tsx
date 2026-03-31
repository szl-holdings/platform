import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Alloy", href: "/alloy", external: "/alloy/" },
  { label: "Lyte", href: "/lyte", external: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels", external: "/vessels/" },
  { label: "Firestorm", href: "/firestorm", external: "/firestorm/" },
  { label: "INCA", href: "/inca", external: "/inca/" },
  { label: "Terra", href: "/terra", external: "/terra/" },
  { label: "Rosie", href: "/msp", external: "/msp/" },
  { label: "Carlota Jo", href: "/carlota-jo", external: "/carlota-jo/" },
  { label: "Founder", href: "/founder" },
  { label: "Contact", href: "/contact" },
];

const NAV_LINKS_PRIMARY = [
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Alloy", href: "/alloy", external: "/alloy/" },
  { label: "Lyte", href: "/lyte", external: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels", external: "/vessels/" },
  { label: "Founder", href: "/founder" },
  { label: "Contact", href: "/contact" },
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
            const isExternal = !!link.external;
            const commonStyle = {
              fontSize: "0.8125rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              transition: "color 0.2s ease",
              color: isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)",
              position: "relative" as const,
              textDecoration: "none",
            };
            if (isExternal) {
              return (
                <a
                  key={link.href}
                  href={link.external}
                  onClick={() => handleNavClick(link.label, link.href)}
                  style={commonStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  {link.label}
                </a>
              );
            }
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
            <div className="px-6 py-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => {
                const mobileStyle = {
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  transition: "color 0.2s ease",
                  textDecoration: "none",
                };
                if (link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.external}
                      onClick={() => handleNavClick(link.label, link.href)}
                      style={mobileStyle}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => handleNavClick(link.label, link.href)}
                    style={mobileStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
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
