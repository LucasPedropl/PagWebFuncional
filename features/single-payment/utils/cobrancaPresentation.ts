import { calculateLateCharges } from '../../billing-rules/utils/lateCharges';
import { LateChargeBreakdown } from '../../billing-rules/schemas/billingRulesSchemas';
import { billingRulesService } from '../../billing-rules/services/billingRulesService';
import { Cobranca } from '../schemas/cobrancaSchemas';
import { localSinglePaymentStore } from '../services/localSinglePaymentStore';
import {
  CobrancaDisplayStatus,
  deriveCobrancaDisplayStatus,
  isCobrancaUnpaid,
} from './deriveCobrancaDisplayStatus';

export interface CobrancaPresentation {
  cobranca: Cobranca;
  dueDate: string | null;
  displayStatus: CobrancaDisplayStatus;
  lateCharges: LateChargeBreakdown;
  displayAmount: number;
}

const resolveIdEmpresa = (cobranca: Cobranca): number | null =>
  cobranca.idEmpresa ?? cobranca.empresa?.idEmpresa ?? null;

export const presentCobranca = (
  cobranca: Cobranca,
  view: 'client' | 'business',
  referenceDate: Date = new Date(),
): CobrancaPresentation => {
  const dueDate = localSinglePaymentStore.getCobrancaDueDate(cobranca);
  const displayStatus = deriveCobrancaDisplayStatus(
    cobranca.status,
    dueDate,
    view,
    referenceDate,
  );
  const skipLateCharges = !isCobrancaUnpaid(displayStatus) || displayStatus.key !== 'atraso';
  const lateCharges = calculateLateCharges({
    valorOriginal: cobranca.valorTotal,
    vencimento: dueDate,
    rules: billingRulesService.getRulesSync(resolveIdEmpresa(cobranca)),
    referenceDate,
    skipLateCharges,
  });
  const displayAmount =
    displayStatus.key === 'atraso' && lateCharges.isAtrasado
      ? lateCharges.valorAtualizado
      : cobranca.valorTotal;

  return { cobranca, dueDate, displayStatus, lateCharges, displayAmount };
};

export const formatCobrancaCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
