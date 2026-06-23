import { ClientInvoice } from '../../../types';
import { SinglePayment } from '../schemas/singlePaymentTypes';

/** Gera id numérico negativo estável para exibição na lista de faturas. */
export const singlePaymentToInvoiceId = (localId: string): number => {
  let hash = 0;
  for (let i = 0; i < localId.length; i += 1) {
    hash = (hash << 5) - hash + localId.charCodeAt(i);
    hash |= 0;
  }
  return -Math.abs(hash || 1);
};

export const singlePaymentToClientInvoice = (payment: SinglePayment): ClientInvoice => ({
  idMensalidade: singlePaymentToInvoiceId(payment.id),
  nomeEmpresa: payment.empresaNome,
  nomeAdmin: '',
  vencimento: payment.vencimento,
  mesReferencia: `Pagamento único — ${payment.descricaoServico}`,
  metodo: '-',
  valor: payment.valor,
  status: payment.status,
  isPagamentoUnico: true,
  localPaymentId: payment.id,
  observacao: payment.observacao,
  descricaoServico: payment.descricaoServico,
});

export const mergeClientInvoices = (
  apiInvoices: ClientInvoice[],
  localPayments: SinglePayment[],
): ClientInvoice[] => {
  const localInvoices = localPayments
    .filter((p) => p.status !== 'Cancelado' && p.status !== 'Pendente')
    .map(singlePaymentToClientInvoice);

  return [...apiInvoices, ...localInvoices].sort(
    (a, b) => b.idMensalidade - a.idMensalidade,
  );
};
