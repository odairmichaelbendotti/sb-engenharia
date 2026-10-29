import { ArrowUpRight, Calculator } from "lucide-react";
import { Link } from "react-router";
import { usePermission } from "../../hooks/usePermission";
import { orcamentoHref } from "./orcamento-link";

/**
 * Selo de orçamento da OS: verde quando há orçamento lançado em itens (abre a planilha em aba nova
 * para quem tem a tela Medições); discreto nas OS antigas, de valor informado à mão.
 */
export function OrcamentoTag({ ordemServicoId, temOrcamento }: { ordemServicoId: string; temOrcamento: boolean }) {
  const { canViewEngenharia } = usePermission();

  if (!temOrcamento) return <span className="whitespace-nowrap">sem orçamento</span>;

  const classes =
    "inline-flex items-center gap-1 h-5 px-1.5 rounded-full border border-success-border bg-success-bg text-success-text text-[11px] font-medium whitespace-nowrap";

  if (!canViewEngenharia) {
    return (
      <span className={classes} title="Orçamento lançado em itens">
        <Calculator size={11} aria-hidden />
        Orçamento
      </span>
    );
  }

  return (
    <Link
      to={orcamentoHref(ordemServicoId)}
      target="_blank"
      rel="noopener"
      // Não abre a OS (clique na linha da tabela)
      onClick={(e) => e.stopPropagation()}
      title="Abrir o orçamento em uma aba nova"
      className={`${classes} hover:bg-success-border/40 transition-colors`}
    >
      <Calculator size={11} aria-hidden />
      Orçamento
      <ArrowUpRight size={11} aria-hidden />
    </Link>
  );
}
