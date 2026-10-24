import type { IOrdemServicoDocumentGenerator } from "../../domain/documents/IOrdemServicoDocumentGenerator.js";
import type { OrdemServicoDocumentModel } from "../../domain/documents/ordem-servico-document.js";
import { renderPdf } from "./chrome.js";
import { renderOrdemServicoFooter, renderOrdemServicoHtml } from "./ordem-servico-html.js";

export class PuppeteerOrdemServicoGenerator implements IOrdemServicoDocumentGenerator {
  async generate(model: OrdemServicoDocumentModel): Promise<Buffer> {
    try {
      return await renderPdf(renderOrdemServicoHtml(model), {
        margin: { top: "16mm", bottom: "20mm", left: "20mm", right: "20mm" },
        footerTemplate: renderOrdemServicoFooter(model),
      });
    } catch (error) {
      // O controller responde só "Internal server error": o motivo (Chrome ausente, timeout) fica no log
      console.error("Failed to render the ordem de serviço PDF:", error);
      throw error;
    }
  }
}
