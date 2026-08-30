import { useEffect, useState } from 'react';
import { controleAcessoService } from '../services/controleAcessoService';

export type AccessApproval = 'loading' | 'approved' | 'pending';

/**
 * O estabelecimento já foi liberado pelo time PagWeb?
 *
 * Pergunta ao servidor (`GET /api/v1/User/status-acesso`) em vez de acreditar em
 * marca local — é a única fonte que sobrevive a logout, a outro aparelho e à
 * troca de token. Usa só essa rota, e não o `useControleAcesso`, porque aquele
 * chama antes o `GET /api/ControleAcessos` (Master), que não é dele para chamar
 * e hoje responde 500.
 *
 * **Falha para o lado permissivo.** Se a rota cair, devolve `approved`: uma API
 * fora do ar não pode trancar quem já é estabelecimento. Os casos que importam —
 * sem solicitação (404) e solicitação não aprovada — chegam como resposta, não
 * como erro.
 */
export function useAccessApproval(enabled: boolean): AccessApproval {
  const [state, setState] = useState<AccessApproval>(enabled ? 'loading' : 'approved');

  useEffect(() => {
    if (!enabled) {
      setState('approved');
      return;
    }

    let cancelled = false;
    setState('loading');

    controleAcessoService
      .getMyStatus()
      .then((detail) => {
        if (cancelled) return;
        // null = nenhuma solicitação ainda. Também é "pendente": o cadastro só
        // termina quando o código de verificação é enviado e aprovado.
        setState(detail?.estado === 'Ativo' ? 'approved' : 'pending');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[useAccessApproval] status indisponível, liberando:', error);
        setState('approved');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
