import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Brain, Menu, X, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Platform", href: "/platform" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Security", href: "/security" },
  { label: "Insights", href: "/insights" },
  { label: "Request Access", href: "/request-access" },
];

export function MarketingNav() {
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060410]/95 backdrop-blur-md border-b border-violet-500/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="font-semibold text-[14px] text-violet-50 tracking-tight">INCA</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium transition-colors duration-200 ${
                location === link.href
                  ? "text-violet-300"
                  : "text-violet-300/45 hover:text-violet-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="text-[13px] font-medium text-violet-300/35 hover:text-violet-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/request-access"
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            Schedule walkthrough <ChevronRight size={13} />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-violet-300/50 hover:text-violet-200 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#060410]/97 border-b border-violet-500/10">
          <div className="px-6 py-5 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-violet-200 text-[15px] font-medium hover:text-violet-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-violet-300/45 text-[15px]">Sign In</Link>
            <Link
              href="/request-access"
              onClick={() => setMobileOpen(false)}
              className="mt-1 px-5 py-3 rounded text-[13px] font-semibold text-violet-50 bg-violet-600 text-center"
            >
              Schedule a private walkthrough
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
