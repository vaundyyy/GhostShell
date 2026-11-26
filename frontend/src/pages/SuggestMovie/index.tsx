import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiRequest } from 'hooks/useApiRequest';
import { sendMovieProposal } from 'services/api';
import '../Login/styles.css';

function SuggestMovie() {
  const [userName, setUserName] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const { run, pending } = useApiRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !movieTitle.trim()) {
      setError('Preencha o seu nome e o nome do filme.');
      setInfoMessage('');
      return;
    }

    setError('');
    setInfoMessage('');

    const title = movieTitle.trim();
    // O usuário é identificado pelo JWT; o nome informado segue no campo message.
    const result = await run(() => sendMovieProposal({ title, message: `Indicação enviada por ${userName.trim()}` }), {
      fallback: 'Não foi possível enviar a indicação. Tente novamente.',
      onError: setError,
    });
    if (!result.ok) {
      return;
    }

    setInfoMessage(`Indicação de "${title}" enviada ao administrador por e-mail!`);
    setUserName('');
    setMovieTitle('');
  };

  return (
    <div className="gitcine-auth-container">
      <div className="gitcine-auth-card">
        <div className="gitcine-auth-header">
          <span className="gitcine-rate-badge">Indicação</span>
          <h2>Indicar um Filme</h2>
          <p>
            Envie sua indicação direto para o admin por e-mail.
          </p>
        </div>

        {error && <div className="gitcine-auth-alert">{error}</div>}
        {infoMessage && <div className="gitcine-auth-success">{infoMessage}</div>}

        <form onSubmit={handleSubmit} className="gitcine-auth-form">
          <div className="gitcine-form-group">
            <label htmlFor="userName">Seu nome</label>
            <input
              id="userName"
              type="text"
              placeholder="Ex: Maria Silva"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <div className="gitcine-form-group">
            <label htmlFor="movieTitle">Nome do filme</label>
            <input
              id="movieTitle"
              type="text"
              placeholder="Ex: Interestelar"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <button type="submit" className="gitcine-btn-primary" disabled={pending}>
            {pending ? 'Enviando...' : 'Enviar por e-mail'}
          </button>
        </form>

        <div className="gitcine-auth-footer">
          <Link to="/" className="gitcine-auth-link">
            Voltar para o catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SuggestMovie;