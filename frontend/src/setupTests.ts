// Configuração global dos testes (Jest + React Testing Library).
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// O React Router v7 usa TextEncoder/TextDecoder, que não existem no jsdom do Jest 27.
Object.assign(global, { TextEncoder, TextDecoder });

beforeEach(() => {
  localStorage.clear();
});
