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

## Paleta e tipografia (`src/index.css`) — design system de 2026-10-22

A pedido do usuário (2026-10-22: "fontes padronizadas, estilo mais monocromático, botões e inputs proporcionais, componentização como regra, fonte Montserrat"), o visual passou a ser **monocromático**:
- **Fonte Montserrat** (400/500/600/700), carregada por Google Fonts no `index.html`, definida em `--font-sans` no `@theme`. Não existe mais o `* { font-family: helvetica }`.
- **Paleta "Grafite e sinal" (2026-10-26, aprovada pelo usuário; proposta em `https://claude.ai/artifact/Eww11FLheJ1cNcCg9k6MB8`)**:
  - **`neutral-0…950`**: rampa grafite levemente fria, gerada em OKLCH (matiz 265, croma ≤ 0,006). `background` = 50, `surface` branco, `surface-muted` = 50, `border` = 150, `border-strong` = 200, `text-primary` = 900, `text-secondary` = 600, `text-muted` = 500 (5,5:1 sobre branco).
  - **`primary-*`** é só apelido da rampa (500 = `neutral-800`, cor de ação: botão principal, item ativo, foco). Classes `primary-*` continuam valendo.
  - **`progress`/`progress-track`**: toda barra de progresso (liquidado, medido, prazo corrido) é grafite; verde (`success-dot`) só quando quita, vermelho (`danger-dot`) quando passa do valor ou do prazo.
  - **Sinais** `success`/`warning`/`danger`: mesma luminosidade e croma, muda só o matiz; têm `-bg`/`-text`/`-border`/`-dot` (`-dot` = ponto do selo e barra cheia). **`info` (azul) não é status**: só aviso do sistema e link.
  - `secondary` (verde) e `accent` (âmbar) **foram removidos** (duplicavam success/warning). Paleta crua do Tailwind (`gray-*`, `red-*`, `blue-*`...) não deve ser usada.
  - **Cor do contrato**: o backend atribui por rodízio (`CONTRATO_COLOR_PALETTE` em `PrismaContratoRepository`) oito tons discretos de mesma luminosidade (ardósia, ocre, musgo, vinho, petróleo, terracota, oliva, ameixa); o usuário não escolhe. Migration `backend/prisma/manual-migrations/2026-10-26-paleta-contratos.sql` recolore os existentes.
- `@layer base`: números tabulares em `<table>`, `accent-color` grafite em checkbox/radio.

Animações customizadas: `ping-slow`/`ping-slower` (PendingApproval), `row-in`, `pop`, `slide-in-right`.

### Direção visual de 2026-10-23 (aprovada pelo usuário)

Proposta aprovada em `https://claude.ai/artifact/XDtcaYCf9ixAd8jU7jdEgE` (5 pranchas). Regras:
1. **Estrutura cinza, dado colorido.** Cor só em status, prazo e saldo, e só quando o estado não é o padrão. Tons por entidade num lugar só: `utils/status-display.ts` (`contratoStatusDisplay`, `empenhoStatusDisplay`, `invoiceStatusDisplay`, `obraStatusDisplay`; OS em `pages/OrdemServico/ordem-servico-display.ts`). **Grafite (`active`) = em curso** (Ativo, Em andamento; era azul até 2026-10-26); **âmbar = vence em breve ou aguarda alguém** (pendente, aguardando ciência, apontamento aguardando decisão); **vermelho = já passou** (vencida, atrasada, paralisada, ciência vencida); **verde = pago/concluído/quitada**; **selo vazado (`closed`) = encerrado** (finalizado, cancelado). Obra/OS ativa com prazo vencido vira selo vermelho. `getDeadlineHint` dá a dica de prazo ("faltam N dias" cinza, "vence em N dias" âmbar, "venceu há N dias" vermelho). `invoiceLabel` monta "NF 123" sem repetir o prefixo.
2. **Uma anatomia de linha em todas as listagens**: identidade à esquerda (título 13/600 + etiquetas `CodeTag` e origem em 11px) · status (`StatusPill`) · prazo (`DateHint`: data neutra, dica colorida) · contexto · saldo (`BalanceCell`) · menu ⋯ (`ActionMenu`). Clicar na linha abre a visualização.
3. **Tudo abre, tudo se liga**: todo registro abre no modal de visualização único (ver "Modal de visualização" abaixo), com vínculos clicáveis para os registros relacionados.
4. **Um lugar, um significado**: a faixa à esquerda da linha (`Td accent`) e do cabeçalho do modal é **sempre a cor do contrato**, nunca status.
5. **Escala tipográfica fixa**: página 18/600 · modal 15/600 · valor de destaque 17/700 · título de linha 13/600 · corpo 13 · cabeçalho de seção 11 caixa alta · rótulo/dica 11 · etiqueta de código 10,5 mono.

Histórico: antes disso houve propostas de redesign rejeitadas ("militar/carimbo", "futurista dark/light", refinamento tipográfico com troca de fonte). A troca para Montserrat + monocromático foi **pedida pelo próprio usuário**; mudanças de identidade visual além disso continuam precisando de alinhamento.

## Design system (`src/components/ui/`) — regra obrigatória

Todo controle de formulário e botão de ação usa os componentes base, importados do barrel `components/ui`. Vitrine com todos eles em **`/design-system`** (rota só em `import.meta.env.DEV`, `pages/DesignSystem/page.tsx`).

