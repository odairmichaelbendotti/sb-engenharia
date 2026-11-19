# Gestão da fiscalização

A seção **Gestão → Fiscalização** (`/fiscalizacao`) reúne o cadastro de pessoas, as designações por contrato e o histórico. Coordenação e Master gerenciam a própria unidade. Admin da Plataforma seleciona uma unidade antes de operar. Os demais perfis continuam consultando os fiscais nas telas que já podem visualizar.

## Operação

- **Fiscais:** cadastrar ou editar nome/posto, e-mail, ramal e situação. O cadastro independe de conta de acesso; o e-mail é único por unidade.
- **Designações:** vincular uma pessoa ativa a um contrato ativo, como fiscal técnico ou administrativo. Uma pessoa pode exercer funções distintas em vários contratos. Encerrar uma designação mantém seu registro e os vínculos históricos.
- **Substituir fiscal:** escolher contrato, função, responsável anterior (ou OS sem responsável), nova designação ativa e OS em andamento. A tela apresenta uma revisão antes da confirmação. Só as OS selecionadas mudam. Para encerrar a designação anterior, substitua antes todas as OS em andamento que ainda a utilizam.
- **Histórico:** consultar autor, data do registro, vigência, justificativa e dados anteriores/novos. Substituições também aparecem na tramitação de cada OS.

Todas as alterações exigem motivo e data de início. A gravação efetiva a mudança imediatamente; datas futuras são rejeitadas, pois não há agendamento. Inativar uma pessoa exige que ela não seja responsável por nenhuma OS em andamento e encerra suas designações ativas. Reativar o cadastro não reabre designações encerradas.

As visualizações do contrato e da OS oferecem **Gerenciar fiscalização**, abrindo a seção com o contrato filtrado. O atalho da OS pré-seleciona esse registro na substituição. O cadastro de contrato deixa de editar fiscais; a seleção inicial na criação de OS usa as designações ativas. Trocas posteriores usam exclusivamente a gestão de fiscalização.

## Documentos e dados existentes

As designações existentes mantêm seus IDs. A migração cria pessoas agrupadas por unidade e e-mail normalizado, sem depender de usuários do sistema. O histórico registra as operações realizadas após a implantação; não inventa autores ou datas de alterações antigas.

Os fiscais da emissão são copiados para `OrdemServico.fiscaisEmissao`. Corrigir contatos ou substituir responsáveis não altera esses dados no PDF da emissão atual. Uma nova emissão/reemissão copia os responsáveis dessa nova emissão. Medições já fechadas continuam usando o registro de fechamento que o sistema já mantém.

Para as OS já emitidas na implantação, a migração utiliza os dados disponíveis no momento em que é executada. Ela não recupera versões antigas de cadastros alterados antes da implantação.

## Implantação

O projeto utiliza migrações manuais no Supabase, conforme `deploy.sh`. **Antes de publicar o backend e o frontend**, executar integralmente:

`backend/prisma/manual-migrations/2026-11-19-fiscalizacao.sql`

O SQL executa em transação, adiciona as estruturas, migra as pessoas e guarda os fiscais dos documentos anteriores. Deve ser aplicado uma vez. O gatilho de `FiscalizacaoHistorico` impede UPDATE e DELETE dos registros da trilha.

Depois, executar os builds e publicar as duas aplicações juntas. Clientes antigos que tentarem editar fiscais pelo cadastro de contratos ou pela edição comum de OS receberão uma mensagem direcionando à nova seção.

### Diagnóstico de versão em execução

`git pull` atualiza os arquivos da VPS, mas o PM2 só passa a usar o novo código após o build e o reinício. O build grava `dist/build-info.json`; o processo carrega esse registro uma vez na inicialização. `/api/health` informa `revision` e `builtAt` além da saúde do banco.

O deploy confere a pasta/script do PM2, compara o commit da API com o commit publicado e testa se `/api/fiscalizacao` chega à autenticação (HTTP 401 em uma requisição sem cookie). Repete a verificação pelo domínio público já configurado em `ALLOWED_PROD_ORIGIN`, para detectar Nginx/Vercel encaminhando para outra API. Um health verde de um processo antigo não é suficiente para concluir o deploy.

Se a listagem retornar `Cannot GET /api/fiscalizacao` ou HTML no lugar de JSON, executar na pasta do projeto na VPS:

```bash
pwd
git log -1 --oneline
grep -n FiscalizacaoRoutes backend/server.ts backend/dist/server.js
pm2 describe sb-backend
```

O código fonte e o compilado precisam registrar a rota. O processo `sb-backend` precisa apontar para `backend/dist/server.js` nessa mesma cópia do projeto. Uma resposta 401 em JSON sem login confirma que a requisição chegou à rota; 404 em HTML indica rota ausente ou encaminhamento incorreto. A verificação completa, após o build/reinício, pode ser executada com:

```bash
node backend/scripts/verify-runtime.mjs http://127.0.0.1:PORTA_DA_API "$(git rev-parse HEAD)"
```

## Validação

```powershell
cd backend
npm.cmd run build
npm.cmd test
# Opcional: executar também a integração completa em um PostgreSQL local de teste.
# O teste cria e exclui um banco temporário próprio; não altera o banco da URL fornecida.
$env:FISCALIZACAO_TEST_DATABASE_URL = 'postgresql://usuario@127.0.0.1:porta/postgres'
npm.cmd test

cd ../frontend
npm.cmd run build
npm.cmd run lint
```

A integração utiliza o esquema anterior em `backend/tests/fixtures/pre-fiscalizacao.sql` para testar a migração real. Cobre isolamento entre unidades, autorização, duplicações, substituição parcial, documentos emitidos, encerramento e histórico imutável.
