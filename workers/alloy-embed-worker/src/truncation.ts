import type { TruncationPolicy } from './backends/interface.js';

export interface TruncationResult {
  text: string;
  wasTruncated: boolean;
  originalLength: number;
  truncatedLength: number;
}

export function applyTruncation(
  text: string,
  maxTokens: number,
  policy: TruncationPolicy,
  estimatedCharsPerToken = 4,
): TruncationResult {
  const maxChars = maxTokens * estimatedCharsPerToken;
  const originalLength = text.length;

  if (text.length <= maxChars) {
    return {
      text,
      wasTruncated: false,
      originalLength,
      truncatedLength: text.length,
    };
  }

  if (policy === 'reject') {
    throw new Error(
      `TruncationPolicy[reject]: text length ${text.length} chars exceeds estimated limit of ${maxChars} chars ` +
        `(maxTokens=${maxTokens}, estimatedCharsPerToken=${estimatedCharsPerToken}). ` +
        `Shorten the text or switch to truncation policy 'truncate' for this profile.`,
    );
  }

  const truncated = text.slice(0, maxChars);
  return {
    text: truncated,
    wasTruncated: true,
    originalLength,
    truncatedLength: truncated.length,
  };
}

export function applyTruncationBatch(
  texts: string[],
  maxTokens: number,
  policy: TruncationPolicy,
  estimatedCharsPerToken = 4,
): { results: TruncationResult[]; anyTruncated: boolean } {
  const results = texts.map((t) => applyTruncation(t, maxTokens, policy, estimatedCharsPerToken));
  return {
    results,
    anyTruncated: results.some((r) => r.wasTruncated),
  };
}
