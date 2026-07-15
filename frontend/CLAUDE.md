# Frontend — SB Engenharia

Painel de gestão de engenharia (obras, empenhos, notas fiscais/invoices, empresas contratadas) de uma organização militar. React 19 + Vite + TypeScript + Tailwind v4 + Zustand + React Router v7.

## Stack

- **React 19**, **Vite 7**, **TypeScript** (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **Tailwind v4** via `@tailwindcss/vite` — tokens definidos em `src/index.css` com `@theme`, não em `tailwind.config.js` (não existe esse arquivo, é o modelo novo do Tailwind v4)
- **React Router v7** (pacote unificado `react-router`, não `react-router-dom` separado) — `createBrowserRouter`
- **Zustand** para estado global, sem middleware (sem `persist`, sem `devtools`) — todos os stores são `create<T>((set) => ({...}))` simples
- **Sonner** para toasts, **lucide-react** para ícones
- Sem: biblioteca de formulários (tudo `useState` manual), axios (fetch nativo via wrapper próprio), testes, CI/CD

## Scripts

```bash
npm run dev       # vite — dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # vite preview
```

Estado atual: `npx tsc -b` e `npx eslint src` rodam **limpos, zero erros/warnings**. Manter assim — qualquer PR que introduza erro de tipo ou lint é regressão.

## Paleta e tipografia (`src/index.css`)

Fundo/superfície em bege/off-white neutro (`--color-background: #faf9f5`, `--color-surface`, `--color-border`), com três escalas de marca:
- **`primary`** — azul (`#4478b6` no 500), cor de ação principal
- **`secondary`** — verde (`#3c8567` no 500)
- **`accent`** — âmbar/dourado (`#d48a12` no 500)

Cada escala tem tons 50–700 (sem 800/900). Cores semânticas (`success`/`warning`/`danger`/`info`) só têm `-bg`/`-text`/`-border`, sem escala numérica.

**Tipografia é `helvetica, sans-serif`** aplicado via seletor universal `*` — é fallback do sistema, não uma fonte carregada de verdade (sem `@font-face`, sem Google Fonts). Isso já foi levantado como possível melhoria e **rejeitado pelo usuário** ("o original está melhor") — não trocar a fonte por conta própria; se for reabrir essa discussão, perguntar primeiro.

Duas animações customizadas (`ping-slow`/`ping-slower`), usadas só em `PendingApproval.tsx` (efeito de "sonar" pulsante).

**Não mudar paleta, tipografia ou conceito visual sem alinhamento explícito** — já houve duas rodadas de proposta de redesign (uma "militar/carimbo", rejeitada; uma "futurista minimalista dark/light", aprovada mas depois o usuário pediu para não remodelar; uma proposta de refinamento tipográfico, também rejeitada). O padrão atual é: melhorias pontuais de UX/organização de código são bem-vindas, mudança de identidade visual não.

## Estrutura

```
frontend/
  types/                    — tipos compartilhados, FORA de src/ (não está no include do tsconfig.app.json,
                              funciona só porque são importados por arquivos que estão em src/)
    create-company.ts, create-tenant.ts, empenho.ts, empresa.ts, invoice.ts,
    list-companies.ts, list-empenhos.ts, obra.ts, tenant.ts, user.ts
    — `tenant.ts` exporta `Tenant` (completo, uso admin) e `TenantOption` ({ id, name }, dropdown de
      signup, vem de `GET /tenant/list-public`)
    — `user.ts` exporta `User` (genérico, usuário logado) e `UnapprovedUser extends User` (com
      `tenant: { name }`, só o retorno de `GET /list-unapproved-users` tem esse campo)

  src/
    main.tsx, routes.tsx, index.css

    components/
      StatCard.tsx            — card de estatística compartilhado (variante `compact`)
      Auth/RequireAuth.tsx     — guard de rota (ver seção Auth)
      Layouts/AppLayout.tsx    — só visual: Sidebar + MobileSidebar + Outlet
      Sidebar/                 — Sidebar.tsx (desktop), MobileSidebar.tsx (drawer mobile),
                                  adm-items.ts + eng-items.ts (itens de menu)

    hooks/
      usePermission.ts        — deriva flags de UI a partir de `user.role`, com base numa matriz de acesso
                                 por **domínio de negócio** (`engenharia` vs `administrativo`, mesma matriz
                                 do backend, ver `backend/CLAUDE.md`): `canViewAdministrativo`/
                                 `canEditAdministrativo`, `canViewEngenharia`/`canEditEngenharia`,
                                 `canManageOrganization` (só `PLATFORM_ADMIN`), `canApproveUsers` (`MASTER`/
                                 `PLATFORM_ADMIN`). `canCreateAndEditContent` também existe, mas é **alias
                                 legado só para `Obra`/`Medições`** (mesmo valor de `canEditEngenharia`) —
                                 esse domínio ficou fora da mudança de RBAC de 2026-07-15 por decisão
                                 explícita do usuário (ver "RBAC por domínio" abaixo); não usar esse alias
                                 em código novo, usar `canEditEngenharia` diretamente. Usado em `Sidebar.tsx`/
                                 `MobileSidebar.tsx` e nos headers/tabelas de página (`Company/`, `Empenho/`,
                                 `Invoice/`, `Obra/`, `Tenant/`) para esconder ações de criar/editar/aprovar
                                 e grupos inteiros de menu. **Checagem só de UI** — o backend aplica a mesma
                                 matriz via `RequireDomainAccess` (ver `backend/CLAUDE.md`); não confiar só
                                 nesse hook para segurança real. Ao checar role em um componente novo, usar
                                 este hook em vez de comparar `user?.role === "X"` inline.

    pages/
      Dashboard.tsx      — ⚠️ ainda usa mockData hardcoded, não busca dos stores reais (pendência conhecida)
      Empresas.tsx, Invoices.tsx, Empenhos.tsx, Obras.tsx  — páginas principais
      Organizacoes.tsx   — lista tenants (PLATFORM_ADMIN); botão "Nova Organização" só aparece para esse role
      Approval/          — página Aprovações: lista usuários pendentes (approved: false) via API, com
                           nome da organização (tenant) e e-mail de cada um. Botões aprovar/recusar chamam
                           a API de verdade (`PUT /user/:id/approve`, `DELETE /user/:id/disapprove`), não
                           são mais só efeito visual local. `ApprovalTable.tsx`/`ApprovalRow.tsx` seguem o
                           mesmo padrão de tabela real (`<td>` por coluna) de `EmpenhoTable`/`InvoiceTable`
                           — não usar mais o truque antigo de `<td colSpan>` + CSS grid interno pra simular
                           colunas, foi abandonado por destoar visualmente do resto do app. Organização é
                           renderizada como badge neutro (`bg-surface-muted`, `border-border`), no mesmo
                           estilo do badge de Status do `InvoiceTable` mas sem cor semântica.
      Medicoes.tsx       — stub vazio, sem funcionalidade
      auth/              — SignIn.tsx, SignUp.tsx, PendingApproval.tsx
      Company/           — componentes da página Empresas (SEM index.ts/barrel)
      Empenho/           — componentes da página Empenhos (COM index.ts/barrel)
      Invoice/           — componentes da página Invoices (COM index.ts/barrel)
      Obra/              — componentes da página Obras (COM index.ts/barrel)
      Tenant/            — componentes da página Organizacoes: TenantTable.tsx, RegisterTenant.tsx (modal de
                           criação — só criar, backend não tem update/delete de tenant ainda)

    store/               — Zustand: user.ts, companies.ts, empenhos.ts, invoices.ts, obras.ts, tenants.ts,
                           unapprovedUsers.ts
    services/api.ts      — defaultFetch, wrapper de fetch
    utils/               — format-currency.ts (formatCurrency/formatDate/formatDateTime — usar sempre este,
                           não redefinir localmente), get-initial.ts, estados-brasil.ts
```

Cada página principal (Empresas/Empenhos/Invoices/Obras) tem uma pasta companion com o mesmo padrão: Modal de criar/editar, Modal de deletar, Table, Stats/StatusCards, Filters. **Ao adicionar uma entidade nova, seguir esse padrão** — inclusive o barrel `index.ts` (só `Company/` ainda não tem, é inconsistência a corrigir se mexer lá, não a replicar).

## Rotas (`src/routes.tsx`)

```tsx
<RequireAuth>
  <AppLayout />           {/* Sidebar/MobileSidebar + <Outlet/> */}
</RequireAuth>
  ├─ / → Dashboard                                              {/* sem guard de role, de propósito */}
  ├─ /empresas → RequireRole(canViewAdministrativo) → Empresas
  ├─ /notasfiscais → RequireRole(canViewAdministrativo) → Invoices   {/* rota NÃO foi renomeada junto com o componente */}
  ├─ /empenhos → RequireRole(canViewAdministrativo) → Empenhos
  ├─ /medicoes → Medicoes                                        {/* sem guard — ver "RBAC por domínio" abaixo */}
  └─ /obras → Obras                                              {/* sem guard — ver "RBAC por domínio" abaixo */}

/signin → SignIn      (fora do RequireAuth)
/signup → SignUp      (fora do RequireAuth)
```

Sem rota 404/catch-all. `RequireAuth` é elemento pai único de todas as rotas protegidas — monta uma vez por navegação vinda de fora do grupo (ex.: de `/signin` para `/`), não remonta ao navegar entre páginas já dentro do grupo. `RequireRole` (`components/Auth/RequireRole.tsx`) é o guard genérico por permissão, aninhado dentro de `RequireAuth` — recebe um predicado `allow={(p) => ...}` sobre o retorno de `usePermission()` e faz `<Navigate to="/" replace />` se falhar.

## Autenticação e sessão

Sessão via cookie httpOnly (JWT), **sem persistência local no Zustand** — o estado `user` sempre começa `null` no boot do app e é restaurado chamando `GET /me`.

- **`RequireAuth`** (`components/Auth/RequireAuth.tsx`) — único guard de auth do app. Pula `fetchUser()` se `user` já está no store (`useState(!user)` como estado inicial de `checking`, `useEffect` retorna cedo se `user` existe) — do contrário, `navigate("/signin")` se falhar; se `user` existe mas `!user.approved`, renderiza `<PendingApproval />`; senão renderiza `children` (`AppLayout`). **Não duplicar essa checagem em páginas individuais** — já foi removida de `Dashboard.tsx`, que tinha um guard próprio redundante.
  - O "pular se já tem `user`" corrige uma race condition real: `signin`/`signup` já populam `user` no store antes de navegar para `/`; se `RequireAuth` sempre refizesse `fetchUser()` (`GET /me`) ao montar, essa chamada podia perder a corrida contra a gravação do cookie recém-setado pelo browser e derrubar o usuário de volta para `/signin` logo após um login bem-sucedido ("primeiro login não funciona").
- **`store/user.ts`** — `signin`/`signup`/`logout`/`fetchUser`. `signin` dispara `toast.error` em falha; os outros não têm toast embutido (é responsabilidade do chamador).
- **`PendingApproval.tsx`** — tela para `user.approved === false`. Faz polling a cada 15s chamando `fetchUser()` até a conta ser aprovada por um admin (backend, fora deste projeto).

Ao adicionar uma página nova protegida, só adicionar como filha do grupo `RequireAuth` em `routes.tsx` — não criar novo guard.

## Stores (Zustand)

Todos seguem o mesmo formato: `create<T>((set) => ({ ...estado, ...métodos async que chamam defaultFetch }))`. Sem `get()`. Erros geralmente propagam via `throw` para o componente chamador tratar com `try/catch` + `toast`.

| Store | Estado | Rotas de API |
|---|---|---|
| `user.ts` | `user: User \| null` | `POST /signup`, `POST /signin`, `POST /logout`, `GET /me` |
| `companies.ts` | `companies`, `stats` | `GET /company/list`, `POST /company/create`, `DELETE /company/delete/:id`, `PUT /company/update/:id` + `findCep` (chama ViaCEP direto, único ponto que não usa `defaultFetch`) |
| `empenhos.ts` | `data: ListEmpenhos \| null` | `GET /empenho/list`, `DELETE /empenho/delete/:id`, `PUT /empenho/update-status/:id` |
| `invoices.ts` | campos de `InvoiceDashboard` espalhados no store | `GET /invoices/list`, `POST /invoices/create`, `DELETE /invoices/delete/:id`, `PUT /invoices/update/:id` — **`create`/`delete`/`update` não recalculam os totais do dashboard localmente**, só `list()` traz números atualizados |
| `obras.ts` | `data: ListObras \| null` | `GET /obra/list`, `POST /obra/create`, `PUT /obra/update/:id`, `PUT /obra/update-status/:id`, `DELETE /obra/delete/:id` |
| `tenants.ts` | `tenants: Tenant[]`, `tenantOptions: TenantOption[]` | `GET /tenant/get-all` (`listTenants`), `POST /tenant/create` (`createTenant`) + `findCep` (ViaCEP direto, mesmo padrão de `companies.ts`) — backend exige `AuthMiddleware` + role `PLATFORM_ADMIN` nessas duas, então sempre enviam `credentials: "include"`. `listTenantOptions` chama `GET /tenant/list-public` **sem** `credentials` (rota pública, usada só pelo dropdown do `SignUp`, antes de existir sessão) |
| `unapprovedUsers.ts` | `users: UnapprovedUser[]`, `hasLoaded: boolean` | `GET /list-unapproved-users` (inclui `tenant.name` de cada usuário), `PUT /user/:id/approve`, `DELETE /user/:id/disapprove` — `hasLoaded` existe para a página (`Approval/page.tsx`) não refazer o fetch toda vez que remonta (ex.: navegar para outra aba e voltar); só busca de novo se `hasLoaded` ainda for `false` |

`services/api.ts` (`defaultFetch`) fixa `Content-Type: application/json`; **`credentials: "include"` não tem default**, precisa ser passado em cada chamada que exige sessão — checar isso ao adicionar uma chamada nova (é a causa mais comum de "por que minha rota autenticada retorna 401").

Padrão de "não refazer fetch ao remontar": como as páginas (`useState` local) desmontam/remontam a cada troca de rota mas os stores Zustand não, uma store pode expor uma flag tipo `hasLoaded` para a página pular o `useEffect` de fetch se os dados já foram carregados antes — usado em `unapprovedUsers.ts`. Nem toda store precisa disso (a maioria refaz fetch a cada mount de propósito, para refletir mudanças de outros usuários); usar com critério.

## Variáveis de ambiente

Só uma: `VITE_HOST` (ex.: `http://localhost:4000/api`), lida em `services/api.ts`. Ver `.env.example`.

**`frontend/.env` estava versionado no git até esta sessão** — foi removido do tracking (`git rm --cached`) e adicionado ao `.gitignore`; o arquivo continua no disco para uso local. Não versionar `.env` de novo, mesmo que o valor pareça inofensivo.

## RBAC por domínio (implementado em 2026-07-15)

`UserRole` tem 6 valores agora (`PLATFORM_ADMIN`, `MASTER`, `COORDENACAO`, `ENGENHARIA`, `ADMINISTRATIVO`, `USER` — `EDITOR` foi removido), espelhando o backend (ver seção equivalente em `backend/CLAUDE.md`). Matriz de acesso por domínio de negócio, em `hooks/usePermission.ts`:

| Role | Engenharia | Administrativo |
|---|---|---|
| USER | view | view |
| ENGENHARIA | edit | nenhum |
| ADMINISTRATIVO | nenhum | edit |
| COORDENACAO | edit | edit |
| MASTER | edit | edit |
| PLATFORM_ADMIN | edit | edit |

O que mudou de fato:
- `types/user.ts` — união de `role` atualizada para os 6 valores novos.
- `hooks/usePermission.ts` — reescrito, expõe `canViewAdministrativo`/`canEditAdministrativo`/`canViewEngenharia`/`canEditEngenharia` além de `canManageOrganization`/`canApproveUsers` (sem mudança). `canCreateAndEditContent` continua existindo só como alias de `canEditEngenharia`, usado exclusivamente por `Obra/`/`Medicoes` (ver "Escopo desta mudança" abaixo).
- `src/routes.tsx` — `/empresas`, `/notasfiscais`, `/empenhos` agora usam `RequireRole allow={(p) => p.canViewAdministrativo}`.
- `Sidebar.tsx`/`MobileSidebar.tsx` — o grupo "Administrativo" só aparece se `canViewAdministrativo`. `MobileSidebar.tsx` passou a importar `usePermission()` só para essa checagem (as de "Plataforma"/"Gestão" continuam inline, não foram tocadas).
- `role-labels.ts`, `Users/page.tsx` (`assignableRoles`) — atualizados para os 6 valores; `MASTER` continua sem poder conceder `PLATFORM_ADMIN` (regra do backend, inalterada).
- `Company/page.tsx`, `Empenho/page.tsx`, `Invoice/Header.tsx`, `TableCompanies.tsx`, `EmpenhoTable.tsx` — todo uso de `canCreateAndEditContent`/checagem inline de role nesses arquivos (domínio Administrativo) foi trocado por `canEditAdministrativo`. `EmpenhoTable.tsx` não recebe mais `user` como prop — usa `usePermission()` internamente, igual `TableCompanies.tsx`.

### Escopo desta mudança: Obra/Medições e Dashboard ficaram de fora

Por decisão explícita do usuário, `Obra`/`Medicoes` **não** ganharam guard de rota nem gate de sidebar, e o `Dashboard` (`/`) continua sem checagem de role — nenhum desses três teve comportamento novo. Único motivo pelo qual `Obra/page.tsx`/`ObraHeader.tsx`/`ObraTable.tsx` foram tocados: o literal `"EDITOR"` (removido do tipo `role`) quebrava a compilação em `ObraTable.tsx` — foi trocado pelo sucessor natural `"ENGENHARIA"` (troca mínima de token, sem mudar a lógica de quem vê o quê). Se um dia esse domínio ganhar backend de verdade (ver pendência conhecida em `backend/CLAUDE.md`), replicar aqui o mesmo padrão já aplicado em Company/Empenho/Invoice (`RequireRole` na rota, gate no grupo "Engenharia" da sidebar, `canEditEngenharia` nos botões).

## Pendências conhecidas (documentadas, não "corrigir de surpresa")

1. **`Dashboard.tsx` usa `mockData` hardcoded** — não busca nada dos stores reais. Se for corrigir, confirmar escopo antes (toca layout inteiro da home).
2. Rota `/notasfiscais` não foi renomeada para `/invoices` junto com o componente — mudar a URL pública é uma decisão de produto, não só refactor, perguntar antes.
3. `src/assets/images/vertical.jpg` não é referenciado em lugar nenhum — asset órfão.
4. `README.md` ainda é o boilerplate padrão do Vite, não customizado. (`index.html` já tem título "SB Engenharia" e favicon próprio — resolvido.)
5. `Company/` é a única pasta de página sem `index.ts`/barrel — inconsistente com `Empenho/`, `Invoice/`, `Obra/`.
6. **`TableCompanies.tsx` ainda tem ícones `ArrowUp`/`ArrowDown` decorativos no header** (colunas Empresa, Empenhos) sem `onClick`/ordenação real — sugerem uma funcionalidade que não existe. O mesmo problema existia em `EmpenhoTable.tsx` e foi corrigido (ícones removidos, headers viraram texto simples); `TableCompanies.tsx` ficou pendente por decisão do usuário — não corrigir de surpresa, mas é candidato natural se for mexer nessa tabela.

## Convenções a manter

- `formatCurrency`/`formatDate`/`formatDateTime` vêm sempre de `utils/format-currency.ts` — não redefinir localmente (já foi um problema real: ~15 redefinições idênticas espalhadas, unificadas nesta sessão).
- Nomes de props/exports em português quando o domínio é português (`empresa`, `empenho`), mas nomenclatura de código/arquivos em inglês para conceitos técnicos (`Invoice`, não `NotaFiscal` — já foi renomeado propositalmente).
- Ícones de ordenação/paginação só devem aparecer se a funcionalidade realmente existir — já houve casos de ícone decorativo sem `onClick` (`ArrowUp`/`ArrowDown` em `TableCompanies.tsx`/`EmpenhoTable.tsx`); ao copiar um componente de tabela como modelo, verificar se o sort é real antes de reusar.
- Qualquer alteração visual de peso (paleta, tipografia, densidade de espaçamento) deve ser proposta e confirmada antes de implementar — ver seção Paleta acima.
- Navegação interna sempre com `Link` (ou `useNavigate`) de `react-router` — nunca tag `<a href>` crua. Projeto usa React Router v7, não Next.js (não existe `next/link` aqui); `<a>` força reload de página inteira e perde o estado do SPA.
- Não existe mais componente de breadcrumb — foi removido (`components/Breadcrumb.tsx` deletado, uso retirado de todas as páginas) por ocupar espaço vertical sem agregar navegação real além do que a sidebar já oferece. Não reintroduzir sem alinhar antes.
- **Todo `<button>` (e qualquer elemento clicável) deve ter a classe `cursor-pointer` do Tailwind.** Não é automático no Tailwind v4 (Preflight não força `cursor: pointer` em botões, diferente do comportamento nativo esperado do HTML). Os botões de fechar (`X`) e "Cancelar" de vários modais (`RegisterOrEditCompany`, `ObraModal`, `DeleteObraModal`, `DeleteCompany`, `DeleteEmpenhoModal`, `EmpenhoModal`, `ModalEmpenho`) estavam sem essa classe — corrigido. Ao criar um componente novo com botão (modal, linha de tabela, paginação), conferir que **todo** botão (não só o de submit/ação principal) tem `cursor-pointer`.
  - Os botões de paginação (seta anterior/próxima, ícones `ChevronLeft`/`ChevronRight`) em `TableCompanies.tsx`, `InvoiceTable.tsx`, `ObraTable.tsx`, `TenantTable.tsx`, `EmpenhoPagination.tsx` e `ApprovalTable.tsx` tinham esse mesmo gap (só `disabled:cursor-not-allowed`, sem `cursor-pointer` pro estado habilitado) — encontrado e corrigido nesta sessão nos 6 arquivos (12 botões). Se copiar esse bloco de paginação como modelo pra uma tabela nova, já sai com `cursor-pointer`.
- Tabelas de listagem (`TableCompanies`, `InvoiceTable`, `EmpenhoTable`, etc.) devem sempre renderizar `<table>`/`<thead>` mesmo com lista vazia — o estado vazio é um bloco condicional **depois** de `</table>` (checando o array já paginado), nunca um `return` antecipado que substitui a tabela inteira. `EmpenhoTable.tsx` tinha esse desvio (cabeçalho sumia junto com o corpo quando vazio) e foi corrigido para bater com o padrão das outras tabelas.
- Componentes de filtro/busca (`EmpenhoFilters`, `FilterCompany`, etc.) devem usar as mesmas classes do input: ícone `size={16}`, `pl-9 pr-3 py-2`, `rounded-lg`, `text-sm`, `focus:border-primary-300 transition-all`. `EmpenhoFilters.tsx` divergia (ícone `18px`, `pl-10 pr-4`, `rounded-md`, sem `text-sm`) e foi corrigido para bater com `FilterCompany.tsx`.
