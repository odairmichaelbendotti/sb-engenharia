import PDFDocument from "pdfkit";
import type { IOrdemServicoDocumentGenerator } from "../../domain/documents/IOrdemServicoDocumentGenerator.js";
import type { DocumentOption, OrdemServicoDocumentModel } from "../../domain/documents/ordem-servico-document.js";
import { BRASAO_BASE64 } from "./brasao.js";

const MARGIN_X = 71;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 56;
const TEXT_SIZE = 11.5;
const LINE_GAP = 2.5;
const PARAGRAPH_GAP = 7;

const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";
const SERIF_ITALIC = "Times-Italic";
const SANS_BOLD = "Helvetica-Bold";

const ANEXOS = [
  "I. Planilha Orçamentária Sintética",
  "II. Planilha Orçamentária Analítica",
  "III. Cronograma Físico-Financeiro",
  "IV. Premissas Técnicas",
  "V. Produtividade (SINAPI)",
  "VI. Observações Técnicas Para Execução",
];

type Doc = InstanceType<typeof PDFDocument>;
type Part = { t: string; b?: boolean; i?: boolean };

const plain = (t: string): Part => ({ t });
const bold = (t: string): Part => ({ t, b: true });

function contentWidth(doc: Doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

// Texto com trechos em negrito/itálico na mesma linha
function rich(
  doc: Doc,
  parts: Part[],
  options: PDFKit.Mixins.TextOptions = {},
  position?: { x: number; y: number },
) {
  // O pdfkit descarta o espaço no começo de um trecho em texto justificado: o espaço vai para o fim do anterior
  const visible: Part[] = [];
  for (const part of parts) {
    if (part.t === "") continue;
    const previous = visible[visible.length - 1];
    if (previous && part.t.startsWith(" ")) {
      previous.t += " ";
      visible.push({ ...part, t: part.t.trimStart() });
    } else {
      visible.push({ ...part });
    }
  }
  if (visible.length === 0) return;
  visible.forEach((part, index) => {
    doc.font(part.b ? SERIF_BOLD : part.i ? SERIF_ITALIC : SERIF);
    const textOptions = { ...options, continued: index < visible.length - 1 };
    if (index === 0 && position) doc.text(part.t, position.x, position.y, textOptions);
    else doc.text(part.t, textOptions);
  });
}

// Alinhado à esquerda: o pdfkit justifica só o último trecho de uma linha com negrito, o que abre espaços irregulares
function paragraph(doc: Doc, parts: Part[], options: PDFKit.Mixins.TextOptions = {}) {
  rich(doc, parts, { align: "left", lineGap: LINE_GAP, paragraphGap: PARAGRAPH_GAP, ...options });
}

function line(doc: Doc, parts: Part[], options: PDFKit.Mixins.TextOptions = {}) {
  rich(doc, parts, { lineGap: LINE_GAP, ...options });
}

// Garante que o trecho seguinte não comece colado no fim da página
function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function rule(doc: Doc, gapBefore = 10, gapAfter = 12) {
  doc.y += gapBefore;
  const y = doc.y;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.5)
    .strokeColor("#c8c8c8")
    .stroke();
  doc.strokeColor("#000000");
  doc.y = y + gapAfter;
  doc.x = doc.page.margins.left;
}

function heading(doc: Doc, number: string, title: string) {
  ensureSpace(doc, 100);
  rule(doc, 4, 12);
  const y = doc.y;
  doc.font(SERIF_BOLD).fontSize(TEXT_SIZE + 0.5);
  doc.text(number, doc.page.margins.left, y, { lineBreak: false });
  doc.text(title, doc.page.margins.left + 34, y, { lineGap: LINE_GAP, paragraphGap: 8 });
  doc.x = doc.page.margins.left;
  doc.fontSize(TEXT_SIZE);
}

function subheading(doc: Doc, number: string, title: string) {
  ensureSpace(doc, 70);
  const y = doc.y;
  doc.font(SERIF).fontSize(TEXT_SIZE);
  doc.text(number, doc.page.margins.left, y, { lineBreak: false });
  doc.text(title, doc.page.margins.left + 34, y, { paragraphGap: 5 });
  doc.x = doc.page.margins.left;
}

