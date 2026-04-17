export type SubmittedDeal = {
  id: string;
  company: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  convictionScore: number;
  scores: { team: number; market: number; product: number; traction: number; competitive: number; financials: number };
  status: "screening" | "active" | "passed" | "invested";
  founder: string;
  founderEmail: string;
  summary: string;
  risks: string[];
  strengths: string[];
  date: string;
  source: "inbound";
};

const KEY = "szl.dealSubmissions.v1";
const listeners = new Set<() => void>();

function read(): SubmittedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SubmittedDeal[]) : [];
  } catch {
    return [];
  }
}

function write(deals: SubmittedDeal[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(deals));
  } catch {
    // ignore quota / privacy mode failures
  }
  listeners.forEach(fn => fn());
}

export function getSubmittedDeals(): SubmittedDeal[] {
  return read();
}

export function addSubmittedDeal(deal: SubmittedDeal): void {
  const current = read();
  write([deal, ...current]);
}

export function subscribeSubmittedDeals(fn: () => void): () => void {
  listeners.add(fn);
  if (typeof window !== "undefined") {
    const handler = (e: StorageEvent) => { if (e.key === KEY) fn(); };
    window.addEventListener("storage", handler);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", handler);
    };
  }
  return () => listeners.delete(fn);
}
