import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Who We Serve", href: "/who-we-serve" },
  { label: "How We Work", href: "/engagements" },
  { label: "About Carlota Jo", href: "/founder" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const isLight = !scrolled;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(249,247,243,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(154,125,82,0.12)" : "none",
      }}
      data-scrolled={scrolled}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-[60px] flex items-center justify-between">
        <Link href="/" className="group">
          <div className="flex flex-col">
            <span
              className="font-light text-[17px] leading-none tracking-wide transition-colors duration-300"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: scrolled ? "var(--color-ink-900)" : "#f5f0e8" }}
            >
              Carlota Jo
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase font-medium mt-0.5 transition-colors duration-300" style={{ color: "var(--color-gold)", opacity: scrolled ? 0.7 : 0.5 }}>
              Consulting
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-light transition-colors duration-300 tracking-wide"
              style={{
                color: scrolled
                  ? (location === link.href ? "var(--color-ink-900)" : "var(--color-ink-500)")
                  : (location === link.href ? "#f5f0e8" : "rgba(245,240,232,0.5)"),
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = scrolled ? "var(--color-ink-900)" : "#f5f0e8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = scrolled ? (location === link.href ? "var(--color-ink-900)" : "var(--color-ink-500)") : (location === link.href ? "#f5f0e8" : "rgba(245,240,232,0.5)"); }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="px-5 py-2 text-[12px] font-medium tracking-[0.08em] transition-colors duration-200"
            style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
          >
            Request Consultation
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden transition-colors"
          style={{ color: "var(--color-ink-500)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(249,247,243,0.98)", borderBottom: "1px solid rgba(154,125,82,0.12)" }}
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-light tracking-wide transition-colors"
                  style={{ color: "var(--color-ink-500)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)"; }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-5 py-3 text-[13px] font-medium text-center transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
              >
                Request Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
