import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Login } from './app/(auth)/Login';
import { Register } from './app/(auth)/Register';
import { Activate } from './app/(auth)/Activate';
import { Dashboard as UserDashboard } from './app/(user)/Dashboard';
import { Empresas as UserEmpresas } from './app/(user)/Empresas';
import { Assinaturas as UserAssinaturas } from './app/(user)/Assinaturas';
import { Pagamentos as UserPagamentos } from './app/(user)/Pagamentos';
import { Relatorios as UserRelatorios } from './app/(user)/Relatorios';
import { MetodosPagamento as UserMetodosPagamento } from './app/(user)/MetodosPagamento';
import { Configuracoes as UserConfiguracoes } from './app/(user)/Configuracoes';
import { Bloqueios as UserBloqueios } from './app/(user)/Bloqueios';
import { MenuMobile as UserMenuMobile } from './app/(user)/MenuMobile';
import { Explorar as UserExplorar } from './app/(user)/Explorar';
import { PagamentoUnicoCliente } from './app/(user)/PagamentoUnicoCliente';
import { BusinessDashboard } from './app/(business)/Dashboard';
import { Clientes } from './app/(business)/Clientes';
import { Planos } from './app/(business)/Planos';
import { Servicos } from './app/(business)/Servicos';
import { Categorias } from './app/(business)/Categorias';
import { Produtos } from './app/(business)/Produtos';
import { Agendamentos } from './app/(business)/Agendamentos';
import { HorariosAgendamento } from './app/(business)/HorariosAgendamento';
import { Assinaturas } from './app/(business)/Assinaturas';
import { Pagamentos } from './app/(business)/Pagamentos';
import { PagamentoUnico } from './app/(business)/PagamentoUnico';
import { Relatorios } from './app/(business)/Relatorios';
import { Configuracoes } from './app/(business)/Configuracoes';
import { ConectarWhatsapp } from './app/(business)/ConectarWhatsapp';
import { MenuMobile } from './app/(business)/MenuMobile';
import { Landing } from './app/Landing';
import { CompanyDetails } from './app/CompanyDetails';
import { sessionService } from './services/session';
import { Chat as UserChat } from './app/(user)/Chat';
import { Chat as BusinessChat } from './app/(business)/Chat';

// --- Guards de Rota (Proteção por Tipo de Usuário) ---

// Protege rotas de CLIENTE
const ClientRoute = ({ children }: { children?: React.ReactNode }) => {
  const session = sessionService.getSession();
  const needsClientToken = session.user?.tipo === 'Empresa';
  const [tokenReady, setTokenReady] = useState(!needsClientToken);

  useEffect(() => {
    if (!needsClientToken) return;
    localStorage.setItem('pagweb_active_view', 'client');
    sessionService
      .switchToMode('client')
      .then(() => setTokenReady(true))
      .catch(() => setTokenReady(true));
  }, [needsClientToken]);

  if (!session.token) {
    return <Navigate to="/login?type=client" replace />;
  }

  if (session.user?.tipo === 'Empresa') {
    const activeView = localStorage.getItem('pagweb_active_view');
    if (activeView !== 'client') {
      return <Navigate to="/business/dashboard" replace />;
    }
  }

  if (!tokenReady) {
    return null;
  }

  return <>{children}</>;
};

