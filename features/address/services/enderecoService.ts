import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  EnderecoEntity,
  EnderecoEntitySchema,
  EnderecoInput,
  EnderecoInputSchema,
  EnderecoUpdate,
  EnderecoUpdateSchema,
  emptyEndereco,
  isAddressAlreadyExistsError,
} from '../schemas/enderecoSchemas';

const ENDERECO_BASE = 'https://lojas.vlks.com.br/api/v1/Endereco';
const CLIENT_ADDRESS_FLAG = 'pagweb_client_address_ok';
const EMPRESA_ADDRESS_FLAG = 'pagweb_empresa_address_ok';
const CLIENT_ADDRESS_ID = 'pagweb_client_address_id';
const EMPRESA_ADDRESS_ID = 'pagweb_empresa_address_id';
const CLIENT_ADDRESS_DRAFT = 'pagweb_client_address_draft';
const EMPRESA_ADDRESS_DRAFT = 'pagweb_empresa_address_draft';

type AddressScope = 'client' | 'empresa';

const buildHeaders = (): HeadersInit => {
  const { token } = sessionService.getSession();
  return {
    accept: '*/*',
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

const toApiBody = (input: EnderecoInput) => {
  const parsed = EnderecoInputSchema.parse(input);
  return {
    rua: parsed.rua,
    numero: parsed.numero,
    bairro: parsed.bairro,
    cidade: parsed.cidade,
    estado: parsed.estado,
    cep: parsed.cep,
  };
};

const idKey = (scope: AddressScope) =>
  scope === 'client' ? CLIENT_ADDRESS_ID : EMPRESA_ADDRESS_ID;

const draftKey = (scope: AddressScope) =>
  scope === 'client' ? CLIENT_ADDRESS_DRAFT : EMPRESA_ADDRESS_DRAFT;

const extractIdFromUnknown = (raw: unknown): number | null => {
  if (typeof raw === 'object' && raw !== null) {
    const parsed = EnderecoEntitySchema.safeParse(raw);
    if (parsed.success && parsed.data.idEndereco > 0) return parsed.data.idEndereco;
  }
  return null;
};

/** Service de Endereço — POST usuario/empresa + PATCH /{id}. */
export const enderecoService = {
  hasClientAddressFlag(): boolean {
    return localStorage.getItem(CLIENT_ADDRESS_FLAG) === '1';
  },

  markClientAddressOk(): void {
    localStorage.setItem(CLIENT_ADDRESS_FLAG, '1');
  },

  clearClientAddressFlag(): void {
    localStorage.removeItem(CLIENT_ADDRESS_FLAG);
  },

  hasEmpresaAddressFlag(): boolean {
    return localStorage.getItem(EMPRESA_ADDRESS_FLAG) === '1';
  },

  markEmpresaAddressOk(): void {
    localStorage.setItem(EMPRESA_ADDRESS_FLAG, '1');
  },

  getStoredAddressId(scope: AddressScope): number | null {
    const raw = localStorage.getItem(idKey(scope));
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  },

  setStoredAddressId(scope: AddressScope, id: number): void {
    localStorage.setItem(idKey(scope), String(id));
  },

  clearStoredAddressId(scope: AddressScope): void {
    localStorage.removeItem(idKey(scope));
  },

  getDraft(scope: AddressScope): EnderecoInput {
    try {
      const raw = localStorage.getItem(draftKey(scope));
      if (!raw) return emptyEndereco();
      const parsed = EnderecoInputSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : emptyEndereco();
    } catch {
      return emptyEndereco();
    }
  },

  saveDraft(scope: AddressScope, input: EnderecoInput): void {
    localStorage.setItem(draftKey(scope), JSON.stringify(toApiBody(input)));
  },

  clearAllAddressLocalState(): void {
    localStorage.removeItem(CLIENT_ADDRESS_FLAG);
    localStorage.removeItem(EMPRESA_ADDRESS_FLAG);
    localStorage.removeItem(CLIENT_ADDRESS_ID);
    localStorage.removeItem(EMPRESA_ADDRESS_ID);
    localStorage.removeItem(CLIENT_ADDRESS_DRAFT);
    localStorage.removeItem(EMPRESA_ADDRESS_DRAFT);
  },

  async createForUser(input: EnderecoInput): Promise<void> {
    const response = await fetch(`${ENDERECO_BASE}/usuario`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    if (!response.ok) {
      const msg =
        (await parseApiError(response)) || 'Erro ao salvar endereço do usuário';
      // EnderecoUser é 1:1 — segundo POST falha; endereço já está no backend.
      if (response.status === 400 && isAddressAlreadyExistsError(msg)) {
        this.saveDraft('client', input);
        this.markClientAddressOk();
        return;
      }
      throw new Error(msg);
    }
    this.saveDraft('client', input);
    this.markClientAddressOk();
    try {
      const text = await response.text();
      const raw: unknown = text ? JSON.parse(text) : null;
      const id = extractIdFromUnknown(raw);
      if (id) this.setStoredAddressId('client', id);
    } catch {
      // API atual retorna string; id fica só após PATCH bem-sucedido.
    }
  },

  async createForEmpresa(input: EnderecoInput): Promise<void> {
    const response = await fetch(`${ENDERECO_BASE}/empresa`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    if (!response.ok) {
      const msg =
        (await parseApiError(response)) || 'Erro ao salvar endereço da empresa';
      // EnderecoEmpresa é 1:1 — segundo POST costuma falhar se já existe.
      if (
        response.status === 400 &&
        /erro ao criar endere[cç]o para a empresa/i.test(msg)
      ) {
        this.saveDraft('empresa', input);
        this.markEmpresaAddressOk();
        return;
      }
      throw new Error(msg);
    }
    this.saveDraft('empresa', input);
    this.markEmpresaAddressOk();
    try {
      const text = await response.text();
      const raw: unknown = text ? JSON.parse(text) : null;
      const id = extractIdFromUnknown(raw);
      if (id) this.setStoredAddressId('empresa', id);
    } catch {
      // API atual retorna string.
    }
  },

  async update(id: number, input: EnderecoUpdate): Promise<EnderecoEntity> {
    const parsed = EnderecoUpdateSchema.parse(input);
    const response = await fetch(`${ENDERECO_BASE}/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(parsed),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao atualizar endereço');
    }
    const raw: unknown = await response.json();
    const result = EnderecoEntitySchema.safeParse(raw);
    if (!result.success) {
      throw new Error('Resposta de endereço inválida');
    }
    return result.data;
  },

  /**
   * Salva endereço: PATCH se houver id local; senão POST create.
   * A API de create não devolve IdEndereco — o id é capturado no PATCH.
   */
  async saveForScope(scope: AddressScope, input: EnderecoInput): Promise<void> {
    const existingId = this.getStoredAddressId(scope);
    if (existingId) {
      const updated = await this.update(existingId, input);
      if (updated.idEndereco > 0) this.setStoredAddressId(scope, updated.idEndereco);
      this.saveDraft(scope, input);
      if (scope === 'client') this.markClientAddressOk();
      else this.markEmpresaAddressOk();
      return;
    }
    if (scope === 'client') await this.createForUser(input);
    else await this.createForEmpresa(input);
  },
};
