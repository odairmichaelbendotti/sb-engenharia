// Número da OS como etiqueta discreta: identifica sem disputar atenção com o serviço.
// Os números novos já começam com "OS" ("OS 010/BAFL/2026-L1"); os antigos não necessariamente
export function OrdemServicoNumeroTag({ numero, className = "" }: { numero: string; className?: string }) {
  const label = /^OS\b/i.test(numero) ? numero : `OS ${numero}`;
  return (
    <span
      className={`inline-block font-mono text-[10.5px] leading-4 tracking-wide text-text-secondary bg-surface-muted border border-border rounded px-1.5 whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}
