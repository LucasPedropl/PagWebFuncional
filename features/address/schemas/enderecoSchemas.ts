import { z } from 'zod';

export const EnderecoInputSchema = z.object({
  rua: z.string().min(1, 'Rua obrigatória'),
  numero: z.string().min(1, 'Número obrigatório'),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z
    .string()
    .min(2, 'UF obrigatória')
    .max(2, 'Use a sigla do estado (ex: SP)')
    .transform((v) => v.toUpperCase()),
  cep: z
    .string()
    .min(8, 'CEP inválido')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 8, 'CEP deve ter 8 dígitos'),
});

export type EnderecoInput = z.infer<typeof EnderecoInputSchema>;

export const emptyEndereco = (): EnderecoInput => ({
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
});

/** Mensagem típica da API quando EnderecoUser não existe. */
export const isAddressMissingError = (message: string): boolean =>
  /endere[cç]o n[aã]o encontrado/i.test(message);
