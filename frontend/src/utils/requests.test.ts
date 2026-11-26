import { normalizeBaseUrl, DEFAULT_BACKEND_URL } from './requests';

describe('normalizeBaseUrl', () => {
  it('remove barras finais da URL do backend', () => {
    expect(normalizeBaseUrl('https://ghostshell-43el.onrender.com/')).toBe(
      'https://ghostshell-43el.onrender.com'
    );
    expect(normalizeBaseUrl('http://localhost:8080//')).toBe('http://localhost:8080');
  });

  it('usa a URL padrão quando a variável de ambiente não está definida ou está vazia', () => {
    expect(normalizeBaseUrl(undefined)).toBe(DEFAULT_BACKEND_URL);
    expect(normalizeBaseUrl('   ')).toBe(DEFAULT_BACKEND_URL);
  });
});
