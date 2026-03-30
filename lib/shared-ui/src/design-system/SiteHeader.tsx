import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "../utils";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SiteHeaderProps {
  logo?: React.ReactNode;
  logoText?: string;
  navItems?: NavItem[];
  ctaLabel?: string;
  ctaHref?: string;
  onNavClick?: (label: string, href: string) => void;
  onCtaClick?: () => void;
  currentPath?: string;
  className?: string;
  transparent?: boolean;
  invertOnScroll?: boolean;
  accentColor?: string;
}

export function SiteHeader({
  logo,
  logoText = "Brand",
  navItems = [],
  ctaLabel,
  ctaHref,
  onNavClick,
  onCtaClick,
  currentPath = "/",
  className,
  transparent = false,
  invertOnScroll = true,
  accentColor = "hsl(215 45% 32%)",
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!invertOnScroll) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invertOnScroll]);

  const handleNavClick = (label: string, href: string) => {
    onNavClick?.(label, href);
    setMobileOpen(false);
  };

  const isScrolled = invertOnScroll ? scrolled : !transparent;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm"
          : "bg-transparent",
        className
      )}
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => handleNavClick(logoText, "/")}
        >
          {logo ?? (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-white font-bold text-xs">
                {logoText.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-semibold text-[15px] text-neutral-900 tracking-tight">
            {logoText}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={() => handleNavClick(item.label, item.href)}
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                currentPath === item.href
                  ? "text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              {item.label}
            </a>
          ))}
          {ctaLabel && (
            <a
              href={ctaHref ?? "#"}
              onClick={onCtaClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accentColor }}
            >
              {ctaLabel}
            </a>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-900"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className="block w-5 h-px bg-current mb-1 transition-all" />
          <span className="block w-5 h-px bg-current mb-1 transition-all" />
          <span className="block w-5 h-px bg-current transition-all" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white/97 backdrop-blur-xl border-b border-neutral-200 overflow-hidden">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.label, item.href)}
                className="text-neutral-600 text-[15px] font-medium hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
            {ctaLabel && (
              <a
                href={ctaHref ?? "#"}
                onClick={onCtaClick}
                className="mt-1 px-4 py-3 rounded-xl text-white text-sm font-semibold text-center"
                style={{ backgroundColor: accentColor }}
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
