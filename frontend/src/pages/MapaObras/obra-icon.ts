import L from "leaflet";

// Marcador de obra (etiqueta com a identificação patrimonial na cor do contrato),
// compartilhado entre o Mapa de Obras e o mini-mapa da Ordem de Serviço
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const obraIconCache = new Map<string, L.DivIcon>();

export function getObraIcon(color: string, identificacaoPatrimonial: string) {
  const label = escapeHtml(identificacaoPatrimonial);
  const cacheKey = `${color}:${label}`;
  const cached = obraIconCache.get(cacheKey);
  if (cached) return cached;

  const width = Math.max(30, 14 + label.length * 7);
  const height = 24;

  const icon = L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="
          background:${color};
          color:#fff;
          padding:2px 7px;
          border-radius:7px;
          font-size:11px;
          font-weight:700;
          font-family:helvetica, sans-serif;
          white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,.35);
          border:2px solid #fff;
        ">${label}</div>
        <div style="
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${color};
          margin-top:-1px;
        "></div>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });

  obraIconCache.set(cacheKey, icon);
  return icon;
}
