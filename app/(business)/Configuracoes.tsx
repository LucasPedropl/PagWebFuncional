import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Lock, Bell, Store, LogOut, User as UserIcon } from 'lucide-react';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { sessionService } from '../../services/session';
import { companyService } from '../../services/companyService';
import { userService } from '../../services/userService';
import { NotificationSettings } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { formatCNPJ, formatPhone, formatCPFOrCNPJ } from '../../utils/formatters';
import { getImageUrl } from '../../utils/api';

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
    ddi: '55',
    logo: null as File | null,
    logoUrl: ''
  });

  const [profileData, setProfileData] = useState({
      idUser: 0,
      nome: '',
      sobreNome: '',
      cpf: '',
      telefone: '',
      ddi: '55',
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
      notificacoes: true,
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
        const fullPhone = data.telefone || '';
        let ddi = '55';
        let phone = fullPhone;
        if (fullPhone.startsWith('55')) {
            ddi = '55';
            phone = fullPhone.substring(2);
        }

        setProfileData({
            idUser: data.idUser,
            nome: data.nome || '',
            sobreNome: data.sobreNome || '',
            cpf: data.cpf || '',
            telefone: formatPhone(phone),
            ddi: ddi,
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
      const fullPhone = data.telefone || '';
      let ddi = '55';
      let phone = fullPhone;
      if (fullPhone.startsWith('55')) {
          ddi = '55';
          phone = fullPhone.substring(2);
      }

      setCompanyData({
        idEmpresa: data.idEmpresa,
        nome: data.nome || '',
        cnpj: formatCPFOrCNPJ(data.cnpj || ''),
        telefone: formatPhone(phone),
        ddi: ddi,
        logo: null,
        logoUrl: data.logo || ''
      });
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao carregar dados da empresa');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = name === 'cnpj' ? formatCPFOrCNPJ(value) : value;
    setCompanyData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleCompanyPhoneChange = (value: string) => {
    setCompanyData(prev => ({ ...prev, telefone: formatPhone(value) }));
  };

  const handleCompanyDdiChange = (value: string) => {
    setCompanyData(prev => ({ ...prev, ddi: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCompanyData(prev => ({ 
        ...prev, 
        logo: file,
        logoUrl: previewUrl 
      }));
    } else {
      setCompanyData(prev => ({ ...prev, logo: null }));
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhoneChange = (value: string) => {
    setProfileData(prev => ({ ...prev, telefone: formatPhone(value) }));
  };

  const handleProfileDdiChange = (value: string) => {
    setProfileData(prev => ({ ...prev, ddi: value }));
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setProfileData(prev => ({ 
          ...prev, 
          fotoPerfil: file,
          fotoPerfilUrl: previewUrl
        }));
      } else {
        setProfileData(prev => ({ ...prev, fotoPerfil: null }));
      }
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
            telefone: profileData.ddi + cleanPhone,
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
        telefone: companyData.ddi + cleanPhone,
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
                    Dados da Empresa/Estabelecimento
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
                        
                        {/* Foto de Perfil no Topo */}
                        <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 duration-300">
                                     {profileData.fotoPerfilUrl ? (
                                         <img src={getImageUrl(profileData.fotoPerfilUrl)} alt="Foto de Perfil" className="w-full h-full object-cover" />
                                     ) : (
                                         <UserIcon className="w-16 h-16 text-gray-200" />
                                     )}
                                 </div>
                                 <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                            </div>
                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                <div className="space-y-1">
                                    <label className="block text-base font-black text-slate-800">
                                        Sua Foto de Perfil
                                    </label>
                                    <p className="text-xs text-slate-400">Esta foto será visível internamente no sistema.</p>
                                </div>
                                <input
                                    type="file"
                                    name="fotoPerfil"
                                    accept="image/*"
                                    onChange={handleProfileFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:transition-all file:cursor-pointer shadow-sm"
                                />
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">PNG ou JPG</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">Máx. 2MB</span>
                                </div>
                            </div>
                        </div>

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
                        </div>
                        <div className="max-w-md">
                            <PhoneInput 
                                label="Telefone" 
                                ddi={profileData.ddi}
                                onDdiChange={handleProfileDdiChange}
                                phoneNumber={profileData.telefone}
                                onPhoneChange={handleProfilePhoneChange}
                            />
                        </div>
                        <Input 
                            label="E-mail" 
                            name="email"
                            value={profileData.email}
                            disabled 
                            className="bg-gray-50 text-gray-500 cursor-not-allowed" 
                        />
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
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Dados da Empresa/Estabelecimento</h2>
                            <p className="text-sm text-gray-500">Dados visíveis para seus clientes nas faturas.</p>
                        </div>

                        {/* Logo da Empresa no Topo - Mesmo estilo da Foto de Perfil */}
                        <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 duration-300">
                                    {companyData.logoUrl ? (
                                      <img src={getImageUrl(companyData.logoUrl)} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                      <Store className="w-16 h-16 text-gray-200" />
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors pointer-events-none" />
                            </div>
                            
                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                <div className="space-y-1">
                                    <label className="block text-base font-black text-slate-900">
                                        Logo da Empresa/Estabelecimento
                                    </label>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Esta logo aparecerá nas faturas e no painel do seu cliente.
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    name="companyLogo"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-all file:cursor-pointer shadow-sm shadow-blue-200"
                                />
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">PNG ou SVG</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Máx. 2MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Razão Social / Nome da Empresa/Estabelecimento" 
                                name="nome"
                                value={companyData.nome}
                                onChange={handleCompanyChange}
                            />
                            <Input 
                                label="CPF/CNPJ" 
                                name="cnpj"
                                value={companyData.cnpj}
                                onChange={handleCompanyChange}
                                maxLength={18}
                            />
                        </div>
                        <PhoneInput 
                            label="Telefone Comercial" 
                            ddi={companyData.ddi}
                            onDdiChange={handleCompanyDdiChange}
                            phoneNumber={companyData.telefone}
                            onPhoneChange={handleCompanyPhoneChange}
                        />
                        
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
                                        checked={notificationSettings.notificacoes} 
                                        onChange={() => handleNotificationChange('notificacoes')}
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
                                    <p className="text-xs text-gray-500">Receber notificações celular cadastrado.</p>
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