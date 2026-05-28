import {
	AuthResponse,
	CompanyCreationPayload,
	CompanyLoginPayload,
	CompanyResponse,
	CompanyUpdatePayload,
} from '../types';
import { sessionService } from './session';
import { parseApiError } from '../utils/formatters';

const COMPANY_URL = 'https://lojas.vlks.com.br/api/v1/Empresa';
const USER_URL = 'https://lojas.vlks.com.br/api/v1/User';

export const companyService = {
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
			email: email,
			password: password,
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
