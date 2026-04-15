import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Lock, Bell, Store, LogOut } from 'lucide-react';
import { sessionService } from '../../services/session';
import { useNavigate } from 'react-router-dom';

export const Configuracoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'seguranca'>('geral');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setIsLoading(true);
    // Simula salvamento
    setTimeout(() => {
        setIsLoading(false);
        alert('Configurações salvas com sucesso!');
    }, 1000);
  };

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie os detalhes da sua empresa e preferências do sistema.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu de Configuração */}
        <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
                <button
                    onClick={() => setActiveTab('geral')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'geral' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Store className="w-4 h-4 mr-3" />
                    Dados da Empresa
                </button>
                <button
                    onClick={() => setActiveTab('notificacoes')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'notificacoes' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Bell className="w-4 h-4 mr-3" />
                    Notificações
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
                    Segurança
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

        {/* Content Area */}
        <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                
                {/* TAB: GERAL */}
                {activeTab === 'geral' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-900">Informações da Empresa</h2>
                            <p className="text-sm text-gray-500">Dados visíveis para seus clientes nas faturas.</p>
                        </div>

                        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                                <Store className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Logo da Empresa
                                </label>
                                <input
                                    type="file"
                                    name="companyLogo"
                                    accept="image/*"
                                    className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                                />
                                <p className="text-xs text-gray-400 mt-2">JPG, GIF ou PNG. Max 1MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Nome Fantasia" defaultValue="Minha Loja Online" />
                            <Input label="Razão Social" defaultValue="Minha Loja LTDA" />
                            <Input label="CNPJ" defaultValue="12.345.678/0001-90" disabled className="bg-gray-50" />
                            <Input label="Telefone de Contato" defaultValue="(11) 99999-9999" />
                        </div>
                        <Input label="E-mail de Suporte" defaultValue="suporte@minhaloja.com.br" />
                        
                        <div className="pt-4">
                            <Button onClick={handleSave} isLoading={isLoading}>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB: NOTIFICAÇÕES */}
                {activeTab === 'notificacoes' && (
                    <div className="space-y-6 animate-fadeIn">
                         <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-900">Preferências de Notificação</h2>
                            <p className="text-sm text-gray-500">Escolha como você quer ser alertado sobre eventos.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Novas Assinaturas</h4>
                                    <p className="text-xs text-gray-500">Receber e-mail quando um novo cliente assinar.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Pagamentos Falhados</h4>
                                    <p className="text-xs text-gray-500">Alertar imediatamente sobre falhas na cobrança.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Relatório Semanal</h4>
                                    <p className="text-xs text-gray-500">Resumo de desempenho toda segunda-feira.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SEGURANÇA */}
                {activeTab === 'seguranca' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-900">Segurança da Conta</h2>
                            <p className="text-sm text-gray-500">Atualize sua senha e configurações de acesso.</p>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <Input label="Senha Atual" type="password" placeholder="••••••" />
                            <Input label="Nova Senha" type="password" placeholder="••••••" />
                            <Input label="Confirmar Nova Senha" type="password" placeholder="••••••" />
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
    </BusinessLayout>
  );
};