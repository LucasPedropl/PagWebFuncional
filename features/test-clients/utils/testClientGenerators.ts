/** Senha padrão de todos os clientes de teste criados pela tela Clientes. */
export const TEST_CLIENT_DEFAULT_PASSWORD = 'plm200510';

const EMAIL_DOMAIN = 'pagweb-teste.local';

export const isTestClientEmail = (email: string | null | undefined): boolean =>
  Boolean(email?.toLowerCase().endsWith(`@${EMAIL_DOMAIN}`));

const randomDigits = (length: number): number[] =>
  Array.from({ length }, () => Math.floor(Math.random() * 10));

const cpfCheckDigit = (digits: number[], weights: number[]): number => {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
};

/** CPF sintético com dígitos verificadores válidos (módulo 11). */
export const generateValidTestCpf = (): string => {
  const base = randomDigits(9);
  const d1 = cpfCheckDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = cpfCheckDigit([...base, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join('');
};

export const generateTestClientPhone = (): string => {
  const ddds = [11, 21, 27, 31, 41, 47, 51, 61, 71, 81];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)] ?? 11;
  return `${ddd}9${randomDigits(8).join('')}`;
};

export const generateTestClientEmail = (): string => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `cliente.${suffix}@${EMAIL_DOMAIN}`;
};

export interface GeneratedTestClientCredentials {
  nome: string;
  sobreNome: string;
  email: string;
  password: string;
  cpf: string;
  telefone: string;
}

export const buildTestClientRegistrationPayload = (
  sequenceIndex: number,
): GeneratedTestClientCredentials => ({
  nome: 'Cliente',
  sobreNome: `Teste ${sequenceIndex}`,
  email: generateTestClientEmail(),
  password: TEST_CLIENT_DEFAULT_PASSWORD,
  cpf: generateValidTestCpf(),
  telefone: generateTestClientPhone(),
});
