import { useCallback, useEffect, useState } from 'react';
import { companyService } from '../services/companyService';
import { ExploreEstablishmentCard, PlanResponse, PublicCompanyListItem } from '../types';
import { mapPublicCompanyToCard } from '../utils/publicCompany';

interface UsePublicCompanyDetailResult {
	company: PublicCompanyListItem | null;
	card: ExploreEstablishmentCard | null;
	plans: PlanResponse[];
	isLoading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
}

/** Carrega empresa (via listagem pública) e planos para a página /empresa/:id. */
export function usePublicCompanyDetail(idEmpresa: number | null): UsePublicCompanyDetailResult {
	const [company, setCompany] = useState<PublicCompanyListItem | null>(null);
	const [plans, setPlans] = useState<PlanResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!idEmpresa || Number.isNaN(idEmpresa)) {
			setCompany(null);
			setPlans([]);
			setError(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const [foundCompany, companyPlans] = await Promise.all([
				companyService.getPublicById(idEmpresa),
				companyService.listPublicPlans(idEmpresa),
			]);

			if (!foundCompany) {
				setCompany(null);
				setPlans([]);
				setError('Estabelecimento não encontrado.');
				return;
			}

			setCompany(foundCompany);
			setPlans(companyPlans);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Não foi possível carregar o estabelecimento.';
			console.error('[PagWeb] Detalhe público da empresa falhou:', err);
			setCompany(null);
			setPlans([]);
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, [idEmpresa]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const card = company ? mapPublicCompanyToCard(company, { planCount: plans.length }) : null;

	return { company, card, plans, isLoading, error, refresh };
}
