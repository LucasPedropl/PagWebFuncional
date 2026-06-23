import React, { useEffect, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Plus, Scissors, Loader2, Edit2, Trash2 } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useLocalServices } from '../../features/services/hooks/useLocalServices';
import { LocalService } from '../../features/services/schemas/serviceTypes';
import { formatServicePrice } from '../../features/services/utils/serviceFormatters';

export const Servicos: React.FC = () => {
  const { addToast } = useToast();
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    services,
    isLoading: isLoadingServices,
    createService,
    updateService,
    deleteService,
  } = useLocalServices(idEmpresa ?? undefined);

  useEffect(() => {
    companyService
      .getMyCompany()
      .then((company) => {
        setIdEmpresa(company.idEmpresa);
        setEmpresaNome(company.nome);
      })
      .catch((err) => {
        console.error('[Servicos] Erro ao carregar empresa:', err);
        addToast('error', 'Erro', 'Não foi possível identificar sua empresa.');
      });
  }, [addToast]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormNome('');
    setFormPreco('');
    setFormDescricao('');
    setIsModalOpen(true);
  };

  const openEditModal = (service: LocalService) => {
    setEditingService(service);
    setFormNome(service.nome);
    setFormPreco(String(service.preco));
    setFormDescricao(service.descricao ?? '');
    setIsModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idEmpresa || !formNome.trim() || !formPreco) return;

    setIsSaving(true);
    try {
      const preco = Number(formPreco.replace(',', '.'));
      if (Number.isNaN(preco) || preco < 0) {
        addToast('error', 'Preço inválido', 'Informe um valor numérico válido.');
        return;
      }

      if (editingService) {
        updateService(editingService.id, {
          nome: formNome.trim(),
          preco,
          descricao: formDescricao.trim() || undefined,
        });
        addToast('success', 'Serviço atualizado', 'Alterações salvas localmente.');
      } else {
        createService({
          idEmpresa,
          nome: formNome.trim(),
          preco,
          descricao: formDescricao.trim() || undefined,
        });
        addToast('success', 'Serviço criado', 'Disponível para agendamento e planos.');
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (service: LocalService) => {
    deleteService(service.id);
    addToast('success', 'Serviço removido', `"${service.nome}" foi excluído do catálogo local.`);
  };

  const isLoading = idEmpresa == null || isLoadingServices;

  return (
    <BusinessLayout>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-500 mt-1">
            Cadastre o catálogo de serviços avulsos de {empresaNome || 'sua empresa'}.
          </p>
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-1 rounded">
            Protótipo local — dados salvos no navegador até o backend estar pronto.
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800 shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Novo serviço
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-12 h-12 text-gray-300" />}
          title="Nenhum serviço cadastrado"
          subtitle='Ex: "Corte de cabelo" por R$ 15,00'
          action={
            <Button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800">
              Cadastrar primeiro serviço
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.nome}</h3>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {formatServicePrice(service.preco)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {service.descricao && (
                <p className="text-sm text-gray-500 flex-1">{service.descricao}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar serviço' : 'Novo serviço'}
        onSubmit={handleSaveService}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
              {editingService ? 'Salvar' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do serviço"
            placeholder="Ex: Corte de cabelo"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            required
          />
          <Input
            label="Preço (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="15.00"
            value={formPreco}
            onChange={(e) => setFormPreco(e.target.value)}
            required
          />
          <Textarea
            label="Descrição (opcional)"
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </BusinessLayout>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon}
    <h3 className="text-lg font-semibold text-gray-900 mt-4">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtitle}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
