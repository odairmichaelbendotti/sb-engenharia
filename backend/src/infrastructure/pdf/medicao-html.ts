import type { MedicaoDocumentLinha, MedicaoDocumentModel } from "../../domain/documents/medicao-document.js";
import { escapeHtml, LETTERHEAD_STYLES, renderLetterhead } from "./document-base-html.js";
import { embeddedFontFaces, embeddedFooterFontFace } from "./fonts.js";

// Valor vazio vira uma linha pontilhada, para preencher à mão se preciso
function v(text: string): string {
  return text ? escapeHtml(text) : '<span class="blank"></span>';
}

function renderTitle(m: MedicaoDocumentModel): string {
  const fechamento = m.rascunho
    ? '<span class="value draft">Rascunho — não fechada</span>'
    : `<span class="value">${v(m.dataFechamento)}</span>`;
  return `
<section class="title">
  <p class="eyebrow">Ordem de Serviço ${escapeHtml(m.ordemServico)}</p>
  <h1>Boletim de Medição</h1>
  <div class="idstrip">
    <div><span class="label">Medição nº</span><span class="value num">${escapeHtml(m.numero)}</span></div>
    <div><span class="label">Período de execução</span><span class="value">${v(m.periodo.inicio)} a ${v(m.periodo.fim)}</span></div>
    <div><span class="label">Fechamento</span>${fechamento}</div>
    <div><span class="label">Processo (e-PAG)</span><span class="value">${v(m.processo)}</span></div>
  </div>
</section>`;
}

function renderIdentificacao(m: MedicaoDocumentModel): string {
  const lote = m.lote ? `<div><dt>Lote</dt><dd>${escapeHtml(m.lote)}</dd></div>` : "";
  return `
<dl class="ident">
  <div><dt>Contratada</dt><dd><strong>${v(m.empresa)}</strong>${m.cnpj ? ` <span class="muted">— CNPJ ${escapeHtml(m.cnpj)}</span>` : ""}</dd></div>
  <div><dt>Contrato</dt><dd>${v(m.contrato)}</dd></div>
  ${lote}
  <div><dt>Obra</dt><dd>${v(m.obra)}</dd></div>
  <div><dt>Edificação</dt><dd>${v(m.edificacao)}</dd></div>
</dl>`;
}

function renderResumo(m: MedicaoDocumentModel): string {
  const r = m.resumo;
  return `
<section class="summary">
  <div class="card"><span class="label">Valor orçado</span><span class="big">${escapeHtml(r.orcado)}</span><span class="sub">soma dos itens da planilha</span></div>
  <div class="card accent"><span class="label">Esta medição</span><span class="big">${escapeHtml(r.esta)}</span><span class="sub">executado no período</span></div>
  <div class="card"><span class="label">Acumulado</span><span class="big">${escapeHtml(r.acumulado)}</span><span class="sub">${escapeHtml(r.percentualAcumulado)} do orçado, com esta medição</span></div>
  <div class="card"><span class="label">Saldo a medir</span><span class="big">${escapeHtml(r.saldo)}</span><span class="sub">para as próximas medições</span></div>
</section>`;
}

function renderLinha(l: MedicaoDocumentLinha): string {
  const classes = l.medidoNesta ? "on" : "";
  const codigo = l.codigo ? `<span class="code">${escapeHtml(l.codigo)}</span>` : "";
  const concluido = l.concluido ? '<span class="done-tag">concluído</span>' : "";
  return `<tr${classes ? ` class="${classes}"` : ""}>
<td class="c">${escapeHtml(l.item)}</td>
<td class="desc">${escapeHtml(l.descricao)}${concluido}${codigo}</td>
<td class="c">${escapeHtml(l.unidade)}</td>
<td class="num">${l.orcado}</td>
<td class="num">${l.precoUnitario}</td>
<td class="num grp">${l.anterior}</td>
<td class="num strong">${l.esta}</td>
<td class="num">${l.acumulado}</td>
<td class="num">${l.saldo}</td>
<td class="num grp strong">${l.valorEsta}</td>
<td class="num">${l.valorAcumulado}</td>
<td class="num">${l.valorSaldo}</td>
</tr>`;
}

