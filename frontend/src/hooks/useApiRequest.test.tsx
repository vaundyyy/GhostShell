import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApiRequest } from './useApiRequest';
import { deferred, loginAs, makeHttpError, RedirectProbe, renderWithProviders } from 'test-utils';

// Componente mínimo para exercitar o hook como uma tela real faria.
function Harness({ request }: { request: () => Promise<string> }) {
  const { run, pending } = useApiRequest();
  const [error, setError] = useState('');
  const [data, setData] = useState('');

  const handleClick = async () => {
    const result = await run(request, {
      fallback: 'Falha genérica.',
      messages: { 409: 'Já existe.' },
      onError: setError,
    });
    if (result.ok) setData(result.data);
  };

  return (
    <div>
      <button onClick={handleClick}>executar</button>
      {pending && <span>carregando</span>}
      {error && <p>erro: {error}</p>}
      {data && <p>dados: {data}</p>}
    </div>
  );
}

function renderHarness(request: () => Promise<string>) {
  renderWithProviders(<Harness request={request} />, {
    route: '/filmes',
    path: '/filmes',
    extraRoutes: [{ path: '/login', element: <RedirectProbe label="Tela de login" /> }],
  });
}

describe('useApiRequest', () => {
  it('devolve os dados e controla o estado de carregamento', async () => {
    const pending = deferred<string>();
    renderHarness(() => pending.promise);

    userEvent.click(screen.getByText('executar'));
    expect(await screen.findByText('carregando')).toBeInTheDocument();

    pending.resolve('ok');
    expect(await screen.findByText('dados: ok')).toBeInTheDocument();
    expect(screen.queryByText('carregando')).not.toBeInTheDocument();
  });

  it('traduz o erro usando as mensagens da tela', async () => {
    renderHarness(() => Promise.reject(makeHttpError(409)));
    userEvent.click(screen.getByText('executar'));
    expect(await screen.findByText('erro: Já existe.')).toBeInTheDocument();
  });

  it('ignora cliques repetidos enquanto a requisição está em andamento (evita duplo envio)', async () => {
    const pending = deferred<string>();
    const request = jest.fn(() => pending.promise);
    renderHarness(request);

    userEvent.click(screen.getByText('executar'));
    userEvent.click(screen.getByText('executar'));
    pending.resolve('ok');

    expect(await screen.findByText('dados: ok')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('com sessão expirada (401 em requisição autenticada) faz logout e redireciona para o login', async () => {
    loginAs('user');
    renderHarness(() => Promise.reject(makeHttpError(401, { authorized: true })));

    userEvent.click(screen.getByText('executar'));

    expect(await screen.findByText(/tela de login: sua sessão expirou/i)).toBeInTheDocument();
    expect(localStorage.getItem('@GitCine:token')).toBeNull();
    expect(localStorage.getItem('@GitCine:role')).toBeNull();
  });

  it('401 sem token (ex.: senha errada no login) não derruba a sessão: só mostra o erro', async () => {
    loginAs('user');
    renderHarness(() => Promise.reject(makeHttpError(401)));

    userEvent.click(screen.getByText('executar'));

    expect(await screen.findByText(/^erro:/)).toBeInTheDocument();
    expect(localStorage.getItem('@GitCine:token')).toBe('jwt-test');
  });
});
