import { z } from 'zod';

/** UFs aceitas pela Cora (customer.address.state). */
export const BRAZIL_UF_VALUES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
] as const;

export const EnderecoInputSchema = z.object({
  rua: z.string().min(1, 'Rua obrigatória'),
  numero: z.string().min(1, 'Número obrigatório'),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z
    .string()
    .min(2, 'UF obrigatória')
    .max(2, 'Use a sigla do estado (ex: SP)')
    .transform((v) => v.toUpperCase())
    .refine(
      (v): v is (typeof BRAZIL_UF_VALUES)[number] =>
        (BRAZIL_UF_VALUES as readonly string[]).includes(v),
      'UF inválida (ex: SP, MG, RJ)',
    ),
  cep: z
    .string()
    .min(8, 'CEP inválido')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 8, 'CEP deve ter 8 dígitos'),
});
export type EnderecoInput = z.infer<typeof EnderecoInputSchema>;

/** PATCH /api/v1/Endereco/{id} — campos opcionais. */
export const EnderecoUpdateSchema = EnderecoInputSchema.partial();
export type EnderecoUpdate = z.infer<typeof EnderecoUpdateSchema>;

export const EnderecoEntitySchema = z
  .object({
    idEndereco: z.coerce.number().optional(),
    IdEndereco: z.coerce.number().optional(),
    rua: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  })
  .transform((raw) => ({
    idEndereco: raw.idEndereco ?? raw.IdEndereco ?? 0,
    rua: raw.rua ?? '',
    numero: raw.numero ?? '',
    bairro: raw.bairro ?? '',
    cidade: raw.cidade ?? '',
    estado: raw.estado ?? '',
    cep: raw.cep ?? '',
  }));

export type EnderecoEntity = z.infer<typeof EnderecoEntitySchema>;

export const emptyEndereco = (): EnderecoInput => ({
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '' as unknown as typeof BRAZIL_UF_VALUES[number],
  cep: '',
});

/** Mensagem típica da API quando EnderecoUser não existe. */
export const isAddressMissingError = (message: string): boolean =>
  /endere[cç]o n[aã]o encontrado/i.test(message);

/**
 * POST /Endereco/usuario é 1:1 — segundo create falha com esta mensagem genérica
 * (unique IdUser). Tratar como "já existe" no frontend.
 */
export const isAddressAlreadyExistsError = (message: string): boolean =>
  /erro ao criar endere[cç]o para o usu[aá]rio/i.test(message);
