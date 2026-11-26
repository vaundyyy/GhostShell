// Utilitários compartilhados pelos testes (não fazem parte do bundle da aplicação).
import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthProvider } from 'contexts/AuthContext';

type RenderOptions = {
  route?: string;
  path?: string;
  state?: unknown;
  extraRoutes?: { path: string; element: ReactElement }[];
};

// Renderiza a tela com AuthProvider + roteador em memória (com rotas extras para testar redirecionamentos).
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path = '/', state, extraRoutes = [] }: RenderOptions = {}
) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: route, state }]}>
        <Routes>
          <Route path={path} element={ui} />
          {extraRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

// Simula uma sessão já autenticada (mesmas chaves usadas pelo AuthContext).
export function loginAs(role: 'user' | 'admin', email = 'user@gitcine.com') {
  localStorage.setItem('@GitCine:token', 'jwt-test');
  localStorage.setItem('@GitCine:role', role);
  localStorage.setItem('@GitCine:email', email);
}

// Cria um erro HTTP igual ao que o axios lança. `authorized` indica que a requisição levava o JWT.
export function makeHttpError(status: number, { data = {}, authorized = false }: { data?: unknown; authorized?: boolean } = {}) {
  const config = {
    headers: new AxiosHeaders(authorized ? { Authorization: 'Bearer jwt-test' } : {}),
  } as InternalAxiosRequestConfig;
  const response = { status, data, config, headers: {}, statusText: String(status) } as AxiosResponse;
  return new AxiosError(`Request failed with status code ${status}`, String(status), config, null, response);
}

// Promise controlada manualmente (para simular respostas fora de ordem).
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Tela "falsa" usada como destino de redirecionamento; mostra a mensagem recebida no state.
export function RedirectProbe({ label }: { label: string }) {
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  return <div>{message ? `${label}: ${message}` : label}</div>;
}
