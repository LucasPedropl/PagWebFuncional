import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Login } from './app/(auth)/Login';
import { Register } from './app/(auth)/Register';
import { Activate } from './app/(auth)/Activate';
import { Dashboard as UserDashboard } from './app/(user)/Dashboard';
import { Empresas as UserEmpresas } from './app/(user)/Empresas';
import { Assinaturas as UserAssinaturas } from './app/(user)/Assinaturas';
import { Pagamentos as UserPagamentos } from './app/(user)/Pagamentos';
import { Configuracoes as UserConfiguracoes } from './app/(user)/Configuracoes';
import { MenuMobile as UserMenuMobile } from './app/(user)/MenuMobile';
import { BusinessDashboard } from './app/(business)/Dashboard';
import { Clientes } from './app/(business)/Clientes';
import { Planos } from './app/(business)/Planos';
import { Assinaturas } from './app/(business)/Assinaturas';
import { Pagamentos } from './app/(business)/Pagamentos';
import { Relatorios } from './app/(business)/Relatorios';
import { Configuracoes } from './app/(business)/Configuracoes';
import { MenuMobile } from './app/(business)/MenuMobile';
import { Welcome } from './app/Welcome';
import { sessionService } from './services/session';

// --- Guards de Rota (Proteção por Tipo de Usuário) ---

// Protege rotas de CLIENTE
const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const session = sessionService.getSession();
  
  // 1. Não logado -> Login Cliente
  if (!session.token) {
    return <Navigate to="/login?type=client" replace />;
  }

  // 2. Logado como Empresa tentando acessar área de Cliente -> Manda para área Empresa
  if (session.user?.tipo === 'Empresa') {
    return <Navigate to="/business/dashboard" replace />;
  }

  return <>{children}</>;
};

// Protege rotas de EMPRESA (ADMIN)
const BusinessRoute = ({ children }: { children: React.ReactNode }) => {
  const session = sessionService.getSession();

  // 1. Não logado -> Login Business
  if (!session.token) {
    return <Navigate to="/login?type=business" replace />;
  }

  // 2. Logado como Cliente tentando acessar área Admin -> Manda para área Cliente
  if (session.user?.tipo !== 'Empresa') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          
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
            path="/configuracoes" 
            element={
              <ClientRoute>
                <UserConfiguracoes />
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