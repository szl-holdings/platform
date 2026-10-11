export type LocalAdapterStrategy = 'keyword_match' | 'token_jaccard' | 'exact_match';

export interface LocalAdapterReference {
  expectedOutput?: string;
  expectedKeywords?: string[];
}

export interface LocalAdapterScore {
  passed: boolean;
  score: number;
  method: LocalAdapterStrategy | 'unevaluable';
  failureReason?: string;
}

const UNEVALUABLE: LocalAdapterScore = {
  passed: false,
  score: 0,
  method: 'unevaluable',
  failureReason: 'unevaluable: missing reference',
};

function words(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/\s+/).filter((word) => word.length > 0));
}

/**
 * Score one local adapter case.
 * `token_jaccard` is word-set overlap. It is not semantic similarity and not an LLM judge.
 * A missing reference is unevaluable and cannot pass.
 */
export function scoreLocalAdapterCase(
  output: string,
  reference: LocalAdapterReference,
  strategy: LocalAdapterStrategy,
): LocalAdapterScore {
  if (strategy === 'keyword_match') {
    const keywords = reference.expectedKeywords;
    if (!keywords || keywords.length === 0) return UNEVALUABLE;
    const found = keywords.filter((keyword) => output.toLowerCase().includes(keyword.toLowerCase()));
    const score = found.length / keywords.length;
    const missing = keywords.filter((keyword) => !output.toLowerCase().includes(keyword.toLowerCase()));
    return {
      passed: score >= 0.8,
      score,
      method: 'keyword_match',
      failureReason: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
    };
  }

  if (strategy === 'exact_match') {
    if (reference.expectedOutput === undefined) return UNEVALUABLE;
    const passed = output.trim() === reference.expectedOutput.trim();
    return {
      passed,
      score: passed ? 1 : 0,
      method: 'exact_match',
      failureReason: passed ? undefined : 'Output does not exactly match expected',
    };
  }

  if (strategy === 'token_jaccard') {
    if (reference.expectedOutput === undefined || reference.expectedOutput.trim() === '') {
      return UNEVALUABLE;
    }
    const observed = words(output);
    const expected = words(reference.expectedOutput);
    const intersection = [...observed].filter((word) => expected.has(word)).length;
    const union = new Set([...observed, ...expected]).size;
    const score = union === 0 ? 0 : intersection / union;
    const passed = score >= 0.4;
    return {
      passed,
      score,
      method: 'token_jaccard',
      failureReason: passed ? undefined : 'Token overlap below 0.4',
    };
  }

  return UNEVALUABLE;
}
