import { ClipboardList, Hotel, MapPin } from "lucide-react";

// Menu do login de empresa contratada: só leitura e só o que é da própria empresa
export const empresaItems = [
  { path: "/obras", label: "Obras", icon: Hotel },
  { path: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { path: "/mapa-obras", label: "Mapa de Obras", icon: MapPin },
];

export const EMPRESA_PATHS = empresaItems.map((item) => item.path);
