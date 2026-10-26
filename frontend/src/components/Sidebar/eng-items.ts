import { Hotel, MapPin, Ruler } from "lucide-react";

export const engItems = [
  { path: "/obras", label: "Obras", icon: Hotel },
  // Orçamento e medições das OS em tela cheia (inclui as subtelas /medicoes/:osId/...)
  { path: "/medicoes", label: "Medições", icon: Ruler },
  { path: "/mapa-obras", label: "Mapa de Obras", icon: MapPin },
];
