import { db } from "../db";
import { companies, userCompanies } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Define a empresa ativa do usuário
 * Valida se o usuário pertence à empresa
 */
export async function setActiveCompany({
  userId,
  companyId,
}: {
  userId: string;
  companyId: string;
}) {
  const [link] = await db
    .select()
    .from(userCompanies)
    .where(
      and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, companyId)
      )
    );

  if (!link) {
    throw new Error("Usuário não pertence a esta empresa");
  }

  return true;
}

/**
 * Obtém a empresa ativa do usuário
 */
export async function getActiveCompany(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  return company ?? null;
}
