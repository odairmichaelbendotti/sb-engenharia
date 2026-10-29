import { useState } from "react";
import { MessageSquareText, Paperclip, Plus, Trash2 } from "lucide-react";
import {
  Button,
  FormSection,
  IconButton,
  Input,
  Textarea,
} from "../../components/ui";
import { cx } from "../../utils/cx";
import {
  ANEXOS_PADRAO,
  MAX_COMENTARIO_TECNICO,
  MAX_OBSERVACAO_ANEXO,
  MAX_TITULO_ANEXO,
  numeroRomano,
  type AnexosForm,
} from "./anexos-os";

// Número do anexo como sai no PDF (só os marcados recebem número)
function Numero({ numero }: { numero: string | null }) {
  return (
    <span
      className={cx(
        "w-8 shrink-0 text-center font-mono text-[11px] font-semibold",
        numero ? "text-text-primary" : "text-text-muted",
      )}
    >
      {numero ?? "—"}
    </span>
  );
}

// Abre o campo de observação do anexo
function ObservacaoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 h-7 text-xs text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
    >
      <Plus size={12} aria-hidden />
      Observação
    </button>
  );
}

/** Etapa Anexos do cadastro da OS: checklist dos anexos, observações e comentários técnicos. */
export function AnexosStep({ form }: { form: AnexosForm }) {
  // Observação aparece só quando pedida ou já preenchida, para a lista caber sem rolagem
  const [comObservacao, setComObservacao] = useState<Set<string>>(
    () => new Set(),
  );
  const abrirObservacao = (key: string) =>
    setComObservacao((prev) => new Set(prev).add(key));
  const mostraObservacao = (key: string, texto: string) =>
    comObservacao.has(key) || texto.trim() !== "";
  const numeroDe = (key: string) => {
    const index = form.selecionados.findIndex((s) => s.key === key);
    return index === -1 ? null : numeroRomano(index + 1);
  };

  return (
    <>
      <FormSection title="Anexos da OS" icon={Paperclip}>
        <p className="text-xs text-text-muted">
          Marque os anexos que vão no processo. A numeração (I, II...) segue a
          ordem abaixo e é a mesma do PDF.
        </p>
        <div className="rounded-lg border border-border divide-y divide-border">
          {ANEXOS_PADRAO.map((anexo) => {
            const estado = form.padrao[anexo.codigo];
            return (
              <div
                key={anexo.codigo}
                className={cx(
                  "px-3 py-2",
                  !estado.marcado && "bg-surface-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer select-none min-h-8">
                    <input
                      type="checkbox"
                      checked={estado.marcado}
                      onChange={() => form.togglePadrao(anexo.codigo)}
                      className="size-4 shrink-0 cursor-pointer"
                    />
                    <Numero numero={numeroDe(anexo.codigo)} />
                    <span
                      className={cx(
                        "text-sm min-w-0",
                        estado.marcado
                          ? "text-text-primary font-medium"
                          : "text-text-secondary",
                      )}
                    >
                      {anexo.titulo}
                    </span>
                  </label>
                  {estado.marcado &&
                    !mostraObservacao(anexo.codigo, estado.observacao) && (
                      <ObservacaoButton
                        onClick={() => abrirObservacao(anexo.codigo)}
                      />
                    )}
                </div>
                {estado.marcado &&
                  mostraObservacao(anexo.codigo, estado.observacao) && (
                    <div className="mt-1.5 pl-16">
                      <Input
                        autoFocus={
                          comObservacao.has(anexo.codigo) && !estado.observacao
                        }
                        size="sm"
                        aria-label={`Observação do anexo ${anexo.titulo}`}
                        value={estado.observacao}
                        maxLength={MAX_OBSERVACAO_ANEXO}
                        onChange={(e) =>
                          form.setObservacaoPadrao(anexo.codigo, e.target.value)
                        }
                        placeholder="Observação (opcional)"
                      />
                    </div>
                  )}
              </div>
            );
          })}
          {form.outros.map((outro) => (
            <div key={outro.key} className="px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                {/* Alinha com a coluna da caixa de seleção dos padrão */}
                <span className="size-4 shrink-0" aria-hidden />
                <Numero numero={numeroDe(`outro-${outro.key}`)} />
                <Input
                  size="sm"
                  aria-label="Nome do anexo"
                  // Linha recém-adicionada: o foco vai para o nome
                  autoFocus={!outro.titulo}
                  value={outro.titulo}
                  maxLength={MAX_TITULO_ANEXO}
                  onChange={(e) =>
                    form.updateOutro(outro.key, { titulo: e.target.value })
                  }
                  placeholder="Nome do anexo (ex.: Projeto de SPDA)"
                  className="flex-1 min-w-0"
                />
                {!mostraObservacao(`outro-${outro.key}`, outro.observacao) && (
                  <ObservacaoButton
                    onClick={() => abrirObservacao(`outro-${outro.key}`)}
                  />
                )}
                <IconButton
                  icon={Trash2}
                  label="Remover anexo"
                  variant="danger"
                  onClick={() => form.removeOutro(outro.key)}
                />
              </div>
              {mostraObservacao(`outro-${outro.key}`, outro.observacao) && (
                <div className="pl-16 pr-10">
                  <Input
                    autoFocus={
                      comObservacao.has(`outro-${outro.key}`) &&
                      !outro.observacao
                    }
                    size="sm"
                    aria-label="Observação do anexo"
                    value={outro.observacao}
                    maxLength={MAX_OBSERVACAO_ANEXO}
                    onChange={(e) =>
                      form.updateOutro(outro.key, {
                        observacao: e.target.value,
                      })
                    }
                    placeholder="Observação (opcional)"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={form.addOutro}
          >
            Adicionar outro anexo
          </Button>
          <span className="text-xs text-text-muted">
            {form.selecionados.length === 0
              ? "Nenhum anexo marcado"
              : `${form.selecionados.length} ${form.selecionados.length === 1 ? "anexo" : "anexos"} no PDF`}
          </span>
        </div>
        {!form.padrao.PLANILHA_SINTETICA.marcado && (
          <p className="text-xs text-text-muted">
            Sem a planilha sintética marcada, o orçamento lançado em Medições
            não vai junto no PDF da OS.
          </p>
        )}
      </FormSection>

      <FormSection title="Comentários técnicos" icon={MessageSquareText}>
        <p className="text-xs text-text-muted">
          Opcional. Cada comentário entra no PDF, abaixo da lista de anexos.
        </p>
        {form.comentariosTecnicos.map((comentario, index) => (
          <div key={comentario.key} className="flex items-start gap-2">
            <Textarea
              aria-label={`Comentário técnico ${index + 1}`}
              autoFocus={!comentario.texto}
              rows={2}
              value={comentario.texto}
              maxLength={MAX_COMENTARIO_TECNICO}
              onChange={(e) =>
                form.updateComentario(comentario.key, e.target.value)
              }
              placeholder="Ex.: A impermeabilização deve ser testada com lâmina d'água por 72 h antes do revestimento"
              className="flex-1 min-w-0"
            />
            <IconButton
              icon={Trash2}
              label="Remover comentário"
              variant="danger"
              onClick={() => form.removeComentario(comentario.key)}
            />
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={form.addComentario}
        >
          Adicionar comentário
        </Button>
      </FormSection>
    </>
  );
}
