import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { StripeAdapter } from './stripe.js';

const NOW_SECONDS = 1_800_000_000;
const STRIPE_SECRET_KEY = 'sk_test_webhook_verification';
const WEBHOOK_SECRET = 'whsec_webhook_verification';

const EVENT = {
  id: 'evt_webhook_verification',
  object: 'event',
  type: 'invoice.paid',
};

const EVENT_BODY = JSON.stringify(EVENT);

let previousSecretKey: string | undefined;
let previousWebhookSecret: string | undefined;

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function configureStripe(): void {
  process.env.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
}

function createSignatureHeader(
  body: string | Buffer,
  timestamp: string | number = NOW_SECONDS,
  secret = WEBHOOK_SECRET,
): string {
  const timestampText = String(timestamp);
  const hmac = createHmac('sha256', secret).update(`${timestampText}.`, 'utf8');

  if (typeof body === 'string') {
    hmac.update(body, 'utf8');
  } else {
    hmac.update(body);
  }

  return `t=${timestampText},v1=${hmac.digest('hex')}`;
}

function signatureValue(header: string): string {
  const value = header.split('v1=')[1];
  assert.ok(value);
  return value;
}

beforeEach(() => {
  previousSecretKey = process.env.STRIPE_SECRET_KEY;
  previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;

  vi.useFakeTimers();
  vi.setSystemTime(NOW_SECONDS * 1000);
});

afterEach(() => {
  restoreEnv('STRIPE_SECRET_KEY', previousSecretKey);
  restoreEnv('STRIPE_WEBHOOK_SECRET', previousWebhookSecret);
  vi.useRealTimers();
});

describe('Stripe webhook verification', () => {
  it('fails closed when Stripe configuration is absent', async () => {
    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY),
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('fails closed when the webhook secret is absent', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY;

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY),
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('fails closed when the webhook secret is blank', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = '   ';

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY, NOW_SECONDS, '   '),
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('rejects a missing signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const result = await new StripeAdapter().verifyWebhookPayload(EVENT_BODY, undefined);

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('accepts a valid signature without an outbound API key', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY),
    );

    assert.deepEqual(result, { verified: true, event: EVENT });
  });

  it('accepts a valid signature with full Stripe configuration', async () => {
    configureStripe();

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY),
    );

    assert.deepEqual(result, { verified: true, event: EVENT });
  });

  it('rejects a signature produced with another secret', async () => {
    configureStripe();

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      createSignatureHeader(EVENT_BODY, NOW_SECONDS, 'whsec_wrong'),
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('preserves the five-minute timestamp boundary', async () => {
    configureStripe();
    const adapter = new StripeAdapter();

    for (const timestamp of [NOW_SECONDS - 300, NOW_SECONDS + 300]) {
      const result = await adapter.verifyWebhookPayload(
        EVENT_BODY,
        createSignatureHeader(EVENT_BODY, timestamp),
      );

      assert.deepEqual(result, { verified: true, event: EVENT });
    }
  });

  it('rejects timestamps outside the tolerance', async () => {
    configureStripe();
    const adapter = new StripeAdapter();

    for (const timestamp of [NOW_SECONDS - 301, NOW_SECONDS + 301]) {
      const result = await adapter.verifyWebhookPayload(
        EVENT_BODY,
        createSignatureHeader(EVENT_BODY, timestamp),
      );

      assert.deepEqual(result, { verified: false, event: null });
    }
  });

  it('rejects noncanonical timestamps even with a valid HMAC', async () => {
    configureStripe();
    const adapter = new StripeAdapter();

    for (const timestamp of [
      'not-a-timestamp',
      `${NOW_SECONDS}junk`,
      `0${NOW_SECONDS}`,
      '9007199254740992',
    ]) {
      const result = await adapter.verifyWebhookPayload(
        EVENT_BODY,
        createSignatureHeader(EVENT_BODY, timestamp),
      );

      assert.deepEqual(result, { verified: false, event: null });
    }
  });

  it('rejects duplicate timestamps', async () => {
    configureStripe();
    const validSignature = signatureValue(createSignatureHeader(EVENT_BODY));

    const result = await new StripeAdapter().verifyWebhookPayload(
      EVENT_BODY,
      `t=${NOW_SECONDS},t=${NOW_SECONDS},v1=${validSignature}`,
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('rejects noncanonical signature encodings', async () => {
    configureStripe();
    const validSignature = signatureValue(createSignatureHeader(EVENT_BODY));
    const candidates = [
      `${validSignature}z`,
      validSignature.slice(0, -1),
      `${validSignature}0`,
      `${validSignature}=ignored`,
      validSignature.toUpperCase(),
      'not-hex',
    ];

    for (const candidate of candidates) {
      const result = await new StripeAdapter().verifyWebhookPayload(
        EVENT_BODY,
        `t=${NOW_SECONDS},v1=${candidate}`,
      );

      assert.deepEqual(result, { verified: false, event: null });
    }
  });

  it('accepts any valid v1 value during secret rotation', async () => {
    configureStripe();
    const validSignature = signatureValue(createSignatureHeader(EVENT_BODY));
    const invalidSignature = '0'.repeat(64);
    const headers = [
      `t=${NOW_SECONDS},v1=${validSignature},v1=${invalidSignature}`,
      `t=${NOW_SECONDS},v1=${invalidSignature},v1=${validSignature}`,
      `t=${NOW_SECONDS},v0=${invalidSignature},v1=${validSignature}`,
    ];

    for (const header of headers) {
      const result = await new StripeAdapter().verifyWebhookPayload(EVENT_BODY, header);

      assert.deepEqual(result, { verified: true, event: EVENT });
    }
  });

  it('rejects signed invalid JSON', async () => {
    configureStripe();
    const body = `{"id":`;

    const result = await new StripeAdapter().verifyWebhookPayload(
      body,
      createSignatureHeader(body),
    );

    assert.deepEqual(result, { verified: false, event: null });
  });

  it('rejects signed non-object JSON roots', async () => {
    configureStripe();

    for (const body of ['[]', 'null', `"event"`, '7']) {
      const result = await new StripeAdapter().verifyWebhookPayload(
        body,
        createSignatureHeader(body),
      );

      assert.deepEqual(result, { verified: false, event: null });
    }
  });

  it('verifies Buffer payloads using their exact bytes', async () => {
    configureStripe();
    const body = Buffer.from(
      `{\r\n  "id": "${EVENT.id}",\r\n  "object": "event",\r\n  "type": "${EVENT.type}"\r\n}`,
      'utf8',
    );
    const adapter = new StripeAdapter();

    const normalizedSignatureResult = await adapter.verifyWebhookPayload(
      body,
      createSignatureHeader(EVENT_BODY),
    );
    assert.deepEqual(normalizedSignatureResult, {
      verified: false,
      event: null,
    });

    const exactSignatureResult = await adapter.verifyWebhookPayload(
      body,
      createSignatureHeader(body),
    );
    assert.deepEqual(exactSignatureResult, {
      verified: true,
      event: EVENT,
    });
  });

  it('rejects a signed body after any byte changes', async () => {
    configureStripe();
    const signature = createSignatureHeader(EVENT_BODY);
    const changedBody = `${EVENT_BODY} `;

    const result = await new StripeAdapter().verifyWebhookPayload(changedBody, signature);

    assert.deepEqual(result, { verified: false, event: null });
  });
});
