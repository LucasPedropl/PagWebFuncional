import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import {
  AddressAlreadyExistsWithoutIdError,
  AddressPersistenceState,
  AddressSaveResult,
  EnderecoEntity,
  EnderecoEntitySchema,
  EnderecoInput,
  EnderecoInputSchema,
  EnderecoUpdate,
  EnderecoUpdateSchema,
  emptyEndereco,
  isAddressAlreadyExistsError,
  isEmpresaAddressAlreadyExistsError,
} from '../schemas/enderecoSchemas';
import { extractAddressIdFromUnknown } from '../utils/extractAddressId';

const ENDERECO_BASE = 'https://lojas.vlks.com.br/api/v1/Endereco';
const CLIENT_ADDRESS_FLAG = 'pagweb_client_address_ok';
const EMPRESA_ADDRESS_FLAG = 'pagweb_empresa_address_ok';
const CLIENT_ADDRESS_ID = 'pagweb_client_address_id';
const EMPRESA_ADDRESS_ID = 'pagweb_empresa_address_id';
const CLIENT_ADDRESS_DRAFT = 'pagweb_client_address_draft';
const EMPRESA_ADDRESS_DRAFT = 'pagweb_empresa_address_draft';
const CLIENT_SERVER_SYNC = 'pagweb_client_address_server_synced';
const EMPRESA_SERVER_SYNC = 'pagweb_empresa_address_server_synced';

export type AddressScope = 'client' | 'empresa';

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
  const complemento = parsed.complemento?.trim() ?? '';
  return {
    rua: parsed.rua,
    numero: parsed.numero,
    complemento: complemento.length > 0 ? complemento : undefined,
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

const syncKey = (scope: AddressScope) =>
  scope === 'client' ? CLIENT_SERVER_SYNC : EMPRESA_SERVER_SYNC;

const persistIdFromResponse = (scope: AddressScope, raw: unknown): number | null => {
  const id = extractAddressIdFromUnknown(raw);
  if (id) enderecoService.setStoredAddressId(scope, id);
  return id;
};

const markServerSynced = (scope: AddressScope): void => {
  localStorage.setItem(syncKey(scope), '1');
  if (scope === 'client') enderecoService.markClientAddressOk();
  else enderecoService.markEmpresaAddressOk();
};

const rememberLocalDraft = (scope: AddressScope, input: EnderecoInput): void => {
  enderecoService.saveDraft(scope, input);
};

/** Service de Endereço — POST usuario/empresa + PATCH /{id}. Sem GET na API. */
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

  wasPersistedOnServer(scope: AddressScope): boolean {
    return localStorage.getItem(syncKey(scope)) === '1';
  },

  getPersistenceState(scope: AddressScope): AddressPersistenceState {
    const serverAddressId = this.getStoredAddressId(scope);
    const draft = this.getDraft(scope);
    const hasLocalDraft = Boolean(draft.rua || draft.cep);
    return {
      serverAddressId,
      hasLocalDraft,
      persistedOnServer: this.wasPersistedOnServer(scope) || serverAddressId != null,
    };
  },

  getDraft(scope: AddressScope): EnderecoInput {
    try {
      const raw = localStorage.getItem(draftKey(scope));
      if (!raw) return emptyEndereco();
      const parsed = EnderecoInputSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return emptyEndereco();
      return { ...emptyEndereco(), ...parsed.data, complemento: parsed.data.complemento ?? '' };
    } catch {
      return emptyEndereco();
    }
  },

  saveDraft(scope: AddressScope, input: EnderecoInput): void {
    const body = toApiBody(input);
    localStorage.setItem(
      draftKey(scope),
      JSON.stringify({
        ...body,
        complemento: input.complemento?.trim() ?? '',
      }),
    );
  },

  clearAllAddressLocalState(): void {
    localStorage.removeItem(CLIENT_ADDRESS_FLAG);
    localStorage.removeItem(EMPRESA_ADDRESS_FLAG);
    localStorage.removeItem(CLIENT_ADDRESS_ID);
    localStorage.removeItem(EMPRESA_ADDRESS_ID);
    localStorage.removeItem(CLIENT_ADDRESS_DRAFT);
    localStorage.removeItem(EMPRESA_ADDRESS_DRAFT);
    localStorage.removeItem(CLIENT_SERVER_SYNC);
    localStorage.removeItem(EMPRESA_SERVER_SYNC);
  },

  async createForUser(input: EnderecoInput): Promise<AddressSaveResult> {
    const response = await fetch(`${ENDERECO_BASE}/usuario`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    rememberLocalDraft('client', input);
    if (!response.ok) {
      const msg =
        (await parseApiError(response)) || 'Erro ao salvar endereço do usuário';
      if (response.status === 400 && isAddressAlreadyExistsError(msg)) {
        if (!this.getStoredAddressId('client')) {
          throw new AddressAlreadyExistsWithoutIdError();
        }
      }
      throw new Error(msg);
    }
    const text = await response.text();
    let parsedBody: unknown = text;
    try {
      parsedBody = text ? JSON.parse(text) : null;
    } catch {
      parsedBody = text;
    }
    const addressId = persistIdFromResponse('client', parsedBody);
    markServerSynced('client');
    return { persistedOnServer: true, savedLocally: true, addressId };
  },

  async createForEmpresa(input: EnderecoInput): Promise<AddressSaveResult> {
    const response = await fetch(`${ENDERECO_BASE}/empresa`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    rememberLocalDraft('empresa', input);
    if (!response.ok) {
      const msg =
        (await parseApiError(response)) || 'Erro ao salvar endereço da empresa';
      if (response.status === 400 && isEmpresaAddressAlreadyExistsError(msg)) {
        if (!this.getStoredAddressId('empresa')) {
          throw new AddressAlreadyExistsWithoutIdError();
        }
      }
      throw new Error(msg);
    }
    const text = await response.text();
    let parsedBody: unknown = text;
    try {
      parsedBody = text ? JSON.parse(text) : null;
    } catch {
      parsedBody = text;
    }
    const addressId = persistIdFromResponse('empresa', parsedBody);
    markServerSynced('empresa');
    return { persistedOnServer: true, savedLocally: true, addressId };
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
    const recoveredId = extractAddressIdFromUnknown(raw) ?? id;
    const result = EnderecoEntitySchema.safeParse(raw);
    if (result.success) {
      return {
        ...result.data,
        idEndereco: result.data.idEndereco > 0 ? result.data.idEndereco : recoveredId,
      };
    }
    return {
      idEndereco: recoveredId,
      rua: parsed.rua ?? '',
      numero: parsed.numero ?? '',
      complemento: parsed.complemento ?? '',
      bairro: parsed.bairro ?? '',
      cidade: parsed.cidade ?? '',
      estado: parsed.estado ?? '',
      cep: parsed.cep ?? '',
    };
  },

  /**
   * PATCH se houver id local; senão POST create.
   * Nunca reporta sucesso se o write HTTP não aconteceu.
   */
  async saveForScope(scope: AddressScope, input: EnderecoInput): Promise<AddressSaveResult> {
    const existingId = this.getStoredAddressId(scope);
    if (existingId) {
      const updated = await this.update(existingId, input);
      if (updated.idEndereco > 0) this.setStoredAddressId(scope, updated.idEndereco);
      rememberLocalDraft(scope, input);
      markServerSynced(scope);
      return {
        persistedOnServer: true,
        savedLocally: true,
        addressId: updated.idEndereco || existingId,
      };
    }
    if (scope === 'client') return this.createForUser(input);
    return this.createForEmpresa(input);
  },
};
