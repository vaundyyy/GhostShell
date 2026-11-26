import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import MovieStars from 'components/MovieStars';
import MoviePoster from 'components/MoviePoster';
import { fetchAllMovies } from 'services/api';
import { getRatingHistory, queryRatings, RatedMovie, RatingSort, withCatalogDetails } from 'services/ratingHistory';
import { Movie, RateMovieState } from 'types/movie';
import './styles.css';

const RECENT_LIMIT = 6;
const RATING_OPTIONS = [5, 4, 3, 2, 1];
const SORT_OPTIONS: { value: RatingSort; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'rating-desc', label: 'Maior nota' },
  { value: 'rating-asc', label: 'Menor nota' },
  { value: 'title', label: 'Título (A–Z)' },
];

const formatRating = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

type RateAgainLinkProps = {
  item: RatedMovie;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
};

// Leva para a tela de avaliação com a nota atual pré-selecionada e pede para voltar ao perfil depois de salvar.
function RateAgainLink({ item, className, ariaLabel, children }: RateAgainLinkProps) {
  const state: RateMovieState = {
    movie: { title: item.title, image: item.image },
    currentRating: item.value,
    returnTo: '/profile',
  };
  return (
    <Link
      to={`/movies/${item.movieId}/rate`}
      state={state}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { isAdmin, logout, userEmail } = useAuth();

  // Lido a cada montagem: ao voltar da tela de avaliação o perfil já mostra a nota atualizada.
  const history = useMemo(() => getRatingHistory(userEmail), [userEmail]);
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sort, setSort] = useState<RatingSort>('recent');

  // Busca no catálogo completo (GET /api/movies) a foto e o título atuais de cada filme avaliado.
  // Enquanto isso (ou se o servidor não responder) a tela usa os dados salvos na avaliação.
  useEffect(() => {
    if (history.length === 0) {
      return;
    }
    let active = true;
    fetchAllMovies()
      .then((movies) => {
        if (active) setCatalog(movies);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [history]);

  const ratings = useMemo(() => withCatalogDetails(history, catalog), [history, catalog]);
  const recent = ratings.slice(0, RECENT_LIMIT);
  const filtered = useMemo(
    () => queryRatings(ratings, { search, rating: ratingFilter ? Number(ratingFilter) : null, sort }),
    [ratings, search, ratingFilter, sort]
  );

  // Admin não possui tela de perfil de avaliações (sempre após os Hooks)
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearFilters = () => {
    setSearch('');
    setRatingFilter('');
    setSort('recent');
  };

  return (
    <main className="gitcine-profile-page">
      <div className="container">
        <div className="gitcine-profile-header-card">
          <div className="gitcine-profile-avatar">
            <span>GC</span>
          </div>
          <div className="gitcine-profile-info">
            <h2>Minha Conta</h2>
            <p>Gerencie suas atividades e histórico de avaliações no GitCine.</p>
            {userEmail && <p className="gitcine-profile-email">{userEmail}</p>}
          </div>
          <button type="button" onClick={handleLogout} className="gitcine-btn-logout">
            Sair da Conta
          </button>
        </div>

        {ratings.length === 0 ? (
          <section className="gitcine-evaluations-section">
            <h3>Minhas Avaliações</h3>
            <div className="gitcine-state-box">
              <p>Você ainda não avaliou nenhum filme.</p>
              <Link to="/" className="gitcine-explore-link">
                Explorar catálogo de filmes
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="gitcine-evaluations-section" aria-labelledby="recent-ratings-title">
              <h3 id="recent-ratings-title">Avaliados recentemente</h3>
              <div className="gitcine-recent-strip">
                {recent.map((item) => (
                  <RateAgainLink
                    key={item.movieId}
                    item={item}
                    className="gitcine-recent-card"
                    ariaLabel={`Alterar nota de ${item.title}`}
                  >
                    <MoviePoster className="gitcine-recent-image" src={item.image} title={item.title} />
                    <div className="gitcine-recent-info">
                      <h4>{item.title}</h4>
                      <div className="gitcine-recent-score">
                        <MovieStars score={item.value} />
                        <strong>{formatRating(item.value)}</strong>
                      </div>
                      <span className="gitcine-recent-date">Avaliado em {formatDate(item.ratedAt)}</span>
                    </div>
                  </RateAgainLink>
                ))}
              </div>
            </section>

            <section className="gitcine-evaluations-section" aria-labelledby="all-ratings-title">
              <div className="gitcine-section-header">
                <h3 id="all-ratings-title">Todas as minhas avaliações</h3>
                <span className="gitcine-count-badge">{ratings.length}</span>
              </div>
              <p className="gitcine-history-note">Avaliações registradas neste navegador.</p>

              <div className="gitcine-filter-bar">
                <div className="gitcine-filter-field gitcine-filter-search">
                  <label htmlFor="ratings-search">Buscar</label>
                  <input
                    id="ratings-search"
                    type="search"
                    placeholder="Título do filme"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="gitcine-filter-field">
                  <label htmlFor="ratings-filter">Nota</label>
                  <select id="ratings-filter" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                    <option value="">Todas</option>
                    {RATING_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} ★
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gitcine-filter-field">
                  <label htmlFor="ratings-sort">Ordenar por</label>
                  <select id="ratings-sort" value={sort} onChange={(e) => setSort(e.target.value as RatingSort)}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="gitcine-state-box">
                  <p>Nenhuma avaliação encontrada com esses filtros.</p>
                  <button type="button" className="gitcine-clear-filters" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="gitcine-evaluations-grid">
                  {filtered.map((item) => (
                    <div key={item.movieId} className="gitcine-evaluation-card">
                      <MoviePoster className="gitcine-eval-image" src={item.image} title={item.title} />
                      <div className="gitcine-eval-content">
                        <h4>{item.title}</h4>
                        <div className="gitcine-eval-score-badge">
                          ★ Nota atribuída: <strong>{formatRating(item.value)} / 5</strong>
                          <span className="gitcine-eval-date"> · {formatDate(item.ratedAt)}</span>
                        </div>
                      </div>
                      <RateAgainLink item={item} className="gitcine-eval-edit-btn">
                        Alterar Nota
                      </RateAgainLink>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default Profile;
