-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'MASTER', 'COORDENACAO', 'ENGENHARIA', 'ADMINISTRATIVO', 'USER', 'EMPRESA');

-- CreateEnum
CREATE TYPE "ObraStatus" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA', 'PARALISADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ObraTipo" AS ENUM ('CONSTRUCAO', 'REFORMA', 'AMPLIACAO', 'PAVIMENTACAO', 'SANEAMENTO', 'MANUTENCAO_PREDIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "EmpenhoStatus" AS ENUM ('ATIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EmpenhoCategory" AS ENUM ('MANUTENCAO_PREDIAL', 'ALIMENTACAO', 'HOSPITALAR', 'COMBUSTIVEL', 'TECNOLOGIA', 'LIMPEZA_CONSERVACAO', 'SEGURANCA_VIGILANCIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "ContratoStatus" AS ENUM ('ATIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FiscalContratoTipo" AS ENUM ('TECNICO', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "OrdemServicoStatus" AS ENUM ('ATIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrdemServicoUrgencia" AS ENUM ('EMERGENCIA', 'URGENCIA', 'PROGRAMADA', 'PREVENTIVA');

-- CreateEnum
CREATE TYPE "OrdemServicoEventoTipo" AS ENUM ('EMITIDA', 'REEMITIDA', 'VISUALIZADA', 'CIENTE', 'PRAZO_VENCIDO', 'CONTESTACAO', 'CONTESTACAO_ACATADA', 'CONTESTACAO_RECUSADA', 'COMENTARIO', 'STATUS_ALTERADO');

-- CreateEnum
CREATE TYPE "OrdemServicoContestacaoStatus" AS ENUM ('ABERTA', 'ACATADA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "NotificacaoDestino" AS ENUM ('EMPRESA', 'FISCALIZACAO');

-- CreateEnum
CREATE TYPE "NotificacaoTipo" AS ENUM ('OS_EMITIDA', 'OS_REEMITIDA', 'OS_CIENTE', 'OS_PRAZO_VENCIDO', 'OS_CONTESTACAO', 'OS_CONTESTACAO_RESPONDIDA', 'OS_COMENTARIO');

-- CreateEnum
CREATE TYPE "OrcamentoPrecoBase" AS ENUM ('COM_BDI', 'COM_BDI_E_DESCONTO');

-- CreateEnum
CREATE TYPE "RegraDesconto" AS ENUM ('SIMPLES', 'SCOAM');

-- CreateEnum
CREATE TYPE "EscopoOrcamento" AS ENUM ('ORDEM_SERVICO', 'CONTRATO');

-- CreateEnum
CREATE TYPE "MedicaoStatus" AS ENUM ('RASCUNHO', 'FECHADA');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hasActiveContract" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCompany" (
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantCompany_pkey" PRIMARY KEY ("tenant_id","company_id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "identificacaoPatrimonial" TEXT NOT NULL DEFAULT 'E-00',
    "tipo" "ObraTipo" NOT NULL,
    "status" "ObraStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "descricao" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "valorExecutado" INTEGER NOT NULL DEFAULT 0,
    "dataConclusao" TIMESTAMP(3),
    "responsavelTecnico" TEXT NOT NULL,
    "anotacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idPatrimonialCompleto" TEXT,
    "apelido" TEXT,
    "areaConstruida" DOUBLE PRECISION,
    "estadoConservacao" TEXT,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "descricaoCurta" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "ContratoStatus" NOT NULL DEFAULT 'ATIVO',
    "cor" TEXT NOT NULL DEFAULT '#4f759c',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ePag" TEXT NOT NULL DEFAULT 'A PREENCHER',
    "etp" TEXT NOT NULL DEFAULT 'A PREENCHER',
    "termoReferencia" TEXT NOT NULL DEFAULT 'A PREENCHER',
    "dataBaseSinapi" TEXT NOT NULL DEFAULT 'A PREENCHER',
    "endereco" TEXT NOT NULL DEFAULT 'A PREENCHER',
    "bdi" DOUBLE PRECISION NOT NULL DEFAULT 21.19,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "desconto" DOUBLE PRECISION NOT NULL,
    "contrato_id" TEXT NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalContrato" (
    "id" TEXT NOT NULL,
    "tipo" "FiscalContratoTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "ramal" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,

    CONSTRAINT "FiscalContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empenho" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EmpenhoCategory" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "status" "EmpenhoStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,

    CONSTRAINT "Empenho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "status" "OrdemServicoStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT NOT NULL,
    "empenho_id" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataPrevisaoTermino" TIMESTAMP(3),
    "obra_id" TEXT,
    "sequencia" INTEGER,
    "anoNumeracao" INTEGER,
    "lote_id" TEXT,
    "setorRequisitante" TEXT,
    "urgencia" "OrdemServicoUrgencia",
    "dataVistoria" TIMESTAMP(3),
    "descricaoProblema" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "prazoMobilizacaoDias" INTEGER NOT NULL DEFAULT 7,
    "prazoDias" INTEGER,
    "totalComBdi" INTEGER,
    "precoBase" "OrcamentoPrecoBase" NOT NULL DEFAULT 'COM_BDI',
    "regraDesconto" "RegraDesconto" NOT NULL DEFAULT 'SIMPLES',
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escopoOrcamento" "EscopoOrcamento" NOT NULL DEFAULT 'ORDEM_SERVICO',
    "aguardandoEmissao" BOOLEAN NOT NULL DEFAULT false,
    "estimativaComBdi" INTEGER,
    "estimativaReferencia" TEXT,
    "fiscalSetorial" TEXT,
    "fiscalTecnico_id" TEXT,
    "fiscalAdministrativo_id" TEXT,
    "condicoesEspeciais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "anexos" JSONB,
    "comentariosTecnicos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emitidaEm" TIMESTAMP(3),
    "cienciaPrazoAte" TIMESTAMP(3),
    "cienciaDispensada" BOOLEAN NOT NULL DEFAULT false,
    "visualizadaEm" TIMESTAMP(3),
    "cienteEm" TIMESTAMP(3),
    "cienteUser_id" TEXT,
    "cienteNome" TEXT,
    "prazoVencidoEm" TIMESTAMP(3),

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoEvento" (
    "id" TEXT NOT NULL,
    "tipo" "OrdemServicoEventoTipo" NOT NULL,
    "texto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemServico_id" TEXT NOT NULL,
    "autor_id" TEXT,
    "autorNome" TEXT NOT NULL,
    "autorPerfil" TEXT NOT NULL,
    "autorEmpresa" TEXT,
    "contestacao_id" TEXT,

    CONSTRAINT "OrdemServicoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoContestacao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "status" "OrdemServicoContestacaoStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemServico_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "autorNome" TEXT NOT NULL,
    "resposta" TEXT,
    "respondidoPor_id" TEXT,
    "respondidoPorNome" TEXT,
    "respondidoEm" TIMESTAMP(3),

    CONSTRAINT "OrdemServicoContestacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "destino" "NotificacaoDestino" NOT NULL,
    "tipo" "NotificacaoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,
    "ordemServico_id" TEXT,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacaoLeitura" (
    "notificacao_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoLeitura_pkey" PRIMARY KEY ("notificacao_id","user_id")
);

-- CreateTable
CREATE TABLE "OrdemServicoEmpenho" (
    "id" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemServico_id" TEXT NOT NULL,
    "empenho_id" TEXT NOT NULL,

    CONSTRAINT "OrdemServicoEmpenho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoItem" (
    "id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "etapa" TEXT,
    "unidade" TEXT NOT NULL,
    "quantidade" BIGINT NOT NULL,
    "quantidadeSuprimida" BIGINT NOT NULL DEFAULT 0,
    "precoUnitario" INTEGER NOT NULL,
    "precoReferencia" INTEGER,
    "valorTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemServico_id" TEXT NOT NULL,

    CONSTRAINT "OrdemServicoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicao" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "MedicaoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor_id" TEXT,
    "criadoPorNome" TEXT NOT NULL,
    "fechadaEm" TIMESTAMP(3),
    "fechadaPor_id" TEXT,
    "fechadaPorNome" TEXT,
    "reabertaEm" TIMESTAMP(3),
    "reabertaPorNome" TEXT,
    "planilhaFechamento" JSONB,
    "ordemServico_id" TEXT NOT NULL,

    CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicaoItem" (
    "id" TEXT NOT NULL,
    "quantidade" BIGINT NOT NULL,
    "medicao_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "MedicaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_fiscal" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empenho_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "obra_id" TEXT,
    "ordemServico_id" TEXT,
    "medicao_id" TEXT,

    CONSTRAINT "nota_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_apelido_key" ON "Tenant"("apelido");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cnpj_key" ON "Tenant"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_identificador_tenant_id_key" ON "Contrato"("identificador", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_contrato_id_numero_key" ON "Lote"("contrato_id", "numero");

-- CreateIndex
CREATE INDEX "FiscalContrato_contrato_id_idx" ON "FiscalContrato"("contrato_id");

-- CreateIndex
CREATE UNIQUE INDEX "Empenho_numero_key" ON "Empenho"("numero");

-- CreateIndex
CREATE INDEX "OrdemServico_obra_id_idx" ON "OrdemServico"("obra_id");

-- CreateIndex
CREATE INDEX "OrdemServico_lote_id_idx" ON "OrdemServico"("lote_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_numero_tenant_id_key" ON "OrdemServico"("numero", "tenant_id");

-- CreateIndex
CREATE INDEX "OrdemServicoEvento_ordemServico_id_createdAt_idx" ON "OrdemServicoEvento"("ordemServico_id", "createdAt");

-- CreateIndex
CREATE INDEX "OrdemServicoContestacao_ordemServico_id_status_idx" ON "OrdemServicoContestacao"("ordemServico_id", "status");

-- CreateIndex
CREATE INDEX "Notificacao_tenant_id_destino_createdAt_idx" ON "Notificacao"("tenant_id", "destino", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacao_company_id_createdAt_idx" ON "Notificacao"("company_id", "createdAt");

-- CreateIndex
CREATE INDEX "NotificacaoLeitura_user_id_idx" ON "NotificacaoLeitura"("user_id");

-- CreateIndex
CREATE INDEX "OrdemServicoEmpenho_empenho_id_idx" ON "OrdemServicoEmpenho"("empenho_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServicoEmpenho_ordemServico_id_empenho_id_key" ON "OrdemServicoEmpenho"("ordemServico_id", "empenho_id");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_ordemServico_id_ordem_idx" ON "OrdemServicoItem"("ordemServico_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Medicao_ordemServico_id_numero_key" ON "Medicao"("ordemServico_id", "numero");

-- CreateIndex
CREATE INDEX "MedicaoItem_item_id_idx" ON "MedicaoItem"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "MedicaoItem_medicao_id_item_id_key" ON "MedicaoItem"("medicao_id", "item_id");

-- CreateIndex
CREATE INDEX "nota_fiscal_ordemServico_id_idx" ON "nota_fiscal"("ordemServico_id");

-- CreateIndex
CREATE INDEX "nota_fiscal_medicao_id_idx" ON "nota_fiscal"("medicao_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCompany" ADD CONSTRAINT "TenantCompany_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCompany" ADD CONSTRAINT "TenantCompany_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalContrato" ADD CONSTRAINT "FiscalContrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empenho" ADD CONSTRAINT "Empenho_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empenho" ADD CONSTRAINT "Empenho_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empenho_id_fkey" FOREIGN KEY ("empenho_id") REFERENCES "Empenho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "Obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_fiscalTecnico_id_fkey" FOREIGN KEY ("fiscalTecnico_id") REFERENCES "FiscalContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_fiscalAdministrativo_id_fkey" FOREIGN KEY ("fiscalAdministrativo_id") REFERENCES "FiscalContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoEvento" ADD CONSTRAINT "OrdemServicoEvento_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoEvento" ADD CONSTRAINT "OrdemServicoEvento_contestacao_id_fkey" FOREIGN KEY ("contestacao_id") REFERENCES "OrdemServicoContestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoContestacao" ADD CONSTRAINT "OrdemServicoContestacao_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoLeitura" ADD CONSTRAINT "NotificacaoLeitura_notificacao_id_fkey" FOREIGN KEY ("notificacao_id") REFERENCES "Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoLeitura" ADD CONSTRAINT "NotificacaoLeitura_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoEmpenho" ADD CONSTRAINT "OrdemServicoEmpenho_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoEmpenho" ADD CONSTRAINT "OrdemServicoEmpenho_empenho_id_fkey" FOREIGN KEY ("empenho_id") REFERENCES "Empenho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicaoItem" ADD CONSTRAINT "MedicaoItem_medicao_id_fkey" FOREIGN KEY ("medicao_id") REFERENCES "Medicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicaoItem" ADD CONSTRAINT "MedicaoItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "OrdemServicoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal" ADD CONSTRAINT "nota_fiscal_empenho_id_fkey" FOREIGN KEY ("empenho_id") REFERENCES "Empenho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal" ADD CONSTRAINT "nota_fiscal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal" ADD CONSTRAINT "nota_fiscal_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "Obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal" ADD CONSTRAINT "nota_fiscal_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal" ADD CONSTRAINT "nota_fiscal_medicao_id_fkey" FOREIGN KEY ("medicao_id") REFERENCES "Medicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
