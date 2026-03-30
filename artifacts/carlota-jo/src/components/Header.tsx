import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Approach", href: "#approach" },
  { label: "About", href: "#about" },
  { label: "Inquiries", href: "#inquire" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#07090d]/96 backdrop-blur-md border-b border-[#f5f0e8]/6"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-[60px] flex items-center justify-between">
        <a href="/carlota-jo/" className="group">
          <div className="flex flex-col">
            <span
              className="text-[#f5f0e8] font-light text-[17px] leading-none tracking-wide"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Carlota Jo
            </span>
            <span className="text-[#c8a96a]/50 text-[9px] tracking-[0.3em] uppercase font-medium mt-0.5">
              Consulting
            </span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[#f5f0e8]/45 text-[13px] font-light hover:text-[#f5f0e8]/85 transition-colors duration-200 tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#inquire"
            className="text-[#f5f0e8]/40 text-[13px] font-light hover:text-[#f5f0e8]/70 transition-colors duration-200 tracking-wide"
          >
            Client portal
          </a>
          <a
            href="#inquire"
            className="px-5 py-2 text-[12px] font-medium tracking-[0.08em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors duration-200"
          >
            Inquire privately
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[#f5f0e8]/50 hover:text-[#f5f0e8]/85 transition-colors"
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
            className="md:hidden bg-[#07090d]/97 border-b border-[#f5f0e8]/6 overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[#f5f0e8]/55 text-[15px] font-light hover:text-[#f5f0e8]/85 transition-colors tracking-wide"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#inquire"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-5 py-3 text-[13px] font-medium text-center text-[#07090d] bg-[#c8a96a]"
              >
                Inquire privately
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
