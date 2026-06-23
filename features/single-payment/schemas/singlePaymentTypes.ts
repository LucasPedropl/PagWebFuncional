export type SinglePaymentStatus = 'Pendente' | 'Aberto' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface SinglePayment {
  id: string;
  idEmpresa: number;
  empresaNome: string;
  idUser: number;
  userNome: string;
  userEmail: string;
  descricaoServico: string;
  valor: number;
  observacao?: string;
  vencimento: string;
  status: SinglePaymentStatus;
  createdAt: string;
  acceptedAt?: string;
}

export interface SinglePaymentStore {
  payments: SinglePayment[];
}

export interface CreateSinglePaymentInput {
  idEmpresa: number;
  empresaNome: string;
  idUser: number;
  userNome: string;
  userEmail: string;
  descricaoServico: string;
  valor: number;
  observacao?: string;
  vencimento?: string;
}
