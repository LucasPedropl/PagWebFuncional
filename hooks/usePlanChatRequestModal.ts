import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildPlanChatNavigateUrl,
  PlanChatRequestParams,
} from '../utils/planChatRequest';

/** Controla o modal de confirmação antes de abrir o chat com pedido de assinatura. */
export function usePlanChatRequestModal() {
  const navigate = useNavigate();
  const [context, setContext] = useState<PlanChatRequestParams | null>(null);

  const open = useCallback((params: PlanChatRequestParams) => {
    setContext(params);
  }, []);

  const close = useCallback(() => {
    setContext(null);
  }, []);

  const confirm = useCallback(() => {
    if (!context) return;
    navigate(buildPlanChatNavigateUrl(context));
    setContext(null);
  }, [context, navigate]);

  return {
    context,
    isOpen: context !== null,
    open,
    close,
    confirm,
  };
}
