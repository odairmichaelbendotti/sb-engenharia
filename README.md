# SB Engenharia - Sistema de Gestão

Um sistema completo de gestão para empresas de engenharia, desenvolvido com tecnologias modernas e arquitetura bem estruturada.

## 📋 Visão Geral

O SB Engenharia é uma aplicação fullstack que permite gerenciar:

- **Empresas**: Cadastro e gerenciamento de empresas com dados como CNPJ, endereço, telefone
- **Empenhos**: Acompanhamento de compromissos financeiros
- **Notas Fiscais**: Gestão de documentos fiscais
- **Obras**: Registro e acompanhamento de projetos/obras

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas com separação clara entre frontend e backend:

```
sb-engenharia/
├── backend/          # API REST com Express
├── frontend/         # Interface React com Vite
└── LICENSE
```

### Backend

**Stack**: Node.js | Express | TypeScript | Prisma | PostgreSQL

Estrutura do código:

- `src/domain/` - Entidades e regras de negócio
- `src/application/` - Casos de uso (usecases)
- `src/infrastructure/` - Implementações técnicas (BD, criptografia)
- `src/http/` - Camada HTTP (controllers, routes, middleware)
- `src/utils/` - Funções auxiliares

**Recursos principais**:

- Autenticação com JWT
- Criptografia de senhas com bcrypt
- CORS habilitado
- Prisma para ORM e migrations
- TypeScript para segurança de tipos

### Frontend

**Stack**: React 19 | Vite | TypeScript | Tailwind CSS | Zustand

Estrutura do código:

- `src/components/` - Componentes reutilizáveis
- `src/pages/` - Páginas da aplicação
- `src/services/` - Chamadas de API
- `src/store/` - Estado global (Zustand)
- `src/hooks/` - Custom hooks
- `src/types/` - Tipos TypeScript
- `src/utils/` - Funções utilitárias

**Recursos principais**:

- Interface responsiva com Tailwind CSS
- Roteamento com React Router
- Ícones com Lucide React
- Notificações com Sonner
- Estado global com Zustand
- ESLint para qualidade de código

## 🚀 Como Iniciar

### Pré-requisitos

- **Node.js** 18+ e npm/yarn
- **PostgreSQL** 12+ (ou compatível)
- **Git**

### Instalação

1. **Clone o repositório**

```bash
git clone <repository-url>
cd sb-engenharia
```

2. **Instale as dependências do backend**

```bash
cd backend
npm install
```

3. **Configure o banco de dados**

```bash
# Crie um arquivo .env no diretório backend
DATABASE_URL="postgresql://user:password@localhost:5432/sb_engenharia"
JWT_SECRET="sua_chave_secreta_aqui"
```

4. **Execute as migrations do Prisma**

```bash
npx prisma migrate dev
```

5. **Instale as dependências do frontend**

```bash
cd ../frontend
npm install
```

6. **Configure o frontend (se necessário)**
   Crie um arquivo `.env` no diretório frontend se precisar de variáveis de ambiente específicas.

## 💻 Desenvolvimento

### Backend

```bash
cd backend

# Iniciar servidor em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor em produção
npm start
```

**Endpoints principais**:

- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Criar empresa
- `GET /api/empenhos` - Listar empenhos
- `GET /api/notas-fiscais` - Listar notas fiscais
- `GET /api/obras` - Listar obras

### Frontend

```bash
cd frontend

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Verificar linting
npm run lint
```

A aplicação estará disponível em `http://localhost:5173` (Vite default).

## 📁 Estrutura de Pastas Detalhada

### Backend

```
backend/
├── src/
│   ├── @types/           # Type definitions customizadas
│   ├── application/      # Casos de uso da aplicação
│   │   └── usecases/
│   │       ├── company/
│   │       ├── empenho/
│   │       ├── notaFiscal/
│   │       └── user/
│   ├── domain/           # Lógica de negócio
│   │   ├── entities/     # Entidades do domínio
│   │   ├── repositories/ # Interfaces de repositórios
│   │   ├── cryptography/ # Contratos de criptografia
│   │   ├── polices/      # Políticas de acesso
│   │   └── errors/       # Erros de domínio
│   ├── infrastructure/   # Implementações técnicas
│   │   ├── database/     # Conexão e configuração BD
│   │   ├── cryptography/ # Implementações de criptografia
│   │   ├── prisma/       # Prisma client e migrations
│   │   └── errors/       # Erros de infraestrutura
│   ├── http/             # Camada HTTP
│   │   ├── controllers/  # Controladores
│   │   ├── middleware/   # Middleware Express
│   │   ├── routes/       # Definição de rotas
│   │   └── server.ts     # Servidor principal
│   ├── utils/            # Funções auxiliares
│   ├── generated/        # Código gerado (Prisma)
│   └── server.ts         # Entry point
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend

```
frontend/
├── src/
│   ├── components/       # Componentes React
│   │   ├── Layouts/      # Componentes de layout
│   │   ├── Sidebar/      # Sidebar da aplicação
│   │   ├── Breadcrumb.tsx
│   │   └── StatCard.tsx
│   ├── pages/            # Páginas da aplicação
│   │   ├── auth/         # Páginas de autenticação
│   │   ├── Dashboard.tsx
│   │   ├── Empresas.tsx
│   │   ├── Empenhos.tsx
│   │   ├── NotasFiscais.tsx
│   │   ├── Obras.tsx
│   │   └── Medicoes.tsx
│   ├── services/         # Serviços HTTP/API
│   ├── store/            # Estado global (Zustand)
│   ├── hooks/            # Custom hooks
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Funções utilitárias
│   ├── routes.tsx        # Configuração de rotas
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── package.json
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação:

1. Usuário faz login com credenciais
2. Backend valida e gera um JWT
3. JWT é armazenado no cliente
4. Requisições subsequentes incluem o JWT
5. AuthMiddleware valida o token

## 🔧 Configuração Avançada

### Variáveis de Ambiente

**Backend (.env)**

```
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=sua_chave_secreta_muito_segura
NODE_ENV=development
PORT=3000
```

**Frontend (.env)**

```
VITE_API_URL=http://localhost:3000/api
```

### Prisma

Operações comuns:

```bash
# Criar uma nova migration
npx prisma migrate dev --name nome_da_migration

# Verificar status das migrations
npx prisma migrate status

# Abrir Prisma Studio (visualizador de BD)
npx prisma studio

# Gerar Prisma Client
npx prisma generate
```

## 📦 Build para Produção

### Backend

```bash
cd backend
npm run build
# Isso irá gerar a pasta dist/ com o código compilado
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Isso irá gerar a pasta dist/ com os arquivos otimizados
```

## 🧪 Testes

Atualmente, o projeto não possui testes automatizados configurados. Para adicionar:

- Backend: Jest ou Vitest recomendados
- Frontend: Vitest + React Testing Library

## 📝 Licença

Este projeto está licenciado sob ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

Para contribuir com o projeto:

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📞 Suporte

Para suporte ou dúvidas sobre o projeto, entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Maio de 2026
