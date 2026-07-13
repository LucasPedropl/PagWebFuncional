import React from 'react';
import { Package, Scissors, Store } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ExploreCatalogItem } from '../../../features/catalog/schemas/catalogSchemas';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

interface ExploreCatalogCardItemProps {
  item: ExploreCatalogItem;
  establishmentName: string;
  onViewEstablishment: () => void;
}

/** Card de produto/serviço na aba Explorar (catálogo API). */
export const ExploreCatalogCardItem: React.FC<ExploreCatalogCardItemProps> = ({
  item,
  establishmentName,
  onViewEstablishment,
}) => {
  const isService = item.kind === 'servico';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isService ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'
            }`}
          >
            {isService ? <Scissors className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {isService ? 'Serviço' : 'Produto'}
            </p>
            <h3 className="font-semibold text-gray-900">{item.nome}</h3>
            <p className="text-xs text-gray-500">{establishmentName}</p>
          </div>
        </div>
        <span className="text-lg font-bold text-slate-900 shrink-0">
          {formatServicePrice(item.preco)}
        </span>
      </div>

      {item.descricao ? (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.descricao}</p>
      ) : null}

      {item.categorias.length > 0 ? (
        <p className="text-xs text-gray-400 mb-4">
          {item.categorias.map((c) => c.nome ?? `#${c.id}`).join(' · ')}
        </p>
      ) : null}

      <Button
        onClick={onViewEstablishment}
        className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white"
      >
        <Store className="w-4 h-4 mr-2" />
        Ver estabelecimento
      </Button>
    </div>
  );
};
