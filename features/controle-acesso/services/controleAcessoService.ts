import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import { apiUrl, apiV1Url } from '../../../utils/apiOrigin';
import {
  ControleAcessoDetail,
  ControleAcessoDetailSchema,
  ControleAcessoListItem,
  ControleAcessoListItemSchema,
  ControleAcessoRequestInput,
  ControleAcessoUpdateInput,
  ESTADO_ACESSO_TO_API,
  controleAcessoStorage,
} from '../schemas/controleAcessoSchemas';

const BASE = `${apiUrl()}/ControleAcessos`;
const SOLICITAR_ACESSO_URL = apiV1Url('/User/solicitar-acesso');

const buildHeaders = (): HeadersInit => {
  const { token } = sessionService.getSession();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

const parseList = (raw: unknown): ControleAcessoListItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<ControleAcessoListItem[]>((acc, item) => {
    const parsed = ControleAcessoListItemSchema.safeParse(item);
    if (parsed.success && parsed.data.idControle > 0) acc.push(parsed.data);
    return acc;
  }, []);
};

export const controleAcessoService = {
  async listMaster(): Promise<{ items: ControleAcessoListItem[]; isMaster: boolean }> {
    const response = await fetch(BASE, { headers: buildHeaders() });
    if (response.status === 403 || response.status === 401) {
      return { items: [], isMaster: false };
    }
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar solicitações');
    }
    const raw: unknown = await response.json();
    return { items: parseList(raw), isMaster: true };
  },

  async getById(idControle: number): Promise<ControleAcessoDetail | null> {
    const response = await fetch(`${BASE}/${idControle}`, { headers: buildHeaders() });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao carregar solicitação');
    }
    const raw: unknown = await response.json();
    const parsed = ControleAcessoDetailSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('Resposta inválida ao carregar solicitação');
    }
    return parsed.data;
  },

  async requestAccess(input: ControleAcessoRequestInput): Promise<number> {
    /** Novo endpoint Master/Admin: POST /api/v1/User/solicitar-acesso */
    const response = await fetch(SOLICITAR_ACESSO_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        payment: ESTADO_ACESSO_TO_API[input.payment],
        whatsapp: ESTADO_ACESSO_TO_API[input.whatsapp],
        idEmpresa: input.idEmpresa ?? 0,
        password: input.password,
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao solicitar acesso');
    }
    const raw: unknown = await response.json();
    if (raw && typeof raw === 'object') {
      const id =
        'idcontrole' in raw
          ? Number((raw as { idcontrole: unknown }).idcontrole)
          : 'idControle' in raw
            ? Number((raw as { idControle: unknown }).idControle)
            : 'IdControle' in raw
              ? Number((raw as { IdControle: unknown }).IdControle)
              : 0;
      if (id > 0) {
        controleAcessoStorage.setId(id);
        return id;
      }
    }
    // Algumas respostas só confirmam OK — mantém id anterior se houver
    const stored = controleAcessoStorage.getId();
    if (stored) return stored;
    throw new Error('Solicitação enviada, mas o ID não foi retornado pela API');
  },

  async update(input: ControleAcessoUpdateInput): Promise<void> {
    const response = await fetch(`${BASE}/${input.idControle}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({
        IdControle: input.idControle,
        Payment: ESTADO_ACESSO_TO_API[input.payment],
        Whatsapp: ESTADO_ACESSO_TO_API[input.whatsapp],
        estado: ESTADO_ACESSO_TO_API[input.estado],
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar solicitação');
    }
  },

  async remove(idControle: number): Promise<void> {
    const response = await fetch(`${BASE}/${idControle}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao remover solicitação');
    }
  },

  getStoredId(): number | null {
    return controleAcessoStorage.getId();
  },
};
