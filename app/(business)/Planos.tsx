import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, Edit2, Trash2 } from 'lucide-react';

// Mock Data
const MOCK_PLANS = [
  { 
    id: 1, 
    nome: 'Plano Básico', 
    preco: '49,00', 
    features: ['Gestão de até 50 clientes', 'Relatórios básicos'],
    popular: false 
  },
  { 
    id: 2, 
    nome: 'Plano Premium', 
    preco: '99,00', 
    features: ['Todas as do Básico', 'Gestão ilimitada', 'Relatórios IA Avançados'],
    popular: true 
  },
];

export const Planos: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    popular: false,
    features: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, popular: e.target.checked }));
  };

  const handleSave = () => {
    console.log('Saving plan:', formData);
    setIsModalOpen(false);
    setFormData({ nome: '', preco: '', popular: false, features: '' });
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PLANS.map((plan) => (
          <div key={plan.id} className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
            )}
            
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
              <span className="text-3xl font-bold text-gray-900 mx-1">{plan.preco}</span>
              <span className="text-sm text-gray-400">/mês</span>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((feature, idx) => (
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Plano"
        footer={
          <>
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
                placeholder="R$ 0,00" 
                name="preco"
                value={formData.preco}
                onChange={handleInputChange}
              />
            </div>
            <div className="pb-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  name="popular"
                  checked={formData.popular}
                  onChange={handleCheckboxChange}
                />
                Marcar como Popular
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Funcionalidades <span className="text-gray-400 font-normal">(uma por linha)</span>
            </label>
            <textarea
              name="features"
              value={formData.features}
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