import { useEffect, useState } from "react";
import { Users } from "lucide-react";

const API = import.meta.env.BASE_URL + "api";
const GOLD = "var(--color-gold)";

export type AdvisoryClient = { id: string; name: string; industry: string };

const FALLBACK_CLIENTS: AdvisoryClient[] = [
  { id: "luminary-brands", name: "Luminary Brands", industry: "Consumer Brand / DTC" },
  { id: "vertex-capital", name: "Vertex Capital Partners", industry: "Private Equity / M&A" },
  { id: "aurelius-pe", name: "Aurelius Private Equity", industry: "PE Portfolio Operations" },
  { id: "oasis-wellness", name: "Oasis Wellness", industry: "Wellness / Consumer Health" },
];

export function readClientIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("clientId");
  return v && v.trim() ? v : null;
}

export function writeClientIdToUrl(clientId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (clientId) url.searchParams.set("clientId", clientId);
  else url.searchParams.delete("clientId");
  window.history.replaceState({}, "", url.toString());
}

export function useClientScope(): {
  clientId: string | null;
  setClientId: (id: string | null) => void;
  clients: AdvisoryClient[];
} {
  const [clientId, setClientIdState] = useState<string | null>(() => readClientIdFromUrl());
  const [clients, setClients] = useState<AdvisoryClient[]>(FALLBACK_CLIENTS);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/carlota/clients`, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const list = json.data?.clients;
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setClients(list as AdvisoryClient[]);
        }
      } catch { /* keep fallback */ }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const setClientId = (id: string | null) => {
    setClientIdState(id);
    writeClientIdToUrl(id);
  };

  return { clientId, setClientId, clients };
}

export default function ClientScopeSwitcher({
  clientId,
  onChange,
  clients,
  variant = "light",
}: {
  clientId: string | null;
  onChange: (id: string | null) => void;
  clients: AdvisoryClient[];
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 100,
        background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "var(--color-stone-200, #E8E2D6)"}`,
        fontSize: 12,
        color: isDark ? "#F5F0E8" : "#1A1A14",
      }}
      title="Scope advisory tool data to a specific client"
    >
      <Users size={13} color={isDark ? "#A0AEC0" : "#A89878"} />
      <span style={{ color: isDark ? "#A0AEC0" : "#6B5E47", fontSize: 11 }}>Client view</span>
      <select
        value={clientId ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: isDark ? "#F5F0E8" : "#1A1A14",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
        }}
      >
        <option value="">Whole portfolio</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {clientId && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            border: "none",
            background: "transparent",
            color: isDark ? "#A0AEC0" : "#A89878",
            fontSize: 11,
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          clear
        </button>
      )}
      <span style={{ width: 6, height: 6, borderRadius: 3, background: clientId ? GOLD : (isDark ? "#4A7A63" : "#A89878") }} />
    </label>
  );
}
