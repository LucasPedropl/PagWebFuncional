import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  BuscaPagamento,
  BuscaPagamentoSchema,
  ExtratoPagamento,
  ExtratoPagamentoSchema,
  METODO_PAGAMENTO_TO_API,
  PagamentoMensalidadeSolicitarInput,
  PagamentoUnicoResponse,
  PagamentoUnicoResponseSchema,
  PagamentoUnicoSolicitarInput,
  PendenteRepasse,
  PendenteRepasseSchema,
} from '../schemas/cobrancaSchemas';

const PAGAMENTO_BASE = 'https://lojas.vlks.com.br/api/v1/Pagamento';

const buildHeaders = (): HeadersInit => {
  const { token } = sessionService.getSession();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Extrai mensagens úteis do gateway embutidas no 500 da API PagWeb.
 */
const formatPaymentGatewayError = (raw: string): string => {
  const issues: string[] = [];

  if (/customer\.address\.state/i.test(raw)) {
    issues.push('UF do endereço inválida (use sigla: SP, MG, RJ…)');
  }
  if (/customer\.document\.identity/i.test(raw)) {
    issues.push('CPF do cadastro é inválido para o gateway');
  }
  if (/customer\.address\./i.test(raw) && !issues.some((i) => i.includes('UF'))) {
    issues.push('Endereço incompleto ou inválido no cadastro');
  }

  if (issues.length > 0) {
    return `Pagamento recusado pelo gateway: ${issues.join('; ')}.`;
  }

  const detailsMatch = raw.match(/"details"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (detailsMatch?.[1]) {
    const details = detailsMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .slice(0, 280);
    return details;
  }

  if (raw.length > 320) return `${raw.slice(0, 320)}…`;
  return raw;
};

const parsePaymentResponse = async (
  response: Response,
  fallbackMsg: string,
): Promise<PagamentoUnicoResponse> => {
  if (!response.ok) {
    const raw = (await parseApiError(response)) || fallbackMsg;
    throw new Error(formatPaymentGatewayError(raw));
  }
  const raw: unknown = await response.json();
  const result = PagamentoUnicoResponseSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[pagamentoService] parse warning:', result.error.issues, raw);
    return {
      pixEmv: null,
      barcode: null,
      digitableLine: null,
      bankSlipUrl: null,
      invoiceId: null,
      status: null,
      paymentType: null,
    };
  }
  return result.data;
};

/** Geolocation + IP público para Location no body Bixs. */
export const resolvePaymentLocation = async (): Promise<{
  city: string;
  ip: string;
  latitude: number;
  longitude: number;
}> => {
  let city = 'Sao Paulo';
  let latitude = 0;
  let longitude = 0;
  let ip = '0.0.0.0';

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  } catch {
    // fallback city/coords — city permanece obrigatória no DTO
  }

  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(4000),
    });
    if (ipResponse.ok) {
      const payload: unknown = await ipResponse.json();
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'ip' in payload &&
        typeof (payload as { ip: unknown }).ip === 'string' &&
        (payload as { ip: string }).ip.length > 0
      ) {
        ip = (payload as { ip: string }).ip;
      }
    }
  } catch (err) {
    console.warn('[pagamentoService] Falha ao obter IP público, usando fallback:', err);
  }

  return { city, ip, latitude, longitude };
};

/** Service de Pagamento — https://lojas.vlks.com.br/api/v1/Pagamento */
export const pagamentoService = {
  async solicitarPagamentoUnico(
    input: PagamentoUnicoSolicitarInput,
  ): Promise<PagamentoUnicoResponse> {
    const body = {
      idCobranca: input.idCobranca,
      metodo: METODO_PAGAMENTO_TO_API[input.metodo],
      city: input.city,
      ip: input.ip || '0.0.0.0',
      latitude: input.latitude ?? 0,
      longitude: input.longitude ?? 0,
    };

    const response = await fetch(`${PAGAMENTO_BASE}/unico-solicitar`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    return parsePaymentResponse(response, 'Erro ao solicitar pagamento');
  },

  /** POST /solicitar — mensalidade de assinatura via Bixs. */
  async solicitarMensalidade(
    input: PagamentoMensalidadeSolicitarInput,
  ): Promise<PagamentoUnicoResponse> {
    const body = {
      idMensalidade: input.idMensalidade,
      metodo: METODO_PAGAMENTO_TO_API[input.metodo],
      city: input.city,
      ip: input.ip || '0.0.0.0',
      latitude: input.latitude ?? 0,
      longitude: input.longitude ?? 0,
    };

    const response = await fetch(`${PAGAMENTO_BASE}/solicitar`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    return parsePaymentResponse(response, 'Erro ao solicitar pagamento da mensalidade');
  },

  async getExtrato(mes?: number, ano?: number): Promise<ExtratoPagamento[]> {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes.toString());
    if (ano) params.append('ano', ano.toString());
    const query = params.toString();
    const url = `${PAGAMENTO_BASE}/Extrato${query ? `?${query}` : ''}`;

    const response = await fetch(url, { headers: buildHeaders() });
    if (!response.ok) throw new Error((await parseApiError(response)) || 'Erro ao buscar extrato');
    const raw: unknown = await response.json();
    const list = Array.isArray(raw) ? raw : [];
    return list.reduce<ExtratoPagamento[]>((acc, item) => {
      const parsed = ExtratoPagamentoSchema.safeParse(item);
      if (parsed.success) acc.push(parsed.data);
      else console.warn('[pagamentoService] extrato item inválido:', parsed.error.issues, item);
      return acc;
    }, []);
  },

  async buscaPagamentos(busca?: string, status?: string): Promise<BuscaPagamento[]> {
    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (status && status !== 'Todos') params.append('status', status);
    const query = params.toString();
    const url = `${PAGAMENTO_BASE}/Busca${query ? `?${query}` : ''}`;

    const response = await fetch(url, { headers: buildHeaders() });
    if (!response.ok) throw new Error((await parseApiError(response)) || 'Erro ao buscar pagamentos');
    const raw: unknown = await response.json();
    const list = Array.isArray(raw) ? raw : [];
    return list.reduce<BuscaPagamento[]>((acc, item) => {
      const parsed = BuscaPagamentoSchema.safeParse(item);
      if (parsed.success) acc.push(parsed.data);
      else console.warn('[pagamentoService] busca item inválido:', parsed.error.issues, item);
      return acc;
    }, []);
  },

  async getPendentesRepasse(): Promise<PendenteRepasse[]> {
    const response = await fetch(`${PAGAMENTO_BASE}/pendentes-repasse`, { headers: buildHeaders() });
    if (!response.ok) throw new Error((await parseApiError(response)) || 'Erro ao buscar repasses pendentes');
    const raw: unknown = await response.json();
    const list = Array.isArray(raw) ? raw : [];
    return list.reduce<PendenteRepasse[]>((acc, item) => {
      const parsed = PendenteRepasseSchema.safeParse(item);
      if (parsed.success) acc.push(parsed.data);
      else console.warn('[pagamentoService] repasse item inválido:', parsed.error.issues, item);
      return acc;
    }, []);
  },

  async confirmarRepasse(idPagamento: number, comprovantePath: string): Promise<void> {
    const response = await fetch(`${PAGAMENTO_BASE}/${idPagamento}/confirmar-repasse`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(comprovantePath),
    });
    if (!response.ok) throw new Error(await parseApiError(response) || 'Erro ao confirmar repasse');
  },
};