function bullet(doc: Doc, parts: Part[], level = 0) {
  ensureSpace(doc, 36);
  const left = doc.page.margins.left;
  const indent = 34 + level * 22;
  const y = doc.y;
  doc.font(SERIF).fontSize(TEXT_SIZE).text(level === 0 ? "•" : "–", left + indent - 14, y, { lineBreak: false });
  rich(
    doc,
    parts,
    { align: "left", lineGap: LINE_GAP, paragraphGap: 3, width: contentWidth(doc) - indent },
    { x: left + indent, y },
  );
  doc.x = left;
}

function optionMarker(option: DocumentOption): Part[] {
  return [{ t: `[ ${option.selecionado ? "X" : " "} ] ${option.texto}`, b: option.selecionado }];
}

function optionsInline(doc: Doc, label: string, options: DocumentOption[]) {
  const parts: Part[] = [bold(label), plain(" ")];
  options.forEach((option, index) => {
    if (index > 0) parts.push(plain(" | "));
    parts.push(...optionMarker(option));
  });
  line(doc, parts, { align: "left" });
}

function field(doc: Doc, label: string, value: string, extra: Part[] = []) {
  line(doc, [bold(`${label}: `), plain(value), ...extra], { align: "left" });
}

function renderHeader(doc: Doc, m: OrdemServicoDocumentModel) {
  const centerX = doc.page.margins.left;
  const width = contentWidth(doc);

  const brasaoSize = 64;
  doc.image(Buffer.from(BRASAO_BASE64, "base64"), (doc.page.width - brasaoSize) / 2, doc.y, {
    width: brasaoSize,
  });
  doc.y += brasaoSize + 10;

  doc.font(SERIF).fontSize(11);
  doc.text("MINISTÉRIO DA DEFESA", centerX, doc.y, { width, align: "center", lineGap: 1.5 });
  doc.text("COMANDO DA AERONÁUTICA", { width, align: "center", lineGap: 1.5 });
  doc.text("BASE AÉREA DE FLORIANÓPOLIS", { width, align: "center", underline: true, lineGap: 1.5 });
  doc.text("Av. Santos Dumont, s/n – Tapera", { width, align: "center", underline: false, lineGap: 1.5 });
  doc.font(SERIF_BOLD).fontSize(9.5);
  doc.text("Tel: (48) 3229-5000 / Fax: (48) 3236-1344 / e-mail: protocolo.bafl@bafl.aer.mil.br", {
    width,
    align: "center",
  });

  doc.moveDown(0.9);
  doc.font(SANS_BOLD).fontSize(14.5);
  doc.text(m.titulo, centerX, doc.y, { width, align: "center" });
  doc.moveDown(0.35);
  doc.font(SERIF_ITALIC).fontSize(9.5).fillColor("#666666");
  doc.text("Manutenção Predial sob Demanda - Lei nº 14.133/2021", { width, align: "center" });
  if (m.dataEmissao) {
    doc.moveDown(0.3);
    doc.font(SERIF).fontSize(8.5).fillColor("#888888");
    doc.text(m.dataEmissao, { width, align: "center" });
  }
  doc.fillColor("#000000").fontSize(TEXT_SIZE);

  rule(doc, 12, 14);

  line(doc, [bold(m.numero)], { align: "left" });
  line(doc, [bold(`Processo administrativo nº ${m.processo}`)], { align: "left", paragraphGap: 8 });
  line(doc, [plain("Do: Chefe da Seção de Engenharia da Base Aérea de Florianópolis")], {
    align: "left",
    paragraphGap: 2,
  });
  line(doc, [plain("À: "), bold(m.empresa)], { align: "left", paragraphGap: 9 });

  const refsY = doc.y;
  doc.font(SERIF).text("Referências:", doc.page.margins.left, refsY, { lineBreak: false });
  doc.font(SERIF_BOLD);
  m.referencias.forEach((ref, index) => {
    doc.text(ref, doc.page.margins.left + 110, refsY + index * (TEXT_SIZE + 6), { lineBreak: false });
  });
  doc.y = refsY + m.referencias.length * (TEXT_SIZE + 6);
  doc.x = doc.page.margins.left;

  rule(doc, 4, 14);
}