| Componente | Uso |
|---|---|
| `Button` | `variant`: `primary` (ação principal, uma por contexto), `secondary` (contorno), `ghost` (Cancelar/Voltar), `danger`, `success`; `size` `md` (40px, padrão) ou `sm` (32px); `icon`, `iconRight`, `loading` (spinner + desabilita), `fullWidth`. **`type="button"` por padrão** — envio de formulário precisa de `type="submit"` |
| `IconButton` | botão só com ícone; `label` obrigatório (aria-label + title); `variant` `ghost`/`secondary`/`danger` (lixeira na linha) |
| `Input` | `size`, `icon` (à esquerda), `prefix` ("R$"), `suffix` ("dias", "%"), `invalid` |
| `Select` | `<select>` nativo com a mesma aparência do Input + chevron; `size`, `icon`; opções como filhos |
| `Textarea` | mesma borda/foco; altura por `rows` |
| `Field` | rótulo + controle + `hint`/`error`; `required` põe o asterisco; liga o `<label>` ao controle filho sozinho (contexto com `useId`), sem precisar de `id` |
| `FormSection` | título de seção de formulário (ícone + texto em caixa alta + linha) com `space-y-4` nos filhos |
| `Modal` + `ModalHeader`/`ModalEntityHeader`/`ModalBody`/`ModalFooter` | `ModalEntityHeader` é o cabeçalho dos modais de visualização (linha de contexto, título 15/600, `accent` na cor do contrato, `actions` no canto, `back` "Voltar para..."); `ModalTitle` para diálogos sem cabeçalho. Esc fecha só o modal de cima (pilha interna do `Modal`): não registrar listener de Esc próprio em modal novo. Casca padrão (`size` sm–2xl, `flex flex-col`, 90vh). Com `StepForm`: Modal + ModalHeader + StepForm. `onClose` é **obrigatório**: todo modal fecha ao clicar fora (pedido do usuário, 2026-10-22); o clique precisa começar e terminar no fundo, para arrastar uma seleção de texto para fora não fechar o formulário. `elevated` põe o modal acima do mapa/painel lateral |
| `SegmentedControl` | escolha única entre poucas opções (status Ativo/Finalizado/Cancelado); `tone` (neutral/success/warning/danger) colore só o ícone da opção selecionada |
| `Table` + `TableHead`/`TableBody`/`Tr`/`Th`/`Td` | **toda tabela**. **Nunca rola na horizontal** (pedido do usuário, 2026-10-23): layout fixo, cada coluna de dado tem `width` no `Th` (classe Tailwind, ex. `w-36`) e a **primeira coluna (identidade) fica com a sobra**, truncando com `truncate` + `title`. Colunas secundárias somem por breakpoint (`className="hidden lg:table-cell"` no Th e no Td) e o essencial delas (ex.: selo de status) aparece embaixo do título com a classe inversa (`lg:hidden`). Conferir que a soma das larguras cabe em cada breakpoint (a partir de md o conteúdo é a largura da tela menos 256px do menu e 40px de margem). Alinhamento por posição (pedido de 2026-10-22): **1ª à esquerda, do meio centralizadas, última coluna de dado à direita** (a de antes do menu ⋯, via `:has(+ .cell-actions)`) — regras `.data-table` no `index.css`, não alinhar à mão. `Th actions`/`Td actions` = coluna do menu ⋯ (estreita; clique não abre a linha). `Tr onOpen` = linha clicável e focável (Enter/Espaço); `Tr muted` = cancelado. `Td accent` = faixa na cor do contrato. `compact` (modais/painéis) usa largura pelo conteúdo e quebra linha, também sem rolagem |
| `StatusPill` | selo de status com ponto (`tone`: `StatusTone` = active/closed/warning/danger/success, `size` sm/md). `active` = grafite com ponto cheio, `closed` = sem fundo com ponto vazado. Tons vêm de `utils/status-display.ts`. `Badge` continua para categorias sem significado de estado |
| `ActionMenu` | menu ⋯ da linha (`items`: `label`, `icon`, `onClick`, `danger` separado embaixo, `hidden`). Abre em portal com posição fixa (não é cortado pelo card) e vira para cima perto do rodapé. Ordem: Visualizar, Editar, ações da entidade, Excluir |
| `ConfirmDialog` | **única** confirmação do sistema: `tone` danger/success/neutral, `title` em forma de pergunta ("Excluir a obra X?"), corpo com a consequência, `confirmLabel` nomeando a ação, `confirmDisabled` quando bloqueado. Substituiu os modais de exclusão e o antigo `ConfirmModal` (removido) |
| `CodeTag` | etiqueta mono de código (patrimônio, OS, CNPJ, empenho). `OrdemServicoNumeroTag` usa ela |
| `StatTile`/`StatTiles`, `DetailItem`/`DetailGrid`, `RelationCard`/`RelationGrid`, `DateHint` | peças do modal de visualização: tiles de número (até 4), rótulo + valor, cartão de vínculo clicável, data + dica colorida |
| `Pagination` | rodapé de paginação das tabelas (`itemLabel` = "empenhos"...) |
| `Badge` | etiqueta de status/categoria, `tone` neutral/success/warning/danger/info |

`components/BalanceCell.tsx` é o **único** saldo das tabelas (contrato, empenho, OS, obra, empresa): rótulo, valor, barra e "N% de R$ X"; pago em verde, acima do valor em vermelho, `inactive` para cancelado. Substituiu `SaldoLiquidacao`, o `SaldoCell` de Obras e o saldo próprio da lista de OS.

`PageHeader` tem `description` (linha de contexto "Domínio · N ativos") e `actions` (botões próprios); Usuários, Organizações e Aprovações também usam ele.

Densidade (pedido do usuário, 2026-10-22, achou a fonte desproporcional): **corpo de tabela usa `text-table`** (13px, token do `@theme`; já aplicado pela `.data-table`, cabeçalho em `text-xs`) e **barras de filtro das listagens usam `size="sm"`** (`SearchInput` já é sm; `ScopeFilterButton` tem 32px; abas de status com `h-7 text-xs`). O prazo na lista é data neutra com dica colorida pequena, sem fundo. O que cada tabela mostra está na prancha 5 da proposta de 2026-10-23; o detalhe fica no modal de visualização.

