import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  METODO_PAGAMENTO_TO_API,
  PagamentoMensalidadeSolicitarInput,
  PagamentoUnicoResponse,
  PagamentoUnicoResponseSchema,
  PagamentoUnicoSolicitarInput,
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

const parsePaymentResponse = async (
  response: Response,
  fallbackMsg: string,
): Promise<PagamentoUnicoResponse> => {
  if (!response.ok) {
    throw new Error((await parseApiError(response)) || fallbackMsg);
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

/** Geolocation + city fallback para body Bixs. */
export const resolvePaymentLocation = async (): Promise<{
  city: string;
  latitude: number;
  longitude: number;
}> => {
  let city = 'Sao Paulo';
  let latitude = 0;
  let longitude = 0;
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  } catch {
    // fallback city obrigatório
  }
  return { city, latitude, longitude };
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
      ip: input.ip ?? undefined,
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
      ip: input.ip ?? undefined,
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
};
