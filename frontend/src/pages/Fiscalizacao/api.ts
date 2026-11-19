import { defaultFetch } from "../../services/api";

export async function fiscalizacaoRequest(path: string, body?: Record<string, unknown>, method: "POST" | "PUT" = "POST") {
  const response = await defaultFetch(`/fiscalizacao${path}`, {
    credentials: "include", ...(body ? { method, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Não foi possível carregar a fiscalização.");
  return data;
}
