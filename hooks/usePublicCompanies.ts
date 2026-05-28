import { useCallback, useEffect, useState } from 'react';
import { companyService } from '../services/companyService';
import { PublicCompanyListItem } from '../types';

interface UsePublicCompaniesResult {
	companies: PublicCompanyListItem[];
	isLoading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
}

/** Carrega o diretório público de empresas (GET /api/v1/Empresa). */
export function usePublicCompanies(): UsePublicCompaniesResult {
	const [companies, setCompanies] = useState<PublicCompanyListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await companyService.listPublic();
			setCompanies(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Não foi possível carregar os estabelecimentos.';
			console.error('[PagWeb] GET /Empresa falhou:', err);
			setError(message);
			setCompanies([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { companies, isLoading, error, refresh };
}
