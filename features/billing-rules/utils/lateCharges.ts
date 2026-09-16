import {
  BillingRules,
  DEFAULT_BILLING_RULES,
  LateChargeBreakdown,
} from '../schemas/billingRulesSchemas';

const MS_PER_DAY = 86_400_000;

const roundCents = (value: number): number => Math.round(value * 100) / 100;

const startOfDay = (date: Date): Date => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Aceita "dd/MM/yyyy", "yyyy-MM-dd" ou ISO completo. Retorna null se inválido. */
export const parseDueDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : startOfDay(value);

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, day, month, year] = br;
    return startOfDay(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return startOfDay(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : startOfDay(fallback);
};

export const diasDeAtraso = (
  vencimento: string | Date | null | undefined,
  referenceDate: Date = new Date(),
): number => {
  const due = parseDueDate(vencimento);
  if (!due) return 0;
  const diff = startOfDay(referenceDate).getTime() - due.getTime();
  return diff <= 0 ? 0 : Math.floor(diff / MS_PER_DAY);
};

interface CalculateLateChargesParams {
  valorOriginal: number;
  vencimento: string | Date | null | undefined;
  rules?: BillingRules;
  referenceDate?: Date;
  /** Cobranças já quitadas/canceladas não recebem multa nem juros. */
  skipLateCharges?: boolean;
}

/**
 * Multa = percentual único sobre o principal, aplicada a partir do 1º dia de atraso.
 * Juros = percentual ao mês rateado por dia corrido (pro rata die, base 30 dias).
 * A taxa padrão incide sempre, independente de atraso.
 */
export const calculateLateCharges = ({
  valorOriginal,
  vencimento,
  rules = DEFAULT_BILLING_RULES,
  referenceDate = new Date(),
  skipLateCharges = false,
}: CalculateLateChargesParams): LateChargeBreakdown => {
  const principal = Number.isFinite(valorOriginal) && valorOriginal > 0 ? valorOriginal : 0;
  const taxa = roundCents((principal * rules.taxaPadraoPercent) / 100);
  const dias = skipLateCharges ? 0 : diasDeAtraso(vencimento, referenceDate);

  if (dias <= 0) {
    return {
      diasAtraso: 0,
      valorOriginal: principal,
      taxa,
      multa: 0,
      juros: 0,
      valorAtualizado: roundCents(principal + taxa),
      isAtrasado: false,
    };
  }

  const multa = roundCents((principal * rules.multaAtrasoPercent) / 100);
  const juros = roundCents((principal * (rules.jurosAtrasoMesPercent / 100 / 30)) * dias);

  return {
    diasAtraso: dias,
    valorOriginal: principal,
    taxa,
    multa,
    juros,
    valorAtualizado: roundCents(principal + taxa + multa + juros),
    isAtrasado: true,
  };
};
