import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';

export const treasuryAccountsTable = pgTable(
  'treasury_accounts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['coinbase_commerce', 'coinbase_prime', 'fireblocks', 'internal'] })
      .notNull()
      .default('coinbase_commerce'),
    accountId: text('account_id'),
    label: text('label').notNull(),
    currency: text('currency').notNull(),
    currencyType: text('currency_type', { enum: ['fiat', 'stablecoin', 'crypto'] })
      .notNull()
      .default('stablecoin'),
    network: text('network'),
    walletAddress: text('wallet_address'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('treasury_accounts_org_id_idx').on(t.orgId),
    index('treasury_accounts_provider_idx').on(t.provider),
  ],
);

export const treasuryBalanceSnapshotsTable = pgTable(
  'treasury_balance_snapshots',
  {
    id: serial('id').primaryKey(),
    accountId: integer('account_id')
      .notNull()
      .references(() => treasuryAccountsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    balance: numeric('balance', { precision: 20, scale: 8 }).notNull(),
    balanceUsd: numeric('balance_usd', { precision: 20, scale: 2 }),
    exchangeRate: numeric('exchange_rate', { precision: 20, scale: 8 }),
    snapshotAt: timestamp('snapshot_at').notNull().defaultNow(),
  },
  (t) => [
    index('treasury_snapshots_account_id_idx').on(t.accountId),
    index('treasury_snapshots_org_id_idx').on(t.orgId),
    index('treasury_snapshots_snapshot_at_idx').on(t.snapshotAt),
  ],
);

export const treasuryTransactionsTable = pgTable(
  'treasury_transactions',
  {
    id: serial('id').primaryKey(),
    accountId: integer('account_id')
      .notNull()
      .references(() => treasuryAccountsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    providerTxId: text('provider_tx_id').unique(),
    txType: text('tx_type', { enum: ['credit', 'debit', 'transfer', 'fee', 'yield'] })
      .notNull()
      .default('credit'),
    amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
    currency: text('currency').notNull(),
    amountUsd: numeric('amount_usd', { precision: 20, scale: 2 }),
    description: text('description'),
    counterparty: text('counterparty'),
    status: text('status', { enum: ['pending', 'confirmed', 'failed'] })
      .notNull()
      .default('confirmed'),
    txHash: text('tx_hash'),
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('treasury_txns_account_id_idx').on(t.accountId),
    index('treasury_txns_org_id_idx').on(t.orgId),
    index('treasury_txns_occurred_at_idx').on(t.occurredAt),
    index('treasury_txns_provider_tx_id_idx').on(t.providerTxId),
  ],
);

export const insertTreasuryAccountSchema = createInsertSchema(treasuryAccountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTreasuryBalanceSnapshotSchema = createInsertSchema(
  treasuryBalanceSnapshotsTable,
).omit({ id: true });

export const insertTreasuryTransactionSchema = createInsertSchema(treasuryTransactionsTable).omit({
  id: true,
  createdAt: true,
});

export type TreasuryAccount = typeof treasuryAccountsTable.$inferSelect;
export type TreasuryBalanceSnapshot = typeof treasuryBalanceSnapshotsTable.$inferSelect;
export type TreasuryTransaction = typeof treasuryTransactionsTable.$inferSelect;
export type InsertTreasuryAccount = z.infer<typeof insertTreasuryAccountSchema>;
export type InsertTreasuryTransaction = z.infer<typeof insertTreasuryTransactionSchema>;
