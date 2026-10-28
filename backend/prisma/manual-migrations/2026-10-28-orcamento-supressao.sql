-- Migração manual: supressão de itens do orçamento da OS (2026-10-28).
--
-- "quantidadeSuprimida": parte da quantidade contratada que saiu do contrato (ex.: supressão de um
-- aditivo), em milésimos. O item continua na planilha e vale pela quantidade efetiva
-- (quantidade − suprimida): valor da OS, saldo e medições. 0 = sem supressão.
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

ALTER TABLE "OrdemServicoItem" ADD COLUMN "quantidadeSuprimida" INTEGER NOT NULL DEFAULT 0;
