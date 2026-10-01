-- Migração manual: uma obra passa a poder ter várias Ordens de Serviço.
--
-- Cenário: emitiu-se uma OS para a obra e faltou um serviço; emite-se outra OS
-- e as duas ficam vinculadas à MESMA obra.
--
-- Mudanças:
--   1. O vínculo inverte de lado: sai "Obra"."ordemServico_id" (1 OS : 1 obra) e
--      entra "OrdemServico"."obra_id" (N OS : 1 obra).
--   2. O cronograma sai da obra e vai para a OS: "OrdemServico" ganha
--      "dataInicio" e "dataPrevisaoTermino", copiados da obra atual de cada OS.
--      A obra mantém só "dataConclusao". O prazo da obra passa a ser calculado
--      a partir das suas OS (menor início, maior previsão de término).
--   3. A nota fiscal passa a indicar a OS ("nota_fiscal"."ordemServico_id"),
--      para medir quanto de cada OS foi executado. As notas existentes recebem
--      a OS atual da obra delas.
--
-- ATENÇÃO: o passo final REMOVE colunas da tabela "Obra" ("ordemServico_id",
-- "dataInicio", "dataPrevisaoTermino") depois de copiar os dados para a OS.
-- Rodar manualmente contra o Supabase SÓ depois de confirmar com o usuário e
-- com backup feito, e junto com o deploy do backend que usa o novo modelo.

BEGIN;

-- 1. Novas colunas na OS
ALTER TABLE "OrdemServico"
  ADD COLUMN IF NOT EXISTS "dataInicio"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dataPrevisaoTermino" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "obra_id"             TEXT;

-- Copia o vínculo e o cronograma da obra para a OS dela
UPDATE "OrdemServico" os
SET "obra_id"             = o."id",
    "dataInicio"          = o."dataInicio",
    "dataPrevisaoTermino" = o."dataPrevisaoTermino"
FROM "Obra" o
WHERE o."ordemServico_id" = os."id";

-- Excluir a obra devolve a OS para "sem obra"
ALTER TABLE "OrdemServico"
  ADD CONSTRAINT "OrdemServico_obra_id_fkey" FOREIGN KEY ("obra_id")
    REFERENCES "Obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "OrdemServico_obra_id_idx" ON "OrdemServico"("obra_id");

-- 2. Nota fiscal aponta para a OS
ALTER TABLE "nota_fiscal" ADD COLUMN IF NOT EXISTS "ordemServico_id" TEXT;

UPDATE "nota_fiscal" nf
SET "ordemServico_id" = o."ordemServico_id"
FROM "Obra" o
WHERE nf."obra_id" = o."id";

-- OS com nota fiscal não pode ser excluída
ALTER TABLE "nota_fiscal"
  ADD CONSTRAINT "nota_fiscal_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id")
    REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "nota_fiscal_ordemServico_id_idx" ON "nota_fiscal"("ordemServico_id");

-- 3. Remove o vínculo antigo e o cronograma da obra
ALTER TABLE "Obra" DROP CONSTRAINT IF EXISTS "Obra_ordemServico_id_fkey";
DROP INDEX IF EXISTS "Obra_ordemServico_id_key";
ALTER TABLE "Obra"
  DROP COLUMN IF EXISTS "ordemServico_id",
  DROP COLUMN IF EXISTS "dataInicio",
  DROP COLUMN IF EXISTS "dataPrevisaoTermino";

COMMIT;

-- Conferência (rodar depois, só leitura).
-- Toda obra deve ter ao menos uma OS. Esperado: nenhuma linha.
-- SELECT o."identificacaoPatrimonial", o."nome"
-- FROM "Obra" o
-- WHERE NOT EXISTS (SELECT 1 FROM "OrdemServico" os WHERE os."obra_id" = o."id");
--
-- Toda nota com obra deve ter OS. Esperado: nenhuma linha.
-- SELECT nf."numero" FROM "nota_fiscal" nf
-- WHERE nf."obra_id" IS NOT NULL AND nf."ordemServico_id" IS NULL;
