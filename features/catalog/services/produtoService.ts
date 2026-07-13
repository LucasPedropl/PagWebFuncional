import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  CatalogItem,
  CatalogItemInput,
  CatalogItemSchema,
} from '../schemas/catalogSchemas';

const BASE = 'https://lojas.vlks.com.br/api/Produtos';

const buildHeaders = (withJson = false): HeadersInit => {
  const { token } = sessionService.getSession();
  const headers: Record<string, string> = {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
  };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
};

const parseList = (raw: unknown): CatalogItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const result = CatalogItemSchema.safeParse(item);
      if (!result.success) {
        console.warn('[produtoService] parse:', result.error.issues, item);
        return null;
      }
      return result.data;
    })
    .filter((p): p is CatalogItem => p !== null);
};

const mergeById = (lists: CatalogItem[][]): CatalogItem[] => {
  const map = new Map<number, CatalogItem>();
  for (const list of lists) {
    for (const item of list) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
};

/** Produtos — /api/Produtos */
export const produtoService = {
  /**
   * Público AllowAnonymous — agrega por categorias (path exige `{categoria}`).
   */
  async listPublico(idEmpresa: number, categoriaIds: number[]): Promise<CatalogItem[]> {
    const ids = categoriaIds.length > 0 ? categoriaIds : [0];
    const lists = await Promise.all(
      ids.map(async (catId) => {
        const response = await fetch(`${BASE}/empresa-publico/${idEmpresa}/${catId}`, {
          headers: buildHeaders(),
        });
        if (!response.ok) {
          console.warn('[produtoService] publico cat', catId, await parseApiError(response));
          return [] as CatalogItem[];
        }
        return parseList(await response.json());
      }),
    );
    return mergeById(lists);
  },

  async getById(id: number): Promise<CatalogItem> {
    const response = await fetch(`${BASE}/${id}`, { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Produto não encontrado');
    }
    const result = CatalogItemSchema.safeParse(await response.json());
    if (!result.success) {
      throw new Error('Resposta de produto inválida');
    }
    return result.data;
  },

  /**
   * Lista produtos da empresa (admin).
   * Agrega por categorias porque o path exige `{categoria}`.
   */
  async listByEmpresa(categoriaIds: number[]): Promise<CatalogItem[]> {
    const ids = categoriaIds.length > 0 ? categoriaIds : [0];
    const lists = await Promise.all(
      ids.map(async (catId) => {
        const response = await fetch(`${BASE}/empresa-empresa/${catId}`, {
          headers: buildHeaders(),
        });
        if (!response.ok) {
          console.warn('[produtoService] list cat', catId, await parseApiError(response));
          return [] as CatalogItem[];
        }
        return parseList(await response.json());
      }),
    );
    return mergeById(lists);
  },

  async create(input: CatalogItemInput): Promise<void> {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        nome: input.nome,
        preco: input.preco,
        descricao: input.descricao,
        categorias: input.categorias ?? [],
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao criar produto');
    }
  },

  async update(id: number, input: CatalogItemInput): Promise<void> {
    const response = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify({
        id,
        nome: input.nome,
        preco: input.preco,
        descricao: input.descricao,
        categorias: input.categorias ?? [],
      }),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar produto');
    }
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao excluir produto');
    }
  },
};
