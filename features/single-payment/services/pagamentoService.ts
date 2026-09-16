import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  BuscaPagamento,
  BuscaPagamentoSchema,
  emptyPagamentoUnicoResponse,
  ExtratoPagamento,
  ExtratoPagamentoSchema,
  hasPagamentoUnicoInstrument,
  METODO_PAGAMENTO_TO_API,
  MetodoPagamento,
  PagamentoMensalidadeSolicitarInput,
  PagamentoUnicoResponse,
  PagamentoUnicoResponseSchema,
  PagamentoUnicoSolicitarInput,
} from '../schemas/cobrancaSchemas';

const PAGAMENTO_BASE = 'https://lojas.vlks.com.br/api/v1/Pagamento';

/**
 * Path published in swagger.json (2026-09-02). Backend typo: Pagemento, not Pagamento.
 * Do not "correct" until the API renames the action.
 */
const BUSCA_PAGAMENTO_UNICO_PATH = `${PAGAMENTO_BASE}/Busca/PagementoUnico`;

const isEmpresaDualAccount = (): boolean =>
  sessionService.isEmpresaOwner() || sessionService.getSession().user?.tipo === 'Empresa';

const resolvePayerToken = (): string | null => {
  if (isEmpresaDualAccount()) {
    return sessionService.getCachedToken('client') || sessionService.getSession().token;
  }
  return sessionService.getSession().token;
};

