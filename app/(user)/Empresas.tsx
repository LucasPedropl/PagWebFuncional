
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Store, MapPin, Mail, FileText, Loader2, LogOut, AlertTriangle } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientConnection } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Empresas: React.FC = () => {
  const { addToast } = useToast();
  const [companies, setCompanies] = useState<ClientConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [companyToUnlink, setCompanyToUnlink] = useState<ClientConnection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleUnlinkClick = (company: ClientConnection) => {
      setCompanyToUnlink(company);
      setIsUnlinkModalOpen(true);
  };

  const confirmUnlink = async () => {
      if (!companyToUnlink || !companyToUnlink.idEmpresa) {
        // Fallback caso a API não retorne idEmpresa, usamos tratamento de erro
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
          await fetchConnections(); // Atualiza a lista
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
                        <Button variant="outline" className="w-full">Ver Detalhes</Button>
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

    </UserLayout>
  );
};
