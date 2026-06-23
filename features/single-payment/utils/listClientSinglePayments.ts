import { getSessionClientIdentity } from '../../../utils/sessionUser';
import { localSinglePaymentStore } from '../services/localSinglePaymentStore';
import { SinglePayment } from '../schemas/singlePaymentTypes';

/** Lista cobranças avulsas do cliente logado (id ou e-mail). */
export const listClientSinglePayments = (): SinglePayment[] => {
  const { idUser, email } = getSessionClientIdentity();
  if (!idUser && !email) return [];

  return localSinglePaymentStore
    .listPayments({
      idUser: idUser > 0 ? idUser : undefined,
      userEmail: email || undefined,
    })
    .filter((p) => p.status !== 'Pendente' && p.status !== 'Cancelado');
};
