import type { MedicaoDocumentModel } from "./medicao-document.js";

export interface IMedicaoDocumentGenerator {
  /** Renderiza o boletim de medição em PDF. */
  generate(model: MedicaoDocumentModel): Promise<Buffer>;
}
