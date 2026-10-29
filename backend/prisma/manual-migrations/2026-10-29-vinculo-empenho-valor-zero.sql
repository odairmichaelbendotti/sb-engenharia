-- Vínculo OS × empenho com valor 0 (2026-10-29)
--
-- Desde o orçamento como base de preço (2026-10-27), a OS nasce aguardando o orçamento, com
-- os vínculos de empenho em valor 0; o valor só chega quando o orçamento é salvo. A regra
-- antiga "valor > 0" barrava a criação de toda OS nova:
--   new row for relation "OrdemServicoEmpenho" violates check constraint
--   "OrdemServicoEmpenho_valor_check"
-- Passa a aceitar 0 (valor negativo continua barrado).
--
-- Só troca a regra, não altera dados. O Prisma não representa CHECK, então o diff do
-- deploy.sh não muda. Pode ser aplicada antes ou depois do deploy do código.

BEGIN;

ALTER TABLE "OrdemServicoEmpenho" DROP CONSTRAINT IF EXISTS "OrdemServicoEmpenho_valor_check";
ALTER TABLE "OrdemServicoEmpenho" ADD CONSTRAINT "OrdemServicoEmpenho_valor_check" CHECK ("valor" >= 0);

COMMIT;

-- Conferência (só leitura). Esperado: CHECK (valor >= 0)
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'OrdemServicoEmpenho_valor_check';
