
export interface User {
  idUser?: number;
  nome: string;
  email: string;
  tipo: string;
  cpf?: string;
  sobreNome?: string;
  status?: string;
  telefone?: string; // Campo adicionado
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
  fotoPerfil?: File | null;
}

export interface CompanyCreationPayload {
  nome: string;
  cnpj: string;
  telefone: string;
  logo?: File | null;
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
  Email: string;
  Password: string;
}

export interface CompanyLoginPayload {
  Email: string;
  Password: string;
}

// Interfaces de Negócio (Planos e Assinaturas)

export interface PlanPayload {
  nome: string;
  valorMensalidade: number;
  percentualMulta: number;
  percentualJurosMensal: number;
  funcionalidades: string[];
  arquivoContrato?: File | null;
}

export interface PlanResponse {
  idPlano: number;
  nome: string;
  valorMensalidade: number;
  percentualMulta: number;
  percentualJurosMensal: number;
  funcionalidades: string[];
  contratoPath?: string | null;
}

export interface SubscriptionPayload {
  idUser: number;
  idPlano: number;
  periodo: number; // em meses
  dataInicio: string; // ISO String (Corrigido de dataInicial)
  dataFim: string; // ISO String (Corrigido de dataFinal)
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
  contratoPath?: string | null;
  
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

// --- Novos Tipos para Área do Cliente ---

export interface ClientConnection {
  idEmpresa: number; // Adicionado para permitir desvínculo
  nomeEmpresa: string;
  cnpjEmpresa: string;
  emailEmpresa: string;
  nomeDono: string;
  status: string;
}

export interface ClientSubscription {
  idAssinatura: number;
  nomePlano: string;
  nomeEmpresa: string;
  dataInicio: string; // ISO
  dataFim: string; // ISO
  valorMensal: number;
  status: string;
  contratoPath?: string | null;
  // Optional fields that might come from the API for details
  descricaoPlano?: string;
  beneficios?: string[];
  nomeDono?: string;
  emailEmpresa?: string;
  cnpjEmpresa?: string;
}

export interface ClientInvoice {
  idMensalidade: number;
  nomeEmpresa: string;
  nomeAdmin: string;
  vencimento: string; // DD/MM/YYYY
  mesReferencia: string;
  metodo: string;
  valor: number;
  status: string;
}

export interface SavedCard {
  idCartao: number;
  idUser: number;
  usuario?: any;
  nomeNoCartao: string;
  numCartao: string;
  ultimosDigitos: string;
  ccv: string;
  bandeira: string;
  mesAnoExpiracao: string;
  isDefault: boolean;
  dataCriacao?: string;
}

export interface AppNotification {
  id: number;
  titulo: string;
  mensagem: string;
  dataCadastro: string; // ISO date
  lida: boolean;
  tipo?: 'info' | 'success' | 'warning' | 'error';
}

export interface NotificationSettings {
  notificações: boolean;
  email: boolean;
  whatsApp: boolean;
  sms: boolean;
}
