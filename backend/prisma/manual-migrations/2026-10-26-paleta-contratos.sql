-- Migração manual: paleta de cores dos contratos "Grafite e sinal" (2026-10-26).
--
-- A cor do contrato é atribuída por rodízio na criação (PrismaContratoRepository). A paleta
-- antiga tinha 12 cores vivas; a nova tem 8 tons discretos. Aqui cada contrato recebe o tom
-- que o rodízio novo daria a ele: posição pela ordem de criação dentro da organização.
--
-- Esta migração ALTERA a coluna "cor" de todos os contratos (só aparência; nada depende
-- do valor) e o default da coluna. Para voltar, basta um backup da coluna:
--   CREATE TABLE contrato_cor_backup AS SELECT id, cor FROM "Contrato";
--
-- Rodar manualmente contra o Supabase SÓ depois de confirmar com o usuário e com
-- backup feito. Pode ser antes ou depois do deploy do código.

BEGIN;

ALTER TABLE "Contrato" ALTER COLUMN "cor" SET DEFAULT '#4f759c';

WITH ordem AS (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY "createdAt", id) - 1) AS posicao
  FROM "Contrato"
)
UPDATE "Contrato" c
SET "cor" = (ARRAY['#4f759c', '#8b6b3d', '#517e5a', '#985f67', '#357d8d', '#976250', '#707742', '#85638d'])[(ordem.posicao % 8) + 1]
FROM ordem
WHERE ordem.id = c.id;

COMMIT;
