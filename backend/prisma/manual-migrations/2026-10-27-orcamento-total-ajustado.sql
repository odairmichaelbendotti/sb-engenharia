-- Migração manual: total ajustado do item do orçamento (2026-10-27).
--
-- O total do item é quantidade × preço; a planilha de referência às vezes chega a outro valor
-- (total truncado, preço com mais casas). "valorTotal" guarda o total digitado, em centavos;
-- nulo = calculado. Só acrescenta uma coluna nulável: os itens existentes seguem calculados.
--
-- Rodar manualmente contra o Supabase ANTES do deploy do código, com backup.

BEGIN;

ALTER TABLE "OrdemServicoItem" ADD COLUMN "valorTotal" INTEGER;

COMMIT;
