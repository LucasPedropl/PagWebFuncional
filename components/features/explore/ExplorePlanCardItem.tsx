import React from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '../../ui/Button';
import { CompanyBrandAvatar } from '../../ui/CompanyBrandAvatar';
import { ExplorePlanCard } from '../../../types';

interface ExplorePlanCardItemProps {
  plan: ExplorePlanCard;
  isSubscribing?: boolean;
  onSubscribe: () => void;
  onViewEstablishment?: () => void;
  isSubscribed?: boolean;
  onContact?: () => void;
}

export const ExplorePlanCardItem: React.FC<ExplorePlanCardItemProps> = ({
  plan,
  isSubscribing,
  onSubscribe,
  onViewEstablishment,
  isSubscribed = false,
  onContact,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
      <CompanyBrandAvatar
        name={plan.establishmentName}
        logoUrl={plan.establishmentLogoUrl}
        seed={plan.idEmpresa}
        className="w-10 h-10 rounded-lg"
      />
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{plan.establishmentName}</h4>
        {onViewEstablishment && (
          <button
            type="button"
            onClick={onViewEstablishment}
            className="text-xs text-blue-600 hover:underline"
          >
            Ver estabelecimento
          </button>
        )}
      </div>
    </div>

    <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{plan.name}</h4>

    {plan.features.length > 0 && (
      <ul className="mb-4 space-y-1.5 flex-1">
        {plan.features.slice(0, 5).map((feature) => (
          <li key={feature} className="flex items-start text-sm text-gray-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{feature}</span>
          </li>
        ))}
        {plan.features.length > 5 && (
          <li className="text-xs text-gray-400 pl-5">+{plan.features.length - 5} funcionalidade(s)</li>
        )}
      </ul>
    )}

    <div className="mb-4 mt-auto">
      <span className="text-2xl font-extrabold text-gray-900">
        R$ {plan.price.toFixed(2).replace('.', ',')}
      </span>
      <span className="text-sm text-gray-500">/mês</span>
    </div>

    <div className="flex gap-2 w-full mt-auto">
      <div className="flex-1">
        {isSubscribed ? (
          <Button
            className="w-full bg-slate-900 text-white"
            disabled
          >
            Plano já assinado
          </Button>
        ) : plan.plan?.assinarPorCliente === false ? (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
            onClick={onContact}
          >
            Entrar em contato
          </Button>
        ) : (
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            isLoading={isSubscribing}
            onClick={onSubscribe}
          >
            Assinar agora
          </Button>
        )}
      </div>
      {onContact && (
        <Button
          variant="outline"
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 p-2.5"
          title="Tirar dúvidas no chat"
          onClick={onContact}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      )}
    </div>
  </div>
);
