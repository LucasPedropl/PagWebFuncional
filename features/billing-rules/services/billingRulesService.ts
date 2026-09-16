import {
  BillingRules,
  BillingRulesSchema,
  DEFAULT_BILLING_RULES,
} from '../schemas/billingRulesSchemas';

const STORAGE_PREFIX = 'pagweb_billing_rules';

/**
 * A API (/api, somente leitura para o frontend) ainda não expõe endpoint de
 * parametrização de cobrança. Persistimos por empresa no localStorage mantendo
 * a mesma assinatura async de um service de rede, para que a troca por HTTP
 * futuramente não exija mudar os consumidores.
 */
const storageKey = (idEmpresa: number | null): string =>
  idEmpresa && idEmpresa > 0 ? `${STORAGE_PREFIX}_${idEmpresa}` : STORAGE_PREFIX;

const readRules = (idEmpresa: number | null): BillingRules => {
  try {
    const raw = localStorage.getItem(storageKey(idEmpresa));
    if (!raw) return DEFAULT_BILLING_RULES;
    const parsed = BillingRulesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_BILLING_RULES;
  } catch {
    return DEFAULT_BILLING_RULES;
  }
};

export const billingRulesService = {
  /** Leitura síncrona — use quando já estiver dentro de um cálculo. */
  getRulesSync(idEmpresa: number | null = null): BillingRules {
    return readRules(idEmpresa);
  },

  async getRules(idEmpresa: number | null = null): Promise<BillingRules> {
    return readRules(idEmpresa);
  },

  async saveRules(idEmpresa: number | null, rules: BillingRules): Promise<BillingRules> {
    const parsed = BillingRulesSchema.parse(rules);
    localStorage.setItem(storageKey(idEmpresa), JSON.stringify(parsed));
    return parsed;
  },

  clearRules(idEmpresa: number | null = null): void {
    localStorage.removeItem(storageKey(idEmpresa));
  },
};
