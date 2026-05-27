import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Privacy guard for the reviewer-presence surface.
 *
 * Doctrine: A11oy reviewer-presence verification must NEVER read,
 * buffer, or transmit raw frame bytes. Only feature-vector summaries
 * (eyeAperture, irisMotion, headPoseDelta) may exist in memory, and
 * only the resulting LivenessSummary + receipt class may be surfaced.
 *
 * This test is structural: it scans the source of ReviewerPresence.tsx
 * for any API call that could ingest raw frames. If you legitimately
 * need a new perception surface that reads frames, add it as a sibling
 * component AND extend this test with an explicit allowlist — do not
 * remove these checks silently.
 */

const SOURCE = readFileSync(
  join(__dirname, 'ReviewerPresence.tsx'),
  'utf8',
);

const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'getUserMedia (camera capture)', pattern: /getUserMedia\b/ },
  { name: 'MediaRecorder', pattern: /\bMediaRecorder\b/ },
  { name: 'ImageBitmap construction', pattern: /createImageBitmap\b/ },
  { name: 'canvas getImageData', pattern: /getImageData\b/ },
  { name: 'canvas drawImage', pattern: /drawImage\b/ },
  { name: 'Blob construction', pattern: /\bnew Blob\b/ },
  { name: 'FileReader', pattern: /\bFileReader\b/ },
  { name: 'ArrayBuffer raw read', pattern: /\bnew ArrayBuffer\b/ },
  { name: 'fetch upload', pattern: /fetch\s*\([^)]*method\s*:\s*['"]POST/ },
  { name: 'XMLHttpRequest upload', pattern: /\bXMLHttpRequest\b/ },
  { name: 'WebSocket egress', pattern: /\bnew WebSocket\b/ },
];

describe('ReviewerPresence privacy guard', () => {
  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    it(`does not contain ${name}`, () => {
      expect(SOURCE).not.toMatch(pattern);
    });
  }

  it('asserts rawFrameBytesLeaked: false in the receipt sketch', () => {
    expect(SOURCE).toMatch(/rawFrameBytesLeaked:\s*false/);
  });

  it('uses the typed second-factor fallback by name', () => {
    expect(SOURCE).toMatch(/typed-second-factor/);
  });

  it('imports the perception-loop envelope receipt class', () => {
    expect(SOURCE).toMatch(/PERCEPTION_ENVELOPE_RECEIPT_CLASS/);
  });
});
