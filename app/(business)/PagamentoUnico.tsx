import React, { useEffect, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useCobrancas } from '../../features/single-payment/hooks/useCobrancas';
import { useProdutos } from '../../features/catalog/hooks/useProdutos';
import { useServicos } from '../../features/catalog/hooks/useServicos';
import { User } from '../../types';

// Componentes refatorados e modernos
import { CobrancaStats } from '../../features/single-payment/components/CobrancaStats';
import { CobrancaForm } from '../../features/single-payment/components/CobrancaForm';
import { CobrancaTable } from '../../features/single-payment/components/CobrancaTable';

/**
 * Smart Component (Page) para a Gestão de Pagamentos Únicos.
 * Orquestra os estados locais, dados da API e renderiza os subcomponentes de UI e Modal.
 */
export const PagamentoUnico: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<User[]>([]);
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { cobrancas, isLoading, error, createCobranca, cancelCobranca } = useCobrancas();
  const { produtos } = useProdutos();
  const { servicos } = useServicos(idEmpresa);

  useEffect(() => {
    businessService
      .listClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[PagamentoUnico] clientes:', err);
        addToast('error', 'Erro', 'Não foi possível carregar os clientes da empresa.');
      });

    companyService
      .getMyCompany()
      .then((c) => setIdEmpresa(c.idEmpresa))
      .catch((err) => console.warn('[PagamentoUnico] empresa:', err));
  }, [addToast]);

  const handleSubmit = async (data: {
    descricao: string;
    observacao?: string;
    clientId: number;
    valor: number;
    produtoId?: number;
    servicoId?: number;
  }): Promise<boolean> => {
    setIsSaving(true);
    try {
      await createCobranca({
        descricao: data.descricao,
        observacao: data.observacao,
        idUser: data.clientId,
        valorTotal: data.valor,
        produtos: data.produtoId ? [data.produtoId] : undefined,
        servicos: data.servicoId ? [data.servicoId] : undefined,
      });
      addToast('success', 'Cobrança cadastrada', 'A cobrança avulsa foi gerada com sucesso.');
      setIsModalOpen(false); // Fecha o modal após o cadastro bem-sucedido
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar a cobrança.';
      console.error('[PagamentoUnico] erro ao criar:', err);
      addToast('error', 'Erro ao criar cobrança', msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelCobranca(id);
      addToast('success', 'Cancelada', 'A cobrança foi cancelada com sucesso.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cancelar.';
      console.error('[PagamentoUnico] cancel:', err);
      addToast('error', 'Erro ao cancelar', msg);
    }
  };

  return (
    <BusinessLayout>
      {/* Cabeçalho da Página */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gere cobranças avulsas personalizadas, vinculadas ou não ao catálogo de itens.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Cobrança
        </Button>
      </div>

      {/* Cards de Resumo */}
      <CobrancaStats cobrancas={cobrancas} />

      {/* Tabela de Histórico (Largura Total) */}
      <div className="w-full">
        <CobrancaTable
          cobrancas={cobrancas}
          isLoading={isLoading}
          error={error}
          onCancel={handleCancel}
        />
      </div>

      {/* Modal de Nova Cobrança */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova cobrança avulsa"
        size="lg"
      >
        <CobrancaForm
          clients={clients}
          produtos={produtos}
          servicos={servicos}
          isSaving={isSaving}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </BusinessLayout>
  );
};
