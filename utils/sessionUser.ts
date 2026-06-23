import { sessionService } from '../services/session';

const getUserIdFromToken = (token: string): number => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as Record<string, unknown>;
    const nameId =
      payload.nameid ??
      payload.sub ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      payload.id ??
      payload.idUser;

    return nameId ? Number(nameId) : 0;
  } catch {
    return 0;
  }
};

/** Identidade do cliente logado (id + e-mail) para filtros locais. */
export const getSessionClientIdentity = (): { idUser: number; email: string } => {
  const { token, user } = sessionService.getSession();
  const rawUser = user as { idUser?: number; IdUser?: number; email?: string; Email?: string } | null;

  let idUser = Number(rawUser?.idUser ?? rawUser?.IdUser ?? 0);
  if (!idUser && token) {
    idUser = getUserIdFromToken(token);
  }

  const email = (rawUser?.email ?? rawUser?.Email ?? '').trim().toLowerCase();
  return { idUser, email };
};

export const SINGLE_PAYMENT_CHANGED_EVENT = 'pagweb:single-payment-changed';

export const notifySinglePaymentChanged = (): void => {
  window.dispatchEvent(new CustomEvent(SINGLE_PAYMENT_CHANGED_EVENT));
  window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
};
