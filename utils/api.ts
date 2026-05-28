
export const API_BASE_URL = "https://lojas.vlks.com.br";

/** AssinaturaStatus — espelha enum da API */
export const ASSINATURA_STATUS = {
  Ativo: 0,
  Suspenso: 1,
  Cancelado: 2,
  Pendente: 3,
} as const;

/** TipoDesconto — espelha enum da API */
export const TIPO_DESCONTO = {
  Percentual: 0,
  ValorFixo: 1,
} as const;

/** Contrato (tipo no plano) — espelha enum da API */
export const TIPO_CONTRATO = {
  Nenhum: 0,
  Termo: 1,
  Contrato: 2,
} as const;

type PlanContractSource = {
  tipoContrato?: number;
  TipoContrato?: number;
};

type SubscriptionContractSource = {
  tipoContratoPlano?: number;
};

/** Lê o tipo de contrato de um plano (API pode vir em camelCase ou PascalCase). */
export const getPlanTipoContrato = (plan?: PlanContractSource | null): number =>
  Number(plan?.tipoContrato ?? plan?.TipoContrato ?? TIPO_CONTRATO.Nenhum);

/** Lê o tipo de contrato vinculado a uma assinatura do cliente. */
export const getSubscriptionTipoContrato = (sub?: SubscriptionContractSource | null): number =>
  Number(sub?.tipoContratoPlano ?? TIPO_CONTRATO.Nenhum);

/** Contrato (tipo 2): exige assinatura desenhada e foto do usuário. */
export const requiresSignedContractType = (tipo: number): boolean =>
  tipo === TIPO_CONTRATO.Contrato;

/** Termo (1) ou Contrato (2): exige aceite via checkbox (sem assinatura/foto no termo). */
export const requiresContractAckType = (tipo: number): boolean =>
  tipo === TIPO_CONTRATO.Termo || tipo === TIPO_CONTRATO.Contrato;

export type AssinaturaStatusName = keyof typeof ASSINATURA_STATUS;

export const toAssinaturaStatusCode = (status: string | number): number => {
  if (typeof status === 'number') return status;
  const normalized = status.trim();
  const map: Record<string, number> = {
    Ativo: ASSINATURA_STATUS.Ativo,
    Ativa: ASSINATURA_STATUS.Ativo,
    Suspenso: ASSINATURA_STATUS.Suspenso,
    Suspensa: ASSINATURA_STATUS.Suspenso,
    Cancelado: ASSINATURA_STATUS.Cancelado,
    Cancelada: ASSINATURA_STATUS.Cancelado,
    Pendente: ASSINATURA_STATUS.Pendente,
  };
  return map[normalized] ?? ASSINATURA_STATUS.Ativo;
};

/**
 * Normaliza campos de contrato vindos da API (PascalCase/camelCase).
 */
export const resolveContractPath = (
  source?: {
    contratoPath?: string | null;
    contrato?: string | null;
    ContratoPath?: string | null;
    Contrato?: string | null;
  } | null
): string | null => {
  if (!source) return null;
  return (
    source.contratoPath ??
    source.ContratoPath ??
    source.contrato ??
    source.Contrato ??
    null
  );
};

const buildAssetUrl = (path: string): string => {
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const withSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${API_BASE_URL}${withSlash}`;
};

/**
 * Retorna a URL completa para uma imagem vinda da API
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  return buildAssetUrl(path);
};

/** URL para exibir contrato (iframe / nova aba) */
export const getContractUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  return buildAssetUrl(path);
};

/**
 * URL para buscar bytes do PDF (evita CORS em dev via proxy do Vite).
 * Em produção no mesmo host da API, usa URL absoluta direta.
 */
export const getContractFetchUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      return `/api-assets${parsed.pathname}${parsed.search}`;
    } catch {
      return path;
    }
  }

  const normalizedPath = path.replace(/\\/g, '/');
  const withSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  return `/api-assets${withSlash}`;
};
