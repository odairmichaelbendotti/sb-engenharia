import { defaultFetch } from "../../services/api";

export async function fiscalizacaoRequest(path: string, body?: Record<string, unknown>, method: "POST" | "PUT" = "POST") {
  const response = await defaultFetch(`/fiscalizacao${path}`, {
    credentials: "include", ...(body ? { method, body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    if (response.status === 404) {
      throw new Error("A fiscalização ainda não está disponível na API. É necessário atualizar e reiniciar o backend no servidor (HTTP 404).");
    }
    throw new Error(`O servidor retornou uma resposta inválida ao acessar a fiscalização (HTTP ${response.status}). Tente novamente após verificar a API.`);
  }
  if (!data || typeof data !== "object") throw new Error("A resposta da fiscalização está incompleta. Verifique a API e tente novamente.");
  if (!response.ok) throw new Error(data.message || "Não foi possível carregar a fiscalização.");
  return data;
}
