-- Migração manual: quantidades com 5 casas decimais (2026-10-29).
--
-- As quantidades do orçamento e das medições passam de milésimos (3 casas, INTEGER) para
-- cem-milésimos (5 casas, BIGINT): 3,5 m² = 350000; 10,44736 kg = 1044736. Os valores atuais são
-- multiplicados por 100, então nada muda de valor. As planilhas guardadas nas medições fechadas
-- (planilhaFechamento, versão 1) continuam em milésimos e são convertidas pelo código na leitura.
--
-- ALTER COLUMN ... TYPE reescreve a tabela sem disparar os gatilhos de linha (as medições fechadas
-- não são "alteradas"). Rodar no Supabase antes do deploy do código: o código novo lê 5 casas.

BEGIN;

ALTER TABLE "OrdemServicoItem"
  ALTER COLUMN "quantidade" TYPE BIGINT USING "quantidade"::BIGINT * 100,
  ALTER COLUMN "quantidadeSuprimida" DROP DEFAULT,
  ALTER COLUMN "quantidadeSuprimida" TYPE BIGINT USING "quantidadeSuprimida"::BIGINT * 100,
  ALTER COLUMN "quantidadeSuprimida" SET DEFAULT 0;

ALTER TABLE "MedicaoItem"
  ALTER COLUMN "quantidade" TYPE BIGINT USING "quantidade"::BIGINT * 100;

COMMIT;