Regras de proporção: controles e botões do mesmo tamanho têm **a mesma altura** (md 40px / sm 32px, texto 14px / 12px, ícone 16 / 14); numa mesma barra, todos no mesmo `size`. Rótulos `text-xs font-semibold text-text-secondary`; títulos `font-semibold` (evitar `font-bold`); dentro de modal, títulos no máximo `text-base`. Raios: controles/botões `rounded-lg`, cartões/modais `rounded-xl`, badges `rounded-md`. `className` nos componentes base serve **só para layout** (largura, margem) — sem `tailwind-merge`, uma classe de aparência passada por fora não sobrescreve a interna de forma confiável; para variar aparência, criar uma `variant`/`size` no componente. `utils/cx.ts` junta classes condicionais.

**Imposto pelo ESLint** (`eslint.config.js`, `no-restricted-syntax`): `<input>` (exceto checkbox/radio/file/hidden/range/color), `<select>`, `<textarea>` e `<table>` crus dão erro fora de `src/components/ui/`. Botões não são bloqueados pelo lint (abas, linhas e cartões clicáveis continuam `<button>`), mas botão de **ação** deve ser `Button`/`IconButton`. Precisa de um controle novo (checkbox estilizado, combobox com busca...)? Criar em `components/ui/`, exportar no `index.ts` e adicionar na vitrine.

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
      SummaryStrip.tsx        — faixa de totais única do app (topo do card de cada listagem; `standalone`
                                 no Dashboard e no resumo de organização). Substituiu o StatCard (removido)
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
      Medicoes/          — tela Medições (lista das OS + telas cheias de orçamento e medição, ver seção própria)
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
  ├─ /medicoes → RequireRole(canViewEngenharia) → Medicoes   {/* + /medicoes/:osId/orcamento e /medicoes/:osId/medicoes/:medicaoId? */}
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

Só uma: `VITE_HOST` (ex.: `http://localhost:4000/api`), lida em `services/api.ts` **apenas em dev**. No build de produção a base é fixa em `/api` (rewrite do `vercel.json` para o backend): chamar a API em outro domínio deixa o cookie `auth` como cookie de terceiro, o navegador descarta e a sessão some no F5. Ver `.env.example`.

**`frontend/.env` estava versionado no git até esta sessão** — foi removido do tracking (`git rm --cached`) e adicionado ao `.gitignore`; o arquivo continua no disco para uso local. Não versionar `.env` de novo, mesmo que o valor pareça inofensivo.

## RBAC por domínio (implementado em 2026-07-15)

`UserRole` tem 6 valores agora (`PLATFORM_ADMIN`, `MASTER`, `COORDENACAO`, `ENGENHARIA`, `ADMINISTRATIVO`, `USER` — `EDITOR` foi removido), espelhando o backend (ver seção equivalente em `backend/CLAUDE.md`). Matriz de acesso por domínio de negócio, em `hooks/usePermission.ts`:

| Role | Engenharia | Administrativo |
|---|---|---|
| USER | view | view |
| ENGENHARIA | edit | view |
| ADMINISTRATIVO | view | edit |
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
6. ~~Setas decorativas em `TableCompanies.tsx`~~ — removidas na direção visual de 2026-10-23.
8. **`empenho.totalPaid` (lista de empresas) não acompanha as notas fiscais.** A tela de Empresas passou a somar empenhado e liquidado dos contratos (`valorEmpenhado`/`valorLiquidado`, calculados das NFs). Não voltar a usar `totalPaid`.
7. **`ObraDetailPanel.tsx` foi refeito em 2026-09-29** para mostrar a cadeia Contrato → Empenho → OS/Obra: busca `GET /obra/detail/:id` ao abrir (liquidado calculado das NFs; `financial: null` para quem não vê o domínio administrativo, ex.: login EMPRESA, que vê só obra/prazos). Aba Geral com cartões Obra/OS (valor, liquidado, prazo; "Detalhes da obra" abre `ObraInfoModal`), Empenho (valor empenhado, barra esta OS/outras OS/livre, saldo a liquidar e livre para novas OS, vigência) e Contrato (valor total, % empenhado e % utilizado; "Ver empenhos" abre `ContratoEmpenhosModal`); aba Notas Fiscais só da obra; aba Cronograma com `ObraTimeline` (contrato, empenho e obra no mesmo eixo, marcador de hoje e NFs). Histórico abaixo:
   **Redesenho de 2026-09-02** (o usuário achou a tradução literal das imagens de referência "estranha" — pediu para usar a skill `design` e propor algo diferente, com liberdade total de estrutura). O resultado, aprovado pelo usuário via canvas publicado como Artifact, trocou o header escuro por um header claro (tokens normais do app) com uma faixa fina na cor do contrato, e reorganizou o conteúdo em 3 abas — **Geral** (Sobre a obra + Execução Financeira + Contrato), **Notas Fiscais**, **Cronograma** — voltando ao modelo de abas da primeira versão depois de uma iteração intermediária em accordion/scroll único que o usuário achou bagunçada ("muita coisa para scroll"). Campos ainda não implementados (`E-PAG`, `Aditivo Total`, `% Execução Física`, `Variação Físico/Financeiro`, histórico de aditivos de prazo na aba Cronograma) usam o componente `<PendingBadge />` — um selo discreto "Em breve" (cinza, borda tracejada, ícone de relógio) — no lugar do vermelho+negrito da primeira versão (componente `<Missing />`, removido). Não "completar" esses campos com dado inventado — são placeholders esperando modelagem futura (aditivos de contrato, avanço físico de obra). O canvas de referência do redesign está em `https://claude.ai/code/artifact/85fea2ae-a376-4783-8d2c-c9ae094c07ca` (privado, do usuário) — útil para comparar visualmente antes de mexer de novo no layout.

## Modal de visualização (EntityViewer, 2026-10-23)

