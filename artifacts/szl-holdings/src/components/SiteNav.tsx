import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Founder", href: "/founder" },
  { label: "Insights", href: "/insights" },
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
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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

        <div className="hidden md:flex items-center gap-8">
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
          <Link
            href="/contact"
            onClick={() => handleNavClick("Contact", "/contact")}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors"
          >
            Get in Touch
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-szl-text-secondary hover:text-szl-text p-1.5"
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
            className="md:hidden bg-white/97 backdrop-blur-xl border-b border-szl-border overflow-hidden"
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
              <Link
                href="/contact"
                onClick={() => handleNavClick("Contact", "/contact")}
                className="mt-1 px-4 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold text-center"
              >
                Get in Touch
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
