-- Migração manual: regra de desconto do orçamento da OS (2026-10-28).
--
-- "regraDesconto": como o desconto do lote é aplicado em cada preço quando o orçamento é lançado
-- só com BDI (precoBase = COM_BDI).
--   SIMPLES: preço com desconto = TRUNCAR(preço × (1 − desconto)); total = quantidade × preço.
--   SCOAM:   preço com desconto = preço − TRUNCAR(preço × desconto); total = TRUNCAR(quantidade × preço).
-- Todas as OS existentes ficam SIMPLES, que é a regra que o sistema já usava.
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

CREATE TYPE "RegraDesconto" AS ENUM ('SIMPLES', 'SCOAM');

ALTER TABLE "OrdemServico" ADD COLUMN "regraDesconto" "RegraDesconto" NOT NULL DEFAULT 'SIMPLES';
