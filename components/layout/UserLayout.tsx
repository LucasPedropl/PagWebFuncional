
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Store,
  Receipt,
  UserCircle,
  Menu as MenuIcon,
  Compass,
  BarChart3,
  MessageSquare,
  Banknote,
  Ban,
} from 'lucide-react';
import { sessionService } from '../../services/session';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AppNotification } from '../../types';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { cobrancaService } from '../../features/single-payment/services/cobrancaService';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopHeader } from './shell/AppTopHeader';
import { AppMobileBottomNav } from './shell/AppMobileBottomNav';
import { ViewSwitcher } from './shell/ViewSwitcher';
import type { ShellAudience } from './shell/shellTypes';
import { SHELL_MAIN_OFFSET_COLLAPSED, SHELL_MAIN_OFFSET_EXPANDED, shellPageBackdrop } from './shell/shellTheme';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
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
  const { user } = sessionService.getSession();
  const isEmpresa = user?.tipo === 'Empresa';
  const activeView = sessionService.getActiveView() || 'client';

  const showAdminUpgradeCta = !isEmpresa && !sessionService.isEmpresaOwner();
  const upgradeCompanyTeaser = showAdminUpgradeCta
    ? { nome: 'Virar estabelecimento', logo: null as string | null }
    : null;

  const handleSwitchView = async (view: ShellAudience) => {
     setShowSwitcherDropdown(false);
     if (view === 'business' && showAdminUpgradeCta) {
        navigate('/tornar-estabelecimento');
        return;
     }
     sessionService.setActiveView(view);
     try {
        await sessionService.switchToMode(view === 'client' ? 'client' : 'admin');
        window.dispatchEvent(new CustomEvent('pagweb:session-switched', { detail: { view } }));
        navigate(view === 'client' ? '/dashboard' : '/business/dashboard');
     } catch (error) {
        console.error('Erro ao alternar ambiente', error);
     }
  };

  const [sessionReady, setSessionReady] = useState(!isEmpresa);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const unreadChatCount = useUnreadChatCount(sessionReady, 'client');

  useEffect(() => {
    localStorage.setItem('pagweb_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Garante token de cliente e carrega dados ao montar
  useEffect(() => {
      let cancelled = false;
      const init = async () => {
        const { user: sessionUser } = sessionService.getSession();
        if (sessionUser?.tipo === 'Empresa') {
          try {
            await sessionService.switchToMode('client');
          } catch (error) {
            console.error('Erro ao ativar sessão de cliente', error);
          }
        }
        if (cancelled) return;
        setSessionReady(true);
        fetchNotifications();
        fetchProfile();
        if (sessionUser?.tipo === 'Empresa') {
          fetchCompany();
        }
        fetchPendingCounts();
      };
      init();
      return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onSessionSwitched = (e: Event) => {
      const view = (e as CustomEvent).detail?.view;
      if (view === 'client') {
        fetchPendingCounts();
        fetchNotifications();
        fetchProfile();
      }
    };
    window.addEventListener('pagweb:session-switched', onSessionSwitched);
    return () => window.removeEventListener('pagweb:session-switched', onSessionSwitched);
  }, []);

  const fetchCompany = async () => {
    const cached = localStorage.getItem('pagweb_company');
    if (cached) {
      setCompanyProfile(JSON.parse(cached));
    }
    // minha-empresa só aceita token admin; na área do cliente usamos o cache
    if (sessionService.getActiveMode() !== 'admin') return;
    try {
      const data = await companyService.getMyCompany();
      const compData = { nome: data.nome, logo: data.logo || null };
      setCompanyProfile(compData);
      localStorage.setItem('pagweb_company', JSON.stringify(compData));
    } catch (error) {
      console.error("Erro ao carregar empresa no layout user", error);
    }
  };

  useEffect(() => {
    if (!sessionReady) return;
    fetchPendingCounts();
  }, [location.pathname, sessionReady]);

  // Polling e Eventos em tempo real
  useEffect(() => {
    if (!sessionReady) return;
    const interval = setInterval(() => {
      fetchPendingCounts();
      fetchNotifications();
    }, 30000);

    // 2. Listener para eventos manuais de atualização imediata
    const handleRefresh = () => {
      fetchPendingCounts();
      fetchNotifications();
    };

    window.addEventListener('pagweb:refresh-counts', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagweb:refresh-counts', handleRefresh);
    };
  }, [sessionReady]);

  const fetchPendingCounts = async () => {
    try {
      const [connections, subs, invoices] = await Promise.all([
        userService.listConnections(),
        userService.listClientSubscriptions(),
        userService.listClientInvoices()
      ]);
      
      // Filtrar conexões pendentes
      const connectionsData = Array.isArray(connections) ? connections : [];
      setPendingConnectionsCount(connectionsData.filter(c => c.status === 'Pendente').length);
      
      // Filtrar assinaturas pendentes
      const subsData = Array.isArray(subs) ? subs : [];
      setPendingSubscriptionsCount(subsData.filter(s => s.status === 'Pendente').length);
      
      // Filtrar faturas em aberto ou atrasadas + cobranças avulsas da API
      const invoicesData = Array.isArray(invoices) ? invoices : [];
      const apiPending = invoicesData.filter(
        (i) => i.status === 'Aberto' || i.status === 'Atrasado',
      ).length;
      let cobrancaPending = 0;
      try {
        const cobrancas = await cobrancaService.listByUsuario();
        cobrancaPending = cobrancas.filter(
          (c) => c.status === 'Aberto' || c.status === 'Atrasado',
        ).length;
      } catch (cobrancaErr) {
        console.warn('[UserLayout] Falha ao contar cobranças avulsas:', cobrancaErr);
      }
      setPendingInvoicesCount(apiPending + cobrancaPending);
    } catch (error) {
      console.error("Erro ao carregar contagens pendentes", error);
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
      console.error("Erro ao carregar perfil no layout", error);
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
          const data = await userService.listNotifications();
          // Ordena por data (mais recente primeiro) se vierem com data
          const sorted = data.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
          setNotifications(sorted);
      } catch (error) {
          console.error("Erro ao carregar notificações", error);
      } finally {
          setLoadingNotifications(false);
      }
  };

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
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
    e.preventDefault(); // Prevent default context menu
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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Compass, label: 'Explorar', path: '/explorar' },
    { icon: Banknote, label: 'Pagamento Único', path: '/pagamento-unico' },
    { icon: Store, label: 'Estabelecimentos', path: '/empresas', badge: pendingConnectionsCount }, 
    { icon: CreditCard, label: 'Assinaturas', path: '/assinaturas', badge: pendingSubscriptionsCount },
    { icon: Receipt, label: 'Faturas', path: '/pagamentos', badge: pendingInvoicesCount }, 
    { icon: MessageSquare, label: 'Chat', path: '/chat', badge: unreadChatCount },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: CreditCard, label: 'Cartões', path: '/metodos-pagamento' },
    { icon: Ban, label: 'Bloqueios', path: '/bloqueios' },
  ];

  // Mobile Footer Items
  const mobileMenuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Compass, label: 'Explorar', path: '/explorar' },
    { icon: Store, label: 'Estabelec.', path: '/empresas', badge: pendingConnectionsCount },
    { icon: CreditCard, label: 'Assin.', path: '/assinaturas', badge: pendingSubscriptionsCount },
    { icon: Receipt, label: 'Faturas', path: '/pagamentos', badge: pendingInvoicesCount },
    { icon: MessageSquare, label: 'Chat', path: '/chat', badge: unreadChatCount },
    { icon: MenuIcon, label: 'Menu', path: '/menu' },
  ];

  const pageTitle =
    menuItems.find((i) => i.path === location.pathname)?.label ||
    (location.pathname === '/configuracoes'
      ? 'Configurações'
      : location.pathname === '/tornar-estabelecimento'
        ? 'Torne-se admin'
        : 'PagWeb');

  return (
    <div className="flex h-screen bg-[#ECEEF1] font-sans text-slate-900 antialiased">
      <AppSidebar
        audience="client"
        isCollapsed={isCollapsed}
        brand={{ icon: UserCircle, label: 'PagWeb' }}
        menuItems={menuItems}
        settingsPath="/configuracoes"
        currentPath={location.pathname}
        topSlot={
          <ViewSwitcher
            audience="client"
            isCollapsed={isCollapsed}
            activeView={(activeView === 'business' ? 'business' : 'client') as ShellAudience}
            currentAudience="client"
            userProfile={userProfile}
            companyProfile={companyProfile ?? upgradeCompanyTeaser}
            sessionPhotoPath={user?.fotoPerfilPath}
            sessionName={user?.nome}
            isOpen={showSwitcherDropdown}
            onToggle={() => setShowSwitcherDropdown((o) => !o)}
            onClose={() => setShowSwitcherDropdown(false)}
            onSwitch={handleSwitchView}
            businessSubtitle={showAdminUpgradeCta ? 'Torne-se admin PagWeb' : undefined}
          />
        }
      />

      <div
        className={`flex-1 flex flex-col w-full min-w-0 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? SHELL_MAIN_OFFSET_COLLAPSED : SHELL_MAIN_OFFSET_EXPANDED
        }`}
      >
        <AppTopHeader
          pageTitle={pageTitle}
          userName={userProfile?.nome || 'Minha conta'}
          userSubtitle="Cliente"
          userPhotoPath={userProfile?.fotoPerfilPath ?? null}
          onLogout={handleLogout}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((c) => !c)}
          viewSwitcher={{
            activeView: (activeView === 'business' ? 'business' : 'client') as ShellAudience,
            userProfile,
            companyProfile: companyProfile ?? upgradeCompanyTeaser,
            sessionPhotoPath: user?.fotoPerfilPath,
            sessionName: user?.nome,
            onSwitch: handleSwitchView,
            businessSubtitle: showAdminUpgradeCta ? 'Torne-se admin PagWeb' : undefined,
          }}
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
