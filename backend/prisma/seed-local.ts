// Dados FICTÍCIOS para testar o sistema num banco local (nunca no Supabase).
//
// Uso, com o banco local já criado e o schema aplicado (npx prisma db push):
//   DATABASE_URL="postgresql://usuario:senha@localhost:5432/sb_eng_local" npx tsx prisma/seed-local.ts
//
// Logins de teste (todos com a senha "senha-local-123"):
//   teste@local.dev     MASTER   — vê e edita tudo
//   engenharia@local.dev ENGENHARIA — edita Engenharia, só vê o Administrativo
//   empresa@local.dev   EMPRESA  — a AEJ: só vê as obras e OS dos próprios contratos
//
// Roda uma vez por banco: se a base "BAFL" já existir, não faz nada.
import bcrypt from "bcrypt";
import { prisma } from "../src/infrastructure/prisma/prisma.js";

const host = new URL(process.env.DATABASE_URL ?? "postgresql://invalid").hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error(`O seed local só roda em banco local (DATABASE_URL aponta para "${host}")`);
}

if (await prisma.tenant.findUnique({ where: { apelido: "BAFL" } })) {
  console.log('A base "BAFL" já existe: nada foi criado.');
  await prisma.$disconnect();
  process.exit(0);
}

// Valores em reais → centavos (é como o banco guarda)
const c = (reais: number) => Math.round(reais * 100);
const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const tenant = await prisma.tenant.create({
  data: {
    name: "Base Aérea de Florianópolis",
    apelido: "BAFL",
    cnpj: "00394429000968",
    cep: "88049000",
    city: "Florianópolis",
    state: "SC",
    address: "Av. Santos Dumont, s/n - Tapera",
    phone: "4832295000",
    email: "protocolo.bafl@bafl.aer.mil.br",
  },
});

// Empresas
const aej = await prisma.company.create({
  data: {
    name: "AEJ ENGENHARIA LTDA",
    cnpj: "54960587000100",
    cep: "88700000",
    city: "Tubarão",
    state: "SC",
    address: "Rua das Obras, 100",
    phone: "48999004882",
    email: "contato@aej.example.com",
  },
});
const driving = await prisma.company.create({
  data: {
    name: "DRIVING CONSULTORIA",
    cnpj: "21575266000132",
    cep: "90010000",
    city: "Porto Alegre",
    state: "RS",
    address: "Av. Exemplo, 500",
    phone: "51994443419",
    email: "contato@driving.example.com",
  },
});
await prisma.tenantCompany.createMany({
  data: [
    { tenant_id: tenant.id, company_id: aej.id },
    { tenant_id: tenant.id, company_id: driving.id },
  ],
});

// Usuários
const password = await bcrypt.hash("senha-local-123", 10);
await prisma.user.createMany({
  data: [
    { name: "Usuário de Teste", email: "teste@local.dev", password, role: "MASTER", approved: true, tenant_id: tenant.id },
    { name: "Engenharia Teste", email: "engenharia@local.dev", password, role: "ENGENHARIA", approved: true, tenant_id: tenant.id },
    { name: "Empresa AEJ", email: "empresa@local.dev", password, role: "EMPRESA", approved: true, tenant_id: tenant.id, company_id: aej.id },
  ],
});

