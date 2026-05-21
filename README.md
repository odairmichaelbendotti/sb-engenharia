# SB Engenharia - Sistema de Gestão de Obras Públicas

<div align="center">

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

</div>

Um sistema completo de gestão de obras públicas, desenvolvido com tecnologias modernas e arquitetura bem estruturada. Otimizado para facilitar o gerenciamento integrado de projetos de infraestrutura pública, desde o planejamento até a execução e fiscalização.

## ✨ Principais Características

- 🏗️ **Gestão Completa de Obras**: Planejamento, execução e acompanhamento de projetos de obras públicas
- 🏢 **Cadastro de Empresas**: Gerenciamento de empresas contratadas com validação de dados
- 💰 **Controle Financeiro**: Empenhos, liquidações e gestão de créditos
- 📄 **Documentação Fiscal**: Notas fiscais integradas e medições de obras
- 🔐 **Segurança**: Autenticação JWT com criptografia de senhas
- 📊 **Dashboard Intuitivo**: Interface responsiva e amigável
- ⚡ **Performance**: Otimizado com Vite e Prisma
- 🎯 **Type-Safe**: TypeScript em todo o stack

## 📋 Visão Geral

O SB Engenharia é uma aplicação fullstack especializada em gestão de obras públicas que permite gerenciar:

- **Obras Públicas**: Registro, acompanhamento e gestão completa de projetos de obras públicas
- **Empresas**: Cadastro de empresas contratadas para execução das obras
- **Empenhos**: Acompanhamento de compromissos financeiros e empenhos de crédito
- **Notas Fiscais**: Gestão de documentos fiscais e medições de obras

## 🏗️ Arquitetura

O projeto segue uma **arquitetura em camadas** (Clean Architecture) com separação clara entre frontend e backend, garantindo escalabilidade, testabilidade e manutenibilidade.

```
sb-engenharia/
├── backend/          # API REST com Express + TypeScript
├── frontend/         # SPA React com Vite
└── LICENSE
```

### 🔙 Backend - Clean Architecture

**Stack**: Node.js 18+ | Express 5 | TypeScript 5.9 | Prisma 7 | PostgreSQL

**Camadas**:

| Camada             | Responsabilidade                                              |
| ------------------ | ------------------------------------------------------------- |
| **Domain**         | Entidades, lógica de negócio pura (sem dependências externas) |
| **Application**    | Casos de uso, orquestração de lógica                          |
| **Infrastructure** | Implementações técnicas (BD, criptografia, APIs externas)     |
| **HTTP**           | Controllers, rotas, middleware, tratamento de requisições     |

**Recursos principais**:

- ✅ Autenticação com JWT (Jason Web Tokens)
- 🔒 Criptografia de senhas com bcrypt
- 🌐 CORS habilitado e configurável
- 🗄️ ORM Prisma com migrations automáticas
- 📝 TypeScript para segurança de tipos
- 🏗️ Arquitetura em camadas bem definida
- 🍪 Cookie Parser para gerenciamento de sessões
- 📦 Dependency Injection (em implementações específicas)

### 🎨 Frontend - Modern React Stack

**Stack**: React 19 | Vite 7 | TypeScript 5.9 | Tailwind CSS 4 | Zustand 5

**Recursos principais**:

- 📱 Interface responsiva (mobile-first)
- 🎨 Styling com Tailwind CSS (utility-first)
- 🗂️ Roteamento com React Router v7
- 🎯 Estado global com Zustand
- 🏗️ Componentes reutilizáveis
- ⚡ Build otimizado com Vite
- 🔍 Validação com TypeScript
- ✨ Ícones com Lucide React
- 🔔 Notificações com Sonner
- 🎯 ESLint para qualidade de código

## 🚀 Como Iniciar

### Pré-requisitos

