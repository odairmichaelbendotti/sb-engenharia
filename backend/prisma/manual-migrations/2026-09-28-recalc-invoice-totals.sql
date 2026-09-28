-- Recalcula os totais derivados das notas fiscais a partir das notas já gravadas.
-- A partir desta versão o backend mantém esses campos sincronizados sozinho;
-- este script só corrige o que foi gravado antes (valorExecutado nunca era preenchido).
-- Seguro para rodar mais de uma vez. Valores em centavos.

BEGIN;

-- Execução liquidada da obra = soma das NFs não canceladas vinculadas a ela
UPDATE "Obra" o
SET "valorExecutado" = COALESCE((
  SELECT SUM(nf.value)
  FROM "nota_fiscal" nf
  WHERE nf.obra_id = o.id AND nf.status <> 'CANCELADO'
), 0);

-- Liquidado do empenho = soma das NFs não canceladas do empenho
UPDATE "Empenho" e
SET "totalPaid" = COALESCE((
  SELECT SUM(nf.value)
  FROM "nota_fiscal" nf
  WHERE nf.empenho_id = e.id AND nf.status <> 'CANCELADO'
), 0);

COMMIT;

-- Conferência (opcional)
-- SELECT o."identificacaoPatrimonial", o.nome, o."valorExecutado" / 100.0 AS liquidado_reais FROM "Obra" o;
-- SELECT e.numero, e.value / 100.0 AS valor, e."totalPaid" / 100.0 AS liquidado FROM "Empenho" e;
