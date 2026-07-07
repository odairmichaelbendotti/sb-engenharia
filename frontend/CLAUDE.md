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
    create-company.ts, empenho.ts, empresa.ts, invoice.ts,
    list-companies.ts, list-empenhos.ts, obra.ts, user.ts

  src/
    main.tsx, routes.tsx, index.css

    components/
      StatCard.tsx            — card de estatística compartilhado (variante `compact`)
      Breadcrumb.tsx           — compartilhado
      Auth/RequireAuth.tsx     — guard de rota (ver seção Auth)
      Layouts/AppLayout.tsx    — só visual: Sidebar + MobileSidebar + Outlet
      Sidebar/                 — Sidebar.tsx (desktop), MobileSidebar.tsx (drawer mobile),
                                  adm-items.ts + eng-items.ts (itens de menu)

    pages/
      Dashboard.tsx      — ⚠️ ainda usa mockData hardcoded, não busca dos stores reais (pendência conhecida)
      Empresas.tsx, Invoices.tsx, Empenhos.tsx, Obras.tsx  — páginas principais
      Medicoes.tsx       — stub vazio, sem funcionalidade
      auth/              — SignIn.tsx, SignUp.tsx, PendingApproval.tsx
      Company/           — componentes da página Empresas (SEM index.ts/barrel)
      Empenho/           — componentes da página Empenhos (COM index.ts/barrel)
      Invoice/           — componentes da página Invoices (COM index.ts/barrel)
      Obra/              — componentes da página Obras (COM index.ts/barrel)

    store/               — Zustand: user.ts, companies.ts, empenhos.ts, invoices.ts, obras.ts
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
  ├─ / → Dashboard
  ├─ /empresas → Empresas
  ├─ /notasfiscais → Invoices   {/* rota NÃO foi renomeada junto com o componente */}
  ├─ /empenhos → Empenhos
  ├─ /medicoes → Medicoes
  └─ /obras → Obras

/signin → SignIn      (fora do RequireAuth)
/signup → SignUp      (fora do RequireAuth)
```

Sem rota 404/catch-all. `RequireAuth` é elemento pai único de todas as rotas protegidas — monta uma vez por navegação vinda de fora do grupo (ex.: de `/signin` para `/`), não remonta ao navegar entre páginas já dentro do grupo.

## Autenticação e sessão

Sessão via cookie httpOnly (JWT), **sem persistência local no Zustand** — o estado `user` sempre começa `null` no boot do app e é restaurado chamando `GET /me`.

- **`RequireAuth`** (`components/Auth/RequireAuth.tsx`) — único guard de auth do app. No mount: chama `fetchUser()`; mostra spinner enquanto `checking`; se falhar, `navigate("/signin")`; se `user` existe mas `!user.approved`, renderiza `<PendingApproval />`; senão renderiza `children` (`AppLayout`). **Não duplicar essa checagem em páginas individuais** — já foi removida de `Dashboard.tsx`, que tinha um guard próprio redundante.
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

`services/api.ts` (`defaultFetch`) fixa `Content-Type: application/json`; **`credentials: "include"` não tem default**, precisa ser passado em cada chamada que exige sessão — checar isso ao adicionar uma chamada nova (é a causa mais comum de "por que minha rota autenticada retorna 401").

## Variáveis de ambiente

Só uma: `VITE_HOST` (ex.: `http://localhost:4000/api`), lida em `services/api.ts`. Ver `.env.example`.

**`frontend/.env` estava versionado no git até esta sessão** — foi removido do tracking (`git rm --cached`) e adicionado ao `.gitignore`; o arquivo continua no disco para uso local. Não versionar `.env` de novo, mesmo que o valor pareça inofensivo.

## Pendências conhecidas (documentadas, não "corrigir de surpresa")

1. **`Dashboard.tsx` usa `mockData` hardcoded** — não busca nada dos stores reais. Se for corrigir, confirmar escopo antes (toca layout inteiro da home).
2. **`EmpenhoPagination.tsx`** existe e está no barrel de `Empenho/`, mas não é usado em `Empenhos.tsx` — a tabela de empenhos não pagina hoje.
3. Rota `/notasfiscais` não foi renomeada para `/invoices` junto com o componente — mudar a URL pública é uma decisão de produto, não só refactor, perguntar antes.
4. `src/assets/images/vertical.jpg` não é referenciado em lugar nenhum — asset órfão.
5. `README.md` ainda é o boilerplate padrão do Vite, não customizado. (`index.html` já tem título "SB Engenharia" e favicon próprio — resolvido.)
6. `Company/` é a única pasta de página sem `index.ts`/barrel — inconsistente com `Empenho/`, `Invoice/`, `Obra/`.

## Convenções a manter

- `formatCurrency`/`formatDate`/`formatDateTime` vêm sempre de `utils/format-currency.ts` — não redefinir localmente (já foi um problema real: ~15 redefinições idênticas espalhadas, unificadas nesta sessão).
- Nomes de props/exports em português quando o domínio é português (`empresa`, `empenho`), mas nomenclatura de código/arquivos em inglês para conceitos técnicos (`Invoice`, não `NotaFiscal` — já foi renomeado propositalmente).
- Ícones de ordenação/paginação só devem aparecer se a funcionalidade realmente existir — já houve casos de ícone decorativo sem `onClick` (`ArrowUp`/`ArrowDown` em `TableCompanies.tsx`/`EmpenhoTable.tsx`); ao copiar um componente de tabela como modelo, verificar se o sort é real antes de reusar.
- Qualquer alteração visual de peso (paleta, tipografia, densidade de espaçamento) deve ser proposta e confirmada antes de implementar — ver seção Paleta acima.
- Navegação interna sempre com `Link` (ou `useNavigate`) de `react-router` — nunca tag `<a href>` crua. Projeto usa React Router v7, não Next.js (não existe `next/link` aqui); `<a>` força reload de página inteira e perde o estado do SPA. Corrigido em `Breadcrumb.tsx`, que usava `<a href="/">`.
