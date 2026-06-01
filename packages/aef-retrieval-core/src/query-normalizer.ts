const WHITESPACE_RE = /\s+/g;
const PUNCTUATION_RE = /[^\w\s\-./]/g;

export interface NormalizeOptions {
  lowercase?: boolean;
  stripPunctuation?: boolean;
  maxLength?: number;
}

export type ProfilePromptTransformHook = (rawQuery: string, profileId: string) => string;

const registeredTransforms = new Map<string, ProfilePromptTransformHook>();

export function registerProfileTransform(
  profileId: string,
  hook: ProfilePromptTransformHook,
): void {
  registeredTransforms.set(profileId, hook);
}

export function normalizeQuery(raw: string, options: NormalizeOptions = {}): string {
  const { lowercase = true, stripPunctuation = false, maxLength = 4096 } = options;

  let q = raw.trim().replace(WHITESPACE_RE, ' ');

  if (lowercase) {
    q = q.toLowerCase();
  }

  if (stripPunctuation) {
    q = q.replace(PUNCTUATION_RE, '').replace(WHITESPACE_RE, ' ').trim();
  }

  if (q.length > maxLength) {
    q = q.slice(0, maxLength);
  }

  return q;
}

export function applyProfilePromptTransform(
  normalizedQuery: string,
  profileId: string | undefined,
): string {
  if (!profileId) return normalizedQuery;

  const hook = registeredTransforms.get(profileId);
  if (!hook) return normalizedQuery;

  return hook(normalizedQuery, profileId);
}
