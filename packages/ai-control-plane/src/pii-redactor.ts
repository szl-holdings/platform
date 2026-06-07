import { createLogger } from './logger.js';

const logger = createLogger('ai-control-plane:pii-redactor');

export interface PiiPattern {
  id: string;
  type: string;
  pattern: RegExp;
  replacement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface RedactionResult {
  original: string;
  redacted: string;
  detectedTypes: string[];
  detectedCount: number;
  safe: boolean;
}

export interface InjectionScanResult {
  safe: boolean;
  detected: boolean;
  patterns: string[];
  severity: 'none' | 'low' | 'high';
}

const DEFAULT_PII_PATTERNS: PiiPattern[] = [
  {
    id: 'ssn',
    type: 'SSN',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN REDACTED]',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'credit-card',
    type: 'CREDIT_CARD',
    pattern: /\b(?:\d[ -]?){13,16}\b/g,
    replacement: '[CARD REDACTED]',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'email',
    type: 'EMAIL',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
    severity: 'medium',
    enabled: true,
  },
  {
    id: 'phone-us',
    type: 'PHONE',
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: '[PHONE REDACTED]',
    severity: 'medium',
    enabled: true,
  },
  {
    id: 'api-key',
    type: 'API_KEY',
    pattern: /\b(?:sk-|pk_live_|Bearer\s+)[A-Za-z0-9_-]{20,}\b/g,
    replacement: '[API_KEY REDACTED]',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'password',
    type: 'PASSWORD',
    pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
    replacement: '[PASSWORD REDACTED]',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'secret',
    type: 'SECRET',
    pattern: /\b(?:secret|token|key)\s*[:=]\s*[A-Za-z0-9_\-./+]{16,}/gi,
    replacement: '[SECRET REDACTED]',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'ip-address',
    type: 'IP_ADDRESS',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP REDACTED]',
    severity: 'low',
    enabled: true,
  },
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all|prior)\s+instructions?/gi,
  /forget\s+your\s+(?:system|previous)\s+(?:prompt|instructions?)/gi,
  /you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)\s+(?:ai|assistant|bot|model)/gi,
  /disregard\s+(?:your|all)\s+(?:training|guidelines|constraints)/gi,
  /act\s+as\s+if\s+you\s+have\s+no\s+(?:restrictions|limitations|rules)/gi,
  /reveal\s+your\s+(?:system\s+)?prompt/gi,
  /override\s+(?:your\s+)?(?:safety|security|content)\s+filter/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
  /pretend\s+you\s+(?:are|have\s+no)/gi,
];

class PiiRedactor {
  private patterns: PiiPattern[];

  constructor(patterns: PiiPattern[] = DEFAULT_PII_PATTERNS) {
    this.patterns = patterns;
  }

  addPattern(pattern: PiiPattern): void {
    this.patterns.push(pattern);
  }

  removePattern(id: string): void {
    this.patterns = this.patterns.filter((p) => p.id !== id);
  }

  listPatterns(): PiiPattern[] {
    return [...this.patterns];
  }

  redact(text: string, options: { minSeverity?: PiiPattern['severity'] } = {}): RedactionResult {
    const severityOrder: PiiPattern['severity'][] = ['low', 'medium', 'high', 'critical'];
    const minIdx = options.minSeverity ? severityOrder.indexOf(options.minSeverity) : 0;

    let redacted = text;
    const detectedTypes: string[] = [];

    for (const ptn of this.patterns) {
      if (!ptn.enabled) continue;
      if (severityOrder.indexOf(ptn.severity) < minIdx) continue;

      ptn.pattern.lastIndex = 0;
      if (ptn.pattern.test(text)) {
        detectedTypes.push(ptn.type);
        ptn.pattern.lastIndex = 0;
        redacted = redacted.replace(ptn.pattern, ptn.replacement);
      }
    }

    if (detectedTypes.length > 0) {
      logger.info({ detectedTypes, count: detectedTypes.length }, 'PII detected and redacted');
    }

    return {
      original: text,
      redacted,
      detectedTypes,
      detectedCount: detectedTypes.length,
      safe: detectedTypes.length === 0,
    };
  }

  scanForInjection(text: string): InjectionScanResult {
    const detected: string[] = [];
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        detected.push(pattern.source.slice(0, 60));
      }
    }

    const result: InjectionScanResult = {
      safe: detected.length === 0,
      detected: detected.length > 0,
      patterns: detected,
      severity: detected.length === 0 ? 'none' : detected.length > 2 ? 'high' : 'low',
    };

    if (!result.safe) {
      logger.warn(
        { patternCount: detected.length, severity: result.severity },
        'Prompt injection detected',
      );
    }

    return result;
  }

  scanAndRedact(text: string): { injection: InjectionScanResult; pii: RedactionResult } {
    const injection = this.scanForInjection(text);
    const pii = this.redact(text);
    return { injection, pii };
  }
}

export const piiRedactor = new PiiRedactor();

export function redactPii(
  text: string,
  options?: Parameters<PiiRedactor['redact']>[1],
): RedactionResult {
  return piiRedactor.redact(text, options);
}

export function scanForInjection(text: string): InjectionScanResult {
  return piiRedactor.scanForInjection(text);
}

export { PiiRedactor };
