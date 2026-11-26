import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { http, retryPolicy } from './http';
import {
  createMovie,
  fetchAllMovies,
  fetchMovieById,
  fetchMovies,
  getErrorMessage,
  isSessionExpired,
  login,
  register,
  saveRating,
  sendMovieProposal,
  toMoviePage,
} from './api';
import { saveToken } from 'utils/auth';

type Captured = InternalAxiosRequestConfig;

// Substitui o adapter HTTP do axios: nenhuma requisição real sai do teste,
// mas os interceptors (ex.: header Authorization) continuam sendo exercitados.
type Step = { status: number; data?: unknown } | 'network' | 'timeout';

// Respostas em sequência (a última se repete). 'network' = sem resposta; 'timeout' = tempo esgotado.
function mockSequence(steps: Step[]) {
  const calls: Captured[] = [];
  http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    calls.push(config);
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step === 'network') {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    }
    if (step === 'timeout') {
      throw new AxiosError('timeout of 90000ms exceeded', AxiosError.ECONNABORTED, config);
    }
    const response: AxiosResponse = {
      data: step.data ?? {},
      status: step.status,
      statusText: String(step.status),
      headers: {},
      config,
    };
    if (step.status >= 400) {
      throw new AxiosError('Request failed', String(step.status), config, null, response);
    }
    return response;
  };
  return calls;
}

function mockAdapter(data: unknown, status = 200) {
  return mockSequence([{ status, data }]);
}

const backendPage = {
  content: [{ id: 1, title: 'The Witcher', synopsis: null, image: 'img.jpg', score: 4.5, count: 2 }],
  page: 0,
  size: 12,
  totalElements: 13,
  totalPages: 2,
};

describe('toMoviePage', () => {
  it('adapta o MovieListResponse do backend para o MoviePage usado pela paginação', () => {
    const page = toMoviePage(backendPage);
    expect(page.number).toBe(0);
    expect(page.first).toBe(true);
    expect(page.last).toBe(false);
    expect(page.totalPages).toBe(2);
    expect(page.numberOfElements).toBe(1);
    expect(page.empty).toBe(false);
    expect(page.content[0].title).toBe('The Witcher');
  });

  it('marca a última página e página vazia corretamente', () => {
    const last = toMoviePage({ ...backendPage, page: 1 });
    expect(last.last).toBe(true);
    expect(last.first).toBe(false);

    const empty = toMoviePage({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 });
    expect(empty.empty).toBe(true);
    expect(empty.last).toBe(true);
  });
});

