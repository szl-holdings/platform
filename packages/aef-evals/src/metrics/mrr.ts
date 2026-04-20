export function computeMrr(
  retrievedIds: string[],
  relevantIds: string[],
): number {
  const relevantSet = new Set(relevantIds);
  for (let i = 0; i < retrievedIds.length; i++) {
    if (relevantSet.has(retrievedIds[i]!)) {
      return 1 / (i + 1);
    }
  }
  return 0;
}
