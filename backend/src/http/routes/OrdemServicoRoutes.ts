import { Router } from "express";
import { PrismaOrdemServicoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoRepository.js";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { PrismaObraRepository } from "../../infrastructure/database/prisma/PrismaObraRepository.js";
import { CreateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/CreateOrdemServicoUseCase.js";
import { ListOrdensServicoUseCase } from "../../application/usecases/ordem-servico/ListOrdensServicoUseCase.js";
import { ListOrdemServicoOptionsForObraUseCase } from "../../application/usecases/ordem-servico/ListOrdemServicoOptionsForObraUseCase.js";
import { UpdateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoUseCase.js";
import { UpdateOrdemServicoStatusUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoStatusUseCase.js";
import { DeleteOrdemServicoUseCase } from "../../application/usecases/ordem-servico/DeleteOrdemServicoUseCase.js";
import { GenerateOrdemServicoDocumentUseCase } from "../../application/usecases/ordem-servico/GenerateOrdemServicoDocumentUseCase.js";
import { PuppeteerOrdemServicoGenerator } from "../../infrastructure/pdf/PuppeteerOrdemServicoGenerator.js";
import { GetProximoNumeroOrdemServicoUseCase } from "../../application/usecases/ordem-servico/GetProximoNumeroOrdemServicoUseCase.js";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";
import { RequireCapability } from "../middleware/RequireCapability.js";
import { RequireCienciaEmDia } from "../middleware/RequireCienciaEmDia.js";
import { PrismaOrdemServicoTramitacaoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoTramitacaoRepository.js";
import { VerificarBloqueioCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/VerificarBloqueioCienciaUseCase.js";

export const OrdemServicoRoutes = Router();

const repository = new PrismaOrdemServicoRepository();
const empenhoRepository = new PrismaEmpenhoRepository();
const obraRepository = new PrismaObraRepository();
const tramitacaoRepository = new PrismaOrdemServicoTramitacaoRepository();
const createOrdemServicoUseCase = new CreateOrdemServicoUseCase(repository, empenhoRepository, obraRepository);
const listOrdensServicoUseCase = new ListOrdensServicoUseCase(repository);
const listOrdemServicoOptionsForObraUseCase = new ListOrdemServicoOptionsForObraUseCase(repository);
const updateOrdemServicoUseCase = new UpdateOrdemServicoUseCase(repository, empenhoRepository, obraRepository);
const updateOrdemServicoStatusUseCase = new UpdateOrdemServicoStatusUseCase(repository, tramitacaoRepository);
const deleteOrdemServicoUseCase = new DeleteOrdemServicoUseCase(repository, tramitacaoRepository);
const generateOrdemServicoDocumentUseCase = new GenerateOrdemServicoDocumentUseCase(
  repository,
  new PuppeteerOrdemServicoGenerator(),
);
const getProximoNumeroOrdemServicoUseCase = new GetProximoNumeroOrdemServicoUseCase(repository);

const ordemServicoController = new OrdemServicoController(
  createOrdemServicoUseCase,
  listOrdensServicoUseCase,
  listOrdemServicoOptionsForObraUseCase,
  updateOrdemServicoUseCase,
  updateOrdemServicoStatusUseCase,
  deleteOrdemServicoUseCase,
  generateOrdemServicoDocumentUseCase,
  getProximoNumeroOrdemServicoUseCase,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

const requireDomainAccess = new RequireDomainAccess();
const requireCapability = new RequireCapability();
const requireCienciaEmDia = new RequireCienciaEmDia(new VerificarBloqueioCienciaUseCase(tramitacaoRepository));

OrdemServicoRoutes.post(
  "/ordem-servico/create",
  authMiddleware.handle,
  // ENGENHARIA só visualiza o administrativo, mas pode abrir OS
  requireCapability.handle("createOrdemServico"),
  (req, res) => ordemServicoController.create(req, res),
);

// Número que a próxima OS do lote receberia: o formulário de criação o mostra ao escolher contrato e lote
OrdemServicoRoutes.get(
  "/ordem-servico/proximo-numero",
  authMiddleware.handle,
  requireCapability.handle("createOrdemServico"),
  (req, res) => ordemServicoController.proximoNumero(req, res),
);

// EMPRESA também lista, restrita às OS dos próprios contratos (escopo aplicado no use case)
OrdemServicoRoutes.get(
  "/ordem-servico/list",
  authMiddleware.handle,
  requireCapability.handle("viewOrdensServico"),
  // Empresa com ciência vencida só vê as pendências (GET /ordem-servico/pendencias-ciencia)
  requireCienciaEmDia.handle,
  (req, res) => ordemServicoController.list(req, res),
);

// Rota estreita: expõe só numero/valor das ordens de serviço ativas e ainda sem
// obra vinculada, com o empenho/contrato/empresa aninhados só pra exibição —
// usada pelo select do ObraModal. Não retorna dado administrativo completo, por
// isso libera pra quem só tem acesso de edição em Engenharia (mesmo padrão já
// usado em `contrato/list-for-obra`).
OrdemServicoRoutes.get(
  "/ordem-servico/list-for-obra",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => ordemServicoController.listOptionsForObra(req, res),
);

// PDF da OS preenchido com os dados cadastrados. Mesmo acesso da listagem: EMPRESA só baixa
// as OS dos próprios contratos (escopo aplicado no use case)
OrdemServicoRoutes.get(
  "/ordem-servico/document/:id",
  authMiddleware.handle,
  requireCapability.handle("viewOrdensServico"),
  (req, res) => ordemServicoController.document(req, res),
);

OrdemServicoRoutes.put(
  "/ordem-servico/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.update(req, res),
);

OrdemServicoRoutes.put(
  "/ordem-servico/update-status/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.updateStatus(req, res),
);

OrdemServicoRoutes.delete(
  "/ordem-servico/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.delete(req, res),
);
