import { db } from "../db";
import { companies, userCompanies, orders } from "@shared/schema";
import { eq, sql, desc, count } from "drizzle-orm";
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
  roleNaEmpresa,
}: {
  userId: string;
  companyId: string;
  roleNaEmpresa: string;
}) {
  const [link] = await db
    .insert(userCompanies)
    .values({
      userId,
      companyId,
      roleNaEmpresa,
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
      roleNaEmpresa: userCompanies.roleNaEmpresa,
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

/**
 * Busca empresa por slug (catálogo público)
 */
export async function getCompanyBySlug(slug: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug));

  return company ?? null;
}

/**
 * Lista TODAS as empresas (apenas SUPER_ADMIN)
 */
export async function getAllCompanies() {
  const rows = await db.select().from(companies);
  return rows;
}

/**
 * Atualiza status de aprovação de empresa (apenas SUPER_ADMIN)
 */
export async function updateCompanyApprovalStatus(
  companyId: string,
  approvalStatus: "PENDENTE" | "APROVADO" | "REPROVADO"
) {
  const [updated] = await db
    .update(companies)
    .set({ approvalStatus })
    .where(eq(companies.id, companyId))
    .returning();

  return updated ?? null;
}

/**
 * Métricas globais para SUPER_ADMIN dashboard
 */
export async function getGlobalMetrics() {
  // Total de empresas
  const [companyCount] = await db
    .select({ count: count() })
    .from(companies);
  
  // Empresas ativas
  const [activeCount] = await db
    .select({ count: count() })
    .from(companies)
    .where(eq(companies.ativo, true));
  
  // Total de pedidos
  const [orderCount] = await db
    .select({ count: count() })
    .from(orders);
  
  // Faturamento total
  const [revenue] = await db
    .select({ 
      total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)` 
    })
    .from(orders);
  
  return {
    totalCompanies: companyCount?.count ?? 0,
    activeCompanies: activeCount?.count ?? 0,
    totalOrders: orderCount?.count ?? 0,
    totalRevenue: parseFloat(revenue?.total ?? "0"),
  };
}

/**
 * Lista empresas com estatísticas para SUPER_ADMIN dashboard
 * Nota: orders não tem companyId direto, então usamos a relação através de user_companies
 */
export async function getCompaniesWithStats() {
  const companiesList = await db.select().from(companies).orderBy(desc(companies.createdAt));
  
  // Get order stats per company via user_companies join
  const orderStats = await db
    .select({
      companyId: userCompanies.companyId,
      orderCount: count(),
      totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
    })
    .from(orders)
    .innerJoin(userCompanies, eq(orders.userId, userCompanies.userId))
    .groupBy(userCompanies.companyId);
  
  const statsMap = new Map(orderStats.map(s => [s.companyId, s]));
  
  return companiesList.map(company => ({
    ...company,
    orderCount: statsMap.get(company.id)?.orderCount ?? 0,
    totalRevenue: parseFloat(statsMap.get(company.id)?.totalRevenue ?? "0"),
    lastActivity: statsMap.get(company.id)?.lastOrderDate ?? company.updatedAt ?? company.createdAt,
  }));
}
