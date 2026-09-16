export const COBRANCA_STATUS_FILTERS = [
  'todos',
  'emitido',
  'pago',
  'pendente',
  'atrasado',
] as const;

export type CobrancaStatusFilter = (typeof COBRANCA_STATUS_FILTERS)[number];

export const isCobrancaStatusFilter = (value: string | null): value is CobrancaStatusFilter =>
  value !== null && (COBRANCA_STATUS_FILTERS as readonly string[]).includes(value);

export const COBRANCA_STATUS_FILTER_LABELS: Record<
  CobrancaStatusFilter,
  { business: string; client: string }
> = {
  todos: { business: 'Todos os status', client: 'Todos os status' },
  emitido: { business: 'Emitidas', client: 'Todas' },
  pago: { business: 'Pago', client: 'Pago' },
  pendente: { business: 'Aberto', client: 'Aberto' },
  atrasado: { business: 'Atrasado', client: 'Atrasado' },
};

export const cobrancaStatusFilterLabel = (
  filter: CobrancaStatusFilter,
  variant: 'business' | 'client',
): string => COBRANCA_STATUS_FILTER_LABELS[filter][variant];
