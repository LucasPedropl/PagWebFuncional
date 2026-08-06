import { z } from 'zod';

export const TIPO_CHAVE_PIX_VALUES = ['CPF', 'CNPJ', 'Email', 'Telefone', 'Aleatoria'] as const;
export type TipoChavePix = (typeof TIPO_CHAVE_PIX_VALUES)[number];

export const ChavePixSchema = z
  .object({
    idChavePix: z.number().optional(),
    IdChavePix: z.number().optional(),
    chave: z.string().optional().nullable(),
    Chave: z.string().optional().nullable(),
    tipoChave: z.string().optional().nullable(),
    TipoChave: z.string().optional().nullable(),
    status: z.boolean().optional().nullable(),
    Status: z.boolean().optional().nullable(),
  })
  .transform((raw) => ({
    idChavePix: raw.idChavePix ?? raw.IdChavePix ?? 0,
    chave: raw.chave ?? raw.Chave ?? '',
    tipoChave: raw.tipoChave ?? raw.TipoChave ?? '',
    status: raw.status ?? raw.Status ?? false,
  }));

export type ChavePix = z.infer<typeof ChavePixSchema>;

export const ChavePixInputSchema = z.object({
  chave: z.string().min(1, 'Informe a chave PIX'),
  tipoChave: z.string().min(1, 'Selecione o tipo da chave'),
});

export type ChavePixInput = z.infer<typeof ChavePixInputSchema>;

export const ChavePixUpdateInputSchema = ChavePixInputSchema.extend({
  idChave: z.number().positive(),
  ativa: z.boolean(),
});

export type ChavePixUpdateInput = z.infer<typeof ChavePixUpdateInputSchema>;
