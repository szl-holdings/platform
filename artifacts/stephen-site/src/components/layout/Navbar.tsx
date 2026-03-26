import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Achievements", href: "#timeline" },
  { name: "Services", href: "#services" },
  { name: "Portfolio", href: "#portfolio" },
  { name: "Ecosystem", href: "#ecosystem" },
  { name: "Premium", href: "#premium" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "glass-panel py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
            <span className="font-serif font-bold text-background text-lg">SL</span>
          </div>
          <span className="font-serif font-semibold text-lg tracking-wide hidden sm:block">
            SZL Holdings
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </a>
          ))}
          <a href="#contact">
            <Button className="rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-[0.98] transition-all duration-300">
              Request Meeting
            </Button>
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-panel border-t border-white/5 absolute w-full"
          >
            <div className="flex flex-col px-6 py-6 gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground py-2 border-b border-white/5 hover:text-primary transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="mt-4">
                <Button className="w-full rounded-full">Request Meeting</Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
