import React from 'react';
import { Navigate } from 'react-router-dom';

/** Rota legada: Integrações vive em Configurações. */
export const Integracoes: React.FC = () => (
  <Navigate to="/business/configuracoes?tab=integracoes" replace />
);
