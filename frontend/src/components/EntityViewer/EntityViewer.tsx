import { useLocation } from "react-router";
import { invoiceLabel } from "../../utils/status-display";
import { useEntityViewer, type EntityRef } from "../../store/entityViewer";
import { useInvoice } from "../../store/invoices";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { useCompanies } from "../../store/companies";
import { useOrdensServico } from "../../store/ordensServico";
import { useObras } from "../../store/obras";
import { InvoiceView } from "./InvoiceView";
import { EmpenhoView } from "./EmpenhoView";
import { ContratoView } from "./ContratoView";
import { EmpresaView } from "./EmpresaView";
import { OrdemServicoView } from "../../pages/OrdemServico/OrdemServicoView";
import { ObraView } from "../../pages/Obra/ObraView";
import type { ViewProps } from "./ViewFrame";

// Nome curto do registro anterior, para o "Voltar para ..."
function useEntityLabel(ref: EntityRef | undefined): string {
  const id = ref?.id;
  const invoice = useInvoice((s) => (ref?.kind === "invoice" ? s.allInvoices.find((i) => i.id === id) : undefined));
  const empenho = useEmpenhos((s) => (ref?.kind === "empenho" ? s.data?.empenhos.find((e) => e.id === id) : undefined));
  const contrato = useContratos((s) => (ref?.kind === "contrato" ? s.data?.contratos.find((c) => c.id === id) : undefined));
  const empresa = useCompanies((s) => (ref?.kind === "empresa" ? s.companies.find((c) => c.id === id) : undefined));
  const os = useOrdensServico((s) => (ref?.kind === "ordemServico" ? s.data?.ordensServico.find((o) => o.id === id) : undefined));
  const obra = useObras((s) => (ref?.kind === "obra" ? s.data?.obras.find((o) => o.id === id) : undefined));

  if (invoice) return invoiceLabel(invoice.numero);
  if (empenho) return empenho.numero;
  if (contrato) return contrato.identificador;
  if (empresa) return empresa.name;
  if (os) return /^OS\b/i.test(os.numero) ? os.numero : `OS ${os.numero}`;
  if (obra) return obra.identificacaoPatrimonial;
  return "o registro anterior";
}

const VIEWS = {
  invoice: InvoiceView,
  empenho: EmpenhoView,
  contrato: ContratoView,
  empresa: EmpresaView,
  ordemServico: OrdemServicoView,
  obra: ObraView,
} satisfies Record<EntityRef["kind"], (props: ViewProps) => React.ReactNode>;

/**
 * Modal de visualização único do app (montado no AppLayout). Mostra o registro do topo da pilha;
 * vínculos dentro dele empilham outro registro e "Voltar" desempilha. "Editar" só aparece quando a
 * página aberta registrou o formulário daquele tipo (useEntityEditor).
 */
export function EntityViewer() {
  const stack = useEntityViewer((s) => s.stack);
  const openedAt = useEntityViewer((s) => s.openedAt);
  const { pathname } = useLocation();
  const editors = useEntityViewer((s) => s.editors);
  const back = useEntityViewer((s) => s.back);
  const close = useEntityViewer((s) => s.close);
  const top = stack[stack.length - 1];
  const previous = stack[stack.length - 2];
  const previousLabel = useEntityLabel(previous);

  // Aberto em outra tela (o usuário navegou): não reaparece aqui
  if (!top || openedAt !== pathname) return null;

  const View = VIEWS[top.kind];
  const editor = editors[top.kind];

  return (
    <View
      key={`${top.kind}:${top.id}`}
      id={top.id}
      back={previous ? { label: previousLabel, onClick: back } : null}
      onClose={close}
      onEdit={
        editor
          ? () => {
              close();
              editor(top.id);
            }
          : undefined
      }
    />
  );
}
