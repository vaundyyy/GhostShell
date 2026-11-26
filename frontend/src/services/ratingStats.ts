import { Movie } from 'types/movie';
import { normalizeText } from 'utils/text';

// Estatísticas do painel do admin, calculadas com o que a API devolve por filme:
// nota média (score, 0 a 5) e quantidade de avaliações (count).

export type MovieStats = {
  id: number;
  title: string;
  image: string;
  score: number;
  count: number;
  approval: number; // nota média ÷ 5, em % (5 estrelas = 100%)
  share: number; // participação no total de avaliações, em %
};

export type RatingStats = {
  totalMovies: number;
  totalRatings: number;
  ratedMovies: number;
  unratedMovies: number;
  averageScore: number; // média geral ponderada pelo número de avaliações
  averageApproval: number;
  rows: MovieStats[];
};

export type StatsSort = 'approval-desc' | 'count-desc' | 'approval-asc' | 'title';

export type StatsQuery = {
  search: string;
  sort: StatsSort;
  includeUnrated: boolean;
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const percent = (part: number, whole: number) => (whole > 0 ? round1((part / whole) * 100) : 0);

export function buildRatingStats(movies: Movie[]): RatingStats {
  const totalRatings = movies.reduce((sum, m) => sum + (m.count || 0), 0);
  const weightedSum = movies.reduce((sum, m) => sum + (m.count ? m.score * m.count : 0), 0);
  const averageScore = totalRatings > 0 ? weightedSum / totalRatings : 0;

  const rows = movies.map((m) => {
    const count = m.count || 0;
    const score = count > 0 ? m.score : 0;
    return {
      id: m.id,
      title: m.title,
      image: m.image,
      score,
      count,
      approval: percent(score, 5),
      share: percent(count, totalRatings),
    };
  });
  const ratedMovies = rows.filter((r) => r.count > 0).length;

  return {
    totalMovies: movies.length,
    totalRatings,
    ratedMovies,
    unratedMovies: movies.length - ratedMovies,
    averageScore,
    averageApproval: percent(averageScore, 5),
    rows,
  };
}

const byTitle = (a: MovieStats, b: MovieStats) => a.title.localeCompare(b.title, 'pt-BR');
const ratedFirst = (a: MovieStats, b: MovieStats) => Number(b.count > 0) - Number(a.count > 0);

const SORTERS: Record<StatsSort, (a: MovieStats, b: MovieStats) => number> = {
  'approval-desc': (a, b) => ratedFirst(a, b) || b.approval - a.approval || b.count - a.count || byTitle(a, b),
  'approval-asc': (a, b) => ratedFirst(a, b) || a.approval - b.approval || b.count - a.count || byTitle(a, b),
  'count-desc': (a, b) => b.count - a.count || b.approval - a.approval || byTitle(a, b),
  title: byTitle,
};

export function queryStats(rows: MovieStats[], { search, sort, includeUnrated }: StatsQuery): MovieStats[] {
  const term = normalizeText(search);
  return rows
    .filter((r) => includeUnrated || r.count > 0)
    .filter((r) => !term || normalizeText(r.title).includes(term))
    .sort(SORTERS[sort]);
}

// Formatação em português (vírgula decimal), compartilhada pela tela e pelo resumo.
export const formatScore = (score: number) =>
  score.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatPercent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const formatRatings = (count: number) => `${count} ${count === 1 ? 'avaliação' : 'avaliações'}`;

const TOP_LIMIT = 3;

export function buildSummaryText(stats: RatingStats, generatedAt: Date): string {
  const date = generatedAt.toLocaleDateString('pt-BR');
  const time = generatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const rated = stats.rows.filter((r) => r.count > 0);

  const lines = [
    'Resumo de avaliações — GitCine',
    `Gerado em ${date} às ${time}`,
    '',
    'Visão geral',
    `- Filmes no catálogo: ${stats.totalMovies}`,
    `- Avaliações registradas: ${stats.totalRatings}`,
    `- Filmes avaliados: ${stats.ratedMovies}`,
    `- Filmes sem avaliação: ${stats.unratedMovies}`,
  ];

  if (rated.length === 0) {
    return [...lines, '', 'Nenhum filme recebeu avaliações ainda.'].join('\n');
  }

  lines.push(
    `- Nota média geral: ${formatScore(stats.averageScore)} de 5 (${formatPercent(stats.averageApproval)} de aprovação)`
  );

  const section = (title: string, list: MovieStats[], describe: (r: MovieStats) => string) => [
    '',
    title,
    ...list.slice(0, TOP_LIMIT).map((r, i) => `${i + 1}. ${r.title} — ${describe(r)}`),
  ];
  const withScore = (r: MovieStats) => `${formatScore(r.score)} (${formatPercent(r.approval)}) · ${formatRatings(r.count)}`;

  lines.push(...section('Mais bem avaliados', [...rated].sort(SORTERS['approval-desc']), withScore));
  lines.push(
    ...section('Mais avaliados', [...rated].sort(SORTERS['count-desc']), (r) => `${formatRatings(r.count)} (${formatPercent(r.share)} do total)`)
  );
  if (rated.length > TOP_LIMIT) {
    lines.push(...section('Menor aprovação', [...rated].sort(SORTERS['approval-asc']), withScore));
  }
  return lines.join('\n');
}

// Planilha para Excel em português: BOM (acentos), separador ";" e vírgula decimal.
export function buildCsv(stats: RatingStats): string {
  const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1, useGrouping: false });
  const text = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ['Filme', 'Nota média', 'Aprovação (%)', 'Avaliações', 'Participação (%)'].map(text).join(';');
  const rows = [...stats.rows]
    .sort(SORTERS['approval-desc'])
    .map((r) => [text(r.title), number(r.score), number(r.approval), String(r.count), number(r.share)].join(';'));
  return '\uFEFF' + [header, ...rows].join('\r\n');
}
