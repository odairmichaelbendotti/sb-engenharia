const { join } = require("path");

// Navegador do gerador de PDF baixado dentro do projeto (backend/.cache), e não em ~/.cache:
// hospedagens que publicam só a pasta do app, sem o cache do build, continuam encontrando o Chrome.
// O PDF usa só o chrome-headless-shell; o Chrome completo não é baixado.
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
  chrome: { skipDownload: true },
};
