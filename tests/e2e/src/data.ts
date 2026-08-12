/**
 * Geradores de massa de teste.
 *
 * CPF e CNPJ saem com dígitos verificadores válidos porque o frontend valida
 * módulo 11 em `utils/validators.ts` — massa aleatória quebraria os testes de UI.
 */
import { DATA_PREFIX, EMAIL_DOMAIN } from './config';

let counter = 0;

/** Sufixo único por processo + contador, para nunca colidir entre workers. */
export const uniqueSuffix = (): string => {
  counter += 1;
  return `${Date.now().toString(36)}${process.pid.toString(36)}${counter.toString(36)}`;
};

const randomDigits = (length: number): number[] =>
  Array.from({ length }, () => Math.floor(Math.random() * 10));

const checkDigit = (digits: number[], weights: number[]): number => {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
};

/** CPF sintético com dígitos verificadores válidos (módulo 11). */
export const generateCpf = (): string => {
  const base = randomDigits(9);
  const d1 = checkDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit([...base, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join('');
};

/** CNPJ sintético com dígitos verificadores válidos (módulo 11). */
export const generateCnpj = (): string => {
  const base = [...randomDigits(8), 0, 0, 0, 1];
  const d1 = checkDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit([...base, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join('');
};

/** Celular brasileiro com DDD aceito pelo validador do frontend. */
export const generatePhone = (): string => {
  const ddds = [11, 21, 31, 41, 51, 61, 71, 81];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)] ?? 11;
  const number = `9${randomDigits(8).join('')}`;
  return `${ddd}${number}`;
};

/** E-mail sintético — o domínio não existe, nenhum e-mail real é disparado. */
export const generateEmail = (role: string): string =>
  `${DATA_PREFIX}.${role}.${uniqueSuffix()}@${EMAIL_DOMAIN}`;

/** Rótulo legível e único, para localizar registros órfãos no banco depois. */
export const label = (what: string): string => `${DATA_PREFIX.toUpperCase()} ${what} ${uniqueSuffix()}`;

/** Chave PIX aleatória (formato UUID, tipo "Aleatória"). */
export const generatePixKey = (): string => globalThis.crypto.randomUUID();

/** Endereço válido para os fluxos que exigem endereço cadastrado. */
export const generateAddress = () => ({
  rua: `Rua ${DATA_PREFIX} ${uniqueSuffix()}`,
  numero: String(Math.floor(Math.random() * 900) + 100),
  bairro: 'Centro',
  cidade: 'Curitiba',
  estado: 'PR',
  cep: '80010000',
});

/** Número de cartão de teste sem formatação (16 dígitos). */
export const RAW_CARD_NUMBER = '4242424242424242';

/**
 * Cartão de crédito de teste.
 *
 * O número vai **formatado com espaços** de propósito: o controller valida
 * `dto.NumCartao.Length <= 16` → BadRequest, ou seja, rejeita justamente os
 * cartões de 16 dígitos e só aceita strings com 17+ caracteres (BE-015 em
 * docs/relatorio_erros_backend.md). Sem os espaços nenhum cartão é cadastrável.
 */
export const generateCard = (isDefault = false) => ({
  NomeNoCartao: `${DATA_PREFIX.toUpperCase()} TESTE`,
  NumCartao: '4242 4242 4242 4242',
  CCV: '123',
  Bandeira: 'Visa',
  MesAnoExpiracao: '12/2030',
  IsDefault: isDefault,
});
