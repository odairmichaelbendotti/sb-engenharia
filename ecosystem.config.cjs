// Processo da API na VPS, gerenciado pelo pm2. O deploy.sh inicia/recarrega por este arquivo.
// As variáveis vêm do backend/.env (carregado pelo dotenv no próprio código).
module.exports = {
  apps: [
    {
      name: "sb-backend",
      cwd: `${__dirname}/backend`,
      script: "dist/server.js",
      // Uma instância só: o gerador de PDF mantém um Chrome aberto por processo
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "800M",
      time: true,
    },
  ],
};