const buildHeaders = (): HeadersInit => {
  const token = resolvePayerToken();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

const GENERIC_PAYMENT_REQUEST_FAILURE =
  /erro ao solicitar pagamento\.?\s*tente novamente mais tarde/i;

const ADDRESS_FALLBACK_HINT =
  'A causa mais comum é o endereço incompleto no cadastro — não é possível confirmar só por esta mensagem. Cadastre ou revise em Configurações > Meu perfil > Endereço residencial e tente de novo.';

const MISSING_PAYMENT_CODE_ERROR =
  'O servidor aceitou o pedido, mas não devolveu código de pagamento nem identificador da fatura. Tente novamente ou escolha outro método.';

/** Mensagem genérica de unico-solicitar/solicitar quando PagamentoCora retorna null. */
export const isGenericPaymentRequestFailure = (message: string): boolean =>
  GENERIC_PAYMENT_REQUEST_FAILURE.test(message);

const isCashConfirmationText = (value: string): boolean =>
  /pagamento em dinheiro/i.test(value);

const looksLikePixEmv = (value: string): boolean =>
  /^000201/.test(value) || /br\.gov\.bcb\.pix/i.test(value);

const looksLikeUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const stripWrappingQuotes = (value: string): string =>
  value.replace(/^"+|"+$/g, '').trim();

const withPixEmv = (pixEmv: string): PagamentoUnicoResponse => ({
  ...emptyPagamentoUnicoResponse(),
  pixEmv,
});

const withBarcode = (barcode: string): PagamentoUnicoResponse => ({
  ...emptyPagamentoUnicoResponse(),
  barcode,
});

const withDigitableLine = (digitableLine: string): PagamentoUnicoResponse => ({
  ...emptyPagamentoUnicoResponse(),
  digitableLine,
});

const withBankSlipUrl = (bankSlipUrl: string): PagamentoUnicoResponse => ({
  ...emptyPagamentoUnicoResponse(),
  bankSlipUrl,
});

/**
 * `SolicitarUnico` responde `Ok(codigoPagamento)` — string JSON, não o DTO Bixs.
 * Dinheiro devolve texto de confirmação, sem código de pagamento.
 */
const pagamentoUnicoResponseFromText = (
  rawText: string,
  metodo: MetodoPagamento,
): PagamentoUnicoResponse => {
  const value = stripWrappingQuotes(rawText);
  if (!value || /^n\/a$/i.test(value)) {
    throw new Error(MISSING_PAYMENT_CODE_ERROR);
  }
  if (metodo === 'Dinheiro' || isCashConfirmationText(value)) {
    return emptyPagamentoUnicoResponse();
  }
  if (looksLikePixEmv(value)) return withPixEmv(value);
  if (looksLikeUrl(value)) return withBankSlipUrl(value);

  const digits = value.replace(/\D/g, '');
  if (digits.length >= 47 && digits.length <= 48) return withDigitableLine(value);
  if (digits.length === 44) return withBarcode(value);

  if (metodo === 'PIX' || metodo === 'PixCaixa') return withPixEmv(value);
  if (metodo === 'Boleto' || metodo === 'BoletoPix') {
    return digits.length >= 47 ? withDigitableLine(value) : withBarcode(value);
  }

  throw new Error(MISSING_PAYMENT_CODE_ERROR);
};

const assertUsablePaymentResponse = (
  parsed: PagamentoUnicoResponse,
  metodo: MetodoPagamento,
): PagamentoUnicoResponse => {
  if (hasPagamentoUnicoInstrument(parsed)) return parsed;
  if (metodo === 'Dinheiro') return parsed;
  throw new Error(MISSING_PAYMENT_CODE_ERROR);
};

/**
 * Extrai mensagens úteis do gateway embutidas no 500 da API PagWeb.
 * A mensagem original da API permanece no texto — a heurística só acrescenta caminho.
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

  if (isGenericPaymentRequestFailure(raw)) {
    const apiText = stripWrappingQuotes(raw);
    return `${apiText} ${ADDRESS_FALLBACK_HINT}`;
  }

  if (raw.length > 320) return `${raw.slice(0, 320)}…`;
  return raw;
};

const parsePaymentResponse = async (
  response: Response,
  fallbackMsg: string,
  metodo: MetodoPagamento,
): Promise<PagamentoUnicoResponse> => {
  if (!response.ok) {
    const raw = (await parseApiError(response)) || fallbackMsg;
    throw new Error(formatPaymentGatewayError(raw));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(MISSING_PAYMENT_CODE_ERROR);
  }

  if (typeof payload === 'string') {
    return pagamentoUnicoResponseFromText(payload, metodo);
  }

  const result = PagamentoUnicoResponseSchema.safeParse(payload);
  if (!result.success) {
    console.warn('[pagamentoService] parse warning:', result.error.issues, payload);
    throw new Error(MISSING_PAYMENT_CODE_ERROR);
  }

  return assertUsablePaymentResponse(result.data, metodo);
};

const buildBuscaQuery = (busca?: string, status?: string): string => {
  const params = new URLSearchParams();
  if (busca) params.append('busca', busca);
  if (status && status !== 'Todos') params.append('status', status);
  const query = params.toString();
  return query ? `?${query}` : '';
};

const parseBuscaList = async (
  response: Response,
  fallbackMsg: string,
): Promise<BuscaPagamento[]> => {
  if (!response.ok) throw new Error((await parseApiError(response)) || fallbackMsg);
  const raw: unknown = await response.json();
  const list = Array.isArray(raw) ? raw : [];
  return list.reduce<BuscaPagamento[]>((acc, item) => {
    const parsed = BuscaPagamentoSchema.safeParse(item);
    if (parsed.success) acc.push(parsed.data);
    else console.warn('[pagamentoService] busca item inválido:', parsed.error.issues, item);
    return acc;
  }, []);
};

/** Service de Pagamento — https://lojas.vlks.com.br/api/v1/Pagamento */
export const pagamentoService = {
  async solicitarPagamentoUnico(
    input: PagamentoUnicoSolicitarInput,
  ): Promise<PagamentoUnicoResponse> {
    const body = {
      idCobranca: input.idCobranca,
      metodo: METODO_PAGAMENTO_TO_API[input.metodo],
    };

    const response = await fetch(`${PAGAMENTO_BASE}/unico-solicitar`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    return parsePaymentResponse(response, 'Erro ao solicitar pagamento', input.metodo);
  },

  /** POST /solicitar — mensalidade de assinatura via Bixs. */
  async solicitarMensalidade(
    input: PagamentoMensalidadeSolicitarInput,
  ): Promise<PagamentoUnicoResponse> {
    const body = {
      idMensalidade: input.idMensalidade,
      metodo: METODO_PAGAMENTO_TO_API[input.metodo],
    };

    const response = await fetch(`${PAGAMENTO_BASE}/solicitar`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    return parsePaymentResponse(
      response,
      'Erro ao solicitar pagamento da mensalidade',
      input.metodo,
    );
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

  async buscaMensalidades(busca?: string, status?: string): Promise<BuscaPagamento[]> {
    const url = `${PAGAMENTO_BASE}/Busca/Mensalidades${buildBuscaQuery(busca, status)}`;
    const response = await fetch(url, { headers: buildHeaders() });
    return parseBuscaList(response, 'Erro ao buscar mensalidades');
  },

  async buscaPagamentoUnico(busca?: string, status?: string): Promise<BuscaPagamento[]> {
    const url = `${BUSCA_PAGAMENTO_UNICO_PATH}${buildBuscaQuery(busca, status)}`;
    const response = await fetch(url, { headers: buildHeaders() });
    return parseBuscaList(response, 'Erro ao buscar pagamentos únicos');
  },
};
