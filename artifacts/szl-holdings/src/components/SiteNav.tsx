import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";
import { useAuth } from "@szl-holdings/replit-auth-web";

const NAV_ITEMS = [
  {
    label: "Platform",
    href: "/platform",
    highlight: false,
    children: [
      { label: "Platform Overview", href: "/platform", note: "Governed decision infrastructure" },
      { label: "Lyte", href: "/lyte", note: "Flagship command surface" },
      { label: "Alloy", href: "/alloy-fabric", note: "Governance execution fabric" },
      { label: "CORTEX", href: "https://cortex.szlholdings.com", note: "Mobile command" },
      { label: "Command Portal", href: "/command/", note: "Ecosystem overview" },
    ],
  },
  {
    label: "Primitives",
    href: "/architecture",
    highlight: false,
    children: [
      { label: "Architecture Overview", href: "/architecture", note: "Three-tier design" },
      { label: "Outcome Graph", href: "/docs/architecture", note: "Signal & state fabric" },
      { label: "Proof Chain", href: "/docs/proof-chain", note: "Immutable audit record" },
      { label: "Covenant Policy", href: "/docs/control-plane", note: "Governance layer" },
      { label: "Simulation", href: "/docs/architecture", note: "Decision modeling" },
      { label: "Workflow Engine", href: "/how-it-works", note: "Governed action routing" },
    ],
  },
  {
    label: "Domain Packs",
    href: "/solutions",
    highlight: false,
    children: [
      { label: "Domain Packs Overview", href: "/solutions", note: "Governed vertical extensions" },
      { label: "Aegis", href: "/solutions/aegis", note: "Defense & intelligence  ·  Beta" },
      { label: "Vessels", href: "/solutions/vessels", note: "Maritime intelligence  ·  Beta" },
      { label: "Terra", href: "/solutions/terra", note: "Real estate intelligence  ·  Beta" },
      { label: "PRISM Counsel", href: "/solutions/prism-counsel", note: "Legal operations  ·  Beta" },
      { label: "Carlota Jo", href: "/carlota-jo/", note: "Private advisory  ·  Beta" },
    ],
  },
  {
    label: "Trust",
    href: "/trust",
    highlight: false,
    children: [
      { label: "Trust Center", href: "/trust", note: "Full diligence index" },
      { label: "Security", href: "/trust/security", note: "Controls & posture" },
      { label: "AI Governance", href: "/trust/ai", note: "Model accountability" },
      { label: "Proof Chain", href: "/docs/proof-chain", note: "Audit trail design" },
      { label: "Compliance Architecture", href: "/trust/governance", note: "Policy & audit" },
    ],
  },
  {
    label: "Company",
    href: "/company",
    highlight: false,
    children: [
      { label: "About SZL Holdings", href: "/company", note: "Mission & thesis" },
      { label: "Founder", href: "/founder", note: "Stephen Lutar" },
      { label: "Operating Doctrine", href: "/operating-doctrine", note: "How we build" },
      { label: "Design Partners", href: "/design-partner", note: "Work with us" },
      { label: "Investor Relations", href: "/investor", note: "Series A diligence" },
      { label: "Contact", href: "/contact", note: "" },
    ],
  },
  {
    label: "Resources",
    href: "/insights",
    highlight: false,
    children: [
      { label: "Insights & Analysis", href: "/insights", note: "" },
      { label: "Documentation", href: "/docs", note: "" },
      { label: "FAQ", href: "/faq", note: "" },
      { label: "Case Studies", href: "/case-studies", note: "" },
      { label: "Public Roadmap", href: "/roadmap", note: "" },
    ],
  },
  {
    label: "Demo",
    href: "/demo",
    children: null,
    highlight: true,
  },
];

