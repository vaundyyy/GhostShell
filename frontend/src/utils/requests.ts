export const DEFAULT_BACKEND_URL = "http://localhost:8080";

// Remove barras finais para evitar URLs como "https://host//api/movies".
export function normalizeBaseUrl(url: string | undefined): string {
  const value = (url ?? "").trim();
  return value ? value.replace(/\/+$/, "") : DEFAULT_BACKEND_URL;
}

// Definido em frontend/.env (REACT_APP_BACKEND_URL). Sem a variável, usa o backend local.
export const BASE_URL = normalizeBaseUrl(process.env.REACT_APP_BACKEND_URL);
