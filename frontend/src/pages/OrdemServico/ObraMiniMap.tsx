import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { getObraIcon } from "../MapaObras/obra-icon";

const MINI_MAP_ZOOM = 16;

interface ObraMiniMapProps {
  latitude: number;
  longitude: number;
  color: string;
  label: string;
}

// Mapa de leitura: sem arrastar nem zoom pela roda, pra não brigar com a rolagem do modal
export default function ObraMiniMap({ latitude, longitude, color, label }: ObraMiniMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={MINI_MAP_ZOOM}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      className="h-52 w-full rounded-lg border border-border isolate"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={getObraIcon(color, label)} />
    </MapContainer>
  );
}
