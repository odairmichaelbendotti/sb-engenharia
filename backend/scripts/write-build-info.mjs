import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const backend = fileURLToPath(new URL("../", import.meta.url));
// A versão fica gravada no artefato. Ler o HEAD a cada health check faria um
// processo antigo parecer atualizado depois de um git pull.
const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: backend, encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40,64}$/.test(revision)) throw new Error("Não foi possível identificar o commit do build.");
writeFileSync(new URL("../dist/build-info.json", import.meta.url), JSON.stringify({
  revision,
  builtAt: new Date().toISOString(),
}, null, 2));
console.log(`Build identificado: ${revision.slice(0, 7)}`);
