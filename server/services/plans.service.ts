import { db } from "../db";
import { plans, subscriptions, usageMetrics, type Plan, type Subscription, type UsageMetric, type PlanLimits } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const DEFAULT_PLANS: Array<{
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: string[];
  sortOrder: number;
  isDefault?: boolean;
}> = [
  {
    code: "STARTER",
    name: "Starter",
    description: "Ideal para pequenos negocios",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    limits: {
      maxUsers: 2,
      maxProducts: 100,
      maxOrdersPerMonth: 50,
      maxCategories: 10,
      blingIntegration: false,
      customLogo: false,
      multiplePaymentMethods: false,
      advancedReports: false,
    },
    features: [
      "Ate 2 usuarios",
      "100 produtos",
      "50 pedidos/mes",
      "Suporte por email",
    ],
    sortOrder: 1,
    isDefault: true,
  },
  {
    code: "PROFESSIONAL",
    name: "Profissional",
    description: "Para negocios em crescimento",
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    limits: {
      maxUsers: 5,
      maxProducts: 500,
      maxOrdersPerMonth: 200,
      maxCategories: 50,
      blingIntegration: true,
      customLogo: true,
      multiplePaymentMethods: true,
      advancedReports: false,
    },
    features: [
      "Ate 5 usuarios",
      "500 produtos",
      "200 pedidos/mes",
      "Integracao Bling",
      "Logo personalizado",
      "Multiplas formas de pagamento",
    ],
    sortOrder: 2,
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Para grandes operacoes",
    monthlyPrice: 39900,
    yearlyPrice: 399000,
    limits: {
      maxUsers: -1,
      maxProducts: -1,
      maxOrdersPerMonth: -1,
      maxCategories: -1,
      blingIntegration: true,
      customLogo: true,
      multiplePaymentMethods: true,
      advancedReports: true,
    },
    features: [
      "Usuarios ilimitados",
      "Produtos ilimitados",
      "Pedidos ilimitados",
      "Todas as integracoes",
      "Relatorios avancados",
      "Suporte prioritario",
    ],
    sortOrder: 3,
  },
];

class PlansService {
  async seedDefaultPlans(): Promise<void> {
    const existingPlans = await db.select().from(plans).limit(1);
    
    if (existingPlans.length > 0) {
      console.log("[PLANS] Plans already seeded, skipping...");
      return;
    }

    console.log("[PLANS] Seeding default plans...");
    
    for (const plan of DEFAULT_PLANS) {
      await db.insert(plans).values({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        limits: plan.limits,
        features: plan.features,
        sortOrder: plan.sortOrder,
        isDefault: plan.isDefault || false,
        status: "active",
      });
    }

    console.log("[PLANS] Default plans seeded successfully");
  }

  async getAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.status, "active")).orderBy(plans.sortOrder);
  }

  async getPlanById(id: string): Promise<Plan | undefined> {
    const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    return result[0];
  }

  async getPlanByCode(code: string): Promise<Plan | undefined> {
    const result = await db.select().from(plans).where(eq(plans.code, code)).limit(1);
    return result[0];
  }

  async getDefaultPlan(): Promise<Plan | undefined> {
    const result = await db.select().from(plans).where(eq(plans.isDefault, true)).limit(1);
    return result[0];
  }

  async getCompanySubscription(companyId: string): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.companyId, companyId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result[0];
  }

  async createSubscription(
    companyId: string,
    planId: string,
    billingCycle: "monthly" | "yearly" = "monthly"
  ): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now);
    
    if (billingCycle === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const result = await db
      .insert(subscriptions)
      .values({
        companyId,
        planId,
        billingCycle,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      })
      .returning();

    return result[0];
  }

  async getCompanyUsage(companyId: string): Promise<UsageMetric[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.companyId, companyId));
  }

  async incrementUsage(companyId: string, metricKey: string, amount: number = 1): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const existing = await db
      .select()
      .from(usageMetrics)
      .where(
        and(
          eq(usageMetrics.companyId, companyId),
          eq(usageMetrics.metricKey, metricKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(usageMetrics)
        .set({ 
          currentValue: existing[0].currentValue + amount,
          updatedAt: new Date()
        })
        .where(eq(usageMetrics.id, existing[0].id));
    } else {
      await db.insert(usageMetrics).values({
        companyId,
        metricKey,
        currentValue: amount,
        periodStart,
        periodEnd,
      });
    }
  }
}

export const plansService = new PlansService();
