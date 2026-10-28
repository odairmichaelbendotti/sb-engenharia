-- Migração manual: nota fiscal vinculada a uma medição (2026-10-28).
--
-- "medicao_id": medição fechada da OS que a nota paga; o valor da nota passa a ser o da medição.
-- Nula = nota com valor digitado (todas as notas antigas). Excluir a medição solta o vínculo
-- (o código só deixa excluir/reabrir medição sem nota não cancelada).
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

ALTER TABLE "nota_fiscal" ADD COLUMN IF NOT EXISTS "medicao_id" TEXT;

ALTER TABLE "nota_fiscal"
  ADD CONSTRAINT "nota_fiscal_medicao_id_fkey" FOREIGN KEY ("medicao_id")
    REFERENCES "Medicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "nota_fiscal_medicao_id_idx" ON "nota_fiscal"("medicao_id");
