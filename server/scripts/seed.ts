import "dotenv/config";
import { db } from "../db";
import {
  companies,
  b2bUsers,
  userCompanies,
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
      role: "ADMIN_EMPRESA", // se existir enum/role
      ativo: true,
    });

    console.log("✅ Vínculo usuário ↔ empresa criado");

    console.log("🎉 Seed finalizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  }
}

seed();
