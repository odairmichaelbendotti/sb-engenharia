import { ClipboardCheck, ClipboardList, Hotel, MapPin } from "lucide-react";

// Menu do login de empresa contratada: só leitura e só o que é da própria empresa
export const empresaItems = [
  // OS aguardando ciência; com prazo vencido, é a única tela liberada (ver AppLayout)
  { path: "/pendencias", label: "Pendências de ciência", icon: ClipboardCheck },
  { path: "/obras", label: "Obras", icon: Hotel },
  { path: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { path: "/mapa-obras", label: "Mapa de Obras", icon: MapPin },
];

export const EMPRESA_PATHS = empresaItems.map((item) => item.path);
