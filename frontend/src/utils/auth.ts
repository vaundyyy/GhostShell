// Persistência do token JWT retornado pelo backend (POST /api/auth/login e /register).

const TOKEN_KEY = '@GitCine:token';

export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// O backend devolve a role como "USER" ou "ADMIN"; o AuthContext trabalha com 'user' | 'admin'.
export const toFrontendRole = (role?: string | null): 'user' | 'admin' => {
  return role?.toUpperCase() === 'ADMIN' ? 'admin' : 'user';
};
