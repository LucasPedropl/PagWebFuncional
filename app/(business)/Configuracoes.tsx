import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Lock, Bell, Store, LogOut, User as UserIcon } from 'lucide-react';
import { sessionService } from '../../services/session';
import { companyService } from '../../services/companyService';
import { userService } from '../../services/userService';
import { NotificationSettings } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { formatCNPJ, formatPhone } from '../../utils/formatters';

export const Configuracoes: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'perfil' | 'geral' | 'notificacoes' | 'seguranca'>('geral');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState({
    idEmpresa: 0,
    nome: '',
    cnpj: '',
    telefone: '',
    logo: null as File | null,
    logoUrl: ''
  });

  const [profileData, setProfileData] = useState({
      idUser: 0,
      nome: '',
      sobreNome: '',
      cpf: '',
      telefone: '',
      email: '',
      fotoPerfil: null as File | null,
      fotoPerfilUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
      notificações: true,
      email: true,
      whatsApp: true,
      sms: true
  });

  useEffect(() => {
    fetchCompanyData();
    fetchUserProfile();
    fetchNotificationSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
        const data = await userService.getMyAccount();
        setProfileData({
            idUser: data.idUser,
            nome: data.nome || '',
            sobreNome: data.sobreNome || '',
            cpf: data.cpf || '',
            telefone: formatPhone(data.telefone || ''),
            email: data.email || '',
            fotoPerfil: null,
            fotoPerfilUrl: data.fotoPerfilPath || ''
        });
    } catch (error: any) {
        addToast('error', 'Erro', 'Falha ao carregar dados do perfil');
    }
  };

  const fetchNotificationSettings = async () => {
      try {
          const settings = await userService.getNotificationSettings();
          setNotificationSettings(settings);
      } catch (error) {
          console.error("Erro ao carregar configurações de notificação", error);
      }
  };

  const fetchCompanyData = async () => {
    setIsFetching(true);
    try {
      const data = await companyService.getMyCompany();
      setCompanyData({
        idEmpresa: data.idEmpresa,
        nome: data.nome || '',
        cnpj: formatCNPJ(data.cnpj || ''),
        telefone: formatPhone(data.telefone || ''),
        logo: null,
        logoUrl: data.logo || ''
      });
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao carregar dados da empresa');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cnpj') value = formatCNPJ(value);
    if (name === 'telefone') value = formatPhone(value);
    
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCompanyData(prev => ({ ...prev, logo: file }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let { name, value } = e.target;
      if (name === 'telefone') value = formatPhone(value);
      
      setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setProfileData(prev => ({ ...prev, fotoPerfil: file }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
        const cleanPhone = profileData.telefone.replace(/\D/g, '');
        
        await userService.updateAccount(profileData.idUser, {
            nome: profileData.nome,
            sobreNome: profileData.sobreNome,
            email: profileData.email,
            telefone: cleanPhone,
            fotoPerfil: profileData.fotoPerfil
        });

        addToast('success', 'Sucesso', 'Dados pessoais atualizados com sucesso!');
        await fetchUserProfile();
    } catch (error: any) {
        addToast('error', 'Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
      if (!passwordData.newPassword) {
          addToast('error', 'Erro', "A nova senha não pode estar vazia.");
          return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
          addToast('error', 'Erro', "As novas senhas não coincidem.");
          return;
      }
      setIsLoading(true);
      try {
          await userService.updateAccount(profileData.idUser, {
              password: passwordData.newPassword
          });
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          addToast('success', 'Sucesso', 'Senha atualizada com sucesso!');
      } catch (error: any) {
          addToast('error', 'Erro', error.message || 'Falha ao atualizar senha');
      } finally {
          setIsLoading(false);
      }
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
      setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
        await userService.updateNotificationSettings(notificationSettings);
        addToast('success', 'Sucesso', 'Preferências de notificação atualizadas!');
    } catch (error: any) {
        addToast('error', 'Erro', error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const cleanCNPJ = companyData.cnpj.replace(/\D/g, '');
      const cleanPhone = companyData.telefone.replace(/\D/g, '');

      await companyService.update(companyData.idEmpresa, {
        nome: companyData.nome,
        cnpj: cleanCNPJ,
        telefone: cleanPhone,
        logo: companyData.logo
      });

      addToast('success', 'Sucesso', 'Configurações salvas com sucesso!');
      await fetchCompanyData(); // Recarrega os dados para atualizar a logo
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
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
                    onClick={() => setActiveTab('perfil')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'perfil' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <UserIcon className="w-4 h-4 mr-3" />
                    Meu Perfil
                </button>
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
                
                {/* TAB: PERFIL */}
                {activeTab === 'perfil' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Dados Pessoais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Nome" 
                                name="nome"
                                value={profileData.nome}
                                onChange={handleProfileChange}
                            />
                            <Input 
                                label="Sobrenome" 
                                name="sobreNome"
                                value={profileData.sobreNome}
                                onChange={handleProfileChange}
                            />
                            <Input 
                                label="CPF" 
                                name="cpf"
                                value={profileData.cpf}
                                disabled 
                                className="bg-gray-50 text-gray-500 cursor-not-allowed" 
                            />
                            <Input 
                                label="Telefone" 
                                name="telefone"
                                value={profileData.telefone}
                                onChange={handleProfileChange}
                                maxLength={15}
                            />
                        </div>
                        <Input 
                            label="E-mail" 
                            name="email"
                            value={profileData.email}
                            disabled 
                            className="bg-gray-50 text-gray-500 cursor-not-allowed" 
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Foto de Perfil
                            </label>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                                    {profileData.fotoPerfilUrl ? (
                                        <img src={profileData.fotoPerfilUrl} alt="Foto de Perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    name="fotoPerfil"
                                    accept="image/*"
                                    onChange={handleProfileFileChange}
                                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                                />
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSaveProfile} isLoading={isLoading}>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB: GERAL */}
                {activeTab === 'geral' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-900">Informações da Empresa</h2>
                            <p className="text-sm text-gray-500">Dados visíveis para seus clientes nas faturas.</p>
                        </div>

                        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                                {companyData.logoUrl ? (
                                  <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <Store className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Logo da Empresa
                                </label>
                                <input
                                    type="file"
                                    name="companyLogo"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                                />
                                <p className="text-xs text-gray-400 mt-2">JPG, GIF ou PNG. Max 1MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                              label="Nome da Empresa" 
                              name="nome"
                              value={companyData.nome}
                              onChange={handleChange}
                            />
                            <Input 
                              label="CNPJ" 
                              name="cnpj"
                              value={companyData.cnpj}
                              disabled 
                              className="bg-gray-50 text-gray-500 cursor-not-allowed" 
                            />
                            <Input 
                              label="Telefone de Contato" 
                              name="telefone"
                              value={companyData.telefone}
                              onChange={handleChange}
                              maxLength={15}
                            />
                        </div>
                        
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
                                    <h4 className="text-sm font-medium text-gray-900">Notificações Gerais</h4>
                                    <p className="text-xs text-gray-500">Habilitar ou desabilitar todos os alertas.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.notificações} 
                                        onChange={() => handleNotificationChange('notificações')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">E-mail</h4>
                                    <p className="text-xs text-gray-500">Receber alertas por correio eletrônico.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.email} 
                                        onChange={() => handleNotificationChange('email')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">WhatsApp</h4>
                                    <p className="text-xs text-gray-500">Receber notificações no seu celular cadastrado.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.whatsApp} 
                                        onChange={() => handleNotificationChange('whatsApp')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">SMS</h4>
                                    <p className="text-xs text-gray-500">Receber códigos e alertas via SMS.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.sms} 
                                        onChange={() => handleNotificationChange('sms')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleSaveNotifications} isLoading={isLoading}>
                                    Salvar Preferências
                                </Button>
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
                            <Input 
                                label="Nova Senha" 
                                type="password" 
                                placeholder="••••••" 
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                            />
                            <Input 
                                label="Confirmar Nova Senha" 
                                type="password" 
                                placeholder="••••••" 
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                            />
                        </div>

                        <div className="pt-4">
                            <Button onClick={handleSavePassword} isLoading={isLoading} variant="secondary">
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