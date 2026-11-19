import { createServer } from "node:http";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { verifyRuntime } from "../../../scripts/verify-runtime.mjs";

const revision = "a".repeat(40);
async function serve(health: object | string, routeStatus: number, run: (base: string) => Promise<void>) {
  const server = createServer((req, res) => {
    if (req.url === "/api/health") {
      res.setHeader("Content-Type", typeof health === "string" ? "text/html" : "application/json");
      res.end(typeof health === "string" ? health : JSON.stringify(health));
    } else {
      res.statusCode = routeStatus;
      res.setHeader("Content-Type", routeStatus === 404 ? "text/html" : "application/json");
      res.end(routeStatus === 404 ? "<!DOCTYPE html><pre>Cannot GET /api/fiscalizacao</pre>" : JSON.stringify({ message: "Token not provided" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Endereço indisponível");
    await run(`http://127.0.0.1:${address.port}`);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}
describe("Verificação do backend publicado", () => {
  it("rejeita uma API antiga mesmo que o health esteja verde", async () => {
    await serve({ status: "ok", database: "ok" }, 404, async (url) => {
      await expect(verifyRuntime(url, revision)).rejects.toThrow("build sem identificação");
    });
  });
  it("rejeita um processo de outro commit", async () => {
    await serve({ status: "ok", database: "ok", revision: "b".repeat(40) }, 401, async (url) => {
      await expect(verifyRuntime(url, revision)).rejects.toThrow(`esperado ${revision}`);
    });
  });
  it("rejeita o HTML da rota ausente mesmo com o commit correto", async () => {
    await serve({ status: "ok", database: "ok", revision }, 404, async (url) => {
      await expect(verifyRuntime(url, revision)).rejects.toThrow("HTTP 404, resposta não JSON");
    });
  });
  it("rejeita health em HTML e banco indisponível", async () => {
    for (const health of ["<!DOCTYPE html>", { status: "error", database: "unavailable", revision }]) {
      await serve(health, 401, async (url) => { await expect(verifyRuntime(url, revision)).rejects.toThrow("saúde"); });
    }
  });
  it("confirma a versão e a passagem pela autenticação da fiscalização", async () => {
    await serve({ status: "ok", database: "ok", revision, builtAt: "2026-11-19T12:00:00Z" }, 401, async (url) => {
      await expect(verifyRuntime(url, revision)).resolves.toEqual({ revision, builtAt: "2026-11-19T12:00:00Z" });
    });
  });
  it("rejeita PM2 de outra cópia do projeto sem expor o restante do ambiente", () => {
    const script = fileURLToPath(new URL("../../../scripts/check-pm2-runtime.mjs", import.meta.url));
    const input = JSON.stringify([{ name: "sb-backend", pm2_env: { pm_cwd: "/outra-pasta/backend", pm_exec_path: "/outra-pasta/backend/dist/server.js", SECRET_EXAMPLE: "not-for-output" } }]);
    const result = spawnSync(process.execPath, [script, "/projeto/backend"], { input, encoding: "utf8" });
    expect(result.status).toBe(1); expect(result.stderr).toContain("Esperado"); expect(result.stderr).not.toContain("not-for-output");
  });
  it("confirma o caminho do script e da pasta no PM2", () => {
    const script = fileURLToPath(new URL("../../../scripts/check-pm2-runtime.mjs", import.meta.url));
    const input = JSON.stringify([{ name: "sb-backend", pm2_env: { pm_cwd: "/projeto/backend", pm_exec_path: "/projeto/backend/dist/server.js" } }]);
    expect(execFileSync(process.execPath, [script, "/projeto/backend"], { input, encoding: "utf8" })).toContain("server.js");
  });
});
