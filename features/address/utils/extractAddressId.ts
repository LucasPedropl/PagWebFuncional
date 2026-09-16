const ADDRESS_ID_KEY_PATTERN = /^(id)?endereco$/i;

const toPositiveId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  }
  return null;
};

const normalizeKey = (key: string): string => key.replace(/[_-]/g, '').toLowerCase();

/**
 * Recupera o id do endereço em qualquer casing/formato que a API devolver
 * (idEndereco, IdEndereco, id, número solto ou JSON em string).
 */
export const extractAddressIdFromUnknown = (raw: unknown, depth = 0): number | null => {
  if (depth > 4 || raw == null) return null;

  const asNumber = toPositiveId(raw);
  if (asNumber) return asNumber;

  if (typeof raw === 'string') {
    try {
      return extractAddressIdFromUnknown(JSON.parse(raw), depth + 1);
    } catch {
      const match = raw.match(/\b(\d{1,10})\b/);
      return match ? toPositiveId(match[1]) : null;
    }
  }

  if (typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const normalized = normalizeKey(key);
    if (
      normalized === 'idendereco' ||
      normalized === 'id' ||
      ADDRESS_ID_KEY_PATTERN.test(key)
    ) {
      const id = toPositiveId(value);
      if (id) return id;
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const nested = extractAddressIdFromUnknown(value, depth + 1);
      if (nested) return nested;
    }
  }

  return null;
};
