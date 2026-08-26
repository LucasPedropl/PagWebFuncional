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
  SendVerificationCodeResult,
  SendVerificationCodeResultSchema,
} from '../schemas/controleAcessoSchemas';

const BASE = `${apiUrl()}/ControleAcessos`;
/** Produção: POST em UserAdmin. POST /api/ControleAcessos retorna 405 (só GET liberado). */
const SOLICITAR_ACESSO_URL = apiV1Url('/User/solicitar-acesso');
const STATUS_ACESSO_URL = apiV1Url('/User/status-acesso');
const ENVIAR_CODIGO_URL = apiV1Url('/User/enviar-codigo-acesso');

/** API PagWeb ainda não publicou o proxy de envio de OTP. */
export class VerificationCodeEndpointMissingError extends Error {
  constructor() {
    super(
      'O envio automático do código ainda não está disponível nesta versão da API. ' +
        'Peça o código de verificação ao suporte PagWeb e digite-o abaixo.',
    );
    this.name = 'VerificationCodeEndpointMissingError';
  }
}

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

/** Body opcional: a resposta pode vir vazia (204/sem corpo). */
const parseOptionalJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
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

  /** Detalhe por id — Master ONLY. Admin recebe 403; use getMyStatus(). */
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

  /** Status da própria empresa (Role Admin). Substitui getById, que é Master-only. */
  async getMyStatus(): Promise<ControleAcessoDetail | null> {
    const response = await fetch(STATUS_ACESSO_URL, { headers: buildHeaders() });
    // 404 = empresa sem solicitação; 401/403 = conta não-Admin (ex.: Master)
    if (response.status === 404 || response.status === 401 || response.status === 403) {
      return null;
    }
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao carregar status de integração');
    }
    const raw: unknown = await response.json();
    const parsed = ControleAcessoDetailSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('Resposta inválida ao carregar status de integração');
    }
    return parsed.data;
  },

  /** Dispara o OTP de 6 dígitos por e-mail (proxy da Bixs na API PagWeb). */
  async sendVerificationCode(): Promise<SendVerificationCodeResult> {
    const response = await fetch(ENVIAR_CODIGO_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({}),
    });

    if (response.status === 404 || response.status === 405) {
      throw new VerificationCodeEndpointMissingError();
    }
    if (!response.ok) {
      throw new Error(
        (await parseApiError(response)) || 'Não foi possível enviar o código de verificação',
      );
    }

    const raw = await parseOptionalJson(response);
    const parsed = SendVerificationCodeResultSchema.safeParse(raw);
    // Shape inesperado não pode derrubar a UI: o código foi enviado de qualquer forma
    return parsed.success ? parsed.data : { sentTo: '', expiresInSeconds: 900 };
  },

  /**
   * Solicita módulos Payment/WhatsApp.
   * Produção: POST /api/v1/User/solicitar-acesso
   * (POST /api/ControleAcessos está 405 Method Not Allowed no ambiente lojas.vlks).
   */
  async requestAccess(input: ControleAcessoRequestInput): Promise<void> {
    const response = await fetch(SOLICITAR_ACESSO_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        payment: ESTADO_ACESSO_TO_API[input.payment],
        whatsapp: ESTADO_ACESSO_TO_API[input.whatsapp],
        idEmpresa: input.idEmpresa ?? 0,
        password: input.password,
        verificationCode: input.verificationCode.trim(),
      }),
    });

    if (!response.ok) {
      const apiMessage = (await parseApiError(response)).trim();
      // Ordem importa: o 401 de senha vem com corpo; o 401 de JWT expirado vem vazio
      if (/senha incorreta/i.test(apiMessage)) {
        throw new Error('Senha incorreta. Confirme a senha da sua conta de administrador.');
      }
      if (response.status === 401) {
        throw new Error('Sua sessão expirou. Faça login novamente e refaça a solicitação.');
      }
      if (/já existe um controle de acesso/i.test(apiMessage)) {
        throw new Error(
          'Já existe uma solicitação ativa ou pendente para esta empresa. Atualize a página para ver o status. Se estiver Inativa, use “Solicitar novamente” neste painel.',
        );
      }
      if (/verificationcode/i.test(apiMessage) || /código de verificação/i.test(apiMessage)) {
        throw new Error(
          'Código de verificação inválido ou ausente. Envie um novo código e tente de novo.',
        );
      }
      if (/erro ao criar acesso/i.test(apiMessage)) {
        throw new Error(
          'A API não conseguiu criar o acesso na Bixs. Isso costuma ser código de verificação expirado (validade de 15 minutos) ou já utilizado — envie um novo código. Se persistir, é falha de integração no backend/Bixs.',
        );
      }
      if (response.status === 405) {
        throw new Error(
          'Endpoint de solicitação indisponível neste ambiente (405). Verifique se /api/v1/User/solicitar-acesso está publicado.',
        );
      }
      throw new Error(apiMessage || 'Erro ao solicitar acesso');
    }
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
};
