import { Movie } from 'types/movie';
import { normalizeText } from 'utils/text';

// Histórico das avaliações feitas NESTE navegador, separado por usuário (e-mail).
// O backend não possui endpoint para listar as avaliações do usuário nem guarda a data da
// avaliação; por isso o perfil usa este histórico local, gravado após cada POST /api/ratings bem-sucedido.

export type RatedMovie = {
  movieId: number;
  title: string;
  image: string;
  value: number;
  ratedAt: string; // ISO 8601
};

export type RatingSort = 'recent' | 'rating-desc' | 'rating-asc' | 'title';

export type RatingQuery = {
  search: string;
  rating: number | null; // null = todas as notas
  sort: RatingSort;
};

const KEY_PREFIX = '@GitCine:ratings:';
const MAX_ENTRIES = 200;

const keyFor = (email: string) => `${KEY_PREFIX}${email.trim().toLowerCase()}`;

function isRatedMovie(item: unknown): item is RatedMovie {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  const entry = item as Record<string, unknown>;
  return (
    Number.isInteger(entry.movieId) &&
    typeof entry.title === 'string' &&
    typeof entry.image === 'string' &&
    typeof entry.value === 'number' &&
    Number.isFinite(entry.value) &&
    typeof entry.ratedAt === 'string' &&
    !Number.isNaN(Date.parse(entry.ratedAt))
  );
}

const byMostRecent = (a: RatedMovie, b: RatedMovie) => Date.parse(b.ratedAt) - Date.parse(a.ratedAt);

// Lê o histórico do usuário (mais recente primeiro). Dados corrompidos são ignorados.
export function getRatingHistory(email: string): RatedMovie[] {
  if (!email.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(keyFor(email)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRatedMovie).sort(byMostRecent) : [];
  } catch {
    return [];
  }
}

// Registra (ou atualiza) a avaliação de um filme. Falhas de armazenamento não interrompem o fluxo:
// a nota já foi salva no backend; o histórico local é apenas um complemento.
export function recordRating(
  email: string,
  entry: Omit<RatedMovie, 'ratedAt'>,
  ratedAt: Date = new Date()
): void {
  if (!email.trim()) {
    return;
  }
  const updated: RatedMovie = { ...entry, ratedAt: ratedAt.toISOString() };
  const others = getRatingHistory(email).filter((item) => item.movieId !== entry.movieId);
  try {
    localStorage.setItem(keyFor(email), JSON.stringify([updated, ...others].slice(0, MAX_ENTRIES)));
  } catch {
    // armazenamento cheio ou bloqueado (ex.: navegação privada): ignorado de propósito
  }
}

const SORTERS: Record<RatingSort, (a: RatedMovie, b: RatedMovie) => number> = {
  recent: byMostRecent,
  'rating-desc': (a, b) => b.value - a.value || byMostRecent(a, b),
  'rating-asc': (a, b) => a.value - b.value || byMostRecent(a, b),
  title: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
};

// Busca (sem diferenciar maiúsculas/acentos), filtro por nota (arredondada) e ordenação.
export function queryRatings(list: RatedMovie[], { search, rating, sort }: RatingQuery): RatedMovie[] {
  const term = normalizeText(search);
  return list
    .filter((item) => !term || normalizeText(item.title).includes(term))
    .filter((item) => rating === null || Math.round(item.value) === rating)
    .sort(SORTERS[sort]);
}

// Usa o título e a foto ATUAIS do catálogo (os mesmos exibidos na listagem) para cada filme avaliado.
// Os dados salvos na hora da avaliação ficam como reserva (catálogo indisponível ou filme sem foto).
export function withCatalogDetails(
  list: RatedMovie[],
  catalog: Pick<Movie, 'id' | 'title' | 'image'>[]
): RatedMovie[] {
  if (catalog.length === 0) {
    return list;
  }
  const byId = new Map(catalog.map((movie) => [movie.id, movie]));
  return list.map((item) => {
    const movie = byId.get(item.movieId);
    return movie ? { ...item, title: movie.title || item.title, image: movie.image || item.image } : item;
  });
}
