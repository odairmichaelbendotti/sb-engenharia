import type { DocumentOption, OrdemServicoDocumentModel } from "../../domain/documents/ordem-servico-document.js";
import { BRASAO_BASE64 } from "./brasao.js";
import { embeddedFontFaces, embeddedFooterFontFace } from "./fonts.js";

const ANEXOS = [
  "Planilha Orçamentária Sintética",
  "Planilha Orçamentária Analítica",
  "Cronograma Físico-Financeiro",
  "Premissas Técnicas",
  "Produtividade (SINAPI)",
  "Observações Técnicas para Execução",
];
const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Valor vazio (OS antiga) vira uma linha pontilhada, para preencher à mão se preciso
function v(text: string): string {
  return text ? escapeHtml(text) : '<span class="blank"></span>';
}

const strong = (text: string) => `<strong>${v(text)}</strong>`;
// Grifo: informação que o leitor precisa achar de relance (prazos, datas, valores)
const hl = (html: string) => `<span class="hl">${html}</span>`;
// Grifo curto que não pode quebrar de linha (datas)
const hlNoWrap = (html: string) => `<span class="hl nowrap">${html}</span>`;

// Seta desenhada em SVG: o subconjunto latino das fontes não tem "→" e o servidor pode não ter fonte reserva
const ARROW =
  '<svg class="arrow" viewBox="0 0 16 10" aria-hidden="true"><path d="M1 5h13M10 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function options(items: DocumentOption[], grid = false): string {
  const html = items
    .map((o) => `<span class="opt${o.selecionado ? " on" : ""}"><span class="box"></span>${escapeHtml(o.texto)}</span>`)
    .join("");
  return `<div class="opts${grid ? " grid" : ""}">${html}</div>`;
}

function heading(numero: number, titulo: string): string {
  return `<h2><span class="n">${numero}</span>${titulo}</h2>`;
}

function renderLetterhead(): string {
  return `
<header class="letterhead">
  <img class="brasao" src="data:image/jpeg;base64,${BRASAO_BASE64}" alt="" />
  <p class="org">Ministério da Defesa</p>
  <p class="org">Comando da Aeronáutica</p>
  <p class="org-main">Base Aérea de Florianópolis</p>
  <p class="org-contact">Av. Santos Dumont, s/n – Tapera &nbsp;·&nbsp; Tel. (48) 3229-5000 &nbsp;·&nbsp; Fax (48) 3236-1344 &nbsp;·&nbsp; protocolo.bafl@bafl.aer.mil.br</p>
</header>`;
}

function renderTitle(m: OrdemServicoDocumentModel): string {
  return `
<section class="title">
  <p class="eyebrow">Manutenção Predial sob Demanda &nbsp;·&nbsp; Lei nº 14.133/2021</p>
  <h1>Ordem de Serviço</h1>
  <p class="objeto">${escapeHtml(m.objeto)}</p>
  <div class="idstrip">
    <div><span class="label">Número</span><span class="value num">${v(m.numero)}</span></div>
    <div><span class="label">Processo administrativo (e-PAG)</span><span class="value">${v(m.processo)}</span></div>
    <div><span class="label">Emissão</span><span class="value">${v(m.dataEmissao)}</span></div>
  </div>
</section>`;
}

function renderMemo(m: OrdemServicoDocumentModel): string {
  const refs = m.referencias.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  return `
<dl class="memo">
  <dt>Do</dt><dd>Chefe da Seção de Engenharia da Base Aérea de Florianópolis</dd>
  <dt>À</dt><dd><strong>${v(m.empresa)}</strong>${m.cnpj ? ` <span class="muted">— CNPJ ${escapeHtml(m.cnpj)}</span>` : ""}</dd>
  <dt>Referências</dt><dd><ul class="refs">${refs}</ul></dd>
</dl>`;
}

