import { Request, Response, NextFunction } from "express";

export function requireCompany(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const companyId = req.session?.activeCompanyId;

  if (!companyId) {
    return res.status(400).json({
      error: "Nenhuma empresa ativa selecionada",
    });
  }

  next();
}
