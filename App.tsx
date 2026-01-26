import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './app/(auth)/Login';
import { Register } from './app/(auth)/Register';
import { Activate } from './app/(auth)/Activate';
import { Dashboard as UserDashboard } from './app/(user)/Dashboard';
import { BusinessDashboard } from './app/(business)/Dashboard';
import { Clientes } from './app/(business)/Clientes';
import { Planos } from './app/(business)/Planos';
import { Welcome } from './app/Welcome';
import { sessionService } from './services/session';

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = sessionService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
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
        
        {/* Default redirect for business sub-routes */}
        <Route path="/business/*" element={<Navigate to="/business/dashboard" />} />

      </Routes>
    </HashRouter>
  );
};

export default App;