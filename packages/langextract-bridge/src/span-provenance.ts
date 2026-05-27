import { createHash } from 'node:crypto';

export interface SpanProvenance {
  readonly documentHash: string;
  readonly startByte: number;
  readonly endByte: number;
  readonly normalisedText: string;
  readonly spanHash: string;
}

export function normaliseSpanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function hashDocument(documentText: string): string {
  return createHash('sha256').update(documentText, 'utf8').digest('hex');
}

export function buildSpanProvenance(
  documentHash: string,
  startByte: number,
  endByte: number,
  rawText: string,
): SpanProvenance {
  const normalisedText = normaliseSpanText(rawText);
  const canonical = `${documentHash}|${startByte}|${endByte}|${normalisedText}`;
  const spanHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return { documentHash, startByte, endByte, normalisedText, spanHash };
}
