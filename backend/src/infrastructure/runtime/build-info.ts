import { readFileSync } from "node:fs";

type BuildInfo = { revision: string | null; builtAt: string | null };

function loadBuildInfo(): BuildInfo {
  try {
    const data = JSON.parse(readFileSync(new URL("../../../build-info.json", import.meta.url), "utf8"));
    if (typeof data.revision === "string" && /^[a-f0-9]{40,64}$/.test(data.revision) && typeof data.builtAt === "string") {
      return { revision: data.revision, builtAt: data.builtAt };
    }
  } catch {
    // Desenvolvimento com tsx não usa o artefato de produção.
  }
  return { revision: null, builtAt: null };
}

// Copiado uma única vez na inicialização do processo, não a cada requisição.
export const BUILD_INFO = Object.freeze(loadBuildInfo());
