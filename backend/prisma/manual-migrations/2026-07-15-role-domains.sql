-- Migração manual: substitui o enum UserRole (PLATFORM_ADMIN, MASTER, EDITOR, USER)
-- por (PLATFORM_ADMIN, MASTER, COORDENACAO, ENGENHARIA, ADMINISTRATIVO, USER).
--
-- Postgres não permite remover um valor de enum com ALTER TYPE ... DROP VALUE,
-- então o tipo precisa ser recriado. Usuários com role EDITOR viram ADMINISTRATIVO
-- (mantém exatamente o que já podiam editar: Company/Empenho/Invoice).
--
-- Rodar manualmente contra o Supabase (SQL editor ou psql) SÓ depois de confirmar
-- com o usuário — ver "Coisas para NUNCA fazer sem perguntar antes" em backend/CLAUDE.md.
-- Depois de aplicar, `npx prisma generate` já é suficiente (schema.prisma já reflete
-- o enum final); não é necessário rodar `prisma db push` em seguida.

BEGIN;

CREATE TYPE "UserRole_new" AS ENUM (
  'PLATFORM_ADMIN',
  'MASTER',
  'COORDENACAO',
  'ENGENHARIA',
  'ADMINISTRATIVO',
  'USER'
);

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE "role"::text
      WHEN 'EDITOR' THEN 'ADMINISTRATIVO'
      ELSE "role"::text
    END
  )::"UserRole_new";

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'USER';

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

COMMIT;
