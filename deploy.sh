#!/usr/bin/env bash
# Deploy da API na VPS: atualiza o código, instala as dependências, confere que o banco
# já tem as migrations manuais, compila, roda os testes, reinicia o processo do pm2
# (ecosystem.config.cjs) e confere a saúde da API.
#
# O banco (Supabase) NÃO é alterado aqui: as migrations ficam em
# backend/prisma/manual-migrations/ e são aplicadas à mão no SQL Editor, ANTES do deploy.
# O site (frontend) roda na Vercel e é publicado sozinho a cada push no main.
#
# Para no primeiro erro (set -e). Até a etapa "Reiniciando", a versão antiga continua no ar.
#
# Uso, na VPS, na pasta do projeto:   ./deploy.sh
set -euo pipefail

APP_NAME="sb-backend"
REQUIRED_ENV=(DATABASE_URL JWT_SECRET PORT NODE_ENV ALLOWED_PROD_ORIGIN)
CHROME_LIBS="libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2"

# Diferenças antigas entre o banco de produção e o schema, conhecidas e inofensivas:
# OrdemServico.empenho_id aceita nulo no banco e OrdemServicoEmpenho.id tem default no banco
KNOWN_SCHEMA_DRIFT='"empenho_id" SET NOT NULL|"OrdemServicoEmpenho" ALTER COLUMN "id" DROP DEFAULT'

step() { echo; echo "==> $*"; }
fail() { echo "    ERRO: $*" >&2; exit 1; }

# Lê uma variável do backend/.env sem executar o arquivo
env_value() {
  grep -E "^$1=" backend/.env | tail -1 | cut -d= -f2- | tr -d '\r"' || true
}

# Tudo dentro de main: o bash lê a função inteira antes de rodar, então o git pull
# pode atualizar este próprio arquivo sem atrapalhar a execução em andamento
main() {
  cd "$(dirname "$0")"

  step "Conferindo ferramentas"
  command -v git >/dev/null || fail "git não encontrado"
  command -v pm2 >/dev/null || fail "pm2 não encontrado (instale com: npm install -g pm2)"
  # Prisma 7 exige Node 20.19 ou mais novo
  node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=19)?0:1)' \
    || fail "Node $(node -v) é antigo: o Prisma 7 precisa do Node 20.19 ou mais novo"
  echo "    Node $(node -v), pm2 $(pm2 -v)"

  step "Atualizando o código"
  local previous
  previous=$(git rev-parse --short HEAD)
  git pull --ff-only
  echo "    $previous -> $(git rev-parse --short HEAD)"

  step "Conferindo o backend/.env"
  [ -f backend/.env ] || fail "backend/.env não existe"
  local name
  for name in "${REQUIRED_ENV[@]}"; do
    [ -n "$(env_value "$name")" ] || fail "falta $name no backend/.env"
  done
  [ "$(env_value NODE_ENV)" = "production" ] \
    || fail "NODE_ENV no backend/.env é '$(env_value NODE_ENV)'; em produção precisa ser 'production' (CORS e cookie dependem disso)"
  echo "    ok"

  cd backend

  step "Instalando dependências (inclui o Chrome do PDF)"
  # --include=dev: prisma e typescript são devDependencies e o build precisa deles
  npm ci --include=dev

  step "Conferindo as bibliotecas do Chrome (só o PDF depende delas)"
  if [ -n "$(cd .. && env_value PUPPETEER_EXECUTABLE_PATH)" ]; then
    echo "    usando o Chromium de PUPPETEER_EXECUTABLE_PATH"
  else
    local chrome
    chrome=$(find .cache/puppeteer -type f -name chrome-headless-shell 2>/dev/null | head -1)
    if [ -z "$chrome" ]; then
      echo "    AVISO: o Chrome do puppeteer não foi baixado; o PDF da OS vai falhar"
    elif ldd "$chrome" | grep -q "not found"; then
      echo "    AVISO: faltam bibliotecas do sistema; o PDF da OS vai falhar. Faltando:"
      ldd "$chrome" | grep "not found" | awk '{print "      " $1}'
      echo "    Instale com:"
      echo "      apt-get update && apt-get install -y $CHROME_LIBS"
      echo "      apt-get install -y libasound2t64 || apt-get install -y libasound2"
      echo "    e depois: pm2 restart $APP_NAME"
    else
      echo "    ok"
    fi
  fi

  step "Conferindo o banco (só leitura): as migrations manuais já foram aplicadas?"
  local diff pending
  diff=$(npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script 2>/dev/null) \
    || fail "não consegui ler o banco do DATABASE_URL (conexão ou senha?)"
  pending=$(echo "$diff" | grep -vE '^\s*$|^--' | grep -vE "$KNOWN_SCHEMA_DRIFT" || true)
  if [ -n "$pending" ]; then
    echo "    O banco não tem tudo o que o código novo precisa. Falta aplicar no Supabase:"
    echo "$pending" | sed 's/^/      /'
    echo "    Aplique a migration correspondente de prisma/manual-migrations/ no SQL Editor"
    echo "    (com backup) e rode o deploy de novo. A versão antiga continua no ar."
    exit 1
  fi
  echo "    ok"

  step "Compilando (prisma generate + tsc)"
  npm run build

  step "Rodando os testes"
  npm test

  cd ..

  step "Reiniciando a API"
  local port
  port=$(env_value PORT)
  # Primeira vez com este script: se a API antiga roda fora deste pm2 (outro nome, serviço,
  # container), iniciar outra na mesma porta daria conflito. Para antes disso.
  if ! pm2 describe "$APP_NAME" >/dev/null 2>&1 && curl -s -o /dev/null "http://127.0.0.1:$port/"; then
    echo "    A porta $port já está em uso por um processo que não é o '$APP_NAME' do pm2."
    echo "    Pare a API antiga (ex.: pm2 delete <nome>, systemctl stop <serviço> ou docker stop <container>)"
    echo "    e rode ./deploy.sh de novo. O código novo já está compilado."
    exit 1
  fi
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save >/dev/null

  step "Conferindo a saúde da API e do banco"
  local _
  for _ in $(seq 1 15); do
    if curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
      echo "    API no ar e banco respondendo"
      pm2 list
      echo
      echo "Deploy concluído ($previous -> $(git rev-parse --short HEAD))."
      echo "Teste no site: Contratos, Ordens de Serviço, Obras e o PDF de uma OS."
      exit 0
    fi
    sleep 2
  done
  echo "    A API não respondeu em /api/health. Veja: pm2 logs $APP_NAME --lines 50"
  echo "    Para voltar à versão anterior:"
  echo "      git checkout $previous && (cd backend && npm ci --include=dev && npm run build) && pm2 reload $APP_NAME"
  exit 1
}

main "$@"
