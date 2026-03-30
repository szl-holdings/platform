import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Approach", href: "/approach" },
  { label: "About", href: "/about" },
  { label: "Inquiries", href: "/inquiries" },
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream-warm/96 backdrop-blur-md border-b border-stone-200"
          : "bg-cream-warm/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-[60px] flex items-center justify-between">
        <Link href="/" className="group">
          <div className="flex flex-col">
            <span
              className="text-ink-900 font-light text-[17px] leading-none tracking-wide"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Carlota Jo
            </span>
            <span className="text-gold/60 text-[9px] tracking-[0.3em] uppercase font-medium mt-0.5">
              Consulting
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-light transition-colors duration-200 tracking-wide ${
                location === link.href
                  ? "text-ink-900"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/client-portal"
            className="text-ink-400 text-[13px] font-light hover:text-ink-700 transition-colors duration-200 tracking-wide"
          >
            Client Portal
          </Link>
          <Link
            href="/inquiries"
            className="px-5 py-2 text-[12px] font-medium tracking-[0.08em] text-cream bg-ink-900 hover:bg-ink-700 transition-colors duration-200"
          >
            Inquire privately
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-ink-500 hover:text-ink-900 transition-colors"
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
            className="md:hidden bg-cream-warm border-b border-stone-200 overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-ink-600 text-[15px] font-light hover:text-ink-900 transition-colors tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/client-portal"
                onClick={() => setMobileOpen(false)}
                className="text-ink-400 text-[15px] font-light"
              >
                Client Portal
              </Link>
              <Link
                href="/inquiries"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-5 py-3 text-[13px] font-medium text-center text-cream bg-ink-900"
              >
                Inquire privately
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
