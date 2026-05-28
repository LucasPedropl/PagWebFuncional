export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCPFOrCNPJ = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return formatCPF(value);
  } else {
    return formatCNPJ(value);
  }
};

export const formatPhone = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length > 10) {
     return clean
      .replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else {
     return clean
      .replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  }
};

/** Garante dia de pagamento entre 1 e 30 para payloads da API. */
export const normalizePaymentDay = (value: string | number | undefined | null): number => {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.min(30, Math.max(1, new Date().getDate()));
  }
  return Math.min(30, Math.max(1, parsed));
};

export const parseApiError = async (response: Response): Promise<string> => {
  const text = await response.text();
  try {
    // Tenta parsear se for um JSON (ex: { "message": "Erro X" })
    const json = JSON.parse(text);
    if (json && json.message) {
      return json.message;
    }
    // As vezes o erro vem como { "errors": { "field": ["msg"] } }
    if (json && json.errors) {
        const firstKey = Object.keys(json.errors)[0];
        if (firstKey && Array.isArray(json.errors[firstKey])) {
            return json.errors[firstKey][0];
        }
    }
    return text; // Se for JSON mas não tiver estrutura conhecida
  } catch {
    return text; // Se não for JSON (texto puro)
  }
};