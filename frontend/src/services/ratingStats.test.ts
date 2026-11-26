import { buildCsv, buildRatingStats, buildSummaryText, queryStats } from './ratingStats';
import { Movie } from 'types/movie';

const movie = (id: number, title: string, score: number, count: number): Movie => ({
  id,
  title,
  image: `${id}.jpg`,
  score,
  count,
});

const catalog = [
  movie(1, 'Ação Total', 4.5, 2),
  movie(2, 'Bela Vista', 3, 1),
  movie(3, 'Corrida', 0, 0),
  movie(4, 'Drama "Especial"', 5, 1),
  movie(5, 'Épico', 2, 4),
];

describe('buildRatingStats', () => {
  it('calcula os indicadores gerais com a média ponderada pelo número de avaliações', () => {
    const stats = buildRatingStats(catalog);
    expect(stats.totalMovies).toBe(5);
    expect(stats.totalRatings).toBe(8);
    expect(stats.ratedMovies).toBe(4);
    expect(stats.unratedMovies).toBe(1);
    // (4,5×2 + 3×1 + 5×1 + 2×4) / 8 = 25 / 8 = 3,125
    expect(stats.averageScore).toBeCloseTo(3.125);
    expect(stats.averageApproval).toBeCloseTo(62.5);
  });

  it('calcula a aprovação (nota ÷ 5) e a participação no total de cada filme', () => {
    const rows = buildRatingStats(catalog).rows;
    expect(rows.find((r) => r.id === 1)).toMatchObject({ approval: 90, share: 25 });
    expect(rows.find((r) => r.id === 5)).toMatchObject({ approval: 40, share: 50 });
    expect(rows.find((r) => r.id === 3)).toMatchObject({ approval: 0, share: 0, count: 0 });
  });

  it('não gera NaN com catálogo vazio ou sem avaliações', () => {
    expect(buildRatingStats([])).toMatchObject({ totalMovies: 0, totalRatings: 0, averageScore: 0, averageApproval: 0 });
    const stats = buildRatingStats([movie(1, 'A', 0, 0)]);
    expect(stats.rows[0]).toMatchObject({ approval: 0, share: 0 });
    expect(stats.averageScore).toBe(0);
  });
});

describe('queryStats (busca, filtro e ordenação do gráfico)', () => {
  const rows = buildRatingStats(catalog).rows;
  const ids = (list: { id: number }[]) => list.map((r) => r.id);

  it('por padrão mostra só os filmes avaliados, da maior para a menor aprovação', () => {
    expect(ids(queryStats(rows, { search: '', sort: 'approval-desc', includeUnrated: false }))).toEqual([4, 1, 2, 5]);
  });

  it('ordena por mais avaliados, por menor aprovação e por título', () => {
    expect(ids(queryStats(rows, { search: '', sort: 'count-desc', includeUnrated: false }))).toEqual([5, 1, 4, 2]);
    expect(ids(queryStats(rows, { search: '', sort: 'approval-asc', includeUnrated: false }))).toEqual([5, 2, 1, 4]);
    expect(ids(queryStats(rows, { search: '', sort: 'title', includeUnrated: true }))).toEqual([1, 2, 3, 4, 5]);
  });

  it('filmes sem avaliação ficam no fim das ordenações por aprovação', () => {
    expect(ids(queryStats(rows, { search: '', sort: 'approval-asc', includeUnrated: true }))).toEqual([5, 2, 1, 4, 3]);
  });

  it('busca pelo título sem diferenciar maiúsculas e acentos', () => {
    expect(ids(queryStats(rows, { search: 'epico', sort: 'title', includeUnrated: true }))).toEqual([5]);
  });
});

describe('buildSummaryText', () => {
  it('gera o resumo com visão geral, melhores, mais avaliados e menor aprovação', () => {
    const text = buildSummaryText(buildRatingStats(catalog), new Date(2026, 10, 25, 20, 40));
    expect(text).toContain('Resumo de avaliações — GitCine');
    expect(text).toContain('Gerado em 25/11/2026 às 20:40');
    expect(text).toContain('Filmes no catálogo: 5');
    expect(text).toContain('Avaliações registradas: 8');
    expect(text).toContain('Filmes sem avaliação: 1');
    expect(text).toContain('Nota média geral: 3,1 de 5 (62,5% de aprovação)');
    expect(text).toMatch(/Mais bem avaliados\n1\. Drama "Especial" — 5,0 \(100%\) · 1 avaliação\n2\. Ação Total — 4,5 \(90%\) · 2 avaliações/);
    expect(text).toMatch(/Mais avaliados\n1\. Épico — 4 avaliações \(50% do total\)/);
    expect(text).toMatch(/Menor aprovação\n1\. Épico — 2,0 \(40%\)/);
  });

  it('avisa quando nenhum filme foi avaliado', () => {
    const text = buildSummaryText(buildRatingStats([movie(1, 'A', 0, 0)]), new Date(2026, 10, 25, 9, 5));
    expect(text).toContain('Nenhum filme recebeu avaliações ainda.');
    expect(text).not.toContain('Mais bem avaliados');
  });
});

describe('buildCsv (planilha)', () => {
  it('gera CSV para Excel em português: BOM, separador ";" e vírgula decimal', () => {
    const csv = buildCsv(buildRatingStats(catalog));
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(lines[0]).toBe('"Filme";"Nota média";"Aprovação (%)";"Avaliações";"Participação (%)"');
    expect(lines).toContain('"Ação Total";4,5;90;2;25');
    expect(lines).toContain('"Drama ""Especial""";5;100;1;12,5');
    expect(lines).toContain('"Corrida";0;0;0;0');
    expect(lines).toHaveLength(6);
  });
});
