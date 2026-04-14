import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ExternalLink, Sparkles, Users, Briefcase, Target, BarChart3, Network } from "lucide-react";
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

const studioLinks = [
  { name: "Content Studio", href: "/content-studio", icon: Sparkles, desc: "Transform ideas into platform content" },
  { name: "Audience Intelligence", href: "/audience", icon: Users, desc: "Living map of influence & reach" },
  { name: "Advisory Pipeline", href: "/pipeline", icon: Briefcase, desc: "Speaking & advisory opportunity CRM" },
  { name: "Thesis Tracker", href: "/thesis-tracker", icon: Target, desc: "Investment positions & validation track record" },
  { name: "Influence Metrics", href: "/influence", icon: BarChart3, desc: "Reach, engagement & brand sentiment" },
  { name: "Network Graph", href: "/network", icon: Network, desc: "Professional relationships & co-investments" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [location] = useLocation();
  const studioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); setStudioOpen(false); }, [location]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (studioRef.current && !studioRef.current.contains(e.target as Node)) {
        setStudioOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          {/* Studio dropdown */}
          <div ref={studioRef} className="relative">
            <button
              onClick={() => setStudioOpen(prev => !prev)}
              className="flex items-center gap-1 text-[13px] font-medium transition-colors duration-200"
              style={{ color: studioOpen ? "hsl(0,0%,75%)" : "hsl(0,0%,42%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,75%)"; }}
              onMouseLeave={(e) => { if (!studioOpen) (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,42%)"; }}
            >
              <Sparkles size={11} />
              Studio
            </button>
            <AnimatePresence>
              {studioOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full right-0 mt-3 w-72 rounded-xl border overflow-hidden z-50"
                  style={{ background: "rgba(8,12,17,0.98)", borderColor: "hsla(0,0%,100%,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
                >
                  <div className="p-2">
                    <p className="text-[9px] font-semibold tracking-[0.18em] uppercase px-2 py-1.5" style={{ color: "hsl(120,30%,55%,0.6)" }}>Command Center</p>
                    {studioLinks.map(item => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex items-start gap-3 px-2 py-2.5 rounded-lg transition-colors"
                          style={{ background: isActive ? "hsla(0,0%,100%,0.06)" : "transparent", textDecoration: "none" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? "hsla(0,0%,100%,0.06)" : "transparent"; }}
                        >
                          <Icon size={13} className="mt-0.5 shrink-0" style={{ color: "hsl(0,0%,40%)" }} />
                          <div>
                            <p className="text-[12px] font-medium" style={{ color: "hsl(0,0%,72%)" }}>{item.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "hsl(0,0%,36%)" }}>{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <
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
              <div className="border-t border-white/5 pt-3">
                <p className="text-[9px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: "hsl(120,30%,55%,0.5)" }}>Command Center</p>
                {studioLinks.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-[13px] font-medium transition-colors py-1.5 border-b border-white/5"
                      style={{ color: "hsl(0,0%,50%)", textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,80%)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0,0%,50%)"; }}
                    >
                      <Icon size={12} style={{ color: "hsl(0,0%,35%)" }} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
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
