import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

const NAV = [
  { path: "/", label: "Jarvis", glyph: "◇" },
  { path: "/identity", label: "Identity", glyph: "◆" },
  { path: "/optimizer", label: "Optimizer", glyph: "▲" },
  { path: "/reasoning", label: "Reasoning", glyph: "❖" },
  { path: "/fabric", label: "Fabric", glyph: "✷" },
  { path: "/research", label: "Research", glyph: "≡" },
  { path: "/proof", label: "Proof Chain", glyph: "◐" },
  { path: "/warhacker", label: "Warhacker", glyph: "⚑" },
];

/**
 * ROSIE Shell — operator-grade chrome.
 *
 * Discipline (see docs/design/rosie-landing-research-2026.md):
 *  - Hairline borders, never shadows.
 *  - Live UTC clock + halon stream-pulse as telemetry-as-decoration.
 *  - Page transitions: 220ms fade + 8px y on route change, keyed off
 *    `location` so each route gets a fresh animation. Respects
 *    `prefers-reduced-motion` via the .rosie-route utility.
 *  - Receipt-trust strip pinned to the footer of every product page.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [now, setNow] = useState(() => new Date().toISOString().replace("T", " ").slice(0, 19));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().replace("T", " ").slice(0, 19)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <span className="grid place-items-center w-9 h-9 rounded-md border border-primary/40 bg-primary/10 text-primary font-display text-lg leading-none group-hover:bg-primary/20 transition-colors">
              R
            </span>
            <div className="leading-tight">
              <div className="font-display text-[17px] tracking-[-0.005em] text-foreground">ROSIE</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
                Governed Decision Fabric
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5 ml-2" data-testid="nav-primary">
            {NAV.map((item) => {
              const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={
                    "relative px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 " +
                    (active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  <span className={"text-xs " + (active ? "text-primary" : "opacity-60")}>{item.glyph}</span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute left-3 right-3 -bottom-[17px] h-px bg-primary" aria-hidden />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="hidden lg:inline font-mono text-muted-foreground tabular-nums">
              {now} <span className="opacity-60">UTC</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-[0.18em]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              live
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14 w-full flex-1">
        {/* keyed off location so each route re-runs the entry animation */}
        <div key={location} className="rosie-route">
          {children}
        </div>
      </main>

      <footer className="mt-12 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-3 text-[11px] font-mono text-muted-foreground">
          <span className="truncate">
            Covenant Proof Standard v1 · deterministic-ising-solver · LLM is narrator-only
          </span>
          <span className="opacity-60 hidden md:inline">artifacts/rosie</span>
        </div>
      </footer>
    </div>
  );
}
