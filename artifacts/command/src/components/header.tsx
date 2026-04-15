import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

interface HeaderProps {
  lastUpdatedAt: number;
}

export function Header({ lastUpdatedAt }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  return (
    <header
      className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        borderBottom: "1px solid var(--color-surface-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5" style={{ color: "var(--color-fg-muted)" }} />
        <h1
          className="text-sm font-bold tracking-[0.2em]"
          style={{ color: "var(--color-fg-primary)" }}
        >
          ECOSYSTEM COMMAND
        </h1>
      </div>
      <div
        className="flex items-center gap-6 text-xs font-mono"
        style={{ color: "var(--color-fg-muted)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-aegis)" }}
          />
          <span>Refreshing in: {countdown}s</span>
        </div>
        <div>{time.toISOString().replace("T", " ").substring(0, 19)} UTC</div>
      </div>
    </header>
  );
}
