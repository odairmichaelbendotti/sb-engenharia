BEGIN;

CREATE TABLE "Fiscal" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "ramal" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("tenant_id", "email")
);
ALTER TABLE "FiscalContrato"
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "fim" TIMESTAMP(3),
  ADD COLUMN "fiscal_id" TEXT REFERENCES "Fiscal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Agrupa os cadastros existentes por unidade e e-mail; preserva todos os IDs das designações.
INSERT INTO "Fiscal" ("id", "tenant_id", "nome", "email", "ramal")
SELECT DISTINCT ON (c."tenant_id", lower(trim(f."email")))
  md5(c."tenant_id" || ':' || lower(trim(f."email"))), c."tenant_id",
  f."nome", lower(trim(f."email")), f."ramal"
FROM "FiscalContrato" f JOIN "Contrato" c ON c."id" = f."contrato_id"
ORDER BY c."tenant_id", lower(trim(f."email")), c."updatedAt" DESC, f."id";

UPDATE "FiscalContrato" f SET "fiscal_id" = md5(c."tenant_id" || ':' || lower(trim(f."email")))
FROM "Contrato" c WHERE c."id" = f."contrato_id";

CREATE TABLE "FiscalizacaoHistorico" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "contrato_id" TEXT,
  "fiscal_id" TEXT,
  "acao" TEXT NOT NULL,
  "autor_id" TEXT NOT NULL,
  "autorNome" TEXT NOT NULL,
  "autorPerfil" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "vigencia" TIMESTAMP(3) NOT NULL,
  "dados" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "FiscalizacaoHistorico_tenant_id_createdAt_idx" ON "FiscalizacaoHistorico" ("tenant_id", "createdAt");

ALTER TABLE "OrdemServico" ADD COLUMN "fiscaisEmissao" JSONB;
-- Documentos anteriores ficam com os nomes disponíveis no momento da migração.
UPDATE "OrdemServico" os SET "fiscaisEmissao" = jsonb_build_object(
  'tecnico', (SELECT jsonb_build_object('nome', f."nome", 'ramal', f."ramal", 'email', f."email") FROM "FiscalContrato" f WHERE f."id" = os."fiscalTecnico_id"),
  'administrativo', (SELECT jsonb_build_object('nome', f."nome", 'ramal', f."ramal", 'email', f."email") FROM "FiscalContrato" f WHERE f."id" = os."fiscalAdministrativo_id")
) WHERE os."aguardandoEmissao" = false;

CREATE FUNCTION fiscalizacao_historico_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'O histórico de fiscalização não pode ser alterado ou excluído'; END;
$$;
CREATE TRIGGER fiscalizacao_historico_imutavel BEFORE UPDATE OR DELETE ON "FiscalizacaoHistorico"
FOR EACH ROW EXECUTE FUNCTION fiscalizacao_historico_imutavel();

COMMIT;
