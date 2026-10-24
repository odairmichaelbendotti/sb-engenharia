-- Migração manual: orçamento (planilha de itens) e medições da Ordem de Serviço.
--
-- OrdemServicoItem: itens da planilha orçamentária da OS (quantidade em milésimos da unidade,
--                   preço unitário em centavos, já com BDI e desconto do lote).
-- Medicao:          medições da OS (rascunho → fechada), numeradas por OS. A fechada guarda a
--                   planilha congelada (planilhaFechamento) e um gatilho barra alterá-la ou
--                   excluí-la; só a volta para rascunho (reabertura) é aceita.
-- MedicaoItem:      quantidade medida de cada item. Gatilho barra mexer nas linhas de medição
--                   fechada, e outro barra excluir item com quantidade em medição fechada.
--
-- Esta migração só ACRESCENTA — não altera nem apaga nada existente. Rodar manualmente contra
-- o Supabase SÓ depois de confirmar com o usuário e com backup feito, e ANTES do deploy do
-- código que usa as tabelas novas.

BEGIN;

-- Tipo
DO $$ BEGIN
  CREATE TYPE "MedicaoStatus" AS ENUM ('RASCUNHO', 'FECHADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Itens da planilha orçamentária
CREATE TABLE IF NOT EXISTS "OrdemServicoItem" (
  "id"              TEXT NOT NULL,
  "ordem"           INTEGER NOT NULL,
  "codigo"          TEXT,
  "descricao"       TEXT NOT NULL,
  "unidade"         TEXT NOT NULL,
  "quantidade"      INTEGER NOT NULL,
  "precoUnitario"   INTEGER NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ordemServico_id" TEXT NOT NULL,
  CONSTRAINT "OrdemServicoItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrdemServicoItem_quantidade_check" CHECK ("quantidade" > 0),
  CONSTRAINT "OrdemServicoItem_precoUnitario_check" CHECK ("precoUnitario" >= 0)
);

CREATE INDEX IF NOT EXISTS "OrdemServicoItem_ordemServico_id_ordem_idx"
  ON "OrdemServicoItem"("ordemServico_id", "ordem");

DO $$ BEGIN
  ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemServico_id_fkey"
    FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Medições
CREATE TABLE IF NOT EXISTS "Medicao" (
  "id"                 TEXT NOT NULL,
  "numero"             INTEGER NOT NULL,
  "status"             "MedicaoStatus" NOT NULL DEFAULT 'RASCUNHO',
  "periodoInicio"      TIMESTAMP(3) NOT NULL,
  "periodoFim"         TIMESTAMP(3) NOT NULL,
  "observacao"         TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criadoPor_id"       TEXT,
  "criadoPorNome"      TEXT NOT NULL,
  "fechadaEm"          TIMESTAMP(3),
  "fechadaPor_id"      TEXT,
  "fechadaPorNome"     TEXT,
  "reabertaEm"         TIMESTAMP(3),
  "reabertaPorNome"    TEXT,
  "planilhaFechamento" JSONB,
  "ordemServico_id"    TEXT NOT NULL,
  CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Medicao_numero_check" CHECK ("numero" >= 1),
  CONSTRAINT "Medicao_periodo_check" CHECK ("periodoInicio" <= "periodoFim"),
  -- Fechada sempre com data e planilha de fechamento; rascunho sem elas
  CONSTRAINT "Medicao_fechamento_check" CHECK (
    ("status" = 'FECHADA') = ("fechadaEm" IS NOT NULL)
    AND ("status" = 'FECHADA') = ("planilhaFechamento" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "Medicao_ordemServico_id_numero_key"
  ON "Medicao"("ordemServico_id", "numero");

DO $$ BEGIN
  ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_ordemServico_id_fkey"
    FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Linhas da medição
CREATE TABLE IF NOT EXISTS "MedicaoItem" (
  "id"         TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "medicao_id" TEXT NOT NULL,
  "item_id"    TEXT NOT NULL,
  CONSTRAINT "MedicaoItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MedicaoItem_quantidade_check" CHECK ("quantidade" > 0)
);

CREATE INDEX IF NOT EXISTS "MedicaoItem_item_id_idx" ON "MedicaoItem"("item_id");
CREATE UNIQUE INDEX IF NOT EXISTS "MedicaoItem_medicao_id_item_id_key" ON "MedicaoItem"("medicao_id", "item_id");

DO $$ BEGIN
  ALTER TABLE "MedicaoItem" ADD CONSTRAINT "MedicaoItem_medicao_id_fkey"
    FOREIGN KEY ("medicao_id") REFERENCES "Medicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CASCADE: excluir o item leva as linhas de rascunho; a exclusão do item com quantidade em medição
-- fechada é barrada pelo gatilho "OrdemServicoItem_medido" abaixo. (Com NO ACTION/RESTRICT a
-- exclusão da OS falhava: a checagem roda antes de a cascata apagar as linhas da medição.)
DO $$ BEGIN
  ALTER TABLE "MedicaoItem" ADD CONSTRAINT "MedicaoItem_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "OrdemServicoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Medição fechada não muda: só pode voltar para rascunho (reabertura) e só some junto com a OS
CREATE OR REPLACE FUNCTION "medicao_fechada_imutavel"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" = 'FECHADA' AND EXISTS (SELECT 1 FROM "OrdemServico" WHERE "id" = OLD."ordemServico_id") THEN
      RAISE EXCEPTION 'A closed Medicao cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD."status" = 'FECHADA' AND NEW."status" = 'FECHADA' THEN
    RAISE EXCEPTION 'A closed Medicao cannot be changed';
  END IF;
  IF OLD."status" = 'FECHADA' AND (
       NEW."numero" IS DISTINCT FROM OLD."numero"
       OR NEW."ordemServico_id" IS DISTINCT FROM OLD."ordemServico_id") THEN
    RAISE EXCEPTION 'A reopened Medicao keeps its number';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Medicao_fechada_imutavel" ON "Medicao";
CREATE TRIGGER "Medicao_fechada_imutavel"
  BEFORE UPDATE OR DELETE ON "Medicao"
  FOR EACH ROW EXECUTE FUNCTION "medicao_fechada_imutavel"();

-- Linhas de medição fechada não mudam. Na exclusão da OS a cascata pode chegar às linhas antes de
-- chegar à medição: com a OS já excluída, a linha sai
CREATE OR REPLACE FUNCTION "medicao_item_fechada_imutavel"() RETURNS trigger AS $$
DECLARE
  alvo TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    alvo := NEW."medicao_id";
  ELSE
    alvo := OLD."medicao_id";
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Medicao" m JOIN "OrdemServico" o ON o."id" = m."ordemServico_id"
    WHERE m."id" = alvo AND m."status" = 'FECHADA'
  ) THEN
    RAISE EXCEPTION 'Lines of a closed Medicao cannot be changed';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."medicao_id" IS DISTINCT FROM OLD."medicao_id"
     AND EXISTS (SELECT 1 FROM "Medicao" WHERE "id" = NEW."medicao_id" AND "status" = 'FECHADA') THEN
    RAISE EXCEPTION 'Lines of a closed Medicao cannot be changed';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "MedicaoItem_fechada_imutavel" ON "MedicaoItem";
CREATE TRIGGER "MedicaoItem_fechada_imutavel"
  BEFORE INSERT OR UPDATE OR DELETE ON "MedicaoItem"
  FOR EACH ROW EXECUTE FUNCTION "medicao_item_fechada_imutavel"();

-- Item com quantidade em medição fechada não sai da planilha (só junto com a OS)
CREATE OR REPLACE FUNCTION "ordem_servico_item_medido"() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "MedicaoItem" mi
    JOIN "Medicao" m ON m."id" = mi."medicao_id"
    JOIN "OrdemServico" o ON o."id" = m."ordemServico_id"
    WHERE mi."item_id" = OLD."id" AND m."status" = 'FECHADA'
  ) THEN
    RAISE EXCEPTION 'An item measured in a closed Medicao cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "OrdemServicoItem_medido" ON "OrdemServicoItem";
CREATE TRIGGER "OrdemServicoItem_medido"
  BEFORE DELETE ON "OrdemServicoItem"
  FOR EACH ROW EXECUTE FUNCTION "ordem_servico_item_medido"();

COMMIT;