Todo registro abre no mesmo modal: `components/EntityViewer/EntityViewer.tsx`, montado uma vez no `AppLayout`. Estado em `store/entityViewer.ts`: **pilha** de `{ kind, id }` (`empresa`, `contrato`, `empenho`, `ordemServico`, `obra`, `invoice`). `open(ref)` (clique na linha, Dashboard) troca a pilha; vínculos dentro do modal fazem `push` e o cabeçalho mostra "Voltar para ..." (`back`). A pilha vale só na tela em que foi aberta (`openedAt`): trocar de rota esconde o modal.
- Visualizações: `InvoiceView`, `EmpenhoView`, `ContratoView`, `EmpresaView` (em `components/EntityViewer/`), `OrdemServicoView` (`pages/OrdemServico/`) e `ObraView` (`pages/Obra/`). Todas usam `ViewFrame` (casca: `ModalEntityHeader` + tiles + seções `FormSection` + rodapé Fechar/Editar) e leem o próprio dado nos stores; `useEnsureData(source)` busca a lista se ela ainda não foi carregada (o modal pode abrir fora da página daquele registro). `invoices` e `companies` ganharam a flag `loaded` para isso.
- **Editar**: a página que tem o formulário registra o editor com `useEntityEditor(kind, (id) => ..., podeEditar)`; o modal só mostra "Editar" para tipos registrados na tela aberta.
- **Vínculos**: `useViewerNav().linkTo(kind, id)` devolve o clique, ou `undefined` sem permissão (EMPRESA só abre OS e obra; o cartão vira só leitura).
- Atalhos por URL: `/ordens-servico?os=<id>` abre a OS (notificações); `/ordens-servico?nova=<contrato_id>` abre o cadastro de OS no contrato ("Nova OS neste contrato"); `/notasfiscais?nova=<empenho_id>&novaEmpresa=<company_id>` abre a NF nova no empenho ("Nova nota fiscal" em Empenhos); `/mapa-obras?obra=<id>` abre o painel da obra ("Ver no mapa").
- A tela de pendências da empresa renderiza `OrdemServicoView` direto com `ordemServico` (pode estar bloqueada e sem acesso à lista).
- "Marcar como paga" (`pages/Invoice/MarkPaidDialog.tsx`) reenvia a nota inteira no `PUT /invoices/update/:id` trocando só o status. "Finalizar OS" e "Concluir obra" são `FinalizeOrdemServicoDialog` e `CompleteObraDialog` (menu ⋯ e modal).
- `StepForm`: indicador com pontos de 24px (só a etapa atual com nome) e "Etapa N de M"; o erro de validação aparece dentro da etapa (faixa vermelha) e o foco vai para o primeiro campo vazio, sem toast.

## Login EMPRESA (somente leitura)

Desde 2026-10-01 a empresa contratada vê **Obras**, **Ordens de Serviço** e **Mapa de Obras** (e, desde 2026-10-23, **Pendências de ciência**; ver "Ciência e contestação da OS pela empresa") (`components/Sidebar/empresa-items.ts`; `AppLayout` redireciona qualquer outra rota para `/mapa-obras`). O backend já devolve só o que é da empresa (`GET /obra/list` e `GET /ordem-servico/list` filtram por `empenho.contrato.company_id`). Botões de criar/editar/excluir ficam ocultos pelas checagens de `usePermission` (`canEditEngenharia`, `canEditAdministrativo`, `canCreateOrdemServico`); a aba "Sem obra" (pendência interna) não aparece para ela.

Desde 2026-10-27 (pedido do usuário: "todas as informações, mas só visualização") ela também tem **Medições** no menu: a lista e as telas cheias de orçamento (`OrcamentoLeitura`) e de medições (`MedicaoLeitura` + Baixar PDF), só das próprias OS e só as medições fechadas. Na lista, a aba e o total de "Rascunho aberto" somem para ela. O `AppLayout` aceita as subtelas de um item do menu (`isEmpresaPath`, prefixo), por causa de `/medicoes/:osId/...`. Edição continua impossível: as telas já escolhem leitura pelas `permissoes` da API, e o backend recusa toda escrita.

## Barra de filtros das listagens (NF, OS, Obras — 2026-10-01)

As três listagens usam os mesmos blocos em `src/components/filters/`: `SearchInput`, `ScopeFilterButton` (botão "Filtros" com painel de **empresa → contrato → empenho** em cascata; nível com uma opção só fica escondido, ex.: login EMPRESA) e `FilterSummary` ("N resultados [etiquetas removíveis] · Limpar filtros"). As opções saem da própria lista via `resolveScope(items, getRefs, scope)` de `scope-options.ts` (cada página define o `ScopeRef[]` de um item: OS = um por empenho, obra = os das suas OS, NF = um), que também descarta valores que não existem na tela atual; `matchesScope` filtra. O recorte é compartilhado entre as três telas pelo hook `useScopeFilter` (store Zustand + `?empresa=&contrato=&empenho=` na URL, que tem prioridade). Desde 2026-10-08 o topo de cada card é uma `SummaryStrip` (`components/SummaryStrip.tsx`) com os totais **do que passa pelos filtros e pela busca**: NF = liquidado/pendentes/pagas/vencidas (células clicáveis filtram o status); OS = emitido em OS, liquidado, a liquidar, livre nos empenhos, quitadas; Obras = obras, emitido em OS, liquidado, a liquidar, prazo vencido (em obras, só as OS do recorte entram nos valores); Contratos = contratado, empenhado, liquidado, a liquidar; Empenhos = empenhado, destinado a OS, liquidado, a liquidar; Empresas = empresas, empenhado, liquidado, a liquidar (só busca, sem o botão Filtros). Contratos e Empenhos também usam o `ScopeFilterButton`. Detalhe por item fica no modal de cada um, não na faixa. A tabela recebe `key` com os filtros para voltar à página 1. Obras não mostram status na listagem (a coluna Execução já mostra o andamento); a linha mostra empenho(s) e OS de origem. A NF mostra a coluna Origem (empenho, OS · obra), vinda de `GET /invoices/list`.