describe('endpoints da API GitCine', () => {
  it('GET /api/movies envia page e size', async () => {
    const calls = mockAdapter(backendPage);
    const page = await fetchMovies(1, 12);
    expect(calls[0].method).toBe('get');
    expect(calls[0].url).toBe('/api/movies');
    expect(calls[0].params).toEqual({ page: 1, size: 12 });
    expect(page.content).toHaveLength(1);
  });

  it('GET /api/movies/{id}', async () => {
    const calls = mockAdapter(backendPage.content[0]);
    const movie = await fetchMovieById('1');
    expect(calls[0].url).toBe('/api/movies/1');
    expect(movie.id).toBe(1);
  });

  it('POST /api/auth/login envia somente email (normalizado) e senha', async () => {
    const auth = { id: 1, name: 'Maria', email: 'maria@gmail.com', role: 'ADMIN', token: 'jwt' };
    const calls = mockAdapter(auth);
    const result = await login({ email: '  Maria@Gmail.com ', password: 'senha1234' });
    expect(calls[0].method).toBe('post');
    expect(calls[0].url).toBe('/api/auth/login');
    expect(JSON.parse(calls[0].data)).toEqual({ email: 'maria@gmail.com', password: 'senha1234' });
    expect(result.token).toBe('jwt');
  });

  it('POST /api/auth/register envia nome e email normalizados', async () => {
    const calls = mockAdapter({ id: 2, name: 'Ana', email: 'ana@x.com', role: 'USER', token: 't' });
    await register({ name: '  Ana ', email: ' ANA@x.com', password: 'senha1234' });
    expect(calls[0].url).toBe('/api/auth/register');
    expect(JSON.parse(calls[0].data)).toEqual({ name: 'Ana', email: 'ana@x.com', password: 'senha1234' });
  });

  it('POST /api/ratings envia movieId/value numéricos e o Bearer token', async () => {
    saveToken('jwt-user');
    const calls = mockAdapter({ movieId: 1, userId: 1, value: 4, movieScore: 4, movieCount: 1 });
    await saveRating(1, 4);
    expect(calls[0].url).toBe('/api/ratings');
    expect(JSON.parse(calls[0].data)).toEqual({ movieId: 1, value: 4 });
    expect(calls[0].headers.Authorization).toBe('Bearer jwt-user');
  });

  it('não envia Authorization quando não há token', async () => {
    const calls = mockAdapter(backendPage);
    await fetchMovies(0, 12);
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('não envia o token nas rotas públicas de autenticação', async () => {
    saveToken('jwt-antigo');
    const calls = mockAdapter({ id: 1, name: 'A', email: 'a@a.com', role: 'USER', token: 'novo' });
    await login({ email: 'a@a.com', password: 'senha1234' });
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('POST /api/admin/movies envia apenas title e image (sem espaços extras)', async () => {
    saveToken('jwt-admin');
    const calls = mockAdapter({ id: 9, title: 'Novo', image: 'x.jpg', score: 0, count: 0 }, 201);
    await createMovie({ title: ' Novo ', image: ' x.jpg ' });
    expect(calls[0].url).toBe('/api/admin/movies');
    expect(JSON.parse(calls[0].data)).toEqual({ title: 'Novo', image: 'x.jpg' });
    expect(calls[0].headers.Authorization).toBe('Bearer jwt-admin');
  });

  it('POST /api/movie-requests envia title e message', async () => {
    saveToken('jwt-user');
    const calls = mockAdapter('', 202);
    await sendMovieProposal({ title: 'Oppenheimer', message: 'Indicação' });
    expect(calls[0].url).toBe('/api/movie-requests');
    expect(JSON.parse(calls[0].data)).toEqual({ title: 'Oppenheimer', message: 'Indicação' });
  });
});

describe('fetchAllMovies (catálogo completo)', () => {
  const page = (n: number, totalPages: number, ids: number[]) => ({
    content: ids.map((id) => ({ id, title: `Filme ${id}`, image: '', score: 0, count: 0 })),
    page: n,
    size: 100,
    totalElements: 999,
    totalPages,
  });

  it('busca todas as páginas com o tamanho máximo e junta os filmes', async () => {
    const calls = mockSequence([
      { status: 200, data: page(0, 3, [1, 2]) },
      { status: 200, data: page(1, 3, [3]) },
      { status: 200, data: page(2, 3, [4]) },
    ]);
    const movies = await fetchAllMovies();
    expect(movies.map((m) => m.id)).toEqual([1, 2, 3, 4]);
    expect(calls.map((c) => c.params)).toEqual([
      { page: 0, size: 100 },
      { page: 1, size: 100 },
      { page: 2, size: 100 },
    ]);
  });

  it('faz uma única requisição quando o catálogo cabe em uma página', async () => {
    const calls = mockSequence([{ status: 200, data: page(0, 1, [1]) }]);
    expect(await fetchAllMovies()).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });
});

describe('getErrorMessage', () => {
  async function errorFrom(status: number, data: unknown = {}) {
    mockAdapter(data, status);
    try {
      await fetchMovies(0, 12);
    } catch (e) {
      return e;
    }
    throw new Error('esperava erro');
  }

  it('usa a mensagem específica configurada para o status', async () => {
    const err = await errorFrom(401, { message: 'Invalid credentials' });
    expect(getErrorMessage(err, 'padrão', { 401: 'E-mail ou senha inválidos.' })).toBe(
      'E-mail ou senha inválidos.'
    );
  });

  it('usa a mensagem do ApiError do backend quando não há mensagem específica', async () => {
    const err = await errorFrom(400, { message: 'password=Password must have between 8 and 24 characters' });
    expect(getErrorMessage(err, 'padrão')).toContain('Password must have');
  });

  it('informa problema de conexão quando não há resposta do servidor', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK', {} as InternalAxiosRequestConfig);
    expect(getErrorMessage(err, 'padrão')).toMatch(/conectar ao servidor/i);
  });

  it('usa o fallback para erros desconhecidos', () => {
    expect(getErrorMessage(new Error('x'), 'padrão')).toBe('padrão');
  });
});

describe('isSessionExpired', () => {
  async function failWith(status: number, action: () => Promise<unknown>) {
    mockAdapter({}, status);
    try {
      await action();
    } catch (e) {
      return e;
    }
    throw new Error('esperava erro');
  }

  it('é verdadeiro para 401 em requisição que levava o token', async () => {
    saveToken('jwt-expirado');
    const err = await failWith(401, () => saveRating(1, 5));
    expect(isSessionExpired(err)).toBe(true);
  });

  it('é falso para 401 do login (credenciais erradas) e para outros status', async () => {
    saveToken('jwt-qualquer');
    expect(isSessionExpired(await failWith(401, () => login({ email: 'a@a.com', password: 'x' })))).toBe(false);
    expect(isSessionExpired(await failWith(403, () => saveRating(1, 5)))).toBe(false);
    expect(isSessionExpired(new Error('x'))).toBe(false);
  });
});

describe('repetição automática de leituras (Render acordando)', () => {
  const originalDelays = [...retryPolicy.delaysMs];
  beforeEach(() => {
    retryPolicy.delaysMs = [0, 0, 0];
  });
  afterAll(() => {
    retryPolicy.delaysMs = originalDelays;
  });

  it('repete o GET após 503 e devolve os dados quando o servidor acorda', async () => {
    const calls = mockSequence([{ status: 503 }, { status: 503 }, { status: 200, data: backendPage }]);
    const page = await fetchMovies(0, 12);
    expect(calls).toHaveLength(3);
    expect(page.content[0].title).toBe('The Witcher');
  });

  it('repete o GET após erro de rede (resposta bloqueada enquanto o Render acorda)', async () => {
    const calls = mockSequence(['network', { status: 200, data: backendPage }]);
    await fetchMovies(0, 12);
    expect(calls).toHaveLength(2);
  });

  it('mantém o token nas repetições', async () => {
    saveToken('jwt-user');
    const calls = mockSequence([{ status: 502 }, { status: 200, data: backendPage.content[0] }]);
    await fetchMovieById(1);
    expect(calls[1].headers.Authorization).toBe('Bearer jwt-user');
  });

  it('desiste depois das tentativas configuradas e repassa o erro', async () => {
    const calls = mockSequence([{ status: 503 }]);
    await expect(fetchMovies(0, 12)).rejects.toMatchObject({ response: { status: 503 } });
    expect(calls).toHaveLength(4); // 1 tentativa + 3 repetições
  });

  it('nunca repete envios (POST), mesmo com 503', async () => {
    saveToken('jwt-user');
    const calls = mockSequence([{ status: 503 }]);
    await expect(saveRating(1, 5)).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toHaveLength(1);
  });

  it('não repete erros definitivos (404, 500) nem tempo esgotado', async () => {
    const steps: Step[] = [{ status: 404 }, { status: 500 }, 'timeout'];
    for (const step of steps) {
      const calls = mockSequence([step]);
      await expect(fetchMovies(0, 12)).rejects.toBeInstanceOf(AxiosError);
      expect(calls).toHaveLength(1);
    }
  });
});
