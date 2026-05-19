import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

const NAV = [
  { path: "/", label: "Identity", glyph: "◆" },
  { path: "/optimizer", label: "Optimizer", glyph: "▲" },
  { path: "/fabric", label: "Fabric", glyph: "✷" },
  { path: "/research", label: "Research", glyph: "≡" },
  { path: "/proof", label: "Proof Chain", glyph: "◐" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [now, setNow] = useState(() => new Date().toISOString().replace("T", " ").slice(0, 19));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().replace("T", " ").slice(0, 19)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold">
              R
            </span>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-sidebar-foreground">ROSIE</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Governed Decision Fabric
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4" data-testid="nav-primary">
            {NAV.map((item) => {
              const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={
                    "px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 " +
                    (active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60")
                  }
                >
                  <span className="text-xs opacity-70">{item.glyph}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-xs">
            <span className="hidden lg:inline font-mono text-muted-foreground">{now} UTC</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              live
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <footer className="border-t border-border mt-12">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Covenant Proof Standard v1 · deterministic-ising-solver · LLM is narrator-only</span>
          <span className="font-mono opacity-60">artifacts/rosie</span>
        </div>
      </footer>
    </div>
  );
}
