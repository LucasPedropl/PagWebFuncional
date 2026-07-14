import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Loader2, DollarSign, CheckCircle2 } from 'lucide-react';
import { pagamentoService } from '../../features/single-payment/services/pagamentoService';
import { PendenteRepasse } from '../../features/single-payment/schemas/cobrancaSchemas';
import { useToast } from '../../context/ToastContext';

export const Repasses: React.FC = () => {
  const [repasses, setRepasses] = useState<PendenteRepasse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);
  const { addToast } = useToast();

  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comprovante, setComprovante] = useState('');

  useEffect(() => {
    fetchRepasses();
  }, []);

  const fetchRepasses = async () => {
    setIsLoading(true);
    try {
      const data = await pagamentoService.getPendentesRepasse();
      setRepasses(data ?? []);
    } catch (error) {
      console.error(error);
      addToast('error', 'Erro', 'Falha ao buscar repasses pendentes.');
    } finally {
      setIsLoading(false);
    }
  };

  /** Abre o modal de comprovante para o repasse selecionado. */
  const openConfirmarModal = (id: number) => {
    setSelectedId(id);
    setComprovante('');
    setModalOpen(true);
  };

  /** Fecha e limpa o modal. */
  const closeModal = () => {
    setModalOpen(false);
    setSelectedId(null);
    setComprovante('');
  };

  /** Submete a confirmação após validação no modal. */
  const handleConfirmarRepasse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedId || !comprovante.trim()) {
      addToast('error', 'Erro', 'Informe o comprovante antes de confirmar.');
      return;
    }

    setIsConfirming(selectedId);
    closeModal();

    try {
      await pagamentoService.confirmarRepasse(selectedId, comprovante.trim());
      addToast('success', 'Sucesso', 'Repasse confirmado com sucesso.');
      await fetchRepasses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao confirmar repasse.';
      console.error(error);
      addToast('error', 'Erro', message);
    } finally {
      setIsConfirming(null);
    }
  };

  return (
    <BusinessLayout>
      {/* Modal de comprovante */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Confirmar Repasse"
        onSubmit={handleConfirmarRepasse}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!comprovante.trim()}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </>
        }
      >
        <Input
          label="Comprovante (URL ou texto)"
          placeholder="Ex: https://... ou código de comprovante"
          value={comprovante}
          onChange={(e) => setComprovante(e.target.value)}
          autoFocus
        />
      </Modal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repasses Pendentes</h1>
          <p className="text-gray-500 mt-1">Gestão de repasses financeiros para parceiros.</p>
        </div>
        <Button variant="outline" onClick={fetchRepasses} className="bg-white">
          Atualizar Lista
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando repasses...
                  </td>
                </tr>
              ) : repasses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhum repasse pendente encontrado.
                  </td>
                </tr>
              ) : (
                repasses.map((r) => (
                  <tr key={r.idPagamento}>
                    <td className="px-6 py-4 font-mono">{r.idPagamento}</td>
                    <td className="px-6 py-4 text-gray-500">{r.data}</td>
                    <td className="px-6 py-4 font-semibold">
                      R$ {(r.valor ?? 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => openConfirmarModal(r.idPagamento)}
                        disabled={isConfirming === r.idPagamento}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5"
                      >
                        {isConfirming === r.idPagamento ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Confirmar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BusinessLayout>
  );
};
