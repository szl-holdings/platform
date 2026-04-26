import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const carlotaDripSequencesTable = pgTable(
  'carlota_drip_sequences',
  {
    id: serial('id').primaryKey(),
    sequenceId: text('sequence_id').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    practiceArea: text('practice_area'),
    status: text('status', { enum: ['draft', 'active', 'paused', 'archived'] })
      .notNull()
      .default('draft'),
    totalSteps: integer('total_steps').notNull().default(0),
    totalEnrolled: integer('total_enrolled').notNull().default(0),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('carlota_drip_sequences_status_idx').on(t.status)],
);

export const carlotaDripStepsTable = pgTable(
  'carlota_drip_steps',
  {
    id: serial('id').primaryKey(),
    stepId: text('step_id').notNull().unique(),
    sequenceId: text('sequence_id').notNull(),
    stepOrder: integer('step_order').notNull(),
    delayDays: integer('delay_days').notNull().default(0),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),
    ctaUrl: text('cta_url'),
    ctaLabel: text('cta_label'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('carlota_drip_steps_sequence_idx').on(t.sequenceId),
    uniqueIndex('carlota_drip_steps_sequence_order_idx').on(t.sequenceId, t.stepOrder),
  ],
);

export const carlotaDripEnrollmentsTable = pgTable(
  'carlota_drip_enrollments',
  {
    id: serial('id').primaryKey(),
    enrollmentId: text('enrollment_id').notNull().unique(),
    sequenceId: text('sequence_id').notNull(),
    contactEmail: text('contact_email').notNull(),
    contactName: text('contact_name'),
    contactPhone: text('contact_phone'),
    currentStepOrder: integer('current_step_order').notNull().default(0),
    status: text('status', { enum: ['active', 'completed', 'unsubscribed', 'paused', 'bounced'] })
      .notNull()
      .default('active'),
    unsubscribeToken: text('unsubscribe_token').notNull().unique(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
    lastSentAt: timestamp('last_sent_at'),
    nextSendAt: timestamp('next_send_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('carlota_drip_enrollments_sequence_idx').on(t.sequenceId),
    index('carlota_drip_enrollments_status_idx').on(t.status),
    index('carlota_drip_enrollments_next_send_idx').on(t.nextSendAt),
    uniqueIndex('carlota_drip_enrollments_seq_email_idx').on(t.sequenceId, t.contactEmail),
  ],
);

export const carlotaDripEngagementEventsTable = pgTable(
  'carlota_drip_engagement_events',
  {
    id: serial('id').primaryKey(),
    enrollmentId: text('enrollment_id').notNull(),
    stepId: text('step_id').notNull(),
    eventType: text('event_type', {
      enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained'],
    }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('carlota_drip_engagement_enrollment_idx').on(t.enrollmentId),
    index('carlota_drip_engagement_step_idx').on(t.stepId),
    index('carlota_drip_engagement_type_idx').on(t.eventType),
  ],
);

export type CarlotaDripSequence = typeof carlotaDripSequencesTable.$inferSelect;
export type CarlotaDripStep = typeof carlotaDripStepsTable.$inferSelect;
export type CarlotaDripEnrollment = typeof carlotaDripEnrollmentsTable.$inferSelect;
export type CarlotaDripEngagementEvent = typeof carlotaDripEngagementEventsTable.$inferSelect;
