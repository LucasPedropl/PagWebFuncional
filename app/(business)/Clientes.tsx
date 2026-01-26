import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Edit2, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { User } from '../../types';

export const Clientes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State (Só email necessário para conectar)
  const [emailToConnect, setEmailToConnect] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await businessService.listClients();
      // Garante que o estado seja sempre um array, mesmo que o serviço falhe silenciosamente
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao listar clientes", error);
      setClientes([]); // Fallback em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!emailToConnect) return;
    try {
      setIsSaving(true);
      await businessService.connectClient(emailToConnect);
      await fetchClients();
      setIsModalOpen(false);
      setEmailToConnect('');
      alert("Cliente conectado com sucesso!");
    } catch (error) {
      alert("Erro ao conectar cliente. Verifique se o email está correto e se o usuário existe.");
    } finally {
      setIsSaving(false);
    }
  };

  // Verificação de segurança: Só tenta filtrar se 'clientes' for de fato um array
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  
  const filteredClients = safeClientes.filter(c => 
    (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-500 mt-1">Clientes vinculados ao seu estabelecimento.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Conectar Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-600"
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
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Carregando clientes...
                        </div>
                    </td>
                 </tr>
              ) : filteredClients.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                 </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.idUser} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {client.nome} {client.sobreNome || ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {client.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-green-600`}></span>
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Simplificado para apenas conectar por email */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Conectar Novo Cliente"
        size="md"
        footer={
          <>
            <Button onClick={handleConnect} isLoading={isSaving}>Conectar</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
          </>
        }
      >
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex items-start">
                <LinkIcon className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <p>Insira o e-mail do cliente já cadastrado na plataforma para vinculá-lo à sua empresa.</p>
            </div>
            <Input 
                label="E-mail do Cliente" 
                placeholder="cliente@email.com" 
                type="email"
                value={emailToConnect}
                onChange={(e) => setEmailToConnect(e.target.value)}
            />
        </div>
      </Modal>
    </BusinessLayout>
  );
};