import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { AdminUpgradePage } from '../../features/admin-upgrade/components/AdminUpgradePage';
import { sessionService } from '../../services/session';

export const TornarEstabelecimento: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { user } = sessionService.getSession();
    if (user?.tipo === 'Empresa' || sessionService.isEmpresaOwner()) {
      navigate('/business/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <UserLayout>
      <AdminUpgradePage />
    </UserLayout>
  );
};
