import { cx } from "../../utils/cx";

// Etiqueta de código (número de OS, patrimônio, empenho, NF): identifica sem disputar atenção com o título
export function CodeTag({ children, title, className }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-block font-mono text-[10.5px] leading-4 tracking-wide text-text-secondary bg-surface-muted border border-border rounded-md px-1.5 whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}
