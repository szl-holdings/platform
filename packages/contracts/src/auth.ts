/**
 * Auth API contracts — request/response schemas for authentication endpoints.
 */
import { z } from "zod";
import { paginationQuerySchema, timestampsSchema } from "./common";

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const loginPasswordBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginPasswordBody = z.infer<typeof loginPasswordBodySchema>;

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const wsTicketBodySchema = z.object({
  channel: z.string().min(1).max(128).optional(),
});
export type WsTicketBody = z.infer<typeof wsTicketBodySchema>;

export const userSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  platformRole: z.string().optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.coerce.date().nullable().optional(),
  ...timestampsSchema.shape,
});
export type AuthUser = z.infer<typeof userSchema>;

export const sessionListQuerySchema = paginationQuerySchema;

export const mfaVerifyBodySchema = z.object({
  token: z.string().length(6).regex(/^\d+$/, "MFA token must be 6 digits"),
  challengeToken: z.string().optional(),
});
export type MfaVerifyBody = z.infer<typeof mfaVerifyBodySchema>;

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
