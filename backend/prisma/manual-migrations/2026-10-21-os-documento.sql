-- Migração manual: dados que alimentam o documento da Ordem de Serviço (PDF).
--
-- Contrato: e-PAG, ETP, TR, data-base SINAPI, endereço e BDI. Os contratos que já
--           existem recebem o placeholder "A PREENCHER" (BDI 21,19) até serem editados.
-- Lote:     tabela nova, opcional por contrato (número, nome e desconto ofertado).
-- Fiscais:  tabela nova, vários por contrato (técnico e administrativo).
-- Obra:     identificação patrimonial completa, apelido, área e estado de conservação
--           (nulos nas obras que já existem).
-- OS:       lote, setor requisitante, urgência, vistoria, descrição do problema, emissão,
--           mobilização, prazo, total com BDI, fiscais e condições especiais, mais a
--           sequência da numeração (nulos nas OS que já existem).
--
-- Esta migração só ACRESCENTA — não altera nem apaga nada existente.
--
-- Rodar manualmente contra o Supabase SÓ depois de confirmar com o usuário e com
-- backup feito, e ANTES do deploy do código que usa as colunas novas.

BEGIN;

-- Contrato
ALTER TABLE "Contrato"
  ADD COLUMN IF NOT EXISTS "ePag"            TEXT NOT NULL DEFAULT 'A PREENCHER',
  ADD COLUMN IF NOT EXISTS "etp"             TEXT NOT NULL DEFAULT 'A PREENCHER',
  ADD COLUMN IF NOT EXISTS "termoReferencia" TEXT NOT NULL DEFAULT 'A PREENCHER',
  ADD COLUMN IF NOT EXISTS "dataBaseSinapi"  TEXT NOT NULL DEFAULT 'A PREENCHER',
  ADD COLUMN IF NOT EXISTS "endereco"        TEXT NOT NULL DEFAULT 'A PREENCHER',
  ADD COLUMN IF NOT EXISTS "bdi"             DOUBLE PRECISION NOT NULL DEFAULT 21.19;

-- Lote
CREATE TABLE IF NOT EXISTS "Lote" (
  "id"          TEXT NOT NULL,
  "numero"      INTEGER NOT NULL,
  "nome"        TEXT NOT NULL,
  "desconto"    DOUBLE PRECISION NOT NULL,
  "contrato_id" TEXT NOT NULL,
  CONSTRAINT "Lote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lote_desconto_check" CHECK ("desconto" >= 0 AND "desconto" < 100),
  CONSTRAINT "Lote_contrato_id_fkey" FOREIGN KEY ("contrato_id")
    REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Lote_contrato_id_numero_key" ON "Lote"("contrato_id", "numero");

-- Fiscais do contrato
DO $$ BEGIN
  CREATE TYPE "FiscalContratoTipo" AS ENUM ('TECNICO', 'ADMINISTRATIVO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "FiscalContrato" (
  "id"          TEXT NOT NULL,
  "tipo"        "FiscalContratoTipo" NOT NULL,
  "nome"        TEXT NOT NULL,
  "ramal"       TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "contrato_id" TEXT NOT NULL,
  CONSTRAINT "FiscalContrato_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FiscalContrato_contrato_id_fkey" FOREIGN KEY ("contrato_id")
    REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "FiscalContrato_contrato_id_idx" ON "FiscalContrato"("contrato_id");

-- Obra
ALTER TABLE "Obra"
  ADD COLUMN IF NOT EXISTS "idPatrimonialCompleto" TEXT,
  ADD COLUMN IF NOT EXISTS "apelido"               TEXT,
  ADD COLUMN IF NOT EXISTS "areaConstruida"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "estadoConservacao"     TEXT;

-- Ordem de Serviço
DO $$ BEGIN
  CREATE TYPE "OrdemServicoUrgencia" AS ENUM ('EMERGENCIA', 'URGENCIA', 'PROGRAMADA', 'PREVENTIVA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "OrdemServico"
  ADD COLUMN IF NOT EXISTS "sequencia"               INTEGER,
  ADD COLUMN IF NOT EXISTS "anoNumeracao"            INTEGER,
  ADD COLUMN IF NOT EXISTS "lote_id"                 TEXT,
  ADD COLUMN IF NOT EXISTS "setorRequisitante"       TEXT,
  ADD COLUMN IF NOT EXISTS "urgencia"                "OrdemServicoUrgencia",
  ADD COLUMN IF NOT EXISTS "dataVistoria"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "descricaoProblema"       TEXT,
  ADD COLUMN IF NOT EXISTS "dataEmissao"             TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "prazoMobilizacaoDias"    INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "prazoDias"               INTEGER,
  ADD COLUMN IF NOT EXISTS "totalComBdi"             INTEGER,
  ADD COLUMN IF NOT EXISTS "fiscalSetorial"          TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalTecnico_id"        TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalAdministrativo_id" TEXT,
  ADD COLUMN IF NOT EXISTS "condicoesEspeciais"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Lote com OS não pode ser excluído; fiscal excluído só solta a OS
ALTER TABLE "OrdemServico"
  ADD CONSTRAINT "OrdemServico_lote_id_fkey" FOREIGN KEY ("lote_id")
    REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OrdemServico_fiscalTecnico_id_fkey" FOREIGN KEY ("fiscalTecnico_id")
    REFERENCES "FiscalContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "OrdemServico_fiscalAdministrativo_id_fkey" FOREIGN KEY ("fiscalAdministrativo_id")
    REFERENCES "FiscalContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "OrdemServico_lote_id_idx" ON "OrdemServico"("lote_id");

COMMIT;
