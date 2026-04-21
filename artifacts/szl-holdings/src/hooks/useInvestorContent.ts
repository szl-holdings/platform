import { useEffect, useState } from "react";

export type InvestorContent = Record<string, unknown>;

export function useInvestorContent<T extends InvestorContent>(
  slug: string,
  fallback: T,
): { content: T; isSeeded: boolean } {
  const [content, setContent] = useState<T>(fallback);
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/holdings/investor-content?slug=${encodeURIComponent(slug)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          seeded?: boolean;
          content?: Record<string, unknown> | null;
        };
        if (cancelled) return;
        if (data.seeded && data.content && typeof data.content === "object") {
          setContent({ ...fallback, ...(data.content as Partial<T>) } as T);
          setIsSeeded(true);
        }
      } catch {
        // Keep static fallback on failure
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return { content, isSeeded };
}

