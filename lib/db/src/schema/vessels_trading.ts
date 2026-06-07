import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const tradingInstrumentTypeEnum = pgEnum('trading_instrument_type', [
  'freight_futures',
  'bunker_fuel',
  'dry_bulk',
  'wet_bulk',
  'container_rate',
  'lng_spot',
  'iron_ore_swap',
]);

export const tradingOrderTypeEnum = pgEnum('trading_order_type', ['market', 'limit']);
export const tradingOrderSideEnum = pgEnum('trading_order_side', ['buy', 'sell']);
export const tradingOrderStatusEnum = pgEnum('trading_order_status', [
  'pending',
  'open',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected',
]);

export const commodityTradingInstrumentsTable = pgTable('commodity_trading_instruments', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull().unique(),
  name: text('name').notNull(),
  instrumentType: tradingInstrumentTypeEnum('instrument_type').notNull().default('dry_bulk'),
  exchange: text('exchange').notNull().default('Baltic Exchange'),
  currency: text('currency').notNull().default('USD'),
  unit: text('unit').notNull().default('$/day'),
  lotSize: numeric('lot_size', { precision: 15, scale: 2 }).default('1'),
  tickSize: numeric('tick_size', { precision: 10, scale: 4 }).default('0.01'),
  currentPrice: numeric('current_price', { precision: 15, scale: 4 }),
  previousClose: numeric('previous_close', { precision: 15, scale: 4 }),
  dayHigh: numeric('day_high', { precision: 15, scale: 4 }),
  dayLow: numeric('day_low', { precision: 15, scale: 4 }),
  volume: integer('volume').default(0),
  openInterest: integer('open_interest').default(0),
  description: text('description'),
  routeCode: text('route_code'),
  isActive: boolean('is_active').default(true),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const commodityTradingOrdersTable = pgTable('commodity_trading_orders', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').default(1),
  instrumentId: integer('instrument_id').references(() => commodityTradingInstrumentsTable.id),
  orderRef: text('order_ref').notNull().unique(),
  orderType: tradingOrderTypeEnum('order_type').notNull().default('market'),
  side: tradingOrderSideEnum('side').notNull(),
  status: tradingOrderStatusEnum('status').notNull().default('pending'),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull(),
  limitPrice: numeric('limit_price', { precision: 15, scale: 4 }),
  avgFillPrice: numeric('avg_fill_price', { precision: 15, scale: 4 }),
  filledQty: numeric('filled_qty', { precision: 15, scale: 4 }).default('0'),
  remainingQty: numeric('remaining_qty', { precision: 15, scale: 4 }),
  notionalValue: numeric('notional_value', { precision: 20, scale: 2 }),
  commission: numeric('commission', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  filledAt: timestamp('filled_at'),
  cancelledAt: timestamp('cancelled_at'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const commodityTradingPositionsTable = pgTable('commodity_trading_positions', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').default(1),
  instrumentId: integer('instrument_id').references(() => commodityTradingInstrumentsTable.id),
  side: tradingOrderSideEnum('side').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull().default('0'),
  avgEntryPrice: numeric('avg_entry_price', { precision: 15, scale: 4 }),
  currentPrice: numeric('current_price', { precision: 15, scale: 4 }),
  unrealizedPnl: numeric('unrealized_pnl', { precision: 20, scale: 2 }).default('0'),
  realizedPnl: numeric('realized_pnl', { precision: 20, scale: 2 }).default('0'),
  totalPnl: numeric('total_pnl', { precision: 20, scale: 2 }).default('0'),
  notionalValue: numeric('notional_value', { precision: 20, scale: 2 }),
  marginUsed: numeric('margin_used', { precision: 20, scale: 2 }).default('0'),
  openedAt: timestamp('opened_at').defaultNow(),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const commodityTradingFillsTable = pgTable('commodity_trading_fills', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => commodityTradingOrdersTable.id),
  instrumentId: integer('instrument_id').references(() => commodityTradingInstrumentsTable.id),
  fillRef: text('fill_ref').notNull().unique(),
  side: tradingOrderSideEnum('side').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull(),
  price: numeric('price', { precision: 15, scale: 4 }).notNull(),
  commission: numeric('commission', { precision: 10, scale: 2 }).default('0'),
  executionVenue: text('execution_venue').default('SZL-DEMO'),
  filledAt: timestamp('filled_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertCommodityTradingOrderSchema = createInsertSchema(
  commodityTradingOrdersTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommodityTradingPositionSchema = createInsertSchema(
  commodityTradingPositionsTable,
).omit({ id: true, createdAt: true });
export const insertCommodityTradingFillSchema = createInsertSchema(commodityTradingFillsTable).omit(
  { id: true, createdAt: true },
);

export type CommodityTradingInstrument = typeof commodityTradingInstrumentsTable.$inferSelect;
export type CommodityTradingOrder = typeof commodityTradingOrdersTable.$inferSelect;
export type CommodityTradingPosition = typeof commodityTradingPositionsTable.$inferSelect;
export type CommodityTradingFill = typeof commodityTradingFillsTable.$inferSelect;
export type InsertCommodityTradingOrder = typeof commodityTradingOrdersTable.$inferInsert;
