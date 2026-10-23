import type { Request, Response } from "express";
import type { GetOrdemServicoTramitacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/GetOrdemServicoTramitacaoUseCase.js";
import type { RegistrarCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/RegistrarCienciaUseCase.js";
import type { CriarContestacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/CriarContestacaoUseCase.js";
import type { ComentarOrdemServicoUseCase } from "../../application/usecases/ordem-servico-tramitacao/ComentarOrdemServicoUseCase.js";
import type { ResponderContestacaoUseCase } from "../../application/usecases/ordem-servico-tramitacao/ResponderContestacaoUseCase.js";
import type { ListPendenciasCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/ListPendenciasCienciaUseCase.js";
import type { ListNotificacoesUseCase } from "../../application/usecases/notificacao/ListNotificacoesUseCase.js";
import type { MarcarNotificacaoLidaUseCase } from "../../application/usecases/notificacao/MarcarNotificacaoLidaUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";

function paramId(req: Request) {
  const { id } = req.params;
  if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
  return id;
}

function handleError(res: Response, error: unknown) {
  if (error instanceof DomainError) return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: "Internal server error" });
}

// Ciência, apontamentos e histórico da OS, e as notificações dentro do sistema
export class OrdemServicoTramitacaoController {
  constructor(
    private getTramitacao: GetOrdemServicoTramitacaoUseCase,
    private registrarCiencia: RegistrarCienciaUseCase,
    private criarContestacao: CriarContestacaoUseCase,
    private comentarOrdemServico: ComentarOrdemServicoUseCase,
    private responderContestacao: ResponderContestacaoUseCase,
    private listPendenciasCiencia: ListPendenciasCienciaUseCase,
    private listNotificacoes: ListNotificacoesUseCase,
    private marcarNotificacaoLida: MarcarNotificacaoLidaUseCase,
  ) {}

  async tramitacao(req: Request, res: Response) {
    try {
      const data = await this.getTramitacao.execute({ ordemServicoId: paramId(req), user: req.user });
      res.set("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async ciencia(req: Request, res: Response) {
    try {
      const data = await this.registrarCiencia.execute({ ordemServicoId: paramId(req), user: req.user });
      res.status(201).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async contestacao(req: Request, res: Response) {
    try {
      await this.criarContestacao.execute({ ordemServicoId: paramId(req), user: req.user, texto: req.body?.texto });
      res.status(201).json({ message: "Contestação registered" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async comentario(req: Request, res: Response) {
    try {
      await this.comentarOrdemServico.execute({ ordemServicoId: paramId(req), user: req.user, texto: req.body?.texto });
      res.status(201).json({ message: "Comentário registered" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async resposta(req: Request, res: Response) {
    try {
      await this.responderContestacao.execute({
        contestacaoId: paramId(req),
        user: req.user,
        decisao: req.body?.decisao,
        resposta: req.body?.resposta,
      });
      res.status(200).json({ message: "Contestação answered" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async pendencias(req: Request, res: Response) {
    try {
      const data = await this.listPendenciasCiencia.execute(req.user);
      res.set("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async notificacoes(req: Request, res: Response) {
    try {
      const data = await this.listNotificacoes.execute(req.user);
      res.set("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async marcarLida(req: Request, res: Response) {
    try {
      await this.marcarNotificacaoLida.execute({ user: req.user, notificacaoId: paramId(req) });
      res.status(200).json({ message: "Notificação marked as read" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async marcarTodasLidas(req: Request, res: Response) {
    try {
      await this.marcarNotificacaoLida.execute({ user: req.user, notificacaoId: null });
      res.status(200).json({ message: "Notificações marked as read" });
    } catch (error) {
      return handleError(res, error);
    }
  }
}
