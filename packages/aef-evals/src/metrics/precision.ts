export function computePrecisionAtK(
  retrievedIds: string[],
  relevantIds: string[],
  k: number,
): number {
  const topK = retrievedIds.slice(0, k);
  if (topK.length === 0) return 0;
  const relevantSet = new Set(relevantIds);
  const hits = topK.filter((id) => relevantSet.has(id)).length;
  return hits / topK.length;
}
