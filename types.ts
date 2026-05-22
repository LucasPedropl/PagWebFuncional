
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
  telefone?: string;
  logo?: string | null;
  statusConexao?: string;
  status?: number;
}

export interface CompanyUpdatePayload {
  nome?: string;
  cnpj?: string;
  telefone?: string;
  logo?: File | null;
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

export interface UserAccountResponse {
  idUser: number;
  nome: string;
  sobreNome: string;
  email: string;
  cpf: string;
  telefone: string;
  fotoPerfilPath: string | null;
  status: number;
  dataAdesao: string;
}

export interface UserUpdatePayload {
  nome?: string;
  sobreNome?: string;
  email?: string;
  password?: string;
  telefone?: string;
  fotoPerfil?: File | null;
}

// Interfaces de Negócio (Planos e Assinaturas)

export interface PlanPayload {
  nome: string;
  valorMensalidade: number;
  percentualMulta: number;
  percentualJurosMensal: number;
  funcionalidades: string[];
  arquivoContrato?: File | null;
  tipoContrato?: number;
  cancelamentoDias?: number;
  assinarPorCliente?: boolean;
}

export interface PlanResponse {
  idPlano: number;
  nome: string;
  valorMensalidade: number;
  percentualMulta: number;
  percentualJurosMensal: number;
  funcionalidades: string[];
  contratoPath?: string | null;
  tipoContrato?: number;
  cancelamentoDias?: number;
  cancelamento?: number;
  assinarPorCliente?: boolean;
}

export interface SubscriptionPayload {
  idUser: number;
  idPlano: number;
  periodo: number; // em meses (0 = recorrente)
  diaPagamento: number;
  desconto: number;
  tipoDesconto?: number;
  observacao: string;
}

export interface AssinarPlanoPayload {
  idPlano: number;
  idUser?: number;
  periodo: number;
  diaPagamento: number;
  desconto?: number;
  tipoDesconto?: number;
  observacao?: string;
  contrato?: File | null;
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
  contrato?: string | null;
  
  // Campos opcionais/legados para compatibilidade
  idUser?: number;
  observacao?: string;
  desconto?: number;
  tipoDesconto?: number;
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
  logo?: string | null;
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
  contrato?: string | null;
  idPlano?: number;
  periodo?: number;
  diaPagamento?: number;
  tipoContratoPlano?: number;
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
  notificacoes: boolean;
  email: boolean;
  whatsApp: boolean;
  sms: boolean;
}
