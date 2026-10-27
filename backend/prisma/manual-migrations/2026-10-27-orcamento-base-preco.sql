-- Migração manual: orçamento como base de preço da OS (2026-10-27).
--
-- 1. "aguardandoEmissao": a OS nasce sem valor e só é emitida (vai para a empresa) depois de ter
--    orçamento. As OS existentes já estão emitidas (ou com a ciência dispensada): ficam false.
-- 2. "precoBase": como os preços do orçamento foram informados. COM_BDI = o sistema aplica o
--    desconto do lote (truncando o centavo); COM_BDI_E_DESCONTO = preço já com desconto.
-- 3. "desconto": cópia do desconto do lote na OS; editar o lote depois não muda a OS.
-- 4. "precoReferencia": preço com BDI digitado (só no modo COM_BDI); "precoUnitario" continua
--    sendo o preço que vale nas medições, já com desconto.
--
-- Dados: os orçamentos existentes passam a "só com BDI" (o preço gravado vira a referência e o
-- desconto é aplicado), exceto nas OS com medição fechada, que ficam "com BDI e desconto" e não
-- mudam de valor. O total ajustado sai dos convertidos (só existe no modo com desconto).
--
-- Rodar manualmente contra o Supabase ANTES do deploy do código, com backup.

BEGIN;

CREATE TYPE "OrcamentoPrecoBase" AS ENUM ('COM_BDI', 'COM_BDI_E_DESCONTO');

ALTER TABLE "OrdemServico"
  ADD COLUMN "aguardandoEmissao" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "precoBase" "OrcamentoPrecoBase" NOT NULL DEFAULT 'COM_BDI',
  ADD COLUMN "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "OrdemServicoItem" ADD COLUMN "precoReferencia" INTEGER;
ALTER TABLE "OrdemServicoItem"
  ADD CONSTRAINT "OrdemServicoItem_precoReferencia_check" CHECK ("precoReferencia" IS NULL OR "precoReferencia" >= 0);

-- Desconto atual do lote de cada OS
UPDATE "OrdemServico" o
SET "desconto" = l."desconto"
FROM "Lote" l
WHERE l."id" = o."lote_id";

-- OS com medição fechada: os preços gravados já valeram nas medições, ficam como "com desconto"
UPDATE "OrdemServico" o
SET "precoBase" = 'COM_BDI_E_DESCONTO'
WHERE EXISTS (
  SELECT 1 FROM "Medicao" m WHERE m."ordemServico_id" = o."id" AND m."status" = 'FECHADA'
);

-- Demais: o preço gravado vira a referência com BDI e o preço que vale recebe o desconto,
-- truncado no centavo (conta em inteiros: desconto em décimos de milésimo de ponto percentual)
UPDATE "OrdemServicoItem" i
SET "precoReferencia" = i."precoUnitario",
    "precoUnitario" = (i."precoUnitario"::bigint * (1000000 - ROUND(o."desconto" * 10000)::bigint) / 1000000)::integer,
    "valorTotal" = NULL,
    "updatedAt" = now()
FROM "OrdemServico" o
WHERE o."id" = i."ordemServico_id" AND o."precoBase" = 'COM_BDI';

COMMIT;
