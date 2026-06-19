export interface LocalService {
  id: string;
  idEmpresa: number;
  nome: string;
  preco: number;
  descricao?: string;
  duracaoMinutos?: number;
  createdAt: string;
}

export interface PlanServiceBenefit {
  serviceId: string;
  quantidade: number;
}

export type ScheduledServiceStatus =
  | 'pendente'
  | 'confirmado'
  | 'concluido'
  | 'cancelado';

export interface ScheduledService {
  id: string;
  serviceId: string;
  serviceNome: string;
  idEmpresa: number;
  empresaNome: string;
  idUser: number;
  userNome: string;
  userEmail: string;
  preco: number;
  data: string;
  horario: string;
  status: ScheduledServiceStatus;
  observacao?: string;
  createdAt: string;
}

export interface LocalServiceStore {
  services: LocalService[];
}

export interface ScheduledServiceStore {
  appointments: ScheduledService[];
}

export interface PlanBenefitsStore {
  benefitsByPlanId: Record<string, PlanServiceBenefit[]>;
}
