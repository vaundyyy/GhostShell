// o que foi feito: Criação da página de registro com campos de nome,
//  e-mail, senha e confirmação de senha,

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiRequest } from 'hooks/useApiRequest';
import { register } from 'services/api';
import '../Login/styles.css';

function Register() {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { run, pending } = useApiRequest();

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      setSuccessMessage('');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Informe um nome válido com pelo menos 2 caracteres.');
      setSuccessMessage('');
      return;
    }

    // Mesma regra do backend (RegisterRequest: @Size(min = 8, max = 24))
    if (password.length < 8 || password.length > 24) {
      setErrorMessage('A senha deve conter entre 8 e 24 caracteres.');
      setSuccessMessage('');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setSuccessMessage('');
      return;
    }

    setErrorMessage('');

    const result = await run(() => register({ name: trimmedName, email: trimmedEmail, password }), {
      fallback: 'Não foi possível criar a conta. Tente novamente.',
      messages: { 409: 'Este e-mail já está cadastrado.' },
      onError: setErrorMessage,
    });
    if (!result.ok) {
      return;
    }

    setSuccessMessage('Conta criada com sucesso! Redirecionando...');

    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="gitcine-auth-container">
      <div className="gitcine-auth-card">
        <div className="gitcine-auth-header">
          <h2>Criar Conta</h2>
          <p>Junte-se ao GitCine para avaliar e descobrir filmes.</p>
        </div>

        {errorMessage && (
          <div className="gitcine-auth-alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="gitcine-auth-success">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="gitcine-auth-form">
          <div className="gitcine-form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="gitcine-input"
            />
          </div>

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
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <div className="gitcine-form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="gitcine-input"
            />
          </div>

          <button type="submit" className="gitcine-btn-primary" disabled={pending}>
            {pending ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="gitcine-auth-footer">
          <span>Já tem uma conta? </span>
          <Link to="/login" className="gitcine-auth-link">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;