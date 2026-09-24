import { useEffect, useMemo, useState } from "react";
import { usePermission } from "../../hooks/usePermission";
import { useTenants } from "../../store/tenants";
import { useContratos } from "../../store/contratos";
import { useEmpenhos } from "../../store/empenhos";
import { useOrdensServico } from "../../store/ordensServico";
import { useObras } from "../../store/obras";
import { useInvoice } from "../../store/invoices";
import { getDaysRemaining } from "../../utils/date-urgency";

export type CascadeStep = {
  key: "contratos" | "empenhos" | "os" | "obras";
  label: string;
  count: number;
  href: string;
};

export type AttentionItem = {
  id: string;
  label: string;
  meta: string;
  href: string;
};

export type AttentionGroup = {
  key: string;
  label: string;
  items: AttentionItem[];
};

export type ActivityItem = {
  id: string;
  type: "contrato" | "empenho" | "os" | "obra" | "invoice";
  typeLabel: string;
  label: string;
  createdAt: Date | string;
  href: string;
};

const ACTIVITY_LIMIT = 8;
const EMPENHO_WARNING_DAYS = 30;

export function useDashboardData() {
  const {
    canViewAdministrativo,
    canViewEngenharia,
    canEditAdministrativo,
    canEditEngenharia,
    canManageOrganization,
  } = usePermission();

  const { myTenant, fetchMyTenant, tenantsSummary, fetchTenantsSummary } = useTenants();
  const { data: contratosData, fetchContratos } = useContratos();
  const { data: empenhosData, fetchListEmpenhos } = useEmpenhos();
  const { data: osData, fetchOrdensServico } = useOrdensServico();
  const { data: obrasData, fetchObras } = useObras();
  const invoice = useInvoice();
  const { list: fetchInvoices } = invoice;

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // PLATFORM_ADMIN recebe as listagens de todas as organizações; o dashboard
    // dele usa só o resumo agregado por organização.
    const tasks: Promise<unknown>[] = [];
    if (canManageOrganization) {
      tasks.push(fetchTenantsSummary());
    } else {
      tasks.push(fetchMyTenant());
      if (canViewAdministrativo) {
        tasks.push(fetchContratos(), fetchListEmpenhos(), fetchOrdensServico(), fetchInvoices());
      }
      if (canViewEngenharia) {
        tasks.push(fetchObras());
      }
    }

    Promise.allSettled(tasks).then((results) => {
      if (cancelled) return;
      setHasLoadError(results.some((r) => r.status === "rejected"));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAdministrativo, canViewEngenharia, canManageOrganization]);

  const contratos = useMemo(() => contratosData?.contratos ?? [], [contratosData]);
  const empenhos = useMemo(() => empenhosData?.empenhos ?? [], [empenhosData]);
  const ordensServico = useMemo(() => osData?.ordensServico ?? [], [osData]);
  const obras = useMemo(() => obrasData?.obras ?? [], [obrasData]);

  const cascade = useMemo(() => {
    const steps: CascadeStep[] = [];
    if (canViewAdministrativo) {
      steps.push(
        { key: "contratos", label: "Contratos ativos", count: contratosData?.stats.ativos ?? 0, href: "/contratos" },
        { key: "empenhos", label: "Empenhos ativos", count: empenhosData?.activeEmpenhos ?? 0, href: "/empenhos" },
        { key: "os", label: "Ordens de Serviço ativas", count: osData?.stats.ativas ?? 0, href: "/ordens-servico" },
      );
    }
    if (canViewEngenharia) {
      steps.push({
        key: "obras",
        label: "Obras em andamento",
        count: obrasData?.stats.emAndamento ?? 0,
        href: "/obras",
      });
    }
    return steps;
  }, [canViewAdministrativo, canViewEngenharia, contratosData, empenhosData, osData, obrasData]);

  const kpis = useMemo(() => {
    const empresasComContratoAtivo = canViewAdministrativo
      ? new Set(contratos.filter((c) => c.status === "ATIVO").map((c) => c.company.id)).size
      : 0;

    const notasPendentesVencidas = canViewAdministrativo
      ? { count: invoice.pendingInvoices + invoice.expiredCount, value: invoice.pendingValue + invoice.expiredValue }
      : { count: 0, value: 0 };

    const saldoEmpenhosAtivo = canViewAdministrativo
      ? empenhos.filter((e) => e.status === "ATIVO").reduce((sum, e) => sum + e.saldoDisponivel, 0)
      : 0;

    return {
      empresasComContratoAtivo,
      notasPendentesVencidas,
      saldoEmpenhosAtivo,
      orcamentoObras: obrasData?.stats.orcamentoTotal ?? 0,
      valorExecutadoObras: obrasData?.stats.valorExecutadoTotal ?? 0,
    };
  }, [canViewAdministrativo, contratos, empenhos, obrasData, invoice.pendingInvoices, invoice.expiredCount, invoice.pendingValue, invoice.expiredValue]);

  // Só entra aqui o que o usuário consegue resolver — quem só visualiza um
  // domínio não recebe pendências dele.
  const attention = useMemo(() => {
    const groups: AttentionGroup[] = [];

    if (canEditAdministrativo) {
      const empenhosVencendo = empenhos
        .filter((e) => e.status === "ATIVO")
        .map((e) => ({ e, days: getDaysRemaining(e.endAt) }))
        .filter(({ days }) => days <= EMPENHO_WARNING_DAYS)
        .sort((a, b) => a.days - b.days)
        .map(({ e, days }) => ({
          id: `empenho-${e.id}`,
          label: `Empenho ${e.numero}`,
          meta: days < 0 ? `vencido há ${Math.abs(days)}d` : days === 0 ? "vence hoje" : `vence em ${days}d`,
          href: "/empenhos",
        }));
      groups.push({ key: "empenhos-vencendo", label: "Empenhos vencidos ou vencendo em 30 dias", items: empenhosVencendo });

      groups.push({
        key: "notas-vencidas",
        label: "Notas fiscais vencidas",
        items: invoice.allInvoices
          .filter((inv) => inv.status === "VENCIDO")
          .map((inv) => ({ id: `invoice-${inv.id}`, label: `Nota fiscal ${inv.numero}`, meta: "vencida", href: "/notasfiscais" })),
      });

      const osEmpenhoIds = new Set(ordensServico.map((os) => os.empenho.id));
      groups.push({
        key: "empenhos-sem-os",
        label: "Empenhos ativos sem ordem de serviço",
        items: empenhos
          .filter((e) => e.status === "ATIVO" && !osEmpenhoIds.has(e.id))
          .map((e) => ({ id: `empenho-sem-os-${e.id}`, label: `Empenho ${e.numero}`, meta: "sem OS", href: "/empenhos" })),
      });
    }

    if (canEditEngenharia) {
      if (canViewAdministrativo) {
        groups.push({
          key: "os-sem-obra",
          label: "Ordens de serviço ativas sem obra",
          items: ordensServico
            .filter((os) => os.status === "ATIVO" && !os.obra)
            .map((os) => ({ id: `os-sem-obra-${os.id}`, label: `OS ${os.numero}`, meta: "sem obra", href: "/ordens-servico" })),
        });
      }

      groups.push({
        key: "obras-atrasadas",
        label: "Obras com prazo vencido",
        items: obras
          .filter((o) => o.status === "EM_ANDAMENTO")
          .map((o) => ({ o, days: getDaysRemaining(o.dataPrevisaoTermino) }))
          .filter(({ days }) => days < 0)
          .sort((a, b) => a.days - b.days)
          .map(({ o, days }) => ({
            id: `obra-${o.id}`,
            label: `Obra ${o.identificacaoPatrimonial}`,
            meta: `atrasada ${Math.abs(days)}d`,
            href: "/obras",
          })),
      });
    }

    return groups.filter((g) => g.items.length > 0);
  }, [canEditAdministrativo, canEditEngenharia, canViewAdministrativo, empenhos, invoice.allInvoices, ordensServico, obras]);

  const activity = useMemo(() => {
    const items: ActivityItem[] = [];

    if (canViewAdministrativo) {
      for (const c of contratos) {
        items.push({ id: `contrato-${c.id}`, type: "contrato", typeLabel: "Contrato", label: c.identificador, createdAt: c.createdAt, href: "/contratos" });
      }
      for (const e of empenhos) {
        items.push({ id: `empenho-${e.id}`, type: "empenho", typeLabel: "Empenho", label: e.numero, createdAt: e.createdAt, href: "/empenhos" });
      }
      for (const os of ordensServico) {
        items.push({ id: `os-${os.id}`, type: "os", typeLabel: "Ordem de Serviço", label: os.numero, createdAt: os.createdAt, href: "/ordens-servico" });
      }
      for (const inv of invoice.allInvoices) {
        items.push({ id: `invoice-${inv.id}`, type: "invoice", typeLabel: "Nota Fiscal", label: inv.numero, createdAt: inv.createdAt, href: "/notasfiscais" });
      }
    }

    if (canViewEngenharia) {
      for (const o of obras) {
        items.push({ id: `obra-${o.id}`, type: "obra", typeLabel: "Obra", label: o.nome, createdAt: o.createdAt, href: "/obras" });
      }
    }

    return items
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, ACTIVITY_LIMIT);
  }, [canViewAdministrativo, canViewEngenharia, contratos, empenhos, ordensServico, invoice.allInvoices, obras]);

  return {
    isLoading,
    hasLoadError,
    tenantName: myTenant?.name ?? null,
    canViewAdministrativo,
    canViewEngenharia,
    canManageOrganization,
    engenhariaFirst: canEditEngenharia && !canEditAdministrativo,
    tenantsSummary,
    cascade,
    kpis,
    attention,
    activity,
  };
}
