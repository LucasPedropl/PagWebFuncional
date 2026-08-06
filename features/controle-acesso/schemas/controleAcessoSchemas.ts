import { z } from 'zod';

/** Ordem do enum C# Estado. */
export const ESTADO_ACESSO_VALUES = ['Ativo', 'Inativo', 'Solicitado'] as const;
export type EstadoAcesso = (typeof ESTADO_ACESSO_VALUES)[number];

export const EstadoAcessoEnum = z.enum(ESTADO_ACESSO_VALUES);

export const ESTADO_ACESSO_TO_API: Record<EstadoAcesso, number> = {
  Ativo: 0,
  Inativo: 1,
  Solicitado: 2,
};

export const coerceEstadoAcesso = z.preprocess((value) => {
  if (typeof value === 'number') {
    return ESTADO_ACESSO_VALUES[value] ?? value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return ESTADO_ACESSO_VALUES[Number(value)] ?? value;
  }
  return value;
}, EstadoAcessoEnum);

export const ControleAcessoListItemSchema = z
  .object({
    idControle: z.number().optional(),
    IdControle: z.number().optional(),
    nomeEmpresa: z.string().optional().nullable(),
    NomeEmpresa: z.string().optional().nullable(),
    cpf_CNPJ: z.string().optional().nullable(),
    CPF_CNPJ: z.string().optional().nullable(),
    estado: coerceEstadoAcesso.optional(),
    Estado: coerceEstadoAcesso.optional(),
  })
  .transform((raw) => ({
    idControle: raw.idControle ?? raw.IdControle ?? 0,
    nomeEmpresa: raw.nomeEmpresa ?? raw.NomeEmpresa ?? '',
    cpfCnpj: raw.cpf_CNPJ ?? raw.CPF_CNPJ ?? '',
    estado: raw.estado ?? raw.Estado ?? 'Solicitado',
  }));

export type ControleAcessoListItem = z.infer<typeof ControleAcessoListItemSchema>;

export const ControleAcessoDetailSchema = z
  .object({
    idControle: z.number().optional(),
    IdControle: z.number().optional(),
    nomeEmpresa: z.string().optional().nullable(),
    NomeEmpresa: z.string().optional().nullable(),
    cpf_CNPJ: z.string().optional().nullable(),
    CPF_CNPJ: z.string().optional().nullable(),
    estado: coerceEstadoAcesso.optional(),
    payment: coerceEstadoAcesso.optional(),
    Payment: coerceEstadoAcesso.optional(),
    whatsapp: coerceEstadoAcesso.optional(),
    Whatsapp: coerceEstadoAcesso.optional(),
    emailAdmin: z.string().optional().nullable(),
    EmailAdmin: z.string().optional().nullable(),
    nomeAdmin: z.string().optional().nullable(),
    NomeAdmin: z.string().optional().nullable(),
    cpfAdmin: z.string().optional().nullable(),
    CPFAdmin: z.string().optional().nullable(),
    dataSolicitado: z.string().optional().nullable(),
    DataSolicitado: z.string().optional().nullable(),
  })
  .transform((raw) => ({
    idControle: raw.idControle ?? raw.IdControle ?? 0,
    nomeEmpresa: raw.nomeEmpresa ?? raw.NomeEmpresa ?? '',
    cpfCnpj: raw.cpf_CNPJ ?? raw.CPF_CNPJ ?? '',
    estado: raw.estado ?? 'Solicitado',
    payment: raw.payment ?? raw.Payment ?? 'Inativo',
    whatsapp: raw.whatsapp ?? raw.Whatsapp ?? 'Inativo',
    emailAdmin: raw.emailAdmin ?? raw.EmailAdmin ?? '',
    nomeAdmin: raw.nomeAdmin ?? raw.NomeAdmin ?? '',
    cpfAdmin: raw.cpfAdmin ?? raw.CPFAdmin ?? '',
    dataSolicitado: raw.dataSolicitado ?? raw.DataSolicitado ?? '',
  }));

export type ControleAcessoDetail = z.infer<typeof ControleAcessoDetailSchema>;

export const ControleAcessoRequestInputSchema = z.object({
  payment: EstadoAcessoEnum,
  whatsapp: EstadoAcessoEnum,
  password: z.string().min(1, 'Informe sua senha para confirmar'),
  idEmpresa: z.number().optional(),
});

export type ControleAcessoRequestInput = z.infer<typeof ControleAcessoRequestInputSchema>;

export const ControleAcessoUpdateInputSchema = z.object({
  idControle: z.number().positive(),
  payment: EstadoAcessoEnum,
  whatsapp: EstadoAcessoEnum,
  estado: EstadoAcessoEnum,
});

export type ControleAcessoUpdateInput = z.infer<typeof ControleAcessoUpdateInputSchema>;

const CONTROLE_ID_STORAGE_KEY = 'pagweb_controle_acesso_id';

export const controleAcessoStorage = {
  getId(): number | null {
    const raw = localStorage.getItem(CONTROLE_ID_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  },
  setId(id: number) {
    localStorage.setItem(CONTROLE_ID_STORAGE_KEY, String(id));
  },
  clear() {
    localStorage.removeItem(CONTROLE_ID_STORAGE_KEY);
  },
};
