import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lyteProductsTable = pgTable("lyte_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").unique(),
  description: text("description"),
  category: text("category"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("usd"),
  imageUrl: text("image_url"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteOrdersTable = pgTable("lyte_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  status: text("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "canceled", "refunded"] }).notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteOrderItemsTable = pgTable("lyte_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => lyteOrdersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => lyteProductsTable.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLyteProductSchema = createInsertSchema(lyteProductsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteProduct = z.infer<typeof insertLyteProductSchema>;
export type LyteProduct = typeof lyteProductsTable.$inferSelect;

export const insertLyteOrderSchema = createInsertSchema(lyteOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteOrder = z.infer<typeof insertLyteOrderSchema>;
export type LyteOrder = typeof lyteOrdersTable.$inferSelect;

export const insertLyteOrderItemSchema = createInsertSchema(lyteOrderItemsTable).omit({ id: true, createdAt: true });
export type InsertLyteOrderItem = z.infer<typeof insertLyteOrderItemSchema>;
export type LyteOrderItem = typeof lyteOrderItemsTable.$inferSelect;
