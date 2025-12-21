import { db } from "../db";
import { companies, userCompanies } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertCompany } from "@shared/schema";

/**
 * Cria uma nova empresa (CNPJ)
 * NÃO cria vínculo automaticamente
 */
export async function createCompany(data: InsertCompany) {
  const [company] = await db
    .insert(companies)
    .values(data)
    .returning();

  return company;
}

/**
 * Vincula um usuário a uma empresa
 * Define role dentro da empresa (ADMIN_EMPRESA, COMPRADOR, etc)
 */
export async function linkUserToCompany({
  userId,
  companyId,
  role,
}: {
  userId: string;
  companyId: string;
  role: string;
}) {
  const [link] = await db
    .insert(userCompanies)
    .values({
      userId,
      companyId,
      role,
    })
    .returning();

  return link;
}

/**
 * Lista todas as empresas às quais o usuário pertence
 */
export async function getCompaniesByUser(userId: string) {
  const rows = await db
    .select({
      id: companies.id,
      razaoSocial: companies.razaoSocial,
      nomeFantasia: companies.nomeFantasia,
      tipoCliente: companies.tipoCliente,
      approvalStatus: companies.approvalStatus,
      role: userCompanies.role,
    })
    .from(userCompanies)
    .innerJoin(companies, eq(userCompanies.companyId, companies.id))
    .where(eq(userCompanies.userId, userId));

  return rows;
}

/**
 * Busca empresa por ID (uso interno / contexto ativo)
 */
export async function getCompanyById(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  return company ?? null;
}
