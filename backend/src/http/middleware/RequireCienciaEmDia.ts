import type { NextFunction, Request, Response } from "express";
import type { VerificarBloqueioCienciaUseCase } from "../../application/usecases/ordem-servico-tramitacao/VerificarBloqueioCienciaUseCase.js";

// Código que o frontend reconhece para mostrar a tela de bloqueio (só as OS pendentes de ciência)
export const CIENCIA_PENDENTE = "CIENCIA_PENDENTE";

// Empresa com OS de ciência vencida não acessa mais nada até dar ciência. Encadear depois do
// authMiddleware nas rotas que a EMPRESA alcança; as de ciência, notificação e histórico ficam livres
export class RequireCienciaEmDia {
  constructor(private verificarBloqueio: VerificarBloqueioCienciaUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (await this.verificarBloqueio.execute(req.user)) {
        return res.status(403).json({ message: CIENCIA_PENDENTE, code: CIENCIA_PENDENTE });
      }
      next();
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
