import { useState, type FormEvent } from "react";
import { ArrowRightLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, Select, Textarea } from "../../components/ui";
import { fiscalizacaoRequest } from "./api";
import { dataCurta, hoje, TIPOS, type Designacao, type Fiscal, type FiscalizacaoData, type TipoFiscal } from "./types";

export type FiscalizacaoAcao = { tipo: "fiscal"; fiscal?: Fiscal } | { tipo: "vincular"; fiscal?: Fiscal }
  | { tipo: "encerrar"; vinculo: Designacao } | { tipo: "substituir"; vinculo?: Designacao };

export function FiscalizacaoModal({ acao, data, contratoInicial, osInicial, onClose, onSaved }: {
  acao: FiscalizacaoAcao; data: FiscalizacaoData; contratoInicial: string; osInicial: string;
  onClose: () => void; onSaved: () => void;
}) {
  const pessoa = "fiscal" in acao ? acao.fiscal : undefined;
  const vinculo = "vinculo" in acao ? acao.vinculo : undefined;
  const [userId, setUserId] = useState(pessoa?.user_id ?? "");
  const usuario = data.usuarios.find((u) => u.id === userId);
  const nome = usuario?.name ?? pessoa?.nome ?? "";
  const email = usuario?.email ?? pessoa?.email ?? "";
  const ramal = usuario?.ramal ?? pessoa?.ramal ?? "";
  const usuariosDisponiveis = data.usuarios.filter((u) => u.id === pessoa?.user_id || !data.fiscais.some((f) => f.user_id === u.id && f.id !== pessoa?.id));
  const [ativo, setAtivo] = useState(pessoa?.ativo ?? true);
  const [fiscal, setFiscal] = useState(pessoa?.id ?? "");
  const [contrato, setContrato] = useState(vinculo?.contrato_id ?? contratoInicial);
  const [tipo, setTipo] = useState<TipoFiscal>(vinculo?.tipo ?? "TECNICO");
  const [anterior, setAnterior] = useState(vinculo?.id ?? data.ordens.find((os) => os.id === osInicial)?.fiscalTecnico_id ?? "");
  const [novo, setNovo] = useState("");
  const [ordens, setOrdens] = useState<string[]>(osInicial ? [osInicial] : []);
  const [vigencia, setVigencia] = useState(hoje);
  const [motivo, setMotivo] = useState("");
  const [revisando, setRevisando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const vinculos = data.fiscais.flatMap((f) => f.vinculos);
  const disponiveis = vinculos.filter((v) => v.contrato_id === contrato && v.tipo === tipo);
  const candidatos = disponiveis.filter((v) => v.ativo && v.id !== anterior && data.fiscais.some((f) => f.id === v.fiscal_id && f.ativo && f.usuarioDisponivel));
  const campo = tipo === "TECNICO" ? "fiscalTecnico_id" : "fiscalAdministrativo_id";
  const elegiveis = data.ordens.filter((os) => os.status === "ATIVO" && os.empenho.contrato_id === contrato && os[campo] === (anterior || null));
  const selecionadas = elegiveis.filter((os) => ordens.includes(os.id));
  const titulo = acao.tipo === "fiscal" ? pessoa ? "Editar fiscal" : "Novo fiscal"
    : acao.tipo === "vincular" ? "Vincular ao contrato" : acao.tipo === "encerrar" ? "Encerrar designação" : "Substituir fiscal";
  const limparSelecao = () => { setAnterior(""); setNovo(""); setOrdens([]); setError(""); };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (acao.tipo === "fiscal" && (ativo || !pessoa) && !usuario) { setError("Selecione um usuário aprovado da unidade."); return; }
    if (acao.tipo === "substituir" && !selecionadas.length) { setError("Selecione ao menos uma OS em andamento."); return; }
    if (!revisando) { setRevisando(true); return; }
    setBusy(true);
    try {
      const comum = { tenant_id: data.tenant_id, vigencia, motivo };
      if (acao.tipo === "fiscal") await fiscalizacaoRequest(`/fiscais${pessoa ? `/${pessoa.id}` : ""}`,
        { ...comum, user_id: userId || null, ativo }, pessoa ? "PUT" : "POST");
      if (acao.tipo === "vincular") await fiscalizacaoRequest("/designacoes", { ...comum, fiscal_id: fiscal, contrato_id: contrato, tipo });
      if (acao.tipo === "encerrar") await fiscalizacaoRequest(`/designacoes/${acao.vinculo.id}/encerrar`, comum);
      if (acao.tipo === "substituir") await fiscalizacaoRequest("/substituicoes", {
        ...comum, contrato_id: contrato, tipo, anterior_id: anterior || null, novo_id: novo, ordens: selecionadas.map((os) => os.id),
      });
      toast.success("Fiscalização atualizada com sucesso.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a alteração.");
      setRevisando(false);
    } finally { setBusy(false); }
  }

  return <Modal open size="lg" onClose={() => { if (!busy) onClose(); }}>
    <ModalHeader icon={acao.tipo === "substituir" ? ArrowRightLeft : ShieldCheck} title={revisando ? "Revisar alteração" : titulo}
      description={data.unidades.find((u) => u.id === data.tenant_id)?.name} onClose={busy ? undefined : onClose} />
    <form onSubmit={submit} className="flex flex-col min-h-0">
      <ModalBody>
        <div className="space-y-4">
          {revisando ? <div className="rounded-lg border border-border bg-surface-muted p-4 space-y-3 text-sm text-text-primary">
            <p className="font-semibold">{titulo}</p>
            {acao.tipo === "fiscal" && <p>{nome} · {email} · Ramal {ramal || "não informado"} · {ativo ? "Ativo" : "Inativo"}</p>}
            {acao.tipo === "vincular" && <p>{data.fiscais.find((f) => f.id === fiscal)?.nome} · Fiscal {TIPOS[tipo].toLowerCase()}</p>}
            {acao.tipo === "encerrar" && <p>{acao.vinculo.nome} · Fiscal {TIPOS[acao.vinculo.tipo].toLowerCase()}</p>}
            {acao.tipo !== "fiscal" && <p>Contrato: {data.contratos.find((c) => c.id === contrato)?.identificador}</p>}
            {acao.tipo === "substituir" && <>
              <p>{disponiveis.find((v) => v.id === anterior)?.nome ?? "Sem responsável"} → <strong>{candidatos.find((v) => v.id === novo)?.nome}</strong></p>
              <p>{selecionadas.length} OS serão atualizadas:</p>
              <ul className="list-disc pl-5 max-h-40 overflow-y-auto">{selecionadas.map((os) => <li key={os.id}>{os.numero}</li>)}</ul>
              <p className="text-xs text-text-secondary">Os dados dos fiscais nos documentos já emitidos serão preservados. A troca ficará no histórico de cada OS.</p>
            </>}
            <p>Início: {dataCurta(vigencia)} · Efetivação ao salvar</p><p className="whitespace-pre-wrap">Motivo: {motivo}</p>
          </div> : <>
            {acao.tipo === "fiscal" && <>
              <Field label="Usuário da unidade" required={ativo || !pessoa} hint="Os dados são preenchidos a partir do cadastro do usuário.">
                <Select required={ativo || !pessoa} value={userId} disabled={!!pessoa?.user_id} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">Selecione o usuário</option>
                  {pessoa?.user_id && !usuario && <option value={pessoa.user_id}>{pessoa.nome} (indisponível nesta unidade)</option>}
                  {usuariosDisponiveis.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                </Select>
              </Field>
              {!pessoa && !usuariosDisponiveis.length && <p className="text-xs text-warning-text">Não há usuários aprovados disponíveis para cadastrar como fiscal nesta unidade.</p>}
              <Field label="Nome"><Input value={nome} readOnly placeholder="Preenchido ao selecionar o usuário" /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="E-mail"><Input value={email} readOnly /></Field>
                <Field label="Ramal"><Input value={ramal} readOnly placeholder="Não informado no cadastro do usuário" /></Field>
              </div>
              <p className="text-xs text-text-secondary">Para atualizar o ramal, use Gestão → Usuários. Os dados do fiscal são reaproveitados automaticamente.</p>
              {pessoa && !pessoa.user_id && <p className="text-xs text-warning-text">Este cadastro antigo ainda precisa ser associado ao usuário da mesma unidade.</p>}
              <Field label="Situação"><Select value={ativo ? "ativo" : "inativo"} onChange={(e) => setAtivo(e.target.value === "ativo")}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></Field>
              {!ativo && <p className="text-xs text-text-secondary">Para inativar, substitua antes o fiscal nas OS em andamento. As designações ativas serão encerradas.</p>}
            </>}
            {acao.tipo === "encerrar" && <p className="text-sm text-text-primary">Encerrar a designação de <strong>{acao.vinculo.nome}</strong> como fiscal {TIPOS[acao.vinculo.tipo].toLowerCase()} no contrato {acao.vinculo.contrato.identificador}. O histórico será mantido.</p>}
            {(acao.tipo === "vincular" || acao.tipo === "substituir") && <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Contrato" required><Select required value={contrato} onChange={(e) => { setContrato(e.target.value); limparSelecao(); }}><option value="">Selecione o contrato</option>{data.contratos.filter((c) => c.status === "ATIVO").map((c) => <option key={c.id} value={c.id}>{c.identificador}</option>)}</Select></Field>
                <Field label="Tipo de fiscalização" required><Select value={tipo} onChange={(e) => { setTipo(e.target.value as TipoFiscal); limparSelecao(); }}>{Object.entries(TIPOS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
              </div>
              {acao.tipo === "vincular" ? <Field label="Fiscal" required><Select required value={fiscal} onChange={(e) => setFiscal(e.target.value)}><option value="">Selecione a pessoa</option>{data.fiscais.filter((f) => f.ativo && f.usuarioDisponivel).map((f) => <option key={f.id} value={f.id}>{f.nome} · {f.email}</option>)}</Select></Field> : <>
                <Field label="Responsável atual"><Select disabled={!contrato} value={anterior} onChange={(e) => { setAnterior(e.target.value); setNovo(""); setOrdens([]); }}><option value="">OS sem responsável</option>{disponiveis.map((v) => <option key={v.id} value={v.id}>{v.nome}{v.ativo ? "" : " (designação encerrada)"}</option>)}</Select></Field>
                <Field label="Novo responsável" required><Select required disabled={!contrato} value={novo} onChange={(e) => setNovo(e.target.value)}><option value="">Selecione uma designação ativa</option>{candidatos.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</Select></Field>
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-text-primary">OS em andamento · {selecionadas.length} selecionadas</p><Button size="sm" variant="ghost" onClick={() => setOrdens(selecionadas.length === elegiveis.length ? [] : elegiveis.map((os) => os.id))}>{selecionadas.length === elegiveis.length && elegiveis.length ? "Desmarcar" : "Selecionar todas"}</Button></div>
                  <div className="max-h-44 overflow-y-auto space-y-2">{elegiveis.map((os) => <label key={os.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"><input type="checkbox" checked={ordens.includes(os.id)} onChange={(e) => setOrdens((prev) => e.target.checked ? [...prev, os.id] : prev.filter((id) => id !== os.id))} />{os.numero}</label>)}</div>
                  {!elegiveis.length && <p className="text-xs text-text-muted">Nenhuma OS em andamento com este responsável no contrato.</p>}
                </div>
                {!candidatos.length && contrato && <p className="text-xs text-warning-text">Vincule o novo fiscal ao contrato antes de fazer a substituição.</p>}
              </>}
            </>}
            <Field label="Data de início da alteração" required><Input required type="date" max={hoje()} value={vigencia} onChange={(e) => setVigencia(e.target.value)} /></Field>
            <Field label="Motivo / referência da designação" required><Textarea required maxLength={2000} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: substituição por mudança de setor, conforme portaria…" /></Field>
          </>}
          {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
        </div>
      </ModalBody>
      <ModalFooter><Button variant="ghost" disabled={busy} onClick={() => revisando ? setRevisando(false) : onClose()}>{revisando ? "Voltar" : "Cancelar"}</Button><Button type="submit" loading={busy}>{revisando ? "Confirmar alteração" : "Revisar alteração"}</Button></ModalFooter>
    </form>
  </Modal>;
}
