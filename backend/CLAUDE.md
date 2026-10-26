# Backend — SB Engenharia

API REST para gestão de engenharia de uma organização militar (obras, empenhos orçamentários, notas fiscais/invoices, empresas contratadas), com suporte multi-tenant. Node.js + Express + TypeScript + Prisma 7 + PostgreSQL (Supabase).

## Stack

- **Runtime**: Node.js, ESM puro (`"type": "module"` no `package.json` — todo import usa extensão `.js`, mesmo em arquivos `.ts`)
- **Framework HTTP**: Express 5
- **Linguagem**: TypeScript, `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — typecheck rigoroso
- **ORM**: Prisma 7 (`provider = "prisma-client"`, não o legado `prisma-client-js`), com driver adapter `@prisma/adapter-pg`
- **Banco**: PostgreSQL, hospedado no Supabase
- **Auth**: JWT (`jsonwebtoken`) em cookie httpOnly + `bcrypt` para hash de senha
- **Dev**: `tsx --watch` (sem nodemon)

Não há: testes, ESLint/Prettier configurados, CI/CD, container de injeção de dependência, logger dedicado, rate limiting, helmet.

## Scripts

```bash
npm run dev     # tsx --env-file=.env --watch ./server.ts — modo de desenvolvimento real, usado no dia a dia
npm run build   # prisma generate && tsc — compila sem erros (conferido em 2026-10-22)
npm run start   # node --env-file=./env ./dist/server.js — CUIDADO: aponta para "./env", não "./.env" (bug de digitação). Em produção quem sobe a API é o pm2 (ecosystem.config.cjs na raiz), não este script
npm test        # vitest run — testes das funções puras (normalização, documento da OS)
```

## Arquitetura

Clean Architecture em 4 camadas, sob `src/`:

```
domain/           — regras de negócio puras, sem dependência de framework/infra
  entities/       — Tenant, User, Company, Empenho, Invoice
  repositories/   — interfaces (IUserRepository, ICompanyRepository, IEmpenhoRepository, IInvoiceRepository, ITenantRepository)
  errors/         — DomainError (única classe de erro usada de fato)
  polices/        — AdminPolicy (nome de pasta com typo real: "polices", não "policies")
  cryptography/   — interfaces HashGenerator, HashComparer, TokenGenerator, TokenValidator

application/
  usecases/       — organizados por domínio: company/, empenho/, invoice/, tenant/, user/

infrastructure/
  database/prisma/  — implementações Prisma de cada repository
  cryptography/      — HashGenerator (bcrypt), TokenGenerator (jsonwebtoken) — cada um implementa duas interfaces de domínio simultaneamente
  errors/            — InfrastructureError (definida, mas NUNCA lançada — todo erro de infra vira DomainError)
  prisma/            — client singleton (prisma.ts)

http/
  controllers/    — um por domínio (Company, Empenho, Invoice, Tenant, User)
  routes/         — um arquivo por domínio, monta manualmente repository → usecase → controller → middleware
  middleware/      — AuthMiddleware, RequiredRoles
