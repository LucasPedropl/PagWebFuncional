
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CheckCircle2, Calendar, CreditCard, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientSubscription } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Assinaturas: React.FC = () => {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [subToCancel, setSubToCancel] = useState<ClientSubscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isAccepting, setIsAccepting] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const data = await userService.listClientSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSubscription = async (idAssinatura: number) => {
    try {
      setIsAccepting(idAssinatura);
      await userService.acceptSubscription(idAssinatura);
      addToast('success', 'Sucesso', 'Assinatura aceita com sucesso.');
      await fetchSubscriptions();
    } catch (error: any) {
      addToast('error', 'Erro', error.message);
    } finally {
      setIsAccepting(null);
    }
  };

  const handleCancelClick = (sub: ClientSubscription) => {
      setSubToCancel(sub);
      setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
      if (!subToCancel) return;
      try {
          setIsProcessing(true);
          await userService.cancelSubscription(subToCancel.idAssinatura);
          addToast('success', 'Assinatura Cancelada', 'Sua assinatura foi cancelada com sucesso.');
          await fetchSubscriptions();
          setIsCancelModalOpen(false);
          setSubToCancel(null);
      } catch (error: any) {
          addToast('error', 'Erro', error.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const formatDate = (isoStr: string) => {
    try {
        return new Date(isoStr).toLocaleDateString('pt-BR');
    } catch {
        return isoStr;
    }
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Assinaturas</h1>
        <p className="text-gray-500 mt-1">Gerencie seus planos e serviços contratados.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Você não possui assinaturas ativas</h3>
            <p className="text-gray-500 max-w-sm">
                Assim que você contratar um serviço em um estabelecimento parceiro, ele aparecerá aqui.
            </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
             <div key={sub.idAssinatura} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{sub.nomePlano}</h3>
                        <p className="text-sm text-gray-500">{sub.nomeEmpresa}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className={`flex items-center font-medium ${sub.status === 'Ativo' ? 'text-green-600' : 'text-gray-600'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {sub.status}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {sub.dataFim && sub.dataFim.startsWith('0001-01-01') 
                                    ? 'Assinatura recorrente' 
                                    : `Expira em ${formatDate(sub.dataFim)}`
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-bold text-gray-900">R$ {sub.valorMensal.toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-gray-500">/mês</span>
                    </div>
                    {sub.status === 'Pendente' && (
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAcceptSubscription(sub.idAssinatura)}
                            isLoading={isAccepting === sub.idAssinatura}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Aceitar
                        </Button>
                    )}
                    {sub.status === 'Ativo' && (
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200"
                            onClick={() => handleCancelClick(sub)}
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Cancelar
                        </Button>
                    )}
                </div>
             </div>
          ))}
        </div>
      )}

      {/* Modal Cancelamento */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isProcessing}>Voltar</Button>
            <Button 
                onClick={confirmCancel} 
                isLoading={isProcessing} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Cancelamento
            </Button>
          </>
        }
      >
         <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cancelar {subToCancel?.nomePlano}?</h3>
            <p className="text-sm text-gray-500">
                Você perderá acesso aos benefícios deste plano ao final do ciclo atual. Esta ação não pode ser desfeita.
            </p>
         </div>
      </Modal>

    </UserLayout>
  );
};
