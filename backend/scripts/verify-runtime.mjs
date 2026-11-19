import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function verifyRuntime(baseUrl, expectedRevision) {
  if (!/^[a-f0-9]{40,64}$/.test(expectedRevision)) throw new Error("Commit esperado inválido.");
  const options = () => ({ redirect: "error", signal: AbortSignal.timeout(5000), headers: { "Cache-Control": "no-cache" } });
  const [health, fiscalizacao] = await Promise.all([
    fetch(new URL("/api/health", baseUrl), options()),
    fetch(new URL("/api/fiscalizacao", baseUrl), options()),
  ]);
  const [info, fiscal] = await Promise.all([health.json().catch(() => null), fiscalizacao.json().catch(() => null)]);
  if (!health.ok || info?.status !== "ok" || info?.database !== "ok") {
    throw new Error(`A saúde da API/banco falhou (HTTP ${health.status}).`);
  }
  if (info.revision !== expectedRevision) {
    throw new Error(`A API está executando ${info.revision ?? "um build sem identificação"}; esperado ${expectedRevision}. Confira a pasta/script do PM2 e reinicie o backend compilado.`);
  }
  // Uma requisição sem cookie deve chegar ao middleware de autenticação desta
  // rota. Um health check verde sozinho não comprova que a rota foi publicada.
  if (fiscalizacao.status !== 401 || !fiscal || typeof fiscal.message !== "string") {
    throw new Error(`A rota /api/fiscalizacao não respondeu pela API esperada (HTTP ${fiscalizacao.status}${fiscal ? ", JSON" : ", resposta não JSON"}). Confira o processo e o encaminhamento do Nginx.`);
  }
  return { revision: info.revision, builtAt: info.builtAt };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  verifyRuntime(process.argv[2], process.argv[3]).then((info) => {
    console.log(`API no commit ${info.revision.slice(0, 7)}, banco respondendo e rota de fiscalização disponível.`);
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