## Documento da OS em PDF (2026-10-21)

O modal de visualização da OS (`ViewOrdemServicoModal`) tem o botão "Baixar OS (PDF)", que chama `GET /ordem-servico/document/:id` (`fetchOrdemServicoDocument` na store devolve o blob; `utils/download-file.ts` baixa) e a seção "Documento da OS" com o que está cadastrado (aviso quando a OS antiga tem campos em branco). Os dados vêm de três formulários: **Contrato** (e-PAG, ETP, TR, data-base SINAPI, BDI, endereço, lotes com desconto e fiscais; contrato antigo abre com os campos "A PREENCHER" vazios), **Obra** (seção "Edificação") e **OS** (`OrdemServicoModal`: lote, serviço, prazo em dias com dia da semana de início e término, total com BDI com cálculo ao vivo, fiscais, condições especiais). Cálculos em `pages/OrdemServico/ordem-servico-form-utils.ts`, espelhando o backend (mudou lá, mudar aqui). Número da OS é gerado pelo backend; com um só empenho o valor dele acompanha o valor final calculado (ajustável). A etiqueta `OrdemServicoNumeroTag` não repete "OS" quando o número já começa com ele.

### Cadastros em etapas (2026-10-21)

Os modais de cadastro/edição que passavam da altura da tela viraram formulário em etapas, com o componente `components/StepForm.tsx`: Contrato (Identificação, Valores e vigência, Dados da OS, Lotes, Fiscais, Situação), Obra (Identificação, Edificação e localização, Ordens de serviço, Detalhes, Situação), OS (Contrato, Empenhos e obra, Serviço, Prazo, Valor, Fiscais e condições, Situação), Empenho (Identificação, Contrato, Descrição e vigência, Situação), Nota Fiscal (Empresa e empenho, Número/valor/datas, Descrição [no cadastro, com o resumo do empenho]), Empresa e Organização (Dados, Endereço). "Situação" só aparece na edição. Cada modal monta um array `steps` (`{ id, label, icon, content, validate }`) e passa `onSubmit`; o `StepForm` cuida do indicador, de Voltar/Próximo, de Enter (avança; na última etapa salva) e da validação: avançar valida as etapas puladas e salvar valida todas, levando à primeira com erro (a mensagem vem do `validate`, que devolve texto ou `null`). Na edição há também "Salvar Alterações" em qualquer etapa. Modal novo que ficar maior que a tela deve seguir o mesmo padrão (o modal precisa ser `flex flex-col`); não replicar o `<form>` único com rolagem. Ao mexer em um modal, conferir que cada etapa cabe sem rolagem num notebook (`scrollHeight` x `clientHeight` do `form .overflow-y-auto`).

Na OS nova o **número fica oculto** até escolher o contrato (e o lote, se o contrato tiver lotes): aí aparece com transição (grade `0fr → 1fr`), empurrando a data de emissão, via `GET /ordem-servico/proximo-numero` (`fetchProximoNumero`). É só uma prévia, não reserva o número: o definitivo sai na criação.

## Ciência e contestação da OS pela empresa (2026-10-23)

Regras no backend (`backend/CLAUDE.md`, seção de mesmo nome); `pages/OrdemServico/ordem-servico-ciencia.ts` espelha a fase para a lista e o painel (no modal vale a que vem da API).
- **Modal da OS**: seção "Ciência e tramitação com a empresa" (`TramitacaoSection.tsx`, busca `GET /ordem-servico/:id/tramitacao` ao abrir — é isso que registra a visualização da empresa). Mostra fase, emissão, prazo, visualização e ciência; "Estou ciente" (com `ConfirmModal`) para a empresa; apontamentos com Acatar/Recusar (resposta obrigatória) para a fiscalização; linha do tempo; comentário. O que cada um pode fazer vem em `permissoes` da API. Para a empresa com ciência pendente, aviso no topo do modal (`CienciaPendenteAviso`).
- **Sino** (`components/Notifications/NotificationBell.tsx`) no topo do menu lateral e do cabeçalho mobile, só para quem tem público (EMPRESA ou fiscalização); consulta `GET /notificacoes` a cada 60 s e ao voltar para a aba; clicar marca como lida e abre `/ordens-servico?os=<id>` (a página abre o modal pelo parâmetro).
- **Empresa**: `/pendencias` ("Pendências de ciência" no menu) lista as OS aguardando ciência com o prazo restante, "Abrir OS" e "Estou ciente". `AppLayout` consulta as pendências a cada 60 s; com alguma pendente mostra uma faixa discreta "N OS aguardam a sua ciência"; com prazo **vencido** troca o conteúdo de qualquer rota pela tela de pendências (`bloqueada`). O `defaultFetch` dispara o evento `CIENCIA_PENDENTE_EVENT` quando o backend responde `403 CIENCIA_PENDENTE`, e o `AppLayout` recarrega na hora.
- **Fiscalização**: na lista de OS, texto colorido pequeno ("aguardando ciência (faltam 5 h)", "ciência vencida", "N apontamentos abertos"); no Dashboard, grupo "Ordens de serviço aguardando a empresa" em Atenção (`canTramitarOrdemServico`). Editar uma OS com tramitação avisa que mudar o conteúdo a reemite; o toast diz quando reemitiu.
- `usePermission`: `canDarCienciaOrdemServico`, `canTramitarOrdemServico`. Datas do histórico com `formatDateTimeFull` (com ano).

## Orçamento e medições da OS (2026-10-24; tela própria em 2026-10-26)

