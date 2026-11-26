import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { Movie, RateMovieState } from 'types/movie';
import { BASE_URL } from 'utils/requests';
import { fetchMovieById, saveRating, getErrorMessage } from 'services/api';
import { recordRating } from 'services/ratingHistory';
import { useApiRequest } from 'hooks/useApiRequest';
import MoviePoster from 'components/MoviePoster';
import './styles.css';

type Props = {
  movieId: string;
};

type MoviePreview = NonNullable<RateMovieState['movie']>;

// Converte a nota atual (pode ser decimal, ex.: 4.5) em uma opção do select (1 a 5).
function toScoreOption(rating?: number): string {
  if (typeof rating !== 'number' || !Number.isFinite(rating)) {
    return '5';
  }
  return String(Math.min(5, Math.max(1, Math.round(rating))));
}

// Após salvar, só aceita voltar para caminhos internos da aplicação.
function safeReturnPath(path?: string): string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

function FormCard({ movieId }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, authenticated, userEmail } = useAuth();
  const { run } = useApiRequest();

  const locationState = location.state as RateMovieState | null;
  const stateMovie = locationState?.movie;
  const returnTo = safeReturnPath(locationState?.returnTo);

  const [movie, setMovie] = useState<MoviePreview | undefined>(stateMovie);
  const [title, setTitle] = useState(stateMovie?.title || '');
  const [image, setImage] = useState(stateMovie?.image || '');

  // Estado do fluxo de avaliação (usuário comum)
  const [score, setScore] = useState(() => toScoreOption(locationState?.currentRating));
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin && !authenticated) {
      setErrorMsg('É necessário estar logado para registrar uma avaliação.');
    } else {
      setErrorMsg('');
    }
  }, [authenticated, isAdmin]);

  useEffect(() => {
    let active = true; // ignora a resposta se o usuário já saiu da tela ou trocou de filme

    fetchMovieById(movieId)
      .then((data: Movie) => {
        if (!active) return;
        setMovie(data);
        setTitle(data.title);
        setImage(data.image);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(getErrorMessage(err, 'Não foi possível carregar o filme.', { 404: 'Filme não encontrado.' }));
      });

    return () => {
      active = false;
    };
  }, [movieId]);

  const handleAdminSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !image.trim()) {
      setErrorMsg('Preencha o título e a imagem do filme.');
      return;
    }

    setSubmitting(true);

    const config: AxiosRequestConfig = {
      baseURL: BASE_URL,
      method: 'PUT',
      url: `/movies/${movieId}`,
      data: {
        title: title.trim(),
        image: image.trim(),
      },
    };

    axios(config)
      .then(() => {
        setSuccessMsg('Filme atualizado com sucesso!');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      })
      .catch(() => {
        setErrorMsg('Não foi possível salvar no backend (verifique o endpoint PUT /movies/{id} no Spring Boot).');
        setSubmitting(false);
      });
  };

  const handleScoreSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMsg('');

    if (!authenticated) {
      setErrorMsg('É necessário estar logado para registrar uma avaliação.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    const result = await run(() => saveRating(Number(movieId), Number(score)), {
      fallback: 'Erro ao registrar a avaliação. Tente novamente.',
      onError: (message) => {
        setErrorMsg(message);
        setSubmitting(false);
      },
    });
    if (!result.ok) {
      return;
    }

    // Guarda no histórico deste navegador (alimenta a tela "Minhas Avaliações").
    recordRating(userEmail, {
      movieId: result.data.movieId,
      title: movie?.title || `Filme #${movieId}`,
      image: movie?.image || '',
      value: result.data.value,
    });

    setSuccessMsg('Avaliação registrada com sucesso!');
    setTimeout(() => {
      navigate(returnTo);
    }, 500);
  };

  const displayImage = isAdmin ? image || movie?.image : movie?.image;
  const displayTitle = isAdmin ? title || movie?.title : movie?.title;

  return (
    <div className="gitcine-rate-card">
      {displayImage && (
        <div className="gitcine-rate-image-wrapper">
          <MoviePoster className="gitcine-rate-image" src={displayImage} title={displayTitle || 'Filme'} />
        </div>
      )}

      <div className="gitcine-rate-body">
        <span className="gitcine-rate-badge">
          {isAdmin ? 'Modo Admin • Edição' : 'Avaliação'}
        </span>

        <h3 className="gitcine-rate-title">
          {displayTitle || (isAdmin ? 'Editar Filme' : 'Avaliar Filme')}
        </h3>

        {authenticated && !isAdmin && userEmail && (
          <div className="gitcine-logged-notice">
            Avaliando como <strong>{userEmail}</strong>
          </div>
        )}

        {errorMsg && <div className="gitcine-rate-alert">{errorMsg}</div>}
        {successMsg && <div className="gitcine-rate-success">{successMsg}</div>}

        {isAdmin ? (
          <form className="gitcine-rate-form" onSubmit={handleAdminSubmit}>
            <div className="gitcine-rate-group">
              <label htmlFor="title">Nome do filme</label>
              <input
                id="title"
                type="text"
                className="gitcine-rate-input"
                placeholder="Digite o nome do filme"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="gitcine-rate-group">
              <label htmlFor="image">Imagem</label>
              <input
                id="image"
                type="text"
                className="gitcine-rate-input"
                placeholder="https://..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            <div className="gitcine-rate-actions">
              <button
                type="submit"
                className="gitcine-rate-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>

              <Link to="/" className="gitcine-rate-btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        ) : (
          <form className="gitcine-rate-form" onSubmit={handleScoreSubmit}>
            <div className="gitcine-rate-group">
              <label htmlFor="score">Informe sua avaliação</label>
              <select
                id="score"
                className="gitcine-rate-input gitcine-rate-select"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                disabled={!authenticated || submitting}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div className="gitcine-rate-actions">
              <button
                type="submit"
                className="gitcine-rate-btn-primary"
                disabled={!authenticated || submitting}
              >
                {submitting ? 'Enviando...' : 'Salvar'}
              </button>

              <Link to="/" className="gitcine-rate-btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FormCard;