import React, { useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, User, Lock, LogOut } from 'lucide-react';
import { sessionService } from '../../services/session';
import { useNavigate } from 'react-router-dom';

export const Configuracoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca'>('perfil');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        alert('Dados atualizados!');
    }, 1000);
  };

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie seus dados pessoais e segurança.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
         <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
                <button
                    onClick={() => setActiveTab('perfil')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'perfil' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <User className="w-4 h-4 mr-3" />
                    Meu Perfil
                </button>
                <button
                    onClick={() => setActiveTab('seguranca')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'seguranca' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Lock className="w-4 h-4 mr-3" />
                    Senha e Segurança
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100">
                     <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sair da Conta
                    </button>
                </div>
            </nav>
         </div>

         <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                {activeTab === 'perfil' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Dados Pessoais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Nome" defaultValue="Pedro" />
                            <Input label="Sobrenome" defaultValue="Mota" />
                            <Input label="CPF" defaultValue="000.000.000-00" disabled className="bg-gray-50" />
                            <Input label="Telefone" defaultValue="(11) 99999-9999" />
                        </div>
                        <Input label="E-mail" defaultValue="cliente@email.com" disabled className="bg-gray-50" />
                        <div className="pt-4">
                            <Button onClick={handleSave} isLoading={isLoading}>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'seguranca' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Alterar Senha</h2>
                        <div className="space-y-4 max-w-md">
                            <Input label="Senha Atual" type="password" />
                            <Input label="Nova Senha" type="password" />
                            <Input label="Confirmar Nova Senha" type="password" />
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSave} isLoading={isLoading} variant="secondary">
                                Atualizar Senha
                            </Button>
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>
    </UserLayout>
  );
};