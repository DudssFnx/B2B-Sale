import { sql } from "drizzle-orm";
import { pgTable, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const b2bUsers = pgTable("b2b_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").unique().notNull(),
  senhaHash: text("senha_hash"),
  telefone: text("telefone"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertB2bUserSchema = createInsertSchema(b2bUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertB2bUser = z.infer<typeof insertB2bUserSchema>;
export type B2bUser = typeof b2bUsers.$inferSelect;
