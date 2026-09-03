import { z } from 'zod';

/** Ordem do enum C# MensalidadeStatus (sem JsonStringEnumConverter → número). */
export const MENSALIDADE_STATUS_VALUES = [
  'Aberto',
  'Pago',
  'Repassado',
  'Atrasado',
  'Cancelado',
] as const;

export const MensalidadeStatusEnum = z.enum(MENSALIDADE_STATUS_VALUES);
export type MensalidadeStatus = z.infer<typeof MensalidadeStatusEnum>;

/** Ordem do enum C# MetodoPagamento. */
export const METODO_PAGAMENTO_VALUES = [
  'PIX',
  'Cartao',
  'Boleto',
  'Transferencia',
  'Dinheiro',
  'BoletoPix',
  'PixCaixa',
] as const;

export const MetodoPagamentoEnum = z.enum(METODO_PAGAMENTO_VALUES);
export type MetodoPagamento = z.infer<typeof MetodoPagamentoEnum>;

export const METODO_PAGAMENTO_TO_API: Record<MetodoPagamento, number> = {
  PIX: 0,
  Cartao: 1,
  Boleto: 2,
  Transferencia: 3,
  Dinheiro: 4,
  BoletoPix: 5,
  PixCaixa: 6,
};

/** Aceita status como número (API) ou string. */
export const MensalidadeStatusCoerced = z.preprocess((value) => {
  if (typeof value === 'number') {
    return MENSALIDADE_STATUS_VALUES[value] ?? value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return MENSALIDADE_STATUS_VALUES[Number(value)] ?? value;
  }
  return value;
}, MensalidadeStatusEnum);

export const CobrancaUsuarioSchema = z.object({
  idUser: z.number(),
  nome: z.string(),
  email: z.string(),
  cpf: z.string().optional().nullable(),
});

export const CobrancaEmpresaSchema = z.object({
  idEmpresa: z.number(),
  nome: z.string(),
  cnpj: z.string().optional().nullable(),
});

export const CobrancaItemSchema = z.object({
  id: z.number(),
  nome: z.string(),
  preco: z.number(),
});

export const CobrancaSchema = z.object({
  id: z.number(),
  idEmpresa: z.number().optional(),
  valorTotal: z.number(),
  observacao: z.string().optional().nullable(),
  descricao: z.string(),
  status: MensalidadeStatusCoerced,
  usuario: CobrancaUsuarioSchema.optional(),
  empresa: CobrancaEmpresaSchema.optional(),
  produtos: z
    .array(CobrancaItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  servicos: z
    .array(CobrancaItemSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type Cobranca = z.infer<typeof CobrancaSchema>;

export const CreateCobrancaInputSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória'),
  observacao: z.string().optional(),
  idUser: z.number().positive('Selecione um cliente'),
  valorTotal: z.number().positive('Valor deve ser maior que zero'),
  servicos: z.array(z.number()).optional(),
  produtos: z.array(z.number()).optional(),
});

export type CreateCobrancaInput = z.infer<typeof CreateCobrancaInputSchema>;

export const PagamentoUnicoSolicitarInputSchema = z.object({
  idCobranca: z.number(),
  metodo: MetodoPagamentoEnum,
});

export type PagamentoUnicoSolicitarInput = z.infer<typeof PagamentoUnicoSolicitarInputSchema>;

export const PagamentoMensalidadeSolicitarInputSchema = z.object({
  idMensalidade: z.number(),
  metodo: MetodoPagamentoEnum,
});

export type PagamentoMensalidadeSolicitarInput = z.infer<
  typeof PagamentoMensalidadeSolicitarInputSchema
>;

/** Resposta Bixs usa snake_case (JsonPropertyName no PaymentResponseDto). */
export const PagamentoUnicoResponseSchema = z
  .object({
    pix_emv: z.string().optional().nullable(),
    pixEmv: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    digitable_line: z.string().optional().nullable(),
    digitableLine: z.string().optional().nullable(),
    bank_slip_url: z.string().optional().nullable(),
    bankSlipUrl: z.string().optional().nullable(),
    id: z.union([z.string(), z.number()]).optional().nullable(),
    cora_invoice_id: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    payment_type: z.string().optional().nullable(),
    paymentType: z.string().optional().nullable(),
  })
  .transform((raw) => ({
    pixEmv: raw.pix_emv ?? raw.pixEmv ?? null,
    barcode: raw.barcode ?? null,
    digitableLine: raw.digitable_line ?? raw.digitableLine ?? null,
    bankSlipUrl: raw.bank_slip_url ?? raw.bankSlipUrl ?? null,
    invoiceId: raw.cora_invoice_id ?? (raw.id != null ? String(raw.id) : null),
    status: raw.status ?? null,
    paymentType: raw.payment_type ?? raw.paymentType ?? null,
  }));

export type PagamentoUnicoResponse = z.infer<typeof PagamentoUnicoResponseSchema>;

// ---------------------------------------------------------------------------
// Extrato
// ---------------------------------------------------------------------------
export const ExtratoPagamentoSchema = z.object({
  idPagamento: z.number(),
  data: z.string(),
  valor: z.number(),
  metodo: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  nomeCliente: z.string().optional().nullable(),
});

export type ExtratoPagamento = z.infer<typeof ExtratoPagamentoSchema>;

// ---------------------------------------------------------------------------
// Busca de pagamentos
// ---------------------------------------------------------------------------
export const BuscaPagamentoSchema = z.object({
  idPagamento: z.number(),
  data: z.string(),
  valor: z.number(),
  metodo: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  nomeCliente: z.string().optional().nullable(),
  emailCliente: z.string().optional().nullable(),
});

export type BuscaPagamento = z.infer<typeof BuscaPagamentoSchema>;
