import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { sessionService } from '../../../services/session';
import { useAdminUpgrade } from '../hooks/useAdminUpgrade';
import { AdminUpgradeAddons } from './AdminUpgradeAddons';
import { AdminUpgradeHero, AdminUpgradeModePicker } from './AdminUpgradeHero';
import { AdminUpgradePjForm } from './AdminUpgradePjForm';

export const AdminUpgradePage: React.FC = () => {
  const {
    mode,
    setMode,
    pjForm,
    updatePjField,
    logoFile,
    setLogoFile,
    requestPayment,
    setRequestPayment,
    requestWhatsapp,
    setRequestWhatsapp,
    password,
    setPassword,
    isSubmitting,
    error,
    submit,
  } = useAdminUpgrade();

  const { user } = sessionService.getSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminUpgradeHero />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Como você quer ser admin?</h2>
        <AdminUpgradeModePicker mode={mode} onSelect={setMode} />
      </section>

      {mode === 'pj' ? (
        <AdminUpgradePjForm
          values={pjForm}
          onChange={updatePjField}
          logoFile={logoFile}
          onLogoChange={setLogoFile}
        />
      ) : null}

      {mode === 'pf' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Confirmar criação pessoal</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Vamos criar automaticamente um estabelecimento PF com o nome e CPF da sua
                conta
                {user?.nome ? (
                  <>
                    {' '}
                    (<span className="font-medium text-slate-800">{user.nome}</span>
                    {user.cpf ? <> · {user.cpf}</> : null})
                  </>
                ) : null}
                . Depois disso você já entra no painel admin.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {mode ? (
        <>
          <AdminUpgradeAddons
            requestPayment={requestPayment}
            requestWhatsapp={requestWhatsapp}
            onPaymentChange={setRequestPayment}
            onWhatsappChange={setRequestWhatsapp}
            password={password}
            onPasswordChange={setPassword}
          />

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500 max-w-md">
              Ao continuar, você confirma a criação do estabelecimento e, se marcados, a
              solicitação dos módulos.
            </p>
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={() => void submit()}
              className="sm:min-w-[12rem]"
            >
              {mode === 'pf' ? 'Confirmar e virar admin' : 'Criar empresa e virar admin'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
