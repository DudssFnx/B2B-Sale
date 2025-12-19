import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, text, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies.schema";
import { b2bUsers } from "./users.schema";

export const orderChannelEnum = pgEnum("order_channel", ["SITE", "ADMIN", "REPRESENTANTE", "API"]);
export const orderStatusEnum = pgEnum("order_status", ["ORCAMENTO", "GERADO", "FATURADO", "CANCELADO"]);
export const orderEtapaEnum = pgEnum("order_etapa", ["AGUARDANDO", "SEPARADO", "COBRADO", "ENVIADO"]);

export const b2bOrders = pgTable("b2b_orders", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  createdByUserId: varchar("created_by_user_id").references(() => b2bUsers.id),
  orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),
  channel: orderChannelEnum("channel").notNull().default("SITE"),
  status: orderStatusEnum("status").notNull().default("ORCAMENTO"),
  etapa: orderEtapaEnum("etapa").notNull().default("AGUARDANDO"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  descontoTotal: decimal("desconto_total", { precision: 12, scale: 2 }).notNull().default("0"),
  frete: decimal("frete", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertB2bOrderSchema = createInsertSchema(b2bOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertB2bOrder = z.infer<typeof insertB2bOrderSchema>;
export type B2bOrder = typeof b2bOrders.$inferSelect;
