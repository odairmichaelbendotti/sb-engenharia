BEGIN;

ALTER TABLE "User" ADD COLUMN "ramal" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Fiscal" ADD COLUMN "user_id" TEXT;
ALTER TABLE "Fiscal" ADD CONSTRAINT "Fiscal_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Fiscal_tenant_id_user_id_key" ON "Fiscal"("tenant_id", "user_id");

-- Associa somente correspondências inequívocas dentro da mesma unidade.
-- Os IDs dos fiscais e das designações existentes permanecem iguais.
WITH candidatos AS (
  SELECT f."id", u."id" AS "user_id", f."updatedAt",
    count(*) OVER (PARTITION BY f."id") AS correspondencias
  FROM "Fiscal" f JOIN "User" u ON u."tenant_id" = f."tenant_id"
    AND lower(trim(u."email")) = lower(trim(f."email"))
  WHERE u."approved" = true AND u."role" <> 'EMPRESA' AND u."company_id" IS NULL
), unicos AS (
  SELECT *, row_number() OVER (PARTITION BY "user_id" ORDER BY "updatedAt" DESC, "id") AS ordem
  FROM candidatos WHERE correspondencias = 1
)
UPDATE "Fiscal" f SET "user_id" = u."user_id" FROM unicos u WHERE f."id" = u."id" AND u.ordem = 1;

-- Reaproveita o ramal já conhecido, sem pedir nova digitação.
UPDATE "User" u SET "ramal" = trim(f."ramal") FROM "Fiscal" f
WHERE f."user_id" = u."id" AND f."tenant_id" = u."tenant_id" AND trim(f."ramal") <> '';

COMMIT;
