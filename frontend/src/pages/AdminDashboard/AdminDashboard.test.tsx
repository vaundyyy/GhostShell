import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '.';
import * as api from 'services/api';
import { deferred, loginAs, makeHttpError, renderWithProviders } from 'test-utils';
import { Movie } from 'types/movie';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  createMovie: jest.fn(),
  fetchAllMovies: jest.fn(),
}));

const mockedCreate = api.createMovie as jest.MockedFunction<typeof api.createMovie>;
const mockedFetchAll = api.fetchAllMovies as jest.MockedFunction<typeof api.fetchAllMovies>;
const created: Movie = { id: 30, title: 'Clube da Luta', image: 'x.jpg', score: 0, count: 0 };

function fill(title: string, image: string) {
  userEvent.type(screen.getByLabelText(/título do filme/i), title);
  userEvent.type(screen.getByLabelText(/url da capa/i), image);
}

const submitButton = () => screen.getByRole('button', { name: /cadastr/i });

describe('AdminDashboard (integração com POST /api/admin/movies)', () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    mockedFetchAll.mockReset().mockResolvedValue([{ id: 1, title: 'Titanic', image: 't.jpg', score: 4, count: 2 }]);
    loginAs('admin', 'maria@gmail.com');
  });

  it('mostra o painel de avaliações junto com o cadastro de filmes', async () => {
    renderWithProviders(<AdminDashboard />);
    expect(await screen.findByRole('list', { name: /aprovação por filme/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /adicionar novo filme/i })).toBeInTheDocument();
  });

  it('atualiza o painel depois de cadastrar um filme', async () => {
    mockedCreate.mockResolvedValue(created);
    renderWithProviders(<AdminDashboard />);
    await screen.findByRole('list', { name: /aprovação por filme/i });
    fill('Clube da Luta', 'x.jpg');
    userEvent.click(submitButton());

    expect(await screen.findByText(/cadastrado com sucesso/i)).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchAll).toHaveBeenCalledTimes(2));
  });

  it('cadastra o filme enviando apenas title e image', async () => {
    mockedCreate.mockResolvedValue(created);
    renderWithProviders(<AdminDashboard />);
    fill('Clube da Luta', 'x.jpg');
    userEvent.click(submitButton());

    expect(await screen.findByText(/cadastrado com sucesso/i)).toBeInTheDocument();
    expect(mockedCreate).toHaveBeenCalledWith({ title: 'Clube da Luta', image: 'x.jpg' });
  });

  it('não cadastra duas vezes com duplo clique e desabilita o botão durante o envio', async () => {
    const pending = deferred<Movie>();
    mockedCreate.mockReturnValue(pending.promise);
    renderWithProviders(<AdminDashboard />);
    fill('Clube da Luta', 'x.jpg');

    userEvent.click(submitButton());
    userEvent.click(submitButton());

    expect(await screen.findByRole('button', { name: /cadastrando/i })).toBeDisabled();
    pending.resolve(created);
    expect(await screen.findByText(/cadastrado com sucesso/i)).toBeInTheDocument();
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it('exibe erro de permissão quando o backend responde 403', async () => {
    mockedCreate.mockRejectedValue(makeHttpError(403));
    renderWithProviders(<AdminDashboard />);
    fill('Filme', 'x.jpg');
    userEvent.click(submitButton());

    expect(await screen.findByText(/apenas administradores/i)).toBeInTheDocument();
  });
});