// Quadro-resumo: prazo, valor e cronograma à vista antes do texto
function renderSummary(m: OrdemServicoDocumentModel): string {
  const lote = m.identificacao.lotes.find((l) => l.selecionado);
  const urgencia = m.identificacao.urgencias.find((u) => u.selecionado);
  const facts = [
    lote && `<span><b>Lote</b> ${escapeHtml(lote.texto)}</span>`,
    `<span><b>Urgência</b> ${v(urgencia?.texto ?? "")}</span>`,
    `<span><b>Vistoria</b> ${v(m.identificacao.dataVistoria)}</span>`,
    `<span><b>Data-base SINAPI</b> ${v(m.orcamento.dataBaseSinapi)}</span>`,
  ].filter(Boolean);
  return `
<section class="summary">
  <div class="card accent">
    <span class="label">Prazo máximo de execução</span>
    <span class="big">${v(m.prazo.dias)}</span>
    <span class="sub">incluídos ${m.mobilizacao.dias} dias de mobilização</span>
  </div>
  <div class="card">
    <span class="label">Valor total da OS</span>
    <span class="big">${v(m.orcamento.totalComBdiEDesconto)}</span>
    <span class="sub">${
      m.orcamento.totalComBdi === ""
        ? "valor registrado na OS"
        : `com BDI${m.identificacao.lotes.some((l) => l.selecionado) ? " e desconto do lote" : ""}`
    }</span>
  </div>
  <div class="card">
    <span class="label">Cronograma</span>
    <span class="big dates">${v(m.cronograma.inicio)}${ARROW}${v(m.cronograma.termino)}</span>
    <span class="sub">início e término previsto</span>
  </div>
  <div class="facts">${facts.join("")}</div>
</section>`;
}

function renderIntro(m: OrdemServicoDocumentModel): string {
  const mobilizacao = `${m.mobilizacao.dias} (${escapeHtml(m.mobilizacao.extenso)}) dias corridos`;
  const prazo = m.inicio.prazo
    ? `O prazo máximo para a conclusão dos trabalhos é de ${hl(escapeHtml(m.inicio.prazo))}, já incluídos ${hl(mobilizacao)} para mobilização, conforme o Cronograma Físico-Financeiro vinculado a esta Ordem de Serviço, que passa a vigorar a partir da data de sua assinatura`
    : `O prazo máximo para a conclusão dos trabalhos, já incluídos ${hl(mobilizacao)} para mobilização, está estabelecido no Cronograma Físico-Financeiro vinculado a esta Ordem de Serviço, passando a vigorar a partir da data de sua assinatura`;
  return `
<section class="intro">
  <p>Por meio do presente documento, a empresa ${strong(m.empresa)}, inscrita no CNPJ sob o nº ${strong(m.cnpj)}, fica formalmente autorizada a dar início à execução dos serviços contratados na Área da Guarnição de Aeronáutica de Florianópolis. ${prazo}, devendo a contratada assegurar o cumprimento integral dos serviços.</p>
  <p>A contratada assume a responsabilidade pela implementação de todas as medidas necessárias para garantir a segurança ocupacional, incluindo a utilização adequada de Equipamentos de Proteção Individual (EPIs) e Equipamentos de Proteção Coletiva (EPCs), em estrita conformidade com as Normas Regulamentadoras (NRs), as normas técnicas da ABNT e as demais disposições legais pertinentes.</p>
  <p>A execução dos serviços deverá seguir rigorosamente as diretrizes estabelecidas no Termo de Referência vinculado ao e-PAG ${strong(m.processo)}, a fim de garantir a conformidade com as especificações técnicas e os procedimentos definidos. Qualquer desvio ou ocorrência que possa impactar o andamento dos trabalhos deverá ser imediatamente comunicado, por escrito, à equipe de fiscalização designada.</p>
  <p>A contratada permanece integralmente responsável pelo cumprimento de todas as obrigações legais e contratuais, devendo todas as etapas da obra ser conduzidas dentro dos mais elevados padrões de qualidade, segurança e eficiência.</p>
</section>`;
}

