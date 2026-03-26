import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (location !== "/") {
      window.location.href = import.meta.env.BASE_URL + href.replace("#", "#");
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-navy-950/95 backdrop-blur-md border-b border-gold-500/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <a
            href={import.meta.env.BASE_URL}
            className="font-serif text-2xl font-semibold tracking-wide text-cream-50 hover:text-gold-400 transition-colors"
          >
            Carlota Jo
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-sm font-light tracking-widest uppercase text-cream-200/70 hover:text-gold-400 transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
            <a
              href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book`}
              className="ml-4 px-6 py-2.5 text-xs font-medium tracking-widest uppercase border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 transition-all duration-300"
            >
              Book Consultation
            </a>
          </nav>

          <button
            className="lg:hidden text-cream-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-navy-950/98 backdrop-blur-xl border-b border-gold-500/10"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="text-left text-sm font-light tracking-widest uppercase text-cream-200/70 hover:text-gold-400 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book`}
                className="mt-2 px-6 py-3 text-xs font-medium tracking-widest uppercase border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 transition-all text-center"
              >
                Book Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
