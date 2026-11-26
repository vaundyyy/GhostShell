import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '.';
import * as api from 'services/api';
import { makeHttpError, renderWithProviders } from 'test-utils';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  register: jest.fn(),
}));

const mockedRegister = api.register as jest.MockedFunction<typeof api.register>;

function renderRegister() {
  renderWithProviders(<Register />, { route: '/register', path: '/register' });
}

function fill(name: string, email: string, password: string, confirm = password) {
  userEvent.type(screen.getByLabelText('Nome completo'), name);
  userEvent.type(screen.getByLabelText('E-mail'), email);
  userEvent.type(screen.getByLabelText('Senha'), password);
  userEvent.type(screen.getByLabelText('Confirmar senha'), confirm);
  userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
}

describe('Register (integração com POST /api/auth/register)', () => {
  beforeEach(() => mockedRegister.mockReset());

  it('bloqueia senha com mais de 24 caracteres (regra do backend)', async () => {
    renderRegister();
    fill('Ana Souza', 'ana@x.com', 'a'.repeat(25));
    expect(await screen.findByText(/entre 8 e 24 caracteres/i)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('bloqueia senhas diferentes', async () => {
    renderRegister();
    fill('Ana Souza', 'ana@x.com', 'senha1234', 'outra1234');
    expect(await screen.findByText(/não coincidem/i)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('cadastra no backend e mostra sucesso', async () => {
    mockedRegister.mockResolvedValue({ id: 3, name: 'Ana Souza', email: 'ana@x.com', role: 'USER', token: 't' });
    renderRegister();
    fill('Ana Souza', 'ana@x.com', 'senha1234');

    expect(await screen.findByText(/conta criada com sucesso/i)).toBeInTheDocument();
    expect(mockedRegister).toHaveBeenCalledWith({ name: 'Ana Souza', email: 'ana@x.com', password: 'senha1234' });
  });

  it('exibe erro de e-mail duplicado quando o backend responde 409', async () => {
    mockedRegister.mockRejectedValue(makeHttpError(409));
    renderRegister();
    fill('Ana Souza', 'ana@x.com', 'senha1234');

    expect(await screen.findByText(/já está cadastrado/i)).toBeInTheDocument();
  });
});
