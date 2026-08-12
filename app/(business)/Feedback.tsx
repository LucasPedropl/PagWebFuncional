import React from 'react';
import { Navigate } from 'react-router-dom';

/** Mantém deep link antigo; feedback fica no menu de Configurações. */
export const Feedback: React.FC = () => (
  <Navigate to="/business/configuracoes?tab=feedback" replace />
);
