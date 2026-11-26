// Contratos de autenticação do backend GitCine (application/dto/auth).

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  token: string;
};
