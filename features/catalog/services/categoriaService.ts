import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  Categoria,
  CategoriaInput,
  CategoriaSchema,
} from '../schemas/catalogSchemas';

const BASE = 'https://lojas.vlks.com.br/api/Categorias';

const buildHeaders = (withJson = false): HeadersInit => {
  const { token } = sessionService.getSession();
  const headers: Record<string, string> = {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
  };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
};

const parseList = (raw: unknown): Categoria[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const result = CategoriaSchema.safeParse(item);
      if (!result.success) {
        console.warn('[categoriaService] parse:', result.error.issues, item);
        return null;
      }
      return result.data;
    })
    .filter((c): c is Categoria => c !== null);
};

/** Categorias — /api/Categorias (sem /v1) */
export const categoriaService = {
  /** Público AllowAnonymous — vitrine Explorar / CompanyDetails. */
  async listPublico(idEmpresa: number): Promise<Categoria[]> {
    const response = await fetch(`${BASE}/empresa-categorias-publico/${idEmpresa}`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar categorias públicas');
    }
    return parseList(await response.json());
  },

  async getById(id: number): Promise<Categoria> {
    const response = await fetch(`${BASE}/${id}`, { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Categoria não encontrada');
    }
    const result = CategoriaSchema.safeParse(await response.json());
    if (!result.success) {
      throw new Error('Resposta de categoria inválida');
    }
    return result.data;
  },

  /** Admin: usa vínculo do token; idEmpresa na URL é ignorado pela API. */
  async listPrivado(idEmpresa = 0): Promise<Categoria[]> {
    const response = await fetch(`${BASE}/empresa-categorias-privado/${idEmpresa}`, {
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao listar categorias');
    }
    return parseList(await response.json());
  },

  async create(input: CategoriaInput): Promise<void> {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ nome: input.nome, descricao: input.descricao }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao criar categoria');
    }
  },

  async update(id: number, input: CategoriaInput): Promise<void> {
    const response = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify({ id, nome: input.nome, descricao: input.descricao }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar categoria');
    }
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao excluir categoria');
    }
  },
};
