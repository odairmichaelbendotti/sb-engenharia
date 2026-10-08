import type { Empresa } from "../../../types/empresa";
import { onlyDigits } from "../../utils/masks";

// Busca da listagem de empresas: nome, CNPJ (só dígitos) ou cidade
export function matchesCompanySearch(empresa: Empresa, searchTerm: string) {
  const s = searchTerm.toLowerCase();
  const digits = onlyDigits(searchTerm);
  return (
    empresa.name.toLowerCase().includes(s) ||
    (digits !== "" && empresa.cnpj.includes(digits)) ||
    empresa.city.toLowerCase().includes(s)
  );
}
