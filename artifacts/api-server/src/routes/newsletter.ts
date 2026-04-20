import { bodyShape } from '@szl-holdings/contracts/common';
import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';

import { validateBody } from '../lib/validation';

const router = Router();

/** Masks PII: keeps domain portion only, e.g. "user@example.com" → "***@example.com" */
function maskEmail(email: string): string {
  const atIdx = email.indexOf('@');
  return atIdx > 0 ? `***${email.slice(atIdx)}` : '***';
}

const SubscribeBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  utm_source: z.string().max(64).optional(),
});

const SUBSTACK_PUBLICATION = 'szlholdings';

router.post('/newsletter/subscribe', validateBody(bodyShape({})), async (req, res) => {
  const parsed = SubscribeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid request' });
  }

  const { email, utm_source } = parsed.data;

  try {
    const substackUrl = `https://${SUBSTACK_PUBLICATION}.substack.com/api/v1/free`;
    const resp = await fetch(substackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SZL-Holdings-Platform/1.0',
      },
      body: JSON.stringify({ email, first_name: '' }),
    });

    if (resp.ok || resp.status === 200) {
      logger.info({ email: maskEmail(email), utm_source }, '[newsletter] subscribe success');
      return res.status(200).json({ success: true });
    }

    const text = await resp.text().catch(() => '');
    logger.warn(
      { email: maskEmail(email), utm_source, status: resp.status, body: text },
      '[newsletter] substack returned non-ok status',
    );

    if (resp.status === 400) {
      return res.status(400).json({
        message: 'This email address could not be subscribed. Please check it and try again.',
      });
    }

    if (resp.status === 429) {
      return res
        .status(429)
        .json({ message: 'Too many requests. Please wait a moment and try again.' });
    }

    return res
      .status(502)
      .json({ message: 'Unable to subscribe right now. Please try again later.' });
  } catch (err) {
    logger.error({ err, utm_source }, '[newsletter] subscribe fetch error');
    return res
      .status(500)
      .json({ message: 'Unable to subscribe right now. Please try again later.' });
  }
});

export default router;
