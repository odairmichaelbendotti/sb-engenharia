import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, ChevronDown, Check } from "lucide-react";
import { useObras } from "../../store/obras";
import { useTenants } from "../../store/tenants";
import { useContratos } from "../../store/contratos";
import { usePermission } from "../../hooks/usePermission";
import type { Obra } from "../../../types/obra";
import ObraDetailPanel from "./ObraDetailPanel";

const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];
const BRAZIL_ZOOM = 4;

type ObraComCoordenadas = Obra & { latitude: number; longitude: number };

function hasCoordinates(obra: Obra): obra is ObraComCoordenadas {
  return typeof obra.latitude === "number" && typeof obra.longitude === "number";
}

const TENANT_ZOOM = 15;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const obraIconCache = new Map<string, L.DivIcon>();

function getObraIcon(color: string, identificacaoPatrimonial: string) {
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

type ContratoOpcao = { id: string; identificador: string; descricaoCurta: string; cor: string };

function ContratoLayerControl({
  contratos,
  selectedIds,
  onToggle,
  onClear,
}: {
  contratos: ContratoOpcao[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-surface/95 backdrop-blur-sm border border-border rounded-full pl-2.5 pr-3 py-1.5 text-xs font-medium text-text-primary shadow-sm hover:border-primary-300 transition-colors cursor-pointer"
      >
        <Layers size={14} className="text-primary-500" />
        Contratos
        {selectedIds.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary-500 text-white text-[10px] font-semibold">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown size={12} className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="bg-surface/95 backdrop-blur-sm border border-border rounded-lg shadow-md w-60 max-h-72 overflow-y-auto">
          {contratos.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-text-muted">Nenhum contrato cadastrado</p>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border sticky top-0 bg-surface">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  {selectedIds.length === 0
                    ? "Todos os contratos"
                    : `${selectedIds.length} selecionado${selectedIds.length !== 1 ? "s" : ""}`}
                </span>
                {selectedIds.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] text-primary-500 hover:text-primary-600 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <ul className="py-1">
                {contratos.map((c) => {
                  const active = selectedIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => onToggle(c.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                          active ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:bg-surface-muted"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                        <span className="flex-1 truncate">{c.descricaoCurta}</span>
                        {active && <Check size={12} className="text-primary-500 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MapViewController({
  obras,
  tenantCenter,
}: {
  obras: ObraComCoordenadas[];
  tenantCenter: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (obras.length > 0) {
      map.fitBounds(
        obras.map((o) => [o.latitude, o.longitude]),
        { padding: [40, 40], maxZoom: 14 },
      );
      return;
    }
    if (tenantCenter) {
      map.setView(tenantCenter, TENANT_ZOOM);
    }
  }, [obras, tenantCenter, map]);

  return null;
}

const MapaObras = () => {
  const { data, fetchObras } = useObras();
  const { myTenant, fetchMyTenant } = useTenants();
  const { data: contratosData, fetchContratos } = useContratos();
  const { canViewAdministrativo } = usePermission();
  const [loading, setLoading] = useState(!data);
  const [selectedContratoIds, setSelectedContratoIds] = useState<string[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  useEffect(() => {
    if (!data) fetchObras().finally(() => setLoading(false));
    if (!myTenant) fetchMyTenant();
    // Empresas (role EMPRESA) não têm acesso ao domínio administrativo — pular
    // essa chamada evita um 403 desnecessário e o filtro por contrato some
    // pra elas mesmo (só têm obras do próprio contrato).
    if (!contratosData && canViewAdministrativo) fetchContratos();
  }, [data, fetchObras, myTenant, fetchMyTenant, contratosData, fetchContratos, canViewAdministrativo]);

  const contratos = useMemo(
    () =>
      (contratosData?.contratos ?? []).map((c) => ({
        id: c.id,
        identificador: c.identificador,
        descricaoCurta: c.descricaoCurta,
        cor: c.cor,
      })),
    [contratosData],
  );

  function toggleContrato(id: string) {
    setSelectedContratoIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  const obrasComCoordenadas = useMemo(() => (data?.obras ?? []).filter(hasCoordinates), [data]);

  const obrasFiltradas =
    selectedContratoIds.length > 0
      ? obrasComCoordenadas.filter((obra) => obra.ordemServico?.empenho.contrato && selectedContratoIds.includes(obra.ordemServico.empenho.contrato.id))
      : obrasComCoordenadas;

  const tenantLatitude = myTenant?.latitude;
  const tenantLongitude = myTenant?.longitude;
  const tenantCenter: [number, number] | null = useMemo(
    () => (typeof tenantLatitude === "number" && typeof tenantLongitude === "number" ? [tenantLatitude, tenantLongitude] : null),
    [tenantLatitude, tenantLongitude],
  );

  return (
    <div className="h-full w-full relative">
      {canViewAdministrativo && (
        <ContratoLayerControl
          contratos={contratos}
          selectedIds={selectedContratoIds}
          onToggle={toggleContrato}
          onClear={() => setSelectedContratoIds([])}
        />
      )}
      <MapContainer center={BRAZIL_CENTER} zoom={BRAZIL_ZOOM} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* fitBounds usa o conjunto completo de obras (não o filtrado), pra marcar/
            desmarcar um contrato no filtro não mexer no zoom/posição do mapa —
            só o filtro em si (quais marcadores aparecem) responde à seleção. */}
        <MapViewController obras={obrasComCoordenadas} tenantCenter={tenantCenter} />
        {obrasFiltradas.map((obra) => (
          <Marker
            key={obra.id}
            position={[obra.latitude, obra.longitude]}
            icon={getObraIcon(obra.ordemServico?.empenho.contrato.cor ?? "#4478b6", obra.identificacaoPatrimonial)}
            eventHandlers={{ click: () => setSelectedObra(obra) }}
          />
        ))}
      </MapContainer>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 pointer-events-none">
          <p className="text-text-secondary text-sm">Carregando obras...</p>
        </div>
      )}
      <ObraDetailPanel key={selectedObra?.id ?? "none"} obra={selectedObra} onClose={() => setSelectedObra(null)} />
    </div>
  );
};

export default MapaObras;
