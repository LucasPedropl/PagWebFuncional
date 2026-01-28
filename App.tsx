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

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = sessionService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
          
          {/* User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/empresas" 
            element={
              <PrivateRoute>
                <UserEmpresas />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/assinaturas" 
            element={
              <PrivateRoute>
                <UserAssinaturas />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pagamentos" 
            element={
              <PrivateRoute>
                <UserPagamentos />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/configuracoes" 
            element={
              <PrivateRoute>
                <UserConfiguracoes />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/menu" 
            element={
              <PrivateRoute>
                <UserMenuMobile />
              </PrivateRoute>
            } 
          />

          {/* Business Routes */}
          <Route 
            path="/business/dashboard" 
            element={
              <PrivateRoute>
                <BusinessDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/clientes" 
            element={
              <PrivateRoute>
                <Clientes />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/planos" 
            element={
              <PrivateRoute>
                <Planos />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/assinaturas" 
            element={
              <PrivateRoute>
                <Assinaturas />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/pagamentos" 
            element={
              <PrivateRoute>
                <Pagamentos />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/relatorios" 
            element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/configuracoes" 
            element={
              <PrivateRoute>
                <Configuracoes />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/business/menu" 
            element={
              <PrivateRoute>
                <MenuMobile />
              </PrivateRoute>
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