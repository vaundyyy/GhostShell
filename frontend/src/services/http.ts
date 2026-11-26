import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from 'utils/requests';
import { getToken } from 'utils/auth';

// O plano gratuito do Render "hiberna": o primeiro acesso pode levar ~1 min.
const REQUEST_TIMEOUT_MS = 90000;

// Rotas de autenticação são públicas: não enviamos um token antigo para elas.
const PUBLIC_AUTH_PREFIX = '/api/auth/';

// Enquanto o Render acorda, as requisições falham sem resposta ou com 502/503/504.
// Leituras (GET) são repetidas com espera crescente (~1,5 min no total); envios (POST) nunca.
export const retryPolicy = { delaysMs: [2000, 4000, 8000, 15000, 30000, 30000] };
const RETRYABLE_STATUS = [502, 503, 504];

type RetryableConfig = InternalAxiosRequestConfig & { retryAttempt?: number };

// Cliente HTTP único do frontend (baseURL vem de REACT_APP_BACKEND_URL, ver frontend/.env).
export const http = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Anexa o JWT (Authorization: Bearer <token>) quando o usuário está logado.
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.url?.startsWith(PUBLIC_AUTH_PREFIX)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isRetryable(error: unknown): error is AxiosError & { config: RetryableConfig } {
  if (!axios.isAxiosError(error) || !error.config || error.config.method?.toLowerCase() !== 'get') {
    return false;
  }
  if (error.response) {
    return RETRYABLE_STATUS.includes(error.response.status);
  }
  // Sem resposta: repete erro de rede; não repete tempo esgotado (já esperou 90 s) nem cancelamento.
  return error.code === AxiosError.ERR_NETWORK;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

http.interceptors.response.use(undefined, async (error: unknown) => {
  if (!isRetryable(error)) {
    throw error;
  }
  const attempt = error.config.retryAttempt ?? 0;
  const delay = retryPolicy.delaysMs[attempt];
  if (delay === undefined) {
    throw error;
  }
  error.config.retryAttempt = attempt + 1;
  await wait(delay);
  return http.request(error.config);
});
