import { useMemo } from 'react';

function normalize(str: string): string {
  return str.toLowerCase().replace(/[\s\-_]/g, '');
}

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = normalize(text);
  const q = normalize(query);
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(text: string, query: string): number {
  if (!query) return 1;
  const t = normalize(text);
  const q = normalize(query);
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  return 1;
}

export function useFuzzySearch<T>(
  items: T[],
  query: string,
  getSearchFields: (item: T) => string[],
): T[] {
  return useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim();
    const matched = items.filter((item) =>
      getSearchFields(item).some((field) => fuzzyMatch(field, q)),
    );
    matched.sort((a, b) => {
      const scoreA = Math.max(...getSearchFields(a).map((f) => fuzzyScore(f, q)));
      const scoreB = Math.max(...getSearchFields(b).map((f) => fuzzyScore(f, q)));
      return scoreB - scoreA;
    });
    return matched;
  }, [items, query, getSearchFields]);
}
