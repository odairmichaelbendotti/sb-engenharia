import type { Browser, LaunchOptions, PDFOptions } from "puppeteer";

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

// Um Chrome por processo, aberto no primeiro PDF e reaproveitado por todos os documentos; se cair,
// abre outro. O puppeteer só é carregado aqui: se ele ou o Chrome faltarem no servidor, só o PDF falha
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

export type RenderPdfOptions = Pick<PDFOptions, "format" | "landscape" | "margin"> & { footerTemplate: string };

/** Imprime um HTML autocontido em PDF, numa aba própria com a rede bloqueada. */
export async function renderPdf(html: string, { footerTemplate, ...options }: RenderPdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // O HTML é autocontido (fontes e imagem em data URL): nada sai para a rede
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url().startsWith("data:")) void request.continue();
      else void request.abort();
    });

    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      ...options,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => undefined);
  }
}