Regras no backend (`backend/CLAUDE.md`, seção de mesmo nome). A medição continua pertencendo a uma OS, mas lançar orçamento e medir saiu do modal da OS (deixava o modal carregado) para a tela **Engenharia › Medições** (pedido do usuário, 2026-10-26). Desde 2026-10-27 a empresa acessa a tela só para consulta (ver "Login EMPRESA").
- **Lista `/medicoes`** (`pages/Medicoes/page.tsx` + `MedicoesTable.tsx`): uma linha por OS de `GET /medicao/painel` (`fetchPainel`), com a anatomia de linha padrão: obra · OS (faixa na cor do contrato), orçamento (com "difere do valor da OS"), medido (`MedidoCell`: %, barra com o rascunho mais claro, ritmo frente ao prazo), última medição e os atalhos **Orçamento** e **Medição** (com texto a partir de xl, só ícone antes; "Continuar NN" com rascunho; "Ver ..." para quem só consulta). Abas Ativas / Sem orçamento / Rascunho aberto / Medição concluída / Encerradas (`painel-display.ts`), busca, filtro empresa → contrato → empenho e `SummaryStrip` (orçado, medido, saldo, rascunhos e sem orçamento clicáveis). Clicar na linha abre a OS no `EntityViewer`.
- **Telas cheias** (`Workspace.tsx`: `WorkspacePage`, `WorkspaceHeader` com voltar, obra · OS · empresa · contrato, tiles e abas Orçamento/Medições; `StickyFooter` fixo embaixo com totais e ações). `usePlanilha(osId)` carrega `GET /ordem-servico/:id/orcamento` (que agora traz obra, contrato, empresa e prazo da OS) e expõe `version` para os editores remontarem depois de salvar.
  - `/medicoes/:osId/orcamento` → `OrcamentoEditor` (grade em linhas de `Input`; item medido trava preço/unidade, não sai e tem quantidade mínima; coluna Medido a partir de xl) ou `OrcamentoLeitura` (orçado/medido/saldo, para quem só consulta).
  - `/medicoes/:osId/medicoes/:medicaoId?` → `MedicaoPage`: faixa com todas as medições + "Nova medição"; sem id abre o rascunho, senão a última, senão `nova`. Rascunho/nova em `MedicaoEditor` (período, observações, filtro Todos/Com saldo/Nesta medição, "medir saldo", "Medir todo o saldo", Salvar rascunho, Salvar e fechar, Excluir rascunho); fechada em `MedicaoLeitura` com Baixar PDF, Excluir e Reabrir (os dois só na última, por `podeReabrir`; excluir devolve as quantidades ao saldo).
- **Colar do Excel** (`PasteOrcamentoDialog` + `parse-pasted-budget.ts`): linhas separadas por tabulação (código, descrição, unidade, quantidade, preço; com 4 colunas não há código), números em pt-BR ou com ponto decimal, cabeçalho ignorado, prévia com o erro de cada linha, "Adicionar ao final" ou "Substituir os não medidos", limite de 500 itens. Abre pelo botão ou com Ctrl+V fora de um campo.
- **Total ajustado (2026-10-27)**: no `OrcamentoEditor` o total da linha é um botão (lápis no hover) que abre um campo para digitar o total da planilha de referência; a linha mostra "Total ajustado à planilha: calculado R$ X (±R$ Y) · Usar o calculado". A validação local usa `folgaValorTotal`; item medido por inteiro trava o total. Ao colar do Excel, a 6ª coluna (total) vira total ajustado quando difere por centavos e é erro da linha fora da folga. O `MedicaoEditor` calcula o valor da medição com `valorAcumuladoItem` (`utils/decimal.ts`, espelha o backend; recebe o `valorOrcado`/`valorTotal` do item, que já é o ajustado). `OrcamentoLeitura` marca "(ajustado)".
- **Alterações não salvas**: `hooks/useUnsavedChangesGuard.tsx` (`useBlocker` + `beforeunload`, `ConfirmDialog` "Sair sem salvar?"); `allowNextNavigation()` libera a troca de rota logo depois de salvar.
- **Busca de itens** nas duas grades (`matchesItemSearch`, sem acento nem maiúsculas).
- **Modal da OS** (`OrcamentoMedicoesSection`): só o saldo a medir (barra), a lista de medições (Visualizar / Baixar PDF) e "Abrir em Medições". "Visualizar" leva à tela da medição (a empresa também); `MedicaoLeituraModal` fica para quem não tem a tela. `OrcamentoModal`/`MedicaoModal` foram removidos.
- **Execução física**: `medicao-progress.ts` (`fracaoMedida`, `fracaoPrazo`, `ritmoMedicao`: âmbar com o medido 10 p.p. atrás do prazo, vermelho com 25 p.p.). No painel da obra do Mapa (`IndicatorFields`), "% Exec. Física" (de `execucaoFisica` do `GET /obra/detail/:id`) e "Var. Físico/Financ." (medido − liquidado, em p.p.) deixaram de ser "Em breve"; Aditivo e E-PAG continuam.
- `utils/decimal.ts`: `parseDecimal`/`toDecimalInput`, `sanitizeDecimalInput`, `parseQuantidade`, `formatQuantidade` e `valorItem` (espelha o backend — mudou lá, mudar aqui). Store `store/medicoes.ts` (sem estado), tipos em `types/medicao.ts`. O item ativo do menu também vale nas subrotas (`SidebarGroup`, prefixo).

### Orçamento como base de preço e edição por clique (2026-10-27)

