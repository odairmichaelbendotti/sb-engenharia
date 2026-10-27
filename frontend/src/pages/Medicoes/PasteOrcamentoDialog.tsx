import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardPaste } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import { formatQuantidade, valorItem } from "../../utils/decimal";
import {
  Button,
  Field,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SegmentedControl,
  Table,
  TableBody,
  TableHead,
  Td,
  Textarea,
  Th,
  Tr,
} from "../../components/ui";
import { parsePastedBudget, type PastedItem } from "./parse-pasted-budget";

export type PasteMode = "append" | "replace";

interface PasteOrcamentoDialogProps {
  // Texto já colado (Ctrl+V na tela); vazio abre com o campo para colar
  initialText: string;
  // Itens que ainda cabem no orçamento em cada modo
  limite: Record<PasteMode, number>;
  // Há itens já medidos: "substituir" mantém esses
  temMedidos: boolean;
  // Preços já com desconto (vale o total da planilha); sem ele, o sistema aplica o desconto e o total é ignorado
  comDesconto: boolean;
  onClose: () => void;
  onApply: (itens: PastedItem[], mode: PasteMode) => void;
}

// Itens copiados do Excel: prévia com o erro de cada linha antes de entrar na grade
export function PasteOrcamentoDialog({
  initialText,
  limite,
  temMedidos,
  comDesconto,
  onClose,
  onApply,
}: PasteOrcamentoDialogProps) {
  const [texto, setTexto] = useState(initialText);
  const [mode, setMode] = useState<PasteMode>("append");
  const linhas = useMemo(() => parsePastedBudget(texto), [texto]);
  const validas = linhas.flatMap((l) => (l.item ? [l.item] : []));
  const comErro = linhas.length - validas.length;
  const excedente = Math.max(0, validas.length - limite[mode]);
  const totalItem = (i: PastedItem) => i.valorTotal ?? valorItem(i.quantidade, i.precoUnitario);
  const total = validas.reduce((acc, i) => acc + totalItem(i), 0);
  const ajustados = validas.filter((i) => i.valorTotal !== null).length;

  return (
    <Modal open size="xl" onClose={onClose}>
      <ModalHeader
        icon={ClipboardPaste}
        title="Colar itens do Excel"
        description={`Colunas: código, descrição, unidade, quantidade, preço unitário (${comDesconto ? "com BDI e desconto" : "com BDI"}) e total (opcional)`}
        onClose={onClose}
      />
      <ModalBody className="space-y-3">
        <Field
          label="Linhas copiadas da planilha"
          hint={
            comDesconto
              ? "Selecione as linhas no Excel, copie (Ctrl+C) e cole aqui. Sem a coluna de código, use quatro colunas. Com a coluna do total, vale o total da planilha quando ele difere de quantidade × preço por centavos."
              : "Selecione as linhas no Excel, copie (Ctrl+C) e cole aqui. Sem a coluna de código, use quatro colunas. O desconto da OS é aplicado em cada preço depois de colar; a coluna do total só confere a linha."
          }
        >
          <Textarea
            rows={linhas.length > 0 ? 3 : 8}
            value={texto}
            placeholder={"87878\tChapisco em parede\tm²\t120,5\t4,32"}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Field>

        {linhas.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">{validas.length}</span>{" "}
                {validas.length === 1 ? "item reconhecido" : "itens reconhecidos"} · {formatCurrency(total)}
                {comDesconto && ajustados > 0 && (
                  <span className="text-text-muted">
                    {" "}
                    · {ajustados} {ajustados === 1 ? "total ajustado" : "totais ajustados"} à planilha
                  </span>
                )}
                {comErro > 0 && (
                  <span className="text-warning-text">
                    {" "}
                    · {comErro} {comErro === 1 ? "linha ignorada" : "linhas ignoradas"}
                  </span>
                )}
              </p>
              <SegmentedControl<PasteMode>
                label="Como aplicar"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "append", label: "Adicionar ao final" },
                  { value: "replace", label: temMedidos ? "Substituir os não medidos" : "Substituir tudo" },
                ]}
              />
            </div>

            <div className="rounded-lg border border-border overflow-hidden max-h-[45vh] overflow-y-auto">
              <Table compact>
                <TableHead>
                  <Th>Linha</Th>
                  <Th>Item</Th>
                  <Th>Quantidade</Th>
                  <Th>Preço unit.</Th>
                  <Th>Total</Th>
                </TableHead>
                <TableBody>
                  {linhas.map((l) => (
                    <Tr key={l.linha} muted={!l.item}>
                      <Td>{l.linha}</Td>
                      <Td>
                        {l.item ? (
                          <>
                            <span className="block text-text-primary line-clamp-2" title={l.item.descricao}>
                              {l.item.descricao}
                            </span>
                            {l.item.codigo && <span className="block text-[11px] text-text-muted">{l.item.codigo}</span>}
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-warning-text">
                              <AlertTriangle size={11} className="shrink-0" />
                              {l.erro}
                            </span>
                            <span className="block text-[11px] text-text-muted truncate" title={l.texto}>
                              {l.texto.replace(/\t/g, " · ")}
                            </span>
                          </>
                        )}
                      </Td>
                      <Td>{l.item ? `${formatQuantidade(l.item.quantidade)} ${l.item.unidade}` : "—"}</Td>
                      <Td>{l.item ? formatCurrency(l.item.precoUnitario) : "—"}</Td>
                      <Td>
                        {l.item ? (
                          <>
                            <span className="block">{formatCurrency(totalItem(l.item))}</span>
                            {comDesconto && l.item.valorTotal !== null && (
                              <span className="block text-[11px] text-text-muted">ajustado</span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {excedente > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-danger-text">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />O orçamento aceita até 500 itens: {excedente}{" "}
                {excedente === 1 ? "item passa" : "itens passam"} do limite.
              </p>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          icon={ClipboardPaste}
          disabled={validas.length === 0 || excedente > 0}
          onClick={() => onApply(validas, mode)}
        >
          {validas.length > 0
            ? `Aplicar ${validas.length} ${validas.length === 1 ? "item" : "itens"}`
            : "Aplicar itens"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
