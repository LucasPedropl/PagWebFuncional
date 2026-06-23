import React, { useEffect, useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Receipt, Loader2, Plus } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { businessService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import { useSinglePayments } from '../../features/single-payment/hooks/useSinglePayments';
import { notifySinglePaymentChanged } from '../../utils/sessionUser';
import { User } from '../../types';

export const PagamentoUnico: React.FC = () => {
  const { addToast } = useToast();
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [clients, setClients] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [clientId, setClientId] = useState<string | number>('');
  const [descricaoServico, setDescricaoServico] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');

  const {
    payments,
    isLoading,
    refresh,
    createPayment,
    cancelPayment,
  } = useSinglePayments(idEmpresa != null ? { idEmpresa } : undefined);

  useEffect(() => {
    companyService
      .getMyCompany()
      .then((company) => {
        setIdEmpresa(company.idEmpresa);
        setEmpresaNome(company.nome);
      })
      .catch((err) => {
        console.error('[PagamentoUnico] Erro ao carregar empresa:', err);
        addToast('error', 'Erro', 'Não foi possível identificar sua empresa.');
      });
  }, [addToast]);

  useEffect(() => {
    businessService
      .listClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[PagamentoUnico] Erro ao carregar clientes:', err);
        addToast('error', 'Erro', 'Não foi possível carregar a lista de clientes.');
      });
  }, [addToast]);

  const clientOptions = useMemo(
    () =>
      clients
        .filter((c) => c.idUser != null)
        .map((c) => ({
          value: c.idUser as number,
          label: `${c.nome}${c.sobreNome ? ` ${c.sobreNome}` : ''}`.trim(),
          subLabel: c.email,
        })),
    [clients],
  );

  const resetForm = () => {
    setClientId('');
    setDescricaoServico('');
    setValor('');
    setObservacao('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idEmpresa == null) return;

    const client = clients.find((c) => c.idUser === Number(clientId));
    const parsedValor = Number(valor.replace(',', '.'));

    if (!client?.idUser) {
      addToast('error', 'Cliente obrigatório', 'Selecione o cliente que receberá a cobrança.');
      return;
    }
    if (!descricaoServico.trim()) {
      addToast('error', 'Serviço obrigatório', 'Descreva qual serviço está sendo cobrado.');
      return;
    }
    if (!Number.isFinite(parsedValor) || parsedValor <= 0) {
      addToast('error', 'Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    setIsSaving(true);
    try {
      createPayment({
        idEmpresa,
        empresaNome,
        idUser: Number(client.idUser),
        userNome: `${client.nome}${client.sobreNome ? ` ${client.sobreNome}` : ''}`.trim(),
        userEmail: client.email.trim(),
        descricaoServico: descricaoServico.trim(),
        valor: parsedValor,
        observacao: observacao.trim() || undefined,
      });
      notifySinglePaymentChanged();
      refresh();
      resetForm();
      addToast(
        'success',
        'Cobrança registrada',
        'O cliente verá em Cobranças e precisará aceitar antes de aparecer em Faturas.',
      );
    } catch (err) {
      console.error('[PagamentoUnico] Erro ao cadastrar:', err);
      addToast('error', 'Erro', 'Não foi possível registrar o pagamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (id: string) => {
    cancelPayment(id);
    refresh();
    addToast('success', 'Cancelado', 'A cobrança foi cancelada.');
  };

  const statusClass = (status: string) => {
    if (status === 'Pendente') return 'bg-amber-100 text-amber-800';
    if (status === 'Pago') return 'bg-green-100 text-green-800';
    if (status === 'Atrasado') return 'bg-red-100 text-red-800';
    if (status === 'Cancelado') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pagamento único</h1>
        <p className="text-gray-500 mt-1">
          Lance uma cobrança avulsa por serviço prestado — o cliente precisará aceitar em Cobranças.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova cobrança
          </h2>

          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Cobranças ficam salvas localmente até o backend estar disponível. O cliente verá em
            Cobranças e precisará aceitar antes de aparecer em Faturas.
          </div>

          <SearchSelect
            label="Cliente"
            options={clientOptions}
            value={clientId}
            onChange={setClientId}
            placeholder="Selecione o cliente..."
          />

          <Input
            label="Serviço prestado"
            value={descricaoServico}
            onChange={(e) => setDescricaoServico(e.target.value)}
            placeholder="Ex.: Corte de cabelo, Manutenção elétrica..."
            required
          />

          <Input
            label="Valor (R$)"
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            required
          />

          <Textarea
            label="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Detalhes adicionais para o cliente..."
          />

          <Button
            type="submit"
            isLoading={isSaving}
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={!clientId || !descricaoServico.trim() || !valor}
          >
            Cadastrar cobrança
          </Button>
        </form>

        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cobranças registradas</h2>
            <span className="text-sm text-gray-500">{payments.length} total</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center px-6">
              <Receipt className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma cobrança avulsa cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Serviço</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{payment.userNome}</p>
                        <p className="text-xs text-gray-500">{payment.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{payment.descricaoServico}</td>
                      <td className="px-6 py-4 font-semibold">
                        R$ {payment.valor.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{payment.vencimento}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(payment.status === 'Pendente' ||
                          payment.status === 'Aberto' ||
                          payment.status === 'Atrasado') && (
                          <button
                            type="button"
                            onClick={() => handleCancel(payment.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
};
