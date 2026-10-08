// Número da OS como etiqueta discreta: identifica sem disputar atenção com o serviço
export function OrdemServicoNumeroTag({ numero, className = "" }: { numero: string; className?: string }) {
  return (
    <span
      className={`inline-block font-mono text-[10.5px] leading-4 tracking-wide text-text-secondary bg-surface-muted border border-border rounded px-1.5 whitespace-nowrap ${className}`}
    >
      OS {numero}
    </span>
  );
}
