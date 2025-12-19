import { pgTable, serial, integer, varchar, text, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { b2bOrderItems } from "./orderItems.schema";
import { b2bUsers } from "./users.schema";

export const tipoDescontoEnum = pgEnum("tipo_desconto", ["VALOR", "PERCENTUAL"]);
export const discountStatusEnum = pgEnum("discount_status", ["PENDENTE", "APROVADO", "REJEITADO"]);

export const orderItemDiscounts = pgTable("order_item_discounts", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => b2bOrderItems.id, { onDelete: "cascade" }),
  solicitadoPorUserId: varchar("solicitado_por_user_id").notNull().references(() => b2bUsers.id),
  aprovadoPorUserId: varchar("aprovado_por_user_id").references(() => b2bUsers.id),
  tipoDesconto: tipoDescontoEnum("tipo_desconto").notNull(),
  valorSolicitado: decimal("valor_solicitado", { precision: 10, scale: 2 }).notNull(),
  valorAprovado: decimal("valor_aprovado", { precision: 10, scale: 2 }),
  motivo: text("motivo"),
  status: discountStatusEnum("status").notNull().default("PENDENTE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderItemDiscountSchema = createInsertSchema(orderItemDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderItemDiscount = z.infer<typeof insertOrderItemDiscountSchema>;
export type OrderItemDiscount = typeof orderItemDiscounts.$inferSelect;
