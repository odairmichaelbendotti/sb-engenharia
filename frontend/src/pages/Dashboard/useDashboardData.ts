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

export type CascadeGap = {
  label: string;
  count: number;
};

export type AttentionItem = {
  id: string;
  label: string;
  meta: string;
  href: string;
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

export function useDashboardData() {
  const { canViewAdministrativo, canViewEngenharia, canManageOrganization } = usePermission();

  const { myTenant, fetchMyTenant, tenantsSummary, fetchTenantsSummary } = useTenants();
  const { data: contratosData, fetchContratos } = useContratos();
  const { data: empenhosData, fetchListEmpenhos } = useEmpenhos();
  const { data: osData, fetchOrdensServico } = useOrdensServico();
  const { data: obrasData, fetchObras } = useObras();
  const invoice = useInvoice();
  const { list: fetchInvoices } = invoice;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const tasks: Promise<unknown>[] = [fetchMyTenant()];
    if (canViewAdministrativo) {
      tasks.push(fetchContratos(), fetchListEmpenhos(), fetchOrdensServico(), fetchInvoices());
    }
    if (canViewEngenharia) {
      tasks.push(fetchObras());
    }
    if (canManageOrganization) {
      tasks.push(fetchTenantsSummary());
    }

    Promise.allSettled(tasks).finally(() => {
      if (!cancelled) setIsLoading(false);
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

  const osEmpenhoIds = useMemo(() => new Set(ordensServico.map((os) => os.empenho.id)), [ordensServico]);

  const empenhosSemOS = useMemo(
    () => empenhos.filter((e) => e.status === "ATIVO" && !osEmpenhoIds.has(e.id)),
    [empenhos, osEmpenhoIds],
  );

  const osSemObra = useMemo(
    () => ordensServico.filter((os) => os.status === "ATIVO" && !os.obra),
    [ordensServico],
  );

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

    const gaps: CascadeGap[] = [];
    if (canViewAdministrativo) {
      gaps.push({ label: "empenhos sem OS", count: empenhosSemOS.length });
    }
    if (canViewAdministrativo && canViewEngenharia) {
      gaps.push({ label: "OS sem obra", count: osSemObra.length });
    }

    return { steps, gaps };
  }, [
    canViewAdministrativo,
    canViewEngenharia,
    contratosData,
    empenhosData,
    osData,
    obrasData,
    empenhosSemOS.length,
    osSemObra.length,
  ]);

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

  const attention = useMemo(() => {
    const items: AttentionItem[] = [];

    if (canViewAdministrativo) {
      for (const e of empenhos) {
        if (e.status !== "ATIVO") continue;
        const days = getDaysRemaining(e.endAt);
        if (days > 30) continue;
        items.push({
          id: `empenho-${e.id}`,
          label: `Empenho ${e.numero}`,
          meta: days < 0 ? `vencido há ${Math.abs(days)}d` : days === 0 ? "vence hoje" : `vence em ${days}d`,
          href: "/empenhos",
        });
      }

      for (const inv of invoice.allInvoices) {
        if (inv.status !== "VENCIDO") continue;
        items.push({
          id: `invoice-${inv.id}`,
          label: `Nota fiscal ${inv.numero}`,
          meta: "vencida",
          href: "/notasfiscais",
        });
      }

      for (const e of empenhosSemOS) {
        items.push({
          id: `empenho-sem-os-${e.id}`,
          label: `Empenho ${e.numero}`,
          meta: "sem ordem de serviço vinculada",
          href: "/empenhos",
        });
      }
    }

    if (canViewAdministrativo && canViewEngenharia) {
      for (const os of osSemObra) {
        items.push({
          id: `os-sem-obra-${os.id}`,
          label: `OS ${os.numero}`,
          meta: "sem obra vinculada",
          href: "/ordens-servico",
        });
      }
    }

    if (canViewEngenharia) {
      for (const o of obras) {
        if (o.status !== "EM_ANDAMENTO") continue;
        const days = getDaysRemaining(o.dataPrevisaoTermino);
        if (days >= 0) continue;
        items.push({
          id: `obra-${o.id}`,
          label: `Obra ${o.identificacaoPatrimonial}`,
          meta: `prazo vencido há ${Math.abs(days)}d`,
          href: "/obras",
        });
      }
    }

    return items;
  }, [canViewAdministrativo, canViewEngenharia, empenhos, invoice.allInvoices, empenhosSemOS, osSemObra, obras]);

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
    tenantName: myTenant?.name ?? null,
    canViewAdministrativo,
    canViewEngenharia,
    canManageOrganization,
    tenantsSummary,
    cascade,
    kpis,
    attention,
    activity,
  };
}
