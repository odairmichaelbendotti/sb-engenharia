import { Router } from "express";
import { PrismaOrdemServicoTramitacaoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoTramitacaoRepository.js";
import { PrismaOrdemServicoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoRepository.js";
import { PrismaNotificacaoRepository } from "../../infrastructure/database/prisma/PrismaNotificacaoRepository.js";
import { GetOrdemServicoTramitacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/GetOrdemServicoTramitacaoUseCase.js";
import { RegistrarCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/RegistrarCienciaUseCase.js";
import { CriarContestacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/CriarContestacaoUseCase.js";
import { ComentarOrdemServicoUseCase } from "../../application/usecases/ordem-servico-tramitacao/ComentarOrdemServicoUseCase.js";
import { ResponderContestacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/ResponderContestacaoUseCase.js";
import { ListPendenciasCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/ListPendenciasCienciaUseCase.js";
import { ListNotificacoesUseCase } from "../../application/usecases/notificacao/ListNotificacoesUseCase.js";
import { MarcarNotificacaoLidaUseCase } from "../../application/usecases/notificacao/MarcarNotificacaoLidaUseCase.js";
import { OrdemServicoTramitacaoController } from "../controllers/OrdemServicoTramitacaoController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { RequireCapability } from "../middleware/RequireCapability.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";

// Rotas da ciência e da contestação da OS. Ficam fora da trava de ciência (RequireCienciaEmDia):
// é por elas que a empresa travada vê as pendências, abre a OS e dá ciência
export const OrdemServicoTramitacaoRoutes = Router();

const repository = new PrismaOrdemServicoTramitacaoRepository();
const ordemServicoRepository = new PrismaOrdemServicoRepository();
const notificacaoRepository = new PrismaNotificacaoRepository();

const controller = new OrdemServicoTramitacaoController(
  new GetOrdemServicoTramitacaoUseCase(repository),
  new RegistrarCienciaUseCase(repository),
  new CriarContestacaoUseCase(repository),
  new ComentarOrdemServicoUseCase(repository),
  new ResponderContestacaoUseCase(repository),
  new ListPendenciasCienciaUseCase(repository, ordemServicoRepository),
  new ListNotificacoesUseCase(notificacaoRepository),
  new MarcarNotificacaoLidaUseCase(notificacaoRepository),
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);
const requireCapability = new RequireCapability();

// OS da empresa aguardando ciência (tela de pendências e de bloqueio)
OrdemServicoTramitacaoRoutes.get(
  "/ordem-servico/pendencias-ciencia",
  authMiddleware.handle,
  requireCapability.handle("darCienciaOrdemServico"),
  (req, res) => controller.pendencias(req, res),
);

// Situação da ciência, histórico e apontamentos; a primeira abertura pela empresa fica registrada
OrdemServicoTramitacaoRoutes.get(
  "/ordem-servico/:id/tramitacao",
  authMiddleware.handle,
  requireCapability.handle("viewOrdensServico"),
  (req, res) => controller.tramitacao(req, res),
);

OrdemServicoTramitacaoRoutes.post(
  "/ordem-servico/:id/ciencia",
  authMiddleware.handle,
  requireCapability.handle("darCienciaOrdemServico"),
  (req, res) => controller.ciencia(req, res),
);

OrdemServicoTramitacaoRoutes.post(
  "/ordem-servico/:id/contestacoes",
  authMiddleware.handle,
  requireCapability.handle("darCienciaOrdemServico"),
  (req, res) => controller.contestacao(req, res),
);

// Empresa e fiscalização comentam; o use case confere qual dos dois e a janela de cada um
OrdemServicoTramitacaoRoutes.post(
  "/ordem-servico/:id/comentarios",
  authMiddleware.handle,
  requireCapability.handle("viewOrdensServico"),
  (req, res) => controller.comentario(req, res),
);

OrdemServicoTramitacaoRoutes.put(
  "/ordem-servico/contestacoes/:id/resposta",
  authMiddleware.handle,
  requireCapability.handle("tramitarOrdemServico"),
  (req, res) => controller.resposta(req, res),
);

// Notificações: cada usuário vê as do seu público (empresa ou fiscalização); os demais, lista vazia
OrdemServicoTramitacaoRoutes.get("/notificacoes", authMiddleware.handle, (req, res) =>
  controller.notificacoes(req, res),
);

OrdemServicoTramitacaoRoutes.put("/notificacoes/lidas", authMiddleware.handle, (req, res) =>
  controller.marcarTodasLidas(req, res),
);

OrdemServicoTramitacaoRoutes.put("/notificacoes/:id/lida", authMiddleware.handle, (req, res) =>
  controller.marcarLida(req, res),
);
