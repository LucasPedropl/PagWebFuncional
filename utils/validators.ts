const BRAZILIAN_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Validação matemática de CPF (módulo 11).
 */
export const isValidCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Rejeita repetidos (ex: 11111111111)

  // Valida 1º dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[9], 10)) return false;

  // Valida 2º dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[10], 10)) return false;

  return true;
};

/**
 * Validação matemática de CNPJ (módulo 11).
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false; // Rejeita repetidos (ex: 00000000000000)

  // Valida 1º dígito
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  // Valida 2º dígito
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
};

/**
 * Valida o CPF ou CNPJ de forma genérica.
 */
export const isValidCPFOrCNPJ = (value: string): boolean => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return isValidCPF(value);
  }
  return isValidCNPJ(value);
};

/**
 * Validação robusta de telefone (DDI 55 com DDD e padrão celular/fixo nacional).
 */
export const isValidPhone = (phone: string, ddi = '55'): boolean => {
  const clean = phone.replace(/\D/g, '');
  if (ddi === '55') {
    // Para o Brasil: deve ter 10 (fixo) ou 11 (celular) dígitos
    if (clean.length !== 10 && clean.length !== 11) return false;

    const ddd = parseInt(clean.substring(0, 2), 10);
    if (!BRAZILIAN_DDDS.has(ddd)) return false;

    if (clean.length === 11) {
      // Celular: DDD + 9 + 8 dígitos
      if (clean.charAt(2) !== '9') return false;
    } else {
      // Fixo: DDD + 8 dígitos (começando com 2, 3, 4 ou 5)
      const firstDigit = clean.charAt(2);
      if (!['2', '3', '4', '5'].includes(firstDigit)) return false;
    }
    return true;
  } else {
    // Internacional: geralmente de 7 a 15 dígitos
    return clean.length >= 7 && clean.length <= 15;
  }
};

/**
 * Validação estrutural de E-mail.
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Validação de nome/sobrenome (mínimo de 2 caracteres, sem números ou símbolos).
 */
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  // Permite letras maiúsculas/minúsculas, acentuadas, apóstrofo e espaço simples
  const regex = /^[a-zA-ZÀ-ÿ]+(?:['\s][a-zA-ZÀ-ÿ]+)*$/;
  return regex.test(trimmed);
};