function renderPlanilha(m: MedicaoDocumentModel): string {
  const t = m.totais;
  return `
<table class="sheet">
  <colgroup>
    <col style="width:8mm" /><col /><col style="width:11mm" /><col style="width:19mm" /><col style="width:20mm" />
    <col style="width:19mm" /><col style="width:19mm" /><col style="width:19mm" /><col style="width:19mm" />
    <col style="width:23mm" /><col style="width:23mm" /><col style="width:23mm" />
  </colgroup>
  <thead>
    <tr class="groups">
      <th colspan="5"></th>
      <th colspan="4" class="grp">Quantidades</th>
      <th colspan="3" class="grp">Valores (R$)</th>
    </tr>
    <tr>
      <th class="c">Item</th><th>Descrição do serviço</th><th class="c">Un</th>
      <th class="num">Qtd. orçada</th><th class="num">Preço unit. (R$)</th>
      <th class="num grp">Acum. anterior</th><th class="num">Esta medição</th><th class="num">Acumulado</th><th class="num">Saldo</th>
      <th class="num grp">Esta medição</th><th class="num">Acumulado</th><th class="num">Saldo</th>
    </tr>
  </thead>
  <tbody>
    ${m.linhas.map(renderLinha).join("")}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="9" class="total-label">Totais <span>(valor orçado R$ ${escapeHtml(t.orcado)} · acumulado anterior R$ ${escapeHtml(t.anterior)})</span></td>
      <td class="num grp">${escapeHtml(t.esta)}</td>
      <td class="num">${escapeHtml(t.acumulado)}</td>
      <td class="num">${escapeHtml(t.saldo)}</td>
    </tr>
  </tfoot>
</table>
<p class="note">Preços unitários com BDI e desconto do lote. Linhas em destaque: itens medidos neste boletim.</p>`;
}

function renderObservacao(m: MedicaoDocumentModel): string {
  if (!m.observacao) return "";
  return `
<div class="callout">
  <span class="label">Observações</span>
  <p class="free">${escapeHtml(m.observacao)}</p>
</div>`;
}

function renderAssinaturas(m: MedicaoDocumentModel): string {
  return `
<section class="signatures">
  <p class="place">${escapeHtml(m.local)}</p>
  <div class="sigs">
    <div class="sig"><span class="name">${v(m.fiscais.tecnico)}</span><span class="role">Fiscal Técnico</span></div>
    <div class="sig"><span class="name">${v(m.fiscais.administrativo)}</span><span class="role">Fiscal Administrativo</span></div>
    <div class="sig"><span class="name">${v(m.empresa)}</span><span class="role">Contratada${m.cnpj ? ` · CNPJ ${escapeHtml(m.cnpj)}` : ""}</span></div>
  </div>
</section>`;
}

