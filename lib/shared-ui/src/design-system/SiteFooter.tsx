import * as React from "react";
import { cn } from "../utils";

export interface FooterLinkGroup {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

export interface SiteFooterProps {
  logo?: React.ReactNode;
  logoText?: string;
  tagline?: string;
  locationLine?: string;
  emailLine?: string;
  linkGroups?: FooterLinkGroup[];
  copyrightName?: string;
  footnote?: string;
  accentColor?: string;
  className?: string;
  dark?: boolean;
}

export function SiteFooter({
  logo,
  logoText = "Brand",
  tagline,
  locationLine,
  emailLine,
  linkGroups = [],
  copyrightName,
  footnote,
  accentColor = "hsl(215 45% 32%)",
  className,
  dark = false,
}: SiteFooterProps) {
  const colCount = 2 + linkGroups.length;

  return (
    <footer
      className={cn(
        "border-t py-14",
        dark
          ? "bg-neutral-950 border-white/8 text-white"
          : "bg-neutral-50 border-neutral-200 text-neutral-900",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={cn(
            "grid gap-10 mb-12",
            colCount <= 3
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : colCount === 4
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-5"
          )}
        >
          <div className={linkGroups.length >= 3 ? "lg:col-span-2" : ""}>
            <div className="flex items-center gap-2 mb-4">
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
              <span className={cn("font-semibold text-[15px]", dark ? "text-white" : "text-neutral-900")}>
                {logoText}
              </span>
            </div>
            {tagline && (
              <p className={cn("text-sm leading-relaxed max-w-xs mb-3", dark ? "text-white/50" : "text-neutral-500")}>
                {tagline}
              </p>
            )}
            {locationLine && (
              <p className={cn("text-xs", dark ? "text-white/30" : "text-neutral-400")}>{locationLine}</p>
            )}
            {emailLine && (
              <p className={cn("text-xs mt-1", dark ? "text-white/30" : "text-neutral-400")}>{emailLine}</p>
            )}
          </div>

          {linkGroups.map((group) => (
            <div key={group.heading}>
              <h4
                className={cn(
                  "font-semibold text-xs uppercase tracking-wider mb-4",
                  dark ? "text-white/40" : "text-neutral-400"
                )}
              >
                {group.heading}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "text-sm transition-colors",
                        dark
                          ? "text-white/50 hover:text-white"
                          : "text-neutral-500 hover:text-neutral-900"
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3",
            dark ? "border-white/8" : "border-neutral-200"
          )}
        >
          <p className={cn("text-xs", dark ? "text-white/30" : "text-neutral-400")}>
            &copy; {new Date().getFullYear()} {copyrightName ?? logoText}. All rights reserved.
          </p>
          {footnote && (
            <p className={cn("text-xs", dark ? "text-white/30" : "text-neutral-400")}>{footnote}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
