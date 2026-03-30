import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Ventures", href: "#portfolio" },
  { label: "Roadmap", href: "#milestones" },
  { label: "About", href: "#thesis" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <m.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-[hsl(215,45%,30%)] flex items-center justify-center transition-colors group-hover:bg-[hsl(215,45%,36%)]">
            <span className="text-white font-bold text-[11px] tracking-tight" style={{ fontFamily: "system-ui" }}>S</span>
          </div>
          <span className="font-semibold text-[14px] text-neutral-900 tracking-tight">
            SZL Holdings
          </span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className="text-neutral-500 text-[13px] font-medium hover:text-neutral-900 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold text-white bg-[hsl(215,45%,32%)] hover:bg-[hsl(215,45%,38%)] transition-colors duration-200"
          >
            Explore the portfolio
            <ChevronRight size={13} />
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-neutral-600 hover:text-neutral-900 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white/97 backdrop-blur-md border-b border-neutral-100 overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-neutral-600 text-[15px] font-medium hover:text-neutral-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-5 py-3 rounded text-[13px] font-semibold text-white text-center bg-[hsl(215,45%,32%)] hover:bg-[hsl(215,45%,38%)] transition-colors"
              >
                Explore the portfolio
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
