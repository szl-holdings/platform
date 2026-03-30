import { pgTable, text, serial, timestamp, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  replitId: text("replit_id").unique(),
  email: text("email").unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name", { enum: [
    "super_admin",
    "admin",
    "editor",
    "member",
    "client",
    "authenticated",
    "exec",
    "ops",
    "compliance",
    "maintenance",
    "analyst",
    "viewer",
    "operator",
    "seller",
    "client_viewer",
    "creative_user",
  ] }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRolesTable = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_role_unique").on(table.userId, table.roleId),
]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertRoleSchema = createInsertSchema(rolesTable).omit({ id: true, createdAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

export type RoleName =
  | "super_admin"
  | "admin"
  | "editor"
  | "member"
  | "client"
  | "authenticated"
  | "exec"
  | "ops"
  | "compliance"
  | "maintenance"
  | "analyst"
  | "viewer"
  | "operator"
  | "seller"
  | "client_viewer"
  | "creative_user";

export const ROLE_HIERARCHY: Record<RoleName, RoleName[]> = {
  super_admin: ["super_admin", "admin", "editor", "member", "client", "authenticated", "exec", "ops", "compliance", "maintenance", "analyst", "viewer", "operator", "seller", "client_viewer", "creative_user"],
  admin: ["admin", "editor", "member", "client", "authenticated", "exec", "ops", "compliance", "maintenance", "analyst", "viewer", "operator", "seller", "client_viewer", "creative_user"],
  editor: ["editor", "member", "authenticated", "viewer", "creative_user"],
  member: ["member", "authenticated", "viewer"],
  client: ["client", "authenticated", "client_viewer"],
  authenticated: ["authenticated"],
  exec: ["exec", "ops", "compliance", "maintenance", "analyst", "viewer", "operator"],
  ops: ["ops", "viewer", "operator"],
  compliance: ["compliance", "viewer"],
  maintenance: ["maintenance", "viewer"],
  analyst: ["analyst", "viewer"],
  viewer: ["viewer"],
  operator: ["operator", "viewer"],
  seller: ["seller", "viewer"],
  client_viewer: ["client_viewer"],
  creative_user: ["creative_user", "viewer"],
};

export const ROLE_ALIASES: Record<string, RoleName> = {
  public: "viewer",
};
