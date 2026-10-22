import { useRef, useState, type ElementType, type FocusEventHandler, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { toast } from "sonner";

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

const buttonBase =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Formulário de cadastro em etapas: indicador de progresso no topo, uma etapa por vez e
 * Voltar/Próximo no rodapé. Avançar valida as etapas puladas; salvar valida todas e leva
 * o usuário à primeira etapa com problema. Vai dentro do modal (que precisa ser `flex flex-col`).
 */
export function StepForm({ steps, isEdit = false, isSubmitting, submitLabel, onCancel, onSubmit, onBlur }: StepFormProps) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  function show(index: number) {
    setCurrent(index);
    scrollRef.current?.scrollTo({ top: 0 });
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
    if (target <= current) return show(target);
    const error = firstError(current, target - 1);
    if (error) {
      show(error.index);
      toast.error(error.message);
      return;
    }
    show(target);
  }

  async function save() {
    const error = firstError(0, last);
    if (error) {
      show(error.index);
      toast.error(error.message);
      return;
    }
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
  // Com muitas etapas só o rótulo da ativa cabe; as outras mostram o ícone (e o nome ao passar o mouse)
  const crowded = steps.length > 4;

  return (
    <>
      <nav aria-label="Etapas do formulário" className="shrink-0 px-5 py-3 border-b border-border bg-surface">
        <ol className="flex items-center">
          {steps.map((item, index) => {
            const done = index < current;
            const active = index === current;
            const Icon = item.icon;
            return (
              <li key={item.id} className={`flex items-center ${index < last ? "flex-1" : ""} min-w-0`}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={active ? "step" : undefined}
                  title={item.label}
                  className="flex items-center gap-2 cursor-pointer min-w-0 rounded-lg"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border transition-colors ${
                      active
                        ? "bg-primary-500 border-primary-500 text-white"
                        : done
                          ? "bg-primary-100 border-primary-200 text-primary-600"
                          : "bg-surface border-border text-text-muted"
                    }`}
                  >
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </span>
                  <span
                    className={`text-sm truncate ${
                      active
                        ? "font-semibold text-text-primary"
                        : `hidden ${crowded ? "" : "md:inline"} text-text-secondary`
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
                {index < last && <span className={`flex-1 h-px mx-3 ${done ? "bg-primary-200" : "bg-border"}`} />}
              </li>
            );
          })}
        </ol>
        <span className="sr-only">
          Etapa {current + 1} de {steps.length}
        </span>
      </nav>

      <form onSubmit={handleSubmit} onBlur={onBlur} className="flex-1 min-h-0 flex flex-col">
        <div ref={scrollRef} className="p-5 overflow-y-auto space-y-5 flex-1">
          {step.content}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className={`${buttonBase} text-text-secondary hover:bg-surface-muted`}
          >
            Cancelar
          </button>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {current > 0 && (
              <button
                type="button"
                onClick={() => show(current - 1)}
                className={`${buttonBase} border border-border text-text-secondary hover:bg-surface-muted`}
              >
                <ChevronLeft size={16} />
                Voltar
              </button>
            )}
            {!isLast && (
              <button
                type="submit"
                className={
                  isEdit
                    ? `${buttonBase} border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100`
                    : `${buttonBase} bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md`
                }
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            )}
            {(isLast || isEdit) && (
              <button
                type={isLast ? "submit" : "button"}
                onClick={isLast ? undefined : () => void save()}
                disabled={isSubmitting}
                className={`${buttonBase} bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md`}
              >
                {isSubmitting ? <Loader size={18} className="animate-spin" /> : submitLabel}
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
