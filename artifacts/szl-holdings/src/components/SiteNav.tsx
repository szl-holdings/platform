import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";

const NAV_ITEMS = [
  {
    label: "Nexus",
    href: "/nexus",
    highlight: true,
    children: null,
  },
  {
    label: "Platform",
    href: "/platform",
    highlight: false,
    children: [
      { label: "Platform Overview", href: "/platform" },
      { label: "Lyte — Business Observability", href: "/lyte" },
      { label: "Alloy — Execution Fabric", href: "/alloy-fabric" },
      { label: "Architecture", href: "/architecture" },
      { label: "HELM CONSOLE — Family Command", href: "/helm" },
    ],
  },
  {
    label: "Lyte",
    href: "/lyte",
    highlight: false,
    children: null,
  },
  {
    label: "Trust",
    href: "/trust",
    highlight: false,
    children: [
      { label: "Trust Center", href: "/trust" },
      { label: "Security", href: "/trust/security" },
      { label: "Architecture", href: "/architecture" },
      { label: "AI Governance", href: "/trust/ai" },
      { label: "Governance", href: "/trust/governance" },
    ],
  },
  {
    label: "Docs",
    href: "/docs",
    highlight: false,
    children: [
      { label: "Documentation", href: "/docs" },
      { label: "Architecture", href: "/docs/architecture" },
      { label: "Control Plane", href: "/docs/control-plane" },
      { label: "Proof Chain", href: "/docs/proof-chain" },
    ],
  },
  {
    label: "Resources",
    href: "/insights",
    highlight: false,
    children: [
      { label: "Insights & Articles", href: "/insights" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "FAQ", href: "/faq" },
      { label: "Public Roadmap", href: "/roadmap" },
      { label: "What SZL Relieves", href: "/relief" },
      { label: "ROI Calculator", href: "/roi" },
      { label: "Platform Packages", href: "/packages" },
    ],
  },
  {
    label: "Company",
    href: "/company",
    highlight: false,
    children: [
      { label: "About SZL Holdings", href: "/company" },
      { label: "Operating Doctrine", href: "/operating-doctrine" },
      { label: "Founder", href: "/founder" },
      { label: "Design Partners", href: "/design-partner" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Fund Intel",
    href: "/fund",
    highlight: false,
    children: [
      { label: "Fund Intelligence Hub", href: "/fund" },
      { label: "AI Deal Scoring", href: "/fund/deal-scoring" },
      { label: "LP Report Generation", href: "/fund/lp-reports" },
      { label: "Portfolio Intelligence", href: "/fund/portfolio-intelligence" },
      { label: "Cap Table & Waterfall", href: "/fund/cap-table" },
      { label: "Exit Modeling", href: "/fund/exit-modeling" },
      { label: "Treasury & Cash Mgmt", href: "/fund/treasury" },
      { label: "SEC & Compliance", href: "/fund/compliance" },
      { label: "LP Communication", href: "/fund/lp-crm" },
      { label: "Fund Benchmarking", href: "/fund/benchmarking" },
      { label: "Co-Investment & SPVs", href: "/fund/co-invest" },
    ],
  },
  {
    label: "Demo",
    href: "/demo",
    children: null,
    highlight: false,
  },
];

const NAV_LINKS_MOBILE = [
  { label: "Nexus Command", href: "/nexus", primary: true },
  { label: "Fund Intelligence", href: "/fund", primary: true },
  { label: "Demo", href: "/demo", primary: true },
  { label: "Platform Overview", href: "/platform", primary: false },
  { label: "Lyte", href: "/lyte", primary: false },
  { label: "Alloy", href: "/alloy-fabric", primary: false },
  { label: "Architecture", href: "/architecture", primary: false },
  { label: "Trust Center", href: "/trust", primary: false },
  { label: "Security", href: "/trust/security", primary: false },
  { label: "Docs", href: "/docs", primary: false },
  { label: "Insights", href: "/insights", primary: false },
  { label: "Case Studies", href: "/case-studies", primary: false },
  { label: "Company", href: "/company", primary: false },
  { label: "Founder", href: "/founder", primary: false },
  { label: "Design Partners", href: "/design-partner", primary: false },
  { label: "Contact", href: "/contact", primary: false },
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.125rem" }} className="hidden lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const hasChildren = !!item.children;
                const isOpen = openDropdown === item.label;

                if (item.highlight) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleNavClick(item.label, item.href)}
                      className="szl-btn-primary"
                      style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", marginLeft: "0.5rem" }}
                    >
                      {item.label}
                    </Link>
                  );
                }

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
                              minWidth: "200px",
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
              <UserButton />
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
                      padding: link.primary ? "0.625rem 0.75rem" : "0.5rem 0.75rem",
                      fontSize: link.primary ? "0.9375rem" : "0.875rem",
                      fontWeight: link.primary ? 600 : 500,
                      color: link.primary ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, background 0.18s ease",
                      display: "block",
                      borderBottom: link.primary ? "1px solid var(--color-szl-border)" : "none",
                      marginBottom: link.primary ? "0.5rem" : 0,
                      paddingBottom: link.primary ? "1rem" : undefined,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; if (!link.primary) (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = link.primary ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </>
  );
}
