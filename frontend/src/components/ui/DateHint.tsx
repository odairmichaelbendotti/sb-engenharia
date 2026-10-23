import { cx } from "../../utils/cx";
import { HINT_TEXT, type HintTone } from "../../utils/status-display";

interface DateHintProps {
  // Data já formatada; sem data mostra `empty`
  date: string | null;
  hint?: { label: string; tone: HintTone } | null;
  empty?: string;
}

// Prazo em tabela: data neutra e, abaixo, a dica colorida (a cor nunca pinta a linha)
export function DateHint({ date, hint, empty = "Sem prazo" }: DateHintProps) {
  if (!date) return <span className="text-xs text-text-muted">{empty}</span>;
  return (
    <span className="inline-flex flex-col">
      <span className="text-text-primary">{date}</span>
      {hint && <span className={cx("text-[11px] leading-4", HINT_TEXT[hint.tone])}>{hint.label}</span>}
    </span>
  );
}
