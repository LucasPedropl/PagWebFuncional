/**
 * @deprecated Mock localStorage — cobranças avulsas agora usam a API
 * (`cobrancaService` / `useCobrancas` / `useUserCobrancas`).
 * Mantido apenas para não quebrar imports residuais.
 */
export { useCobrancas as useSinglePayments } from './useCobrancas';
