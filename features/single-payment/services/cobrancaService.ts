import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  Cobranca,
  CobrancaSchema,
  CreateCobrancaInput,
  MensalidadeStatus,
} from '../schemas/cobrancaSchemas';

/** Cobranças usam /api sem /v1 (mesmo padrão de Chats). */
const COBRANCAS_BASE = 'https://lojas.vlks.com.br/api/Cobrancas';

const isEmpresaDualAccount = (): boolean =>
  sessionService.isEmpresaOwner() || sessionService.getSession().user?.tipo === 'Empresa';

/** Token do pagador: preferir client em conta dual (GET Usuario / pagamento). */
const resolvePayerToken = (): string | null => {
  if (isEmpresaDualAccount()) {
    return sessionService.getCachedToken('client') || sessionService.getSession().token;
  }
  return sessionService.getSession().token;
};

const buildHeaders = (withJson = false, preferPayerToken = false): HeadersInit => {
  const token = preferPayerToken ? resolvePayerToken() : sessionService.getSession().token;
  const headers: Record<string, string> = {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
  };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
};

const parseCobrancaArray = (raw: unknown): Cobranca[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const result = CobrancaSchema.safeParse(item);
      if (!result.success) {
        console.warn('[cobrancaService] parse error:', result.error.issues, item);
        return null;
      }
      return result.data;
    })
    .filter((c): c is Cobranca => c !== null);
};

/** Service de Cobranças — https://lojas.vlks.com.br/api/Cobrancas */
export const cobrancaService = {
  async listByEmpresa(): Promise<Cobranca[]> {
    const response = await fetch(`${COBRANCAS_BASE}/Empresa`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar cobranças da empresa');
    }
    return parseCobrancaArray(await response.json());
  },

  async listByUsuario(): Promise<Cobranca[]> {
    const response = await fetch(`${COBRANCAS_BASE}/Usuario`, {
      headers: buildHeaders(false, true),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar cobranças do usuário');
    }
    return parseCobrancaArray(await response.json());
  },

  async getById(id: number): Promise<Cobranca> {
    const response = await fetch(`${COBRANCAS_BASE}/${id}`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Cobrança não encontrada');
    }
    return CobrancaSchema.parse(await response.json());
  },

  async create(input: CreateCobrancaInput): Promise<string> {
    const body = {
      descricao: input.descricao,
      observacao: input.observacao ?? undefined,
      idUser: input.idUser,
      valorTotal: input.valorTotal,
      servicos: input.servicos?.length ? input.servicos : undefined,
      produtos: input.produtos?.length ? input.produtos : undefined,
    };
    const response = await fetch(COBRANCAS_BASE, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao criar cobrança');
    }
    return response.text();
  },

  async updateStatus(id: number, status: MensalidadeStatus): Promise<string> {
    const response = await fetch(
      `${COBRANCAS_BASE}/Status/${id}?status=${encodeURIComponent(status)}`,
      { method: 'PUT', headers: buildHeaders() },
    );
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar status da cobrança');
    }
    return response.text();
  },
};
