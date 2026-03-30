import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { UserButton } from "@workspace/shared-ui/UserButton";

const navLinks = [
  { label: "Capabilities", href: "#services" },
  { label: "Engagements", href: "#case-studies" },
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
          ? "bg-stone-50/95 backdrop-blur-md border-b border-stone-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="flex items-center justify-between h-20">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-baseline gap-3"
          >
            <span className="font-serif text-2xl font-light tracking-wide text-ink-900 hover:text-warm-gold transition-colors duration-300">
              Carlota Jo
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium">
              Advisory
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-[11px] font-light tracking-[0.2em] uppercase text-ink-600 hover:text-ink-900 transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() =>
                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="ml-4 px-7 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase border border-ink-900/30 text-ink-900 hover:bg-ink-900 hover:text-stone-50 transition-all duration-300"
            >
              Inquire Privately
            </button>
            <UserButton />
          </nav>

          <button
            className="lg:hidden text-ink-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-stone-50/98 backdrop-blur-xl border-b border-stone-200"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="text-left text-[11px] font-light tracking-[0.2em] uppercase text-ink-600 hover:text-ink-900 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-2 px-6 py-3.5 text-[11px] font-medium tracking-[0.15em] uppercase border border-ink-900/30 text-ink-900 hover:bg-ink-900 hover:text-stone-50 transition-all text-center"
              >
                Inquire Privately
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
