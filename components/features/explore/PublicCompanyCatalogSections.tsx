import React from 'react';
import { Loader2, Package, Scissors, Tags } from 'lucide-react';
import { Categoria, CatalogItem } from '../../../features/catalog/schemas/catalogSchemas';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

interface PublicCompanyCatalogSectionsProps {
  categorias: Categoria[];
  servicos: CatalogItem[];
  produtos: CatalogItem[];
  isLoading: boolean;
  error: string | null;
}

const CatalogGrid: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: CatalogItem[];
  emptyText: string;
}> = ({ title, icon, items, emptyText }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
        {items.length}
      </span>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyText}</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-bold text-slate-900">{item.nome}</h4>
              <span className="font-semibold text-blue-600 shrink-0">
                {formatServicePrice(item.preco)}
              </span>
            </div>
            {item.descricao ? (
              <p className="text-sm text-slate-500 mt-2 line-clamp-3">{item.descricao}</p>
            ) : null}
          </div>
        ))}
      </div>
    )}
  </section>
);

/** Seções de catálogo público para /empresa/:id. */
export const PublicCompanyCatalogSections: React.FC<PublicCompanyCatalogSectionsProps> = ({
  categorias,
  servicos,
  produtos,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-10">
      {categorias.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-slate-500" />
            <h3 className="text-xl font-black text-slate-900">Categorias</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700"
                title={cat.descricao}
              >
                {cat.nome}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <CatalogGrid
        title="Serviços"
        icon={<Scissors className="w-5 h-5 text-violet-600" />}
        items={servicos}
        emptyText="Nenhum serviço publicado."
      />
      <CatalogGrid
        title="Produtos"
        icon={<Package className="w-5 h-5 text-sky-600" />}
        items={produtos}
        emptyText="Nenhum produto publicado."
      />
    </div>
  );
};
