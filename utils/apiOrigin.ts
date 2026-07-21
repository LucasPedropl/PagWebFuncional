const PRODUCTION_API_ORIGIN = 'https://lojas.vlks.com.br';

/** Origem da API (vazio em dev = mesmo host + proxy Vite em `/api`). */
export function getApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return PRODUCTION_API_ORIGIN;
}

export function apiV1Url(path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  const origin = getApiOrigin();
  return origin ? `${origin}/api/v1${suffix}` : `/api/v1${suffix}`;
}

export function apiUrl(path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  const origin = getApiOrigin();
  return origin ? `${origin}/api${suffix}` : `/api${suffix}`;
}
