/**
 * Cliente HTTP da suíte.
 *
 * Regra de ouro: **nunca lança** em status != 2xx. Quem decide o que é sucesso é
 * o teste — inclusive nos casos negativos (401/403/404), que são metade do valor
 * de uma suíte E2E.
 */
import { API_BASE_URL, HTTP_TIMEOUT_MS } from './config';

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  /** Corpo já desserializado quando `application/json`; texto cru caso contrário. */
  body: T;
  text: string;
  headers: Headers;
  /** Método + caminho, útil em mensagens de asserção. */
  request: string;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  token?: string | null;
  query?: QueryParams;
  headers?: Record<string, string>;
  /** Não envia `Content-Type` — usado com FormData. */
  raw?: boolean;
}

const buildUrl = (path: string, query?: QueryParams): string => {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const parse = (text: string): unknown => {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { accept: '*/*', ...(options.headers ?? {}) };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (body !== undefined && !isForm && !options.raw) headers['Content-Type'] = 'application/json';

  const url = buildUrl(path, options.query);
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });

  const text = await response.text();
  return {
    status: response.status,
    ok: response.ok,
    body: parse(text) as T,
    text,
    headers: response.headers,
    request: `${method} ${path}`,
  };
}

/** Converte um objeto plano em FormData (endpoints `[FromForm]` do ASP.NET). */
export const toFormData = (payload: Record<string, unknown>): FormData => {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      // ASP.NET liga listas repetindo a mesma chave.
      for (const item of value) form.append(key, String(item));
      continue;
    }
    if (value instanceof Blob) {
      form.append(key, value);
      continue;
    }
    form.append(key, String(value));
  }
  return form;
};

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('DELETE', path, body, options),
};

/** Decodifica o payload de um JWT sem validar assinatura (só para asserções). */
export const decodeJwt = (token: string): Record<string, unknown> => {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('JWT malformado');
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
};

/** Claim de role emitida pelo `TolkenService` do backend. */
export const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
/** Claim de id do usuário emitida pelo `TolkenService` do backend. */
export const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
