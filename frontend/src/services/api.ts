type RequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: { "Content-Type": "application/json" };
  body?: string;
  credentials?: "include" | "same-origin" | "omit";
};

export async function defaultFetch(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}${endpoint}`,
      options,
    );

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