// Contrato 1: já com todos os dados do documento da OS, lotes e fiscais
const contrato1 = await prisma.contrato.create({
  data: {
    identificador: "14/2026",
    descricaoCurta: "Manutenção Predial",
    valor: c(5441118.97),
    dataInicio: dia("2026-08-04"),
    dataFim: dia("2027-08-03"),
    cor: "#4478b6",
    tenant_id: tenant.id,
    company_id: aej.id,
    ePag: "67272.002300/2026-41",
    etp: "79/2025",
    termoReferencia: "26/2026",
    dataBaseSinapi: "Maio/2026 - Florianópolis (Não Desonerada)",
    endereco: "Base Aérea de Florianópolis - Av. Santos Dumont, s/n, CEP 88049-000",
    bdi: 21.19,
    lotes: {
      create: [
        { numero: 1, nome: "ADM", desconto: 37.6 },
        { numero: 2, nome: "PNR", desconto: 26.6 },
        { numero: 3, nome: "GSAU-FL", desconto: 30.6 },
        { numero: 4, nome: "DO", desconto: 24.8 },
        { numero: 5, nome: "GSD-FL", desconto: 24.7 },
      ],
    },
    fiscais: {
      create: [
        { tipo: "TECNICO", nome: "1º SGT FLORIANO", ramal: "5174", email: "florianocaagf@fab.mil.br" },
        { tipo: "TECNICO", nome: "2º SGT EXEMPLO", ramal: "5175", email: "exemplo@fab.mil.br" },
        { tipo: "ADMINISTRATIVO", nome: "1º TEN BENDOTTI", ramal: "5174", email: "bendottiomb@fab.mil.br" },
      ],
    },
  },
  include: { lotes: true, fiscais: true },
});

// Contrato 2: do jeito dos contratos antigos em produção (dados do documento ainda "A PREENCHER", sem lotes nem fiscais)
const contrato2 = await prisma.contrato.create({
  data: {
    identificador: "26/BAFL/2025",
    descricaoCurta: "Escopo 1",
    valor: c(545384.12),
    dataInicio: dia("2025-08-12"),
    dataFim: dia("2026-12-28"),
    cor: "#3c8567",
    tenant_id: tenant.id,
    company_id: driving.id,
  },
});

// Quatro empenhos: dois em cada contrato
const empenho606 = await prisma.empenho.create({
  data: {
    numero: "2026NE000606",
    description: "Manutenção Predial",
    category: "MANUTENCAO_PREDIAL",
    startAt: dia("2026-07-17"),
    endAt: dia("2026-12-31"),
    value: c(1000000),
    tenant_id: tenant.id,
    contrato_id: contrato1.id,
  },
});
await prisma.empenho.create({
  data: {
    numero: "2026NE000605",
    description: "Recuperação de imóveis residenciais",
    category: "MANUTENCAO_PREDIAL",
    startAt: dia("2026-07-17"),
    endAt: dia("2026-11-30"),
    value: c(489850),
    tenant_id: tenant.id,
    contrato_id: contrato1.id,
  },
});
const empenho652 = await prisma.empenho.create({
  data: {
    numero: "2025NE000652",
    description: "Manutenção por escopo",
    category: "MANUTENCAO_PREDIAL",
    startAt: dia("2025-08-25"),
    endAt: dia("2026-08-25"),
    value: c(300000),
    tenant_id: tenant.id,
    contrato_id: contrato2.id,
  },
});
const empenho653 = await prisma.empenho.create({
  data: {
    numero: "2025NE000653",
    description: "DECEA fase 01",
    category: "MANUTENCAO_PREDIAL",
    startAt: dia("2025-09-10"),
    endAt: dia("2026-12-31"),
    value: c(200000),
    tenant_id: tenant.id,
    contrato_id: contrato2.id,
  },
});