```

### Injeção de dependência

**Manual, sem container.** Cada arquivo em `http/routes/` instancia diretamente `PrismaXRepository`, injeta no(s) use case(s), injeta nos controllers, e monta o `AuthMiddleware` com seu próprio `TokenGenerator` + `PrismaUserRepository`. Não há factory nem singleton compartilhado entre arquivos de rota — isso significa que `PrismaUserRepository`/`TokenGenerator` são reinstanciados de forma idêntica em `CompanyRoutes.ts`, `EmpenhoRoutes.ts`, `InvoiceRoutes.ts` só para montar o middleware. É duplicação notável, mas é o padrão consistente hoje — **replicar esse padrão em rotas novas**, não introduzir um container de DI isoladamente.

Exemplo (`EmpenhoRoutes.ts`):
```ts
const repository = new PrismaEmpenhoRepository();
const createEmpenhoUseCase = new CreateEmpenhoUseCase(repository);
const listEmpenhosUseCase = new ListEmpenhosUseCase(repository);
// ...
const empenhoController = new EmpenhoController(createEmpenhoUseCase, listEmpenhosUseCase, /* ... */);
const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);
```

### Fluxo de erro (convenção estabelecida — seguir sempre)

1. Repository captura exceção do Prisma em `try/catch` e relança **sempre `DomainError`**, nunca `Error` genérico nem `InfrastructureError`.
2. Use case valida regra de negócio e lança `DomainError` com mensagem descritiva quando a regra falha (ex.: `"CNPJ already exists"`, `"You are not authorized to create an empenho"`).
3. Controller **sempre** envolve a chamada ao use case em `try/catch` completo:
   - `error instanceof DomainError` → responde com `400` (ou `409` em signup/signin) e `{ message: error.message }`.
   - qualquer outro erro → responde `500` com `{ message: "Internal server error" }`.
4. **Nenhum controller deixa a requisição pendurada** — todo caminho termina em uma resposta HTTP. Isso já causou bugs reais no passado (timeout no frontend) quando um `catch` não cobria todos os casos — sempre confira que o catch tem um branch para "não é DomainError".

Inconsistência conhecida (não é convenção, é ruído): algumas mensagens de erro estão em português (`"Erro ao criar nota fiscal"` em `PrismaInvoiceRepository.ts`, remanescente do rename `NotaFiscal`→`Invoice`), a maioria em inglês. Não propagar mais mensagens em português — escrever novas em inglês.

### Convenções de código

- **Use cases com 2+ parâmetros recebem um único objeto**, nunca posicionais (isso já causou um bug real de troca de argumentos silenciosa em `SignInUseCase`, corrigido). Use cases com 0-1 parâmetro simples (`delete(id)`) não precisam de objeto.
- Domain entities validam invariantes básicas no construtor (ex.: `User` valida formato de e-mail, `Empenho`/`Invoice` validam `value > 0`) e lançam `DomainError` se violadas.
- Toda entidade tem um `XType` (dados de entrada) e, quando necessário para responder à API, um `PersistedX` (dados + `id`/`createdAt`/`updatedAt`).
- Autorização por role é feita em **dois middlewares com propósitos diferentes, não um substitui o outro** (desde a mudança para RBAC por domínio de 2026-07-15, ver seção própria abaixo):
  - **`RequireDomainAccess` middleware** (`http/middleware/RequireDomainAccess.ts`), montado igual ao `AuthMiddleware` (instanciado por arquivo de rota, sem container) e encadeado **depois** de `authMiddleware.handle`: `requireDomainAccess.handle("administrativo", "edit")` ou `handle("administrativo", "view")`. Delega pra `DomainAccessPolicy` (`domain/polices/DomainAccessPolicy.ts`) a matriz role×domínio×ação. É a forma padrão para rotas de recurso de negócio (Company/Empenho/Invoice hoje, domínio `administrativo`) — usado em **todos** os métodos, inclusive os GETs de listagem (`GET /company/list`, `/empenho/list`, `/invoices/list`), que antes só tinham `AuthMiddleware` sem checagem nenhuma de role.
  - **`RequiredRoles` middleware** (`http/middleware/RequiredRoles.ts`) continua existindo para checagens que **não são de domínio de negócio** — hoje só `TenantRoutes.ts` (`requiredRoles.handle("PLATFORM_ADMIN")` em `create`/`get-all`). Mesmo padrão de montagem manual do `RequireDomainAccess`. **`handle()` precisa terminar com `next()` no branch de sucesso** — sem isso a requisição fica pendurada sem resposta (bug real já corrigido antes); ao copiar qualquer um dos dois middlewares como modelo, não esquecer o `next()`.
  - `AdminPolicy` (`isAdmin(user)` — tudo que não é `"USER"` conta como admin) **foi removida** — os use cases de `empenho/` (`CreateEmpenhoUseCase`, `UpdateEmpenhoUseCase`, `UpdateEmpenhoStatusUseCase`, `DeleteEmpenhoUseCase`) agora chamam `new DomainAccessPolicy().can(user.role, "administrativo", "edit")` diretamente, ainda como checagem redundante com o `RequireDomainAccess` da rota (o use case nunca é chamado por um role fora do que o middleware já filtrou), mas mantida como última barreira caso a rota mude no futuro — mesmo racional que já existia com `AdminPolicy`.

### Padronização de textos (2026-09-29)

Todo use case de criação/edição chama `normalizeInput(dados, X_RULES)` (`domain/normalization/input-rules.ts`) **antes** de validar, buscar duplicados e gravar. Regras: códigos (nº de OS/NF, identificador, patrimônio, apelido) em maiúsculas; nº do empenho sem espaços; razão social em maiúsculas; nomes de pessoas e cidades com inicial maiúscula; CNPJ/CEP/telefone só dígitos; e-mail minúsculo; texto livre só limpo, virando frase normal quando vem todo em maiúsculas (siglas em `acronyms.ts` são preservadas). Campo de texto novo → incluir na regra da entidade. Testes: `npm test` (Vitest, só para as funções puras). O frontend tem uma cópia em `frontend/src/utils/normalization/` para padronizar ao sair do campo — mudou aqui, copiar lá. As buscas de duplicado e o login comparam sem diferenciar maiúsculas (`mode: "insensitive"`), porque dados antigos podem estar fora do padrão.

### OS com vários empenhos (2026-09-29)

Uma `OrdemServico` pode receber vários empenhos do **mesmo contrato**, pela tabela `OrdemServicoEmpenho` (OS × empenho × `valor` destinado, centavos). Por padrão o empenho vai inteiro para a OS; ainda pode ser dividido entre OS (manutenções). `OrdemServico.valor` = soma dos vínculos, mantida pelo repository na mesma transação. `OrdemServico.empenho_id` continua obrigatório e é o **empenho principal** (o vínculo mais antigo): é por ele que se chega ao contrato, à empresa e à cor no mapa — não usar para somar valores. Saldo livre do empenho = `value` − vínculos de OS não canceladas (`getSaldoDisponivel`). Empenho só sai da OS se nenhuma NF dessa OS foi lançada nele. A NF exige obra/OS quando o empenho financia alguma obra (`InvoiceScopeValidator.resolveObra`). SQL: `prisma/manual-migrations/2026-09-29-ordem-servico-empenhos.sql` — **aplicar antes do deploy do código**. A API de criar/editar OS aceita `empenhos: [{ empenho_id, valor }]` e ainda o formato antigo (`empenho_id` + `valor`).

### Obra com várias OS e cronograma na OS (2026-10-01)

Uma `Obra` pode ter várias `OrdemServico` (ex.: faltou um serviço → nova OS na mesma obra). O vínculo é `OrdemServico.obra_id` (N OS : 1 obra; excluir a obra devolve as OS para "sem obra"); `Obra.ordemServico_id` deixou de existir. **O cronograma é da OS** (`OrdemServico.dataInicio`/`dataPrevisaoTermino`, obrigatórios ao criar/editar OS); a obra guarda só `dataConclusao`. Na API, o prazo da obra (`dataInicio`/`dataPrevisaoTermino`), o orçamento (`valor`) e o contrato (cor no mapa, da OS mais antiga) são **derivados das OS não canceladas** em `PrismaObraRepository`. A NF indica a OS (`Invoice.ordemServico_id`) e é por ela que se mede o executado de cada OS; `Invoice.obra_id` continua e acompanha a OS se ela mudar de obra. Regras: obra sempre com ao menos uma OS; OS com NF não sai da obra (`ObraOrdensServicoValidator`, `OrdemServicoObraValidator`). O vínculo pode ser feito pelos dois lados: `ordemServico_ids` no create/update de obra e `obra_id` no create/update de OS (`GET /obra/list-for-ordem-servico` alimenta o campo). `GET /invoices/list` devolve cada nota com a origem (`empenho {id, numero, contrato {id, identificador}}`, `ordemServico`, `obra`), ordenada por vencimento decrescente (`InvoiceListItem`). SQL: `prisma/manual-migrations/2026-10-01-obra-multiplas-os.sql` — copia vínculo/datas da obra para a OS e as NFs para a OS, depois **remove colunas da `Obra`**; aplicar junto com o deploy do backend, com backup.

### Saldo por empenho na OS (2026-10-08)

Na listagem (e no retorno de create/update) de OS, cada vínculo de `empenhos` vem como `OrdemServicoVinculoFinanceiro`: `liquidado` (notas não canceladas da OS lançadas naquele empenho) e `empenhoComprometido` (soma do destinado a OS não canceladas do empenho, para o saldo livre). Calculado em `loadVinculoTotals` (`PrismaOrdemServicoRepository`), sem SQL novo.

### Documento da OS em PDF (2026-10-21)

`GET /ordem-servico/proximo-numero?lote_id=&ano=` (capability `createOrdemServico`) devolve o próximo número da sequência sem reservá-lo (`getProximoNumero` no repository, que usa o mesmo `gerarNumero` da criação); o formulário de OS o mostra ao escolher contrato e lote. `backend/prisma/seed-local.ts` popula um banco **local** com dados fictícios (só roda em `localhost`; logins no cabeçalho do arquivo).

`GET /ordem-servico/document/:id` devolve a OS preenchida em PDF (mesmo acesso da listagem; EMPRESA só as OS dos próprios contratos). Corpo da OS do modelo `planejamento/modelo-ordem-de-servico.pdf` (págs. 1-5); os anexos entram só como lista. Fluxo: `PrismaOrdemServicoRepository.getDocumentData` → `buildOrdemServicoDocumentModel` (`domain/documents/ordem-servico-document.ts`, função pura e testada: valores, datas, extenso, marcações) → `PuppeteerOrdemServicoGenerator` (`infrastructure/pdf/`). O documento é um template HTML/CSS (`ordem-servico-html.ts`: timbre centralizado, quadro-resumo com prazo/valor/cronograma, seções numeradas, texto justificado, grifo em prazos e datas; visual monocromático, sem recuo de parágrafo — pedido do usuário) impresso em A4 pelo Chrome headless do `puppeteer` 24 (um navegador por processo, aberto no primeiro PDF e reaberto se cair; uma aba por PDF, com a rede bloqueada). O `puppeteer` é importado só no primeiro PDF: se ele ou o Chrome faltarem no servidor, só `GET /ordem-servico/document/:id` responde 500 (o motivo vai para o `console.error`), o resto da API segue normal — testado. Fontes Source Serif 4 + Inter vêm dos pacotes `@fontsource/*` e são embutidas em base64 (`fonts.ts`), assim como o brasão (`brasao.ts`): o PDF não depende de fontes do servidor. Rodapé com nº da OS e "Página X de Y" pelo `footerTemplate`. Valor vazio (OS antiga) sai como linha pontilhada. Textos fixos (cabeçalho BAFL, seções 2 e 5, anexos) ficam no template. **Deploy do PDF**:
- `puppeteer` 24 roda em Node ≥ 18 (o 25 exige Node ≥ 22.12; não atualizar sem conferir o Node do servidor).
- O `npm install` (com scripts; não usar `--ignore-scripts`) baixa só o `chrome-headless-shell` para `backend/.cache/puppeteer` (`.puppeteerrc.cjs`, pasta no `.gitignore`), dentro do projeto, para hospedagens que não levam o `~/.cache` do build para a execução.
- Linux: o Chrome precisa das bibliotecas de sistema (Debian/Ubuntu: `apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2`; o pacote de áudio é `libasound2t64` no Ubuntu 24.04 e `libasound2` antes dele — instalar à parte). Na VPS de produção (2026-10-22) faltava `libnspr4.so`: o PDF dava 500 com "Failed to launch the browser process ... Code: 127". O gerador já passa `--disable-dev-shm-usage` e, rodando como root (Docker), `--no-sandbox`.
- Alternativa: Chromium do sistema via `PUPPETEER_EXECUTABLE_PATH` (aí o gerador usa o headless novo); com `PUPPETEER_SKIP_DOWNLOAD=true` o `npm install` não baixa nada.
- Conta ~150–250 MB de RAM com o Chrome aberto.
- Depois do deploy, baixar o PDF de uma OS; se der 500, o log do servidor mostra "Failed to render the ordem de serviço PDF" com o motivo.

Dados que alimentam o documento: **Contrato** (`ePag`, `etp`, `termoReferencia`, `dataBaseSinapi`, `endereco`, `bdi`, mais `Lote` [número, nome, desconto] opcionais e `FiscalContrato` [técnico/administrativo, vários]), **Obra** (`idPatrimonialCompleto`, `apelido`, `areaConstruida`, `estadoConservacao`, todos opcionais) e **OS** (`lote_id`, `setorRequisitante`, `urgencia`, `dataVistoria`, `descricaoProblema`, `dataEmissao`, `prazoMobilizacaoDias` [7], `prazoDias`, `totalComBdi`, `fiscalSetorial`, `fiscalTecnico_id`, `fiscalAdministrativo_id`, `condicoesEspeciais`). Contratos antigos ficam com o texto "A PREENCHER" (e BDI 21,19); OS e obras antigas ficam com nulo e o PDF sai com esses campos em branco.

Regras: o número da OS é **gerado** na criação (`OS 010/BAFL/2026-L4`; sequência por nº de lote e ano começando em 10, sem lote `OS 010/BAFL/2026`; `BAFL` vem de `Tenant.apelido`); o número de OS antiga (sequência nula) ainda pode ser corrigido na edição. O usuário informa `prazoDias` e o término é calculado (`calcularTermino`: o dia de início conta como o primeiro). O usuário informa `totalComBdi`; o PDF mostra total sem BDI = total com BDI ÷ (1 + BDI) e final = total com BDI × (1 − desconto do lote), então pode diferir em alguns reais da planilha SINAPI (arredondamento item a item) — `OrdemServico.valor` continua sendo a soma dos empenhos, ajustável. Lote de OS emitida não muda e lote com OS não é removido; o contrato com lotes exige lote na OS e sem lotes não aceita. Fiscais da OS precisam ser do contrato; fiscal removido do contrato solta a OS (`SetNull`). Na criação todos os campos do documento são obrigatórios (`OrdemServicoDocumentValidator`); na edição podem ficar vazios. SQL: `prisma/manual-migrations/2026-10-21-os-documento.sql` — **só acrescenta; aplicar antes do deploy do código** (validada contra o schema com `prisma migrate diff`, que deu vazio).

### Ciência e contestação da OS pela empresa (2026-10-23)

Decisões do usuário: **48 h corridas** contadas da emissão no servidor; acatar um apontamento só registra a decisão e libera o ajuste (a fiscalização edita a OS e a edição a **reemite**); a fase não bloqueia nada além da trava da empresa; respondem pela fiscalização MASTER, COORDENACAO, ADMINISTRATIVO e ENGENHARIA (capability `tramitarOrdemServico`); a empresa (capability `darCienciaOrdemServico`, só EMPRESA) dá ciência, aponta e comenta. A trava vale para a empresa toda (basta um usuário dela dar ciência de cada OS).

- **Regras puras** em `domain/tramitacao/ciencia.ts` (testadas em `ciencia.test.ts`): prazo, fase (`DISPENSADA`, `AGUARDANDO_CIENCIA`, `CIENCIA_VENCIDA`, `EM_CONTESTACAO`, `EFETIVADA` — calculada, não gravada), janela de apontamento (até o fim do prazo da emissão atual, tendo dado ciência ou não), janela de comentário da empresa (no prazo ou com apontamento aberto) e `houveMudancaNoConteudo` (o que reemite). O frontend espelha em `pages/OrdemServico/ordem-servico-ciencia.ts`.
- **OS**: `emitidaEm`/`cienciaPrazoAte` (servidor), `cienciaDispensada` (true nas OS anteriores; `emitidaEm` nulo também conta como dispensada, para OS gravadas pelo código antigo), `visualizadaEm` (primeira abertura pela empresa via `GET /ordem-servico/:id/tramitacao`), `cienteEm`/`cienteUser_id`/`cienteNome`, `prazoVencidoEm` (marca que o vencimento já virou evento). A listagem de OS traz esses campos + `contestacoesAbertas`.
- **Histórico** `OrdemServicoEvento`: só inserção (`inserirEvento` em `tramitacao-tx.ts`); autor copiado (nome, perfil, empresa). Gatilho no banco barra UPDATE e DELETE direto; só some em cascata com a OS. `PRAZO_VENCIDO` é gravado uma vez, na primeira leitura depois do prazo (pendências, trava, histórico, ciência), **com a hora do próprio vencimento**.
- **Contestação** `OrdemServicoContestacao`: decisão única (`updateMany` com `status: ABERTA`; gatilho barra mudar texto/autor ou decidir de novo). Resposta obrigatória.
- **Notificação** `Notificacao` (destino `EMPRESA` + `company_id`, ou `FISCALIZACAO` da organização) + `NotificacaoLeitura` por usuário. Criadas na mesma transação do fato: emissão/reemissão → empresa; ciência, apontamento, vencimento → fiscalização; comentário → o outro lado; decisão → empresa.
- **Criação** grava a emissão e o evento `EMITIDA` (`registrarEmissao`, dentro da transação do `create`). **Edição** de OS ativa com tramitação que mude o conteúdo grava `REEMITIDA`, zera ciência/visualização/vencimento e abre novo prazo. Mudança de status vira `STATUS_ALTERADO`. **Exclusão** é barrada depois que a empresa abriu, deu ciência, apontou ou comentou (`hasInteracaoEmpresa`): cancelar em vez de excluir.
- **Trava** `RequireCienciaEmDia` (depois do `authMiddleware`) em `GET /ordem-servico/list`, `GET /obra/list` e `GET /obra/detail/:id`: EMPRESA com OS ativa de prazo vencido sem ciência recebe `403 { code: "CIENCIA_PENDENTE" }`. As rotas de `OrdemServicoTramitacaoRoutes.ts` ficam fora da trava: `GET /ordem-servico/pendencias-ciencia`, `GET /ordem-servico/:id/tramitacao`, `POST /ordem-servico/:id/ciencia`, `POST /ordem-servico/:id/contestacoes`, `POST /ordem-servico/:id/comentarios`, `PUT /ordem-servico/contestacoes/:id/resposta`, `GET /notificacoes`, `PUT /notificacoes/:id/lida`, `PUT /notificacoes/lidas`. O PDF (`/ordem-servico/document/:id`) também fica livre, para a empresa ler a OS antes de dar ciência. Rota nova acessível à EMPRESA que mostre dados → encadear `requireCienciaEmDia.handle`.
- SQL: `prisma/manual-migrations/2026-10-23-os-ciencia-empresa.sql` — só acrescenta (e marca as OS existentes como dispensadas); **aplicar antes do deploy do código**.

### Orçamento e medições da OS (2026-10-24)

Decisões do usuário: o orçamento é **opcional** e lançado depois da OS; o preço unitário já inclui **BDI e desconto do lote**; a soma dos itens é comparada ao valor final da OS (`totalComBdi × (1 − desconto do lote)`, ou `valor` na OS antiga) só com aviso; medição **RASCUNHO → FECHADA** (rascunho não entra no acumulado, fechada fica travada, só a última fechada reabre, um rascunho por OS); lançam ENGENHARIA, COORDENACAO e MASTER (domínio `engenharia` / `edit`), a EMPRESA vê o orçamento e só as medições **fechadas** das próprias OS e baixa o PDF; escrita só com a OS `ATIVO`.

- **Modelos**: `OrdemServicoItem` (planilha: `ordem`, `codigo?`, `descricao`, `unidade`, `quantidade`, `precoUnitario`), `Medicao` (`numero` por OS, período em data pura, autores copiados, `planilhaFechamento` JSON) e `MedicaoItem` (só linhas com quantidade > 0). **Quantidade em milésimos (`Int`)**, como o dinheiro em centavos: a comparação medido = orçado é exata. A API fala em decimais e reais; o repository devolve unidades internas e a conversão fica no presenter (`application/usecases/medicao/medicao-presenter.ts`).
- **Regras puras** em `domain/medicao/medicao-calc.ts` (testadas): `valorItem` (milésimos × centavos em BigInt, meio para cima), panorama, linhas da medição (valor da medição = valor do acumulado depois − antes, então a soma das medições bate centavo a centavo com o orçado), `validateMedicaoQuantidades` (não passa do saldo = orçado − fechadas) e `validateOrcamentoChange` (item com quantidade fechada não sai, não fica abaixo do medido e não muda preço nem unidade; o rascunho é revalidado ao fechar). `planilha-medicao.ts` monta/lê o snapshot.
- **Concorrência**: toda escrita do `PrismaMedicaoRepository` faz `SELECT ... FOR UPDATE` na OS e roda o validador puro de novo dentro da transação. O número do rascunho é `max + 1` e o `@@unique([ordemServico_id, numero])` impede dois rascunhos (P2002 vira mensagem). Não usar índice parcial: o Prisma não o representa e o `deploy.sh` barraria pelo diff.
- **Snapshot**: ao fechar, `planilhaFechamento` guarda itens, quantidades anterior/esta e fiscais; a tela e o PDF da fechada saem dele (reimpressão igual à assinada mesmo que o orçamento mude). Reabrir limpa.
- **Rotas** (`MedicaoRoutes.ts`): `GET/PUT /ordem-servico/:id/orcamento`, `POST /medicao/create`, `GET/PUT/DELETE /medicao/:id`, `POST /medicao/:id/fechar`, `POST /medicao/:id/reabrir`, `GET /medicao/:id/document`. GETs com `engenharia/view` + `requireCienciaEmDia`; escritas com `engenharia/edit` (o use case confere de novo, mais tenant e OS ativa). O GET do orçamento devolve `permissoes` e `motivo` (`SEM_PERMISSAO`, `OS_INATIVA`, `SEM_ORCAMENTO`, `RASCUNHO_ABERTO`, `SEM_SALDO`) para a tela.
- **Tela de medições (2026-10-26)**: `GET /medicao/painel` (`engenharia/view` + `requireCienciaEmDia`; registrada antes de `/medicao/:id`; desde 2026-10-27 a EMPRESA também consulta: só as OS dos próprios contratos, pelo empenho principal, e o resumo ignora o rascunho) lista as OS do tenant (todas para PLATFORM_ADMIN) com obra, contrato, empresa, empenhos, valor da OS, itens, orçado, medido (fechadas), rascunho, última fechada, divergência e `podeEditar`. Os totais saem de `resumirPlanilha` (`domain/medicao/medicao-resumo.ts`, testado), que também usa `somarQuantidades` (compartilhado com o panorama e o repository); `getPlanilhas(ids)` carrega várias planilhas em duas consultas. O GET do orçamento passou a devolver em `ordemServico` a obra, o contrato, a empresa e o prazo. `GET /obra/detail/:id` devolve `execucaoFisica` (`{ valorOrcado, valorMedido }` das OS não canceladas com orçamento, ou null), visível também para a empresa.
- **Total ajustado do item (2026-10-27)**: a planilha de referência às vezes chega a outro total (TRUNCAR, preço com casas escondidas). `OrdemServicoItem.valorTotal` (centavos, nulo = quantidade × preço; a API grava nulo quando o enviado é igual ao calculado) guarda o total digitado. `valorOrcadoItem` = ajustado ?? calculado; `valorAcumuladoItem` = parcial pelo preço limitado ao total, item medido por inteiro = o total. Com isso a última medição absorve os centavos e a soma das medições bate com o total ajustado. Panorama, linhas da medição, resumo e snapshot (`valorTotal` opcional por item; snapshot antigo sem ele = calculado) usam essas duas funções, nunca `valorItem` direto. Regras em `validateOrcamentoChange`: diferença limitada a `folgaValorTotal` (meio centavo por unidade + 1 centavo, barra erro de digitação), e em item medido o ajuste não pode mudar o valor já medido (na prática, trava o total do item medido por inteiro). SQL: `prisma/manual-migrations/2026-10-27-orcamento-total-ajustado.sql`: só acrescenta a coluna; **aplicar antes do deploy do código** (aplicada no `sb_eng_local`, diff vazio, teste ponta a ponta pela API ok).
- **Excluir medição fechada (2026-10-27)**: `DELETE /medicao/:id` aceita o rascunho e a **última** fechada da OS, sem rascunho aberto (as mesmas condições do reabrir, em `assertUltimaFechada`; decisão do usuário: as seguintes, já assinadas, nunca mudam). Na mesma transação, a fechada volta a rascunho (o gatilho barra o DELETE da fechada, mas aceita essa volta) e é apagada. As quantidades voltam ao saldo sozinhas, porque o medido é a soma das fechadas. `podeReabrir` do GET do orçamento vale para as duas ações.
- **Exclusão de OS** passa a ser barrada se houver medição fechada (`DeleteOrdemServicoUseCase`).
- **PDF** (boletim de medição, A4 paisagem): `buildMedicaoDocumentModel` (`domain/documents/medicao-document.ts`, testado) → `PuppeteerMedicaoGenerator` + `medicao-html.ts`. O Chrome passou a ser compartilhado em `infrastructure/pdf/chrome.ts` (`renderPdf`) e o timbre/`escapeHtml` em `document-base-html.ts`; o HTML do PDF da OS saiu idêntico byte a byte depois da extração. Rascunho sai com marca d'água; cabeçalho da planilha repete a cada página.
- **Banco**: gatilhos barram alterar/excluir medição fechada e as linhas dela (só a volta para rascunho é aceita) e excluir item com quantidade em medição fechada; tudo sai em cascata com a OS. A FK `MedicaoItem.item_id` é **CASCADE** de propósito: com NO ACTION/RESTRICT a exclusão da OS falhava (a checagem roda antes de a cascata apagar as linhas). SQL: `prisma/manual-migrations/2026-10-24-orcamento-medicoes.sql` — **só acrescenta; aplicar antes do deploy do código** (aplicada e conferida só no `sb_eng_local`, diff vazio).

## Deploy na VPS (`deploy.sh`, 2026-10-22)

Arquitetura de produção: banco no **Supabase** (projeto `wlznzjzhxukhhcomijpu`), API na **VPS** `74.50.67.174` gerenciada pelo **pm2** (processo `sb-backend`, definido em `ecosystem.config.cjs` na raiz: `cwd` = `backend`, `dist/server.js`, uma instância só por causa do Chrome do PDF; as variáveis vêm do `backend/.env` via `dotenv`), frontend na **Vercel** (publica sozinho a cada push no `main`; o `vercel.json` repassa `/api` para a VPS).

Ordem de um deploy: (1) backup e migration de `prisma/manual-migrations/` no SQL Editor do Supabase, se houver; (2) `git push` do `main` (Vercel); (3) na VPS, na pasta do projeto, `./deploy.sh`.

O `deploy.sh` (raiz do repo, executável, LF garantido pelo `.gitattributes`) para no primeiro erro e, até reiniciar, deixa a versão antiga no ar:
1. confere git, pm2 e Node ≥ 20.19 (exigência do Prisma 7);
2. `git pull --ff-only`;
3. confere o `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV=production`, `ALLOWED_PROD_ORIGIN`);
4. `npm ci --include=dev` (prisma/typescript são devDependencies; sem `--ignore-scripts`, para baixar o Chrome do PDF);
5. avisa (sem parar) se faltam bibliotecas de sistema do Chrome (`ldd`);
6. **confere o banco só com leitura** (`prisma migrate diff` banco × `schema.prisma`): se faltar coluna/tabela, mostra o SQL faltante e para, pedindo a migration manual. Ignora os dois desvios antigos e inofensivos da produção (`OrdemServico.empenho_id` nulável no banco; default em `OrdemServicoEmpenho.id`) — testado: passa no banco em dia e barra (52 linhas) o backup da produção de antes da migration 2026-10-21;
7. `npm run build` e `npm test`;
8. `pm2 startOrReload ecosystem.config.cjs` + `pm2 save`. Na primeira vez, se a porta já estiver ocupada por uma API fora deste pm2 (outro nome, systemd, Docker), para e pede para desligar a antiga;
9. espera `GET /api/health` responder (rota `HealthRoutes.ts`, sem autenticação: 200 só se o banco responder `SELECT 1`, senão 503) e mostra como voltar ao commit anterior se não responder.

O script nunca altera o banco. Ao criar uma migration manual nova, aplicá-la no Supabase antes do deploy — o passo 6 barra o deploy se ela faltar.

## Cor do contrato (paleta de 2026-10-26)

`Contrato.cor` é atribuída na criação por rodízio (`CONTRATO_COLOR_PALETTE` em `PrismaContratoRepository`, posição = quantidade de contratos do tenant): oito tons discretos de mesma luminosidade da paleta "Grafite e sinal" do frontend (default da coluna `#4f759c`). Não é editável. SQL: `prisma/manual-migrations/2026-10-26-paleta-contratos.sql` — **altera** a cor de todos os contratos (só aparência) e o default; aplicar com backup da coluna, antes ou depois do deploy (aplicada e conferida só no `sb_eng_local`, diff vazio). Mudou a paleta, mudar os dois lugares.

## Schema Prisma (resumo)

Models: `Tenant`, `User`, `Company`, `Empenho`, `Invoice`. Enums: `UserRole` (`PLATFORM_ADMIN`, `MASTER`, `COORDENACAO`, `ENGENHARIA`, `ADMINISTRATIVO`, `USER` — ver seção "RBAC por domínio" abaixo), `EmpenhoStatus`, `EmpenhoCategory`, `InvoiceStatus`.

- **Multi-tenant**: `Tenant` é o topo da hierarquia (uma organização/OM). `User.tenant_id` é obrigatório. `Empenho.tenant_id` também é obrigatório no schema — mas ver pendência abaixo, isso ainda não está implementado na camada de aplicação.
- **`Invoice`** usa `@@map("nota_fiscal")` — preserva o nome físico da tabela no banco após o rename de `NotaFiscal` para `Invoice` no código/model, sem exigir migration de rename.
- **Valores monetários** (`Empenho.value`, `Empenho.totalPaid`, `Invoice.value`) são `Int`, armazenados em **centavos** — sempre multiplicar por 100 na escrita e dividir por 100 na leitura, seguindo o padrão já usado nos repositories existentes.
  - **Toda resposta da API é em reais**, inclusive a de `create`/`update` (o frontend insere essa resposta direto na lista). Retornar o registro cru do Prisma exibe o valor 100× maior.
  - `Empenho.totalPaid` e `Obra.valorExecutado` são **recalculados** (soma das notas não canceladas do empenho / da obra) dentro da mesma transação em que a nota é criada, editada ou excluída (`syncInvoiceTotals` em `PrismaInvoiceRepository`). Não incrementar/decrementar manualmente nem gravar esses campos em outro lugar (exceção: mudar a OS de obra recalcula as duas obras na mesma transação). A OS da nota precisa ser financiada pelo mesmo empenho (`InvoiceScopeValidator.resolveObra`).
- Client gerado em `src/generated/prisma` (custom output, ignorado no git).
- Não existe pasta `prisma/migrations/` versionada — o `prisma.config.ts` referencia `migrations.path`, mas não há histórico de migration commitado. Ao mexer no schema, confirmar com o usuário antes de rodar `db push`/`migrate` contra o banco real (é Supabase remoto, não local).

## Variáveis de ambiente

Ver `.env.example`. As que o código de fato lê (não confiar em documentação antiga do README raiz, que cita `JWT_EXPIRATION`/`CORS_ORIGIN`/`LOG_LEVEL` — **nenhuma dessas existe no código real**):

| Variável | Onde é usada | Observação |
|---|---|---|
| `DATABASE_URL` | `prisma.config.ts`, `infrastructure/prisma/prisma.ts` | String de conexão Postgres (Supabase) |
| `JWT_SECRET` | `infrastructure/cryptography/TokenGenerator.ts` | Lança `DomainError` se ausente |
| `NODE_ENV` | `server.ts` | Controla qual origem de CORS é usada |
| `PORT` | `server.ts` | Porta do `app.listen` |
| `ALLOWED_DEV_ORIGIN` | `server.ts` | Origem CORS quando `NODE_ENV=development` |
| `ALLOWED_PROD_ORIGIN` | `server.ts` | Origem CORS em produção |

Expiração do JWT é hardcoded em `30d` dentro de `TokenGenerator.ts` — não é configurável via env hoje.

O cookie `auth` (setado em `signup`/`signin` no `UserController.ts`) carrega `httpOnly: true`, `maxAge` de 30 dias (alinhado ao `expiresIn` do JWT), `secure`/`sameSite` condicionais a `NODE_ENV`. Antes disso o cookie não tinha `maxAge` — virava cookie de sessão do navegador (some ao fechar a aba), mesmo o JWT interno tendo validade de 30 dias; era a causa de "login não persiste". `res.clearCookie("auth")` no `logout` deve usar os mesmos atributos (`httpOnly`/`secure`/`sameSite`) do `res.cookie` original, senão o navegador pode não remover o cookie corretamente em produção.

## Autenticação

JWT em cookie httpOnly (`req.cookies.auth`). **`AuthMiddleware` não confia no payload do JWT para dados de perfil** — decodifica só para extrair o `id`, depois busca o usuário **atual no banco** (`IUserRepository.findById`) para montar `req.user`. Isso é deliberado: já houve um bug em que `approved`/`role` vinham congelados do momento do login (via JWT) e nunca refletiam mudanças posteriores feitas por um admin. Qualquer expansão de `AuthenticatedUser` deve continuar vindo do banco, nunca só do token.

`User.approved` — conta só é utilizável depois de aprovada por um admin do tenant. `SignUpUseCase` cria o usuário com `approved: false` por padrão.

**Fluxo de aprovação de usuários** (rotas em `UserRoutes.ts`, todas atrás de `AuthMiddleware`):
- `GET /list-unapproved-users` (`ListUnapprovedUsersUseCase.ts`) — lista usuários com `approved: false`, com escopo por role feito **em memória, dentro do use case** (não no repository): `PLATFORM_ADMIN` vê pendentes de **todas** as tenants, `MASTER` vê só os da própria tenant (`unapprovedUsers.filter(u => u.tenant_id === user.tenant_id)`), qualquer outro role recebe `DomainError("UNAUTHORIZED")`. `IUserRepository.findUnapproved()` **não recebe parâmetro** — busca sempre todos os não aprovados, sem filtro de tenant no banco; o filtro é só o `.filter()` acima.
- `PrismaUserRepository.findUnapproved()` faz `include: { tenant: { select: { name: true } } }`, então cada usuário retornado vem com um campo extra `tenant: { name }`, usado pelo frontend pra mostrar a organização de cada pedido pendente. Esse campo **não está declarado** em `IUserRepository`/`User` (domain) — compila porque TS permite propriedades a mais no retorno; se for expandir mais campos do tenant, considerar tipar isso explicitamente.
- `PUT /user/:id/approve` (`ApproveUserUseCase.ts`) e `DELETE /user/:id/disapprove` (`DisapproveUserUseCase.ts`) — **existem e funcionam**, o frontend (`Aprovacoes`/`ApprovalRow.tsx`) chama a API de verdade, não é mais só efeito visual local. A checagem de role aqui é feita **dentro do use case**, com um array hardcoded (`["MASTER", "PLATFORM_ADMIN"]`), não via `AdminPolicy` nem via `RequiredRoles` middleware — inconsistente com os dois padrões já documentados acima; ao mexer nessas rotas, considerar migrar pra `RequiredRoles.handle("MASTER", "PLATFORM_ADMIN")`.
- **Nenhum dos dois use cases acima confere se o usuário-alvo pertence à mesma tenant de quem está aprovando/recusando.** Um `MASTER` só *vê* pendentes da própria tenant na listagem, mas se souber o `id` de um usuário pendente de outra tenant, `ApproveUserUseCase`/`DisapproveUserUseCase` aceitam normalmente — só checam o role de quem chama, não o `tenant_id` do alvo. Identificado nesta sessão, não corrigido — confirmar escopo antes de mexer.
- `UserController.listUnapprovedUsers` faz `res.json(unapprovedUsers)` direto do retorno do Prisma, sem mapear campos — isso inclui o **hash de senha** (`password`) de cada usuário pendente na resposta JSON. Vaza pro frontend (mesmo que a UI não mostre). Identificado nesta sessão, não corrigido.

## Escopo das listagens por tenant

`PLATFORM_ADMIN` é o dono da plataforma e enxerga **todas** as organizações: as listagens de Contrato, Empenho, OrdemServico, Obra e Invoice passam `tenant_id = undefined` quando `user.role === "PLATFORM_ADMIN"` (o repository vira filtro vazio). Todos os outros roles veem só a própria tenant. Ao criar uma listagem nova, seguir esse padrão — antes era inconsistente (Empenho/Invoice globais, o resto não) e isso bagunçava o Dashboard. Escritas (update/delete) continuam checando `existing.tenant_id !== user.tenant_id`, ou seja, o PLATFORM_ADMIN ainda não consegue editar registros de outra organização.

**Regra geral: o usuário só vê e altera o que é da própria base.** Leituras filtram por `tenant_id` (PLATFORM_ADMIN vê tudo); toda escrita por id confere `existing.tenant_id !== user.tenant_id` antes (Contrato, Empenho, OS, Obra, Invoice via `empenho.tenant_id`, aprovação/reprovação de usuário pelo MASTER).

**Empresas por base (`TenantCompany`, 2026-09-28):** `Company` é global (CNPJ único, a mesma empresa pode atender várias bases); o vínculo com a base é a tabela `TenantCompany`. `GET /company/list` só traz empresas vinculadas ao tenant, com os empenhos/estatísticas desse tenant. Criar empresa com CNPJ já existente em outra base só cria o vínculo; excluir remove o vínculo (e o cadastro global só quando nenhuma base usa mais); editar, criar acesso EMPRESA e usar em Contrato exigem vínculo. SQL em `prisma/manual-migrations/2026-09-28-tenant-company.sql` (backfill a partir de `Contrato`) — **aplicar antes do deploy do código**.

**Empresas na Nota Fiscal:** os modais de NF usam `GET /invoices/company-options` → `ICompanyRepository.listByTenant` (empresas com contrato no tenant, só com os empenhos desse tenant). `InvoiceScopeValidator` barra empenho de outro tenant, empresa diferente da do contrato do empenho, e editar/excluir nota de outro tenant.

## Cadastro de tenants no signup (rota pública)

Depois de `TenantRoutes.ts` passar a exigir `AuthMiddleware` + `PLATFORM_ADMIN` em `GET /tenant/get-all` (ver pendência #5 abaixo), o formulário de cadastro (`SignUp.tsx`, sem usuário autenticado ainda) ficou sem como listar as organizações pro dropdown. Solução: nova rota **pública** `GET /tenant/list-public` (sem `AuthMiddleware`), montada em `TenantRoutes.ts` via `ListTenantOptionsUseCase` → `ITenantRepository.getPublicOptions()` → `prisma.tenant.findMany({ select: { id: true, name: true } })`. Só expõe `id`/`name` — nunca os campos sensíveis do `Tenant` (`cnpj`, `cep`, `address`, `phone`, `email`), que só saem pela rota protegida `GET /tenant/get-all`. Se precisar de mais campos públicos no dropdown de signup no futuro, expandir o `select` do `getPublicOptions`, não trocar `list-public` para reusar `getAll`.

## RBAC por domínio (implementado em 2026-07-15)

`UserRole` tem 6 valores, substituindo `EDITOR` por três roles que expressam acesso por **domínio de negócio** em vez de "pode editar tudo":

```prisma
enum UserRole {
  PLATFORM_ADMIN
  MASTER
  COORDENACAO     // vê e edita Engenharia + Administrativo
  ENGENHARIA      // vê e edita só Engenharia (Obra, Medição)
  ADMINISTRATIVO  // vê e edita só Administrativo (Company, Empenho, Invoice)
  USER            // vê os dois domínios, edita nenhum
}
```

Domínios e recursos:
- **Engenharia**: `Obra` (ainda sem backend — só o frontend/`obras.ts` chama rotas `/obra/*` que não existem no servidor), futura `Medicao`. Fora do escopo desta mudança por decisão do usuário — ver "O que ficou de fora" abaixo.
- **Administrativo**: `Company`, `Empenho`, `Invoice`.

Matriz de acesso (`view` = listar/ler; `edit` = criar/editar/excluir, implica `view`), em `DomainAccessPolicy` (`domain/polices/DomainAccessPolicy.ts`):

| Role | Engenharia | Administrativo |
|---|---|---|
| USER | view | view |
| ENGENHARIA | edit | view |
| ADMINISTRATIVO | view | edit |
| COORDENACAO | edit | edit |
| MASTER | edit | edit |
| PLATFORM_ADMIN | view | edit |
| EMPRESA | view (Obras, OS, Mapa, orçamento e medições fechadas, só da própria empresa; somente leitura) | none |

**Capabilities (2026-09-29)** — ações que fogem da matriz ficam em `DomainAccessPolicy.canDo(role, capability)` e no middleware `RequireCapability`:
- `manageUsers` (PLATFORM_ADMIN, MASTER, COORDENACAO): aprovar/recusar cadastro, listar usuários e mudar role. MASTER e COORDENACAO só na própria tenant e sem conceder nem alterar PLATFORM_ADMIN. COORDENACAO = MASTER, a diferença é só hierárquica.
- `createOrdemServico` (administrativo edit + ENGENHARIA): `POST /ordem-servico/create`. ENGENHARIA não edita nem exclui OS.
- `createCompanyAccess` (administrativo edit + ENGENHARIA): `POST /company/:id/create-access`.
- `darCienciaOrdemServico` (só EMPRESA) e `tramitarOrdemServico` (MASTER, COORDENACAO, ADMINISTRATIVO, ENGENHARIA), 2026-10-23: ciência/apontamento da empresa e resposta da fiscalização — ver "Ciência e contestação da OS pela empresa".
- `viewOrdensServico` (quem vê o administrativo + EMPRESA, 2026-10-01): `GET /ordem-servico/list`. Para EMPRESA o `ListOrdensServicoUseCase` passa `company_id` e o repository filtra `empenho.contrato.company_id` (empenho principal da OS), inclusive nas contagens e no executado — mesmo critério de `GET /obra/list`.

A cola de perfis da tela de Usuários (`frontend/src/pages/Users/role-guide.ts`) e o `usePermission.ts` espelham essas regras — mudou aqui, atualizar lá.

`PLATFORM_ADMIN` continua o único role com `canManageOrganization` (único que vê/gerencia `Tenant`). A aprovação de cadastro (`canApproveUsers` no frontend) vale para MASTER, COORDENACAO e PLATFORM_ADMIN — ver capability `manageUsers` acima.

O que foi implementado:
- `CompanyRoutes.ts`/`EmpenhoRoutes.ts`/`InvoiceRoutes.ts` — todos os métodos (inclusive os GETs de listagem, que antes não tinham nenhuma checagem de role) passaram a usar `RequireDomainAccess.handle("administrativo", "view" | "edit")` no lugar de `RequiredRoles.handle("EDITOR", "MASTER", "PLATFORM_ADMIN")`.
- `CreateEmpenhoUseCase`/`UpdateEmpenhoUseCase`/`UpdateEmpenhoStatusUseCase`/`DeleteEmpenhoUseCase` — trocaram `AdminPolicy.isAdmin()` por `DomainAccessPolicy.can(user.role, "administrativo", "edit")`. `AdminPolicy` foi removida (não tinha mais nenhum uso).
- `UpdateUserRoleUseCase` — sem mudança de lógica, só passou a aceitar os 3 valores novos de role (tipo vem do enum gerado do Prisma). `MASTER` continua sem poder conceder `PLATFORM_ADMIN`.
- `UserController.ts` (`VALID_ROLES`), `AuthenticatedUser.ts`, `domain/entities/User.ts`, `@types/express/index.d.ts` — união de `role` atualizada nos 6 valores novos.
- **Migração de dados**: usuários hoje com role `EDITOR` viram `ADMINISTRATIVO` (preserva exatamente o que já podiam editar). Escrita em `backend/prisma/manual-migrations/2026-07-15-role-domains.sql` — recria o tipo `UserRole` no Postgres (não dá pra usar `ALTER TYPE ... DROP VALUE`), com `UPDATE` de EDITOR→ADMINISTRATIVO embutido antes da troca de tipo. **Ainda não foi rodada contra o Supabase remoto** — falta confirmação explícita do usuário antes de aplicar (ver "Coisas para NUNCA fazer sem perguntar antes"). Até isso rodar, o banco real ainda tem o enum antigo (`EDITOR` em vez dos 3 novos valores) e o app vai quebrar contra produção — `npx prisma generate` já foi rodado localmente (só lê `schema.prisma`, não toca no banco), então o client TS já reflete o schema novo.

### O que ficou de fora (decisão explícita do usuário, 2026-07-15)

`Obra`/`Medicao` continuam sem model/rotas no backend — não fazem parte desta mudança. Consequência prática: o RBAC de domínio `administrativo` já vale de verdade (protege Company/Empenho/Invoice no servidor); o de `engenharia` só existe na matriz/policy, mas não protege nada ainda porque não há rota nenhuma de Obra no backend para aplicar `RequireDomainAccess("engenharia", ...)`. Se esse domínio ganhar backend no futuro, replicar exatamente o padrão já usado em `CompanyRoutes.ts`/`EmpenhoRoutes.ts`/`InvoiceRoutes.ts`.

## Pendências conhecidas (não "corrigir sozinho" sem alinhar escopo — já causou retrabalho)

1. ~~**`Empenho` não tem `category`/`tenant_id` na camada de aplicação**~~ — **resolvido**: em 2026-10-22 o `npx tsc --noEmit` e o `npm run build` passam sem erro (itens 1 e 2). Registro antigo: a aplicação não tinha esses campos, embora o schema Prisma já exigisse os dois. Isso quebra `npm run build` hoje com:
   ```
   PrismaEmpenhoRepository.ts(18,9): Type '...' is missing ... properties ... 'category', 'tenant_id'
   ```
   A lacuna é ponta a ponta: `EmpenhoType`/`EmpenhoEntity`, `IEmpenhoRepository`, `CreateEmpenhoUseCase`/`UpdateEmpenhoUseCase`, e `PrismaEmpenhoRepository` precisam todos ser atualizados juntos.
2. ~~**`SignUpUseCase.ts:42`** também não compila hoje~~ (resolvido, ver item 1) (`npx tsc --noEmit`): o objeto passado pro construtor de `User` está faltando `id`/`role`. Encontrado nesta sessão, não estava documentado antes — **junto com o item 1, são os dois únicos erros de compilação do projeto hoje**; se aparecer um terceiro, é regressão real.
3. Sem testes, sem CI — qualquer mudança precisa ser validada manualmente (`npx tsc --noEmit` no mínimo) antes de considerar concluída.
4. `express/index.d.ts` tem uma `JwtPayload` local cujo union de `role` não inclui `"PLATFORM_ADMIN"` (diverge de `AuthenticatedUser`) e parece não ser usada em lugar nenhum — candidato a limpeza, mas confirmar antes de remover.
5. Script `npm run start` aponta para `./env` em vez de `./.env` — nunca testado/usado (fluxo real é sempre `npm run dev`).
6. ~~`TenantRoutes.ts` sem `AuthMiddleware`~~ — **resolvido**: `TenantRoutes.ts` agora monta `AuthMiddleware` + `requiredRoles.handle("PLATFORM_ADMIN")` em `POST /tenant/create` e `GET /tenant/get-all`, no mesmo padrão manual de DI dos outros arquivos de rota. `CreateTenantUseCase` em si continua sem checar `user`/role internamente — a única barreira é a rota; se o use case algum dia for chamado fora do HTTP (job, script), a checagem de role precisa ser adicionada lá também. Ver seção "Cadastro de tenants no signup" acima pra rota pública que isso exigiu criar.
7. **`ApproveUserUseCase`/`DisapproveUserUseCase` não checam se o usuário-alvo é da mesma tenant** de quem aprova/recusa — um `MASTER` pode agir sobre um usuário de outra tenant se souber o `id`. Ver detalhes na seção "Autenticação" acima.
8. **`UserController.listUnapprovedUsers` vaza o hash de senha** de cada usuário pendente na resposta JSON (`res.json()` direto do objeto do Prisma, sem mapear campos). Ver seção "Autenticação" acima.

## Coisas para NUNCA fazer sem perguntar antes

- Rodar `prisma db push`, `prisma migrate` ou qualquer SQL manual (inclusive `backend/prisma/manual-migrations/2026-07-15-role-domains.sql`, ainda pendente de aplicar) contra `DATABASE_URL` — é um banco Supabase remoto real, não local.
- Reintroduzir parâmetros posicionais em use cases com 2+ argumentos.
- Lançar `Error` genérico ou `InfrastructureError` em repository — sempre `DomainError`.
- Assumir que campos de `AuthenticatedUser` podem vir só do JWT sem consultar o banco.
