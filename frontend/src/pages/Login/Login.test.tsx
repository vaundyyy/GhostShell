import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '.';
import * as api from 'services/api';
import { makeHttpError, renderWithProviders } from 'test-utils';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  login: jest.fn(),
}));

const mockedLogin = api.login as jest.MockedFunction<typeof api.login>;

function renderLogin(state?: unknown) {
  renderWithProviders(<Login />, {
    route: '/login',
    path: '/login',
    state,
    extraRoutes: [
      { path: '/', element: <div>Página inicial</div> },
      { path: '/profile', element: <div>Meu perfil</div> },
    ],
  });
}

function fillAndSubmit(email: string, password: string) {
  userEvent.type(screen.getByLabelText('E-mail'), email);
  userEvent.type(screen.getByLabelText('Senha'), password);
  userEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('Login (integração com POST /api/auth/login)', () => {
  beforeEach(() => mockedLogin.mockReset());

  it('bloqueia envio com campos vazios', async () => {
    renderLogin();
    userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(await screen.findByText(/preencha/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('autentica no backend, guarda o token JWT/role e redireciona', async () => {
    mockedLogin.mockResolvedValue({ id: 1, name: 'Maria', email: 'maria@gmail.com', role: 'ADMIN', token: 'jwt-real' });
    renderLogin();
    fillAndSubmit('maria@gmail.com', 'senha1234');

    expect(await screen.findByText('Página inicial')).toBeInTheDocument();
    expect(mockedLogin).toHaveBeenCalledWith({ email: 'maria@gmail.com', password: 'senha1234' });
    expect(localStorage.getItem('@GitCine:token')).toBe('jwt-real');
    expect(localStorage.getItem('@GitCine:role')).toBe('admin');
    expect(localStorage.getItem('@GitCine:email')).toBe('maria@gmail.com');
  });

  it('volta para a página protegida que o usuário tentou abrir', async () => {
    mockedLogin.mockResolvedValue({ id: 2, name: 'Ana', email: 'ana@gmail.com', role: 'USER', token: 'jwt' });
    renderLogin({ from: { pathname: '/profile' } });
    fillAndSubmit('ana@gmail.com', 'senha1234');

    expect(await screen.findByText('Meu perfil')).toBeInTheDocument();
  });

  it('mostra o aviso de sessão expirada recebido no redirecionamento', () => {
    renderLogin({ message: 'Sua sessão expirou. Faça login novamente.' });
    expect(screen.getByText(/sua sessão expirou/i)).toBeInTheDocument();
  });

  it('exibe erro de credenciais quando o backend responde 401', async () => {
    mockedLogin.mockRejectedValue(makeHttpError(401));
    renderLogin();
    fillAndSubmit('a@a.com', 'errada123');

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
    expect(localStorage.getItem('@GitCine:token')).toBeNull();
  });

  it('não aceita mais o login fixo de admin (mock removido)', async () => {
    mockedLogin.mockRejectedValue(makeHttpError(401));
    renderLogin();
    fillAndSubmit('admin@admin.com', 'admin');
    await waitFor(() => expect(mockedLogin).toHaveBeenCalled());
    expect(localStorage.getItem('@GitCine:token')).toBeNull();
  });
});
