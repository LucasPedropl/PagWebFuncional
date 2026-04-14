import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, Edit2, Trash2, Loader2, AlertTriangle, ExternalLink, Box } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Planos: React.FC = () => {
  const { addToast } = useToast();
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selected Plan State
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);
  const [planToDelete, setPlanToDelete] = useState<{id: number, nome: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    valorMensalidade: '',
    percentualMulta: '',
    percentualJurosMensal: '',
    funcionalidades: '',
    contrato: null as File | null
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await businessService.listPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      addToast('error', 'Erro', 'Não foi possível carregar a lista de planos.');
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, contrato: e.target.files![0] }));
    }
  };

  // --- ACTIONS ---

  const openNewPlanModal = () => {
      setSelectedPlan(null);
      setFormData({ nome: '', valorMensalidade: '', percentualMulta: '', percentualJurosMensal: '', funcionalidades: '', contrato: null });
      setIsEditModalOpen(true);
  };

  const openViewModal = (plan: PlanResponse) => {
      setSelectedPlan(plan);
      setIsViewModalOpen(true);
  };

  const openEditModal = (plan: PlanResponse, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      
      // Fecha modal de visualização se estiver aberto para abrir o de edição
      if (isViewModalOpen) setIsViewModalOpen(false);

      setSelectedPlan(plan);
      const funcs = Array.isArray(plan.funcionalidades) ? plan.funcionalidades.join('\n') : '';
      
      setFormData({
          nome: plan.nome,
          valorMensalidade: plan.valorMensalidade.toString(),
          percentualMulta: plan.percentualMulta?.toString() || '0',
          percentualJurosMensal: plan.percentualJurosMensal?.toString() || '0',
          funcionalidades: funcs,
          contrato: null
      });
      setIsEditModalOpen(true);
  };

  const openDeleteModal = (id: number, nome: string, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setPlanToDelete({ id, nome });
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!planToDelete) return;
      try {
          setIsSaving(true);
          await businessService.deletePlan(planToDelete.id);
          addToast('success', 'Plano Excluído', `O plano "${planToDelete.nome}" foi removido.`);
          await fetchPlans();
          setIsDeleteModalOpen(false);
          setPlanToDelete(null);
          // Se estava vendo detalhes, fecha também
          setIsViewModalOpen(false);
      } catch (error: any) {
          addToast('error', 'Erro ao excluir', error.message || "Tente novamente.");
      } finally {
          setIsSaving(false); 
      }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const funcionalidadesArray = formData.funcionalidades
        .split('\n')
        .map(f => f.trim())
        .filter(f => f !== '');
      
      const payload = {
        nome: formData.nome,
        valorMensalidade: Number(formData.valorMensalidade.replace(',', '.')),
        percentualMulta: Number(formData.percentualMulta.replace(',', '.')),
        percentualJurosMensal: Number(formData.percentualJurosMensal.replace(',', '.')),
        funcionalidades: funcionalidadesArray
      };

      if (selectedPlan) {
          await businessService.updatePlan(selectedPlan.idPlano, payload);
          addToast('success', 'Plano Atualizado', 'As alterações foram salvas com sucesso.');
      } else {
          await businessService.createPlan(payload);
          addToast('success', 'Plano Criado', 'Novo plano adicionado ao catálogo.');
      }

      await fetchPlans();
      setIsEditModalOpen(false);
      setFormData({ nome: '', valorMensalidade: '', percentualMulta: '', percentualJurosMensal: '', funcionalidades: '' });
      setSelectedPlan(null);
    } catch (error: any) {
      addToast('error', 'Erro ao salvar', error.message || "Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Planos</h1>
          <p className="text-gray-500 mt-1">Defina os produtos e serviços que sua empresa oferece.</p>
        </div>
        <Button 
            onClick={openNewPlanModal}
            className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
             const features = Array.isArray(plan.funcionalidades) ? plan.funcionalidades : [];
             const visibleFeatures = features.slice(0, 4); // Mostra até 4
             const remainingCount = features.length - 4;

             return (
                <div 
                    key={plan.idPlano} 
                    className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-all cursor-pointer group h-[340px]"
                    onClick={() => openViewModal(plan)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-slate-700 transition-colors line-clamp-1" title={plan.nome}>
                        {plan.nome}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => openEditModal(plan, e)}
                        className="text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors p-1"
                        title="Editar Plano"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => openDeleteModal(plan.idPlano, plan.nome, e)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors p-1"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-sm text-gray-500 font-medium">R$</span>
                    <span className="text-3xl font-bold text-gray-900 mx-1">
                      {plan.valorMensalidade.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-gray-400">/mês</span>
                  </div>

                  {/* Area de Funcionalidades com altura controlada e overflow hidden visualmente */}
                  <div className="flex-1 overflow-hidden">
                    <ul className="space-y-3">
                        {visibleFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                            <Check className="w-4 h-4 text-slate-900 mr-2 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{feature}</span>
                        </li>
                        ))}
                        {remainingCount > 0 && (
                            <li className="flex items-center text-xs font-semibold text-slate-900 pl-6 pt-1">
                            + {remainingCount} funcionalidades...
                            </li>
                        )}
                        {visibleFeatures.length === 0 && (
                            <li className="text-sm text-gray-400 italic pl-6">Sem funcionalidades listadas</li>
                        )}
                    </ul>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-gray-200 text-gray-600 group-hover:border-slate-900 group-hover:text-slate-900 transition-colors"
                    onClick={(e) => { e.stopPropagation(); openViewModal(plan); }}
                  >
                    Ver Detalhes <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
            );
          })}

          {/* Add New Placeholder Card */}
          <button 
            onClick={openNewPlanModal}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all h-[340px] group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-slate-200 transition-colors flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Adicionar Novo Plano</span>
          </button>
        </div>
      )}

      {/* Modal Visualizar Detalhes (Read-Only) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Plano"
        footer={
          <div className="flex justify-between w-full">
            <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => selectedPlan && openDeleteModal(selectedPlan.idPlano, selectedPlan.nome)}
            >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
                <Button 
                    onClick={() => selectedPlan && openEditModal(selectedPlan)} 
                    className="bg-slate-900 hover:bg-slate-800"
                >
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                <div>
                    <p className="text-sm text-gray-500">Nome do Plano</p>
                    <h2 className="text-xl font-bold text-gray-900">{selectedPlan?.nome}</h2>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Valor Mensal</p>
                    <p className="text-2xl font-bold text-slate-900">
                        R$ {selectedPlan?.valorMensalidade.toFixed(2).replace('.', ',')}
                    </p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Multa por Atraso</p>
                    <p className="text-lg font-bold text-slate-900">
                        {selectedPlan?.percentualMulta?.toFixed(2).replace('.', ',') || '0,00'}%
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Juros Mensal</p>
                    <p className="text-lg font-bold text-slate-900">
                        {selectedPlan?.percentualJurosMensal?.toFixed(2).replace('.', ',') || '0,00'}%
                    </p>
                </div>
             </div>

             <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Box className="w-4 h-4 mr-2" /> 
                    Funcionalidades Inclusas
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {selectedPlan?.funcionalidades && selectedPlan.funcionalidades.length > 0 ? (
                        <ul className="space-y-3">
                            {selectedPlan.funcionalidades.map((f, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-green-600 mr-3 mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Nenhuma funcionalidade cadastrada.</p>
                    )}
                </div>
             </div>
        </div>
      </Modal>

      {/* Modal Criar/Editar (Form) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedPlan ? "Editar Plano" : "Novo Plano"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
                {selectedPlan ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input 
            label="Nome do Plano" 
            placeholder="Ex: Plano Enterprise" 
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
          />
          
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input 
                label="Preço Mensal" 
                placeholder="R$ 0.00" 
                type="number"
                step="0.01"
                name="valorMensalidade"
                value={formData.valorMensalidade}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Multa (%)" 
              placeholder="Ex: 2.00" 
              type="number"
              step="0.01"
              name="percentualMulta"
              value={formData.percentualMulta}
              onChange={handleInputChange}
            />
            <Input 
              label="Juros Mensal (%)" 
              placeholder="Ex: 1.00" 
              type="number"
              step="0.01"
              name="percentualJurosMensal"
              value={formData.percentualJurosMensal}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Contrato do Plano (PDF)
            </label>
            <div className="relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 group-hover:border-slate-900 group-hover:bg-slate-50 transition-all">
                <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Box className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formData.contrato ? formData.contrato.name : 'Clique para selecionar o contrato'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.contrato ? 'Arquivo selecionado' : 'Apenas arquivos PDF'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Funcionalidades <span className="text-gray-400 font-normal">(uma por linha)</span>
            </label>
            <textarea
              name="funcionalidades"
              value={formData.funcionalidades}
              onChange={handleInputChange}
              rows={6}
              placeholder={`Suporte 24h\nAcesso ilimitado\n...`}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Plano"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                onClick={confirmDelete} 
                isLoading={isSaving} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Exclusão
            </Button>
          </>
        }
      >
         <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Atenção!</h3>
            <p className="text-sm text-gray-500">
                Você está prestes a excluir o plano <strong>{planToDelete?.nome}</strong> permanentemente. 
                Assinaturas ativas neste plano podem ser afetadas.
            </p>
         </div>
      </Modal>
    </BusinessLayout>
  );
};