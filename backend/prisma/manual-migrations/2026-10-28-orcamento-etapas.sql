-- Migração manual: etapa dos itens do orçamento da OS (2026-10-28).
--
-- "etapa": nome da etapa do item (ex.: "Remoção/demolição"). Os itens seguidos (pela "ordem") com a
-- mesma etapa formam um grupo nas telas de orçamento e medição e no boletim. Nulo = sem etapa
-- (orçamentos lançados antes, que continuam como uma lista única).
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

ALTER TABLE "OrdemServicoItem" ADD COLUMN "etapa" TEXT;
