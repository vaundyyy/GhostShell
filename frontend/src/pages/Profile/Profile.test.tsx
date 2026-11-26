import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '.';
import * as api from 'services/api';
import { recordRating } from 'services/ratingHistory';
import { loginAs, renderWithProviders } from 'test-utils';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  fetchAllMovies: jest.fn(),
}));

const mockedFetch = api.fetchAllMovies as jest.MockedFunction<typeof api.fetchAllMovies>;

const EMAIL = 'ana@gitcine.com';

function seed(count: number, email = EMAIL) {
  for (let i = 1; i <= count; i++) {
    recordRating(
      email,
      { movieId: i, title: `Filme ${i}`, image: `img${i}.jpg`, value: ((i - 1) % 5) + 1 },
      new Date(Date.UTC(2026, 10, 24, 10, i)) // Filme N é o mais recente
    );
  }
}

function renderProfile() {
  renderWithProviders(<Profile />, { route: '/profile', path: '/profile' });
}

const recentSection = () => screen.getByRole('region', { name: /avaliados recentemente/i });
const allSection = () => screen.getByRole('region', { name: /todas as minhas avaliações/i });
const titlesIn = (section: HTMLElement) =>
  within(section).getAllByRole('heading', { level: 4 }).map((h) => h.textContent);

describe('Profile — Minhas Avaliações', () => {
  beforeEach(() => {
    loginAs('user', EMAIL);
    // Por padrão o catálogo "não responde": o perfil usa os dados salvos no histórico.
    mockedFetch.mockReset().mockReturnValue(new Promise(() => undefined));
  });

  it('mostra o estado vazio quando o usuário ainda não avaliou filmes', () => {
    renderProfile();
    expect(screen.getByText(/você ainda não avaliou nenhum filme/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explorar catálogo/i })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('region', { name: /avaliados recentemente/i })).not.toBeInTheDocument();
  });

  it('exibe o e-mail do usuário logado', () => {
    renderProfile();
    expect(screen.getByText(EMAIL)).toBeInTheDocument();
  });

  it('faixa "Avaliados recentemente" mostra os 6 últimos, do mais recente para o mais antigo', () => {
    seed(8);
    renderProfile();
    expect(titlesIn(recentSection())).toEqual(['Filme 8', 'Filme 7', 'Filme 6', 'Filme 5', 'Filme 4', 'Filme 3']);
  });

  it('lista todas as avaliações com o total', () => {
    seed(8);
    renderProfile();
    expect(titlesIn(allSection())).toHaveLength(8);
    expect(within(allSection()).getByText('8')).toBeInTheDocument();
  });

  it('não mostra avaliações de outro usuário do mesmo navegador', () => {
    seed(2, 'outra.pessoa@gitcine.com');
    renderProfile();
    expect(screen.getByText(/você ainda não avaliou nenhum filme/i)).toBeInTheDocument();
  });

  it('filtra por título e por nota', () => {
    seed(8);
    renderProfile();

    userEvent.type(within(allSection()).getByLabelText(/buscar/i), 'filme 1');
    expect(titlesIn(allSection())).toEqual(['Filme 1']);

    userEvent.clear(within(allSection()).getByLabelText(/buscar/i));
    userEvent.selectOptions(within(allSection()).getByLabelText(/^nota$/i), '3');
    expect(titlesIn(allSection())).toEqual(['Filme 8', 'Filme 3']);
  });

  it('ordena por título', () => {
    seed(3);
    renderProfile();
    userEvent.selectOptions(within(allSection()).getByLabelText(/ordenar/i), 'title');
    expect(titlesIn(allSection())).toEqual(['Filme 1', 'Filme 2', 'Filme 3']);
  });

  it('informa quando o filtro não encontra nada e permite limpar os filtros', async () => {
    seed(3);
    renderProfile();
    userEvent.type(within(allSection()).getByLabelText(/buscar/i), 'inexistente');
    expect(screen.getByText(/nenhuma avaliação encontrada/i)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));
    expect(await within(allSection()).findAllByRole('heading', { level: 4 })).toHaveLength(3);
    expect(within(allSection()).getByLabelText(/buscar/i)).toHaveValue('');
  });

  it('o botão "Alterar Nota" leva para a avaliação do filme correto', () => {
    seed(1);
    renderProfile();
    expect(within(allSection()).getByRole('link', { name: /alterar nota/i })).toHaveAttribute('href', '/movies/1/rate');
    expect(within(recentSection()).getByRole('link', { name: /alterar nota de filme 1/i })).toHaveAttribute(
      'href',
      '/movies/1/rate'
    );
  });

  it('mostra em cada filme a foto atual do catálogo (a mesma da listagem)', async () => {
    recordRating(EMAIL, { movieId: 1, title: 'Duna', image: 'salva-duna.jpg', value: 4 }, new Date(Date.UTC(2026, 10, 24, 10, 2)));
    recordRating(EMAIL, { movieId: 2, title: 'Filme #2', image: '', value: 5 }, new Date(Date.UTC(2026, 10, 24, 10, 1)));
    mockedFetch.mockResolvedValue([
      { id: 1, title: 'Duna', image: 'https://img/duna.jpg', score: 4, count: 1 },
      { id: 2, title: 'Interestelar', image: 'https://img/interestelar.jpg', score: 5, count: 1 },
    ]);
    renderProfile();

    expect(await within(allSection()).findByRole('img', { name: 'Interestelar' })).toHaveAttribute(
      'src',
      'https://img/interestelar.jpg'
    );
    expect(within(allSection()).getByRole('img', { name: 'Duna' })).toHaveAttribute('src', 'https://img/duna.jpg');
    expect(within(recentSection()).getByRole('img', { name: 'Interestelar' })).toHaveAttribute(
      'src',
      'https://img/interestelar.jpg'
    );
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('sem resposta do catálogo, usa a foto salva na avaliação', async () => {
    recordRating(EMAIL, { movieId: 1, title: 'Duna', image: 'salva-duna.jpg', value: 4 });
    mockedFetch.mockRejectedValue(new Error('offline'));
    renderProfile();

    expect(await within(allSection()).findByRole('img', { name: 'Duna' })).toHaveAttribute('src', 'salva-duna.jpg');
  });

  it('troca foto quebrada por uma capa neutra, sem ícone de imagem quebrada', () => {
    recordRating(EMAIL, { movieId: 1, title: 'Duna', image: 'https://example.com/quebrada.jpg', value: 4 });
    renderProfile();

    fireEvent.error(within(allSection()).getByAltText('Duna'));

    expect(within(allSection()).queryByAltText('Duna')).not.toBeInTheDocument();
    expect(within(allSection()).getByRole('img', { name: 'Duna' })).toHaveClass('gitcine-poster-placeholder');
  });

  it('não consulta o catálogo quando o usuário ainda não avaliou filmes', () => {
    renderProfile();
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