// Obras: a E-050 com os dados da edificação; as demais como as antigas (sem eles)
const obraE050 = await prisma.obra.create({
  data: {
    nome: "Manutenções na Edificação E-050 (SCOAM)",
    identificacaoPatrimonial: "E-050",
    tipo: "REFORMA",
    descricao: "Manutenção da cobertura e dos ambientes internos",
    responsavelTecnico: "TEN Bendotti - CREA/SC 163098-5",
    latitude: -27.6711,
    longitude: -48.5476,
    idPatrimonialCompleto: "SC.027-67272-E-050",
    apelido: "SCOAM-FL",
    areaConstruida: 60.06,
    estadoConservacao: "Bom",
    tenant_id: tenant.id,
  },
});
const obraE004 = await prisma.obra.create({
  data: {
    nome: "Manutenções na Edificação E-004 (IES)",
    identificacaoPatrimonial: "E-004",
    tipo: "REFORMA",
    descricao: "Manutenção geral",
    responsavelTecnico: "TEN Bendotti - CREA/SC 163098-5",
    latitude: -27.6745,
    longitude: -48.5502,
    tenant_id: tenant.id,
  },
});
const obraE044 = await prisma.obra.create({
  data: {
    nome: "Manutenção E-044",
    identificacaoPatrimonial: "E-044",
    tipo: "MANUTENCAO_PREDIAL",
    descricao: "Manutenção predial",
    responsavelTecnico: "TEN Bendotti - CREA/SC 163098-5",
    tenant_id: tenant.id,
  },
});
const obraE007 = await prisma.obra.create({
  data: {
    nome: "Manutenção E-007",
    identificacaoPatrimonial: "E-007",
    tipo: "MANUTENCAO_PREDIAL",
    descricao: "Manutenção predial",
    responsavelTecnico: "TEN Bendotti - CREA/SC 163098-5",
    tenant_id: tenant.id,
  },
});

const lote = (numero: number) => contrato1.lotes.find((l) => l.numero === numero)!;
const tecnico = contrato1.fiscais.find((f) => f.tipo === "TECNICO")!;
const administrativo = contrato1.fiscais.find((f) => f.tipo === "ADMINISTRATIVO")!;

// OS nova, lote 4, com todos os dados do documento (o valor é o da OS-04-01 do modelo oficial)
const os010L4 = await prisma.ordemServico.create({
  data: {
    numero: "OS 010/BAFL/2026-L4",
    sequencia: 10,
    anoNumeracao: 2026,
    valor: c(38013.98),
    empenho_id: empenho606.id,
    tenant_id: tenant.id,
    obra_id: obraE050.id,
    lote_id: lote(4).id,
    dataInicio: dia("2026-08-19"),
    dataPrevisaoTermino: dia("2026-10-06"),
    dataEmissao: dia("2026-08-18"),
    prazoDias: 49,
    prazoMobilizacaoDias: 7,
    totalComBdi: c(50547.24),
    setorRequisitante: "SCOAM-FL",
    urgencia: "PROGRAMADA",
    dataVistoria: dia("2026-07-31"),
    descricaoProblema:
      "A edificação E-050 do SCOAM-FL apresenta deterioração generalizada de sua cobertura: telhas de fibrocimento desgastadas e trincadas com infiltrações, estrutura do sistema de cobertura comprometida pela umidade e sistema de captação de águas pluviais deficiente. É necessária a reconstrução completa do sistema de cobertura com telha metálica termoacústica, além da recuperação dos ambientes internos (forro, luminárias e metais sanitários).",
    fiscalSetorial: "SO RAPHAEL C. – 5012 / raphaelrcc@fab.mil.br",
    fiscalTecnico_id: tecnico.id,
    fiscalAdministrativo_id: administrativo.id,
    condicoesEspeciais: ["Trabalhos em altura só com autorização prévia (PTA) da Fiscalização."],
    empenhos: { create: [{ empenho_id: empenho606.id, valor: c(38013.98) }] },
  },
});

// Outra OS nova, lote 1 (a numeração é por lote: também começa em 010), numa obra antiga sem dados da edificação
await prisma.ordemServico.create({
  data: {
    numero: "OS 010/BAFL/2026-L1",
    sequencia: 10,
    anoNumeracao: 2026,
    valor: c(18720),
    empenho_id: empenho606.id,
    tenant_id: tenant.id,
    obra_id: obraE004.id,
    lote_id: lote(1).id,
    dataInicio: dia("2026-09-01"),
    dataPrevisaoTermino: dia("2026-10-20"),
    dataEmissao: dia("2026-08-28"),
    prazoDias: 50,
    prazoMobilizacaoDias: 7,
    totalComBdi: c(30000),
    setorRequisitante: "IES",
    urgencia: "URGENCIA",
    dataVistoria: dia("2026-08-20"),
    descricaoProblema: "Reparos na instalação elétrica e troca de luminárias do prédio da IES.",
    fiscalSetorial: "3º SGT EXEMPLO – 5100 / exemplo.setor@fab.mil.br",
    fiscalTecnico_id: tecnico.id,
    fiscalAdministrativo_id: administrativo.id,
    condicoesEspeciais: [],
    empenhos: { create: [{ empenho_id: empenho606.id, valor: c(18720) }] },
  },
});

