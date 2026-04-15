import type { EmpenhoList } from "./empenho";

export type ListEmpenhos = {
  empenhos: EmpenhoList[];
  totalEmpenhos: number;
  totalEmpenhosAmount: number;
  activeEmpenhos: number;
  activeEmpenhosAmount: number;
  completedEmpenhos: number;
  completedEmpenhosAmount: number;
};
