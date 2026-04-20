/**
 * Webhook contracts — inbound webhook body schemas.
 */
import { z } from "zod";

export const stripeWebhookBodySchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  created: z.number(),
  livemode: z.boolean().optional(),
});
export type StripeWebhookBody = z.infer<typeof stripeWebhookBodySchema>;

export const alloyEmailIngestBodySchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string().max(998).optional(),
  text: z.string().max(131072).optional(),
  html: z.string().max(524288).optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number().int().min(0),
        content: z.string().optional(),
      }),
    )
    .optional(),
  headers: z.record(z.string()).optional(),
});
export type AlloyEmailIngestBody = z.infer<typeof alloyEmailIngestBodySchema>;

export const slackInteractionBodySchema = z.object({
  type: z.string(),
  payload: z.string().optional(),
  challenge: z.string().optional(),
  token: z.string().optional(),
  team_id: z.string().optional(),
  event: z
    .object({
      type: z.string(),
      user: z.string().optional(),
      text: z.string().optional(),
      channel: z.string().optional(),
    })
    .optional(),
});

export const docusignWebhookBodySchema = z.object({
  event: z.string(),
  uri: z.string().optional(),
  retryCount: z.number().int().optional(),
  configurationId: z.number().int().optional(),
  apiVersion: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export const genericWebhookBodySchema = z.record(z.unknown());
