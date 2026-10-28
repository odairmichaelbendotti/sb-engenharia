import { Ruler } from "lucide-react";
import type { MedicaoParaNota } from "../../../types/obra";
import { Field, Select } from "../../components/ui";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { invoiceLabel } from "../../utils/status-display";
import { medicaoTitulo } from "../OrdemServico/medicao-display";

interface MedicaoFieldProps {
  medicoes: MedicaoParaNota[];
  value: string;
  // Nota em edição: a medição que ela já paga continua disponível
  invoiceId?: string;
  onChange: (medicao: MedicaoParaNota | null) => void;
}

/**
 * Medição fechada da OS que a nota paga. Escolhida, o valor da nota passa a ser o da medição;
 * sem medição, o valor é digitado. Medição já paga por outra nota fica indisponível.
 */
export function MedicaoField({ medicoes, value, invoiceId, onChange }: MedicaoFieldProps) {
  return (
    <Field label="Medição" hint="Com uma medição, o valor da nota é o dela">
      <Select
        icon={Ruler}
        value={value}
        onChange={(e) => onChange(medicoes.find((m) => m.id === e.target.value) ?? null)}
      >
        <option value="">Sem medição: digitar o valor</option>
        {medicoes.map((m) => {
          const outraNota = m.notaFiscal && m.notaFiscal.id !== invoiceId ? m.notaFiscal : null;
          return (
            <option key={m.id} value={m.id} disabled={outraNota !== null}>
              {medicaoTitulo(m.numero)} · {formatDateOnly(m.periodoInicio)} a {formatDateOnly(m.periodoFim)} ·{" "}
              {formatCurrency(m.valor)}
              {outraNota ? ` · já na ${invoiceLabel(outraNota.numero)}` : ""}
            </option>
          );
        })}
      </Select>
    </Field>
  );
}