Regras no backend (`backend/CLAUDE.md`, "Orçamento como base de preço da OS").
- **`OrcamentoEditor`**: `SegmentedControl` "Preços com BDI" / "Preços com BDI e desconto" (travado com medição fechada, `permissoes.trocarPrecoBase`). No modo com BDI a coluna mostra o preço informado e, embaixo, "c/ desc. R$ Y" (`precoComDesconto` de `utils/decimal.ts`, espelha o backend e trunca); o total da linha usa o preço com desconto e não há total ajustado. Rodapé: valor da OS, total com BDI e desconto; aviso de quanto o valor da OS vai mudar e de que a OS será reemitida (`reemiteAoMudarValor`). Com mais de um empenho, "Valor por empenho" reparte o valor (soma = orçamento, dentro do saldo livre). "Emitir OS" (`permissoes.emitir`, sem alteração pendente) com `ConfirmDialog`; o `OrcamentoMedicoesSection` do modal da OS tem a mesma ação e o aviso de OS aguardando emissão.
- **`InlineEdit`** (`components/ui`, na vitrine): o valor aparece como texto e vira `Input` ao clicar ou receber foco pelo Tab; Enter/blur fecha, Esc desfaz (`onRevert`); vazio (exceto `optional`) ou inválido fica aberto; `disabled` mostra só o texto. Pedido do usuário: o input sempre aberto dava a impressão de estar sempre editando. Toda a grade do orçamento usa ele.
- **Modal da OS**: a OS nova não pede mais o total com BDI nem valor por empenho (nasce "Aguardando orçamento"; toast manda lançar o orçamento e emitir). Na edição, o modal busca a planilha: com orçamento, a etapa Valor vira resumo só de leitura e os empenhos precisam somar o orçamento (um empenho leva o valor sozinho; vários pedem a repartição); OS antiga sem orçamento mantém o total com BDI e os valores digitados.
- **OS sem lote (2026-10-28)**: aviso âmbar "Sem lote · desconto 0%" no `WorkspaceHeader` e na linha da lista de Medições (`semLote` da API, dica `SEM_LOTE_DICA` em `painel-display.ts`). No modal da OS, ao escolher o lote de uma OS antiga com orçamento só com BDI, o valor do orçamento é recalculado com o desconto do lote (`valorOrcamentoComDesconto` em `utils/decimal.ts`, espelha `aplicarDesconto`); o hint do lote mostra o valor antigo → novo. Com medição fechada, a etapa Contrato barra.
- **Etapas (2026-10-28)**: as quatro telas de orçamento/medição agrupam os itens por etapa (`pages/Medicoes/etapas.ts`: `gruposPorEtapa`, espelho do backend, e `useEtapasRecolhidas`, com as etapas abrindo sozinhas com busca/filtro ou erro de validação). Faixa neutra que abre e fecha: `GroupHeader` (grade do `OrcamentoEditor`, com o nome editável no lugar — grava no blur, `EtapaNome` — e "+" para item na etapa) e `TableGroupRow` (tabelas: **uma célula por coluna**, com as mesmas classes responsivas dos `Th` em `columns` e os subtotais em `values`; não usar `colSpan` maior que as colunas, com o layout fixo ele cria colunas fantasmas). "Nova etapa" e "Adicionar item" (continua a última etapa). Orçamento sem etapa nenhuma continua lista única. Colar do Excel: linha sem código e sem unidade (ou só com um texto) vira título; cada item fica no último título acima dele (`parse-pasted-budget.ts`). Os dois componentes estão na vitrine.
- **Supressão (2026-10-28)**: botão "Supressões" no `OrcamentoEditor` abre `SupressoesDialog` (itens do orçamento por etapa, com busca; o usuário informa quanto de cada item sai do contrato, até a quantidade e sem alcançar o medido). O item continua na grade com a nota vermelha "Suprimido X de Y: vale Z"; o total da linha usa a quantidade efetiva e perde o total ajustado; o rodapé mostra "N supressões (−R$ X)". `OrcamentoLeitura`, `MedicaoEditor` e `MedicaoLeitura` mostram o orçado efetivo com `SupressaoNota` ("−X suprimido", `text-danger-text`) e, no item suprimido por inteiro, `SuprimidoPill` no lugar do saldo/campo (`pages/Medicoes/supressao.tsx`). `quantidadeEfetiva` em `utils/decimal.ts` espelha o backend.
- **Nota fiscal por medição (2026-10-28)**: nos modais de NF (`AddModal`/`EditModal`), escolhida a Obra/OS, o campo "Medição" (`pages/Invoice/MedicaoField.tsx`) lista as medições fechadas dela vindas de `/obra/list-for-invoice` ("Medição 01 · período · valor"); a medição já paga por outra nota ativa não aparece (só a que a própria nota em edição paga), para não confundir. Sem medição livre, o campo some. Escolher a medição preenche e trava o valor; "Sem medição" volta ao valor digitado. Trocar empresa/empenho/OS limpa a medição. A listagem/visualização da NF mostram a medição; na `MedicaoPage` a medição paga mostra "paga pela NF X" e não oferece reabrir/excluir.
- **Regra de desconto (2026-10-28)**: no modo "Preços com BDI", o `OrcamentoEditor` mostra um segundo `SegmentedControl` "Desconto simples" (padrão: trunca o preço com desconto) / "Desconto SCOAM" (trunca o valor do desconto e o total do item), travado com medição fechada. `precoComDesconto(preco, desconto, regra)`, `totalPorRegra` e `valorOrcamentoComDesconto(itens, desconto, regra)` em `utils/decimal.ts` espelham o backend; o `OrdemServicoModal` passa `planilha.regraDesconto` ao recalcular com o lote.
- **Orçamento com um modo só (2026-10-28)**: o seletor "Preços com BDI / com BDI e desconto" saiu; o preço digitado é sempre com BDI e o `OrcamentoEditor` mostra Preço c/ BDI (com "c/ desc." embaixo) · Total c/ BDI (coluna a partir de xl; até lá, embaixo do total) · Total c/ desc.; a coluna Medido foi para 2xl. Rodapé: total c/ BDI · desconto (−R$) · total c/ desconto (valor da OS). Não há mais total ajustado editável: o total gravado (`original` no form) só vale enquanto quantidade, supressão e preço não mudam (espelha `manterTotaisAjustados`). `totalComBdiItem` em `utils/decimal.ts`.
- **Só a tabela (2026-10-29)**: o seletor "Desconto simples / SCOAM" e a dica da regra saíram do `OrcamentoEditor`; a regra vem de `planilha.regraDesconto` (só para calcular) e o payload não a envia. Rodapé: total c/ BDI · total c/ desconto (valor da OS) · itens.
- Fase `AGUARDANDO_EMISSAO` em `ordem-servico-ciencia.ts` e selo "Aguardando orçamento" (`closed`) em `ordem-servico-display.ts`; o `WorkspaceHeader` mostra "Aguardando emissão".

