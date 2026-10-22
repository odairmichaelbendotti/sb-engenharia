import { Router } from "express";
import { prisma } from "../../infrastructure/prisma/prisma.js";

export const HealthRoutes = Router();

// Saúde da API para o deploy.sh: responde 200 só se o banco também responder
HealthRoutes.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check: banco indisponível", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});
