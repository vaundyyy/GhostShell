import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { LoginRedirectState, useApiRequest } from 'hooks/useApiRequest';
import { login as loginRequest } from 'services/api';
import { toFrontendRole } from 'utils/auth';
import './styles.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.state as LoginRedirectState | null;
  const { login } = useAuth();
  const { run, pending } = useApiRequest();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage('Por favor, preencha seu usuário/e-mail e senha.');
      return;
    }

    setErrorMessage('');

    const result = await run(() => loginRequest({ email, password }), {
      fallback: 'Não foi possível entrar. Tente novamente.',
      messages: { 401: 'E-mail ou senha inválidos.' },
      onError: setErrorMessage,
    });
    if (!result.ok) {
      return;
    }

    const auth = result.data;
    login(auth.token, toFrontendRole(auth.role), auth.email);
    // Volta para a página protegida que o usuário tentou abrir (enviada pelo PrivateRoute).
    navigate(redirect?.from?.pathname ?? '/', { replace: true });
  };

  return (
    <div className="gitcine-auth-container">
      <div className="gitcine-auth-card">
        <div className="gitcine-auth-header">
          <h2>Entrar no GitCine</h2>
          <p>Insira suas credenciais para avaliar filmes e acessar seu perfil.</p>
        </div>

        {(errorMessage || redirect?.message) && (
          <div className="gitcine-auth-alert">
            {errorMessage || redirect?.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="gitcine-auth-form">
          <div className="gitcine-form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <div className="gitcine-form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <button type="submit" className="gitcine-btn-primary" disabled={pending}>
            {pending ? 'Entrando...' : 'Continuar'}
          </button>
        </form>

        <div className="gitcine-auth-footer">
          <span>Ainda não tem uma conta? </span>
          <Link to="/register" className="gitcine-auth-link">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;