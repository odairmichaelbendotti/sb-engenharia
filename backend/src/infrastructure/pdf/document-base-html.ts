import { BRASAO_BASE64 } from "./brasao.js";

// Peças comuns aos documentos em PDF (OS e medição)

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderLetterhead(): string {
  return `
<header class="letterhead">
  <img class="brasao" src="data:image/jpeg;base64,${BRASAO_BASE64}" alt="" />
  <p class="org">Ministério da Defesa</p>
  <p class="org">Comando da Aeronáutica</p>
  <p class="org-main">Base Aérea de Florianópolis</p>
  <p class="org-contact">Av. Santos Dumont, s/n – Tapera &nbsp;·&nbsp; Tel. (48) 3229-5000 &nbsp;·&nbsp; Fax (48) 3236-1344 &nbsp;·&nbsp; protocolo.bafl@bafl.aer.mil.br</p>
</header>`;
}

/** Estilo do timbre (brasão, órgãos e endereço centralizados). A OS tem o mesmo bloco no próprio CSS. */
export const LETTERHEAD_STYLES = `
.letterhead, .letterhead p { text-align: center; }
.letterhead { padding-bottom: 3.4mm; border-bottom: 2.4pt double var(--ink); }
.brasao { display: block; height: 19mm; margin: 0 auto 2.6mm; }
.org { font-size: 8.6pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; line-height: 1.45; color: var(--ink); }
.org-main { font-size: 10.5pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; line-height: 1.5; color: var(--ink); }
.org-contact { font-family: Inter, Arial, sans-serif; font-size: 6.9pt; color: var(--muted); margin-top: 1.2mm; }
`;
