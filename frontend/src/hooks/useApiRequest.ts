import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { getErrorMessage, isSessionExpired, SESSION_EXPIRED_MESSAGE } from 'services/api';

// State enviado à tela de login ao redirecionar (PrivateRoute usa `from`; este hook também envia `message`).
export type LoginRedirectState = {
  from?: { pathname: string };
  message?: string;
};

export type ApiRequestOptions = {
  fallback: string; // mensagem usada quando não há uma mais específica
  messages?: Partial<Record<number, string>>; // mensagens da tela por status HTTP
  onError?: (message: string) => void;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false };

// Executa chamadas à API com o mesmo comportamento em todas as telas:
// - `pending` para desabilitar botões/mostrar "Enviando...";
// - ignora novos envios enquanto um ainda está em andamento (evita duplo clique);
// - traduz erros em mensagens amigáveis;
// - se o JWT expirou (401 numa requisição autenticada), faz logout e leva ao login com aviso.
export function useApiRequest() {
  const { authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async <T>(request: () => Promise<T>, { fallback, messages, onError }: ApiRequestOptions): Promise<ApiResult<T>> => {
      if (inFlight.current) {
        return { ok: false };
      }
      inFlight.current = true;
      setPending(true);

      try {
        return { ok: true, data: await request() };
      } catch (error) {
        if (authenticated && isSessionExpired(error)) {
          logout();
          const state: LoginRedirectState = { from: location, message: SESSION_EXPIRED_MESSAGE };
          navigate('/login', { replace: true, state });
        } else {
          onError?.(getErrorMessage(error, fallback, messages));
        }
        return { ok: false };
      } finally {
        inFlight.current = false;
        if (mounted.current) {
          setPending(false);
        }
      }
    },
    [authenticated, logout, navigate, location]
  );

  return { run, pending };
}
