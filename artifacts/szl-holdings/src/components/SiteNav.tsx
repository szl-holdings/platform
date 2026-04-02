import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Platform", href: "/platform" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Trust", href: "/trust" },
  { label: "Investor Story", href: "/investor-story" },
  {
    label: "More",
    href: "/ventures",
    children: [
      { label: "Platform Map", href: "/ventures" },
      { label: "Investor Relations", href: "/investor-relations" },
      { label: "Demo", href: "/demo" },
      { label: "Docs", href: "/docs" },
    ],
  },
];

const NAV_LINKS_MOBILE = [
  { label: "Platform", href: "/platform" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Trust", href: "/trust" },
  { label: "Investor Story", href: "/investor-story" },
  { label: "Investor Relations", href: "/investor-relations" },
  { label: "Platform Map", href: "/ventures" },
  { label: "Demo", href: "/demo" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const handleNavClick = (label: string, href: string) => {
    analytics.navLinkClick(label, href);
  };

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <m.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "szl-glass" : "bg-transparent"
        )}
        role="navigation"
        aria-label="Main navigation"
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
          <div style={{ height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}
              onClick={() => handleNavClick("SZL Holdings", "/")}
            >
              <div
                style={{
                  width: "30px", height: "30px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "0.3125rem",
                  background: "linear-gradient(135deg, var(--color-szl-accent) 0%, hsl(38,45%,42%) 100%)",
                }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.625rem", color: "hsl(214,18%,3%)", letterSpacing: "-0.02em" }}>
                  SZL
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-szl-text)", letterSpacing: "-0.022em" }}>
                SZL Holdings
              </span>
            </Link>

            {/* Desktop nav */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }} className="hidden lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const hasChildren = !!item.children;
                const isOpen = openDropdown === item.label;

                if (hasChildren) {
                  return (
                    <div
                      key={item.label}
                      style={{ position: "relative" }}
                      onMouseEnter={() => setOpenDropdown(item.label)}
                    >
                      <Link
                        href={item.href}
                        onClick={() => handleNavClick(item.label, item.href)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)",
                          textDecoration: "none",
                          padding: "0.375rem 0.625rem",
                          borderRadius: "0.375rem",
                          transition: "color 0.18s ease, background 0.18s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        {item.label}
                        <ChevronDown size={12} style={{ opacity: 0.6, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                      </Link>

                      <AnimatePresence>
                        {isOpen && (
                          <m.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              minWidth: "220px",
                              background: "hsl(214,16%,6%)",
                              border: "1px solid var(--color-szl-border-hover)",
                              borderRadius: "0.625rem",
                              padding: "0.375rem",
                              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.30)",
                              backdropFilter: "blur(20px)",
                            }}
                          >
                            {item.children!.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => { handleNavClick(child.label, child.href); setOpenDropdown(null); }}
                                style={{
                                  display: "block",
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "0.375rem",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  color: "var(--color-szl-text-secondary)",
                                  textDecoration: "none",
                                  transition: "color 0.15s ease, background 0.15s ease",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.label, item.href)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.375rem 0.625rem",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, background 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "var(--color-szl-text)" : "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/contact"
                onClick={() => handleNavClick("Contact", "/contact")}
                className="szl-btn-primary"
                style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", marginLeft: "0.375rem" }}
              >
                Contact
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden"
              style={{
                padding: "0.375rem",
                background: "transparent",
                border: "none",
                color: "var(--color-szl-text-secondary)",
                cursor: "pointer",
                borderRadius: "0.375rem",
                transition: "color 0.18s ease",
              }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
              style={{
                background: "hsla(214,16%,5%,0.97)",
                backdropFilter: "blur(24px)",
                borderBottom: "1px solid var(--color-szl-border)",
              }}
            >
              <div style={{ padding: "1.25rem var(--space-content-x) 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {NAV_LINKS_MOBILE.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => handleNavClick(link.label, link.href)}
                    style={{
                      padding: "0.625rem 0.75rem",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, background 0.18s ease",
                      display: "block",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {link.label}
                  </Link>
                ))}
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <Link href="/contact" className="szl-btn-primary" style={{ display: "inline-flex" }}>
                    Book a conversation
                  </Link>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </>
  );
}
