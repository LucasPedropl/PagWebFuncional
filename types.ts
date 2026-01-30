
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

// Interfaces de Negócio (Planos e Assinaturas)

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
  dataInicial: string; // ISO String
  dataFinal: string; // ISO String
  desconto: number;
  observacao: string;
}

export interface SubscriptionResponse {
  idAssinatura: number;
  nomeCliente: string;
  nomePlano: string;
  idPlano: number;
  periodo: number;
  dataInicial: string;
  dataFinal: string;
  valorComDesconto: number;
  status: string;
  
  // Campos opcionais/legados para compatibilidade
  idUser?: number;
  observacao?: string;
  desconto?: number;
  user?: User;
}

export interface Mensalidade {
  idMensalidade: number;
  nomeCliente: string;
  emailCliente: string;
  vencimento: string; // Formato DD/MM/YYYY
  metodo: string;
  valor: number;
  status: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}