// OS no padrão antigo, só com o que existia antes do documento (o PDF sai com esses campos em branco)
await prisma.ordemServico.create({
  data: {
    numero: "OS-05-01-BAFL-2026",
    valor: c(37115.21),
    empenho_id: empenho606.id,
    tenant_id: tenant.id,
    obra_id: obraE004.id,
    dataInicio: dia("2026-07-29"),
    dataPrevisaoTermino: dia("2026-09-15"),
    empenhos: { create: [{ empenho_id: empenho606.id, valor: c(37115.21) }] },
  },
});
const os2025_03 = await prisma.ordemServico.create({
  data: {
    numero: "OS 03/BAFL/2025",
    valor: c(225825.44),
    empenho_id: empenho652.id,
    tenant_id: tenant.id,
    obra_id: obraE044.id,
    dataInicio: dia("2025-08-04"),
    dataPrevisaoTermino: dia("2026-08-16"),
    empenhos: { create: [{ empenho_id: empenho652.id, valor: c(225825.44) }] },
  },
});
await prisma.ordemServico.create({
  data: {
    numero: "OS 02/BAFL/2025",
    valor: c(150317.89),
    empenho_id: empenho653.id,
    tenant_id: tenant.id,
    obra_id: obraE007.id,
    dataInicio: dia("2025-08-13"),
    dataPrevisaoTermino: dia("2026-08-16"),
    empenhos: { create: [{ empenho_id: empenho653.id, valor: c(150317.89) }] },
  },
});

// Notas fiscais, para a OS mostrar saldo a liquidar (e o empenho e a obra, o executado)
const notas = [
  { numero: "NF-1001", description: "Medição 1 - cobertura E-050", value: 25000, status: "PAGO" as const, vencimento: "2026-09-10", empenho: empenho606, empresa: aej, obra: obraE050, os: os010L4 },
  { numero: "NF-1002", description: "Medição 2 - cobertura E-050", value: 7162.89, status: "PENDENTE" as const, vencimento: "2026-10-30", empenho: empenho606, empresa: aej, obra: obraE050, os: os010L4 },
  { numero: "NF-0201", description: "Medição 1 - E-044", value: 100000, status: "PAGO" as const, vencimento: "2025-11-15", empenho: empenho652, empresa: driving, obra: obraE044, os: os2025_03 },
];
for (const nota of notas) {
  await prisma.invoice.create({
    data: {
      numero: nota.numero,
      description: nota.description,
      value: c(nota.value),
      status: nota.status,
      vencimento: dia(nota.vencimento),
      empenho_id: nota.empenho.id,
      company_id: nota.empresa.id,
      obra_id: nota.obra.id,
      ordemServico_id: nota.os.id,
    },
  });
}
// Executado do empenho e da obra = soma das notas não canceladas (a aplicação recalcula assim)
await prisma.empenho.update({ where: { id: empenho606.id }, data: { totalPaid: c(25000 + 7162.89) } });
await prisma.empenho.update({ where: { id: empenho652.id }, data: { totalPaid: c(100000) } });
await prisma.obra.update({ where: { id: obraE050.id }, data: { valorExecutado: c(25000 + 7162.89) } });
await prisma.obra.update({ where: { id: obraE044.id }, data: { valorExecutado: c(100000) } });

console.log("Seed local criado: 2 empresas, 2 contratos, 4 empenhos, 4 obras, 5 OS, 3 notas e 3 logins.");
await prisma.$disconnect();
