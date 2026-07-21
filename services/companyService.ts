import {
	AuthResponse,
	CompanyCreationPayload,
	CompanyLoginPayload,
	CompanyResponse,
	CompanyUpdatePayload,
	PlanResponse,
	PublicCompanyListItem,
} from '../types';
import { sessionService } from './session';
import { parseApiError } from '../utils/formatters';
import { resolveContractPath } from '../utils/api';
import { apiV1Url } from '../utils/apiOrigin';

const API_BASE = apiV1Url();
const COMPANY_URL = `${API_BASE}/Empresa`;
const USER_URL = `${API_BASE}/User`;

const normalizePublicCompany = (raw: Record<string, unknown>): PublicCompanyListItem => ({
	idEmpresa: Number(raw.idEmpresa ?? raw.IdEmpresa),
	nome: String(raw.nome ?? raw.Nome ?? ''),
	cnpj: String(raw.cnpj ?? raw.Cnpj ?? ''),
	telefone: raw.telefone != null ? String(raw.telefone) : raw.Telefone != null ? String(raw.Telefone) : undefined,
	logoPath: (raw.logoPath ?? raw.LogoPath ?? null) as string | null,
	dataCriacao: raw.dataCriacao != null ? String(raw.dataCriacao) : undefined,
	status: raw.status != null ? Number(raw.status) : undefined,
	enderecoEmpresa: (raw.enderecoEmpresa ?? raw.EnderecoEmpresa ?? null) as
		| PublicCompanyListItem['enderecoEmpresa']
		| null,
});

const normalizePublicPlan = (raw: Record<string, unknown>): PlanResponse => ({
	idPlano: Number(raw.idPlano ?? raw.IdPlano),
	nome: String(raw.nome ?? raw.Nome ?? ''),
	valorMensalidade: Number(raw.valorMensalidade ?? raw.ValorMensalidade ?? 0),
	percentualMulta: Number(raw.percentualMulta ?? raw.PercentualMulta ?? 0),
	percentualJurosMensal: Number(raw.percentualJurosMensal ?? raw.PercentualJurosMensal ?? 0),
	funcionalidades: Array.isArray(raw.funcionalidades)
		? (raw.funcionalidades as string[])
		: Array.isArray(raw.Funcionalidades)
			? (raw.Funcionalidades as string[])
			: [],
	contratoPath: resolveContractPath(raw as Parameters<typeof resolveContractPath>[0]),
	tipoContrato: raw.tipoContrato != null ? Number(raw.tipoContrato) : raw.TipoContrato != null ? Number(raw.TipoContrato) : undefined,
	cancelamentoDias:
		raw.cancelamentoDias != null
			? Number(raw.cancelamentoDias)
			: raw.cancelamento != null
				? Number(raw.cancelamento)
				: raw.Cancelamento != null
					? Number(raw.Cancelamento)
					: undefined,
	assinarPorCliente:
		raw.assinarPorCliente != null
			? Boolean(raw.assinarPorCliente)
			: raw.AssinarPorCliente != null
				? Boolean(raw.AssinarPorCliente)
				: undefined,
});

export const companyService = {
	/** Lista empresas do diretório público (GET /api/v1/Empresa). */
	async listPublic(): Promise<PublicCompanyListItem[]> {
		const response = await fetch(COMPANY_URL, {
			method: 'GET',
			headers: { accept: '*/*' },
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(errorMessage || 'Falha ao listar empresas');
		}

		const data: unknown = await response.json();
		if (!Array.isArray(data)) return [];
		return data.map((item) => normalizePublicCompany(item as Record<string, unknown>));
	},

	/** Busca uma empresa do diretório público pelo ID (usa GET /Empresa). */
	async getPublicById(idEmpresa: number): Promise<PublicCompanyListItem | null> {
		const list = await this.listPublic();
		return list.find((item) => item.idEmpresa === idEmpresa) ?? null;
	},

	/** Lista planos públicos de uma empresa (GET /Plano/empresa/{id}). */
	async listPublicPlans(idEmpresa: number): Promise<PlanResponse[]> {
		const response = await fetch(`${API_BASE}/Plano/empresa/${idEmpresa}`, {
			method: 'GET',
			headers: { accept: '*/*' },
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(errorMessage || 'Falha ao listar planos da empresa');
		}

		const data: unknown = await response.json();
		if (!Array.isArray(data)) return [];
		return data.map((item) => normalizePublicPlan(item as Record<string, unknown>));
	},

	// Agora recebe o token do usuário logado para criar a empresa
	async create(
		token: string,
		data: CompanyCreationPayload,
	): Promise<CompanyResponse> {
		const formData = new FormData();
		formData.append('Nome', data.nome);
		formData.append('Cnpj', data.cnpj);
		formData.append('Telefone', data.telefone);
		if (data.logo) {
			formData.append('Logo', data.logo);
		}

		const response = await fetch(COMPANY_URL, {
			method: 'POST',
			headers: {
				accept: '*/*',
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(errorMessage || 'Falha ao criar empresa');
		}

		return await response.json();
	},

	async getMyCompany(): Promise<CompanyResponse> {
		const token = sessionService.getCachedToken('admin') || sessionService.getSession().token;
		if (!token) throw new Error('Não autenticado');

		const response = await fetch(`${USER_URL}/minha-empresa`, {
			method: 'GET',
			headers: {
				accept: '*/*',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(errorMessage || 'Falha ao obter dados da empresa');
		}

		return await response.json();
	},

	async update(id: number, data: CompanyUpdatePayload): Promise<void> {
		const token = sessionService.getCachedToken('admin') || sessionService.getSession().token;
		if (!token) throw new Error('Não autenticado');

		const formData = new FormData();
		if (data.nome) formData.append('Nome', data.nome);
		if (data.cnpj) formData.append('Cnpj', data.cnpj);
		if (data.telefone) formData.append('Telefone', data.telefone);
		if (data.logo !== undefined) {
			if (data.logo) {
				formData.append('Logo', data.logo);
			}
		}

		const response = await fetch(`${COMPANY_URL}/${id}`, {
			method: 'PATCH',
			headers: {
				accept: '*/*',
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(errorMessage || 'Falha ao atualizar empresa');
		}
	},

	async login(email: string, password: string): Promise<AuthResponse> {
		const payload = {
			email,
			password,
			mac: 'pagweb',
		};

		const response = await fetch(`${USER_URL}/login-admin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				accept: '*/*',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorMessage = await parseApiError(response);
			throw new Error(
				errorMessage || 'Falha ao realizar login administrativo',
			);
		}

		const data = await response.json();

		// Garantir que o tipo seja Admin/Empresa
		if (data.user) {
			data.user.tipo = 'Empresa';
		}

		sessionService.setEmpresaOwnerFlag(true);
		sessionService.applyAuthResponse(data, 'admin');
		sessionService.saveCredentials(email, password, 'admin');
		sessionService.prefetchAlternateToken('admin');

		// Cache da empresa para o switcher na área do cliente (minha-empresa exige token admin)
		fetch(`${USER_URL}/minha-empresa`, {
			method: 'GET',
			headers: { accept: '*/*', Authorization: `Bearer ${data.token}` },
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((comp) => {
				if (comp?.nome) {
					localStorage.setItem(
						'pagweb_company',
						JSON.stringify({ nome: comp.nome, logo: comp.logo || null }),
					);
				}
			})
			.catch(() => {});

		return data;
	},
};
