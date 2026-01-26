import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, MoreVertical, Calendar, Loader2 } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse, SubscriptionResponse, User } from '../../types';

export const Assinaturas: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    idUser: '',
    idPlano: '',
    periodo: '12',
    dataInicio: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    dataFim: '',
    desconto: '0',
    observacao: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Calcula data fim automaticamente quando periodo ou dataInicio mudam
  useEffect(() => {
    if (formData.dataInicio && formData.periodo) {
        const start = new Date(formData.dataInicio);
        const months = parseInt(formData.periodo);
        if (!isNaN(start.getTime()) && !isNaN(months)) {
            const end = new Date(start);
            end.setMonth(end.getMonth() + months);
            setFormData(prev => ({ ...prev, dataFim: end.toISOString().split('T')[0] }));
        }
    }
  }, [formData.dataInicio, formData.periodo]);

  const fetchData = async () => {
    try {
        setIsLoading(true);
        // Promise.all para carregar tudo junto
        const [subsData, clientsData, plansData] = await Promise.all([
            businessService.listSubscriptions(),
            businessService.listClients(),
            businessService.listPlans()
        ]);
        
        setSubscriptions(subsData);
        setClients(clientsData);
        setPlans(plansData);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.idUser || !formData.idPlano) {
        alert("Selecione um cliente e um plano.");
        return;
    }

    try {
        setIsSaving(true);
        
        // Format ISO Strings for API (YYYY-MM-DDTHH:mm:ss.sssZ)
        const startIso = new Date(formData.dataInicio).toISOString();
        const endIso = new Date(formData.dataFim).toISOString();

        await businessService.createSubscription({
            idUser: parseInt(formData.idUser),
            idPlano: parseInt(formData.idPlano),
            periodo: parseInt(formData.periodo),
            dataInicio: startIso,
            dataFim: endIso,
            desconto: parseFloat(formData.desconto),
            observacao: formData.observacao
        });

        await fetchData(); // Recarrega lista
        setIsModalOpen(false);
        // Reset form
        setFormData({
            idUser: '',
            idPlano: '',
            periodo: '12',
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: '',
            desconto: '0',
            observacao: ''
        });

    } catch (error) {
        alert("Erro ao criar assinatura.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  // Helper para enriquecer os dados da tabela (já que a API lista assinaturas, assumimos que precisamos cruzar IDs ou que ela retorna objetos aninhados)
  // Baseado na resposta da API, vamos assumir que precisamos encontrar os nomes nos arrays carregados se a API não retornar os objetos completos.
  const getClientName = (sub: SubscriptionResponse) => {
      // Tenta pegar do objeto user aninhado se existir, senão procura na lista de clientes
      if (sub.user?.nome) return sub.user.nome;
      const c = clients.find(c => c.idUser === sub.idUser);
      return c ? c.nome : `Cliente #${sub.idUser}`;
  };

  const getPlanName = (sub: SubscriptionResponse) => {
    if (sub.plano?.nome) return sub.plano.nome;
    const p = plans.find(p => p.idPlano === sub.idPlano);
    return p ? p.nome : `Plano #${sub.idPlano}`;
  };
  
  const getPlanPrice = (sub: SubscriptionResponse) => {
     if (sub.plano?.valorMensalidade) return sub.plano.valorMensalidade;
     const p = plans.find(p => p.idPlano === sub.idPlano);
     return p ? p.valorMensalidade : 0;
  }

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-gray-500 mt-1">Gerencie os planos ativos dos seus clientes.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="text-gray-600 bg-white">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Período</th>
                <th className="px-6 py-4">Valor Mensal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Carregando dados...
                        </div>
                    </td>
                  </tr>
              ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma assinatura encontrada.</td>
                  </tr>
              ) : (
                subscriptions.map((sub) => {
                    const price = getPlanPrice(sub);
                    const finalPrice = price - (price * (sub.desconto / 100));
                    
                    return (
                        <tr key={sub.idAssinatura || Math.random()} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{getClientName(sub)}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{getPlanName(sub)}</span>
                                <span className="text-xs text-gray-500">Base: R$ {price.toFixed(2)}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    {sub.periodo} meses
                                </div>
                                <span className="text-[11px] text-gray-400 mt-0.5">
                                    {new Date(sub.dataInicio).toLocaleDateString()} → {new Date(sub.dataFim).toLocaleDateString()}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">R$ {finalPrice.toFixed(2)}</span>
                                {sub.desconto > 0 && (
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded w-fit mt-1">
                                        {sub.desconto}% OFF
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-green-600`}></span>
                                Ativa
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                            </button>
                        </td>
                        </tr>
                    )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Assinatura */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Assinatura"
        size="lg"
        footer={
          <>
            <Button 
                className="bg-slate-900 hover:bg-slate-800" 
                onClick={handleSave}
                isLoading={isSaving}
            >
                Criar Assinatura
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Cliente e Plano */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Selecionar Cliente</label>
                <select 
                    name="idUser" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    value={formData.idUser}
                    onChange={handleInputChange}
                >
                    <option value="">Selecione...</option>
                    {clients.map(c => (
                        <option key={c.idUser} value={c.idUser}>{c.nome} ({c.email})</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Selecionar Plano</label>
                <select 
                    name="idPlano" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    value={formData.idPlano}
                    onChange={handleInputChange}
                >
                    <option value="">Selecione...</option>
                    {plans.map(p => (
                        <option key={p.idPlano} value={p.idPlano}>{p.nome} - R$ {p.valorMensalidade}</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Input 
                label="Período (Meses)"
                name="periodo"
                type="number"
                value={formData.periodo}
                onChange={handleInputChange}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-gray-700">Data Início</label>
                <div className="relative">
                    <input
                        type="date"
                        name="dataInicio"
                        value={formData.dataInicio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    />
                </div>
             </div>
             <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-gray-700">Data Final</label>
                <div className="relative">
                    <input
                        type="date"
                        name="dataFim"
                        value={formData.dataFim}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-900"
                        readOnly
                    />
                </div>
             </div>
          </div>

          {/* Desconto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Desconto (%)</label>
                <div className="relative">
                    <input
                        type="number"
                        name="desconto"
                        value={formData.desconto}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
            </div>
          </div>

          {/* Observação */}
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-medium text-gray-700">Observação</label>
             <textarea 
                name="observacao"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Detalhes adicionais sobre a assinatura..."
                value={formData.observacao}
                onChange={handleInputChange}
             />
          </div>

        </div>
      </Modal>
    </BusinessLayout>
  );
};