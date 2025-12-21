import { db } from "../db";
import { b2bOrderItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertB2bOrderItem } from "@shared/schema";

/**
 * Adiciona item ao pedido (snapshot de preço)
 * SEM desconto aqui
 */
export async function addItemToOrder(data: InsertB2bOrderItem) {
  const [item] = await db
    .insert(b2bOrderItems)
    .values(data)
    .returning();

  return item;
}

/**
 * Lista itens de um pedido
 */
export async function listOrderItems(orderId: string) {
  return db
    .select()
    .from(b2bOrderItems)
    .where(eq(b2bOrderItems.orderId, orderId));
}
