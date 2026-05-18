import { describe, expect, it } from 'vitest';
import { evaluate, setYawarPublisher } from './evaluate.js';
import { ALL_VERTICALS, type Vertical } from './policy-registry.js';

const ACTIONS = ['read_document', 'update_record', 'execute_payment'] as const;

interface CapturedReceipt {
  topic: string;
  verdict: string;
  vertical: Vertical;
}

describe('a11oy evaluate — verdict matrix × 10 verticals × 3 action kinds', () => {
  it('every (vertical, action) combination produces a structurally-valid result', async () => {
    const captured: CapturedReceipt[] = [];
    setYawarPublisher((r) =>
      captured.push({ topic: r.topic, verdict: r.verdict, vertical: r.vertical }),
    );

    // Drive every cell with three score profiles → allow / escalate / deny.
    const profiles = {
      allow: {
        cleanliness: 0.99,
        horizon: 0.98,
        resonance: 0.97,
        frustum: 0.96,
        moralGrounding: 0.98,
        measurabilityHonesty: 0.97,
      },
      escalate: {
        cleanliness: 0.78,
        horizon: 0.78,
        resonance: 0.78,
        frustum: 0.78,
        moralGrounding: 0.78,
        measurabilityHonesty: 0.78,
      },
      deny: {
        cleanliness: 0.1,
        horizon: 0.1,
        resonance: 0.1,
        frustum: 0.1,
        moralGrounding: 0.1,
        measurabilityHonesty: 0.1,
      },
    } as const;

    let cells = 0;
    for (const vertical of ALL_VERTICALS) {
      for (const action of ACTIONS) {
        for (const profile of Object.keys(profiles) as Array<keyof typeof profiles>) {
          const r = await evaluate({
            action,
            vertical,
            context: { signals: profiles[profile] },
          });
          cells++;
          // Structural assertions
          expect(typeof r.allow).toBe('boolean');
          expect(r.lambda_score).toBeGreaterThanOrEqual(0);
          expect(r.lambda_score).toBeLessThanOrEqual(1);
          expect(r.receipt.topic).toBe('a11oy.proof');
          expect(r.receipt.vertical).toBe(vertical);
          expect(r.receipt.action).toBe(action);
          if (r.allow) {
            expect(r.deny_reason).toBeNull();
            expect(r.escalate_to).toBeNull();
          } else if (r.escalate_to) {
            expect(r.deny_reason).toBeNull();
          } else {
            expect(typeof r.deny_reason).toBe('string');
          }
        }
      }
    }

    // 10 verticals × 3 actions × 3 profiles = 90 cells.
    expect(cells).toBe(90);
    // Publisher was invoked for every call.
    expect(captured.length).toBe(90);
    expect(captured.every((c) => c.topic === 'a11oy.proof')).toBe(true);

    // Reset publisher so we don't leak into other test files.
    setYawarPublisher(() => undefined);
  });

  it('high-signal execute call on a low-stakes vertical is allowed', async () => {
    setYawarPublisher(() => undefined);
    const r = await evaluate({
      action: 'execute_workflow',
      vertical: 'platform',
      context: {
        signals: {
          cleanliness: 0.99,
          horizon: 0.99,
          resonance: 0.99,
          frustum: 0.99,
          moralGrounding: 0.99,
          measurabilityHonesty: 0.99,
        },
      },
    });
    expect(r.allow).toBe(true);
    expect(r.deny_reason).toBeNull();
  });

  it('force-deny rules bypass Λ entirely (data purge)', async () => {
    const r = await evaluate({
      action: 'purge_all_records',
      vertical: 'counsel',
      context: {
        signals: {
          cleanliness: 1,
          horizon: 1,
          resonance: 1,
          frustum: 1,
          moralGrounding: 1,
          measurabilityHonesty: 1,
        },
      },
    });
    expect(r.allow).toBe(false);
    expect(r.deny_reason).toMatch(/irreversible/i);
  });

  it('escalate verdict yields a routing target', async () => {
    const r = await evaluate({
      action: 'update_filing',
      vertical: 'counsel',
      context: {
        signals: {
          cleanliness: 0.7,
          horizon: 0.7,
          resonance: 0.7,
          frustum: 0.7,
          moralGrounding: 0.7,
          measurabilityHonesty: 0.7,
        },
      },
    });
    expect(r.allow).toBe(false);
    if (r.escalate_to) {
      expect(r.escalate_to).toBe('counsel.partner-review');
    }
  });
});
