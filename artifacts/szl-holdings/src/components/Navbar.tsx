import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import siteData from "@/data/site.json";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <m.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/92 backdrop-blur-xl border-b border-szl-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-szl-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs font-[var(--font-display)]">S</span>
          </div>
          <span className="font-[var(--font-display)] font-semibold text-[15px] text-szl-text tracking-tight">
            {siteData.company.name}
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {siteData.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-szl-text-secondary text-sm font-medium hover:text-szl-text transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="px-4 py-2 rounded-lg bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors"
          >
            {siteData.nav.ctaLabel}
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-szl-text-secondary hover:text-szl-text"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
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
            className="md:hidden bg-white/96 backdrop-blur-xl border-b border-szl-border overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {siteData.nav.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-szl-text-secondary text-[15px] font-medium hover:text-szl-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-4 py-2.5 rounded-lg bg-szl-primary text-white text-sm font-semibold text-center"
              >
                {siteData.nav.ctaLabel}
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
