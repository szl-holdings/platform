import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";

const navLinks = [
  { name: "Work", href: "/work" },
  { name: "Thesis", href: "/thesis" },
  { name: "Philosophy", href: "/philosophy" },
  { name: "Writing", href: "/writing" },
  { name: "About", href: "/about" },
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
        background: scrolled ? "rgba(8,12,17,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid hsla(0,0%,100%,0.05)" : "none",
        paddingTop: scrolled ? "0.625rem" : "1rem",
        paddingBottom: scrolled ? "0.625rem" : "1rem",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/" className="group flex flex-col">
          <span
            className="font-serif text-[16px] leading-none tracking-tight text-foreground transition-colors"
            style={{ color: "hsl(0,0%,88%)" }}
          >
            Stephen Lutar
          </span>
          <span
            className="text-[8px] tracking-[0.25em] uppercase font-medium mt-0.5 transition-colors"
            style={{ color: "hsla(120,30%,60%,0.55)" }}
          >
            Founder & CEO — SZL Holdings
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.name}
                href={link.href}
                className="text-[13px] font-medium transition-colors duration-200"
                style={{ color: isActive ? "hsl(0,0%,88%)" : "hsl(0,0%,42%)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,75%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "hsl(0,0%,88%)" : "hsl(0,0%,42%)"; }}
              >
                {link.name}
              </Link>
            );
          })}
          <a
            href="/szl-holdings/"
            className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors duration-200"
            style={{ color: "hsl(0,0%,30%)", textDecoration: "none" }}
            title="SZL Holdings — Parent Company"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,50%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,30%)"; }}
          >
            SZL
            <ExternalLink size={9} />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold transition-all duration-200"
            style={{ color: "hsl(0,0%,10%)", background: "hsl(0,0%,85%)", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0,0%,95%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0,0%,85%)"; }}
          >
            Get in touch
            <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
          <UserButton />
        </nav>

        <button
          className="md:hidden p-2 transition-colors"
          style={{ color: "hsl(0,0%,50%)" }}
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
            style={{ background: "rgba(8,12,17,0.98)", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}
          >
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[15px] font-medium transition-colors py-1.5 border-b border-white/5"
                  style={{ color: "hsl(0,0%,60%)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,85%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,60%)"; }}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="/szl-holdings/"
                className="flex items-center gap-2 text-[12px] font-medium transition-colors py-1.5"
                style={{ color: "hsl(0,0%,35%)", textDecoration: "none" }}
              >
                SZL Holdings <ExternalLink size={10} />
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-5 py-3 text-[13px] font-semibold text-center transition-colors"
                style={{ color: "hsl(0,0%,10%)", background: "hsl(0,0%,85%)", textDecoration: "none" }}
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
