import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  replitId: text('replit_id').unique(),
  email: text('email').unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  platformRole: text('platform_role', {
    enum: [
      'anonymous_visitor',
      'founder_admin',
      'platform_admin',
      'operator',
      'analyst',
      'executive_viewer',
      'ops_manager',
      'sales_delivery_user',
      'maritime_ops_user',
      'real_estate_ops_user',
      'service_coordinator',
      'pilot_customer_user',
    ],
  }),
  team: text('team'),
  passwordHash: text('password_hash'),
  emailVerificationToken: text('email_verification_token').unique(),
  emailVerificationTokenExpiresAt: timestamp('email_verification_token_expires_at', {
    withTimezone: true,
  }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  passwordResetToken: text('password_reset_token').unique(),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  sessionVersion: integer('session_version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rolesTable = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name', {
    enum: [
      'super_admin',
      'admin',
      'editor',
      'member',
      'client',
      'authenticated',
      'exec',
      'ops',
      'compliance',
      'maintenance',
      'analyst',
      'viewer',
      'operator',
      'seller',
      'client_viewer',
      'creative_user',
    ],
  })
    .notNull()
    .unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userRolesTable = pgTable(
  'user_roles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('user_role_unique').on(table.userId, table.roleId)],
);

export const sessionsTable = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    sessionVersion: integer('session_version').notNull().default(1),
    refreshToken: text('refresh_token').unique(),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    refreshTokenUsedAt: timestamp('refresh_token_used_at'),
    replacedBySessionId: integer('replaced_by_session_id').references(
      (): AnyPgColumn => sessionsTable.id,
      { onDelete: 'set null' },
    ),
    revokedAt: timestamp('revoked_at'),
    revokedReason: text('revoked_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
    index('sessions_revoked_at_idx').on(t.revokedAt),
  ],
);

export const mfaSecretsTable = pgTable(
  'mfa_secrets',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    secret: text('secret').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    enabledAt: timestamp('enabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('mfa_secrets_user_unique').on(table.userId)],
);

export const deviceBiometricBindingsTable = pgTable(
  'device_biometric_bindings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull(),
    bindingToken: text('binding_token').notNull().unique(),
    deviceName: text('device_name'),
    platform: text('platform'),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
  },
  (t) => [
    uniqueIndex('device_biometric_user_device_unique').on(t.userId, t.deviceId),
    index('device_biometric_bindings_user_id_idx').on(t.userId),
    index('device_biometric_bindings_token_idx').on(t.bindingToken),
  ],
);

export const stepUpAssertionsTable = pgTable(
  'step_up_assertions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    sessionToken: text('session_token').notNull(),
    bindingId: integer('binding_id').references(() => deviceBiometricBindingsTable.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('step_up_assertions_session_idx').on(t.sessionToken),
    index('step_up_assertions_token_idx').on(t.token),
  ],
);

export const biometricChallengesTable = pgTable(
  'biometric_challenges',
  {
    id: serial('id').primaryKey(),
    deviceId: text('device_id').notNull(),
    nonce: text('nonce').notNull().unique(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('biometric_challenges_device_id_idx').on(t.deviceId),
    index('biometric_challenges_nonce_idx').on(t.nonce),
  ],
);

export const magicLinksTable = pgTable(
  'magic_links',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('magic_links_token_idx').on(t.token),
    index('magic_links_email_idx').on(t.email),
    index('magic_links_expires_at_idx').on(t.expiresAt),
  ],
);

export const userDevicesTable = pgTable(
  'user_devices',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    fingerprintHash: text('fingerprint_hash').notNull(),
    userAgent: text('user_agent'),
    displayName: text('display_name'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastIpHash: text('last_ip_hash'),
    isTrusted: boolean('is_trusted').notNull().default(false),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('user_devices_user_fingerprint_unique').on(t.userId, t.fingerprintHash),
    index('user_devices_user_id_idx').on(t.userId),
  ],
);

