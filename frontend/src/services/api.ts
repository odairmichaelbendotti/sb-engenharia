type RequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  credentials?: "include" | "same-origin" | "omit";
};

export async function defaultFetch(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${import.meta.env.VITE_HOST}${endpoint}`, {
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
