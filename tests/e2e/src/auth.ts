/**
 * Autenticação: os três papéis que o backend emite (`TolkenService.GenerateToken`).
 *
 * - `Admin`   → `/User/login-admin` com `mac: "pagweb"` (dono de empresa)
 * - `Cliente` → `/User/login-cliente` com `mac: ""`
 * - `Master`  → `/User/login-admin` com as credenciais da BixS (atalho hardcoded
 *   no controller, `IdUser = 0`, não é uma linha da tabela User)
 */
import { MASTER_CREDENTIALS } from './config';
import { api, decodeJwt, NAME_ID_CLAIM, ROLE_CLAIM } from './http';
import type { SeededUser } from './state';

export interface AuthResult {
  token: string;
  role: string;
  idUser: number;
  nome: string;
  email: string;
  primeiroLogin?: boolean;
}

interface LoginResponse {
  token?: string;
  user?: { nome?: string; email?: string };
  primeirologin?: boolean;
  message?: string;
}

const toAuthResult = (token: string, payload: LoginResponse): AuthResult => {
  const claims = decodeJwt(token);
  return {
    token,
    role: String(claims[ROLE_CLAIM] ?? ''),
    idUser: Number(claims[NAME_ID_CLAIM] ?? -1),
    nome: payload.user?.nome ?? '',
    email: payload.user?.email ?? '',
    primeiroLogin: payload.primeirologin,
  };
};

/** Login administrativo (dono de empresa). Lança se falhar — é pré-condição. */
export const loginAdmin = async (email: string, password: string): Promise<AuthResult> => {
  const res = await api.post<LoginResponse>('/api/v1/User/login-admin', { email, password, mac: 'pagweb' });
  if (!res.ok || !res.body?.token) {
    throw new Error(`login-admin falhou para ${email}: ${res.status} ${res.text}`);
  }
  return toAuthResult(res.body.token, res.body);
};

/** Login de cliente final. Lança se falhar — é pré-condição. */
export const loginCliente = async (email: string, password: string): Promise<AuthResult> => {
  const res = await api.post<LoginResponse>('/api/v1/User/login-cliente', { email, password, mac: '' });
  if (!res.ok || !res.body?.token) {
    throw new Error(`login-cliente falhou para ${email}: ${res.status} ${res.text}`);
  }
  return toAuthResult(res.body.token, res.body);
};

/** Login da conta Master da BixS (role `Master`). */
export const loginMaster = async (): Promise<AuthResult> => {
  const res = await api.post<LoginResponse>('/api/v1/User/login-admin', {
    email: MASTER_CREDENTIALS.email,
    password: MASTER_CREDENTIALS.password,
    mac: 'pagweb',
  });
  if (!res.ok || !res.body?.token) {
    throw new Error(`login master falhou: ${res.status} ${res.text}`);
  }
  return toAuthResult(res.body.token, res.body);
};

export const tokenForAdmin = (user: SeededUser) => loginAdmin(user.email, user.password);
export const tokenForCliente = (user: SeededUser) => loginCliente(user.email, user.password);
