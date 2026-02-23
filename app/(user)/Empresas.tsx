
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Store, MapPin, Mail, FileText, Loader2, LogOut, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientConnection, ClientSubscription } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Empresas: React.FC = () => {
  const { addToast } = useToast();
  const [companies, setCompanies] = useState<ClientConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [companyToUnlink, setCompanyToUnlink] = useState<ClientConnection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ClientConnection | null>(null);
  const [companySubscriptions, setCompanySubscriptions] = useState<ClientSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  const [isAccepting, setIsAccepting] = useState<number | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const data = await userService.listConnections();
      setCompanies(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptConnection = async (idEmpresa: number) => {
    try {
      setIsAccepting(idEmpresa);
      await userService.acceptConnection(idEmpresa);
      addToast('success', 'Sucesso', 'Conexão aceita com sucesso.');
      await fetchConnections();
    } catch (error: any) {
      addToast('error', 'Erro', error.message);
    } finally {
      setIsAccepting(null);
    }
  };

  const handleUnlinkClick = (company: ClientConnection) => {
      setCompanyToUnlink(company);
      setIsUnlinkModalOpen(true);
  };

  const handleDetailsClick = async (company: ClientConnection) => {
    setSelectedCompany(company);
    setIsDetailsModalOpen(true);
    setIsLoadingSubscriptions(true);
    try {
        const allSubs = await userService.listClientSubscriptions();
        // Filter subscriptions by company name
        const filtered = allSubs.filter(sub => sub.nomeEmpresa === company.nomeEmpresa);
        setCompanySubscriptions(filtered);
    } catch (error) {
        console.error("Erro ao carregar assinaturas", error);
        addToast('error', 'Erro', 'Não foi possível carregar as assinaturas.');
    } finally {
        setIsLoadingSubscriptions(false);
    }
  };

  const confirmUnlink = async () => {
      if (!companyToUnlink || !companyToUnlink.idEmpresa) {
        if (!companyToUnlink?.idEmpresa) {
            addToast('error', 'Erro', 'Identificador da empresa não encontrado.');
            setIsUnlinkModalOpen(false);
            return;
        }
      }
      
      try {
          setIsProcessing(true);
          await userService.unlinkCompany(companyToUnlink.idEmpresa);
          addToast('success', 'Sucesso', 'Vínculo com o estabelecimento removido.');
          await fetchConnections();
          setIsUnlinkModalOpen(false);
          setCompanyToUnlink(null);
      } catch (error: any) {
          addToast('error', 'Erro ao desvincular', error.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <p className="text-gray-500 mt-1">Lojas e empresas onde você possui cadastro ou assinaturas.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-gray-500 max-w-sm mb-6">
                Você ainda não está vinculado a nenhum estabelecimento. Peça para a loja enviar um convite para seu email.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xl uppercase">
                            {company.nomeEmpresa.substring(0,2)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            company.statusConexao === 'Ativo' ? 'bg-green-100 text-green-800' : 
                            company.statusConexao === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {company.statusConexao}
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{company.nomeEmpresa}</h3>
                    <p className="text-xs text-gray-500 mb-4">Resp: {company.nomeDono}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Mail className="w-3.5 h-3.5 mr-2" /> {company.emailEmpresa}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <FileText className="w-3.5 h-3.5 mr-2" /> {formatCNPJ(company.cnpjEmpresa)}
                    </div>

                    <div className="mt-auto flex gap-2">
                        {company.statusConexao === 'Pendente' && (
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAcceptConnection(company.idEmpresa)}
                                isLoading={isAccepting === company.idEmpresa}
                            >
                                Aceitar Conexão
                            </Button>
                        )}
                        {company.statusConexao !== 'Pendente' && (
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleDetailsClick(company)}
                            >
                                Ver Detalhes
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50 hover:border-red-200"
                            title="Desvincular do estabelecimento"
                            onClick={() => handleUnlinkClick(company)}
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Modal Confirmar Desvínculo */}
      <Modal
        isOpen={isUnlinkModalOpen}
        onClose={() => setIsUnlinkModalOpen(false)}
        title="Desvincular Estabelecimento"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUnlinkModalOpen(false)} disabled={isProcessing}>Cancelar</Button>
            <Button 
                onClick={confirmUnlink} 
                isLoading={isProcessing} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Saída
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
                Ao se desvincular de <strong>{companyToUnlink?.nomeEmpresa}</strong>, você perderá acesso ao histórico de faturas e suas assinaturas ativas nesta empresa poderão ser canceladas.
            </p>
         </div>
      </Modal>

      {/* Modal Detalhes da Empresa */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Estabelecimento"
        size="lg"
        footer={
            <Button onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
        }
      >
        {selectedCompany && (
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-slate-700 font-bold text-2xl uppercase border border-gray-200 shadow-sm">
                        {selectedCompany.nomeEmpresa.substring(0,2)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedCompany.nomeEmpresa}</h3>
                        <p className="text-sm text-gray-500">Responsável: {selectedCompany.nomeDono}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                                <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
                                {formatCNPJ(selectedCompany.cnpjEmpresa)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                                {selectedCompany.emailEmpresa}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Assinaturas Ativas
                    </h4>
                    
                    {isLoadingSubscriptions ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : companySubscriptions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">Nenhuma assinatura encontrada para este estabelecimento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {companySubscriptions.map((sub) => (
                                <div key={sub.idAssinatura} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-medium text-gray-900">{sub.nomePlano}</h5>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Início: {formatDate(sub.dataInicio)}
                                                </span>
                                                {sub.dataFim && (
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {sub.dataFim.startsWith('0001-01-01') 
                                                            ? 'Assinatura recorrente' 
                                                            : `Fim: ${formatDate(sub.dataFim)}`
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-slate-900">{formatCurrency(sub.valorMensal)}/mês</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${
                                                sub.status === 'Ativa' ? 'bg-green-100 text-green-800' : 
                                                sub.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </Modal>

    </UserLayout>
  );
};
