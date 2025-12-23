import { db } from "../db";
import { b2bUsers } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const SUPER_ADMIN_EMAIL = "admin@sistema.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@2024!";
const SUPER_ADMIN_NAME = "Administrador do Sistema";

async function seedSuperAdmin() {
  console.log("[SEED] Verificando usuário SUPER_ADMIN...");

  const [existing] = await db
    .select()
    .from(b2bUsers)
    .where(eq(b2bUsers.email, SUPER_ADMIN_EMAIL));

  if (existing) {
    console.log("[SEED] SUPER_ADMIN já existe:", existing.email);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const [superAdmin] = await db
    .insert(b2bUsers)
    .values({
      nome: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      senhaHash: hashedPassword,
      ativo: true,
    })
    .returning();

  console.log("[SEED] SUPER_ADMIN criado com sucesso!");
  console.log("[SEED] Email:", SUPER_ADMIN_EMAIL);
  console.log("[SEED] Senha inicial:", SUPER_ADMIN_PASSWORD);
  console.log("[SEED] IMPORTANTE: Altere a senha após o primeiro login!");

  return superAdmin;
}

seedSuperAdmin()
  .then(() => {
    console.log("[SEED] Concluído.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[SEED] Erro:", error);
    process.exit(1);
  });