function renderIdentificacao(m: OrdemServicoDocumentModel): string {
  const id = m.identificacao;
  const lotes = id.lotes.length > 0 ? `<tr><th>Lote</th><td>${options(id.lotes)}</td></tr>` : "";
  return `
<section>
  ${heading(1, "Identificação do serviço")}
  <p>A presente Ordem de Serviço autoriza o início das atividades de manutenção predial, em estrita observância ao Estudo Técnico Preliminar (ETP) ${strong(id.etp)}, ao Termo de Referência (TR) ${strong(id.termoReferencia)} e seus anexos, e ao Contrato ${strong(id.contrato)}.</p>
  <table class="kv">
    ${lotes}
    <tr><th>Edificação</th><td><strong>${v(id.edificacao)}</strong></td></tr>
    <tr><th>Endereço</th><td>${v(id.endereco)}</td></tr>
    <tr><th>Área construída</th><td>${v(id.areaConstruida)}</td></tr>
    <tr><th>Estado de conservação</th><td>${v(id.estadoConservacao)}</td></tr>
    <tr><th>Setor requisitante</th><td>${v(id.setorRequisitante)}</td></tr>
    <tr><th>Classificação de urgência</th><td>${options(id.urgencias, true)}</td></tr>
    <tr><th>Data da vistoria</th><td>${v(id.dataVistoria)}</td></tr>
  </table>
  <div class="callout">
    <span class="label">Descrição do problema</span>
    <p class="free">${v(id.descricaoProblema)}</p>
  </div>
</section>`;
}

