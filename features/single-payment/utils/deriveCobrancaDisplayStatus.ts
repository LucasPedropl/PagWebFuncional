import { parseDueDate } from '../../billing-rules/utils/lateCharges';
import { MensalidadeStatus } from '../schemas/cobrancaSchemas';
import { CobrancaStatusFilter } from '../types/cobrancaStatusFilter';

export type CobrancaDisplayStatusKey =
  | 'pago'
  | 'repassado'
  | 'cancelado'
  | 'atraso'
  | 'a_pagar'
  | 'a_receber';

export interface CobrancaDisplayStatus {
  key: CobrancaDisplayStatusKey;
  label: string;
  /** Status original da API — nunca mutado. */
  apiStatus: MensalidadeStatus;
}

const startOfDay = (date: Date): Date => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Deriva o status exibido a partir do status da API + vencimento local.
 * Não altera o valor retornado pelo backend.
 */
export const deriveCobrancaDisplayStatus = (
  apiStatus: MensalidadeStatus,
  dueDate: string | Date | null | undefined,
  view: 'client' | 'business',
  referenceDate: Date = new Date(),
): CobrancaDisplayStatus => {
  if (apiStatus === 'Pago') {
    return { key: 'pago', label: 'Pago', apiStatus };
  }
  if (apiStatus === 'Repassado') {
    return { key: 'repassado', label: 'Repassado', apiStatus };
  }
  if (apiStatus === 'Cancelado') {
    return { key: 'cancelado', label: 'Cancelado', apiStatus };
  }

  // Atrasado vindo da API é decisão explícita do estabelecimento
  // (PUT /api/Cobrancas/Status/{id}) e tem precedência sobre o vencimento
  // guardado localmente — senão uma data futura no localStorage mascararia
  // uma cobrança que a empresa marcou como vencida.
  if (apiStatus === 'Atrasado') {
    return { key: 'atraso', label: 'Atraso', apiStatus };
  }

  const due = parseDueDate(dueDate);
  if (due) {
    const today = startOfDay(referenceDate);
    if (due.getTime() < today.getTime()) {
      return { key: 'atraso', label: 'Atraso', apiStatus };
    }
    return view === 'client'
      ? { key: 'a_pagar', label: 'A pagar', apiStatus }
      : { key: 'a_receber', label: 'A receber', apiStatus };
  }

  return view === 'client'
    ? { key: 'a_pagar', label: 'A pagar', apiStatus }
    : { key: 'a_receber', label: 'A receber', apiStatus };
};

export const matchesCobrancaStatusFilter = (
  display: CobrancaDisplayStatus,
  filter: CobrancaStatusFilter,
): boolean => {
  if (filter === 'todos') return true;
  if (filter === 'emitido') return display.key !== 'cancelado';
  if (filter === 'pago') return display.key === 'pago' || display.key === 'repassado';
  if (filter === 'pendente') return display.key === 'a_pagar' || display.key === 'a_receber';
  if (filter === 'atrasado') return display.key === 'atraso';
  return true;
};

export const isCobrancaUnpaid = (display: CobrancaDisplayStatus): boolean =>
  display.key === 'a_pagar' || display.key === 'a_receber' || display.key === 'atraso';