const STYLES = `
@page { size: A4 landscape; }
:root {
  --ink: #111111; --text: #1f1f1f; --muted: #555555; --faint: #7a7a7a;
  --rule: #c8c8c8; --hair: #e0e0e0; --tint: #f3f3f3;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Source Serif 4", Georgia, serif; font-size: 9.5pt; line-height: 1.45; color: var(--text); }
strong { font-weight: 600; color: var(--ink); }
.muted { color: var(--muted); font-weight: 400; }
.free { white-space: pre-line; }
.label {
  display: block; font-family: Inter, Arial, sans-serif; font-size: 6.4pt; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-bottom: .6mm;
}
.blank { display: inline-block; min-width: 24mm; height: .9em; border-bottom: .7pt dotted #999; vertical-align: baseline; }
${LETTERHEAD_STYLES}
.letterhead { padding-bottom: 2mm; }
.brasao { height: 12mm; margin-bottom: 1.4mm; }

/* Rascunho: marca d'água repetida em todas as páginas */
.watermark {
  position: fixed; top: 42%; left: 0; right: 0; text-align: center; transform: rotate(-18deg);
  font-family: Inter, Arial, sans-serif; font-size: 84pt; font-weight: 700; letter-spacing: .2em;
  color: rgba(0, 0, 0, .06); pointer-events: none; z-index: 0;
}

.title { margin: 3mm 0 2.6mm; text-align: center; }
.eyebrow { font-family: Inter, Arial, sans-serif; font-size: 7pt; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
h1 { font-size: 15pt; font-weight: 700; line-height: 1.2; letter-spacing: .16em; text-transform: uppercase; color: var(--ink); margin-top: 1.2mm; }
.idstrip {
  display: grid; grid-template-columns: .7fr 1.3fr 1.1fr 1.2fr; text-align: left; margin-top: 2.6mm;
  border-top: .75pt solid var(--ink); border-bottom: .75pt solid var(--ink);
}
.idstrip > div { padding: 1.8mm 3mm 2mm; border-left: .5pt solid var(--rule); }
.idstrip > div:first-child { border-left: 0; padding-left: 0; }
.idstrip .value { font-family: Inter, Arial, sans-serif; font-size: 8.8pt; font-weight: 600; color: var(--ink); }
.idstrip .num { font-size: 11pt; font-weight: 700; }
.idstrip .draft { color: var(--muted); font-style: italic; font-weight: 500; }

.ident { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 1.2mm 6mm; margin-bottom: 3mm; }
.ident > div { display: flex; gap: 2.4mm; align-items: baseline; min-width: 0; }
.ident dt { flex: none; font-family: Inter, Arial, sans-serif; font-size: 6.4pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); }
.ident dd { font-size: 9pt; }

.summary { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 3.2mm; border: .75pt solid var(--ink); break-inside: avoid; }
.card { padding: 1.8mm 3.4mm 2mm; border-left: .5pt solid var(--rule); font-family: Inter, Arial, sans-serif; }
.card:first-child { border-left: 0; }
.card.accent { background: var(--tint); }
.card .big { display: block; font-size: 11.5pt; font-weight: 700; line-height: 1.25; color: var(--ink); font-variant-numeric: tabular-nums; }
.card .sub { display: block; font-size: 6.8pt; color: var(--muted); margin-top: .5mm; }

/* Planilha: o cabeçalho se repete a cada página e a linha não quebra no meio */
.sheet { width: 100%; border-collapse: collapse; table-layout: fixed; font-family: Inter, Arial, sans-serif; font-size: 7.4pt; font-variant-numeric: tabular-nums; position: relative; z-index: 1; }
.sheet thead { display: table-header-group; }
.sheet tfoot { display: table-row-group; }
.sheet tr { break-inside: avoid; }
.sheet th {
  padding: 1.3mm 1.6mm; text-align: left; vertical-align: bottom; border-bottom: .5pt solid var(--ink);
  font-size: 6pt; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--muted);
}
.sheet tr.groups th { border-bottom: .5pt solid var(--rule); color: var(--ink); text-align: center; padding-bottom: .8mm; }
.sheet tr.groups th:empty { border-bottom: 0; }
.sheet td { padding: 1mm 1.6mm; border-bottom: .5pt solid var(--hair); vertical-align: top; }
.sheet .num { text-align: right; white-space: nowrap; }
/* Cabeçalho das colunas numéricas quebra em duas linhas em vez de invadir a vizinha */
.sheet th.num { white-space: normal; }
.sheet .c { text-align: center; }
.sheet .grp { border-left: .5pt solid var(--rule); }
.sheet .desc { overflow-wrap: anywhere; }
.sheet .code { display: block; font-size: 6.2pt; color: var(--faint); margin-top: .3mm; }
.sheet tr.on td { background: var(--tint); color: var(--ink); }
.sheet td.strong { font-weight: 600; color: var(--ink); }
.sheet .done-tag { margin-left: 1.6mm; font-size: 5.6pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); white-space: nowrap; }
.sheet tfoot td { border-top: .75pt solid var(--ink); border-bottom: .75pt solid var(--ink); background: var(--tint); font-weight: 700; color: var(--ink); font-size: 8pt; padding: 1.8mm 1.6mm; }
.sheet .total-label span { font-size: 6.8pt; font-weight: 400; color: var(--muted); margin-left: 1.6mm; }
.note { margin-top: 1.6mm; font-family: Inter, Arial, sans-serif; font-size: 6.8pt; color: var(--muted); }

.callout { margin-top: 3mm; padding: 2.4mm 3.4mm; background: var(--tint); border-left: .8mm solid var(--ink); break-inside: avoid; }

.signatures { break-inside: avoid; margin-top: 2mm; }
.place { text-align: right; margin-bottom: 8mm; }
.sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12mm; }
.sig { border-top: .6pt solid var(--ink); padding-top: 1.6mm; text-align: center; font-family: Inter, Arial, sans-serif; }
.sig .name { display: block; font-size: 8.4pt; font-weight: 600; color: var(--ink); }
.sig .role { display: block; font-size: 7pt; color: var(--muted); margin-top: .4mm; }
`;

/** Boletim de medição em HTML autocontido (fontes e brasão embutidos), para A4 paisagem. */
export function renderMedicaoHtml(m: MedicaoDocumentModel): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(m.titulo)}</title>
<style>${embeddedFontFaces()}${STYLES}</style>
</head>
<body>
${m.rascunho ? '<div class="watermark">RASCUNHO</div>' : ""}
${renderLetterhead()}
${renderTitle(m)}
${renderIdentificacao(m)}
${renderResumo(m)}
${renderPlanilha(m)}
${renderObservacao(m)}
${renderAssinaturas(m)}
</body>
</html>`;
}

/** Rodapé de cada página (OS, nº da medição e paginação), no formato de template do Chrome. */
export function renderMedicaoFooter(m: MedicaoDocumentModel): string {
  return `<style>${embeddedFooterFontFace()}</style>
<div style="width:100%;padding:0 12mm;box-sizing:border-box;font-family:Inter,Arial,sans-serif;font-size:7pt;color:#7a7a7a;letter-spacing:0.02em;">
<div style="display:flex;justify-content:space-between;border-top:0.5pt solid #c8c8c8;padding-top:2mm;">
<span>${escapeHtml(m.ordemServico)} &nbsp;·&nbsp; Boletim de Medição nº ${escapeHtml(m.numero)}${m.rascunho ? " (rascunho)" : ""} &nbsp;·&nbsp; Base Aérea de Florianópolis &nbsp;·&nbsp; Seção de Engenharia</span>
<span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
</div>
</div>`;
}
