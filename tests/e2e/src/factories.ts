/**
 * Factories: criam entidades reais via API para servir de pré-condição.
 *
 * Cada factory lança em caso de falha — pré-condição quebrada deve estourar como
 * erro de setup, não virar uma asserção confusa no meio do teste.
 */
import { label } from './data';
import { api, toFormData } from './http';

const must = <T>(res: { ok: boolean; status: number; text: string; body: T }, what: string): T => {
  if (!res.ok) throw new Error(`Falha ao criar ${what}: ${res.status} ${res.text.slice(0, 300)}`);
  return res.body;
};

/** `Contrato` no backend: 0 = Nenhum, 1 = Termo, 2 = Contrato. */
export const TIPO_CONTRATO = { Nenhum: 0, Termo: 1, Contrato: 2 } as const;

/** `AssinaturaStatus`: 0 Ativo, 1 Suspenso, 2 Cancelado, 3 Pendente. */
export const ASSINATURA_STATUS = { Ativo: 0, Suspenso: 1, Cancelado: 2, Pendente: 3 } as const;

/** `Estado` (ControleAcesso): 0 Ativo, 1 Inativo, 2 Solicitado. */
export const ESTADO = { Ativo: 0, Inativo: 1, Solicitado: 2 } as const;

export interface Plano {
  idPlano: number;
  nome: string;
  valorMensalidade: number;
}

export const createPlano = async (
  adminToken: string,
  overrides: Partial<{
    Nome: string;
    ValorMensalidade: number;
    PercentualMulta: number;
    PercentualJurosMensal: number;
    TipoContrato: number;
    cancelamentoDias: number;
    assinarPorCliente: boolean;
    Funcionalidades: string[];
  }> = {},
): Promise<Plano> => {
  const payload = {
    Nome: label('Plano'),
    ValorMensalidade: 99.9,
    PercentualMulta: 2,
    PercentualJurosMensal: 1,
    TipoContrato: TIPO_CONTRATO.Nenhum,
    cancelamentoDias: 30,
    assinarPorCliente: false,
    Funcionalidades: ['Acesso completo', 'Suporte'],
    ...overrides,
  };
  const res = await api.post<Plano>('/api/v1/Plano', toFormData(payload), { token: adminToken });
  return must(res, 'plano');
};

export interface Categoria {
  id: number;
  nome: string;
}

export const createCategoria = async (adminToken: string, nome = label('Categoria')): Promise<Categoria> => {
  const res = await api.post<Categoria>(
    '/api/Categorias',
    { nome, descricao: 'Categoria criada pela suíte E2E' },
    { token: adminToken },
  );
  return must(res, 'categoria');
};

export interface Produto {
  id: number;
  nome: string;
  preco: number;
}

export const createProduto = async (
  adminToken: string,
  categorias: number[] = [],
  overrides: Partial<{ nome: string; preco: number; descricao: string }> = {},
): Promise<Produto> => {
  const res = await api.post<Produto>(
    '/api/Produtos',
    {
      nome: label('Produto'),
      preco: 49.9,
      descricao: 'Produto criado pela suíte E2E',
      categorias,
      ...overrides,
    },
    { token: adminToken },
  );
  return must(res, 'produto');
};

export interface Servico {
  id: number;
  nome: string;
  preco: number;
}

export const createServico = async (
  adminToken: string,
  categorias: number[] = [],
  overrides: Partial<{ nome: string; preco: number; descricao: string }> = {},
): Promise<Servico> => {
  const res = await api.post<Servico>(
    '/api/Servicos',
    {
      nome: label('Servico'),
      preco: 149.9,
      descricao: 'Serviço criado pela suíte E2E',
      categorias,
      ...overrides,
    },
    { token: adminToken },
  );
  return must(res, 'serviço');
};

export interface Assinatura {
  idAssinatura?: number;
  IdAssinatura?: number;
}

/** Assinatura criada pelo Admin para um cliente já conectado à empresa. */
export const createAssinatura = async (
  adminToken: string,
  idUser: number,
  idPlano: number,
  overrides: Partial<{ Periodo: number; DiaPagamento: number; Desconto: number; TipoDesconto: number }> = {},
): Promise<Assinatura> => {
  const res = await api.post<Assinatura>(
    '/api/v1/Assinatura',
    toFormData({
      IdUser: idUser,
      IdPlano: idPlano,
      Periodo: 12,
      DiaPagamento: 10,
      Desconto: 0,
      TipoDesconto: 0,
      Observacao: 'Assinatura E2E',
      ...overrides,
    }),
    { token: adminToken },
  );
  return must(res, 'assinatura');
};

export interface Cobranca {
  id: number;
  descricao: string;
  valorTotal: number;
}

/**
 * Cobrança avulsa (pagamento único) emitida pelo Admin para um cliente.
 *
 * O POST responde só com o texto "Cobrança criada com sucesso." — sem id nem
 * corpo JSON. Por isso a factory recupera o registro na listagem da empresa
 * usando a descrição, que `label()` garante única.
 */
export const createCobranca = async (
  adminToken: string,
  idUser: number,
  itens: { servicos?: number[]; produtos?: number[]; valorTotal?: number } = {},
): Promise<Cobranca> => {
  const descricao = label('Cobranca');
  const res = await api.post(
    '/api/Cobrancas',
    {
      descricao,
      observacao: 'Cobrança criada pela suíte E2E',
      idUser,
      valorTotal: itens.valorTotal ?? 199.9,
      servicos: itens.servicos ?? [],
      produtos: itens.produtos ?? [],
    },
    { token: adminToken },
  );
  must(res, 'cobrança');

  const lista = await api.get<Cobranca[]>('/api/Cobrancas/Empresa', { token: adminToken });
  const criada = Array.isArray(lista.body) ? lista.body.find((c) => c.descricao === descricao) : undefined;
  if (!criada) {
    throw new Error(`Cobrança "${descricao}" não apareceu na listagem da empresa após a criação.`);
  }
  return criada;
};

/** Endereço do usuário logado — pré-condição de vários fluxos de pagamento. */
export const createEnderecoUsuario = async (
  token: string,
  endereco: { rua: string; numero: string; bairro: string; cidade: string; estado: string; cep: string },
) => {
  const res = await api.post('/api/v1/Endereco/usuario', endereco, { token });
  return must(res, 'endereço do usuário');
};

export const createChavePix = async (adminToken: string, chave: string, tipoChave = 'Aleatoria') => {
  const res = await api.post('/api/ChavesPix', { chave, tipoChave }, { token: adminToken });
  return must(res, 'chave PIX');
};
