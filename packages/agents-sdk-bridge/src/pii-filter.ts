/**
 * PII filter utilities for the Agents SDK Bridge.
 *
 * Integrates with @szl-holdings/ai-control-plane's piiRedactor to scrub
 * sensitive data before persisting span attributes to the Trace Graph.
 * Falls back to a simple regex-based redactor when the control plane module
 * is not installed.
 *
 * Uses createRequire (Node.js CJS interop) so the dynamic load works inside
 * this ESM ("type": "module") package without bare `require()`.
 */

import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

interface ControlPlane {
  piiRedactor?: {
    redact(text: string): { redacted?: string };
  };
}

function loadControlPlane(): ControlPlane | null {
  try {
    return _require('@szl-holdings/ai-control-plane') as ControlPlane;
  } catch {
    return null;
  }
}

const controlPlane: ControlPlane | null = loadControlPlane();

const SIMPLE_PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b(?:\d[ -]?){13,19}\b/g, replacement: '[CARD]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\bsk-[A-Za-z0-9]{20,}\b/g, replacement: '[API_KEY]' },
  { pattern: /\bpassword["']?\s*[:=]\s*["']?[^\s"',}]+/gi, replacement: 'password=[REDACTED]' },
];

function simpleRedact(text: string): string {
  let result = text;
  for (const { pattern, replacement } of SIMPLE_PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Redact sensitive data from a string using the SZL PII redactor.
 * Gracefully falls back to simple regex redaction if the control plane is unavailable.
 */
export function redactSensitiveData(text: string): string {
  if (!text || typeof text !== 'string') return text;

  if (controlPlane?.piiRedactor) {
    try {
      const result = controlPlane.piiRedactor.redact(text);
      return result.redacted ?? text;
    } catch {
      // fall through to regex fallback
    }
  }

  return simpleRedact(text);
}

/**
 * Determine whether the sensitive data flag should be respected based on
 * environment configuration and caller preference.
 */
export function shouldIncludeSensitiveData(callerPreference: boolean): boolean {
  const envFlag = process.env['OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA'];
  if (envFlag === 'true') return true;
  if (envFlag === 'false') return false;
  return callerPreference;
}
