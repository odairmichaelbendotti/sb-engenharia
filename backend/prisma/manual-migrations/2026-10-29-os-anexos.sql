-- Migração manual: anexos e comentários técnicos da OS (2026-10-29).
--
-- "anexos": anexos escolhidos para a OS, em JSON ([{ "codigo", "titulo", "observacao" }]; codigo
-- nulo = anexo fora da lista padrão). Nulo = OS anterior à escolha: o PDF continua com os seis
-- anexos padrão, como antes.
-- "comentariosTecnicos": linhas de comentário técnico da OS (lista vazia por padrão).
--
-- Só acrescenta; rodar no Supabase antes do deploy do código.

ALTER TABLE "OrdemServico" ADD COLUMN "anexos" JSONB;
ALTER TABLE "OrdemServico" ADD COLUMN "comentariosTecnicos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
