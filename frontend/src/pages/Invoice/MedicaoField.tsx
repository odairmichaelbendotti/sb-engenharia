import { Ruler } from "lucide-react";
import type { MedicaoParaNota } from "../../../types/obra";
import { Field, Select } from "../../components/ui";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { medicaoTitulo } from "../OrdemServico/medicao-display";

interface MedicaoFieldProps {
  // Só as medições livres (ou a que a nota em edição já paga)
  medicoes: MedicaoParaNota[];
  value: string;
  onChange: (medicao: MedicaoParaNota | null) => void;
}

/**
 * Medição fechada da OS que a nota paga. Escolhida, o valor da nota passa a ser o da medição;
 * sem medição, o valor é digitado. Quem chama já tirou as medições pagas por outra nota.
 */
export function MedicaoField({ medicoes, value, onChange }: MedicaoFieldProps) {
  return (
    <Field label="Medição" hint="Com uma medição, o valor da nota é o dela">
      <Select
        icon={Ruler}
        value={value}
        onChange={(e) => onChange(medicoes.find((m) => m.id === e.target.value) ?? null)}
      >
        <option value="">Sem medição: digitar o valor</option>
        {medicoes.map((m) => (
          <option key={m.id} value={m.id}>
            {medicaoTitulo(m.numero)} · {formatDateOnly(m.periodoInicio)} a {formatDateOnly(m.periodoFim)} ·{" "}
            {formatCurrency(m.valor)}
          </option>
        ))}
      </Select>
    </Field>
  );
}
