import { Fragment, useState } from "react";
import { AlertTriangle, CircleMinus } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import { formatQuantidade, parseQuantidade, sanitizeDecimalInput, toDecimalInput, valorItem } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableGroupRow,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { matchesItemSearch } from "./medicao-progress";
import { contagemItens, gruposPorEtapa, SEM_ETAPA, temEtapas, useEtapasRecolhidas } from "./etapas";

// Item do orçamento em edição, como o diálogo precisa dele (quantidades decimais, preço que vale)
export type ItemSupressao = {
  key: number;
  posicao: number;
  codigo: string;
  descricao: string;
  etapa: string;
  unidade: string;
  quantidade: number;
  suprimida: number;
  // Soma das medições fechadas: a supressão não pode alcançar
  medido: number;
  preco: number;
};

interface SupressoesDialogProps {
  itens: ItemSupressao[];
  onClose: () => void;
  // Supressão nova de cada item (key → quantidade decimal)
  onApply: (supressoes: Map<number, number>) => void;
}

const COLUMNS = [undefined, "hidden sm:table-cell", undefined, "hidden md:table-cell"];

/**
 * Supressões do orçamento: em vez de excluir o item ou baixar a quantidade contratada, o usuário
 * informa quanto dele sai do contrato. O item fica na planilha e vale pela quantidade efetiva.
 */
export function SupressoesDialog({ itens, onClose, onApply }: SupressoesDialogProps) {
  const [valores, setValores] = useState<Record<number, string>>(() =>
    Object.fromEntries(itens.map((i) => [i.key, i.suprimida > 0 ? toDecimalInput(i.suprimida) : ""])),
  );
  const [busca, setBusca] = useState("");
  const etapas = useEtapasRecolhidas(busca !== "");

  const suprimida = (i: ItemSupressao) => parseQuantidade(valores[i.key] ?? "") ?? 0;
  const problema = (i: ItemSupressao) => {
    const s = suprimida(i);
    if (s > i.quantidade) return `até ${formatQuantidade(i.quantidade)} ${i.unidade}`;
    if (i.medido > 0 && i.quantidade - s < i.medido - 1e-9) {
      return `já medidos ${formatQuantidade(i.medido)}: máx. ${formatQuantidade(i.quantidade - i.medido)}`;
    }
    return null;
  };
  const comProblema = itens.filter((i) => problema(i) !== null);
  const suprimidos = itens.filter((i) => suprimida(i) > 0);
  const valorSuprimido = suprimidos.reduce((acc, i) => acc + valorItem(suprimida(i), i.preco), 0);

  const visiveis = itens.filter((i) => matchesItemSearch(i, busca));
  const grupos = gruposPorEtapa(visiveis, (i) => i.etapa);
  const comEtapas = temEtapas(grupos);

  function aplicar() {
    onApply(new Map(itens.map((i) => [i.key, suprimida(i)])));
  }

  return (
    <Modal open size="xl" onClose={onClose}>
      <ModalHeader
        icon={CircleMinus}
        title="Supressões do orçamento"
        description="Informe quanto de cada item sai do contrato. O item continua na planilha e passa a valer pela quantidade restante."
        onClose={onClose}
      />
      <ModalBody className="space-y-3">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHead>
              <Th>Item</Th>
              <Th width="w-32" className="hidden sm:table-cell">
                Contratado
              </Th>
              <Th width="w-40">Suprimir</Th>
              <Th width="w-32" className="hidden md:table-cell">
                Vale
              </Th>
            </TableHead>
            <TableBody>
              {grupos.map((grupo) => {
                const aberta = etapas.aberta(grupo.key);
                return (
                  <Fragment key={grupo.key}>
                    {comEtapas && (
                      <TableGroupRow
                        columns={COLUMNS}
                        title={grupo.etapa ?? SEM_ETAPA}
                        count={contagemItens(grupo.itens.length)}
                        open={aberta}
                        onToggle={() => etapas.alternar(grupo.key)}
                      />
                    )}
                    {aberta &&
                      grupo.itens.map((i) => {
                        const s = suprimida(i);
                        const erro = problema(i);
                        return (
                          <Tr key={i.key}>
                            <Td>
                              <p className="truncate font-medium text-text-primary" title={i.descricao}>
                                {i.posicao}. {i.descricao}
                              </p>
                              <p className="text-[11px] text-text-muted truncate">
                                {[i.codigo, `${formatCurrency(i.preco)}/${i.unidade}`].filter(Boolean).join(" · ")}
                                <span className="sm:hidden">
                                  {" "}
                                  · {formatQuantidade(i.quantidade)} {i.unidade} contratados
                                </span>
                              </p>
                            </Td>
                            <Td className="hidden sm:table-cell">
                              {formatQuantidade(i.quantidade)} {i.unidade}
                            </Td>
                            <Td>
                              <div className="w-36 max-w-full mx-auto text-left">
                                <Input
                                  size="sm"
                                  inputMode="decimal"
                                  aria-label={`Quantidade suprimida de ${i.descricao}`}
                                  placeholder="0,00"
                                  suffix={i.unidade}
                                  invalid={erro !== null}
                                  value={valores[i.key] ?? ""}
                                  onChange={(e) =>
                                    setValores((prev) => ({ ...prev, [i.key]: sanitizeDecimalInput(e.target.value) }))
                                  }
                                />
                                {erro ? (
                                  <p className="mt-0.5 text-[11px] text-danger-text">{erro}</p>
                                ) : (
                                  <button
                                    type="button"
                                    className="mt-0.5 text-[11px] text-text-muted whitespace-nowrap cursor-pointer hover:underline"
                                    title="Suprimir todo o restante do item"
                                    onClick={() =>
                                      setValores((prev) => ({ ...prev, [i.key]: toDecimalInput(i.quantidade - i.medido) }))
                                    }
                                  >
                                    {i.medido > 0 ? "suprimir o não medido" : "suprimir tudo"}
                                  </button>
                                )}
                              </div>
                            </Td>
                            <Td className="hidden md:table-cell">
                              <span className={cx("block", s > 0 ? "text-text-primary" : "text-text-muted")}>
                                {formatQuantidade(Math.max(0, Math.round((i.quantidade - s) * 1000) / 1000))} {i.unidade}
                              </span>
                              {s > 0 && !erro && (
                                <span className="block text-[11px] text-danger-text tabular-nums">
                                  −{formatCurrency(valorItem(s, i.preco))}
                                </span>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
          {visiveis.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">
              {itens.length === 0 ? "Inclua itens no orçamento antes de suprimir." : `Nenhum item encontrado para “${busca}”.`}
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <p
          className={cx(
            "mr-auto flex items-center gap-1.5 text-xs tabular-nums",
            comProblema.length > 0 ? "text-danger-text" : suprimidos.length > 0 ? "text-danger-text" : "text-text-muted",
          )}
        >
          {comProblema.length > 0 ? (
            <>
              <AlertTriangle size={13} />
              Corrija {comProblema.length === 1 ? "o item marcado" : `os ${comProblema.length} itens marcados`}
            </>
          ) : suprimidos.length > 0 ? (
            `${contagemItens(suprimidos.length)} com supressão · −${formatCurrency(valorSuprimido)}`
          ) : (
            "Nenhuma supressão"
          )}
        </p>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={comProblema.length > 0} onClick={aplicar}>
          Aplicar supressões
        </Button>
      </ModalFooter>
    </Modal>
  );
}
