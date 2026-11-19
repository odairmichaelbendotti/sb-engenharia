import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import type { Server } from "node:http";
import { Client } from "pg";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { dadosAlteracao } from "../../../domain/fiscalizacao.js";

const testUrl = process.env.FISCALIZACAO_TEST_DATABASE_URL;
const suite = testUrl ? describe : describe.skip;
suite("Fiscalização — migração, API e persistência em PostgreSQL isolado", () => {
  let admin: Client;
  let db: Client;
  let prisma: typeof import("../../prisma/prisma.js").prisma;
  let repository: InstanceType<typeof import("./PrismaFiscalizacaoRepository.js").PrismaFiscalizacaoRepository>;
  let osRepository: InstanceType<typeof import("./PrismaOrdemServicoRepository.js").PrismaOrdemServicoRepository>;
  let server: Server;
  let base: string;
  let token: (id: string) => string;
  let antigoFiscal: string;
  let novoFiscal: string;
  let novoVinculo: string;
  const dbname = `fiscalizacao_test_${Date.now()}`;
  const user: AuthenticatedUser = { id: "master", name: "Gestor", email: "master@example.com", approved: true, role: "MASTER", tenant_id: "a" };
  const alteracao = dadosAlteracao({ vigencia: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date()), motivo: "Portaria 123 — teste de substituição" });
  async function request(path: string, id: string, body?: object, method = "POST") {
    const response = await fetch(`${base}/api/fiscalizacao${path}`, {
      method: body ? method : "GET", headers: { Cookie: `auth=${token(id)}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  }
  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Use um PostgreSQL local de testes.");
    admin = new Client({ connectionString: testUrl }); await admin.connect();
    await admin.query(`CREATE DATABASE "${dbname}"`);
    url.pathname = `/${dbname}`;
    db = new Client({ connectionString: url.toString() }); await db.connect();
    await db.query(await readFile(new URL("../../../../tests/fixtures/pre-fiscalizacao.sql", import.meta.url), "utf8"));
    await db.query(`
      INSERT INTO "Tenant" (id,name,apelido,cnpj,cep,city,state,address,phone,email) VALUES
        ('a','Unidade A','a','1','1','Florianópolis','SC','Rua A','1','a@example.com'),
        ('b','Unidade B','b','2','2','Brasília','DF','Rua B','2','b@example.com');
      INSERT INTO "User" (id,name,email,password,role,approved,tenant_id) VALUES
        ('original-user','Fiscal Original','original@example.com','unused','ENGENHARIA',true,'a'),
        ('original-b','Fiscal Outra Unidade','ORIGINAL@example.com','unused','ENGENHARIA',true,'b');
      INSERT INTO "Company" (id,name,cnpj,cep,city,state,address,phone,email) VALUES ('empresa','Empresa','3','3','Cidade','SC','Rua','1','e@example.com');
      INSERT INTO "Contrato" (id,identificador,"descricaoCurta",valor,"dataInicio","dataFim",tenant_id,company_id) VALUES
        ('ca','Contrato A','Obra A',1000000,'2026-01-01','2027-01-01','a','empresa'),
        ('ca2','Contrato A2','Obra A2',1000000,'2026-01-01','2027-01-01','a','empresa'),
        ('cb','Contrato B','Obra B',1000000,'2026-01-01','2027-01-01','b','empresa');
      INSERT INTO "FiscalContrato" (id,tipo,nome,ramal,email,contrato_id) VALUES
        ('antigo','TECNICO','Fiscal Original','123',' ORIGINAL@Example.com ','ca'),
        ('antigo2','TECNICO','Fiscal Original','123','original@example.com','ca2'),
        ('fb','TECNICO','Fiscal Outra Unidade','456','original@example.com','cb');
      INSERT INTO "Empenho" (id,numero,description,category,"startAt","endAt",value,tenant_id,contrato_id) VALUES
        ('ea','EA','Serviço','MANUTENCAO_PREDIAL','2026-01-01','2027-01-01',1000000,'a','ca'),
        ('eb','EB','Serviço B','MANUTENCAO_PREDIAL','2026-01-01','2027-01-01',1000000,'b','cb');
      INSERT INTO "OrdemServico" (id,numero,valor,tenant_id,empenho_id,"fiscalTecnico_id",status,"aguardandoEmissao") VALUES
        ('os1','OS 1',100,'a','ea','antigo','ATIVO',false), ('os2','OS 2',100,'a','ea','antigo','ATIVO',true),
        ('osfim','OS encerrada',100,'a','ea','antigo','FINALIZADO',false), ('osb','OS B',100,'b','eb','fb','ATIVO',false);
    `);
    await db.query(await readFile(new URL("../../../../prisma/manual-migrations/2026-11-19-fiscalizacao.sql", import.meta.url), "utf8"));
    await db.query(await readFile(new URL("../../../../prisma/manual-migrations/2026-11-19-fiscalizacao-usuarios.sql", import.meta.url), "utf8"));
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = "fiscalizacao-isolated-integration-test";
    ({ prisma } = await import("../../prisma/prisma.js"));
    const { PrismaFiscalizacaoRepository } = await import("./PrismaFiscalizacaoRepository.js");
    const { PrismaOrdemServicoRepository } = await import("./PrismaOrdemServicoRepository.js");
    repository = new PrismaFiscalizacaoRepository(); osRepository = new PrismaOrdemServicoRepository();
    for (const role of ["MASTER", "COORDENACAO", "PLATFORM_ADMIN", "ADMINISTRATIVO", "ENGENHARIA", "USER", "EMPRESA"] as const) {
      await prisma.user.create({ data: { id: role.toLowerCase(), name: role, email: `${role}@example.com`, password: "unused", role, approved: true, tenant_id: "a" } });
    }
    await prisma.user.createMany({ data: [
      { id: "nova-user", name: "Nova Fiscal", email: "nova@example.com", ramal: "789", password: "unused", role: "ENGENHARIA", approved: true, tenant_id: "a" },
      { id: "sem-ramal", name: "Fiscal sem ramal", email: "semramal@example.com", password: "unused", role: "USER", approved: true, tenant_id: "a" },
      { id: "pendente", name: "Pendente", email: "pendente@example.com", password: "unused", role: "USER", approved: false, tenant_id: "a" },
      { id: "outro-user", name: "Usuário da Unidade B", email: "outro@example.com", password: "unused", role: "USER", approved: true, tenant_id: "b" },
    ] });
    const { TokenGenerator } = await import("../../cryptography/TokenGenerator.js");
    const generator = new TokenGenerator(); token = (id) => generator.generate({ id });
    const { default: express } = await import("express");
    const { default: cookieParser } = await import("cookie-parser");
    const { FiscalizacaoRoutes } = await import("../../../http/routes/FiscalizacaoRoutes.js");
    const app = express(); app.use(express.json(), cookieParser()); app.use("/api", FiscalizacaoRoutes);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address(); if (!address || typeof address === "string") throw new Error("No HTTP address");
    base = `http://127.0.0.1:${address.port}`;
  }, 30000);
  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (prisma) await prisma.$disconnect();
    if (db) await db.end();
    if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${dbname}" WITH (FORCE)`); await admin.end(); }
  });

  it("migra pessoas por unidade/e-mail sem alterar as designações e fotografa os documentos antigos", async () => {
    expect(await prisma.fiscal.count()).toBe(2);
    const a = await prisma.fiscalContrato.findUniqueOrThrow({ where: { id: "antigo" } });
    const a2 = await prisma.fiscalContrato.findUniqueOrThrow({ where: { id: "antigo2" } });
    antigoFiscal = a.fiscal_id!; expect(a.fiscal_id).toBe(a2.fiscal_id);
    expect((await prisma.fiscal.findUniqueOrThrow({ where: { id: antigoFiscal } })).user_id).toBe("original-user");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "original-user" } })).ramal).toBe("123");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "original-b" } })).ramal).toBe("456");
    expect((await osRepository.getDocumentData("os1"))?.fiscalTecnico?.nome).toBe("Fiscal Original");
    expect((await prisma.ordemServico.findUniqueOrThrow({ where: { id: "os2" } })).fiscaisEmissao).toBeNull();
  });
  it("protege a API por perfil e unidade, inclusive a leitura", async () => {
    for (const role of ["administrativo", "engenharia", "user", "empresa"]) {
      expect((await request("", role)).status).toBe(403);
      expect((await request("/substituicoes", role, {})).status).toBe(403);
    }
    for (const role of ["master", "coordenacao"]) {
      const result = await request("", role); expect(result.status).toBe(200);
      expect(result.data.unidades).toHaveLength(1);
      expect(result.data.ordens.some((os: { id: string }) => os.id === "osb")).toBe(false);
      expect((await request("?tenant_id=b", role)).status).toBe(400);
    }
    expect((await request("?tenant_id=b", "platform_admin")).data.fiscais[0].nome).toBe("Fiscal Outra Unidade");
  });
  it("cadastra e vincula um fiscal, bloqueando duplicação e vínculos entre unidades", async () => {
    const body = { tenant_id: "a", user_id: "nova-user", nome: "Nome adulterado", email: "adulterado@example.com", ramal: "999", ativo: true, motivo: "Designação", vigencia: alteracao.vigencia.toISOString().slice(0, 10) };
    const result = await request("/fiscais", "coordenacao", body); expect(result.status).toBe(200); novoFiscal = result.data.id;
    expect(result.data).toMatchObject({ user_id: "nova-user", nome: "Nova Fiscal", email: "nova@example.com", ramal: "789", tenant_id: "a" });
    expect((await request("/fiscais", "master", body)).status).toBe(400);
    expect((await request("/designacoes", "master", { ...body, fiscal_id: novoFiscal, contrato_id: "cb", tipo: "TECNICO" })).status).toBe(400);
    const link = await request("/designacoes", "master", { ...body, fiscal_id: novoFiscal, contrato_id: "ca", tipo: "TECNICO" });
    expect(link.status).toBe(200); novoVinculo = link.data.id;
    await expect(repository.vincular(user, "a", novoFiscal, "ca", "TECNICO", alteracao)).rejects.toThrow("já possui");
  });
  it("preserva nomes nos documentos emitidos quando o cadastro é corrigido", async () => {
    await prisma.user.update({ where: { id: "original-user" }, data: { name: "Fiscal Corrigido" } });
    await repository.save(user, "a", antigoFiscal, { user_id: "original-user", ativo: true }, alteracao);
    expect((await osRepository.getDocumentData("os1"))?.fiscalTecnico?.nome).toBe("Fiscal Original");
    expect((await osRepository.getDocumentData("os2"))?.fiscalTecnico?.nome).toBe("Fiscal Corrigido");
    expect((await osRepository.getDocumentData("osfim"))?.fiscalTecnico?.nome).toBe("Fiscal Original");
  });
  it("não inativa nem encerra designação com OS em andamento", async () => {
    await expect(repository.encerrar(user, "a", "antigo", alteracao)).rejects.toThrow("Substitua");
    await expect(repository.save(user, "a", antigoFiscal, { user_id: "original-user", ativo: false }, alteracao)).rejects.toThrow("Substitua");
  });
  it("recusa substituições de outro contrato, outro tipo e seleção desatualizada sem alterar nenhuma OS", async () => {
    await expect(repository.substituir(user, "a", "ca", "TECNICO", "antigo", novoVinculo, ["os1", "osb"], alteracao)).rejects.toThrow("seleção");
    await expect(repository.substituir(user, "a", "ca", "ADMINISTRATIVO", "antigo", novoVinculo, ["os1"], alteracao)).rejects.toThrow("designação ativa");
    await expect(repository.substituir(user, "a", "ca", "TECNICO", "antigo", novoVinculo, ["osfim"], alteracao)).rejects.toThrow("seleção");
    expect((await prisma.ordemServico.findUniqueOrThrow({ where: { id: "os1" } })).fiscalTecnico_id).toBe("antigo");
  });
  it("substitui somente as OS escolhidas, mantém o documento e grava autor/motivo nas duas trilhas", async () => {
    await repository.substituir(user, "a", "ca", "TECNICO", "antigo", novoVinculo, ["os1"], alteracao);
    expect((await prisma.ordemServico.findUniqueOrThrow({ where: { id: "os1" } })).fiscalTecnico_id).toBe(novoVinculo);
    expect((await prisma.ordemServico.findUniqueOrThrow({ where: { id: "os2" } })).fiscalTecnico_id).toBe("antigo");
    expect((await osRepository.getDocumentData("os1"))?.fiscalTecnico?.nome).toBe("Fiscal Original");
    expect(await prisma.ordemServicoEvento.findFirst({ where: { ordemServico_id: "os1", autor_id: "master" } })).toMatchObject({ texto: expect.stringContaining("Portaria 123") });
    expect(await prisma.fiscalizacaoHistorico.findFirst({ where: { acao: "RESPONSAVEL_SUBSTITUIDO" } })).toMatchObject({ autor_id: "master", autorNome: "Gestor", motivo: alteracao.motivo });
    await expect(repository.substituir(user, "a", "ca", "TECNICO", "antigo", novoVinculo, ["os1"], alteracao)).rejects.toThrow("seleção");
  });
  it("mantém os vínculos na edição comum do contrato e permite encerrar após substituir todas as OS", async () => {
    const { PrismaContratoRepository } = await import("./PrismaContratoRepository.js");
    const contrato = await prisma.contrato.findUniqueOrThrow({ where: { id: "ca" } });
    await new PrismaContratoRepository().update("ca", { ...contrato, dataInicio: "2026-01-01", dataFim: "2027-01-01", fiscais: [], lotes: [] });
    expect(await prisma.fiscalContrato.count({ where: { contrato_id: "ca" } })).toBe(2);
    await repository.substituir(user, "a", "ca", "TECNICO", "antigo", novoVinculo, ["os2"], alteracao);
    await repository.encerrar(user, "a", "antigo", alteracao);
    expect((await prisma.fiscalContrato.findUniqueOrThrow({ where: { id: "antigo" } })).ativo).toBe(false);
    expect((await prisma.ordemServico.findUniqueOrThrow({ where: { id: "osfim" } })).fiscalTecnico_id).toBe("antigo");
  });
  it("grava os novos fiscais na próxima emissão e preserva os documentos já emitidos", async () => {
    const { registrarEmissao } = await import("./tramitacao-tx.js");
    await prisma.$transaction(async (tx) => {
      await registrarEmissao(tx, "os2", { tipo: "EMITIDA", emitidaEm: new Date(), cienciaPrazoAte: new Date(),
        autor: { id: user.id, nome: user.name, perfil: user.role, empresa: null } });
    });
    expect((await osRepository.getDocumentData("os2"))?.fiscalTecnico?.nome).toBe("Nova Fiscal");
    expect((await osRepository.getDocumentData("os1"))?.fiscalTecnico?.nome).toBe("Fiscal Original");
  });
  it("não permite trocar os fiscais pela edição geral da OS", async () => {
    const { UpdateOrdemServicoUseCase } = await import("../../../application/usecases/ordem-servico/UpdateOrdemServicoUseCase.js");
    const { PrismaEmpenhoRepository } = await import("./PrismaEmpenhoRepository.js");
    const { PrismaObraRepository } = await import("./PrismaObraRepository.js");
    const usecase = new UpdateOrdemServicoUseCase(osRepository, new PrismaEmpenhoRepository(), new PrismaObraRepository());
    await expect(usecase.execute({ user, ordemServicoId: "os1", data: { fiscalTecnico_id: "antigo" } as Parameters<typeof usecase.execute>[0]["data"] })).rejects.toThrow("Gestão → Fiscalização");
  });
  it("o seletor expõe apenas usuários aprovados internos da unidade, sem credenciais", async () => {
    const result = await request("", "coordenacao");
    const ids = result.data.usuarios.map((u: { id: string }) => u.id);
    expect(ids).toContain("nova-user"); expect(ids).toContain("original-user");
    for (const id of ["outro-user", "original-b", "pendente", "empresa"]) expect(ids).not.toContain(id);
    for (const pessoa of result.data.usuarios) {
      expect(Object.keys(pessoa).sort()).toEqual(["email", "id", "name", "ramal", "role"]);
    }
    const outra = await request("?tenant_id=b", "platform_admin");
    expect(outra.data.usuarios.map((u: { id: string }) => u.id)).toContain("outro-user");
    expect(outra.data.usuarios.map((u: { id: string }) => u.id)).not.toContain("nova-user");
  });
  it("rejeita usuários de outra unidade, pendentes e empresas mesmo com payload forjado", async () => {
    const body = { tenant_id: "a", ativo: true, vigencia: alteracao.vigencia.toISOString().slice(0, 10), motivo: "Designação" };
    for (const user_id of ["outro-user", "original-b", "pendente", "empresa", "inexistente"]) {
      const result = await request("/fiscais", "master", { ...body, user_id });
      expect(result.status).toBe(400); expect(result.data.message).toContain("desta unidade");
    }
    expect((await request(`/fiscais/${novoFiscal}`, "master", { ...body, user_id: "sem-ramal" }, "PUT")).status).toBe(400);
  });
  it("permite selecionar um usuário sem ramal e garante um cadastro por pessoa/unidade", async () => {
    const fiscal = await repository.save(user, "a", null, { user_id: "sem-ramal", ativo: true }, alteracao);
    expect(fiscal.ramal).toBe(""); expect(fiscal.nome).toBe("Fiscal sem ramal");
    await expect(repository.save(user, "a", null, { user_id: "sem-ramal", ativo: true }, alteracao)).rejects.toThrow("já possui");
  });
  it("atualiza o ramal no usuário e nas designações sem reescrever documentos emitidos", async () => {
    const result = await request("/usuarios/nova-user/ramal", "master", { tenant_id: "a", ramal: "4321" }, "PUT");
    expect(result.status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "nova-user" } })).ramal).toBe("4321");
    expect((await prisma.fiscal.findUniqueOrThrow({ where: { id: novoFiscal } })).ramal).toBe("4321");
    expect((await prisma.fiscalContrato.findUniqueOrThrow({ where: { id: novoVinculo } })).ramal).toBe("4321");
    expect((await osRepository.getDocumentData("os2"))?.fiscalTecnico?.ramal).toBe("789");
    expect((await request("/usuarios/outro-user/ramal", "master", { tenant_id: "a", ramal: "999" }, "PUT")).status).toBe(400);
    expect((await request("/usuarios/nova-user/ramal", "engenharia", { tenant_id: "a", ramal: "999" }, "PUT")).status).toBe(403);
  });
  it("o banco rejeita alterações e exclusões do histórico", async () => {
    await expect(db.query('UPDATE "FiscalizacaoHistorico" SET "motivo" = $1', ["adulterado"])).rejects.toThrow("histórico");
    await expect(db.query('DELETE FROM "FiscalizacaoHistorico"')).rejects.toThrow("histórico");
  });
});
