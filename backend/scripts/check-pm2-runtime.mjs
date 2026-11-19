import { resolve } from "node:path";

let input = "";
for await (const chunk of process.stdin) input += chunk;
try {
  const expectedDirectory = resolve(process.argv[2]);
  const expectedScript = resolve(expectedDirectory, "dist/server.js");
  const processes = JSON.parse(input).filter((entry) => entry.name === "sb-backend");
  if (processes.length !== 1) throw new Error("O PM2 precisa ter exatamente um processo chamado sb-backend.");
  const runtime = processes[0].pm2_env;
  if (resolve(runtime.pm_cwd ?? ".") !== expectedDirectory || resolve(runtime.pm_exec_path ?? ".") !== expectedScript) {
    throw new Error(`O sb-backend do PM2 usa pasta ${runtime.pm_cwd} e script ${runtime.pm_exec_path}. Esperado: ${expectedDirectory} / ${expectedScript}.`);
  }
  console.log(`PM2: ${runtime.pm_exec_path}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
