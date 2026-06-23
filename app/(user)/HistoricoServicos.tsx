import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Loader2, Receipt, Scissors } from 'lucide-react';
import { sessionService } from '../../services/session';
import { useSinglePayments } from '../../features/single-payment/hooks/useSinglePayments';
import { SinglePayment } from '../../features/single-payment/schemas/singlePaymentTypes';
import { useToast } from '../../context/ToastContext';
import { notifySinglePaymentChanged } from '../../utils/sessionUser';
import {
  formatServicePrice,
  STATUS_STYLES,
} from '../../features/services/utils/serviceFormatters';

const buildPaymentUrl = (paymentId: string) =>
  `/pagamentos?paymentId=${encodeURIComponent(paymentId)}`;

const isPendingPayment = (payment: SinglePayment) => payment.status === 'Pendente';

const isPayablePayment = (payment: SinglePayment) =>
  payment.status === 'Aberto' || payment.status === 'Atrasado';

export const HistoricoServicos: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = sessionService.getSession();
  const idUser = user?.idUser ?? 0;
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const { payments, isLoading, refresh, acceptPayment } = useSinglePayments(
    idUser > 0 ? { idUser } : undefined,
  );

  const servicePayments = payments.filter((p) => p.status !== 'Cancelado');

  const handlePaymentClick = (payment: SinglePayment) => {
    if (isPendingPayment(payment)) return;
    navigate(buildPaymentUrl(payment.id));
  };

  const handleAcceptPayment = async (payment: SinglePayment) => {
    try {
      setAcceptingId(payment.id);
      const accepted = acceptPayment(payment.id);
      if (!accepted) {
        addToast('error', 'Erro', 'Não foi possível aceitar a cobrança.');
        return;
      }
      notifySinglePaymentChanged();
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      refresh();
      addToast(
        'success',
        'Cobrança aceita',
        'A cobrança foi registrada em Faturas e já pode ser paga.',
      );
    } catch (err) {
      console.error('[HistoricoServicos] Erro ao aceitar cobrança:', err);
      addToast('error', 'Erro', 'Não foi possível aceitar a cobrança.');
    } finally {
      setAcceptingId(null);
    }
  };

  const statusBadgeClass = (payment: SinglePayment) => {
    if (payment.status === 'Pendente') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (payment.status === 'Pago') return STATUS_STYLES.concluido;
    if (payment.status === 'Atrasado') return 'bg-red-50 text-red-700 border-red-200';
    return STATUS_STYLES.confirmado;
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cobranças</h1>
        <p className="text-gray-500 mt-1">
          Aceite as cobranças avulsas para que apareçam em Faturas e possam ser pagas.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : servicePayments.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-12 h-12 text-gray-300" />}
          title="Nenhuma cobrança registrada"
          description="Quando um estabelecimento registrar um serviço avulso para você, ele aparecerá aqui para aceite."
          actionHref="/pagamentos"
          actionLabel="Ver faturas"
        />
      ) : (
        <div className="space-y-4">
          {servicePayments.map((payment) => (
            <div
              key={payment.id}
              role={isPendingPayment(payment) ? undefined : 'button'}
              tabIndex={isPendingPayment(payment) ? undefined : 0}
              onClick={() => handlePaymentClick(payment)}
              onKeyDown={(e) => {
                if (isPendingPayment(payment)) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePaymentClick(payment);
                }
              }}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                isPendingPayment(payment)
                  ? 'border-amber-200'
                  : 'hover:border-slate-300 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {payment.descricaoServico}
                  </h3>
                  <p className="text-sm text-gray-500">{payment.empresaNome}</p>
                  {payment.observacao && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{payment.observacao}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(payment)}`}
                    >
                      {payment.status}
                    </span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="text-gray-600">Vencimento: {payment.vencimento}</span>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col md:flex-row items-end md:items-center gap-4 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatServicePrice(payment.valor)}
                  </span>
                </div>
                {isPendingPayment(payment) ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAcceptPayment(payment)}
                    isLoading={acceptingId === payment.id}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aceitar
                  </Button>
                ) : isPayablePayment(payment) ? (
                  <Button
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => handlePaymentClick(payment)}
                  >
                    Pagar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </UserLayout>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}> = ({ icon, title, description, actionHref, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
    {icon}
    <h3 className="text-lg font-semibold text-gray-900 mt-4">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
    <Link to={actionHref} className="mt-6">
      <Button className="bg-violet-600 hover:bg-violet-700">{actionLabel}</Button>
    </Link>
  </div>
);
