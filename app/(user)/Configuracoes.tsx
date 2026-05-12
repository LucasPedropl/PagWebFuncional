import React, { useState, useEffect } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, User as UserIcon, Lock, LogOut, Bell } from 'lucide-react';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { sessionService } from '../../services/session';
import { userService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import { formatPhone } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { NotificationSettings } from '../../types';
import { getImageUrl } from '../../utils/api';

export const Configuracoes: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca' | 'notificacoes'>('perfil');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form States
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
      fetchUserProfile();
      fetchNotificationSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
        const data = await userService.getMyAccount();
        const fullPhone = data.telefone || '';
        let ddi = '55';
        let phone = fullPhone;
        
        // Tenta detectar o DDI (muito básico, pode ser melhorado)
        if (fullPhone.startsWith('55')) {
            ddi = '55';
            phone = fullPhone.substring(2);
        } else if (fullPhone.length > 11) {
            // Se for maior que o padrão BR, possivelmente tem DDI
            // Por enquanto, vamos manter o padrão 55 se não tiver certeza
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setProfileData(prev => ({ ...prev, telefone: formatPhone(value) }));
  };

  const handleDdiChange = (value: string) => {
    setProfileData(prev => ({ ...prev, ddi: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleNotificationChange = (key: keyof NotificationSettings) => {
      setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
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

        addToast('success', 'Sucesso', 'Dados atualizados com sucesso!');
        await fetchUserProfile(); // Reload to get new photo path
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

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie seus dados pessoais, segurança e notificações</p>
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
                    <UserIcon className="w-4 h-4 mr-3" />
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
                                    <p className="text-xs text-slate-400">Clique no botão abaixo para escolher uma nova imagem.</p>
                                </div>
                                <input
                                    type="file"
                                    name="fotoPerfil"
                                    accept="image/*"
                                    onChange={handleFileChange}
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
                                onDdiChange={handleDdiChange}
                                phoneNumber={profileData.telefone}
                                onPhoneChange={handlePhoneChange}
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

                {activeTab === 'seguranca' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Alterar Senha</h2>
                        <div className="space-y-4 max-w-md">
                            <Input 
                                label="Senha Atual" 
                                type="password" 
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                            />
                            <Input 
                                label="Nova Senha" 
                                type="password" 
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                            />
                            <Input 
                                label="Confirmar Nova Senha" 
                                type="password" 
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

                {activeTab === 'notificacoes' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Preferências de Notificação</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-medium text-gray-900">Notificações Gerais</h3>
                                    <p className="text-sm text-gray-500">Receber notificações da plataforma</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.notificacoes}
                                        onChange={() => handleNotificationChange('notificacoes')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-medium text-gray-900">E-mail</h3>
                                    <p className="text-sm text-gray-500">Receber atualizações e faturas por e-mail</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.email}
                                        onChange={() => handleNotificationChange('email')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-medium text-gray-900">WhatsApp</h3>
                                    <p className="text-sm text-gray-500">Receber alertas importantes via WhatsApp</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.whatsApp}
                                        onChange={() => handleNotificationChange('whatsApp')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-medium text-gray-900">SMS</h3>
                                    <p className="text-sm text-gray-500">Receber códigos de verificação e alertas urgentes</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={notificationSettings.sms}
                                        onChange={() => handleNotificationChange('sms')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSaveNotifications} isLoading={isLoading}>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Preferências
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