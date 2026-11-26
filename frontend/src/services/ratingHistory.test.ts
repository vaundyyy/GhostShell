import { getRatingHistory, queryRatings, recordRating, RatedMovie, withCatalogDetails } from './ratingHistory';

const MARIA = 'maria@gmail.com';

function at(minutes: number) {
  return new Date(Date.UTC(2026, 10, 24, 12, minutes));
}

describe('ratingHistory (avaliações salvas neste navegador)', () => {
  it('retorna lista vazia sem e-mail ou sem registros', () => {
    expect(getRatingHistory('')).toEqual([]);
    expect(getRatingHistory(MARIA)).toEqual([]);
  });

  it('registra avaliações e lista da mais recente para a mais antiga', () => {
    recordRating(MARIA, { movieId: 1, title: 'Duna', image: 'duna.jpg', value: 4 }, at(1));
    recordRating(MARIA, { movieId: 2, title: 'Matrix', image: 'matrix.jpg', value: 5 }, at(2));

    const history = getRatingHistory(MARIA);
    expect(history.map((h) => h.movieId)).toEqual([2, 1]);
    expect(history[0]).toEqual({
      movieId: 2,
      title: 'Matrix',
      image: 'matrix.jpg',
      value: 5,
      ratedAt: at(2).toISOString(),
    });
  });

  it('reavaliar o mesmo filme atualiza a nota e o move para o topo, sem duplicar', () => {
    recordRating(MARIA, { movieId: 1, title: 'Duna', image: 'duna.jpg', value: 2 }, at(1));
    recordRating(MARIA, { movieId: 2, title: 'Matrix', image: 'matrix.jpg', value: 5 }, at(2));
    recordRating(MARIA, { movieId: 1, title: 'Duna', image: 'duna.jpg', value: 4 }, at(3));

    const history = getRatingHistory(MARIA);
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ movieId: 1, value: 4 });
  });

  it('separa o histórico por usuário (e-mail normalizado)', () => {
    recordRating(' Maria@Gmail.com ', { movieId: 1, title: 'Duna', image: '', value: 4 }, at(1));
    recordRating('joao@gmail.com', { movieId: 2, title: 'Matrix', image: '', value: 3 }, at(2));

    expect(getRatingHistory(MARIA).map((h) => h.movieId)).toEqual([1]);
    expect(getRatingHistory('joao@gmail.com').map((h) => h.movieId)).toEqual([2]);
  });

  it('ignora dados corrompidos ou inválidos no armazenamento', () => {
    localStorage.setItem(`@GitCine:ratings:${MARIA}`, '{isso não é json');
    expect(getRatingHistory(MARIA)).toEqual([]);

    localStorage.setItem(
      `@GitCine:ratings:${MARIA}`,
      JSON.stringify([{ movieId: 'x' }, null, { movieId: 3, title: 'Ok', image: '', value: 4, ratedAt: at(1).toISOString() }])
    );
    expect(getRatingHistory(MARIA).map((h) => h.movieId)).toEqual([3]);
  });

  it('limita o tamanho do histórico, mantendo as mais recentes', () => {
    for (let i = 1; i <= 205; i++) {
      recordRating(MARIA, { movieId: i, title: `Filme ${i}`, image: '', value: 3 }, new Date(Date.UTC(2026, 0, 1, 0, i)));
    }
    const history = getRatingHistory(MARIA);
    expect(history).toHaveLength(200);
    expect(history[0].movieId).toBe(205);
  });

  it('não quebra a aplicação quando o localStorage falha (ex.: cota cheia)', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => recordRating(MARIA, { movieId: 1, title: 'Duna', image: '', value: 4 })).not.toThrow();
    spy.mockRestore();
  });
});

describe('queryRatings (busca, filtro e ordenação do perfil)', () => {
  const list: RatedMovie[] = [
    { movieId: 1, title: 'Ação Total', image: '', value: 5, ratedAt: at(1).toISOString() },
    { movieId: 2, title: 'Bela Vista', image: '', value: 2, ratedAt: at(3).toISOString() },
    { movieId: 3, title: 'Corrida', image: '', value: 4.4, ratedAt: at(2).toISOString() },
  ];

  it('mantém a ordem mais recente por padrão', () => {
    expect(queryRatings(list, { search: '', rating: null, sort: 'recent' }).map((r) => r.movieId)).toEqual([2, 3, 1]);
  });

  it('busca por título ignorando maiúsculas e acentos', () => {
    expect(queryRatings(list, { search: 'acao', rating: null, sort: 'recent' }).map((r) => r.movieId)).toEqual([1]);
  });

  it('filtra pela nota arredondada', () => {
    expect(queryRatings(list, { search: '', rating: 4, sort: 'recent' }).map((r) => r.movieId)).toEqual([3]);
  });

  it('ordena por maior nota, menor nota e título', () => {
    expect(queryRatings(list, { search: '', rating: null, sort: 'rating-desc' }).map((r) => r.movieId)).toEqual([1, 3, 2]);
    expect(queryRatings(list, { search: '', rating: null, sort: 'rating-asc' }).map((r) => r.movieId)).toEqual([2, 3, 1]);
    expect(queryRatings(list, { search: '', rating: null, sort: 'title' }).map((r) => r.movieId)).toEqual([1, 2, 3]);
  });

  it('não altera a lista original', () => {
    const copy = [...list];
    queryRatings(list, { search: '', rating: null, sort: 'title' });
    expect(list).toEqual(copy);
  });
});

describe('withCatalogDetails (foto e título atuais do catálogo)', () => {
  const saved: RatedMovie[] = [
    { movieId: 1, title: 'Duna', image: 'antiga.jpg', value: 4, ratedAt: at(2).toISOString() },
    { movieId: 9, title: 'Filme #9', image: '', value: 5, ratedAt: at(1).toISOString() },
    { movieId: 5, title: 'Fora do catálogo', image: 'salva.jpg', value: 3, ratedAt: at(0).toISOString() },
  ];

  it('usa a foto e o título que o catálogo mostra para cada filme (pelo id)', () => {
    const result = withCatalogDetails(saved, [
      { id: 1, title: 'Duna', image: 'catalogo-duna.jpg' },
      { id: 9, title: 'Interestelar', image: 'catalogo-interestelar.jpg' },
    ]);
    expect(result.map((r) => [r.movieId, r.title, r.image])).toEqual([
      [1, 'Duna', 'catalogo-duna.jpg'],
      [9, 'Interestelar', 'catalogo-interestelar.jpg'],
      [5, 'Fora do catálogo', 'salva.jpg'],
    ]);
  });

  it('mantém os dados salvos quando o catálogo não tem foto ou não respondeu', () => {
    expect(withCatalogDetails(saved, [{ id: 1, title: 'Duna', image: '' }])[0].image).toBe('antiga.jpg');
    expect(withCatalogDetails(saved, [])).toEqual(saved);
  });

  it('preserva nota e data da avaliação', () => {
    const [first] = withCatalogDetails(saved, [{ id: 1, title: 'Duna', image: 'nova.jpg' }]);
    expect(first).toMatchObject({ value: 4, ratedAt: at(2).toISOString() });
  });
});
