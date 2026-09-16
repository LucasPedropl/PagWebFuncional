import { z } from 'zod';

/** UFs aceitas pelo gateway (customer.address.state). */
export const BRAZIL_UF_VALUES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

const optionalComplemento = z
  .string()
  .max(80, 'Complemento deve ter no máximo 80 caracteres')
  .optional();

export const EnderecoInputSchema = z.object({
  rua: z.string().min(1, 'Rua obrigatória'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: optionalComplemento,
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

const optionalNumericId = z.coerce.number().optional();

export const EnderecoEntitySchema = z
  .object({
    idEndereco: optionalNumericId,
    IdEndereco: optionalNumericId,
    id: optionalNumericId,
    Id: optionalNumericId,
    rua: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional().nullable(),
    Complemento: z.string().optional().nullable(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  })
  .transform((raw) => ({
    idEndereco: raw.idEndereco ?? raw.IdEndereco ?? raw.id ?? raw.Id ?? 0,
    rua: raw.rua ?? '',
    numero: raw.numero ?? '',
    complemento: raw.complemento ?? raw.Complemento ?? '',
    bairro: raw.bairro ?? '',
    cidade: raw.cidade ?? '',
    estado: raw.estado ?? '',
    cep: raw.cep ?? '',
  }));

export type EnderecoEntity = z.infer<typeof EnderecoEntitySchema>;

export const emptyEndereco = (): EnderecoInput => ({
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '' as unknown as (typeof BRAZIL_UF_VALUES)[number],
  cep: '',
});

export interface AddressPersistenceState {
  /** ID devolvido por POST/PATCH e gravado neste dispositivo. */
  serverAddressId: number | null;
  /** Há rascunho local (não implica persistência no servidor). */
  hasLocalDraft: boolean;
  /** True somente após POST/PATCH HTTP 2xx. */
  persistedOnServer: boolean;
}

export interface AddressSaveResult {
  persistedOnServer: boolean;
  savedLocally: boolean;
  addressId: number | null;
}

/** Mensagem típica da API quando EnderecoUser não existe. */
export const isAddressMissingError = (message: string): boolean =>
  /endere[cç]o n[aã]o encontrado/i.test(message);

/**
 * POST /Endereco/usuario é 1:1 — segundo create falha com esta mensagem genérica
 * (unique IdUser). Não tratar como sucesso.
 */
export const isAddressAlreadyExistsError = (message: string): boolean =>
  /erro ao criar endere[cç]o para o usu[aá]rio/i.test(message);

export const isEmpresaAddressAlreadyExistsError = (message: string): boolean =>
  /erro ao criar endere[cç]o para a empresa/i.test(message);

export const ADDRESS_ALREADY_EXISTS_WITHOUT_ID_MESSAGE =
  'Este endereço já existe no servidor, mas este dispositivo não tem o identificador. A alteração ficou só neste navegador e não foi gravada. Abra a conta no aparelho em que o endereço foi cadastrado, ou peça um GET de endereço na API.';

export class AddressAlreadyExistsWithoutIdError extends Error {
  constructor() {
    super(ADDRESS_ALREADY_EXISTS_WITHOUT_ID_MESSAGE);
    this.name = 'AddressAlreadyExistsWithoutIdError';
  }
}
