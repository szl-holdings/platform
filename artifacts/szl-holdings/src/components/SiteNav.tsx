import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";
import { useAuth } from "@szl-holdings/replit-auth-web";

const NAV_ITEMS = [
  {
    label: "Ecosystem",
    href: "/ecosystem",
    highlight: false,
    children: null,
  },
  {
    label: "Alloy",
    href: "/alloy-fabric",
    highlight: false,
    children: null,
  },
  {
    label: "Lyte",
    href: "/lyte",
    highlight: false,
    children: null,
  },
  {
    label: "Vessels",
    href: "/products/vessels",
    highlight: false,
    children: null,
  },
  {
    label: "Carlota Jo",
    href: "/services/carlota-jo",
    highlight: false,
    children: null,
  },
  {
    label: "Founder",
    href: "/founder",
    highlight: false,
    children: null,
  },
  {
    label: "Contact",
    href: "/contact",
    children: null,
    highlight: true,
  },
];

const NAV_LINKS_MOBILE = [
  { label: "Contact", href: "/contact", primary: true },
  { label: "Ecosystem", href: "/ecosystem", primary: false },
  { label: "Alloy", href: "/alloy-fabric", primary: false },
  { label: "Lyte", href: "/lyte", primary: false },
  { label: "Vessels", href: "/products/vessels", primary: false },
  { label: "Carlota Jo", href: "/services/carlota-jo", primary: false },
  { label: "Founder", href: "/founder", primary: false },
  { label: "Investors", href: "/investor-relations", primary: false },
  { label: "Trust Center", href: "/trust", primary: false },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = isAuthenticated
    ? [...NAV_ITEMS.slice(0, -1), { label: "Nerve Center", href: "/nerve-center", highlight: false, children: null }, NAV_ITEMS[NAV_ITEMS.length - 1]]
    : NAV_ITEMS;

  const mobileLinks = isAuthenticated
    ? [...NAV_LINKS_MOBILE, { label: "Nerve Center", href: "/nerve-center", primary: false }]
    : NAV_LINKS_MOBILE;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
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
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");

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
                {mobileLinks.map((link) => (
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
