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
/** Produção: POST em UserAdmin. POST /api/ControleAcessos retorna 405 (só GET liberado). */
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

const parseCreatedId = (raw: unknown): number => {
  if (!raw || typeof raw !== 'object') return 0;
  const record = raw as Record<string, unknown>;
  const candidates = [record.idcontrole, record.idControle, record.IdControle];
  for (const candidate of candidates) {
    const id = Number(candidate);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return 0;
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
    if (response.status === 404 || response.status === 401 || response.status === 403) {
      return null;
    }
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

  /**
   * Solicita módulos Payment/WhatsApp.
   * Produção: POST /api/v1/User/solicitar-acesso
   * (POST /api/ControleAcessos está 405 Method Not Allowed no ambiente lojas.vlks).
   */
  async requestAccess(input: ControleAcessoRequestInput): Promise<number> {
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
      const apiMessage = (await parseApiError(response)).trim();
      if (/erro ao criar acesso/i.test(apiMessage)) {
        throw new Error(
          'A API não conseguiu criar o acesso na Bixs (Erro ao criar acesso). Isso é falha de integração no backend/Bixs, não do formulário. Contate o time PagWeb.',
        );
      }
      if (response.status === 405) {
        throw new Error(
          'Endpoint de solicitação indisponível neste ambiente (405). Verifique se /api/v1/User/solicitar-acesso está publicado.',
        );
      }
      throw new Error(apiMessage || 'Erro ao solicitar acesso');
    }

    const raw: unknown = await response.json();
    const id = parseCreatedId(raw);
    if (id > 0) {
      controleAcessoStorage.setId(id);
      return id;
    }
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

  clearStoredId(): void {
    controleAcessoStorage.clear();
  },
};
