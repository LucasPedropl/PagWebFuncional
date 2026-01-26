export interface User {
  idUser?: number;
  nome: string;
  email: string;
  tipo: string;
  cpf?: string;
  sobreNome?: string;
  status?: string;
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

export interface CompanyCreationPayload {
  nome: string;
  cnpj: string;
  email: string;
  password: string;
  telefone: string;
}

export interface CompanyResponse {
  idEmpresa: number;
  nome: string;
  cnpj: string;
  status: number;
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

// Novos Tipos para Business Service

export interface PlanPayload {
  nome: string;
  valorMensalidade: number;
  funcionalidades: string[];
}

export interface PlanResponse {
  idPlano: number;
  nome: string;
  valorMensalidade: number;
  funcionalidades: string[];
}

export interface SubscriptionPayload {
  idUser: number;
  idPlano: number;
  periodo: number; // em meses
  dataInicio: string; // ISO String
  dataFim: string; // ISO String
  desconto: number;
  observacao: string;
}

export interface SubscriptionResponse {
  idAssinatura: number;
  idUser: number;
  idPlano: number;
  periodo: number;
  dataInicio: string;
  dataFim: string;
  desconto: number;
  observacao: string;
  user?: User;      // Assumindo que a API retorna ou faremos o match manual
  plano?: PlanResponse; // Assumindo que a API retorna ou faremos o match manual
  valorFinal?: number; // Calculado no front se nao vier
  status?: string; // Calculado no front
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}