import { createContext, useContext } from "react";

type FieldContextValue = { id: string; invalid: boolean };

export const FieldContext = createContext<FieldContextValue | null>(null);

// Input/Select/Textarea dentro de um Field herdam o id (para o rótulo) e o estado de erro
export function useFieldContext() {
  return useContext(FieldContext);
}
