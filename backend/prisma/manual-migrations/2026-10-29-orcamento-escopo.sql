-- Migração manual: escopo do orçamento da OS (2026-10-29).
--
-- "escopoOrcamento": o que o orçamento da OS representa.
--   ORDEM_SERVICO: parcela do contrato. O valor da OS é o total do orçamento (regra de sempre).
--   CONTRATO:      o contrato inteiro. O orçamento é o valor total; o valor da OS é o empenhado
--                  (soma dos empenhos), que pode ficar abaixo do orçamento até chegarem os próximos.
-- Todas as OS existentes ficam ORDEM_SERVICO.
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

CREATE TYPE "EscopoOrcamento" AS ENUM ('ORDEM_SERVICO', 'CONTRATO');

ALTER TABLE "OrdemServico" ADD COLUMN "escopoOrcamento" "EscopoOrcamento" NOT NULL DEFAULT 'ORDEM_SERVICO';