## Saldo a liquidar em OS e Obras (2026-10-08)

Proposta aprovada em `https://claude.ai/artifact/DcYjbW1oo2JVvCV7cBzj6P`. A linha da OS tem como título o **serviço** (nome da obra; sem obra, a descrição do empenho) e o número vira etiqueta (`components/OrdemServicoNumeroTag`). A coluna da direita destaca o valor **a liquidar** (`ordem-servico-balance.ts`: `getBalance` compara em centavos e devolve `open`/`empty`/`paid`/`over`). OS ativa quitada mostra "Finalizar OS" (`FinalizeOrdemServico.tsx`, confirmação no próprio lugar, só `canEditAdministrativo`) e entra na aba "Quitadas". No topo da lista fica a `SummaryStrip` (ver "Barra de filtros" acima). O painel da OS começa pelo saldo e mostra a tabela por empenho (`liquidado`/`empenhoComprometido` de cada vínculo, vindos de `GET /ordem-servico/list`). Em Obras, a coluna Saldo usa `getObraBalance`; obra sem saldo em nenhuma OS mostra "Obra paga" e "Concluir obra" (`CompleteObraButton`, `canEditEngenharia`, usa `PUT /obra/update-status`, que grava `dataConclusao`).

## Convenções a manter

- `formatCurrency`/`formatDate`/`formatDateTime` vêm sempre de `utils/format-currency.ts` — não redefinir localmente (já foi um problema real: ~15 redefinições idênticas espalhadas, unificadas nesta sessão).
- Datas sem horário (início/previsão de obra, vigência de contrato/empenho) são gravadas como meia-noite UTC: formatar com `formatDateOnly` (fuso UTC). `formatDate` usa o fuso local e no Brasil mostra o **dia anterior** para esses campos; ela só serve para timestamps reais (`createdAt`, `dataConclusao`). Só `ViewOrdemServicoModal` usa `formatDateOnly` até agora — os demais usos de `formatDate` em campos de data pura ainda estão com o problema.
- Nomes de props/exports em português quando o domínio é português (`empresa`, `empenho`), mas nomenclatura de código/arquivos em inglês para conceitos técnicos (`Invoice`, não `NotaFiscal` — já foi renomeado propositalmente).
- Ícones de ordenação/paginação só devem aparecer se a funcionalidade realmente existir — já houve casos de ícone decorativo sem `onClick` (`ArrowUp`/`ArrowDown` em `TableCompanies.tsx`/`EmpenhoTable.tsx`); ao copiar um componente de tabela como modelo, verificar se o sort é real antes de reusar.
- Qualquer alteração visual de peso (paleta, tipografia, densidade de espaçamento) além do design system atual deve ser proposta e confirmada antes de implementar — ver seção Paleta acima.
- Navegação interna sempre com `Link` (ou `useNavigate`) de `react-router` — nunca tag `<a href>` crua. Projeto usa React Router v7, não Next.js (não existe `next/link` aqui); `<a>` força reload de página inteira e perde o estado do SPA.
- Não existe mais componente de breadcrumb — foi removido (`components/Breadcrumb.tsx` deletado, uso retirado de todas as páginas) por ocupar espaço vertical sem agregar navegação real além do que a sidebar já oferece. Não reintroduzir sem alinhar antes.
- **Todo `<button>` (e qualquer elemento clicável) deve ter a classe `cursor-pointer` do Tailwind.** Não é automático no Tailwind v4 (Preflight não força `cursor: pointer` em botões, diferente do comportamento nativo esperado do HTML). Os botões de fechar (`X`) e "Cancelar" de vários modais (`RegisterOrEditCompany`, `ObraModal`, `DeleteObraModal`, `DeleteCompany`, `DeleteEmpenhoModal`, `EmpenhoModal`, `ModalEmpenho`) estavam sem essa classe — corrigido. Ao criar um componente novo com botão (modal, linha de tabela, paginação), conferir que **todo** botão (não só o de submit/ação principal) tem `cursor-pointer`.
  - Os botões de paginação (seta anterior/próxima, ícones `ChevronLeft`/`ChevronRight`) em `TableCompanies.tsx`, `InvoiceTable.tsx`, `ObraTable.tsx`, `TenantTable.tsx`, `EmpenhoPagination.tsx` e `ApprovalTable.tsx` tinham esse mesmo gap (só `disabled:cursor-not-allowed`, sem `cursor-pointer` pro estado habilitado) — encontrado e corrigido nesta sessão nos 6 arquivos (12 botões). Se copiar esse bloco de paginação como modelo pra uma tabela nova, já sai com `cursor-pointer`.
- Tabelas de listagem (`TableCompanies`, `InvoiceTable`, `EmpenhoTable`, etc.) devem sempre renderizar `<table>`/`<thead>` mesmo com lista vazia — o estado vazio é um bloco condicional **depois** de `</table>` (checando o array já paginado), nunca um `return` antecipado que substitui a tabela inteira. `EmpenhoTable.tsx` tinha esse desvio (cabeçalho sumia junto com o corpo quando vazio) e foi corrigido para bater com o padrão das outras tabelas.
- Campos de busca/filtro usam `SearchInput` (`components/filters`) ou `Input` com `icon={Search}` — nunca classes de input copiadas à mão (ver "Design system").
