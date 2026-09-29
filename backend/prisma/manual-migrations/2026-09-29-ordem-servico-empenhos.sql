-- Migração manual: uma Ordem de Serviço passa a poder receber vários empenhos.
--
-- Cenário: contrato de 600 mil, a administração empenha 500 mil e vincula à OS;
-- depois empenha os 100 mil restantes e vincula o novo empenho à MESMA OS.
--
-- Modelo: tabela "OrdemServicoEmpenho" (OS × empenho × valor destinado). Por padrão
-- o empenho vai inteiro para a OS, mas um empenho ainda pode ser dividido entre
-- várias OS (caso das manutenções, ex.: NE000606 dividido em 7 OS).
-- "OrdemServico"."valor" continua existindo e passa a ser a soma dos vínculos,
-- mantida pelo backend na mesma transação em que os vínculos mudam.
--
-- Esta migração só ACRESCENTA — não altera nem apaga nada existente:
--   * cria a tabela e copia o vínculo atual de cada OS (empenho_id + valor).
-- "OrdemServico"."empenho_id" continua existindo e obrigatório: passa a ser o
-- empenho PRINCIPAL da OS (o primeiro vinculado), por onde se chega ao contrato.
--
-- Rodar manualmente contra o Supabase SÓ depois de confirmar com o usuário e com
-- backup feito, e ANTES do deploy do código que usa "OrdemServicoEmpenho".

BEGIN;

CREATE TABLE IF NOT EXISTS "OrdemServicoEmpenho" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ordemServico_id" TEXT NOT NULL,
  "empenho_id"      TEXT NOT NULL,
  "valor"           INTEGER NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdemServicoEmpenho_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrdemServicoEmpenho_valor_check" CHECK ("valor" > 0),
  CONSTRAINT "OrdemServicoEmpenho_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id")
    REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  -- Empenho com OS vinculada não pode ser excluído sem antes sair da OS
  CONSTRAINT "OrdemServicoEmpenho_empenho_id_fkey" FOREIGN KEY ("empenho_id")
    REFERENCES "Empenho"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrdemServicoEmpenho_ordemServico_id_empenho_id_key"
  ON "OrdemServicoEmpenho"("ordemServico_id", "empenho_id");
CREATE INDEX IF NOT EXISTS "OrdemServicoEmpenho_empenho_id_idx"
  ON "OrdemServicoEmpenho"("empenho_id");

-- Backfill: cada OS existente vira um vínculo com o empenho e o valor que já tem
INSERT INTO "OrdemServicoEmpenho" ("ordemServico_id", "empenho_id", "valor")
SELECT "id", "empenho_id", "valor"
FROM "OrdemServico"
WHERE "empenho_id" IS NOT NULL AND "valor" > 0
ON CONFLICT ("ordemServico_id", "empenho_id") DO NOTHING;

COMMIT;

-- Conferência (rodar depois, só leitura): toda OS com valor deve ter vínculo e a
-- soma dos vínculos deve bater com o valor da OS. Esperado: nenhuma linha.
-- SELECT os."numero", os."valor", COALESCE(SUM(ose."valor"), 0) AS soma_vinculos
-- FROM "OrdemServico" os
-- LEFT JOIN "OrdemServicoEmpenho" ose ON ose."ordemServico_id" = os."id"
-- GROUP BY os."id"
-- HAVING os."valor" <> COALESCE(SUM(ose."valor"), 0);
