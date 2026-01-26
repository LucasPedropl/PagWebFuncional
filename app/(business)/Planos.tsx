import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, Edit2, Trash2, Loader2 } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse } from '../../types';

export const Planos: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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
      setPlans(data);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const funcionalidadesArray = formData.funcionalidades
        .split('\n')
        .map(f => f.trim())
        .filter(f => f !== '');

      await businessService.createPlan({
        nome: formData.nome,
        valorMensalidade: Number(formData.valorMensalidade.replace(',', '.')),
        funcionalidades: funcionalidadesArray
      });

      await fetchPlans(); // Recarrega a lista
      setIsModalOpen(false);
      setFormData({ nome: '', valorMensalidade: '', funcionalidades: '' });
    } catch (error) {
      alert("Erro ao salvar plano. Verifique os dados.");
      console.error(error);
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
        <Button onClick={() => setIsModalOpen(true)}>
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
          {plans.map((plan) => (
            <div key={plan.idPlano} className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">{plan.nome}</h3>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-600 transition-colors">
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
                {plan.funcionalidades.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full mt-auto">Ver Detalhes</Button>
            </div>
          ))}

          {/* Add New Placeholder Card */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Adicionar Novo Plano</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Plano"
        footer={
          <>
            <Button onClick={handleSave} isLoading={isSaving}>Salvar</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
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
              rows={4}
              placeholder={`Suporte 24h\nAcesso ilimitado\n...`}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>
        </div>
      </Modal>
    </BusinessLayout>
  );
};