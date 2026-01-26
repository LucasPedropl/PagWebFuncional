export interface User {
  nome: string;
  email: string;
  tipo: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  nome: string;
  sobreNome: string;
  cpf: string;
  email: string;
  password: string;
  telefone: string;
}

export interface CompanyRegisterPayload {
  nome: string;
  cnpj: string;
  email: string;
  password: string;
  telefone: string;
}

export interface ActivatePayload {
  email: string;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CompanyLoginPayload {
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}