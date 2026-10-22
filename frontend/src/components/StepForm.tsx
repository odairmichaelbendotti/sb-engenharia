import { useRef, useState, type ElementType, type FocusEventHandler, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
                          ? "bg-surface-muted border-border-strong text-text-primary"
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
                {index < last && <span className={`flex-1 h-px mx-3 ${done ? "bg-border-strong" : "bg-border"}`} />}
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
