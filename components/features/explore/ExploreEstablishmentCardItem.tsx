import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { CompanyBrandAvatar } from '../../ui/CompanyBrandAvatar';
import { ExploreEstablishmentCard } from '../../../types';

interface ExploreEstablishmentCardItemProps {
  establishment: ExploreEstablishmentCard;
  onClick: () => void;
}

export const ExploreEstablishmentCardItem: React.FC<ExploreEstablishmentCardItemProps> = ({
  establishment,
  onClick,
}) => (
  <div
    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col"
    onClick={onClick}
  >
    <div className="relative h-40 md:h-48 overflow-hidden bg-slate-50 flex items-center justify-center p-5 md:p-6">
      <CompanyBrandAvatar
        name={establishment.name}
        logoUrl={establishment.logoUrl}
        seed={establishment.idEmpresa}
        className={
          establishment.logoUrl
            ? 'h-full w-full max-w-[14rem] rounded-2xl'
            : 'w-24 h-24 md:w-28 md:h-28 rounded-2xl'
        }
        textClassName="text-2xl md:text-3xl font-bold"
      />
      {establishment.isConnected && (
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Conectado
        </div>
      )}
    </div>
    <div className="p-4 md:p-5 flex flex-col flex-1">
      <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{establishment.name}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{establishment.description}</p>
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {establishment.planCount} plano{establishment.planCount !== 1 ? 's' : ''}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  </div>
);
