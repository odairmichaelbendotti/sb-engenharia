import type { IMedicaoDocumentGenerator } from "../../domain/documents/IMedicaoDocumentGenerator.js";
import type { MedicaoDocumentModel } from "../../domain/documents/medicao-document.js";
import { renderPdf } from "./chrome.js";
import { renderMedicaoFooter, renderMedicaoHtml } from "./medicao-html.js";

export class PuppeteerMedicaoGenerator implements IMedicaoDocumentGenerator {
  async generate(model: MedicaoDocumentModel): Promise<Buffer> {
    try {
      return await renderPdf(renderMedicaoHtml(model), {
        landscape: true,
        margin: { top: "12mm", bottom: "16mm", left: "12mm", right: "12mm" },
        footerTemplate: renderMedicaoFooter(model),
      });
    } catch (error) {
      // O controller responde só "Internal server error": o motivo (Chrome ausente, timeout) fica no log
      console.error("Failed to render the medição PDF:", error);
      throw error;
    }
  }
}
