import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { b2bUsers, userCompanies, companies } from "@shared/schema";

const router = Router();

/* ===============================
   CONFIG
=============================== */

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

/* ===============================
   SCHEMAS
=============================== */

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

/* ===============================
   HELPERS
=============================== */

function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/* ===============================
   ROUTES
=============================== */

/**
 * 🔐 LOGIN (EMAIL + SENHA)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(b2bUsers)
      .where(eq(b2bUsers.email, email));

    if (!user || !user.ativo) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const senhaOk = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaOk) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Buscar empresas do usuário
    const companiesLinks = await db
      .select({
        companyId: userCompanies.companyId,
        role: userCompanies.roleNaEmpresa,
        companyName: companies.nomeFantasia,
      })
      .from(userCompanies)
      .innerJoin(companies, eq(companies.id, userCompanies.companyId))
      .where(eq(userCompanies.userId, user.id));

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      companies: companiesLinks,
    });
  } catch (error) {
    return res.status(400).json({ message: "Erro ao realizar login" });
  }
});

/**
 * 🔎 ME (VALIDAR TOKEN)
 * (por enquanto simples, depois protegemos com middleware)
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token ausente" });
    }

    const [, token] = authHeader.split(" ");

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const [user] = await db
      .select()
      .from(b2bUsers)
      .where(eq(b2bUsers.id, decoded.userId));

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    return res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
    });
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
});

export default router;
