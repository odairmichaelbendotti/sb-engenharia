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
  middleware/      — AuthMiddleware
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
- Autorização por role é feita **dentro dos use cases** via `AdminPolicy` (`isAdmin(user)` — tudo que não é `"USER"` conta como admin), não em middleware de rota. Não existe `RoleMiddleware`.

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

## Autenticação

JWT em cookie httpOnly (`req.cookies.auth`). **`AuthMiddleware` não confia no payload do JWT para dados de perfil** — decodifica só para extrair o `id`, depois busca o usuário **atual no banco** (`IUserRepository.findById`) para montar `req.user`. Isso é deliberado: já houve um bug em que `approved`/`role` vinham congelados do momento do login (via JWT) e nunca refletiam mudanças posteriores feitas por um admin. Qualquer expansão de `AuthenticatedUser` deve continuar vindo do banco, nunca só do token.

`User.approved` — conta só é utilizável depois de aprovada por um admin do tenant. `SignUpUseCase` cria o usuário com `approved: false` por padrão; alguém com role de admin precisa aprovar depois (fluxo de aprovação ainda não tem endpoint dedicado no backend — verificar antes de assumir que existe).

## Pendências conhecidas (não "corrigir sozinho" sem alinhar escopo — já causou retrabalho)

1. **`Empenho` não tem `category`/`tenant_id` na camada de aplicação**, embora o schema Prisma já exija os dois campos. Isso quebra `npm run build` hoje com:
   ```
   PrismaEmpenhoRepository.ts(18,9): Type '...' is missing ... properties ... 'category', 'tenant_id'
   ```
   A lacuna é ponta a ponta: `EmpenhoType`/`EmpenhoEntity`, `IEmpenhoRepository`, `CreateEmpenhoUseCase`/`UpdateEmpenhoUseCase`, e `PrismaEmpenhoRepository` precisam todos ser atualizados juntos. **Este é o único erro de compilação em todo o projeto** — se aparecer um novo, é regressão real, não ruído esperado.
2. Sem testes, sem CI — qualquer mudança precisa ser validada manualmente (`npx tsc --noEmit` no mínimo) antes de considerar concluída.
3. `express/index.d.ts` tem uma `JwtPayload` local cujo union de `role` não inclui `"PLATFORM_ADMIN"` (diverge de `AuthenticatedUser`) e parece não ser usada em lugar nenhum — candidato a limpeza, mas confirmar antes de remover.
4. Script `npm run start` aponta para `./env` em vez de `./.env` — nunca testado/usado (fluxo real é sempre `npm run dev`).

## Coisas para NUNCA fazer sem perguntar antes

- Rodar `prisma db push` ou `prisma migrate` contra `DATABASE_URL` — é um banco Supabase remoto real, não local.
- Reintroduzir parâmetros posicionais em use cases com 2+ argumentos.
- Lançar `Error` genérico ou `InfrastructureError` em repository — sempre `DomainError`.
- Assumir que campos de `AuthenticatedUser` podem vir só do JWT sem consultar o banco.
