import { pgTable, serial, integer, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { b2bOrders } from "./orders.schema";
import { b2bProducts } from "./products.schema";

export const b2bOrderItems = pgTable("b2b_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => b2bProducts.id),
  sku: varchar("sku", { length: 50 }).notNull(),
  quantidade: integer("quantidade").notNull(),
  precoLista: decimal("preco_lista", { precision: 10, scale: 2 }).notNull(),
  descontoValor: decimal("desconto_valor", { precision: 10, scale: 2 }).notNull().default("0"),
  descontoPercentual: decimal("desconto_percentual", { precision: 5, scale: 2 }).notNull().default("0"),
  precoUnitario: decimal("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertB2bOrderItemSchema = createInsertSchema(b2bOrderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertB2bOrderItem = z.infer<typeof insertB2bOrderItemSchema>;
export type B2bOrderItem = typeof b2bOrderItems.$inferSelect;
