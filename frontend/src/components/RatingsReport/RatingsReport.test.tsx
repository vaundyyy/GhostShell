import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingsReport from '.';
import * as api from 'services/api';
import { renderWithProviders } from 'test-utils';
import { Movie } from 'types/movie';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  fetchAllMovies: jest.fn(),
}));

const mockedFetchAll = api.fetchAllMovies as jest.MockedFunction<typeof api.fetchAllMovies>;

const catalog: Movie[] = [
  { id: 1, title: 'Ação Total', image: '1.jpg', score: 4.5, count: 2 },
  { id: 2, title: 'Bela Vista', image: '2.jpg', score: 3, count: 1 },
  { id: 3, title: 'Corrida', image: '3.jpg', score: 0, count: 0 },
];

const chart = () => screen.getByRole('list', { name: /aprovação por filme/i });
const chartTitles = () => within(chart()).getAllByRole('heading', { level: 4 }).map((h) => h.textContent);

function renderReport(refreshKey = 0) {
  return renderWithProviders(<RatingsReport refreshKey={refreshKey} />);
}

describe('RatingsReport (painel de avaliações do admin)', () => {
  beforeEach(() => mockedFetchAll.mockReset().mockResolvedValue(catalog));

  it('mostra os indicadores gerais calculados a partir do catálogo', async () => {
    renderReport();
    expect(screen.getByText(/carregando avaliações/i)).toBeInTheDocument();

    const kpis = await screen.findByRole('list', { name: /indicadores/i });
    const [movies, ratings, average, unrated] = within(kpis).getAllByRole('listitem');
    expect(movies).toHaveTextContent(/Filmes no catálogo\s*3/);
    expect(ratings).toHaveTextContent(/Avaliações registradas\s*3/);
    // média ponderada: (4,5×2 + 3×1) / 3 = 4,0 → 80%
    expect(average).toHaveTextContent(/Nota média geral\s*4,0 ★\s*80% de aprovação/);
    expect(unrated).toHaveTextContent(/Filmes sem avaliação\s*1/);
  });

  it('mostra no gráfico o % de aprovação de cada filme avaliado', async () => {
    renderReport();
    await screen.findByRole('list', { name: /aprovação por filme/i });
    expect(chartTitles()).toEqual(['Ação Total', 'Bela Vista']);
    expect(within(chart()).getByText('90%')).toBeInTheDocument();
    expect(within(chart()).getByText('60%')).toBeInTheDocument();
    expect(within(chart()).getByText(/4,5 ★ · 2 avaliações · 66,7% do total/)).toBeInTheDocument();
  });

  it('permite incluir os filmes sem avaliação, ordenar e buscar', async () => {
    renderReport();
    await screen.findByRole('list', { name: /aprovação por filme/i });

    userEvent.click(screen.getByLabelText(/incluir filmes sem avaliação/i));
    await waitFor(() => expect(chartTitles()).toEqual(['Ação Total', 'Bela Vista', 'Corrida']));
    expect(within(chart()).getByText('Sem avaliações')).toBeInTheDocument();

    userEvent.selectOptions(screen.getByLabelText(/ordenar por/i), 'title');
    userEvent.type(screen.getByLabelText(/buscar filme/i), 'bela');
    await waitFor(() => expect(chartTitles()).toEqual(['Bela Vista']));
  });

  it('informa quantos filmes aparecem no gráfico', async () => {
    renderReport();
    expect(await screen.findByText('Mostrando 2 de 3 filmes')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText(/incluir filmes sem avaliação/i));
    expect(await screen.findByText('Mostrando 3 de 3 filmes')).toBeInTheDocument();

    userEvent.type(screen.getByLabelText(/buscar filme/i), 'corr');
    expect(await screen.findByText('Mostrando 1 de 3 filmes')).toBeInTheDocument();
  });

  it('gera o resumo das avaliações e permite copiar', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderReport();
    await screen.findByRole('list', { name: /aprovação por filme/i });

    userEvent.click(screen.getByRole('button', { name: /gerar resumo/i }));
    const summary = await screen.findByRole('region', { name: /resumo das avaliações/i });
    expect(summary).toHaveTextContent('Resumo de avaliações — GitCine');
    expect(summary).toHaveTextContent('1. Ação Total — 4,5 (90%) · 2 avaliações');

    userEvent.click(within(summary).getByRole('button', { name: /copiar/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Resumo de avaliações')));
    expect(await within(summary).findByText(/resumo copiado/i)).toBeInTheDocument();
  });

  it('baixa o resumo (.txt) e a planilha (.csv)', async () => {
    const createObjectURL = jest.fn(() => 'blob:resumo');
    Object.assign(URL, { createObjectURL, revokeObjectURL: jest.fn() });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderReport();
    await screen.findByRole('list', { name: /aprovação por filme/i });

    userEvent.click(screen.getByRole('button', { name: /gerar resumo/i }));
    const summary = await screen.findByRole('region', { name: /resumo das avaliações/i });
    userEvent.click(within(summary).getByRole('button', { name: /baixar resumo/i }));
    userEvent.click(within(summary).getByRole('button', { name: /baixar planilha/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    const [[txt], [csv]] = createObjectURL.mock.calls as unknown as [Blob][];
    expect(txt.type).toContain('text/plain');
    expect(csv.type).toContain('text/csv');
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it('mostra o erro e permite tentar de novo', async () => {
    mockedFetchAll.mockRejectedValueOnce(new Error('offline'));
    renderReport();
    expect(await screen.findByText(/não foi possível carregar as avaliações/i)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('list', { name: /aprovação por filme/i })).toBeInTheDocument();
    expect(mockedFetchAll).toHaveBeenCalledTimes(2);
  });

  it('avisa quando nenhum filme foi avaliado ainda', async () => {
    mockedFetchAll.mockResolvedValue([{ id: 3, title: 'Corrida', image: '3.jpg', score: 0, count: 0 }]);
    renderReport();
    expect(await screen.findByText(/nenhum filme recebeu avaliações ainda/i)).toBeInTheDocument();
  });
});
