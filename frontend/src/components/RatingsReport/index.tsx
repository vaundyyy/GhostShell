import { useEffect, useMemo, useState } from 'react';
import MoviePoster from 'components/MoviePoster';
import { fetchAllMovies } from 'services/api';
import {
  buildCsv,
  buildRatingStats,
  buildSummaryText,
  formatPercent,
  formatRatings,
  formatScore,
  queryStats,
  StatsSort,
} from 'services/ratingStats';
import { Movie } from 'types/movie';
import './styles.css';

type Props = {
  refreshKey?: number; // muda quando o admin cadastra um filme, para recarregar os dados
};

const SORT_OPTIONS: { value: StatsSort; label: string }[] = [
  { value: 'approval-desc', label: 'Maior aprovação' },
  { value: 'count-desc', label: 'Mais avaliados' },
  { value: 'approval-asc', label: 'Menor aprovação' },
  { value: 'title', label: 'Título (A–Z)' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const fileStamp = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function downloadFile(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Painel do admin: indicadores gerais, gráfico de aprovação (%) por filme e resumo para copiar ou baixar.
// Usa apenas o catálogo público (GET /api/movies): nota média e quantidade de avaliações de cada filme.
function RatingsReport({ refreshKey = 0 }: Props) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<StatsSort>('approval-desc');
  const [includeUnrated, setIncludeUnrated] = useState(false);
  const [summary, setSummary] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setSummary('');

    fetchAllMovies()
      .then((data) => {
        if (active) setMovies(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, reloadKey]);

  const stats = useMemo(() => buildRatingStats(movies), [movies]);
  const rows = useMemo(
    () => queryStats(stats.rows, { search, sort, includeUnrated }),
    [stats, search, sort, includeUnrated],
  );

  const handleGenerate = () => {
    setSummary(buildSummaryText(stats, new Date()));
    setCopyStatus('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Resumo copiado!');
    } catch {
      setCopyStatus('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  };

  const baseName = `gitcine-resumo-avaliacoes-${fileStamp(new Date())}`;

  return (
    <section className="gitcine-report" aria-labelledby="report-title">
      <div className="gitcine-report-header">
        <div>
          <h3 id="report-title">Desempenho dos filmes</h3>
          <p>Aprovação calculada pela nota média de cada filme (5 estrelas = 100%).</p>
        </div>
        <button type="button" className="gitcine-report-primary" onClick={handleGenerate} disabled={loading || failed}>
          Gerar resumo
        </button>
      </div>

      {loading ? (
        <div className="gitcine-state-box">
          <span>Carregando avaliações...</span>
        </div>
      ) : failed ? (
        <div className="gitcine-state-box">
          <span>Não foi possível carregar as avaliações.</span>
          <button type="button" className="gitcine-report-secondary" onClick={() => setReloadKey((k) => k + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <ul className="gitcine-report-kpis" aria-label="Indicadores">
            <li>
              <span>Filmes no catálogo</span>
              <strong>{stats.totalMovies}</strong>
            </li>
            <li>
              <span>Avaliações registradas</span>
              <strong>{stats.totalRatings}</strong>
            </li>
            <li>
              <span>Nota média geral</span>
              <strong>{stats.totalRatings > 0 ? `${formatScore(stats.averageScore)} ★` : '—'}</strong>
              {stats.totalRatings > 0 && <small>{formatPercent(stats.averageApproval)} de aprovação</small>}
            </li>
            <li>
              <span>Filmes sem avaliação</span>
              <strong>{stats.unratedMovies}</strong>
            </li>
          </ul>

          {summary && (
            <section className="gitcine-report-summary" aria-label="Resumo das avaliações">
              <pre>{summary}</pre>
              <div className="gitcine-report-summary-actions">
                <button type="button" className="gitcine-report-secondary" onClick={handleCopy}>
                  Copiar resumo
                </button>
                <button
                  type="button"
                  className="gitcine-report-secondary"
                  onClick={() => downloadFile(`${baseName}.txt`, summary, 'text/plain;charset=utf-8')}
                >
                  Baixar resumo (.txt)
                </button>
                <button
                  type="button"
                  className="gitcine-report-secondary"
                  onClick={() => downloadFile(`${baseName}.csv`, buildCsv(stats), 'text/csv;charset=utf-8')}
                >
                  Baixar planilha (.csv)
                </button>
                {copyStatus && <span role="status">{copyStatus}</span>}
              </div>
            </section>
          )}

          <div className="gitcine-report-controls">
            <div className="gitcine-report-field gitcine-report-search">
              <label htmlFor="report-search">Buscar filme</label>
              <input
                id="report-search"
                type="search"
                placeholder="Título do filme"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="gitcine-report-field">
              <label htmlFor="report-sort">Ordenar por</label>
              <select id="report-sort" value={sort} onChange={(e) => setSort(e.target.value as StatsSort)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="gitcine-report-check">
              <input type="checkbox" checked={includeUnrated} onChange={(e) => setIncludeUnrated(e.target.checked)} />
              Incluir filmes sem avaliação
            </label>
          </div>

          {stats.ratedMovies === 0 && !includeUnrated ? (
            <div className="gitcine-state-box">
              <span>Nenhum filme recebeu avaliações ainda.</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="gitcine-state-box">
              <span>Nenhum filme encontrado com esses filtros.</span>
            </div>
          ) : (
            <>
              <p className="gitcine-report-count" aria-live="polite">
                {`Mostrando ${rows.length} de ${stats.totalMovies} ${stats.totalMovies === 1 ? 'filme' : 'filmes'}`}
              </p>
              <ol className="gitcine-report-chart" aria-label="Aprovação por filme">
                {rows.map((row) => (
                  <li key={row.id} className="gitcine-report-row">
                    <MoviePoster className="gitcine-report-thumb" src={row.image} title={row.title} />
                    <div className="gitcine-report-info">
                      <div className="gitcine-report-line">
                        <h4>{row.title}</h4>
                        <strong>{row.count > 0 ? formatPercent(row.approval) : '—'}</strong>
                      </div>
                      <div className="gitcine-report-bar" aria-hidden="true">
                        <span style={{ width: `${row.approval}%` }} />
                      </div>
                      <span className="gitcine-report-meta">
                        {row.count > 0
                          ? `${formatScore(row.score)} ★ · ${formatRatings(row.count)} · ${formatPercent(row.share)} do total`
                          : 'Sem avaliações'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default RatingsReport;
