-- Migração manual: vincula empresas (Company, global por CNPJ) às organizações (Tenant).
-- Cada base passa a enxergar só as empresas vinculadas a ela.
--
-- Backfill: cada empresa é vinculada às bases com as quais já tem contrato.
-- Empresas sem nenhum contrato ficam sem vínculo (não aparecem para nenhuma base
-- até serem cadastradas de novo pelo CNPJ, o que só cria o vínculo).
--
-- Rodar manualmente contra o Supabase SÓ depois de confirmar com o usuário, e ANTES
-- do deploy do código que usa TenantCompany.

BEGIN;

CREATE TABLE IF NOT EXISTS "TenantCompany" (
  "tenant_id"  TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantCompany_pkey" PRIMARY KEY ("tenant_id", "company_id"),
  CONSTRAINT "TenantCompany_tenant_id_fkey" FOREIGN KEY ("tenant_id")
    REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TenantCompany_company_id_fkey" FOREIGN KEY ("company_id")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "TenantCompany" ("tenant_id", "company_id")
SELECT DISTINCT "tenant_id", "company_id" FROM "Contrato"
ON CONFLICT DO NOTHING;

COMMIT;
