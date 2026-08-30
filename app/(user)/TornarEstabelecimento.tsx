import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { AdminUpgradePage } from '../../features/admin-upgrade/components/AdminUpgradePage';
import { sessionService } from '../../services/session';

export const TornarEstabelecimento: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const { user } = sessionService.getSession();

    if (user?.tipo === 'Empresa' || sessionService.isEmpresaOwner()) {
      navigate('/business/dashboard', { replace: true });
      return;
    }

    // A marca local some no logout, então "não é dono" pode ser só esquecimento.
    // Confirma no servidor antes de oferecer o cadastro: sem isto, um
    // estabelecimento que saiu e voltou criaria uma SEGUNDA empresa.
    if (!sessionService.getCredentials()) return;
    sessionService
      .switchToMode('admin')
      .then(() => {
        if (!cancelled) navigate('/business/dashboard', { replace: true });
      })
      .catch(() => {
        /* recusado: é cliente mesmo, o cadastro abaixo é o destino certo */
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <UserLayout>
      <AdminUpgradePage />
    </UserLayout>
  );
};
