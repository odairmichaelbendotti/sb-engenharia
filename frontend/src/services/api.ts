type RequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  credentials?: "include" | "same-origin" | "omit";
};

// Em produção a API passa pelo rewrite /api do vercel.json (mesmo domínio do
// front); chamar o backend em outro domínio torna o cookie `auth` de terceiro,
// e o navegador o descarta — a sessão some no F5.
const API_BASE = import.meta.env.PROD ? "/api" : import.meta.env.VITE_HOST;

export async function defaultFetch(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