const NAV_LINKS_MOBILE = [
  { label: "Request a Demo", href: "/demo", primary: true },
  { label: "Design Partners", href: "/design-partner", primary: true },
  { label: "Investor Relations", href: "/investor", primary: true },
  { label: "— Platform —", href: "/platform", primary: false, section: true },
  { label: "Platform Overview", href: "/platform", primary: false },
  { label: "Lyte", href: "/lyte", primary: false },
  { label: "Alloy", href: "/alloy-fabric", primary: false },
  { label: "CORTEX", href: "https://cortex.szlholdings.com", primary: false },
  { label: "Command Portal", href: "/command/", primary: false },
  { label: "— Primitives —", href: "/architecture", primary: false, section: true },
  { label: "Architecture", href: "/architecture", primary: false },
  { label: "Proof Chain", href: "/docs/proof-chain", primary: false },
  { label: "Covenant Policy", href: "/docs/control-plane", primary: false },
  { label: "— Domain Packs —", href: "/solutions", primary: false, section: true },
  { label: "Domain Packs Overview", href: "/solutions", primary: false },
  { label: "Aegis", href: "/solutions/aegis", primary: false },
  { label: "Vessels", href: "/solutions/vessels", primary: false },
  { label: "Terra", href: "/solutions/terra", primary: false },
  { label: "PRISM Counsel", href: "/solutions/prism-counsel", primary: false },
  { label: "Carlota Jo", href: "/carlota-jo/", primary: false },
  { label: "— Trust & Company —", href: "/trust", primary: false, section: true },
  { label: "Trust Center", href: "/trust", primary: false },
  { label: "Security", href: "/trust/security", primary: false },
  { label: "Documentation", href: "/docs", primary: false },
  { label: "Insights", href: "/insights", primary: false },
  { label: "About SZL Holdings", href: "/company", primary: false },
  { label: "Contact", href: "/contact", primary: false },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

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
                              minWidth: "230px",
                              background: "hsl(214,16%,6%)",
                              border: "1px solid var(--color-szl-border-hover)",
                              borderRadius: "0.625rem",
                              padding: "0.375rem",
                              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.30)",
                              backdropFilter: "blur(20px)",
                            }}
                          >
                            {item.children!.map((child) => {
                              const isChildExt = child.href.startsWith("http");
                              const ddStyle = { display: "block", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", textDecoration: "none" as const, transition: "background 0.15s ease" };
                              const ddEnter = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)"; };
                              const ddLeave = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "transparent"; };
                              const childContent = (
                                <>
                                  <span style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-szl-text-secondary)", transition: "color 0.15s ease" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                                  >
                                    {child.label}
                                  </span>
                                  {child.note && (
                                    <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", marginTop: "1px", fontFamily: "var(--font-mono)" }}>
                                      {child.note}
                                    </span>
                                  )}
                                </>
                              );
                              return isChildExt ? (
                                <a key={child.href + child.label} href={child.href} target="_blank" rel="noopener noreferrer" style={ddStyle} onMouseEnter={ddEnter} onMouseLeave={ddLeave}>
                                  {childContent}
                                </a>
                              ) : (
                                <Link key={child.href + child.label} href={child.href} onClick={() => { handleNavClick(child.label, child.href); setOpenDropdown(null); }} style={ddStyle} onMouseEnter={ddEnter} onMouseLeave={ddLeave}>
                                  {childContent}
                                </Link>
                              );
                            })}
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
              {isAuthenticated && (
                <Link
                  href="/forge"
                  onClick={() => handleNavClick("Forge", "/forge")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: location.startsWith("/forge") ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)",
                    textDecoration: "none",
                    padding: "0.375rem 0.625rem",
                    borderRadius: "0.375rem",
                    transition: "color 0.18s ease, background 0.18s ease",
                    borderLeft: "1px solid var(--color-szl-border)",
                    marginLeft: "0.25rem",
                    paddingLeft: "0.75rem",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-accent)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = location.startsWith("/forge") ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  Forge
                </Link>
              )}
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
              <div style={{ padding: "1.25rem var(--space-content-x) 1.5rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                {NAV_LINKS_MOBILE.map((link, idx) => {
                  if ((link as { section?: boolean }).section) {
                    return (
                      <p key={link.href + idx} style={{
                        padding: "0.75rem 0.75rem 0.25rem",
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--color-szl-text-faint)",
                        fontFamily: "var(--font-mono)",
                        marginTop: "0.5rem",
                      }}>
                        {link.label.replace(/^—\s*/, "").replace(/\s*—$/, "")}
                      </p>
                    );
                  }
                  const isExtLink = link.href.startsWith("http");
                  const mobileStyle = {
                    padding: link.primary ? "0.625rem 0.75rem" : "0.4rem 0.75rem",
                    fontSize: link.primary ? "0.9375rem" : "0.875rem",
                    fontWeight: link.primary ? 600 : 500,
                    color: link.primary ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)",
                    textDecoration: "none" as const,
                    borderRadius: "0.375rem",
                    transition: "color 0.18s ease, background 0.18s ease",
                    display: "block",
                    borderBottom: link.primary ? "1px solid var(--color-szl-border)" : "none",
                    marginBottom: link.primary ? "0.5rem" : 0,
                    paddingBottom: link.primary ? "1rem" : undefined,
                  };
                  const mEnter = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; if (!link.primary) (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; };
                  const mLeave = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = link.primary ? "var(--color-szl-accent)" : "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; };

                  if (isExtLink) {
                    return (
                      <a key={link.href + idx} href={link.href} target="_blank" rel="noopener noreferrer" style={mobileStyle} onMouseEnter={mEnter} onMouseLeave={mLeave}>
                        {link.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={link.href + idx}
                      href={link.href}
                      onClick={() => handleNavClick(link.label, link.href)}
                      style={mobileStyle}
                      onMouseEnter={mEnter}
                      onMouseLeave={mLeave}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {isAuthenticated && (
                  <>
                    <div style={{ height: "1px", background: "var(--color-szl-border)", margin: "0.5rem 0.75rem" }} />
                    <Link
                      href="/forge"
                      onClick={() => handleNavClick("Forge", "/forge")}
                      style={{
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--color-szl-accent)",
                        textDecoration: "none",
                        borderRadius: "0.375rem",
                        transition: "color 0.18s ease, background 0.18s ease",
                        display: "block",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-accent)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      Forge
                    </Link>
                  </>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </>
  );
}