function renderIntro(doc: Doc, m: OrdemServicoDocumentModel) {
  const indent = { indent: 28 };
  paragraph(
    doc,
    [
      plain("Por meio do presente documento, a empresa "),
      bold(m.empresa),
      plain(", inscrita no CNPJ sob o nº "),
      bold(m.cnpj),
      plain(
        ", fica formalmente autorizada a dar início à execução dos serviços contratados na Área da Guarnição de Aeronáutica de Florianópolis. O prazo máximo para a conclusão dos trabalhos, já incluídos ",
      ),
      bold(`${m.mobilizacao.dias} (${m.mobilizacao.extenso}) dias corridos`),
      plain(
        " para mobilização, está estabelecido no Cronograma Físico-Financeiro vinculado a esta Ordem de Serviço, passando a vigorar a partir da data de sua assinatura, devendo a contratada assegurar o cumprimento integral dos serviços.",
      ),
    ],
    indent,
  );
  paragraph(
    doc,
    [
      plain(
        "A contratada assume a responsabilidade pela implementação de todas as medidas necessárias para garantir a segurança ocupacional, incluindo a utilização adequada de Equipamentos de Proteção Individual (EPIs) e Equipamentos de Proteção Coletiva (EPCs), em estrita conformidade com as Normas Regulamentadoras (NRs), normas técnicas da ABNT e demais disposições legais pertinentes.",
      ),
    ],
    indent,
  );
  paragraph(
    doc,
    [
      plain("A execução dos serviços deverá seguir rigorosamente as diretrizes estabelecidas no Termo de Referência vinculado ao e-PAG "),
      bold(m.processo),
      plain(
        ", a fim de garantir a conformidade com as especificações técnicas e procedimentos definidos. Qualquer desvio ou ocorrência que possa impactar o andamento dos trabalhos deverá ser imediatamente comunicado por escrito à equipe de fiscalização designada.",
      ),
    ],
    indent,
  );
  paragraph(
    doc,
    [
      plain(
        "A contratada permanece integralmente responsável pelo cumprimento de todas as obrigações legais e contratuais, devendo todas as etapas da obra serem conduzidas dentro dos mais elevados padrões de qualidade, segurança e eficiência.",
      ),
    ],
    indent,
  );
  paragraph(
    doc,
    [plain("Portanto, fica autorizado o início dos serviços pela empresa "), bold(m.empresa), plain(".")],
    indent,
  );
}

function renderIdentificacao(doc: Doc, m: OrdemServicoDocumentModel) {
  const id = m.identificacao;
  heading(doc, "1", "IDENTIFICAÇÃO DO SERVIÇO");
  paragraph(
    doc,
    [
      plain(
        "A presente Ordem de Serviço autoriza o início das atividades de manutenção predial, em estrita observância ao Estudo Técnico Preliminar (ETP) ",
      ),
      bold(id.etp),
      plain(", o Termo de Referência (TR) "),
      bold(id.termoReferencia),
      plain(" e seus anexos, e o contrato "),
      bold(`${id.contrato}.`),
    ],
    { indent: 0 },
  );

  if (id.lotes.length > 0) optionsInline(doc, "Lote:", id.lotes);
  field(doc, "Edificação", id.edificacao);
  field(doc, "Endereço", id.endereco);
  line(
    doc,
    [bold("Área Construída: "), plain(id.areaConstruida), plain(" | "), bold("Estado de Conservação: "), plain(id.estadoConservacao)],
    { align: "left" },
  );
  field(doc, "Setor Requisitante", id.setorRequisitante);

  line(doc, [bold("Classificação de Urgência:")], { align: "left" });
  for (const option of id.urgencias) {
    line(doc, optionMarker(option), { align: "left", indent: 24, paragraphGap: 0 });
  }
  field(doc, "Data da Vistoria", id.dataVistoria);
  doc.moveDown(0.3);
  paragraph(doc, [bold("Descrição do Problema: "), plain(id.descricaoProblema)]);
}

