import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormCard from '.';
import * as api from 'services/api';
import { getRatingHistory } from 'services/ratingHistory';
import { loginAs, makeHttpError, RedirectProbe, renderWithProviders } from 'test-utils';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  fetchMovieById: jest.fn(),
  saveRating: jest.fn(),
}));

const mockedFetch = api.fetchMovieById as jest.MockedFunction<typeof api.fetchMovieById>;
const mockedSave = api.saveRating as jest.MockedFunction<typeof api.saveRating>;

const movie = { id: 7, title: 'Duna', image: 'duna.jpg', score: 4, count: 3 };
const EMAIL = 'user@gitcine.com';

function renderCard(state?: unknown) {
  renderWithProviders(<FormCard movieId="7" />, {
    route: '/movies/7/rate',
    path: '/movies/:movieId/rate',
    state,
    extraRoutes: [
      { path: '/', element: <div>Catálogo</div> },
      { path: '/profile', element: <div>Meu perfil</div> },
      { path: '/login', element: <RedirectProbe label="Tela de login" /> },
    ],
  });
}

async function submitScore(value: string) {
  await screen.findByText('Duna');
  userEvent.selectOptions(screen.getByLabelText(/informe sua avaliação/i), value);
  userEvent.click(screen.getByRole('button', { name: /salvar/i }));
}

describe('FormCard (integração com GET /api/movies/{id} e POST /api/ratings)', () => {
  beforeEach(() => {
    mockedFetch.mockReset().mockResolvedValue(movie);
    mockedSave.mockReset();
  });

  it('carrega o filme pelo endpoint /api/movies/{id}', async () => {
    renderCard();
    expect(await screen.findByText('Duna')).toBeInTheDocument();
    expect(mockedFetch).toHaveBeenCalledWith('7');
  });

  it('mostra a imagem do filme inteira e centralizada', async () => {
    renderCard();
    const image = await screen.findByRole('img', { name: 'Duna' });
    expect(image).toHaveAttribute('src', 'duna.jpg');
    expect(image).toHaveClass('gitcine-poster-image');
  });

  it('avisa quando o filme não existe (404)', async () => {
    mockedFetch.mockRejectedValue(makeHttpError(404));
    renderCard();
    expect(await screen.findByText(/filme não encontrado/i)).toBeInTheDocument();
  });

  it('não permite avaliar sem estar logado', async () => {
    renderCard();
    await screen.findByText('Duna');
    expect(screen.getByText(/necessário estar logado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });

  it('envia a nota numérica, guarda no histórico do usuário e volta ao catálogo', async () => {
    loginAs('user', EMAIL);
    mockedSave.mockResolvedValue({ movieId: 7, userId: 1, value: 3, movieScore: 3.8, movieCount: 4 });
    renderCard();

    await submitScore('3');

    expect(await screen.findByText(/avaliação registrada com sucesso/i)).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledWith(7, 3);
    expect(getRatingHistory(EMAIL)).toEqual([
      expect.objectContaining({ movieId: 7, title: 'Duna', image: 'duna.jpg', value: 3 }),
    ]);
    expect(await screen.findByText('Catálogo')).toBeInTheDocument();
  });

  it('vindo do perfil: pré-seleciona a nota atual e retorna ao perfil após salvar', async () => {
    loginAs('user', EMAIL);
    mockedSave.mockResolvedValue({ movieId: 7, userId: 1, value: 5, movieScore: 4.2, movieCount: 4 });
    renderCard({ movie: { title: 'Duna', image: 'duna.jpg' }, currentRating: 4, returnTo: '/profile' });

    expect(await screen.findByLabelText(/informe sua avaliação/i)).toHaveValue('4');

    await submitScore('5');
    expect(await screen.findByText('Meu perfil')).toBeInTheDocument();
  });

  it('ignora destinos de retorno inválidos (só aceita caminhos internos)', async () => {
    loginAs('user', EMAIL);
    mockedSave.mockResolvedValue({ movieId: 7, userId: 1, value: 5, movieScore: 4.2, movieCount: 4 });
    renderCard({ returnTo: '//site-externo.com' });

    await submitScore('5');
    expect(await screen.findByText('Catálogo')).toBeInTheDocument();
  });

  it('com a sessão expirada (401) faz logout e leva ao login com aviso', async () => {
    loginAs('user', EMAIL);
    mockedSave.mockRejectedValue(makeHttpError(401, { authorized: true }));
    renderCard();

    await submitScore('4');

    expect(await screen.findByText(/tela de login: sua sessão expirou/i)).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('@GitCine:token')).toBeNull());
    expect(getRatingHistory(EMAIL)).toEqual([]);
  });

  it('mostra a mensagem de validação do backend (ex.: 422)', async () => {
    loginAs('user', EMAIL);
    mockedSave.mockRejectedValue(makeHttpError(422, { data: { message: 'Rating must be between 1 and 5' } }));
    renderCard();

    await submitScore('4');
    expect(await screen.findByText('Rating must be between 1 and 5')).toBeInTheDocument();
  });
});
