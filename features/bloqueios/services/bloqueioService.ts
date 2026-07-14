import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  EmpresaBloqueada,
  EmpresaBloqueadaSchema,
  PlanoBloqueado,
  PlanoBloqueadoSchema,
} from '../schemas/bloqueioSchemas';

const BASE = 'https://lojas.vlks.com.br/api/UserBloqueio';

const buildHeaders = (): HeadersInit => {
  const { token } = sessionService.getSession();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

const parseEmpresaList = (raw: unknown): EmpresaBloqueada[] => {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<EmpresaBloqueada[]>((acc, item) => {
    const parsed = EmpresaBloqueadaSchema.safeParse(item);
    if (parsed.success && parsed.data.idEmpresa > 0) acc.push(parsed.data);
    return acc;
  }, []);
};

const parsePlanoList = (raw: unknown): PlanoBloqueado[] => {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<PlanoBloqueado[]>((acc, item) => {
    const parsed = PlanoBloqueadoSchema.safeParse(item);
    if (parsed.success && parsed.data.idPlano > 0) acc.push(parsed.data);
    return acc;
  }, []);
};

/** CRUD de bloqueios do cliente (UserBloqueio). */
export const bloqueioService = {
  async listEmpresas(busca?: string): Promise<EmpresaBloqueada[]> {
    const qs = busca?.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';
    const response = await fetch(`${BASE}/meus-bloqueios/empresas${qs}`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar empresas bloqueadas');
    }
    const raw: unknown = await response.json();
    if (raw && typeof raw === 'object' && 'message' in raw && !Array.isArray(raw)) {
      return [];
    }
    return parseEmpresaList(raw);
  },

  async listPlanos(busca?: string): Promise<PlanoBloqueado[]> {
    const qs = busca?.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';
    const response = await fetch(`${BASE}/meus-bloqueios/planos${qs}`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar planos bloqueados');
    }
    const raw: unknown = await response.json();
    if (raw && typeof raw === 'object' && 'message' in raw && !Array.isArray(raw)) {
      return [];
    }
    return parsePlanoList(raw);
  },

  async bloquearEmpresa(empresaId: number): Promise<void> {
    const response = await fetch(`${BASE}/empresa/${empresaId}`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao bloquear empresa');
    }
  },

  async desbloquearEmpresa(empresaId: number): Promise<void> {
    const response = await fetch(`${BASE}/empresa/${empresaId}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao desbloquear empresa');
    }
  },

  async bloquearPlano(planoId: number): Promise<void> {
    const response = await fetch(`${BASE}/plano/${planoId}`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao bloquear plano');
    }
  },

  async desbloquearPlano(planoId: number): Promise<void> {
    const response = await fetch(`${BASE}/plano/${planoId}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao desbloquear plano');
    }
  },
};