function renderPreco(m: OrdemServicoDocumentModel): string {
  const temLotes = m.preco.lotes.length > 0;
  const lotes = temLotes
    ? `
  <table class="table lotes">
    <caption>Desconto linear por lote</caption>
    <thead><tr><th>Lote</th><th class="num">Desconto (D)</th></tr></thead>
    <tbody>${m.preco.lotes
      .map(
        (l) =>
          `<tr${l.selecionado ? ' class="on"' : ""}><td>${escapeHtml(l.lote)}${l.selecionado ? '<span class="tag">Esta OS</span>' : ""}</td><td class="num">${escapeHtml(l.desconto)}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`
    : "";
  return `
<section>
  ${heading(2, "Composição do preço")}
  <p>O cálculo do valor total desta OS segue a fórmula estipulada no Termo de Referência ${strong(m.identificacao.termoReferencia)}:</p>
  <div class="formula"><var>VT</var> = <var>C</var> × (1 + <var>BDI</var>) × (1 − <var>D</var>)</div>
  <dl class="vars">
    <dt>VT</dt><dd>valor total da OS;</dd>
    <dt>C</dt><dd>Custo Unitário SINAPI, não desonerado, para Florianópolis/SC, na data-base de lançamento do edital;</dd>
    <dt>BDI</dt><dd>Benefício e Despesas Indiretas, fixado em ${strong(m.preco.bdi)}${temLotes ? " para todos os lotes" : ""};</dd>
    <dt>D</dt><dd>desconto linear ofertado na licitação${temLotes ? ", que varia conforme o lote (tabela abaixo)" : ""}.</dd>
  </dl>
  ${lotes}
</section>`;
}

function renderOrcamento(m: OrdemServicoDocumentModel): string {
  const o = m.orcamento;
  const comDesconto = m.identificacao.lotes.some((l) => l.selecionado);
  const linhas =
    o.totalComBdi === ""
      ? ""
      : `
    <tr><td>Total sem BDI</td><td class="num">${escapeHtml(o.total)}</td></tr>
    <tr><td>Total com BDI <span class="muted">(${escapeHtml(o.bdi)})</span></td><td class="num">${escapeHtml(o.totalComBdi)}</td></tr>
    ${comDesconto ? `<tr><td>Desconto do lote <span class="muted">(${escapeHtml(o.desconto)})</span></td><td class="num">− ${escapeHtml(o.valorDesconto)}</td></tr>` : ""}`;
  return `
<section>
  ${heading(3, "Orçamento da Ordem de Serviço")}
  <table class="table budget">
    <thead><tr><th>Composição</th><th class="num">Valor</th></tr></thead>
    <tbody>
      ${linhas}
      <tr class="total"><td>Valor total da OS${comDesconto && o.totalComBdi ? " <span>(com BDI e desconto)</span>" : ""}</td><td class="num">${v(o.totalComBdiEDesconto)}</td></tr>
    </tbody>
  </table>
  <p class="note">Data-base SINAPI: ${strong(o.dataBaseSinapi)}.</p>
</section>`;
}

function renderPrazo(m: OrdemServicoDocumentModel): string {
  return `
<section>
  ${heading(4, "Prazo do Cronograma Físico-Financeiro")}
  <div class="deadline">
    <div class="main">
      <span class="label">Prazo máximo de execução</span>
      <span class="big">${v(m.inicio.prazo)}</span>
      <span class="sub">já incluídos ${m.mobilizacao.dias} (${escapeHtml(m.mobilizacao.extenso)}) dias corridos para mobilização</span>
    </div>
    <div><span class="label">Início</span><span class="mid">${v(m.cronograma.inicio)}</span></div>
    <div><span class="label">Término previsto</span><span class="mid">${v(m.cronograma.termino)}</span></div>
  </div>
  <p class="note"><strong>Nota:</strong> os prazos foram calculados com base nos índices de produtividade da tabela SINAPI para a composição dos serviços listados.</p>
</section>`;
}

function renderCondicoes(m: OrdemServicoDocumentModel): string {
  const especiais =
    m.condicoesEspeciais.length > 0
      ? `
  <h3><span>5.4</span>Condições especiais desta OS</h3>
  <ul class="list special">${m.condicoesEspeciais.map((c) => `<li class="free">${escapeHtml(c)}</li>`).join("")}</ul>`
      : "";
  return `
<section>
  ${heading(5, "Condições especiais e responsabilidades")}
  <h3><span>5.1</span>Execução e segurança</h3>
  <ul class="list">
    <li><strong>Horário:</strong> conforme o expediente administrativo da Unidade — ${hl("segunda a quinta-feira, das 08h00 às 16h00, e sexta-feira, das 08h00 às 12h00")}. Trabalhos em horários diferenciados exigem autorização prévia da Fiscalização.</li>
    <li><strong>Segurança:</strong> é obrigatório o uso de EPIs completos. Os funcionários devem portar crachá de identificação visível.</li>
  </ul>
  <h3><span>5.2</span>Sustentabilidade ambiental</h3>
  <ul class="list">
    <li>Uso obrigatório de tintas com baixo teor de VOC (Compostos Orgânicos Voláteis).</li>
    <li>Gestão de resíduos conforme a Resolução CONAMA nº 307/2002 (segregação na fonte).</li>
    <li>Equipamentos elétricos devem possuir Selo Procel ou ENCE Classe A.</li>
  </ul>
  <h3><span>5.3</span>Responsabilidades</h3>
  <ul class="list">
    <li><strong>Contratada:</strong> fornecimento de materiais e ferramentas, limpeza diária da frente de serviço e garantia da qualidade técnica.</li>
    <li><strong>BAFL:</strong> garantir livre acesso às áreas de intervenção e fornecer pontos de energia e água, quando disponíveis.</li>
  </ul>
  ${especiais}
</section>`;
}

function renderFiscais(m: OrdemServicoDocumentModel): string {
  const f = m.fiscais;
  return `
<section>
  ${heading(6, "Designação de fiscais")}
  <table class="table">
    <thead><tr><th>Função</th><th>Nome</th><th>Contato</th></tr></thead>
    <tbody>
      <tr><td class="role">Fiscal Técnico</td><td><strong>${v(f.tecnico.nome)}</strong></td><td>${v(f.tecnico.contato)}</td></tr>
      <tr><td class="role">Fiscal Administrativo</td><td><strong>${v(f.administrativo.nome)}</strong></td><td>${v(f.administrativo.contato)}</td></tr>
      <tr><td class="role">Fiscal Setorial</td><td><strong>${v(f.setorial)}</strong></td><td class="muted">—</td></tr>
    </tbody>
  </table>
</section>`;
}

function renderInicio(m: OrdemServicoDocumentModel): string {
  return `
<section>
  ${heading(7, "Início dos serviços")}
  <p>Fica formalmente autorizado o início dos serviços pela empresa ${strong(m.empresa)}, em ${hlNoWrap(v(m.inicio.data))}, com o prazo de ${hl(v(m.inicio.prazo))}.</p>
</section>`;
}

function renderAssinaturas(m: OrdemServicoDocumentModel): string {
  const anexos = ANEXOS.map((a, i) => `<li><span class="rn">${ROMANOS[i]}</span>${a}</li>`).join("");
  return `
<section class="signatures">
  ${heading(8, "Aprovação e assinatura")}
  <p class="place">${escapeHtml(m.local)}</p>
  <div class="sigs">
    <div class="sig"><span class="name">${v(m.assinaturas.empresa)}</span><span class="role">Contratada · CNPJ ${v(m.assinaturas.cnpj)}</span></div>
    <div class="sig"><span class="name">${v(m.assinaturas.fiscalTecnico)}</span><span class="role">Fiscal Técnico</span></div>
  </div>
</section>
<section class="annexes">
  <span class="label">Anexos</span>
  <ol>${anexos}</ol>
</section>`;
}

const STYLES = `
@page { size: A4; }
:root {
  --ink: #111111; --text: #1f1f1f; --muted: #555555; --faint: #7a7a7a;
  --rule: #c8c8c8; --hair: #e0e0e0; --tint: #f3f3f3; --marker: #e2e2e2;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: "Source Serif 4", Georgia, serif; font-size: 10.5pt; line-height: 1.5; color: var(--text);
  font-kerning: normal; text-rendering: optimizeLegibility;
}
p { text-align: justify; hyphens: auto; orphans: 3; widows: 3; }
section > p { margin-bottom: 2.4mm; }
strong { font-weight: 600; color: var(--ink); }
.muted { color: var(--muted); font-weight: 400; }
.free { white-space: pre-line; }
.label {
  display: block; font-family: Inter, Arial, sans-serif; font-size: 6.6pt; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-bottom: .8mm;
}
.blank { display: inline-block; min-width: 28mm; height: .9em; border-bottom: .7pt dotted #999; vertical-align: baseline; }
.hl {
  font-weight: 600; color: var(--ink);
  background: linear-gradient(to bottom, transparent 56%, var(--marker) 56%, var(--marker) 94%, transparent 94%);
  -webkit-box-decoration-break: clone; box-decoration-break: clone; padding: 0 .4mm;
}
.nowrap { white-space: nowrap; }

/* Timbre: brasão, órgãos e endereço sempre centralizados */
.letterhead, .letterhead p, .title p { text-align: center; }
.letterhead { padding-bottom: 3.4mm; border-bottom: 2.4pt double var(--ink); }
.brasao { display: block; height: 19mm; margin: 0 auto 2.6mm; }
.org { font-size: 8.6pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; line-height: 1.45; color: var(--ink); }
.org-main { font-size: 10.5pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; line-height: 1.5; color: var(--ink); }
.org-contact { font-family: Inter, Arial, sans-serif; font-size: 6.9pt; color: var(--muted); margin-top: 1.2mm; }

/* Título e identificação */
.title { margin: 6mm 0 4.5mm; text-align: center; }
.eyebrow { font-family: Inter, Arial, sans-serif; font-size: 7pt; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
h1 { font-size: 17pt; font-weight: 700; line-height: 1.2; letter-spacing: .16em; text-transform: uppercase; color: var(--ink); margin-top: 1.8mm; }
.objeto { font-family: Inter, Arial, sans-serif; font-size: 8.4pt; font-weight: 500; letter-spacing: .12em; color: var(--muted); margin-top: 1mm; }
.idstrip {
  display: grid; grid-template-columns: 1.15fr 1.25fr 1fr; text-align: left; margin-top: 5mm;
  border-top: .75pt solid var(--ink); border-bottom: .75pt solid var(--ink);
}
.idstrip > div { padding: 2.2mm 3mm 2.4mm; border-left: .5pt solid var(--rule); }
.idstrip > div:first-child { border-left: 0; padding-left: 0; }
.idstrip .value { font-family: Inter, Arial, sans-serif; font-size: 9pt; font-weight: 600; color: var(--ink); }
.idstrip .num { font-size: 10.5pt; font-weight: 700; }

/* Do / À / Referências */
.memo { display: grid; grid-template-columns: 25mm 1fr; gap: 1.8mm 4mm; margin: 4.5mm 0 5mm; }
.memo dt { font-family: Inter, Arial, sans-serif; font-size: 6.8pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); padding-top: .9mm; }
.refs { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: .4mm 6mm; font-size: 9.6pt; }

/* Quadro-resumo */
.summary { display: grid; grid-template-columns: 1.1fr 1fr 1.15fr; margin-bottom: 6mm; border: .75pt solid var(--ink); break-inside: avoid; }
.card { padding: 3mm 3.8mm 3.2mm; border-left: .5pt solid var(--rule); font-family: Inter, Arial, sans-serif; }
.card:first-child { border-left: 0; }
.card.accent { background: var(--tint); }
.card .big { display: block; font-size: 13pt; font-weight: 700; line-height: 1.25; color: var(--ink); letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.card .big.dates { font-size: 11pt; padding-top: .9mm; }
.card .arrow { width: 3.4mm; height: 2.2mm; margin: 0 1.6mm; vertical-align: .35mm; color: var(--faint); }
.card .sub { display: block; font-size: 7pt; color: var(--muted); margin-top: .8mm; }
.facts {
  grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 1mm 6mm; padding: 2mm 3.8mm;
  border-top: .5pt solid var(--rule); font-family: Inter, Arial, sans-serif; font-size: 7.6pt; color: var(--ink);
}
.facts b { font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: .08em; font-size: 6.4pt; margin-right: 1.2mm; }

.intro p { margin-bottom: 2.4mm; }

/* Seções: numeração de documento técnico */
h2 {
  display: flex; align-items: baseline; margin: 7mm 0 3mm; padding-bottom: 1.4mm;
  border-bottom: .75pt solid var(--ink); break-after: avoid;
  font-size: 10.5pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink);
}
h2 .n, h3 span { flex: none; width: 9mm; font-variant-numeric: lining-nums tabular-nums; }
h3 { display: flex; align-items: baseline; margin: 3.6mm 0 1.4mm; break-after: avoid; font-size: 10.5pt; font-weight: 600; color: var(--ink); }

/* Tabela chave/valor */
.kv { width: 100%; border-collapse: collapse; margin: 1mm 0 3mm; }
.kv tr { border-bottom: .5pt solid var(--hair); break-inside: avoid; }
.kv tr:first-child { border-top: .5pt solid var(--hair); }
.kv th {
  width: 44mm; padding: 2.1mm 3mm 1.9mm 0; text-align: left; vertical-align: top;
  font-family: Inter, Arial, sans-serif; font-size: 7pt; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted);
}
.kv td { padding: 1.5mm 0; vertical-align: top; }

/* Opções marcadas */
.opts { display: flex; flex-wrap: wrap; gap: 1.2mm 5mm; padding: .5mm 0; }
.opts.grid { display: grid; grid-template-columns: 1fr 1fr; }
.opt { display: inline-flex; align-items: center; gap: 1.8mm; font-family: Inter, Arial, sans-serif; font-size: 8.2pt; color: var(--faint); }
.opt .box { position: relative; flex: none; width: 3.2mm; height: 3.2mm; border: .6pt solid #9a9a9a; }
.opt.on { color: var(--ink); font-weight: 600; }
.opt.on .box { background: var(--ink); border-color: var(--ink); }
.opt.on .box::after {
  content: ""; position: absolute; left: 1mm; top: .3mm; width: .85mm; height: 1.75mm;
  border: solid #fff; border-width: 0 .5mm .5mm 0; transform: rotate(45deg);
}

.callout { padding: 3mm 4mm 3.2mm; background: var(--tint); border-left: .8mm solid var(--ink); break-inside: avoid; }
.callout p { margin: 0; }

/* Fórmula */
.formula {
  width: fit-content; margin: 3.4mm auto 3.6mm; padding: 2.4mm 8mm;
  border-top: .5pt solid var(--rule); border-bottom: .5pt solid var(--rule);
  font-size: 13pt; letter-spacing: .02em; color: var(--ink);
}
.formula var, .vars dt { font-style: italic; font-weight: 600; color: var(--ink); }
.vars { display: grid; grid-template-columns: 11mm 1fr; gap: 1mm 3mm; margin-bottom: 3mm; }
.vars dt { text-align: right; }
.vars dd { text-align: justify; hyphens: auto; }

/* Tabelas de dados */
.table { width: 100%; border-collapse: collapse; break-inside: avoid; font-family: Inter, Arial, sans-serif; font-size: 8.4pt; font-variant-numeric: tabular-nums; }
.table caption { caption-side: top; text-align: left; padding: 0 2.6mm 1mm; font-size: 7.4pt; font-weight: 600; color: var(--ink); }
.table th {
  padding: 1.6mm 2.6mm; text-align: left; border-bottom: .5pt solid var(--ink);
  font-size: 6.6pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
}
.table td { padding: 1.9mm 2.6mm; border-bottom: .5pt solid var(--hair); vertical-align: top; }
.table tbody tr:last-child td { border-bottom: .75pt solid var(--ink); }
.table .num { text-align: right; white-space: nowrap; }
.table td.role { color: var(--muted); white-space: nowrap; }
.table tr.on td { background: var(--tint); color: var(--ink); font-weight: 600; }
.table.lotes { width: 70%; margin: 0 auto 1mm; }
.table.lotes td { padding-top: 1.4mm; padding-bottom: 1.4mm; }
.table.lotes th { border-top: .75pt solid var(--ink); }
.tag {
  display: inline-block; margin-left: 2mm; padding: 0 1.4mm; vertical-align: 1pt; border: .5pt solid var(--ink);
  color: var(--ink); font-size: 5.8pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
}
.budget tr.total td { background: var(--tint); color: var(--ink); font-size: 10pt; font-weight: 700; padding: 2.4mm 2.6mm; border-top: .75pt solid var(--ink); }
.budget tr.total td span { font-size: 7.4pt; font-weight: 400; color: var(--muted); }
.note { margin-top: 2mm; font-size: 9pt; color: var(--muted); }

/* Prazo */
.deadline { display: grid; grid-template-columns: 1.9fr 1fr 1fr; border: .75pt solid var(--ink); break-inside: avoid; font-family: Inter, Arial, sans-serif; }
.deadline > div { padding: 3mm 4mm; }
.deadline > div:first-child { background: var(--tint); }
.deadline > div + div { border-left: .5pt solid var(--rule); }
.deadline .big { display: block; font-size: 12.5pt; font-weight: 700; color: var(--ink); line-height: 1.25; }
.deadline .mid { display: block; font-size: 11pt; font-weight: 600; color: var(--ink); padding-top: .8mm; font-variant-numeric: tabular-nums; }
.deadline .sub { display: block; font-size: 7.2pt; color: var(--muted); margin-top: .8mm; }

/* Listas, alinhadas ao título da subseção */
.list { list-style: none; padding-left: 9mm; }
.list li { position: relative; margin-bottom: 1.3mm; text-align: justify; hyphens: auto; }
.list li::before { content: "–"; position: absolute; left: -4.6mm; color: var(--muted); }

/* Assinaturas e anexos */
.signatures { break-inside: avoid; }
.place { text-align: right; margin: 4mm 0 19mm; }
.sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; }
.sig { border-top: .6pt solid var(--ink); padding-top: 1.8mm; text-align: center; font-family: Inter, Arial, sans-serif; }
.sig .name { display: block; font-size: 8.8pt; font-weight: 600; color: var(--ink); }
.sig .role { display: block; font-size: 7.4pt; color: var(--muted); margin-top: .4mm; }
.annexes { margin-top: 10mm; padding: 3mm 4mm; border: .5pt solid var(--rule); break-inside: avoid; }
.annexes ol { list-style: none; columns: 2; column-gap: 8mm; font-size: 9.2pt; }
.annexes li { break-inside: avoid; line-height: 1.6; }
.annexes .rn { display: inline-block; width: 7mm; font-family: Inter, Arial, sans-serif; font-size: 8pt; font-weight: 600; color: var(--ink); }
`;

/** Documento HTML completo da OS, autocontido (fontes e brasão embutidos), pronto para imprimir em A4. */
export function renderOrdemServicoHtml(m: OrdemServicoDocumentModel): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(m.titulo)}</title>
<style>${embeddedFontFaces()}${STYLES}</style>
</head>
<body>
${renderLetterhead()}
${renderTitle(m)}
${renderMemo(m)}
${renderSummary(m)}
${renderIntro(m)}
${renderIdentificacao(m)}
${renderPreco(m)}
${renderOrcamento(m)}
${renderPrazo(m)}
${renderCondicoes(m)}
${renderFiscais(m)}
${renderInicio(m)}
${renderAssinaturas(m)}
</body>
</html>`;
}

/** Rodapé de cada página (nº da OS e paginação), no formato de template do Chrome. */
export function renderOrdemServicoFooter(m: OrdemServicoDocumentModel): string {
  return `<style>${embeddedFooterFontFace()}</style>
<div style="width:100%;padding:0 20mm;box-sizing:border-box;font-family:Inter,Arial,sans-serif;font-size:7pt;color:#7a7a7a;letter-spacing:0.02em;">
<div style="display:flex;justify-content:space-between;border-top:0.5pt solid #c8c8c8;padding-top:2mm;">
<span>${escapeHtml(m.numero)} &nbsp;·&nbsp; Base Aérea de Florianópolis &nbsp;·&nbsp; Seção de Engenharia</span>
<span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
</div>
</div>`;
}
