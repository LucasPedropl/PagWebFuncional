import {
  LocalService,
  LocalServiceStore,
  PlanBenefitsStore,
  PlanServiceBenefit,
  ScheduledService,
  ScheduledServiceStore,
  ScheduledServiceStatus,
} from '../schemas/serviceTypes';

const SERVICES_KEY = 'pagweb_local_services';
const APPOINTMENTS_KEY = 'pagweb_local_scheduled_services';
const PLAN_BENEFITS_KEY = 'pagweb_local_plan_service_benefits';

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const readServices = (): LocalServiceStore => {
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) return { services: [] };
    const parsed = JSON.parse(raw) as LocalServiceStore;
    return Array.isArray(parsed.services) ? parsed : { services: [] };
  } catch {
    return { services: [] };
  }
};

const writeServices = (store: LocalServiceStore): void => {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(store));
};

const readAppointments = (): ScheduledServiceStore => {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) return { appointments: [] };
    const parsed = JSON.parse(raw) as ScheduledServiceStore;
    return Array.isArray(parsed.appointments) ? parsed : { appointments: [] };
  } catch {
    return { appointments: [] };
  }
};

const writeAppointments = (store: ScheduledServiceStore): void => {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(store));
};

const readPlanBenefits = (): PlanBenefitsStore => {
  try {
    const raw = localStorage.getItem(PLAN_BENEFITS_KEY);
    if (!raw) return { benefitsByPlanId: {} };
    const parsed = JSON.parse(raw) as PlanBenefitsStore;
    return parsed.benefitsByPlanId ? parsed : { benefitsByPlanId: {} };
  } catch {
    return { benefitsByPlanId: {} };
  }
};

const writePlanBenefits = (store: PlanBenefitsStore): void => {
  localStorage.setItem(PLAN_BENEFITS_KEY, JSON.stringify(store));
};

export const localServiceStore = {
  listServices(idEmpresa?: number): LocalService[] {
    const services = readServices().services;
    if (idEmpresa == null) return services;
    return services.filter((s) => s.idEmpresa === idEmpresa);
  },

  createService(input: Omit<LocalService, 'id' | 'createdAt'>): LocalService {
    const service: LocalService = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const store = readServices();
    store.services.push(service);
    writeServices(store);
    return service;
  },

  updateService(
    id: string,
    patch: Partial<Pick<LocalService, 'nome' | 'preco' | 'descricao' | 'duracaoMinutos'>>,
  ): LocalService | null {
    const store = readServices();
    const index = store.services.findIndex((s) => s.id === id);
    if (index < 0) return null;
    store.services[index] = { ...store.services[index], ...patch };
    writeServices(store);
    return store.services[index];
  },

  deleteService(id: string): boolean {
    const store = readServices();
    const next = store.services.filter((s) => s.id !== id);
    if (next.length === store.services.length) return false;
    writeServices({ services: next });
    return true;
  },

  listAppointments(filters?: {
    idEmpresa?: number;
    idUser?: number;
    status?: ScheduledServiceStatus;
  }): ScheduledService[] {
    let list = readAppointments().appointments;
    if (filters?.idEmpresa != null) {
      list = list.filter((a) => a.idEmpresa === filters.idEmpresa);
    }
    if (filters?.idUser != null) {
      list = list.filter((a) => a.idUser === filters.idUser);
    }
    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    return list.sort(
      (a, b) =>
        new Date(`${b.data}T${b.horario}`).getTime() -
        new Date(`${a.data}T${a.horario}`).getTime(),
    );
  },

  scheduleService(
    input: Omit<ScheduledService, 'id' | 'status' | 'createdAt'>,
    initialStatus: ScheduledServiceStatus = 'pendente',
  ): ScheduledService {
    const appointment: ScheduledService = {
      ...input,
      id: generateId(),
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };
    const store = readAppointments();
    store.appointments.push(appointment);
    writeAppointments(store);
    return appointment;
  },

  updateAppointmentStatus(
    id: string,
    status: ScheduledServiceStatus,
  ): ScheduledService | null {
    const store = readAppointments();
    const index = store.appointments.findIndex((a) => a.id === id);
    if (index < 0) return null;
    store.appointments[index] = { ...store.appointments[index], status };
    writeAppointments(store);
    return store.appointments[index];
  },

  cancelAppointment(id: string): ScheduledService | null {
    return this.updateAppointmentStatus(id, 'cancelado');
  },

  getPlanBenefits(planId: number): PlanServiceBenefit[] {
    return readPlanBenefits().benefitsByPlanId[String(planId)] ?? [];
  },

  savePlanBenefits(planId: number, benefits: PlanServiceBenefit[]): void {
    const store = readPlanBenefits();
    store.benefitsByPlanId[String(planId)] = benefits;
    writePlanBenefits(store);
  },

  benefitsToFuncionalidades(
    benefits: PlanServiceBenefit[],
    services: LocalService[],
  ): string[] {
    return benefits
      .map((b) => {
        const service = services.find((s) => s.id === b.serviceId);
        if (!service) return null;
        return `${b.quantidade}x ${service.nome} (incluso no plano)`;
      })
      .filter((item): item is string => item != null);
  },
};
