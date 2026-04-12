import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";

const navLinks = [
  { name: "Work", href: "/work" },
  { name: "Thesis", href: "/thesis" },
  { name: "Speaking", href: "/speaking" },
  { name: "About", href: "/about" },
  { name: "Invest", href: "/interested" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location]);

  return (
    <header
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,11,18,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        paddingTop: scrolled ? "0.625rem" : "1rem",
        paddingBottom: scrolled ? "0.625rem" : "1rem",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <span className="text-[12px] font-black" style={{ color: "#6366F1", fontFamily: "'JetBrains Mono', monospace" }}>SL</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold leading-none tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
              Stephen Lutar
            </span>
            <span className="text-[8px] tracking-[0.2em] uppercase font-bold mt-0.5" style={{ color: "rgba(34,197,94,0.5)" }}>
              SZL Holdings
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.name}
                href={link.href}
                className="text-[13px] font-medium transition-colors duration-200"
                style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"; }}
              >
                {link.name}
              </Link>
            );
          })}
          <a
            href="/szl-holdings/"
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.2)", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
          >
            SZL
            <ExternalLink size={9} />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold transition-all duration-200"
            style={{ color: "#080b12", background: "white", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
          >
            Get in touch
            <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
          <UserButton />
        </nav>

        <button
          className="md:hidden p-2 transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(8,11,18,0.98)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[15px] font-medium transition-colors py-1.5 border-b border-white/5"
                  style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="/szl-holdings/"
                className="flex items-center gap-2 text-[12px] font-bold transition-colors py-1.5"
                style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
              >
                SZL Holdings <ExternalLink size={10} />
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-5 py-3 text-[13px] font-bold text-center transition-colors"
                style={{ color: "#080b12", background: "white", textDecoration: "none" }}
              >
                Get in touch
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
