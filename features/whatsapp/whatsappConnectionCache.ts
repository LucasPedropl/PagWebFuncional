/** Snapshot da conexão WhatsApp por empresa — evita spinner a cada visita à página. */

export type WhatsAppConnectionCache = {
  isConnected: boolean;
  isInstanceCreated: boolean;
  connectedNumber: string | null;
  checkedAt: number;
};

const STORAGE_PREFIX = 'pagweb_whatsapp_connection_v1:';

const resolveEmpresaId = (): string => {
  try {
    const raw = localStorage.getItem('pagweb_company');
    if (!raw) return 'unknown';
    const company = JSON.parse(raw) as { idEmpresa?: number; IdEmpresa?: number };
    const id = company.idEmpresa ?? company.IdEmpresa;
    return id != null ? String(id) : 'unknown';
  } catch {
    return 'unknown';
  }
};

const storageKey = (): string => `${STORAGE_PREFIX}${resolveEmpresaId()}`;

export const readWhatsAppConnectionCache = (): WhatsAppConnectionCache | null => {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WhatsAppConnectionCache>;
    if (typeof parsed.isConnected !== 'boolean' || typeof parsed.isInstanceCreated !== 'boolean') {
      return null;
    }
    return {
      isConnected: parsed.isConnected,
      isInstanceCreated: parsed.isInstanceCreated,
      connectedNumber:
        typeof parsed.connectedNumber === 'string' ? parsed.connectedNumber : null,
      checkedAt: typeof parsed.checkedAt === 'number' ? parsed.checkedAt : 0,
    };
  } catch {
    return null;
  }
};

export const writeWhatsAppConnectionCache = (
  snapshot: Omit<WhatsAppConnectionCache, 'checkedAt'>,
): void => {
  try {
    const payload: WhatsAppConnectionCache = {
      ...snapshot,
      checkedAt: Date.now(),
    };
    localStorage.setItem(storageKey(), JSON.stringify(payload));
  } catch {
    // quota / private mode — ignore
  }
};

export const clearWhatsAppConnectionCache = (): void => {
  try {
    localStorage.removeItem(storageKey());
  } catch {
    // ignore
  }
};
