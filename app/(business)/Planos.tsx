import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, Edit2, Trash2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse } from '../../types';

export const Planos: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  // Delete State
  const [planToDelete, setPlanToDelete] = useState<{id: number, nome: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    valorMensalidade: '',
    funcionalidades: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await businessService.listPlans();
      // Garante que é um array, mesmo que API retorne null/undefined
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openNewPlanModal = () => {
      setEditingPlanId(null);
      setFormData({ nome: '', valorMensalidade: '', funcionalidades: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanResponse, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setEditingPlanId(plan.idPlano);
      // Proteção contra funcionalidades null/undefined
      const funcs = Array.isArray(plan.funcionalidades) ? plan.funcionalidades.join('\n') : '';
      
      setFormData({
          nome: plan.nome,
          valorMensalidade: plan.valorMensalidade.toString(),
          funcionalidades: funcs
      });
      setIsModalOpen(true);
  };

  const openDeleteModal = (id: number, nome: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPlanToDelete({ id, nome });
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!planToDelete) return;
      try {
          setIsSaving(true);
          await businessService.deletePlan(planToDelete.id);
          await fetchPlans();
          setIsDeleteModalOpen(false);
          setPlanToDelete(null);
      } catch (error: any) {
          alert(error.message || "Erro ao excluir plano. Tente novamente.");
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
        funcionalidades: funcionalidadesArray
      };

      if (editingPlanId) {
          await businessService.updatePlan(editingPlanId, payload);
      } else {
          await businessService.createPlan(payload);
      }

      await fetchPlans(); // Recarrega a lista
      setIsModalOpen(false);
      setFormData({ nome: '', valorMensalidade: '', funcionalidades: '' });
      setEditingPlanId(null);
    } catch (error: any) {
      alert(error.message || "Erro ao salvar plano. Verifique os dados.");
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
           <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
             // Lógica para limitar exibição a 3 funcionalidades
             const features = Array.isArray(plan.funcionalidades) ? plan.funcionalidades : [];
             const visibleFeatures = features.slice(0, 3);
             const remainingCount = features.length - 3;

             return (
                <div 
                    key={plan.idPlano} 
                    className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-all cursor-pointer group"
                    onClick={(e) => openEditModal(plan)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{plan.nome}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => openEditModal(plan, e)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                        title="Editar Plano"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => openDeleteModal(plan.idPlano, plan.nome, e)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
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

                  <ul className="space-y-3 flex-1 mb-6">
                    {visibleFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                    {remainingCount > 0 && (
                        <li className="flex items-center text-xs font-medium text-indigo-600 pl-6 pt-1">
                           + {remainingCount} funcionalidades...
                        </li>
                    )}
                    {visibleFeatures.length === 0 && (
                        <li className="text-sm text-gray-400 italic pl-6">Sem funcionalidades listadas</li>
                    )}
                  </ul>

                  <Button 
                    variant="outline" 
                    className="w-full mt-auto group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors"
                    onClick={(e) => openEditModal(plan, e)}
                  >
                    Ver Detalhes <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
            );
          })}

          {/* Add New Placeholder Card */}
          <button 
            onClick={openNewPlanModal}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Adicionar Novo Plano</span>
          </button>
        </div>
      )}

      {/* Modal Criar/Editar/Detalhes */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlanId ? "Detalhes do Plano" : "Novo Plano"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
                {editingPlanId ? "Salvar Alterações" : "Criar Plano"}
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white text-gray-900 placeholder-gray-400 resize-none"
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