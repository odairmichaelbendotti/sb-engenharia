import type { OrdemServicoDocumentModel } from "./ordem-servico-document.js";

export interface IOrdemServicoDocumentGenerator {
  /** Renderiza o documento da OS em PDF. */
  generate(model: OrdemServicoDocumentModel): Promise<Buffer>;
}
