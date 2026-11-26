import axios from 'axios';
import { http } from './http';
import { AuthResponse, LoginRequest, RegisterRequest } from 'types/auth';
import {
  CreateMovieRequest,
  Movie,
  MovieListResponse,
  MoviePage,
  MovieProposalRequest,
  RatingResponse,
} from 'types/movie';

// Camada de acesso ao backend GitCine (endpoints documentados na collection Bruno).

// Paginação: o backend aceita size entre 1 e 100 (MovieController: @Min(1) @Max(100)).
export const PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Faça login novamente.';

async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await http.get<T>(url, { params });
  return data;
}

async function postData<T>(url: string, body: unknown): Promise<T> {
  const { data } = await http.post<T>(url, body);
  return data;
}

// O backend compara e-mails em minúsculas e sem espaços; normalizamos em um único lugar.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Converte o MovieListResponse do backend para o MoviePage já usado pelos componentes.
export function toMoviePage(data: MovieListResponse): MoviePage {
  return {
    content: data.content,
    number: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    numberOfElements: data.content.length,
    first: data.page <= 0,
    last: data.totalPages === 0 || data.page >= data.totalPages - 1,
    empty: data.content.length === 0,
  };
}

// Os objetos enviados são montados campo a campo: o backend rejeita propriedades extras (400).

// GET /api/movies?page=&size=  (público; page começa em 0)
export async function fetchMovies(page: number, size: number = PAGE_SIZE): Promise<MoviePage> {
  return toMoviePage(await getData<MovieListResponse>('/api/movies', { page, size }));
}

// Catálogo completo: busca todas as páginas com o tamanho máximo (limite de segurança: 20 páginas = 2.000 filmes).
const MAX_CATALOG_PAGES = 20;

export async function fetchAllMovies(): Promise<Movie[]> {
  const first = await fetchMovies(0, MAX_PAGE_SIZE);
  const pageCount = Math.min(first.totalPages, MAX_CATALOG_PAGES);
  const others = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => fetchMovies(i + 1, MAX_PAGE_SIZE))
  );
  return [first, ...others].reduce<Movie[]>((all, page) => all.concat(page.content), []);
}

// GET /api/movies/{id}  (público)
export function fetchMovieById(id: string | number): Promise<Movie> {
  return getData<Movie>(`/api/movies/${id}`);
}

// POST /api/auth/login  (público)
export function login({ email, password }: LoginRequest): Promise<AuthResponse> {
  return postData<AuthResponse>('/api/auth/login', { email: normalizeEmail(email), password });
}

// POST /api/auth/register  (público; o backend sempre cria ROLE_USER)
export function register({ name, email, password }: RegisterRequest): Promise<AuthResponse> {
  return postData<AuthResponse>('/api/auth/register', { name: name.trim(), email: normalizeEmail(email), password });
}

// POST /api/ratings  (USER/ADMIN; o usuário é identificado pelo JWT)
export function saveRating(movieId: number, value: number): Promise<RatingResponse> {
  return postData<RatingResponse>('/api/ratings', { movieId, value });
}

// POST /api/admin/movies  (somente ADMIN)
export function createMovie({ title, image }: CreateMovieRequest): Promise<Movie> {
  return postData<Movie>('/api/admin/movies', { title: title.trim(), image: image.trim() });
}

// POST /api/movie-requests  (USER/ADMIN; responde 202 sem corpo)
export async function sendMovieProposal({ title, message }: MovieProposalRequest): Promise<void> {
  await postData<unknown>('/api/movie-requests', { title: title.trim(), message });
}

// 401 em uma requisição que levava o JWT = token expirado ou inválido.
// (Um 401 do login, que não leva token, significa apenas credenciais erradas.)
export function isSessionExpired(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    Boolean(error.config?.headers?.Authorization)
  );
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  401: 'Você precisa estar logado para realizar esta ação.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'A operação conflita com dados já existentes.',
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
};

// Traduz erros HTTP (ApiError do backend) em mensagens para o usuário.
// Prioridade: mensagem específica da tela > mensagem do backend (400/422) > mensagem padrão > fallback.
export function getErrorMessage(
  error: unknown,
  fallback: string,
  overrides: Partial<Record<number, string>> = {}
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Ele pode estar iniciando (plano gratuito do Render); aguarde alguns segundos e tente novamente.';
  }

  const { status, data } = error.response;
  const backendMessage = (data as { message?: string } | undefined)?.message;

  const override = overrides[status];
  if (override) {
    return override;
  }
  if ((status === 400 || status === 422) && backendMessage) {
    return backendMessage;
  }
  return DEFAULT_STATUS_MESSAGES[status] ?? backendMessage ?? fallback;
}
