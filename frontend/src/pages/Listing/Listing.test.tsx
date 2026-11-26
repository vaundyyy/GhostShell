import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Listing from '.';
import * as api from 'services/api';
import { deferred, renderWithProviders } from 'test-utils';
import { MoviePage } from 'types/movie';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  fetchMovies: jest.fn(),
}));

const mockedFetch = api.fetchMovies as jest.MockedFunction<typeof api.fetchMovies>;
const { toMoviePage } = jest.requireActual('services/api');

const page0: MoviePage = toMoviePage({
  content: [
    { id: 1, title: 'The Witcher', image: 'a.jpg', score: 3, count: 1 },
    { id: 2, title: 'Venom', image: 'b.jpg', score: 0, count: 0 },
  ],
  page: 0,
  size: 12,
  totalElements: 14,
  totalPages: 2,
});

describe('Listing (integração com GET /api/movies)', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('exibe loading e depois os cards retornados pelo backend', async () => {
    mockedFetch.mockResolvedValue(page0);
    renderWithProviders(<Listing />);
    expect(screen.getByText(/carregando catálogo/i)).toBeInTheDocument();
    expect(await screen.findByText('The Witcher')).toBeInTheDocument();
    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    expect(mockedFetch).toHaveBeenCalledWith(0, 12);
  });

  it('busca a próxima página ao paginar', async () => {
    mockedFetch.mockResolvedValue(page0);
    renderWithProviders(<Listing />);
    await screen.findByText('The Witcher');
    const [, next] = screen.getAllByRole('button').filter((b) => b.className.includes('pagination'));
    userEvent.click(next);
    await waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(1, 12));
  });

  it('na busca usa no máximo size=100 (limite do backend)', async () => {
    mockedFetch.mockResolvedValue(page0);
    renderWithProviders(<Listing />);
    await screen.findByText('The Witcher');
    userEvent.type(screen.getByPlaceholderText(/buscar título/i), 'ven');
    expect(await screen.findByText('Venom')).toBeInTheDocument();
    expect(screen.queryByText('The Witcher')).not.toBeInTheDocument();
    await waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(0, 100));
  });

  it('ignora a resposta atrasada de uma busca antiga', async () => {
    const stale = deferred<MoviePage>();
    mockedFetch
      .mockResolvedValueOnce(page0) // carregamento inicial
      .mockReturnValueOnce(stale.promise) // busca "v" (vai falhar depois)
      .mockResolvedValue(page0); // buscas seguintes
    renderWithProviders(<Listing />);
    await screen.findByText('The Witcher');

    userEvent.type(screen.getByPlaceholderText(/buscar título/i), 've');
    expect(await screen.findByText('Venom')).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(3); // inicial, "v" e "ve"

    // A resposta da busca antiga ("v") chega por último, com erro: não pode sobrescrever a tela.
    await act(async () => {
      stale.reject(new Error('resposta antiga'));
      await stale.promise.catch(() => undefined);
    });

    expect(screen.queryByText(/não foi possível/i)).not.toBeInTheDocument();
    expect(screen.getByText('Venom')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando o backend falha', async () => {
    mockedFetch.mockRejectedValue(new Error('boom'));
    renderWithProviders(<Listing />);
    expect(await screen.findByText(/não foi possível carregar os filmes/i)).toBeInTheDocument();
  });

  it('avisa que o servidor pode estar iniciando quando o carregamento demora', async () => {
    const slow = deferred<MoviePage>();
    mockedFetch.mockReturnValue(slow.promise);
    jest.useFakeTimers();
    try {
      renderWithProviders(<Listing />);
      expect(screen.queryByText(/servidor está iniciando/i)).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText(/servidor está iniciando/i)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }

    await act(async () => {
      slow.resolve(page0);
      await slow.promise;
    });
    expect(screen.getByText('The Witcher')).toBeInTheDocument();
    expect(screen.queryByText(/servidor está iniciando/i)).not.toBeInTheDocument();
  });
});
