import { Router } from "express";
import { PrismaMedicaoRepository } from "../../infrastructure/database/prisma/PrismaMedicaoRepository.js";
import { PrismaOrdemServicoTramitacaoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoTramitacaoRepository.js";
import { PuppeteerMedicaoGenerator } from "../../infrastructure/pdf/PuppeteerMedicaoGenerator.js";
import { GetPlanilhaOrcamentoUseCase } from "../../application/usecases/medicao/GetPlanilhaOrcamentoUseCase.js";
import { SaveOrcamentoUseCase } from "../../application/usecases/medicao/SaveOrcamentoUseCase.js";
import { CreateMedicaoUseCase } from "../../application/usecases/medicao/CreateMedicaoUseCase.js";
import { GetMedicaoUseCase } from "../../application/usecases/medicao/GetMedicaoUseCase.js";
import { UpdateMedicaoUseCase } from "../../application/usecases/medicao/UpdateMedicaoUseCase.js";
import { DeleteMedicaoUseCase } from "../../application/usecases/medicao/DeleteMedicaoUseCase.js";
import { FecharMedicaoUseCase } from "../../application/usecases/medicao/FecharMedicaoUseCase.js";
import { ReabrirMedicaoUseCase } from "../../application/usecases/medicao/ReabrirMedicaoUseCase.js";
import { GenerateMedicaoDocumentUseCase } from "../../application/usecases/medicao/GenerateMedicaoDocumentUseCase.js";
import { ListPainelMedicoesUseCase } from "../../application/usecases/medicao/ListPainelMedicoesUseCase.js";
import { VerificarBloqueioCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/VerificarBloqueioCienciaUseCase.js";
import { MedicaoController } from "../controllers/MedicaoController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";
import { RequireCienciaEmDia } from "../middleware/RequireCienciaEmDia.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";

// Orçamento e medições da OS (domínio engenharia): lançam ENGENHARIA, COORDENACAO e MASTER; os
// demais perfis só leem, e a EMPRESA só as OS dos próprios contratos e as medições fechadas
export const MedicaoRoutes = Router();

const repository = new PrismaMedicaoRepository();
const controller = new MedicaoController(
  new GetPlanilhaOrcamentoUseCase(repository),
  new SaveOrcamentoUseCase(repository),
  new CreateMedicaoUseCase(repository),
  new GetMedicaoUseCase(repository),
  new UpdateMedicaoUseCase(repository),
  new DeleteMedicaoUseCase(repository),
  new FecharMedicaoUseCase(repository),
  new ReabrirMedicaoUseCase(repository),
  new GenerateMedicaoDocumentUseCase(repository, new PuppeteerMedicaoGenerator()),
  new ListPainelMedicoesUseCase(repository),
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);
const requireDomainAccess = new RequireDomainAccess();
const requireCienciaEmDia = new RequireCienciaEmDia(
  new VerificarBloqueioCienciaUseCase(new PrismaOrdemServicoTramitacaoRepository()),
);

// Tela de medições: as OS com a situação do orçamento e das medições (antes de /medicao/:id)
MedicaoRoutes.get(
  "/medicao/painel",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "view"),
  (req, res) => controller.painel(req, res),
);

// Planilha, panorama e lista de medições da OS
MedicaoRoutes.get(
  "/ordem-servico/:id/orcamento",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "view"),
  requireCienciaEmDia.handle,
  (req, res) => controller.orcamento(req, res),
);

MedicaoRoutes.put(
  "/ordem-servico/:id/orcamento",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.saveOrcamento(req, res),
);

MedicaoRoutes.post(
  "/medicao/create",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.create(req, res),
);

MedicaoRoutes.get(
  "/medicao/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "view"),
  requireCienciaEmDia.handle,
  (req, res) => controller.detail(req, res),
);

MedicaoRoutes.put(
  "/medicao/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.update(req, res),
);

MedicaoRoutes.delete(
  "/medicao/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.delete(req, res),
);

MedicaoRoutes.post(
  "/medicao/:id/fechar",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.fechar(req, res),
);

MedicaoRoutes.post(
  "/medicao/:id/reabrir",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => controller.reabrir(req, res),
);

// Boletim de medição em PDF
MedicaoRoutes.get(
  "/medicao/:id/document",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "view"),
  requireCienciaEmDia.handle,
  (req, res) => controller.document(req, res),
);
