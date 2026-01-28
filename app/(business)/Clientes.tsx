import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Loader2, Send, CheckCircle2, Mail, Unplug, AlertTriangle } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { User } from '../../types';

export const Clientes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [emailToConnect, setEmailToConnect] = useState('');
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  
  // State para exclusão
  const [clientToDelete, setClientToDelete] = useState<{id: number, nome: string} | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset modal state when closed
  useEffect(() => {
    if (!isModalOpen) {
        setEmailToConnect('');
        setSuccessEmail(null);
    }
  }, [isModalOpen]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await businessService.listClients();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao listar clientes", error);
      setClientes([]);
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
      setSuccessEmail(emailToConnect);
    } catch (error: any) {
      // Se der erro, checamos se é string ou objeto error
      const msg = error.message || "Erro desconhecido";
      // Se não for sucesso explicito (mas a API é void), assumimos sucesso no front pra UX
      // (Mantendo lógica original, mas agora o service joga erro limpo)
      if (msg.includes("sucesso") || msg.includes("convidado")) {
           setSuccessEmail(emailToConnect);
      } else {
           alert(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (id: number, nome: string) => {
      setClientToDelete({ id, nome });
      setIsDeleteModalOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!clientToDelete) return;

    try {
        setIsSaving(true);
        await businessService.disconnectClient(clientToDelete.id);
        await fetchClients();
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
    } catch (error: any) {
        alert(error.message || "Erro ao desvincular cliente.");
    } finally {
        setIsSaving(false);
    }
  };

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
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
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
                        <button 
                            onClick={() => client.idUser && openDeleteModal(client.idUser, client.nome)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Desvincular Cliente"
                        >
                          <Unplug className="w-4 h-4" />
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

      {/* Modal Conectar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={successEmail ? "Convite Enviado" : "Conectar Novo Cliente"}
        size="md"
        footer={
          !successEmail ? (
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button onClick={handleConnect} isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800">
              Entendido
            </Button>
          )
        }
      >
        {successEmail ? (
          <div className="text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Solicitação enviada!</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Um convite foi enviado para <strong className="text-gray-900">{successEmail}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-left border border-gray-100">
                <p className="text-gray-600 flex gap-2">
                    <Mail className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <span>
                        Se o cliente já possuir conta, ele receberá uma notificação para aceitar.
                        Caso contrário, ele será instruído a criar uma conta gratuita para se conectar à sua empresa.
                    </span>
                </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
              <div className="text-sm text-gray-500">
                  Informe o e-mail do seu cliente para iniciar o vínculo.
              </div>
              <Input 
                  label="E-mail do Cliente" 
                  placeholder="cliente@exemplo.com" 
                  type="email"
                  value={emailToConnect}
                  onChange={(e) => setEmailToConnect(e.target.value)}
                  autoFocus
              />
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Desvincular Cliente"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                onClick={confirmDisconnect} 
                isLoading={isSaving} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Desvinculação
            </Button>
          </>
        }
      >
         <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tem certeza?</h3>
            <p className="text-sm text-gray-500">
                Você está prestes a desvincular <strong>{clientToDelete?.nome}</strong>. 
                O cliente perderá acesso aos planos e benefícios da sua empresa.
            </p>
         </div>
      </Modal>
    </BusinessLayout>
  );
};