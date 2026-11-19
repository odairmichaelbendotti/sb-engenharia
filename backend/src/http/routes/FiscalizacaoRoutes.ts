import { Router, type Request, type Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { PrismaFiscalizacaoRepository } from "../../infrastructure/database/prisma/PrismaFiscalizacaoRepository.js";
import { dadosAlteracao, dadosFiscal, fiscalizacaoEscopo, idsOrdens, tipoFiscal } from "../../domain/fiscalizacao.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../domain/polices/DomainAccessPolicy.js";

export const FiscalizacaoRoutes = Router();
const auth = new AuthMiddleware(new TokenGenerator(), new PrismaUserRepository());
const repository = new PrismaFiscalizacaoRepository();

function endpoint(run: (req: Request, tenant_id: string) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      if (!new DomainAccessPolicy().canDo(req.user.role, "manageFiscalizacao")) return res.status(403).json({ message: "Você não tem permissão para gerenciar a fiscalização." });
      const tenant_id = fiscalizacaoEscopo(req.user, req.method === "GET" ? req.query.tenant_id : req.body?.tenant_id);
      res.json(await run(req, tenant_id));
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      console.error("Erro na gestão da fiscalização", error);
      res.status(500).json({ message: "Não foi possível concluir a operação de fiscalização." });
    }
  };
}

FiscalizacaoRoutes.get("/fiscalizacao", auth.handle, endpoint((req, tenant) => repository.list(tenant, req.user)));
FiscalizacaoRoutes.post("/fiscalizacao/fiscais", auth.handle, endpoint((req, tenant) =>
  repository.save(req.user, tenant, null, dadosFiscal(req.body), dadosAlteracao(req.body))));
FiscalizacaoRoutes.put("/fiscalizacao/fiscais/:id", auth.handle, endpoint((req, tenant) =>
  repository.save(req.user, tenant, String(req.params.id), dadosFiscal(req.body), dadosAlteracao(req.body))));
FiscalizacaoRoutes.post("/fiscalizacao/designacoes", auth.handle, endpoint((req, tenant) =>
  repository.vincular(req.user, tenant, String(req.body.fiscal_id ?? ""), String(req.body.contrato_id ?? ""), tipoFiscal(req.body.tipo), dadosAlteracao(req.body))));
FiscalizacaoRoutes.post("/fiscalizacao/designacoes/:id/encerrar", auth.handle, endpoint((req, tenant) =>
  repository.encerrar(req.user, tenant, String(req.params.id), dadosAlteracao(req.body))));
FiscalizacaoRoutes.post("/fiscalizacao/substituicoes", auth.handle, endpoint((req, tenant) =>
  repository.substituir(req.user, tenant, String(req.body.contrato_id ?? ""), tipoFiscal(req.body.tipo),
    req.body.anterior_id == null || req.body.anterior_id === "" ? null : String(req.body.anterior_id),
    String(req.body.novo_id ?? ""), idsOrdens(req.body.ordens), dadosAlteracao(req.body))));
