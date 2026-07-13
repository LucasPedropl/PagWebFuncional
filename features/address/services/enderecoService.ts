import { sessionService } from '../../../services/session';
import { parseApiError } from '../../../utils/formatters';
import { EnderecoInput, EnderecoInputSchema } from '../schemas/enderecoSchemas';

const ENDERECO_BASE = 'https://lojas.vlks.com.br/api/v1/Endereco';
const CLIENT_ADDRESS_FLAG = 'pagweb_client_address_ok';
const EMPRESA_ADDRESS_FLAG = 'pagweb_empresa_address_ok';

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

/** Service de Endereço — POST /api/v1/Endereco/usuario|empresa */
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

  async createForUser(input: EnderecoInput): Promise<void> {
    const response = await fetch(`${ENDERECO_BASE}/usuario`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao salvar endereço do usuário');
    }
    this.markClientAddressOk();
  },

  async createForEmpresa(input: EnderecoInput): Promise<void> {
    const response = await fetch(`${ENDERECO_BASE}/empresa`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(toApiBody(input)),
    });
    if (!response.ok) {
      throw new Error((await parseApiError(response)) || 'Erro ao salvar endereço da empresa');
    }
    this.markEmpresaAddressOk();
  },
};
