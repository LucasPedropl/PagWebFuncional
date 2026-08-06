import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import { apiUrl } from '../../../utils/apiOrigin';
import {
  ChavePix,
  ChavePixInput,
  ChavePixSchema,
  ChavePixUpdateInput,
} from '../schemas/chavePixSchemas';

const BASE = `${apiUrl()}/ChavesPix`;

const buildHeaders = (): HeadersInit => {
  const { token } = sessionService.getSession();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

const parseList = (raw: unknown): ChavePix[] => {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<ChavePix[]>((acc, item) => {
    const parsed = ChavePixSchema.safeParse(item);
    if (parsed.success && parsed.data.idChavePix > 0) acc.push(parsed.data);
    return acc;
  }, []);
};

export const chavePixService = {
  async list(): Promise<ChavePix[]> {
    const response = await fetch(BASE, { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar chaves PIX');
    }
    const raw: unknown = await response.json();
    return parseList(raw);
  },

  async create(input: ChavePixInput): Promise<ChavePix> {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        Chave: input.chave,
        TipoChave: input.tipoChave,
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao cadastrar chave PIX');
    }
    const raw: unknown = await response.json();
    const parsed = ChavePixSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('Resposta inválida ao cadastrar chave PIX');
    }
    return parsed.data;
  },

  async update(input: ChavePixUpdateInput): Promise<void> {
    const response = await fetch(`${BASE}/${input.idChave}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({
        IdChave: input.idChave,
        Chave: input.chave,
        TipoChave: input.tipoChave,
        Ativa: input.ativa,
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar chave PIX');
    }
  },

  async deactivate(idChavePix: number): Promise<void> {
    const response = await fetch(`${BASE}/${idChavePix}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao desativar chave PIX');
    }
  },
};
