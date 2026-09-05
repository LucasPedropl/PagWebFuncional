import { ExploreEstablishmentCard, PublicCompanyListItem } from '../types';
import { getImageUrl } from './api';
import { formatCNPJ, formatPhone } from './formatters';

export const resolveCompanyLogoUrl = (logoPath?: string | null): string | null => {
	if (!logoPath?.trim()) return null;
	const url = getImageUrl(logoPath);
	return url || null;
};

export const mapPublicCompanyToCard = (
	company: PublicCompanyListItem,
	options?: { isConnected?: boolean; planCount?: number },
): ExploreEstablishmentCard => {
	const logoUrl = resolveCompanyLogoUrl(company.logoPath);
	const telefone = company.telefone?.trim();
	const description = telefone
		? `Contato: ${formatPhone(telefone)}`
		: 'Estabelecimento parceiro disponível no PagWeb.';

	const cidade = company.enderecoEmpresa?.cidade?.trim() || undefined;
	const estado = company.enderecoEmpresa?.estado?.trim().toUpperCase() || undefined;

	return {
		idEmpresa: company.idEmpresa,
		name: company.nome,
		description,
		logoUrl,
		telefone,
		isConnected: options?.isConnected ?? false,
		planCount: options?.planCount ?? 0,
		cidade,
		estado,
	};
};

export const buildPublicCompanyAboutText = (company: PublicCompanyListItem): string => {
	const parts: string[] = [
		`${company.nome} é um estabelecimento parceiro cadastrado no PagWeb.`,
	];

	if (company.cnpj) {
		parts.push(`CNPJ: ${formatCNPJ(company.cnpj)}.`);
	}
	if (company.telefone?.trim()) {
		parts.push(`Telefone para contato: ${formatPhone(company.telefone)}.`);
	}
	if (company.dataCriacao) {
		const date = new Date(company.dataCriacao);
		if (!Number.isNaN(date.getTime())) {
			parts.push(`Na plataforma desde ${date.toLocaleDateString('pt-BR')}.`);
		}
	}

	return parts.join(' ');
};

export const formatPublicCompanyAddress = (
	endereco: PublicCompanyListItem['enderecoEmpresa'],
): string | null => {
	if (!endereco) return null;

	const line1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
	const line2 = [endereco.bairro, endereco.cidade, endereco.estado].filter(Boolean).join(' - ');
	const cep = endereco.cep ? `CEP ${endereco.cep}` : '';
	const full = [line1, line2, cep].filter(Boolean).join('\n');

	return full || null;
};
