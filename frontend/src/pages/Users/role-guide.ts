import type { User } from "../../../types/user";

// Cola de perfis exibida na tela de Usuários. Precisa acompanhar a matriz do
// backend (DomainAccessPolicy) e o hook usePermission — mudou lá, muda aqui.

export type GuideLevel = "edit" | "create" | "view" | "none" | "partial";

export type GuideColumn = {
  key: "usuarios" | "organizacoes" | "administrativo" | "ordemServico" | "obras" | "acessoEmpresa" | "mapa";
  label: string;
  hint: string;
};

export const GUIDE_COLUMNS: GuideColumn[] = [
  { key: "usuarios", label: "Usuários", hint: "Aprovar/recusar cadastros e mudar perfil" },
  { key: "organizacoes", label: "Organizações", hint: "Cadastro de unidades e resumo da plataforma" },
  { key: "administrativo", label: "Administrativo", hint: "Empresas, Contratos, Empenhos e Notas Fiscais" },
  { key: "ordemServico", label: "Ordem de Serviço", hint: "Cadastro de OS" },
  { key: "obras", label: "Obras", hint: "Cadastrar, editar, mudar status e excluir obras" },
  { key: "acessoEmpresa", label: "Acesso de empresa", hint: "Botão “Criar acesso” na tela de Empresas" },
  { key: "mapa", label: "Mapa de Obras", hint: "Mapa e painel de detalhes da obra" },
];

export type GuideCell = { level: GuideLevel; text: string };

export type RoleGuide = {
  role: User["role"];
  title: string;
  summary: string;
  abilities: string[];
  cells: Record<GuideColumn["key"], GuideCell>;
};

const EDIT: GuideCell = { level: "edit", text: "Edita" };
const VIEW: GuideCell = { level: "view", text: "Vê" };
const NONE: GuideCell = { level: "none", text: "—" };
const CREATE: GuideCell = { level: "create", text: "Cria" };
const FULL_MAP: GuideCell = { level: "view", text: "Completo" };

// Ordenado do topo da hierarquia para a base
export const ROLE_GUIDE: RoleGuide[] = [
  {
    role: "PLATFORM_ADMIN",
    title: "Autoridades do Alto Comando que gerenciam unidades",
    summary: "gerencia todas as unidades e o administrativo; em Obras só visualiza",
    abilities: [
      "Cadastra organizações e vê o resumo de cada uma no Dashboard",
      "Aprova ou recusa cadastros de qualquer organização e vê todos os usuários",
      "Pode dar qualquer perfil, inclusive Admin da Plataforma",
      "CRUD completo no administrativo",
      "Em Obras só visualiza",
    ],
    cells: {
      usuarios: { level: "edit", text: "Todas as unidades" },
      organizacoes: EDIT,
      administrativo: EDIT,
      ordemServico: EDIT,
      obras: VIEW,
      acessoEmpresa: CREATE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "MASTER",
    title: "Gestor de uma unidade",
    summary: "gerencia usuários da unidade e tem CRUD completo no administrativo e em Obras",
    abilities: [
      "Aprova e recusa cadastros e muda perfis, só dentro da própria organização",
      "Não pode conceder o perfil Admin da Plataforma",
      "CRUD completo no administrativo",
      "CRUD completo em Obras",
    ],
    cells: {
      usuarios: { level: "partial", text: "Própria unidade" },
      organizacoes: NONE,
      administrativo: EDIT,
      ordemServico: EDIT,
      obras: EDIT,
      acessoEmpresa: CREATE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "COORDENACAO",
    title: "Chefe de uma divisão",
    summary: "mesmos poderes do Master — a diferença é só hierárquica",
    abilities: [
      "Mesmos poderes do Master; serve só para indicar a hierarquia",
      "Aprova e recusa cadastros e muda perfis, só dentro da própria organização",
      "Não pode conceder o perfil Admin da Plataforma",
      "CRUD completo no administrativo e em Obras",
    ],
    cells: {
      usuarios: { level: "partial", text: "Própria unidade" },
      organizacoes: NONE,
      administrativo: EDIT,
      ordemServico: EDIT,
      obras: EDIT,
      acessoEmpresa: CREATE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "ADMINISTRATIVO",
    title: "Setor administrativo",
    summary: "CRUD de Empresas, Contratos, Empenhos, OS e NFs; em Obras só visualiza",
    abilities: [
      "CRUD de Empresas, Contratos, Empenhos, Ordens de Serviço e Notas Fiscais",
      "Cria o acesso das empresas",
      "Em Obras só visualiza",
    ],
    cells: {
      usuarios: NONE,
      organizacoes: NONE,
      administrativo: EDIT,
      ordemServico: EDIT,
      obras: VIEW,
      acessoEmpresa: CREATE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "ENGENHARIA",
    title: "Setor de engenharia",
    summary: "CRUD de Obras; no administrativo só visualiza e cadastra Ordem de Serviço",
    abilities: [
      "CRUD de Obras (cadastrar, editar, mudar status e excluir)",
      "Cria o acesso das empresas",
      "No administrativo só visualiza, mas pode cadastrar Ordem de Serviço",
    ],
    cells: {
      usuarios: NONE,
      organizacoes: NONE,
      administrativo: VIEW,
      ordemServico: CREATE,
      obras: EDIT,
      acessoEmpresa: CREATE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "USER",
    title: "Usuário",
    summary: "só visualiza",
    abilities: ["Só visualiza — não cadastra, edita nem exclui nada"],
    cells: {
      usuarios: NONE,
      organizacoes: NONE,
      administrativo: VIEW,
      ordemServico: VIEW,
      obras: VIEW,
      acessoEmpresa: NONE,
      mapa: FULL_MAP,
    },
  },
  {
    role: "EMPRESA",
    title: "Login da empresa contratada",
    summary: "vê só as obras da própria empresa no mapa, sem valores",
    abilities: [
      "Não é atribuído aqui: é criado em Empresas → “Criar acesso”, já aprovado e com senha gerada",
      "Todas as outras telas redirecionam para o Mapa, que mostra só as obras da empresa",
      "O painel da obra não mostra valores, saldos nem notas fiscais",
    ],
    cells: {
      usuarios: NONE,
      organizacoes: NONE,
      administrativo: NONE,
      ordemServico: NONE,
      obras: NONE,
      acessoEmpresa: NONE,
      mapa: { level: "partial", text: "Só da empresa" },
    },
  },
];

export const ROLE_GUIDE_BY_ROLE = Object.fromEntries(
  ROLE_GUIDE.map((guide) => [guide.role, guide]),
) as Record<User["role"], RoleGuide>;

export const GUIDE_RULES = [
  "Ninguém pode mudar o próprio perfil.",
  "Só é possível mudar o perfil de usuários já aprovados.",
  "Master e Coordenação só agem sobre usuários da própria unidade e não concedem nem alteram o perfil Admin da Plataforma.",
];
