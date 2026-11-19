import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ArrowRightLeft, History, Link2, Loader2, Pencil, Plus, ShieldCheck, Users, Ban } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { ActionMenu, Badge, Button, Field, Input, Select, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import { useUser } from "../../store/user";
import { useContratos } from "../../store/contratos";
import { useOrdensServico } from "../../store/ordensServico";
import { fiscalizacaoRequest } from "./api";
import { FiscalizacaoModal, type FiscalizacaoAcao } from "./FiscalizacaoModal";
import { dataCurta, TIPOS, type FiscalizacaoData } from "./types";

const ACOES: Record<string, string> = { FISCAL_CADASTRADO: "Fiscal cadastrado", FISCAL_ATUALIZADO: "Cadastro atualizado", DESIGNACAO_CRIADA: "Designação criada", DESIGNACAO_ENCERRADA: "Designação encerrada", RESPONSAVEL_SUBSTITUIDO: "Responsável substituído" };

export default function Fiscalizacao() {
  const [params, setParams] = useSearchParams();
  const user = useUser((s) => s.user);
  const tenant = params.get("unidade") || user?.tenant_id || "";
  const contrato = params.get("contrato") || "";
  const osInicial = params.get("os") || "";
  const [data, setData] = useState<FiscalizacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<"fiscais" | "designacoes" | "historico">(contrato ? "designacoes" : "fiscais");
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [situacao, setSituacao] = useState("ativos");
  const [acao, setAcao] = useState<FiscalizacaoAcao | null>(null);
  useEffect(() => {
    let current = true;
    fiscalizacaoRequest(`?tenant_id=${encodeURIComponent(tenant)}`).then((result: FiscalizacaoData) => {
      if (!Array.isArray(result.usuarios)) throw new Error("A seleção de usuários da unidade requer a versão atualizada do backend. Conclua a migração e o deploy da API para usar a fiscalização.");
      if (current) { setData(result); setError(""); }
    }).catch((err: Error) => { if (current) setError(err.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tenant, revision]);
  const ready = !loading && !error && data?.tenant_id === tenant;
  function filtrarContrato(id: string) { const next = new URLSearchParams(params); if (id) next.set("contrato", id); else next.delete("contrato"); next.delete("os"); setParams(next); }
  function salvo() {
    setAcao(null); setLoading(true); setRevision((r) => r + 1);
    // Atualiza também os seletores e as visualizações já carregadas na sessão.
    void Promise.allSettled([useContratos.getState().fetchContratos(), useOrdensServico.getState().fetchOrdensServico()]);
  }
  const vinculos = data?.fiscais.flatMap((f) => f.vinculos) ?? [];
  const matches = (value: string) => value.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
  const situacaoMatches = (ativo: boolean) => situacao === "todos" || ativo === (situacao === "ativos");
  const fiscais = data?.fiscais.filter((f) => situacaoMatches(f.ativo) && matches(`${f.nome} ${f.email} ${f.ramal}`)
    && ((!contrato && !tipo) || f.vinculos.some((v) => (!contrato || v.contrato_id === contrato) && (!tipo || v.tipo === tipo)))) ?? [];
  const designacoes = vinculos.filter((v) => (!contrato || v.contrato_id === contrato) && (!tipo || v.tipo === tipo) && situacaoMatches(v.ativo) && matches(`${v.nome} ${v.email} ${v.contrato.identificador}`));
  const ordensCount = (ids: string[]) => data?.ordens.filter((os) => ids.includes(os.fiscalTecnico_id ?? "") || ids.includes(os.fiscalAdministrativo_id ?? "")).length ?? 0;
  const historico = data?.historico.filter((h) => (!contrato || h.contrato_id === contrato) && (!tipo || h.dados.tipo === tipo)
    && matches(`${h.autorNome} ${h.motivo} ${JSON.stringify(h.dados)}`)) ?? [];

  return <div className="p-4 md:p-5 max-w-7xl mx-auto">
    <PageHeader icon={ShieldCheck} title="Fiscalização" description="Gestão · Fiscais técnicos e administrativos"
      actions={<div className="flex gap-2 flex-wrap"><Button variant="secondary" icon={ArrowRightLeft} disabled={!ready} onClick={() => setAcao({ tipo: "substituir" })}>Substituir fiscal</Button><Button icon={Plus} disabled={!ready} onClick={() => setAcao({ tipo: "fiscal" })}>Novo fiscal</Button></div>} />
    <div className="bg-surface border border-border rounded-xl">
      <div className="p-4 border-b border-border grid gap-4 grid-cols-2 sm:grid-cols-3">
        <div><p className="text-xs text-text-muted">Fiscais ativos</p><p className="text-xl font-semibold text-text-primary">{ready ? data.fiscais.filter((f) => f.ativo).length : "—"}</p></div>
        <div><p className="text-xs text-text-muted">Designações ativas</p><p className="text-xl font-semibold text-text-primary">{ready ? vinculos.filter((v) => v.ativo).length : "—"}</p></div>
        <Field label="Unidade" className="col-span-2 sm:col-span-1"><Select aria-label="Unidade" disabled={user?.role !== "PLATFORM_ADMIN" || loading} value={tenant} onChange={(e) => {
          setLoading(true); setAcao(null); setParams({ unidade: e.target.value });
        }}>{data?.unidades.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
      </div>
      <div role="tablist" aria-label="Gestão da fiscalização" className="flex flex-wrap gap-1 p-2 border-b border-border">
        {([{ id: "fiscais", label: "Fiscais", icon: Users }, { id: "designacoes", label: "Designações", icon: Link2 }, { id: "historico", label: "Histórico", icon: History }] as const).map((item) => <Button key={item.id} size="sm" role="tab" aria-selected={tab === item.id} variant={tab === item.id ? "secondary" : "ghost"} icon={item.icon} onClick={() => setTab(item.id)}>{item.label}</Button>)}
      </div>
      <div className="p-4 border-b border-border grid grid-cols-2 lg:flex gap-3">
        <Input aria-label="Buscar na fiscalização" className="col-span-2 lg:flex-1" placeholder={tab === "historico" ? "Buscar no histórico…" : "Buscar por nome ou e-mail…"} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filtrar por contrato" className="col-span-2 lg:w-56" value={contrato} onChange={(e) => filtrarContrato(e.target.value)}><option value="">Todos os contratos</option>{data?.contratos.map((c) => <option key={c.id} value={c.id}>{c.identificador}</option>)}</Select>
        <Select aria-label="Filtrar por tipo" className="lg:w-48" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos os tipos</option>{Object.entries(TIPOS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
        {tab !== "historico" && <Select aria-label="Filtrar por situação" className="lg:w-40" value={situacao} onChange={(e) => setSituacao(e.target.value)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></Select>}
      </div>
      {loading && <div role="status" className="p-10 flex justify-center"><Loader2 className="animate-spin text-text-muted" /><span className="sr-only">Carregando fiscalização</span></div>}
      {error && <div role="alert" className="p-8 text-center space-y-3"><p className="text-danger-text">{error}</p><Button variant="secondary" onClick={() => { setLoading(true); setRevision((r) => r + 1); }}>Tentar novamente</Button></div>}
      {ready && tab === "fiscais" && <>
        <Table><TableHead><Th>Fiscal</Th><Th width="w-48" className="hidden md:table-cell">Contratos / OS</Th><Th width="w-24">Situação</Th><Th actions /></TableHead><TableBody>{fiscais.map((f) => <Tr key={f.id}>
          <Td><p className="font-semibold">{f.nome}</p><p className="text-xs text-text-muted break-all">{f.email}{f.ramal ? ` · Ramal ${f.ramal}` : ""}</p>{!f.user_id && <p className="text-xs text-warning-text">Associar a um usuário da unidade</p>}{f.user_id && !f.usuarioDisponivel && <p className="text-xs text-warning-text">Usuário indisponível na unidade</p>}</Td>
          <Td className="hidden md:table-cell"><p>{new Set(f.vinculos.filter((v) => v.ativo).map((v) => v.contrato_id)).size} contratos ativos</p><p className="text-xs text-text-muted">{ordensCount(f.vinculos.map((v) => v.id))} OS vinculadas</p></Td>
          <Td><Badge tone={f.ativo ? "success" : "neutral"}>{f.ativo ? "Ativo" : "Inativo"}</Badge></Td>
          <Td actions><ActionMenu label={`Ações de ${f.nome}`} items={[
            { label: "Editar fiscal", icon: Pencil, onClick: () => setAcao({ tipo: "fiscal", fiscal: f }) },
            { label: "Vincular ao contrato", icon: Link2, hidden: !f.ativo || !f.usuarioDisponivel, onClick: () => setAcao({ tipo: "vincular", fiscal: f }) },
          ]} /></Td>
        </Tr>)}</TableBody></Table>
        {!fiscais.length && <p className="p-8 text-center text-sm text-text-muted">Nenhum fiscal encontrado. Selecione um usuário da unidade para cadastrar como fiscal ou ajuste os filtros.</p>}
      </>}
      {ready && tab === "designacoes" && <>
        <div className="px-4 pt-3 flex justify-end"><Button size="sm" variant="secondary" icon={Link2} onClick={() => setAcao({ tipo: "vincular" })}>Vincular fiscal</Button></div>
        <Table><TableHead><Th>Fiscal / contrato</Th><Th width="w-56" className="hidden md:table-cell">Vigência</Th><Th width="w-32">Tipo / situação</Th><Th actions /></TableHead><TableBody>{designacoes.map((v) => <Tr key={v.id}>
          <Td><p className="font-semibold">{v.nome}</p><p className="text-xs text-text-muted">{v.contrato.identificador} · {ordensCount([v.id])} OS</p></Td>
          <Td className="hidden md:table-cell">{dataCurta(v.inicio)}{v.fim ? ` a ${dataCurta(v.fim)}` : " em diante"}</Td>
          <Td><p className="text-xs mb-1">{TIPOS[v.tipo]}</p><Badge tone={v.ativo ? "success" : "neutral"}>{v.ativo ? "Ativa" : "Encerrada"}</Badge></Td>
          <Td actions><ActionMenu label={`Ações da designação de ${v.nome}`} items={[
            { label: "Substituir fiscal", icon: ArrowRightLeft, onClick: () => setAcao({ tipo: "substituir", vinculo: v }) },
            { label: "Encerrar designação", icon: Ban, hidden: !v.ativo, onClick: () => setAcao({ tipo: "encerrar", vinculo: v }) },
          ]} /></Td>
        </Tr>)}</TableBody></Table>
        {!designacoes.length && <p className="p-8 text-center text-sm text-text-muted">Nenhuma designação encontrada. Vincule um fiscal ao contrato.</p>}
      </>}
      {ready && tab === "historico" && <div className="p-4 space-y-3">{historico.map((h) => <article key={h.id} className="rounded-lg border border-border p-4 text-sm space-y-2">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-text-primary">{ACOES[h.acao] ?? h.acao}</p><time className="text-xs text-text-muted">{new Date(h.createdAt).toLocaleString("pt-BR")}</time></div>
        <p className="text-text-secondary">{h.autorNome} · Início em {dataCurta(h.vigencia)}{h.contrato_id ? ` · Contrato ${data.contratos.find((c) => c.id === h.contrato_id)?.identificador ?? "arquivado"}` : ""}</p>
        <p className="text-text-primary whitespace-pre-wrap">{h.motivo}</p>
        <p className="text-xs text-text-secondary">{String(h.dados.nome ?? (h.dados.atual as { nome?: string } | undefined)?.nome ?? "")}{h.dados.tipo ? ` · Fiscal ${TIPOS[h.dados.tipo as keyof typeof TIPOS]}` : ""}</p>
        {h.acao === "RESPONSAVEL_SUBSTITUIDO" && <p className="text-text-secondary">{String(h.dados.anterior ?? "Sem responsável")} → {String(h.dados.novo)}<br />OS: {(h.dados.ordens as { numero: string }[]).map((os) => os.numero).join(", ")}</p>}
        {h.acao === "FISCAL_ATUALIZADO" && <div className="text-xs text-text-secondary space-y-1">{["anterior", "atual"].map((key) => {
          const f = h.dados[key] as { nome: string; email: string; ramal: string; ativo: boolean };
          return <p key={key}>{key === "anterior" ? "Antes" : "Depois"}: {f.nome} · {f.email} · {f.ramal} · {f.ativo ? "Ativo" : "Inativo"}</p>;
        })}</div>}
      </article>)}{!historico.length && <p className="p-4 text-center text-text-muted text-sm">Nenhuma alteração registrada para os filtros selecionados.</p>}</div>}
    </div>
    {acao && ready && <FiscalizacaoModal acao={acao} data={data} contratoInicial={contrato} osInicial={osInicial} onClose={() => setAcao(null)} onSaved={salvo} />}
  </div>;
}