function renderPreco(doc: Doc, m: OrdemServicoDocumentModel) {
  heading(doc, "2.", "COMPOSIÇÃO DO PREÇO");
  paragraph(doc, [plain("O cálculo do valor total desta OS segue a fórmula estipulada no Termo de Referência "), bold(m.identificacao.termoReferencia), plain(":")], {
    align: "left",
  });
  doc.font(SERIF_ITALIC).text("VT = C × (1 + BDI) × (1 - D)", { align: "center", paragraphGap: 8 });
  doc.x = doc.page.margins.left;
  line(doc, [plain("onde:")], { align: "left", paragraphGap: 3 });

  bullet(doc, [plain("VT é o valor total da OS;")]);
  bullet(doc, [
    plain("C é o Custo Unitário SINAPI, não desonerado, para Florianópolis/SC, na data-base de lançamento do edital;"),
  ]);
  const temLotes = m.preco.lotes.length > 0;
  bullet(doc, [
    plain(`BDI é o Benefício e Despesas Indiretas, fixado em ${m.preco.bdi}${temLotes ? " para todos os lotes" : ""}; e`),
  ]);
  bullet(doc, [
    plain(`D é o desconto linear ofertado na licitação${temLotes ? ", variando conforme o lote:" : "."}`),
  ]);
  for (const lote of m.preco.lotes) {
    bullet(doc, [{ t: lote.texto, b: lote.selecionado }], 1);
  }
}

function renderOrcamento(doc: Doc, m: OrdemServicoDocumentModel) {
  const o = m.orcamento;
  heading(doc, "3.", "ORÇAMENTO DA ORDEM DE SERVIÇO");
  if (o.totalComBdi === "") {
    field(doc, "TOTAL da OS", o.totalComBdiEDesconto);
  } else {
    field(doc, "TOTAL", o.total);
    field(doc, `TOTAL com BDI [${o.bdi}]`, o.totalComBdi);
    if (m.identificacao.lotes.some((l) => l.selecionado)) {
      field(doc, `TOTAL com BDI [${o.bdi}] e Desconto [${o.desconto}]`, o.totalComBdiEDesconto);
    }
  }
  field(doc, "Data-base SINAPI", o.dataBaseSinapi);
}

function renderPrazo(doc: Doc, m: OrdemServicoDocumentModel) {
  heading(doc, "4.", "PRAZO CRONOGRAMA FÍSICO-FINANCEIRO");
  field(doc, "Prazo", m.prazo.dias ? `${m.prazo.dias}.` : "");
  paragraph(doc, [
    bold("Nota: "),
    plain("Os prazos foram calculados com base nos índices de produtividade da tabela SINAPI para a composição dos serviços listados."),
  ]);
}

function renderCondicoes(doc: Doc, m: OrdemServicoDocumentModel) {
  heading(doc, "5.", "CONDIÇÕES ESPECIAIS E RESPONSABILIDADES");

  subheading(doc, "5.1", "Execução e Segurança");
  bullet(doc, [
    bold("Horário: "),
    plain(
      "Conforme expediente administrativo da Unidade, segunda a quinta-feira, das 08:00h às 16:00h e sexta-feira, das 08:00h às 12:00h. Trabalhos em horários diferenciados exigem autorização prévia da Fiscalização.",
    ),
  ]);
  bullet(doc, [
    bold("Segurança: "),
    plain("Obrigatório o uso de EPIs completos. Os funcionários devem portar crachá de identificação visível."),
  ]);

  subheading(doc, "5.2", "Sustentabilidade Ambiental");
  bullet(doc, [plain("Uso obrigatório de tintas com baixo teor de VOC (Compostos Orgânicos Voláteis).")]);
  bullet(doc, [plain("Gestão de resíduos conforme CONAMA 307/2002 (segregação na fonte).")]);
  bullet(doc, [plain("Equipamentos elétricos devem possuir Selo Procel ou ENCE Classe A.")]);

  subheading(doc, "5.3", "Responsabilidades");
  bullet(doc, [
    bold("Contratada: "),
    plain("Fornecimento de materiais, ferramentas, limpeza diária da frente de serviço e garantia da qualidade técnica."),
  ]);
  bullet(doc, [
    bold("BAFL: "),
    plain("Garantir livre acesso às áreas de intervenção e fornecer pontos de energia e água quando disponíveis."),
  ]);

  if (m.condicoesEspeciais.length > 0) {
    subheading(doc, "5.4", "Condições Especiais desta OS");
    for (const condicao of m.condicoesEspeciais) bullet(doc, [plain(condicao)]);
  }
}

