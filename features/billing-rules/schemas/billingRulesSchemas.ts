import { z } from 'zod';

/**
 * Régua de cobrança: gatilhos de notificação automática relativos ao vencimento.
 * A API atual não persiste estas regras — armazenadas por empresa no localStorage
 * até que exista endpoint dedicado (ver docs/Relatorio_Bugs_Melhorias_PagWeb.md).
 */
export const ReguaCobrancaSchema = z.object({
  cincoDiasAntes: z.boolean(),
  doisDiasAntes: z.boolean(),
  noVencimento: z.boolean(),
  aposVencimento: z.boolean(),
});

export type ReguaCobranca = z.infer<typeof ReguaCobrancaSchema>;

const percentField = (label: string) =>
  z
    .number({ invalid_type_error: `${label} deve ser um número` })
    .min(0, `${label} não pode ser negativa`)
    .max(100, `${label} não pode passar de 100%`);

export const BillingRulesSchema = z.object({
  /** Taxa padrão aplicada sobre o valor da cobrança (%). */
  taxaPadraoPercent: percentField('Taxa padrão'),
  /** Multa única aplicada uma vez após o vencimento (%). */
  multaAtrasoPercent: percentField('Multa por atraso'),
  /** Juros ao mês, rateados por dia corrido de atraso (%). */
  jurosAtrasoMesPercent: percentField('Juros por atraso'),
  reguaCobranca: ReguaCobrancaSchema,
  /** Texto padrão anexado ao corpo dos e-mails de cobrança. */
  templateEmail: z.string().max(2000, 'Template de e-mail muito longo'),
  /** Texto padrão anexado às mensagens de WhatsApp. */
  templateWhatsapp: z.string().max(1000, 'Template de WhatsApp muito longo'),
});

export type BillingRules = z.infer<typeof BillingRulesSchema>;

export const DEFAULT_BILLING_RULES: BillingRules = {
  taxaPadraoPercent: 0,
  multaAtrasoPercent: 2,
  jurosAtrasoMesPercent: 1,
  reguaCobranca: {
    cincoDiasAntes: true,
    doisDiasAntes: true,
    noVencimento: true,
    aposVencimento: true,
  },
  templateEmail: '',
  templateWhatsapp: '',
};

/** Resultado do cálculo de inadimplência de uma cobrança vencida. */
export interface LateChargeBreakdown {
  /** Dias corridos entre o vencimento e a data de referência (0 se em dia). */
  diasAtraso: number;
  valorOriginal: number;
  /** Taxa padrão sobre o valor original. */
  taxa: number;
  /** Multa única (aplicada somente se houver atraso). */
  multa: number;
  /** Juros pro rata die sobre o valor original. */
  juros: number;
  /** valorOriginal + taxa + multa + juros, arredondado em centavos. */
  valorAtualizado: number;
  isAtrasado: boolean;
}
