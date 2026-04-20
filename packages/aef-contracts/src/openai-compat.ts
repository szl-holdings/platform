import { z } from "zod";

export const OpenAIEmbedRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string().default("aef-default"),
  encoding_format: z.enum(["float", "base64"]).default("float"),
  dimensions: z.number().int().positive().optional(),
  user: z.string().optional(),
});
export type OpenAIEmbedRequest = z.infer<typeof OpenAIEmbedRequestSchema>;

export const OpenAIEmbedDataSchema = z.object({
  object: z.literal("embedding"),
  embedding: z.array(z.number()),
  index: z.number().int().nonnegative(),
});
export type OpenAIEmbedData = z.infer<typeof OpenAIEmbedDataSchema>;

export const OpenAIEmbedUsageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});
export type OpenAIEmbedUsage = z.infer<typeof OpenAIEmbedUsageSchema>;

export const OpenAIEmbedResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(OpenAIEmbedDataSchema),
  model: z.string(),
  usage: OpenAIEmbedUsageSchema,
});
export type OpenAIEmbedResponse = z.infer<typeof OpenAIEmbedResponseSchema>;