function renderFiscais(doc: Doc, m: OrdemServicoDocumentModel) {
  heading(doc, "6.", "DESIGNAÇÃO DE FISCAIS");
  field(doc, "Fiscal Técnico", m.fiscais.tecnico);
  field(doc, "Fiscal Administrativo", m.fiscais.administrativo);
  field(doc, "Fiscal Setorial", m.fiscais.setorial);
}

function renderInicio(doc: Doc, m: OrdemServicoDocumentModel) {
  heading(doc, "7.", "INÍCIO DOS SERVIÇOS");
  paragraph(doc, [
    plain("Fica formalmente autorizado o início dos serviços pela empresa "),
    bold(m.empresa),
    plain(m.inicio.data ? `, em ${m.inicio.data}` : ""),
    plain(m.inicio.prazo ? ` com o prazo de ${m.inicio.prazo}.` : "."),
  ]);
}

function renderAssinaturas(doc: Doc, m: OrdemServicoDocumentModel) {
  ensureSpace(doc, 220);
  heading(doc, "8.", "APROVAÇÃO E ASSINATURA");
  doc.moveDown(2.2);

  const left = doc.page.margins.left;
  const columnWidth = (contentWidth(doc) - 30) / 2;
  const y = doc.y;
  const columns = [
    { x: left, linhas: [m.assinaturas.empresa, `CNPJ: ${m.assinaturas.cnpj}`] },
    { x: left + columnWidth + 30, linhas: [m.assinaturas.fiscalTecnico, "Fiscal Técnico"] },
  ];
  for (const col of columns) {
    doc.moveTo(col.x, y).lineTo(col.x + columnWidth, y).lineWidth(0.5).strokeColor("#555555").stroke();
    doc.strokeColor("#000000");
    doc.font(SERIF).fontSize(9.5).fillColor("#333333");
    col.linhas.forEach((texto, index) => {
      doc.text(texto, col.x, y + 5 + index * 12, { width: columnWidth, align: "center" });
    });
  }
  doc.fillColor("#000000").fontSize(TEXT_SIZE);
  doc.y = y + 5 + 2 * 12 + 18;
  doc.x = left;

  doc.font(SERIF).text(m.local, { align: "right" });
  doc.x = left;

  rule(doc, 12, 14);
  ensureSpace(doc, 120);
  doc.font(SERIF_BOLD).fontSize(TEXT_SIZE).text("ANEXOS:", { paragraphGap: 5 });
  doc.font(SERIF);
  for (const anexo of ANEXOS) {
    doc.text(anexo, doc.page.margins.left + 28, doc.y, { paragraphGap: 2 });
  }
  doc.x = left;
}

export class PdfKitOrdemServicoGenerator implements IOrdemServicoDocumentGenerator {
  generate(model: OrdemServicoDocumentModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
        info: { Title: model.numero, Author: "SB Engenharia", Subject: "Ordem de Serviço" },
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      try {
        doc.fontSize(TEXT_SIZE);
        renderHeader(doc, model);
        renderIntro(doc, model);
        renderIdentificacao(doc, model);
        renderPreco(doc, model);
        renderOrcamento(doc, model);
        renderPrazo(doc, model);
        renderCondicoes(doc, model);
        renderFiscais(doc, model);
        renderInicio(doc, model);
        renderAssinaturas(doc, model);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
