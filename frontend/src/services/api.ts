type RequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  credentials?: "include" | "same-origin" | "omit";
};

// Em produção a API passa pelo rewrite /api do vercel.json (mesmo domínio do
// front); chamar o backend em outro domínio torna o cookie `auth` de terceiro,
// e o navegador o descarta — a sessão some no F5.
const API_BASE = import.meta.env.PROD ? "/api" : import.meta.env.VITE_HOST;

// Código do 403 que o backend devolve quando a empresa precisa dar ciência de uma OS vencida
const CIENCIA_PENDENTE = "CIENCIA_PENDENTE";
export const CIENCIA_PENDENTE_EVENT = "sb:ciencia-pendente";

export async function defaultFetch(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Empresa com ciência de OS vencida: o AppLayout troca a tela pela de pendências
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      if (body?.code === CIENCIA_PENDENTE) window.dispatchEvent(new Event(CIENCIA_PENDENTE_EVENT));
    }

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