// Protege rotas de EMPRESA (ADMIN)
const BusinessRoute = ({ children }: { children?: React.ReactNode }) => {
  const session = sessionService.getSession();
  const needsAdminToken = session.user?.tipo === 'Empresa';
  const [tokenReady, setTokenReady] = useState(!needsAdminToken);

  useEffect(() => {
    if (!needsAdminToken) return;
    localStorage.setItem('pagweb_active_view', 'business');
    sessionService
      .switchToMode('admin')
      .then(() => setTokenReady(true))
      .catch(() => setTokenReady(true));
  }, [needsAdminToken]);

  if (!session.token) {
    return <Navigate to="/login?type=business" replace />;
  }

  if (session.user?.tipo !== 'Empresa') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!tokenReady) {
    return null;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/empresa/:id" element={<CompanyDetails />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/activate" element={<Activate />} />
          
          {/* Rotas de Usuário (Cliente) */}
          <Route 
            path="/dashboard" 
            element={
              <ClientRoute>
                <UserDashboard />
              </ClientRoute>
            } 
          />
          <Route 
            path="/empresas" 
            element={
              <ClientRoute>
                <UserEmpresas />
              </ClientRoute>
            } 
          />
          <Route 
            path="/explorar" 
            element={
              <ClientRoute>
                <UserExplorar />
              </ClientRoute>
            } 
          />
          <Route 
            path="/meus-agendamentos" 
            element={
              <ClientRoute>
                <Navigate to="/dashboard" replace />
              </ClientRoute>
            } 
          />
          <Route 
            path="/historico-servicos" 
            element={
              <ClientRoute>
                <Navigate to="/pagamento-unico" replace />
              </ClientRoute>
            } 
          />
          <Route 
            path="/pagamento-unico" 
            element={
              <ClientRoute>
                <PagamentoUnicoCliente />
              </ClientRoute>
            } 
          />
          <Route 
            path="/assinaturas" 
            element={
              <ClientRoute>
                <UserAssinaturas />
              </ClientRoute>
            } 
          />
          <Route 
            path="/pagamentos" 
            element={
              <ClientRoute>
                <UserPagamentos />
              </ClientRoute>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <ClientRoute>
                <UserRelatorios />
              </ClientRoute>
            } 
          />
          <Route 
            path="/metodos-pagamento" 
            element={
              <ClientRoute>
                <UserMetodosPagamento />
              </ClientRoute>
            } 
          />
          <Route 
            path="/bloqueios" 
            element={
              <ClientRoute>
                <UserBloqueios />
              </ClientRoute>
            } 
          />
          <Route 
            path="/configuracoes" 
            element={
              <ClientRoute>
                <UserConfiguracoes />
              </ClientRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ClientRoute>
                <UserChat />
              </ClientRoute>
            } 
          />
          <Route 
            path="/menu" 
            element={
              <ClientRoute>
                <UserMenuMobile />
              </ClientRoute>
            } 
          />

          {/* Rotas de Estabelecimento (Business) */}
          <Route 
            path="/business/dashboard" 
            element={
              <BusinessRoute>
                <BusinessDashboard />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/clientes" 
            element={
              <BusinessRoute>
                <Clientes />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/planos" 
            element={
              <BusinessRoute>
                <Planos />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/servicos" 
            element={
              <BusinessRoute>
                <Servicos />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/categorias" 
            element={
              <BusinessRoute>
                <Categorias />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/produtos" 
            element={
              <BusinessRoute>
                <Produtos />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/agendamentos" 
            element={
              <BusinessRoute>
                <Agendamentos />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/horarios-agendamento" 
            element={
              <BusinessRoute>
                <HorariosAgendamento />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/assinaturas" 
            element={
              <BusinessRoute>
                <Assinaturas />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/pagamentos" 
            element={
              <BusinessRoute>
                <Pagamentos />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/pagamento-unico" 
            element={
              <BusinessRoute>
                <PagamentoUnico />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/relatorios" 
            element={
              <BusinessRoute>
                <Relatorios />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/configuracoes" 
            element={
              <BusinessRoute>
                <Configuracoes />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/whatsapp" 
            element={
              <BusinessRoute>
                <ConectarWhatsapp />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/chat" 
            element={
              <BusinessRoute>
                <BusinessChat />
              </BusinessRoute>
            } 
          />
          <Route 
            path="/business/menu" 
            element={
              <BusinessRoute>
                <MenuMobile />
              </BusinessRoute>
            } 
          />
          
          {/* Default redirect for business sub-routes */}
          <Route path="/business/*" element={<Navigate to="/business/dashboard" />} />

        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;