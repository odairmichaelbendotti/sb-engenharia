-- Migração manual: ciência e contestação da Ordem de Serviço pela empresa.
--
-- OS:            emissão no servidor, prazo de ciência (48 h), ciência dispensada, primeira
--                visualização, ciência (quando e quem) e marca do prazo vencido.
--                As OS que JÁ EXISTEM ficam com a ciência dispensada: não travam ninguém.
-- Evento:        histórico da tramitação, só inserção (gatilho barra UPDATE e DELETE direto;
--                só some junto com a OS excluída).
-- Contestação:   apontamentos da empresa; a decisão da fiscalização é gravada uma vez só.
-- Notificação:   avisos dentro do sistema, com a leitura registrada por usuário.
--
-- Esta migração só ACRESCENTA — não altera nem apaga nada existente (além de marcar as OS
-- antigas como dispensadas). Rodar manualmente contra o Supabase SÓ depois de confirmar com
-- o usuário e com backup feito, e ANTES do deploy do código que usa as colunas novas.

BEGIN;

-- Tipos
DO $$ BEGIN
  CREATE TYPE "OrdemServicoEventoTipo" AS ENUM ('EMITIDA', 'REEMITIDA', 'VISUALIZADA', 'CIENTE', 'PRAZO_VENCIDO', 'CONTESTACAO', 'CONTESTACAO_ACATADA', 'CONTESTACAO_RECUSADA', 'COMENTARIO', 'STATUS_ALTERADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrdemServicoContestacaoStatus" AS ENUM ('ABERTA', 'ACATADA', 'RECUSADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificacaoDestino" AS ENUM ('EMPRESA', 'FISCALIZACAO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificacaoTipo" AS ENUM ('OS_EMITIDA', 'OS_REEMITIDA', 'OS_CIENTE', 'OS_PRAZO_VENCIDO', 'OS_CONTESTACAO', 'OS_CONTESTACAO_RESPONDIDA', 'OS_COMENTARIO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OS
ALTER TABLE "OrdemServico"
  ADD COLUMN IF NOT EXISTS "emitidaEm"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cienciaPrazoAte"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cienciaDispensada" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "visualizadaEm"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cienteEm"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cienteUser_id"     TEXT,
  ADD COLUMN IF NOT EXISTS "cienteNome"        TEXT,
  ADD COLUMN IF NOT EXISTS "prazoVencidoEm"    TIMESTAMP(3);

-- OS emitidas antes desta regra: ciência dispensada (o código também trata emitidaEm nulo assim)
UPDATE "OrdemServico" SET "cienciaDispensada" = true WHERE "emitidaEm" IS NULL;

-- Contestação
CREATE TABLE IF NOT EXISTS "OrdemServicoContestacao" (
  "id"                TEXT NOT NULL,
  "texto"             TEXT NOT NULL,
  "status"            "OrdemServicoContestacaoStatus" NOT NULL DEFAULT 'ABERTA',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ordemServico_id"   TEXT NOT NULL,
  "autor_id"          TEXT NOT NULL,
  "autorNome"         TEXT NOT NULL,
  "resposta"          TEXT,
  "respondidoPor_id"  TEXT,
  "respondidoPorNome" TEXT,
  "respondidoEm"      TIMESTAMP(3),
  CONSTRAINT "OrdemServicoContestacao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrdemServicoContestacao_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id")
    REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "OrdemServicoContestacao_ordemServico_id_status_idx"
  ON "OrdemServicoContestacao"("ordemServico_id", "status");

-- Evento
CREATE TABLE IF NOT EXISTS "OrdemServicoEvento" (
  "id"              TEXT NOT NULL,
  "tipo"            "OrdemServicoEventoTipo" NOT NULL,
  "texto"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ordemServico_id" TEXT NOT NULL,
  "autor_id"        TEXT,
  "autorNome"       TEXT NOT NULL,
  "autorPerfil"     TEXT NOT NULL,
  "autorEmpresa"    TEXT,
  "contestacao_id"  TEXT,
  CONSTRAINT "OrdemServicoEvento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrdemServicoEvento_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id")
    REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrdemServicoEvento_contestacao_id_fkey" FOREIGN KEY ("contestacao_id")
    REFERENCES "OrdemServicoContestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "OrdemServicoEvento_ordemServico_id_createdAt_idx"
  ON "OrdemServicoEvento"("ordemServico_id", "createdAt");

-- Notificação
CREATE TABLE IF NOT EXISTS "Notificacao" (
  "id"              TEXT NOT NULL,
  "destino"         "NotificacaoDestino" NOT NULL,
  "tipo"            "NotificacaoTipo" NOT NULL,
  "titulo"          TEXT NOT NULL,
  "mensagem"        TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenant_id"       TEXT NOT NULL,
  "company_id"      TEXT,
  "ordemServico_id" TEXT,
  CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notificacao_tenant_id_fkey" FOREIGN KEY ("tenant_id")
    REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notificacao_company_id_fkey" FOREIGN KEY ("company_id")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notificacao_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id")
    REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notificacao_tenant_id_destino_createdAt_idx"
  ON "Notificacao"("tenant_id", "destino", "createdAt");
CREATE INDEX IF NOT EXISTS "Notificacao_company_id_createdAt_idx"
  ON "Notificacao"("company_id", "createdAt");

CREATE TABLE IF NOT EXISTS "NotificacaoLeitura" (
  "notificacao_id" TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "lidaEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificacaoLeitura_pkey" PRIMARY KEY ("notificacao_id", "user_id"),
  CONSTRAINT "NotificacaoLeitura_notificacao_id_fkey" FOREIGN KEY ("notificacao_id")
    REFERENCES "Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NotificacaoLeitura_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "NotificacaoLeitura_user_id_idx" ON "NotificacaoLeitura"("user_id");

-- Histórico imutável: evento nunca é alterado; só é apagado junto com a OS (cascata, quando
-- a OS já não existe mais). DELETE direto de um evento de OS existente é barrado.
CREATE OR REPLACE FUNCTION "ordem_servico_evento_imutavel"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'OrdemServicoEvento is immutable';
  END IF;
  IF EXISTS (SELECT 1 FROM "OrdemServico" WHERE "id" = OLD."ordemServico_id") THEN
    RAISE EXCEPTION 'OrdemServicoEvento cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "OrdemServicoEvento_imutavel" ON "OrdemServicoEvento";
CREATE TRIGGER "OrdemServicoEvento_imutavel"
  BEFORE UPDATE OR DELETE ON "OrdemServicoEvento"
  FOR EACH ROW EXECUTE FUNCTION "ordem_servico_evento_imutavel"();

-- Contestação: o texto e o autor não mudam; a decisão (ABERTA → ACATADA/RECUSADA) é única
CREATE OR REPLACE FUNCTION "ordem_servico_contestacao_imutavel"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM "OrdemServico" WHERE "id" = OLD."ordemServico_id") THEN
      RAISE EXCEPTION 'OrdemServicoContestacao cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD."status" <> 'ABERTA'
     OR NEW."texto" IS DISTINCT FROM OLD."texto"
     OR NEW."autor_id" IS DISTINCT FROM OLD."autor_id"
     OR NEW."autorNome" IS DISTINCT FROM OLD."autorNome"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR NEW."ordemServico_id" IS DISTINCT FROM OLD."ordemServico_id" THEN
    RAISE EXCEPTION 'OrdemServicoContestacao can only be decided once';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "OrdemServicoContestacao_imutavel" ON "OrdemServicoContestacao";
CREATE TRIGGER "OrdemServicoContestacao_imutavel"
  BEFORE UPDATE OR DELETE ON "OrdemServicoContestacao"
  FOR EACH ROW EXECUTE FUNCTION "ordem_servico_contestacao_imutavel"();

COMMIT;
