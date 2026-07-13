import React, { useEffect, useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Receipt, Loader2, Plus, AlertCircle } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useCobrancas } from '../../features/single-payment/hooks/useCobrancas';
import { useProdutos } from '../../features/catalog/hooks/useProdutos';
import { useServicos } from '../../features/catalog/hooks/useServicos';
import { User } from '../../types';
import { Cobranca } from '../../features/single-payment/schemas/cobrancaSchemas';

const STATUS_CLASSES: Record<string, string> = {
  Aberto: 'bg-blue-100 text-blue-800',
  Pago: 'bg-green-100 text-green-800',
  Atrasado: 'bg-red-100 text-red-800',
  Cancelado: 'bg-gray-100 text-gray-600',
  Repassado: 'bg-emerald-100 text-emerald-800',
};

const statusClass = (status: string): string =>
  STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';

const isCancellable = (c: Cobranca): boolean =>
  c.status === 'Aberto' || c.status === 'Atrasado';

export const PagamentoUnico: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<User[]>([]);
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clientId, setClientId] = useState<string | number>('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [produtoId, setProdutoId] = useState<string | number>('');
  const [servicoId, setServicoId] = useState<string | number>('');

  const { cobrancas, isLoading, error, createCobranca, cancelCobranca } = useCobrancas();
  const { produtos } = useProdutos();
  const { servicos } = useServicos(idEmpresa);

  useEffect(() => {
    businessService
      .listClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[PagamentoUnico] clientes:', err);
        addToast('error', 'Erro', 'Não foi possível carregar clientes.');
      });
    companyService
      .getMyCompany()
      .then((c) => setIdEmpresa(c.idEmpresa))
      .catch((err) => console.warn('[PagamentoUnico] empresa:', err));
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

  const produtoOptions = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...produtos.map((p) => ({
        value: p.id,
        label: p.nome,
        subLabel: `R$ ${p.preco.toFixed(2)}`,
      })),
    ],
    [produtos],
  );

  const servicoOptions = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...servicos.map((s) => ({
        value: s.id,
        label: s.nome,
        subLabel: `R$ ${s.preco.toFixed(2)}`,
      })),
    ],
    [servicos],
  );

  const suggestFromCatalog = (nextProduto: string | number, nextServico: string | number) => {
    let total = 0;
    const p = produtos.find((x) => x.id === Number(nextProduto));
    const s = servicos.find((x) => x.id === Number(nextServico));
    if (p) total += p.preco;
    if (s) total += s.preco;
    if (total > 0) setValor(total.toFixed(2));
    if (!descricao.trim()) {
      const parts = [s?.nome, p?.nome].filter(Boolean);
      if (parts.length) setDescricao(parts.join(' + '));
    }
  };

  const resetForm = () => {
    setClientId('');
    setDescricao('');
    setValor('');
    setObservacao('');
    setProdutoId('');
    setServicoId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValor = Number(valor.replace(',', '.'));
    if (!clientId) {
      addToast('error', 'Cliente obrigatório', 'Selecione o cliente.');
      return;
    }
    if (!descricao.trim()) {
      addToast('error', 'Descrição obrigatória', 'Descreva a cobrança.');
      return;
    }
    if (!Number.isFinite(parsedValor) || parsedValor <= 0) {
      addToast('error', 'Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    setIsSaving(true);
    try {
      await createCobranca({
        descricao: descricao.trim(),
        observacao: observacao.trim() || undefined,
        idUser: Number(clientId),
        valorTotal: parsedValor,
        produtos: Number(produtoId) > 0 ? [Number(produtoId)] : undefined,
        servicos: Number(servicoId) > 0 ? [Number(servicoId)] : undefined,
      });
      resetForm();
      addToast('success', 'Cobrança criada', 'Cliente poderá pagar em breve.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar a cobrança.';
      console.error('[PagamentoUnico]', err);
      addToast('error', 'Erro ao criar cobrança', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelCobranca(id);
      addToast('success', 'Cancelada', 'Cobrança cancelada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cancelar.';
      console.error('[PagamentoUnico] cancel:', err);
      addToast('error', 'Erro ao cancelar', msg);
    }
  };

  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pagamento único</h1>
        <p className="text-gray-500 mt-1">
          Cobrança avulsa, opcionalmente vinculada a produto ou serviço do catálogo.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova cobrança
          </h2>
          <SearchSelect
            label="Cliente"
            options={clientOptions}
            value={clientId}
            onChange={setClientId}
            placeholder="Selecione o cliente..."
          />
          <SearchSelect
            label="Serviço do catálogo (opcional)"
            options={servicoOptions}
            value={servicoId}
            onChange={(v) => {
              setServicoId(v);
              suggestFromCatalog(produtoId, v);
            }}
            placeholder="Nenhum"
          />
          <SearchSelect
            label="Produto do catálogo (opcional)"
            options={produtoOptions}
            value={produtoId}
            onChange={(v) => {
              setProdutoId(v);
              suggestFromCatalog(v, servicoId);
            }}
            placeholder="Nenhum"
          />
          <Input
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
          <Input
            label="Valor (R$)"
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
          <Textarea
            label="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
          />
          <Button
            type="submit"
            isLoading={isSaving}
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={!clientId || !descricao.trim() || !valor}
          >
            Cadastrar cobrança
          </Button>
        </form>

        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cobranças registradas</h2>
            <span className="text-sm text-gray-500">{cobrancas.length} total</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 text-center px-6 gap-2">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : cobrancas.length === 0 ? (
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
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cobrancas.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{c.usuario?.nome ?? '—'}</p>
                        <p className="text-xs text-gray-500">{c.usuario?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{c.descricao}</td>
                      <td className="px-6 py-4 font-semibold">
                        R$ {c.valorTotal.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCancellable(c) && (
                          <button
                            type="button"
                            onClick={() => void handleCancel(c.id)}
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
