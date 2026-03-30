import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { UserButton } from "@workspace/shared-ui/UserButton";

const navLinks = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Ventures", href: "#portfolio" },
  { label: "Leadership", href: "#leadership" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <m.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-szl-bg/92 backdrop-blur-xl border-b border-szl-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-szl-accent/40 flex items-center justify-center">
            <span className="text-szl-accent font-[var(--font-display)] text-sm font-normal">S</span>
          </div>
          <span className="font-[var(--font-display)] text-[15px] text-szl-text tracking-wide">
            SZL Holdings
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className="text-szl-text-muted text-sm font-medium hover:text-szl-text transition-colors duration-200 tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="px-5 py-2 border border-szl-accent/50 text-szl-accent text-sm font-medium hover:bg-szl-accent hover:text-szl-bg transition-all duration-200"
          >
            Investor Relations
          </a>
          <UserButton />
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-szl-text-secondary hover:text-szl-text"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-szl-bg/96 backdrop-blur-xl border-b border-szl-border overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.href + link.label}
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
                className="mt-1 px-5 py-2.5 border border-szl-accent/50 text-szl-accent text-sm font-medium text-center"
              >
                Investor Relations
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
