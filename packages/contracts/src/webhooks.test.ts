import { describe, expect, it } from 'vitest';
import {
  alloyEmailIngestBodySchema,
  docusignWebhookBodySchema,
  genericWebhookBodySchema,
  slackInteractionBodySchema,
  stripeWebhookBodySchema,
} from './webhooks';

describe('stripeWebhookBodySchema', () => {
  const valid = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1' } },
    created: 1700000000,
  };
  it('accepts a valid event', () => {
    expect(stripeWebhookBodySchema.parse(valid)).toBeTruthy();
  });
  it('rejects when data.object is missing', () => {
    expect(() => stripeWebhookBodySchema.parse({ ...valid, data: {} })).toThrow();
  });
  it('rejects when created is not a number', () => {
    expect(() => stripeWebhookBodySchema.parse({ ...valid, created: 'today' })).toThrow();
  });
  it('rejects missing id', () => {
    const { id: _id, ...rest } = valid;
    expect(() => stripeWebhookBodySchema.parse(rest)).toThrow();
  });
});

describe('alloyEmailIngestBodySchema', () => {
  it('accepts a minimal valid email', () => {
    expect(
      alloyEmailIngestBodySchema.parse({
        from: 'a@b.com',
        to: 'c@d.com',
      }),
    ).toBeTruthy();
  });
  it('rejects an invalid from address', () => {
    expect(() => alloyEmailIngestBodySchema.parse({ from: 'no-at', to: 'c@d.com' })).toThrow();
  });
  it('rejects a subject longer than 998 chars', () => {
    expect(() =>
      alloyEmailIngestBodySchema.parse({
        from: 'a@b.com',
        to: 'c@d.com',
        subject: 'x'.repeat(999),
      }),
    ).toThrow();
  });
  it('validates attachment shape', () => {
    expect(
      alloyEmailIngestBodySchema.parse({
        from: 'a@b.com',
        to: 'c@d.com',
        attachments: [{ filename: 'f.pdf', contentType: 'x', size: 0 }],
      }),
    ).toBeTruthy();
  });
  it('rejects negative attachment size', () => {
    expect(() =>
      alloyEmailIngestBodySchema.parse({
        from: 'a@b.com',
        to: 'c@d.com',
        attachments: [{ filename: 'f', contentType: 'x', size: -1 }],
      }),
    ).toThrow();
  });
});

describe('slackInteractionBodySchema', () => {
  it('accepts a minimal type-only payload', () => {
    expect(slackInteractionBodySchema.parse({ type: 'url_verification' })).toBeTruthy();
  });
  it('rejects missing type', () => {
    expect(() => slackInteractionBodySchema.parse({})).toThrow();
  });
  it('validates nested event.type', () => {
    expect(
      slackInteractionBodySchema.parse({
        type: 'event_callback',
        event: { type: 'message', text: 'hi' },
      }),
    ).toBeTruthy();
  });
  it('rejects when event.type is missing', () => {
    expect(() =>
      slackInteractionBodySchema.parse({
        type: 'event_callback',
        event: { text: 'hi' },
      }),
    ).toThrow();
  });
});

describe('docusignWebhookBodySchema', () => {
  it('accepts a minimal event', () => {
    expect(docusignWebhookBodySchema.parse({ event: 'envelope-completed' })).toBeTruthy();
  });
  it('rejects missing event', () => {
    expect(() => docusignWebhookBodySchema.parse({})).toThrow();
  });
  it('rejects non-integer retryCount', () => {
    expect(() => docusignWebhookBodySchema.parse({ event: 'x', retryCount: 1.5 })).toThrow();
  });
});

describe('genericWebhookBodySchema', () => {
  it('accepts an arbitrary record', () => {
    expect(genericWebhookBodySchema.parse({ a: 1, b: 'two', c: { d: true } })).toBeTruthy();
  });
  it('rejects non-objects', () => {
    expect(() => genericWebhookBodySchema.parse('string')).toThrow();
    expect(() => genericWebhookBodySchema.parse(123)).toThrow();
  });
});
