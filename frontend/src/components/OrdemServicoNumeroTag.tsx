import { CodeTag } from "./ui";

// Número da OS como etiqueta discreta: identifica sem disputar atenção com o serviço.
// Os números novos já começam com "OS" ("OS 010/BAFL/2026-L1"); os antigos não necessariamente
export function OrdemServicoNumeroTag({ numero, className }: { numero: string; className?: string }) {
  return <CodeTag className={className}>{/^OS\b/i.test(numero) ? numero : `OS ${numero}`}</CodeTag>;
}
