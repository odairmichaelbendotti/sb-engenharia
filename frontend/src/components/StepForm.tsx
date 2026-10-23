import { useRef, useState, type ElementType, type FocusEventHandler, type ReactNode } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";

export type FormStep = {
  id: string;
  label: string;
  icon: ElementType;
  content: ReactNode;
  // Mensagem de erro se a etapa não está pronta para avançar; null quando está tudo certo
  validate?: () => string | null;
};

interface StepFormProps {
  steps: FormStep[];
  // Na edição dá para salvar de qualquer etapa; no cadastro só na última
  isEdit?: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  onBlur?: FocusEventHandler<HTMLFormElement>;
}

/**
 * Formulário de cadastro em etapas: indicador de progresso no topo, uma etapa por vez e
 * Voltar/Próximo no rodapé. Avançar valida as etapas puladas; salvar valida todas e leva
 * o usuário à primeira etapa com problema. Vai dentro do modal (que precisa ser `flex flex-col`).
 */
export function StepForm({ steps, isEdit = false, isSubmitting, submitLabel, onCancel, onSubmit, onBlur }: StepFormProps) {
  const [current, setCurrent] = useState(0);
  // Problema que impediu avançar ou salvar: aparece no topo da etapa até o próximo ajuste
  const [error, setError] = useState<{ index: number; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  function show(index: number) {
    setCurrent(index);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  // Leva à etapa com problema, mostra a mensagem nela e põe o foco no primeiro campo vazio
  function showError(found: { index: number; message: string }) {
    show(found.index);
    setError(found);
    requestAnimationFrame(() => {
      const empty = [...(scrollRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
      ) ?? [])].find((el) => !el.value);
      empty?.focus();
    });
  }

  // Primeira etapa com erro entre `from` e `to` (inclusive): leva até ela e avisa
  function firstError(from: number, to: number) {
    for (let index = from; index <= to; index++) {
      const message = steps[index]?.validate?.();
      if (message) return { index, message };
    }
    return null;
  }

  function goTo(target: number) {
    setError(null);
    if (target <= current) return show(target);
    const found = firstError(current, target - 1);
    if (found) return showError(found);
    show(target);
  }

  async function save() {
    const found = firstError(0, last);
    if (found) return showError(found);
    setError(null);
    await onSubmit();
  }

  // Enter num campo avança a etapa (na última, salva)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (current < last) goTo(current + 1);
    else void save();
  }

  const step = steps[current]!;
  const isLast = current === last;

  return (
    <>
      <nav
        aria-label="Etapas do formulário"
        className="shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-surface"
      >
        <ol className="flex items-center gap-2 min-w-0 flex-1">
          {steps.map((item, index) => {
            const done = index < current;
            const active = index === current;
            const Icon = item.icon;
            return (
              <li key={item.id} className={`flex items-center gap-2 min-w-0 ${active ? "shrink-0" : ""}`}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={active ? "step" : undefined}
                  title={item.label}
                  className="flex items-center gap-2 cursor-pointer min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold border transition-colors ${
                      active
                        ? "bg-primary-500 border-primary-500 text-white"
                        : done
                          ? "bg-surface-muted border-border-strong text-text-primary"
                          : "bg-surface border-border text-text-muted"
                    }`}
                  >
                    {done ? <Check size={12} strokeWidth={2.5} /> : active ? <Icon size={12} /> : index + 1}
                  </span>
                  {/* Só a etapa atual mostra o nome; as outras, ao passar o mouse */}
                  {active && <span className="text-xs font-semibold text-text-primary truncate">{item.label}</span>}
                </button>
                {index < last && (
                  <span aria-hidden className={`w-5 lg:w-8 h-px shrink-0 ${done ? "bg-border-strong" : "bg-border"}`} />
                )}
              </li>
            );
          })}
        </ol>
        <span className="hidden sm:block shrink-0 text-[11px] text-text-muted tabular-nums">
          Etapa {current + 1} de {steps.length}
        </span>
      </nav>

      <form
        onSubmit={handleSubmit}
        onBlur={onBlur}
        // Mexer em qualquer campo tira o aviso de erro da etapa
        onInput={() => error && setError(null)}
        onChange={() => error && setError(null)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div ref={scrollRef} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && error.index === current && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error.message}</p>
            </div>
          )}
          {step.content}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-t border-border">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {current > 0 && (
              <Button variant="secondary" icon={ChevronLeft} onClick={() => show(current - 1)}>
                Voltar
              </Button>
            )}
            {!isLast && (
              <Button type="submit" variant={isEdit ? "secondary" : "primary"} iconRight={ChevronRight}>
                Próximo
              </Button>
            )}
            {(isLast || isEdit) && (
              <Button
                type={isLast ? "submit" : "button"}
                onClick={isLast ? undefined : () => void save()}
                loading={isSubmitting}
              >
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
