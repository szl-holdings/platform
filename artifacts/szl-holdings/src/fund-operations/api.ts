import { useState, useEffect, useCallback } from "react";

export const PORTFOLIO_COMPANIES = [
  { slug: "vessels", name: "Vessels", color: "#4a90b8" },
  { slug: "aegis", name: "Aegis", color: "#c45a4a" },
  { slug: "terra", name: "Terra", color: "#c8953c" },
  { slug: "prism-counsel", name: "PRISM Counsel", color: "#d4a054" },
  { slug: "carlota-jo", name: "Carlota Jo", color: "#8b7ac8" },
  { slug: "lyte", name: "Lyte", color: "#6aaa72" },
];

export function fmt(n: number, currency = true): string {
  if (n === 0) return currency ? "$0" : "0";
  if (Math.abs(n) >= 1_000_000) return (currency ? "$" : "") + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (currency ? "$" : "") + (n / 1_000).toFixed(0) + "K";
  return (currency ? "$" : "") + n.toFixed(0);
}

export function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

export function derivePeriodDates(periodType: string, year: string, periodValue: string): { start: string; end: string; label: string } {
  const y = parseInt(year, 10);
  if (periodType === "monthly") {
    const m = parseInt(periodValue, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const monthName = new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
    return {
      start: `${y}-${String(m).padStart(2, "0")}-01`,
      end: `${y}-${String(m).padStart(2, "0")}-${lastDay}`,
      label: `${monthName} ${y}`,
    };
  }
  const q = parseInt(periodValue, 10);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const lastDay = new Date(y, endMonth, 0).getDate();
  return {
    start: `${y}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${y}-${String(endMonth).padStart(2, "0")}-${lastDay}`,
    label: `Q${q} ${y}`,
  };
}

export function useApiFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
