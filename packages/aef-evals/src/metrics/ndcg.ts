function dcg(relevanceGains: number[]): number {
  return relevanceGains.reduce((sum, rel, idx) => {
    return sum + rel / Math.log2(idx + 2);
  }, 0);
}

export function computeNdcgAtK(
  retrievedIds: string[],
  relevantIds: string[],
  k: number,
): number {
  const topK = retrievedIds.slice(0, k);
  const relevantSet = new Set(relevantIds);

  const gains = topK.map((id) => (relevantSet.has(id) ? 1 : 0));
  const actualDcg = dcg(gains);

  const idealGains = Array.from({ length: Math.min(k, relevantIds.length) }, () => 1);
  const idealDcg = dcg(idealGains);

  if (idealDcg === 0) return 0;
  return actualDcg / idealDcg;
}
