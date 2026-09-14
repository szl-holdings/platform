import { describe, expect, it } from 'vitest';
import { MODEL_PROVIDERS } from '../../packages/a11oy-runtime/src/data/model-providers';

const RETIRED_OR_REDIRECT_ONLY = new Set([
  'deepseek-chat',
  'deepseek-reasoner',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'deepseek-v4-flash-vision-exp',
]);

describe('DeepSeek provider identity contract', () => {
  const provider = MODEL_PROVIDERS.find((candidate) => candidate.id === 'deepseek');

  it('binds the current canonical API identity without enabling the provider', () => {
    expect(provider).toBeDefined();
    expect(provider?.reasoningModel).toBe('deepseek-flash');
    expect(provider?.fastModel).toBe('deepseek-flash');
    expect(provider?.isAvailable).toBe(false);
    expect(provider?.isMock).toBe(false);
  });

  it('does not use retired or redirect-only aliases as canonical provider identities', () => {
    expect(RETIRED_OR_REDIRECT_ONLY.has(provider?.reasoningModel ?? '')).toBe(false);
    expect(RETIRED_OR_REDIRECT_ONLY.has(provider?.fastModel ?? '')).toBe(false);
  });

  it('preserves the credential boundary instead of embedding provider secrets', () => {
    expect(provider?.envKey).toBe('DEEPSEEK_API_KEY');
  });
});
