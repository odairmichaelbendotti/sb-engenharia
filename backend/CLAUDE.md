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
npm run build   # prisma generate && tsc — GERA ERRO hoje (ver "Pendências conhecidas")
npm run start   # node --env-file=./env ./dist/server.js — CUIDADO: aponta para "./env", não "./.env" (bug de digitação, nunca corrigido porque o fluxo real é sempre `dev`)
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
- Autorização por role agora é feita em **dois lugares que coexistem, não um substitui o outro**:
  - **`RequiredRoles` middleware** (`http/middleware/RequiredRoles.ts`), montado igual ao `AuthMiddleware` (instanciado por arquivo de rota, sem container) e encadeado **depois** de `authMiddleware.handle`: `requiredRoles.handle("EDITOR", "MASTER", "PLATFORM_ADMIN")`. É a forma padrão para novas rotas de mutação — usado hoje em create/update/delete de `CompanyRoutes.ts`/`InvoiceRoutes.ts`, create/update/updateStatus/delete de `EmpenhoRoutes.ts`, e create/get-all de `TenantRoutes.ts` (só `"PLATFORM_ADMIN"`). Rotas de listagem (`GET .../list`) continuam só com `AuthMiddleware`, sem restrição de role. **`handle()` precisa terminar com `next()` no branch de sucesso** — sem isso a requisição fica pendurada sem resposta (bug real já corrigido nesta sessão); ao copiar esse middleware como modelo, não esquecer o `next()`.
  - `AdminPolicy` (`isAdmin(user)` — tudo que não é `"USER"` conta como admin) continua sendo checado **dentro dos use cases** de `empenho/` (`CreateEmpenhoUseCase`, `UpdateEmpenhoUseCase`, `UpdateEmpenhoStatusUseCase`, `DeleteEmpenhoUseCase`) — é uma checagem redundante com o `RequiredRoles` da rota (o use case nunca é chamado por um role fora da lista do middleware), mas não foi removida; não remover sem confirmar, já que é a única barreira dentro do use case caso a rota mude no futuro.

## Schema Prisma (resumo)

Models: `Tenant`, `User`, `Company`, `Empenho`, `Invoice`. Enums: `UserRole` (`PLATFORM_ADMIN`, `MASTER`, `EDITOR`, `USER`), `EmpenhoStatus`, `EmpenhoCategory`, `InvoiceStatus`.

- **Multi-tenant**: `Tenant` é o topo da hierarquia (uma organização/OM). `User.tenant_id` é obrigatório. `Empenho.tenant_id` também é obrigatório no schema — mas ver pendência abaixo, isso ainda não está implementado na camada de aplicação.
- **`Invoice`** usa `@@map("nota_fiscal")` — preserva o nome físico da tabela no banco após o rename de `NotaFiscal` para `Invoice` no código/model, sem exigir migration de rename.
- **Valores monetários** (`Empenho.value`, `Empenho.totalPaid`, `Invoice.value`) são `Int`, armazenados em **centavos** — sempre multiplicar por 100 na escrita e dividir por 100 na leitura, seguindo o padrão já usado nos repositories existentes.
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

## Cadastro de tenants no signup (rota pública)

Depois de `TenantRoutes.ts` passar a exigir `AuthMiddleware` + `PLATFORM_ADMIN` em `GET /tenant/get-all` (ver pendência #5 abaixo), o formulário de cadastro (`SignUp.tsx`, sem usuário autenticado ainda) ficou sem como listar as organizações pro dropdown. Solução: nova rota **pública** `GET /tenant/list-public` (sem `AuthMiddleware`), montada em `TenantRoutes.ts` via `ListTenantOptionsUseCase` → `ITenantRepository.getPublicOptions()` → `prisma.tenant.findMany({ select: { id: true, name: true } })`. Só expõe `id`/`name` — nunca os campos sensíveis do `Tenant` (`cnpj`, `cep`, `address`, `phone`, `email`), que só saem pela rota protegida `GET /tenant/get-all`. Se precisar de mais campos públicos no dropdown de signup no futuro, expandir o `select` do `getPublicOptions`, não trocar `list-public` para reusar `getAll`.

## Pendências conhecidas (não "corrigir sozinho" sem alinhar escopo — já causou retrabalho)

1. **`Empenho` não tem `category`/`tenant_id` na camada de aplicação**, embora o schema Prisma já exija os dois campos. Isso quebra `npm run build` hoje com:
   ```
   PrismaEmpenhoRepository.ts(18,9): Type '...' is missing ... properties ... 'category', 'tenant_id'
   ```
   A lacuna é ponta a ponta: `EmpenhoType`/`EmpenhoEntity`, `IEmpenhoRepository`, `CreateEmpenhoUseCase`/`UpdateEmpenhoUseCase`, e `PrismaEmpenhoRepository` precisam todos ser atualizados juntos.
2. **`SignUpUseCase.ts:42`** também não compila hoje (`npx tsc --noEmit`): o objeto passado pro construtor de `User` está faltando `id`/`role`. Encontrado nesta sessão, não estava documentado antes — **junto com o item 1, são os dois únicos erros de compilação do projeto hoje**; se aparecer um terceiro, é regressão real.
3. Sem testes, sem CI — qualquer mudança precisa ser validada manualmente (`npx tsc --noEmit` no mínimo) antes de considerar concluída.
4. `express/index.d.ts` tem uma `JwtPayload` local cujo union de `role` não inclui `"PLATFORM_ADMIN"` (diverge de `AuthenticatedUser`) e parece não ser usada em lugar nenhum — candidato a limpeza, mas confirmar antes de remover.
5. Script `npm run start` aponta para `./env` em vez de `./.env` — nunca testado/usado (fluxo real é sempre `npm run dev`).
6. ~~`TenantRoutes.ts` sem `AuthMiddleware`~~ — **resolvido**: `TenantRoutes.ts` agora monta `AuthMiddleware` + `requiredRoles.handle("PLATFORM_ADMIN")` em `POST /tenant/create` e `GET /tenant/get-all`, no mesmo padrão manual de DI dos outros arquivos de rota. `CreateTenantUseCase` em si continua sem checar `user`/role internamente — a única barreira é a rota; se o use case algum dia for chamado fora do HTTP (job, script), a checagem de role precisa ser adicionada lá também. Ver seção "Cadastro de tenants no signup" acima pra rota pública que isso exigiu criar.
7. **`ApproveUserUseCase`/`DisapproveUserUseCase` não checam se o usuário-alvo é da mesma tenant** de quem aprova/recusa — um `MASTER` pode agir sobre um usuário de outra tenant se souber o `id`. Ver detalhes na seção "Autenticação" acima.
8. **`UserController.listUnapprovedUsers` vaza o hash de senha** de cada usuário pendente na resposta JSON (`res.json()` direto do objeto do Prisma, sem mapear campos). Ver seção "Autenticação" acima.

## Coisas para NUNCA fazer sem perguntar antes

- Rodar `prisma db push` ou `prisma migrate` contra `DATABASE_URL` — é um banco Supabase remoto real, não local.
- Reintroduzir parâmetros posicionais em use cases com 2+ argumentos.
- Lançar `Error` genérico ou `InfrastructureError` em repository — sempre `DomainError`.
- Assumir que campos de `AuthenticatedUser` podem vir só do JWT sem consultar o banco.