- **Node.js** 18.0.0 ou superior ([download](https://nodejs.org/))
- **npm** 9+ ou **yarn** 3.6+
- **PostgreSQL** 12+ ([download](https://www.postgresql.org/))
- **Git** ([download](https://git-scm.com/))

### ⚙️ Instalação Rápida

1. **Clone o repositório**

```bash
git clone <repository-url>
cd sb-engenharia
```

2. **Configure o Backend**

```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env  # (ou crie manualmente o arquivo .env)
```

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sb_engenharia"
JWT_SECRET="sua_chave_secreta_muito_segura_aqui"
NODE_ENV="development"
PORT="3000"
```

3. **Setup do Banco de Dados**

```bash
# Execute as migrations do Prisma
npx prisma migrate dev --name init

# (Opcional) Abra o Prisma Studio para visualizar dados
npx prisma studio
```

4. **Configure o Frontend**

```bash
cd ../frontend
npm install

# (Opcional) Crie arquivo .env se houver variáveis específicas
# cp .env.example .env
```

### 🔄 Executar em Desenvolvimento

**Terminal 1 - Backend**:

```bash
cd backend
npm run dev
# Server rodando em http://localhost:3000
```

**Terminal 2 - Frontend**:

```bash
cd frontend
npm run dev
# Aplicação rodando em http://localhost:5173
```

Acesse a aplicação em **http://localhost:5173**

## 💻 Guia de Desenvolvimento

### Backend

**Scripts disponíveis**:

```bash
cd backend

# Desenvolvimento com auto-reload
npm run dev

# Build para produção
npm run build

# Iniciar servidor em produção
npm start
```

**Endpoints principais da API**:

| Método | Endpoint             | Descrição                 |
| ------ | -------------------- | ------------------------- |
| GET    | `/api/companies`     | Listar todas as empresas  |
| POST   | `/api/companies`     | Criar nova empresa        |
| GET    | `/api/companies/:id` | Obter detalhes da empresa |
| GET    | `/api/empenhos`      | Listar empenhos           |
| POST   | `/api/empenhos`      | Criar empenho             |
| GET    | `/api/notas-fiscais` | Listar notas fiscais      |
| POST   | `/api/notas-fiscais` | Criar nota fiscal         |
| GET    | `/api/obras`         | Listar obras públicas     |
| POST   | `/api/obras`         | Criar obra                |

**Estrutura de pastas do Backend**:

```
backend/src/
├── @types/              # Type definitions customizadas
├── domain/              # Camada de Domínio
│   ├── entities/        # Entidades (Company, User, etc.)
│   ├── repositories/    # Interfaces de repositórios
│   ├── cryptography/    # Contratos de criptografia
│   ├── polices/         # Políticas de acesso
│   └── errors/          # Erros de negócio
├── application/         # Camada de Aplicação
│   └── usecases/        # Casos de uso por domínio
│       ├── company/
│       ├── empenho/
│       ├── notaFiscal/
│       └── user/
├── infrastructure/      # Camada de Infraestrutura
│   ├── database/        # Configuração de BD
│   ├── cryptography/    # Implementações de criptografia
│   ├── prisma/          # Prisma client
│   └── errors/          # Erros de infraestrutura
├── http/                # Camada HTTP
│   ├── controllers/     # Controladores por recurso
│   ├── middleware/      # Middleware Express
│   ├── routes/          # Definição de rotas
│   └── server.ts        # Configuração do servidor
├── utils/               # Funções auxiliares
└── server.ts            # Entry point
```

### Frontend

**Scripts disponíveis**:

```bash
cd frontend

# Desenvolvimento com hot reload
npm run dev

# Build otimizado para produção
npm run build

# Preview do build local
npm run preview

# Verificar qualidade de código
npm run lint
```

**Principais páginas**:

| Página        | Rota             | Descrição                    |
| ------------- | ---------------- | ---------------------------- |
| Dashboard     | `/`              | Visão geral e estatísticas   |
| Empresas      | `/empresas`      | Gerenciamento de empresas    |
| Empenhos      | `/empenhos`      | Acompanhamento de empenhos   |
| Notas Fiscais | `/notas-fiscais` | Gestão de documentos fiscais |
| Obras         | `/obras`         | Acompanhamento de obras      |
| Medições      | `/medicoes`      | Registros de medições        |

**Estrutura de pastas do Frontend**:

```
frontend/src/
├── components/          # Componentes reutilizáveis
│   ├── Layouts/         # Componentes de layout
│   ├── Sidebar/         # Barra de navegação
│   ├── Breadcrumb.tsx
│   └── StatCard.tsx
├── pages/               # Páginas da aplicação
│   ├── auth/            # Páginas de autenticação
│   ├── Dashboard.tsx
│   ├── Empresas.tsx
│   ├── Empenhos.tsx
│   ├── NotasFiscais.tsx
│   ├── Obras.tsx
│   └── Medicoes.tsx
├── services/            # Serviços HTTP/API
│   └── api.ts           # Cliente HTTP configurado
├── store/               # Estado global (Zustand)
│   ├── companies.ts
│   ├── empenhos.ts
│   ├── invoices.ts
│   ├── obras.ts
│   └── user.ts
├── hooks/               # Custom hooks React
├── types/               # Definições de tipos
├── utils/               # Funções auxiliares
├── routes.tsx           # Configuração de rotas
├── main.tsx             # Entry point
└── index.css            # Estilos globais
```

## � Autenticação e Segurança

### Fluxo de Autenticação

O sistema implementa **JWT (JSON Web Tokens)** para autenticação stateless:

```
1. Usuário faz login com email/senha
   ↓
2. Backend valida credenciais
   ↓
3. Senha comparada com hash bcrypt
   ↓
4. Se válido, gera JWT assinado
   ↓
5. Token retornado ao cliente
   ↓
6. Cliente armazena token
   ↓
7. Requisições subsequentes incluem token no header: Authorization: Bearer <token>
   ↓
8. AuthMiddleware valida token em cada requisição
```

### Medidas de Segurança

- 🔒 Senhas criptografadas com bcrypt (salt rounds: 10)
- 🔑 JWT com expiração configurável
- 🌐 CORS restritivo
- 🛡️ TypeScript para segurança de tipos
- 🔐 Variáveis sensíveis em arquivo `.env`

## 🔧 Configuração Avançada

### Variáveis de Ambiente

**Backend** (arquivo `.env` na pasta `/backend`):

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sb_engenharia"

# JWT
JWT_SECRET="sua_chave_secreta_muito_segura_aqui_minimo_32_caracteres"
JWT_EXPIRATION="7d"

# Server
NODE_ENV="development"  # development | production
PORT="3000"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Logs
LOG_LEVEL="debug"  # debug | info | warn | error
```

**Frontend** (arquivo `.env` na pasta `/frontend` - opcional):

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME="SB Engenharia"
```

### Gerenciamento de Migrations (Prisma)

```bash
cd backend

# Criar nova migration após alterar schema.prisma
npx prisma migrate dev --name descricao_da_mudanca

# Aplicar migrations pendentes
npx prisma migrate deploy

# Verificar status das migrations
npx prisma migrate status

# Reverter última migration (dev only)
npx prisma migrate resolve --rolled-back <migration_name>

# Resetar banco de dados (⚠️ CUIDADO - deleta dados)
npx prisma migrate reset

# Abrir Prisma Studio (visualizador gráfico de dados)
npx prisma studio
```

### Desenvolvimento com Prisma

```bash
# Gerar Prisma Client (executado automaticamente em npm install)
npx prisma generate

# Validar schema.prisma
npx prisma validate

# Formatar schema.prisma
npx prisma format
```

## 📦 Build e Deployment

### Build Local

**Backend**:

```bash
cd backend
npm run build
# Gera a pasta dist/ com código compilado
```

**Frontend**:

```bash
cd frontend
npm run build
# Gera a pasta dist/ com arquivos otimizados (JS, CSS, HTML)
```

### Deployment

#### Backend em Produção

```bash
cd backend

# 1. Build
npm run build

# 2. Definir variáveis de ambiente
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."

# 3. Iniciar servidor
npm start
# ou usar PM2
pm2 start dist/server.js --name "sb-backend"
```

#### Frontend em Produção

**Opção 1 - Servir arquivos estáticos**:

```bash
cd frontend
npm run build
# Upload a pasta dist/ para seu servidor web (nginx, apache, etc)
```

**Opção 2 - Vercel (recomendado para este projeto)**:

- Commit seu código no Git
- Conecte seu repositório no [Vercel](https://vercel.com)
- Vercel detectará automaticamente que é um projeto Vite/React
- Deploy automático em cada push

Veja o arquivo [vercel.json](frontend/vercel.json) para configurações específicas.

### Performance

- ✅ Frontend: Vite oferece bundle pequeno (~200KB gzipped)
- ✅ Backend: Prisma otimiza queries ao banco
- ✅ Imagens: Considere usar CDN para servir assets
- ✅ Cache: Implemente cache nos endpoints de API

## 🧪 Testes

Atualmente, o projeto não possui testes automatizados configurados. Para adicionar:

- **Backend**: Jest ou Vitest (recomendado)
- **Frontend**: Vitest + React Testing Library

Contribuições com testes são bem-vindas! 🎉

## 📚 Documentação Adicional

- [Backend README](backend/README.md) (se disponível)
- [Frontend README](frontend/README.md) (se disponível)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)

## 📝 Licença

Este projeto está licenciado sob **ISC** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir com o projeto:

1. **Fork** o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: add AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request** com descrição clara das mudanças

### Padrão de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova feature
- `fix:` - Correção de bug
- `docs:` - Alterações em documentação
- `style:` - Formatação, espaçamento (sem mudanças de lógica)
- `refactor:` - Refatoração de código
- `perf:` - Melhorias de performance
- `test:` - Adição ou alteração de testes
- `chore:` - Alterações em configuração ou dependências

## 📞 Suporte

Para suporte ou dúvidas sobre o projeto:

- 📧 Entre em contato com a equipe de desenvolvimento
- 🐛 Abra uma [Issue](../../issues) no repositório
- 💬 Inicie uma [Discussion](../../discussions)

## 🗺️ Roadmap

Funcionalidades planejadas para o futuro:

- [ ] Testes automatizados (unit e integration)
- [ ] Documentação de API com Swagger/OpenAPI
- [ ] Sistema de permissões mais granulares
- [ ] Exportação de relatórios em PDF
- [ ] Integração com sistemas de assinatura digital
- [ ] Mobile app nativo
- [ ] Dark mode
- [ ] Notificações em tempo real (WebSocket)
- [ ] Exportação de dados em Excel

---

<div align="center">

**Desenvolvido com ❤️ para gestão pública**

Última atualização: Maio de 2026

</div>
