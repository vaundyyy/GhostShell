import { getToken, removeToken, saveToken, toFrontendRole } from './auth';

describe('utils/auth', () => {
  it('salva, lê e remove o token JWT', () => {
    saveToken('jwt-123');
    expect(getToken()).toBe('jwt-123');
    removeToken();
    expect(getToken()).toBeNull();
  });

  it('converte a role do backend para o formato usado no frontend', () => {
    expect(toFrontendRole('ADMIN')).toBe('admin');
    expect(toFrontendRole('admin')).toBe('admin');
    expect(toFrontendRole('USER')).toBe('user');
    expect(toFrontendRole(undefined)).toBe('user');
  });
});
