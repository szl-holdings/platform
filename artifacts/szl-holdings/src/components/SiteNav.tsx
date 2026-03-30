import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Ventures", href: "/ventures" },
  { label: "Alloy", href: "/ventures/alloy", external: "/alloy/" },
  { label: "Lyte", href: "/ventures/lyte", external: "/lyte-command-center/" },
  { label: "Vessels", href: "/ventures/vessels", external: "/vessels/" },
  { label: "Carlota Jo", href: "/ventures/carlota-jo", external: "/carlota-jo/" },
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-szl-border shadow-sm"
          : "bg-transparent"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => handleNavClick("SZL Holdings", "/")}
        >
          <div className="w-8 h-8 rounded-lg bg-szl-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs font-[var(--font-display)] tracking-tight">SZL</span>
          </div>
          <span className="font-[var(--font-display)] font-semibold text-[15px] text-szl-text tracking-tight">
            SZL Holdings
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.label, link.href)}
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                location === link.href
                  ? "text-szl-text"
                  : "text-szl-text-secondary hover:text-szl-text"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-szl-text-secondary hover:text-szl-text p-1.5"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
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
            className="lg:hidden bg-white/97 backdrop-blur-xl border-b border-szl-border overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.label, link.href)}
                  className="text-szl-text-secondary text-[15px] font-medium hover:text-szl-text transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
