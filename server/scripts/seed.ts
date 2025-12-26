import "dotenv/config";
import { db } from "../db";
import {
  companies,
  b2bUsers,
  userCompanies,
  categories,
  products,
} from "../../shared/schema";

async function seed() {
  console.log("🌱 Iniciando seed do sistema...");

  try {
    /* ===============================
       1️⃣ EMPRESA (CLIENTE / CNPJ)
    =============================== */
    const [company] = await db
      .insert(companies)
      .values({
        razaoSocial: "Empresa Demo LTDA",
        nomeFantasia: "Empresa Demo",
        slug: "empresa-demo",
        cnpj: "12.345.678/0001-90",
        tipoCliente: "ATACADO",        // ⚠️ ENUM EM CAIXA ALTA
        approvalStatus: "APROVADO",    // ⚠️ ENUM EM CAIXA ALTA
        ativo: true,
        email: "contato@empresademo.com",
        telefone: "(11) 99999-9999",
        cidade: "São Paulo",
        estado: "SP",
      })
      .returning();

    console.log("✅ Empresa criada:", company.id);

    /* ===============================
       2️⃣ USUÁRIO B2B (LOGIN)
    =============================== */
    const [user] = await db
      .insert(b2bUsers)
      .values({
        nome: "Admin Empresa",
        email: "admin@empresademo.com",
        senhaHash: "$2a$10$HASH_FAKE_APENAS_PARA_SEED", // depois trocamos
        ativo: true,
      })
      .returning();

    console.log("✅ Usuário criado:", user.id);

    /* ===============================
       3️⃣ VÍNCULO USUÁRIO ↔ EMPRESA
    =============================== */
    await db.insert(userCompanies).values({
      userId: user.id,
      companyId: company.id,
      roleNaEmpresa: "ADMIN_EMPRESA",
      isAdmin: true,
    });

    console.log("✅ Vínculo usuário ↔ empresa criado");

    /* ===============================
       4️⃣ CATEGORIAS
    =============================== */
    const [cat1] = await db
      .insert(categories)
      .values({
        companyId: company.id,
        name: "Bebidas",
        slug: "bebidas",
      })
      .returning();

    const [cat2] = await db
      .insert(categories)
      .values({
        companyId: company.id,
        name: "Snacks",
        slug: "snacks",
      })
      .returning();

    console.log("✅ Categorias criadas:", cat1.id, cat2.id);

    /* ===============================
       5️⃣ PRODUTOS
    =============================== */
    await db.insert(products).values({
      companyId: company.id,
      name: "Água Mineral 500ml",
      sku: "AGUA-500",
      categoryId: cat1.id,
      price: "3.50",
      stock: 100,
      unit: "un",
      isActive: true,
      isB2B: true,
    });
    await db.insert(products).values({
      companyId: company.id,
      name: "Refrigerante Cola 2L",
      sku: "REF-COLA-2L",
      categoryId: cat1.id,
      price: "9.90",
      stock: 50,
      unit: "un",
      isActive: true,
      isB2B: true,
    });
    await db.insert(products).values({
      companyId: company.id,
      name: "Salgadinho Chips 100g",
      sku: "CHIPS-100",
      categoryId: cat2.id,
      price: "7.50",
      stock: 80,
      unit: "un",
      isActive: true,
      isB2B: true,
    });

    console.log("✅ Produtos criados");

    console.log("🎉 Seed finalizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  }
}

seed();
