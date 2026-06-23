import {
  CreateSinglePaymentInput,
  SinglePayment,
  SinglePaymentStatus,
  SinglePaymentStore,
} from '../schemas/singlePaymentTypes';

const STORAGE_KEY = 'pagweb_local_single_payments';

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatDateBR = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateBR = (value: string): Date | null => {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const resolveStatus = (payment: SinglePayment): SinglePaymentStatus => {
  if (
    payment.status === 'Pago' ||
    payment.status === 'Cancelado' ||
    payment.status === 'Pendente'
  ) {
    return payment.status;
  }
  const due = parseDateBR(payment.vencimento);
  if (!due) return payment.status;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today ? 'Atrasado' : 'Aberto';
};

const readStore = (): SinglePaymentStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { payments: [] };
    const parsed = JSON.parse(raw) as SinglePaymentStore;
    return Array.isArray(parsed.payments) ? parsed : { payments: [] };
  } catch {
    return { payments: [] };
  }
};

const writeStore = (store: SinglePaymentStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const localSinglePaymentStore = {
  listPayments(filters?: {
    idEmpresa?: number;
    idUser?: number;
    userEmail?: string;
    status?: SinglePaymentStatus;
  }): SinglePayment[] {
    let payments = readStore().payments.map((p) => ({
      ...p,
      status: resolveStatus(p),
    }));

    if (filters?.idEmpresa != null) {
      payments = payments.filter((p) => p.idEmpresa === filters.idEmpresa);
    }

    if (filters?.idUser != null || filters?.userEmail) {
      const targetId = filters.idUser != null ? Number(filters.idUser) : 0;
      const targetEmail = filters.userEmail?.trim().toLowerCase() ?? '';

      payments = payments.filter((p) => {
        if (targetId > 0 && Number(p.idUser) === targetId) return true;
        if (targetEmail && p.userEmail.trim().toLowerCase() === targetEmail) return true;
        return false;
      });
    }

    if (filters?.status != null) {
      payments = payments.filter((p) => p.status === filters.status);
    }

    return payments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  createPayment(input: CreateSinglePaymentInput): SinglePayment {
    const dueDate = input.vencimento
      ? input.vencimento
      : formatDateBR(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const payment: SinglePayment = {
      id: generateId(),
      idEmpresa: input.idEmpresa,
      empresaNome: input.empresaNome,
      idUser: input.idUser,
      userNome: input.userNome,
      userEmail: input.userEmail,
      descricaoServico: input.descricaoServico.trim(),
      valor: input.valor,
      observacao: input.observacao?.trim() || undefined,
      vencimento: dueDate,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    };

    const store = readStore();
    store.payments.push(payment);
    writeStore(store);
    return payment;
  },

  markAsPaid(id: string): SinglePayment | null {
    const store = readStore();
    const index = store.payments.findIndex((p) => p.id === id);
    if (index < 0) return null;
    store.payments[index] = { ...store.payments[index], status: 'Pago' };
    writeStore(store);
    return store.payments[index];
  },

  acceptPayment(id: string): SinglePayment | null {
    const store = readStore();
    const index = store.payments.findIndex((p) => p.id === id);
    if (index < 0) return null;
    if (store.payments[index].status !== 'Pendente') {
      return store.payments[index];
    }
    store.payments[index] = {
      ...store.payments[index],
      status: 'Aberto',
      acceptedAt: new Date().toISOString(),
    };
    writeStore(store);
    return store.payments[index];
  },

  cancelPayment(id: string): SinglePayment | null {
    const store = readStore();
    const index = store.payments.findIndex((p) => p.id === id);
    if (index < 0) return null;
    store.payments[index] = { ...store.payments[index], status: 'Cancelado' };
    writeStore(store);
    return store.payments[index];
  },
};
