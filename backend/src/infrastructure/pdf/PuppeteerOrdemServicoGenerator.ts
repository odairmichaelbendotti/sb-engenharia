import type { Browser, LaunchOptions } from "puppeteer";
import type { IOrdemServicoDocumentGenerator } from "../../domain/documents/IOrdemServicoDocumentGenerator.js";
import type { OrdemServicoDocumentModel } from "../../domain/documents/ordem-servico-document.js";
import { renderOrdemServicoFooter, renderOrdemServicoHtml } from "./ordem-servico-html.js";

// Opções do Chrome conforme o servidor
function launchOptions(): LaunchOptions {
  const args: string[] = [];
  if (process.platform === "linux") {
    // Em container o /dev/shm costuma ser pequeno e derruba o Chrome em páginas grandes
    args.push("--disable-dev-shm-usage");
    // O Chrome não abre como root com o sandbox ligado (comum em Docker)
    if (process.getuid?.() === 0) args.push("--no-sandbox");
  }
  // Com PUPPETEER_EXECUTABLE_PATH (Chromium do sistema) usa o headless novo, que todo Chrome atual tem;
  // sem ela, o chrome-headless-shell baixado na instalação (ver .puppeteerrc.cjs)
  return { headless: process.env.PUPPETEER_EXECUTABLE_PATH ? true : "shell", args };
}

// Um Chrome por processo, aberto no primeiro PDF e reaproveitado; se cair, abre outro.
// O puppeteer só é carregado aqui: se ele ou o Chrome faltarem no servidor, só o PDF falha
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = import("puppeteer")
      .then(({ default: puppeteer }) => puppeteer.launch(launchOptions()))
      .then((browser) => {
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      });
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

export class PuppeteerOrdemServicoGenerator implements IOrdemServicoDocumentGenerator {
  async generate(model: OrdemServicoDocumentModel): Promise<Buffer> {
    try {
      return await this.render(model);
    } catch (error) {
      // O controller responde só "Internal server error": o motivo (Chrome ausente, timeout) fica no log
      console.error("Failed to render the ordem de serviço PDF:", error);
      throw error;
    }
  }

  private async render(model: OrdemServicoDocumentModel): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      // O HTML é autocontido (fontes e imagem em data URL): nada sai para a rede
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (request.url().startsWith("data:")) void request.continue();
        else void request.abort();
      });

      await page.setContent(renderOrdemServicoHtml(model), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "20mm", left: "20mm", right: "20mm" },
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: renderOrdemServicoFooter(model),
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }
}
