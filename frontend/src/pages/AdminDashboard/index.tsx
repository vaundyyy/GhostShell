import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiRequest } from 'hooks/useApiRequest';
import RatingsReport from 'components/RatingsReport';
import { createMovie } from 'services/api';
import '../Login/styles.css';
import './styles.css';

function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [reportKey, setReportKey] = useState(0);
  const { run, pending } = useApiRequest();

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !image.trim()) {
      setFeedback({ type: 'error', text: 'Preencha o título e a URL da imagem do filme.' });
      return;
    }

    setFeedback({ type: '', text: '' });
    const result = await run(() => createMovie({ title, image }), {
      fallback: 'Não foi possível cadastrar o filme. Tente novamente.',
      messages: { 403: 'Apenas administradores podem cadastrar filmes.' },
      onError: (text) => setFeedback({ type: 'error', text }),
    });
    if (!result.ok) {
      return;
    }

    setFeedback({ type: 'success', text: 'Filme cadastrado com sucesso no catálogo!' });
    setTitle('');
    setImage('');
    setReportKey((key) => key + 1); // o novo filme entra no painel
  };

  return (
    <main className="gitcine-admin-page">
      <div className="container">
        <header className="gitcine-admin-header">
          <span className="gitcine-rate-badge">Painel Admin</span>
          <h2>Painel de avaliações</h2>
          <p>Acompanhe a aprovação de cada filme, gere um resumo e cadastre novos títulos.</p>
        </header>

        <div className="gitcine-admin-layout">
          <RatingsReport refreshKey={reportKey} />

          <div className="gitcine-auth-card">
            <div className="gitcine-auth-header">
              <h2>Adicionar Novo Filme</h2>
              <p>Cadastre um título no catálogo oficial do GitCine.</p>
            </div>

            {feedback.text && <div className={`gitcine-feedback-${feedback.type}`}>{feedback.text}</div>}

            <form onSubmit={handleAddMovie} className="gitcine-auth-form">
              <div className="gitcine-form-group">
                <label htmlFor="movieTitle">Título do Filme</label>
                <input
                  id="movieTitle"
                  type="text"
                  className="gitcine-input"
                  placeholder="Ex: Clube da Luta"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="gitcine-form-group">
                <label htmlFor="movieImage">URL da Capa (16:9)</label>
                <input
                  id="movieImage"
                  type="text"
                  className="gitcine-input"
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <button type="submit" className="gitcine-btn-primary" disabled={pending}>
                {pending ? 'Cadastrando...' : 'Cadastrar Filme'}
              </button>
            </form>

            <div className="gitcine-auth-footer">
              <Link to="/" className="gitcine-auth-link">
                Voltar para o catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
