export type CobrancaListaScope = 'a_pagar' | 'criadas';

export const COBRANCA_LISTA_SCOPE_LABELS: Record<CobrancaListaScope, string> = {
  a_pagar: 'Tenho que pagar',
  criadas: 'Criei para receber',
};
