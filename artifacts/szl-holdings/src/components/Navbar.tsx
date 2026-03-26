import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import siteData from "@/data/site.json";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-szl-bg/80 backdrop-blur-xl border-b border-szl-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-szl-primary to-szl-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm font-[var(--font-display)]">S</span>
          </div>
          <span className="font-[var(--font-display)] font-bold text-lg text-szl-text">
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
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-szl-primary to-szl-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-szl-bg-secondary/95 backdrop-blur-xl border-b border-szl-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {siteData.nav.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-szl-text-secondary text-base font-medium hover:text-szl-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-szl-primary to-szl-accent text-white text-sm font-semibold text-center"
              >
                {siteData.nav.ctaLabel}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
