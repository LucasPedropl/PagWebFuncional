import React from 'react';
import { Input } from '../../../components/ui/Input';
import { ADMIN_UPGRADE_PRICING } from '../schemas/adminUpgradeSchemas';

interface AdminUpgradeAddonsProps {
  requestPayment: boolean;
  requestWhatsapp: boolean;
  onPaymentChange: (value: boolean) => void;
  onWhatsappChange: (value: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
}

export const AdminUpgradeAddons: React.FC<AdminUpgradeAddonsProps> = ({
  requestPayment,
  requestWhatsapp,
  onPaymentChange,
  onWhatsappChange,
  password,
  onPasswordChange,
}) => {
  const estimated =
    (requestPayment ? ADMIN_UPGRADE_PRICING.payment.amount : 0) +
    (requestWhatsapp ? ADMIN_UPGRADE_PRICING.whatsapp.amount : 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Módulos administrativos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Marque o que quer liberar. A solicitação não é enviada aqui: ao concluir, você vai para
          Integrações e finaliza com um código de verificação enviado por e-mail. Até a aprovação
          do time PagWeb você cadastra cobranças normalmente; PIX/boleto dos clientes e WhatsApp
          só depois.
        </p>
      </div>

      <AddonRow
        checked={requestPayment}
        onChange={onPaymentChange}
        title={ADMIN_UPGRADE_PRICING.payment.label}
        price={ADMIN_UPGRADE_PRICING.payment.priceLabel}
        description="Gateway Bixs, cobranças e conciliação no painel."
      />
      <AddonRow
        checked={requestWhatsapp}
        onChange={onWhatsappChange}
        title={ADMIN_UPGRADE_PRICING.whatsapp.label}
        price={ADMIN_UPGRADE_PRICING.whatsapp.priceLabel}
        description="Mensagens e automações via WhatsApp conectado."
      />

      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
        <span className="text-slate-600">Estimativa mensal (fake)</span>
        <span className="font-semibold text-slate-900">
          {estimated === 0
            ? 'R$ 0,00'
            : estimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      <Input
        label="Senha da conta (confirmação)"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Sua senha de login"
      />
    </div>
  );
};

const AddonRow: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  price: string;
  description: string;
}> = ({ checked, onChange, title, price, description }) => (
  <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 cursor-pointer hover:bg-slate-50/80 transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 rounded border-slate-300"
    />
    <span className="min-w-0 flex-1">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <span className="text-xs font-medium text-slate-500 shrink-0">{price}</span>
      </span>
      <span className="block text-sm text-slate-500 mt-0.5">{description}</span>
    </span>
  </label>
);
