import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { sendBadRequest } from "./api-response";

export const commonSchemas = {
  id: z.coerce.number().int().positive(),
  idParam: z.object({ id: z.coerce.number().int().positive() }),

  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  email: z.string().email().max(320).toLowerCase().trim(),

  shortText: z.string().min(1).max(200).trim(),
  mediumText: z.string().min(1).max(1000).trim(),
  longText: z.string().min(1).max(10000).trim(),

  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i),

  url: z.string().url().max(2048),

  isoDate: z.string().datetime({ offset: true }),

  orgId: z.coerce.number().int().positive(),
};

export const contactSubmitSchema = z.object({
  type: z.string().max(64).optional().default("general"),
  app: z.string().max(64).optional().default("unknown"),
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("A valid email is required").max(320).trim().toLowerCase(),
  company: z.string().max(200).trim().optional(),
  role: z.string().max(200).trim().optional(),
  message: z.string().max(5000).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const feedbackNpsSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).trim().optional(),
  appName: z.string().max(100).trim().optional(),
  pageUrl: z.string().max(2048).trim().optional(),
  userRole: z.string().max(100).trim().optional(),
});

export const feedbackContextualSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  comment: z.string().max(2000).trim().optional(),
  appName: z.string().max(100).trim().optional(),
  pageUrl: z.string().max(2048).trim().optional(),
  userRole: z.string().max(100).trim().optional(),
});

export const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  company: z.string().min(1, "Company is required").max(200).trim(),
  fleetSize: z.string().max(50).optional(),
  message: z.string().max(5000).trim().optional(),
  product: z.string().max(100).optional().default("vessels"),
  phone: z.string().max(50).trim().optional(),
  role: z.string().max(200).trim().optional(),
  useCase: z.string().max(1000).trim().optional(),
  source: z.string().max(100).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const invitationSchema = z.object({
  email: z.string().email().max(320).trim().toLowerCase(),
  role: z.string().min(1).max(100),
  orgId: z.number().int().positive().optional(),
  message: z.string().max(1000).trim().optional(),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(200).trim().optional(),
  email: z.string().email().max(320).trim().toLowerCase().optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field is required" });

export const organizationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  domain: z.string().max(253).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000).trim(),
  entityType: z.string().min(1).max(100),
  entityId: z.coerce.number().int().positive(),
  parentId: z.coerce.number().int().positive().optional(),
});

export const fileUploadMetaSchema = z.object({
  filename: z.string().min(1).max(255).trim(),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(100 * 1024 * 1024),
  entityType: z.string().max(100).optional(),
  entityId: z.coerce.number().int().positive().optional(),
});

export const notificationUpdateSchema = z.object({
  isRead: z.boolean(),
});

export const featureFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  enabled: z.boolean(),
  description: z.string().max(500).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      sendBadRequest(res, `Validation error: ${errors}`);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      sendBadRequest(res, `Invalid query parameters: ${errors}`);
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      sendBadRequest(res, `Invalid path parameters: ${errors}`);
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}