export const loginAttemptsTable = pgTable(
  'login_attempts',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    ipAddress: text('ip_address'),
    success: boolean('success').notNull().default(false),
    failureReason: text('failure_reason'),
    deviceFingerprintHash: text('device_fingerprint_hash'),
    riskScore: integer('risk_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('login_attempts_email_idx').on(t.email),
    index('login_attempts_ip_idx').on(t.ipAddress),
    index('login_attempts_created_at_idx').on(t.createdAt),
  ],
);

export type MagicLink = typeof magicLinksTable.$inferSelect;
export type UserDevice = typeof userDevicesTable.$inferSelect;
export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertRoleSchema = createInsertSchema(rolesTable).omit({ id: true, createdAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

export type MfaSecret = typeof mfaSecretsTable.$inferSelect;
export type DeviceBiometricBinding = typeof deviceBiometricBindingsTable.$inferSelect;
export type StepUpAssertion = typeof stepUpAssertionsTable.$inferSelect;
export type BiometricChallenge = typeof biometricChallengesTable.$inferSelect;

export type PlatformRole =
  | 'anonymous_visitor'
  | 'founder_admin'
  | 'platform_admin'
  | 'operator'
  | 'analyst'
  | 'executive_viewer'
  | 'ops_manager'
  | 'sales_delivery_user'
  | 'maritime_ops_user'
  | 'real_estate_ops_user'
  | 'service_coordinator'
  | 'pilot_customer_user';

export const PLATFORM_ROLES: PlatformRole[] = [
  'anonymous_visitor',
  'founder_admin',
  'platform_admin',
  'operator',
  'analyst',
  'executive_viewer',
  'ops_manager',
  'sales_delivery_user',
  'maritime_ops_user',
  'real_estate_ops_user',
  'service_coordinator',
  'pilot_customer_user',
];

export const PLATFORM_ROLE_HIERARCHY: Record<PlatformRole, number> = {
  anonymous_visitor: 0,
  pilot_customer_user: 1,
  executive_viewer: 2,
  analyst: 3,
  service_coordinator: 4,
  sales_delivery_user: 4,
  maritime_ops_user: 4,
  real_estate_ops_user: 4,
  operator: 5,
  ops_manager: 6,
  platform_admin: 8,
  founder_admin: 10,
};

export const PLATFORM_READ_ONLY_ROLES: PlatformRole[] = ['executive_viewer', 'pilot_customer_user'];
export const PLATFORM_WRITE_ROLES: PlatformRole[] = [
  'operator',
  'ops_manager',
  'service_coordinator',
  'sales_delivery_user',
  'maritime_ops_user',
  'platform_admin',
  'founder_admin',
];
export const PLATFORM_ADMIN_ROLES: PlatformRole[] = ['platform_admin', 'founder_admin'];

export function hasPlatformRole(userRole: PlatformRole, requiredRole: PlatformRole): boolean {
  return PLATFORM_ROLE_HIERARCHY[userRole] >= PLATFORM_ROLE_HIERARCHY[requiredRole];
}

export function isPlatformAdmin(userRole: PlatformRole | undefined): boolean {
  if (!userRole) return false;
  return PLATFORM_ADMIN_ROLES.includes(userRole);
}

export function canWritePlatform(userRole: PlatformRole | undefined): boolean {
  if (!userRole) return false;
  return PLATFORM_WRITE_ROLES.includes(userRole);
}

export function isReadOnlyPlatformUser(userRole: PlatformRole | undefined): boolean {
  if (!userRole) return false;
  return PLATFORM_READ_ONLY_ROLES.includes(userRole);
}

export type RoleName =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'member'
  | 'client'
  | 'authenticated'
  | 'exec'
  | 'ops'
  | 'compliance'
  | 'maintenance'
  | 'analyst'
  | 'viewer'
  | 'operator'
  | 'seller'
  | 'client_viewer'
  | 'creative_user';

export const ROLE_HIERARCHY: Record<RoleName, RoleName[]> = {
  super_admin: [
    'super_admin',
    'admin',
    'editor',
    'member',
    'client',
    'authenticated',
    'exec',
    'ops',
    'compliance',
    'maintenance',
    'analyst',
    'viewer',
    'operator',
    'seller',
    'client_viewer',
    'creative_user',
  ],
  admin: [
    'admin',
    'editor',
    'member',
    'client',
    'authenticated',
    'exec',
    'ops',
    'compliance',
    'maintenance',
    'analyst',
    'viewer',
    'operator',
    'seller',
    'client_viewer',
    'creative_user',
  ],
  editor: ['editor', 'member', 'authenticated', 'viewer', 'creative_user'],
  member: ['member', 'authenticated', 'viewer'],
  client: ['client', 'authenticated', 'client_viewer'],
  authenticated: ['authenticated'],
  exec: ['exec', 'ops', 'compliance', 'maintenance', 'analyst', 'viewer', 'operator'],
  ops: ['ops', 'viewer', 'operator'],
  compliance: ['compliance', 'viewer'],
  maintenance: ['maintenance', 'viewer'],
  analyst: ['analyst', 'viewer'],
  viewer: ['viewer'],
  operator: ['operator', 'viewer'],
  seller: ['seller', 'viewer'],
  client_viewer: ['client_viewer'],
  creative_user: ['creative_user', 'viewer'],
};

export const ROLE_ALIASES: Record<string, RoleName> = {
  public: 'viewer',
};

export type CanonicalRole =
  | 'anonymous_visitor'
  | 'founder_admin'
  | 'platform_admin'
  | 'operator'
  | 'analyst'
  | 'executive_viewer'
  | 'ops_manager'
  | 'sales_delivery_user'
  | 'maritime_ops_user'
  | 'real_estate_ops_user'
  | 'service_coordinator'
  | 'pilot_customer_user';

export const LEGACY_TO_CANONICAL: Record<RoleName, CanonicalRole> = {
  super_admin: 'founder_admin',
  admin: 'platform_admin',
  exec: 'executive_viewer',
  ops: 'ops_manager',
  operator: 'operator',
  analyst: 'analyst',
  compliance: 'analyst',
  maintenance: 'ops_manager',
  editor: 'platform_admin',
  member: 'operator',
  seller: 'sales_delivery_user',
  client: 'pilot_customer_user',
  client_viewer: 'executive_viewer',
  creative_user: 'service_coordinator',
  authenticated: 'operator',
  viewer: 'anonymous_visitor',
};

export const CANONICAL_TO_LEGACY: Record<CanonicalRole, RoleName> = {
  anonymous_visitor: 'viewer',
  founder_admin: 'super_admin',
  platform_admin: 'admin',
  operator: 'operator',
  analyst: 'analyst',
  executive_viewer: 'exec',
  ops_manager: 'ops',
  sales_delivery_user: 'seller',
  maritime_ops_user: 'ops',
  real_estate_ops_user: 'ops',
  service_coordinator: 'creative_user',
  pilot_customer_user: 'client',
};

export function toCanonicalRole(roles: RoleName[]): CanonicalRole {
  const canonicalPriority: CanonicalRole[] = [
    'founder_admin',
    'platform_admin',
    'ops_manager',
    'operator',
    'analyst',
    'executive_viewer',
    'sales_delivery_user',
    'maritime_ops_user',
    'real_estate_ops_user',
    'service_coordinator',
    'pilot_customer_user',
    'anonymous_visitor',
  ];
  const mapped = roles.map((r) => LEGACY_TO_CANONICAL[r] ?? 'anonymous_visitor');
  for (const canonical of canonicalPriority) {
    if (mapped.includes(canonical)) return canonical;
  }
  return 'anonymous_visitor';
}

export function isExclusivelyExecutiveViewer(roles: RoleName[]): boolean {
  const canonical = toCanonicalRole(roles);
  return canonical === 'executive_viewer';
}

export const READ_ONLY_CANONICAL_ROLES = new Set<CanonicalRole>([
  'executive_viewer',
  'anonymous_visitor',
]);

export function isReadOnlyRole(roles: RoleName[]): boolean {
  const canonical = toCanonicalRole(roles);
  return READ_ONLY_CANONICAL_ROLES.has(canonical);
}
