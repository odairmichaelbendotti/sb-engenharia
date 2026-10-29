-- Migração manual: OS planejada (2026-10-30).
--
-- A OS ainda não emitida ("aguardandoEmissao") passa a ser a OS planejada: tem um valor estimado e
-- não entra no emitido (totais, comprometido e saldo livre do empenho) até ser emitida com orçamento.
--   "estimativaComBdi":     total com BDI estimado, em centavos (o desconto do lote é aplicado na leitura).
--   "estimativaReferencia": de onde veio a estimativa (texto livre, opcional).
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.
-- Antes do deploy, emita as OS planejadas que já devem contar como emitidas (em 30/10: OS 010/BAFL/2026-L4).

ALTER TABLE "OrdemServico" ADD COLUMN "estimativaComBdi" INTEGER;
ALTER TABLE "OrdemServico" ADD COLUMN "estimativaReferencia" TEXT;
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_estimativaComBdi_check" CHECK ("estimativaComBdi" >= 0);
