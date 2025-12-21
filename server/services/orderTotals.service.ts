import { db } from "../db";
import {
  b2bOrders,
  b2bOrderItems,
  orderItemDiscounts,
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Recalcula subtotal e total do pedido
 * Usa SOMENTE descontos APROVADOS
 */
export async function recalcOrderTotals(orderId: number) {
  // Soma itens
  const items = await db
    .select({
      itemTotal: sql<number>`quantity * price`,
      itemId: b2bOrderItems.id,
    })
    .from(b2bOrderItems)
    .where(eq(b2bOrderItems.orderId, orderId));

  let subtotal = items.reduce((acc, i) => acc + Number(i.itemTotal), 0);

  // Soma descontos aprovados
  const discounts = await db
    .select({
      value: orderItemDiscounts.value,
      type: orderItemDiscounts.tipo,
    })
    .from(orderItemDiscounts)
    .innerJoin(
      b2bOrderItems,
      eq(orderItemDiscounts.orderItemId, b2bOrderItems.id)
    )
    .where(
      and(
        eq(b2bOrderItems.orderId, orderId),
        eq(orderItemDiscounts.status, "APROVADO")
      )
    );

  let totalDiscount = 0;

  for (const d of discounts) {
    if (d.type === "PERCENTUAL") {
      totalDiscount += (subtotal * Number(d.value)) / 100;
    } else {
      totalDiscount += Number(d.value);
    }
  }

  const total = subtotal - totalDiscount;

  const [order] = await db
    .update(b2bOrders)
    .set({
      subtotal,
      total,
    })
    .where(eq(b2bOrders.id, orderId))
    .returning();

  return order;
}
