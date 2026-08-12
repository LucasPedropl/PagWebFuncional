
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Layers,
  CreditCard,
  DollarSign,
  FileText,
  Wallet,
  Menu as MenuIcon,
  MessageCircle,
  MessageSquare,
  PlugZap,
  Scissors,
  Banknote,
  Tags,
  Package,
} from 'lucide-react';
import { sessionService } from '../../services/session';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AppNotification } from '../../types';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopHeader } from './shell/AppTopHeader';
import { AppMobileBottomNav } from './shell/AppMobileBottomNav';
import { ViewSwitcher } from './shell/ViewSwitcher';
import type { ShellAudience } from './shell/shellTypes';
import { resolveShellPageTitle } from './shell/shellTypes';
import { SHELL_MAIN_OFFSET_COLLAPSED, SHELL_MAIN_OFFSET_EXPANDED, shellPageBackdrop } from './shell/shellTheme';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('pagweb_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<{nome: string, fotoPerfilPath: string | null} | null>(() => {
    const { user } = sessionService.getSession();
    return user ? { nome: user.nome, fotoPerfilPath: user.fotoPerfilPath || null } : null;
  });
  const [companyProfile, setCompanyProfile] = useState<{nome: string, logo: string | null} | null>(() => {
     const savedCompany = localStorage.getItem('pagweb_company');
     return savedCompany ? JSON.parse(savedCompany) : null;
  });

  const [showSwitcherDropdown, setShowSwitcherDropdown] = useState(false);
  const unreadChatCount = useUnreadChatCount(true, 'business');
  const { user } = sessionService.getSession();
  const isEmpresa = user?.tipo === 'Empresa';
  const activeView = localStorage.getItem('pagweb_active_view') || 'business';

  const handleSwitchView = async (view: ShellAudience) => {
     setShowSwitcherDropdown(false);
     localStorage.setItem('pagweb_active_view', view);
     try {
        await sessionService.switchToMode(view === 'client' ? 'client' : 'admin');
        window.dispatchEvent(new CustomEvent('pagweb:session-switched', { detail: { view } }));
        navigate(view === 'client' ? '/dashboard' : '/business/dashboard');
     } catch (error) {
        console.error('Erro ao alternar ambiente', error);
     }
  };

  useEffect(() => {
    localStorage.setItem('pagweb_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Garante token admin antes de carregar dados do estabelecimento
  useEffect(() => {
      let cancelled = false;
      const init = async () => {
        if (isEmpresa) {
          try {
            await sessionService.switchToMode('admin');
          } catch (error) {
            console.error('Erro ao ativar sessão administrativa', error);
          }
        }
        if (cancelled) return;
        fetchNotifications();
        fetchProfile();
        fetchCompany();
      };
      init();
      return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onSessionSwitched = (e: Event) => {
      const view = (e as CustomEvent).detail?.view;
      if (view === 'business') {
        fetchNotifications();
        fetchProfile();
        fetchCompany();
      }
    };
    window.addEventListener('pagweb:session-switched', onSessionSwitched);
    return () => window.removeEventListener('pagweb:session-switched', onSessionSwitched);
  }, []);

  const fetchCompany = async () => {
    try {
      const data = await companyService.getMyCompany();
      const compData = { nome: data.nome, logo: data.logo || null };
      setCompanyProfile(compData);
      localStorage.setItem('pagweb_company', JSON.stringify(compData));
    } catch (error) {
      console.error("Erro ao carregar empresa no layout business", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await userService.getMyAccount();
      setUserProfile({
          nome: data.nome,
          fotoPerfilPath: data.fotoPerfilPath
      });
      const sessionUserStr = localStorage.getItem('pagweb_user');
      if (sessionUserStr) {
         const sessionUser = JSON.parse(sessionUserStr);
         sessionUser.fotoPerfilPath = data.fotoPerfilPath;
         sessionUser.nome = data.nome;
         localStorage.setItem('pagweb_user', JSON.stringify(sessionUser));
      }
    } catch (error) {
      console.error("Erro ao carregar perfil no layout business", error);
      // Fallback para sessão se falhar
      const { user } = sessionService.getSession();
      if (user) {
          setUserProfile({ nome: user.nome, fotoPerfilPath: null });
      }
    }
  };

  const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
          // Usa o mesmo serviço (endpoint é compartilhado por token)
          const data = await userService.listNotifications();
          const sorted = data.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
          setNotifications(sorted);
      } catch (error) {
          console.error("Erro ao carregar notificações", error);
      } finally {
          setLoadingNotifications(false);
      }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.lida);
    if (unreadNotifications.length === 0) return;

    try {
      // Mark all as read locally first for fast UI
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      
      // Call API for each unread notification
      await Promise.all(unreadNotifications.map(n => userService.markNotificationAsSeen(n.id)));
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas", error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      await userService.markNotificationAsSeen(id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida", error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await userService.deleteNotification(id);
    } catch (error) {
      console.error("Erro ao deletar notificação", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      setNotifications([]);
      await userService.clearAllNotifications();
    } catch (error) {
      console.error("Erro ao limpar notificações", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Visão geral', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: Layers, label: 'Planos', path: '/business/planos' },
    {
      icon: Scissors,
      label: 'Serviços',
      children: [
        { label: 'Categorias', path: '/business/categorias', icon: Tags },
        { label: 'Produtos', path: '/business/produtos', icon: Package },
        { label: 'Catálogo', path: '/business/servicos', icon: Scissors },
      ],
    },
    { icon: CreditCard, label: 'Assinaturas', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Gestão de Cobranças', path: '/business/pagamentos' },
    { icon: Banknote, label: 'Pagamento Único', path: '/business/pagamento-unico' },
    { icon: MessageSquare, label: 'Chat com Clientes', path: '/business/chat', badge: unreadChatCount },
    { icon: FileText, label: 'Relatórios', path: '/business/relatorios' },
    { icon: MessageCircle, label: 'WhatsApp', path: '/business/whatsapp' },
    { icon: PlugZap, label: 'Integrações', path: '/business/integracoes' },
  ];

  // Menu items for Mobile Footer (5 items max usually)
  const mobileMenuItems = [
    { icon: LayoutGrid, label: 'Início', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: CreditCard, label: 'Assin.', path: '/business/assinaturas' },
    { icon: MessageSquare, label: 'Chat', path: '/business/chat', badge: unreadChatCount },
    { icon: MenuIcon, label: 'Menu', path: '/business/menu' },
  ];

  const pageTitle =
    resolveShellPageTitle(menuItems, location.pathname) ||
    (location.pathname.includes('configuracoes')
      ? 'Configurações'
      : location.pathname.includes('menu')
        ? 'Menu'
        : 'Visão geral');

  return (
    <div className="flex h-screen bg-[#ECEEF1] font-sans text-slate-900 antialiased">
      <AppSidebar
        audience="business"
        isCollapsed={isCollapsed}
        brand={{
          icon: Wallet,
          label: 'PagWeb',
        }}
        menuItems={menuItems}
        settingsPath="/business/configuracoes"
        currentPath={location.pathname}
        topSlot={
          isEmpresa ? (
            <ViewSwitcher
              audience="business"
              isCollapsed={isCollapsed}
              activeView={(activeView === 'business' ? 'business' : 'client') as ShellAudience}
              currentAudience="business"
              userProfile={userProfile}
              companyProfile={companyProfile}
              sessionPhotoPath={user?.fotoPerfilPath}
              sessionName={user?.nome}
              isOpen={showSwitcherDropdown}
              onToggle={() => setShowSwitcherDropdown((o) => !o)}
              onClose={() => setShowSwitcherDropdown(false)}
              onSwitch={handleSwitchView}
            />
          ) : undefined
        }
      />

      <div
        className={`flex-1 flex flex-col w-full min-w-0 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? SHELL_MAIN_OFFSET_COLLAPSED : SHELL_MAIN_OFFSET_EXPANDED
        }`}
      >
        <AppTopHeader
          pageTitle={pageTitle}
          userName={userProfile?.nome || 'Administrador'}
          userSubtitle="Estabelecimento"
          userPhotoPath={userProfile?.fotoPerfilPath ?? null}
          onLogout={handleLogout}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((c) => !c)}
          viewSwitcher={
            isEmpresa
              ? {
                  activeView: (activeView === 'business' ? 'business' : 'client') as ShellAudience,
                  userProfile,
                  companyProfile,
                  sessionPhotoPath: user?.fotoPerfilPath,
                  sessionName: user?.nome,
                  onSwitch: handleSwitchView,
                }
              : undefined
          }
          notifications={{
            isOpen: showNotifications,
            onToggle: () => setShowNotifications((o) => !o),
            onClose: () => setShowNotifications(false),
            items: notifications,
            loading: loadingNotifications,
            unreadCount,
            onMarkRead: handleMarkAsRead,
            onMarkAllRead: markAllAsRead,
            onClearAll: handleClearAllNotifications,
            onDelete: handleDeleteNotification,
          }}
        />

        <main className={`${shellPageBackdrop} p-4 md:p-6 lg:p-8 pb-[5.5rem] md:pb-8`}>{children}</main>

        <AppMobileBottomNav items={mobileMenuItems} currentPath={location.pathname} />
      </div>
    </div>
  );
};
