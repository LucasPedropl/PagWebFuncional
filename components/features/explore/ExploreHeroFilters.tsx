import React from 'react';
import { MapPin } from 'lucide-react';
import { SearchSelect } from '../../ui/SearchSelect';
import { formInputClass, formLabelClass } from '../../ui/formStyles';

export type ExploreCatalogTab = 'estabelecimentos' | 'planos' | 'servicos' | 'produtos';

interface ExploreSelectOption {
  value: string;
  label: string;
}

interface ExploreHeroFiltersProps {
  activeTab: ExploreCatalogTab;
  connectionStatus: string;
  onConnectionStatusChange: (value: string) => void;
  locationUf: string;
  onLocationUfChange: (value: string) => void;
  locationCity: string;
  onLocationCityChange: (value: string) => void;
  ufOptions: ExploreSelectOption[];
  cityOptions: ExploreSelectOption[];
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
}

const CONNECTION_OPTIONS: ExploreSelectOption[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Conectados', label: 'Já conectados' },
  { value: 'NaoConectados', label: 'Não conectados' },
];

export const ExploreHeroFilters: React.FC<ExploreHeroFiltersProps> = ({
  activeTab,
  connectionStatus,
  onConnectionStatusChange,
  locationUf,
  onLocationUfChange,
  locationCity,
  onLocationCityChange,
  ufOptions,
  cityOptions,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}) => (
  <div className="mt-4 max-w-3xl rounded-xl bg-white p-4 sm:p-5 text-left shadow-lg ring-1 ring-black/5">
    <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
      <MapPin className="h-3.5 w-3.5" />
      Filtros
    </p>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <SearchSelect
        label="Estado"
        options={ufOptions}
        value={locationUf}
        onChange={(val) => onLocationUfChange(String(val))}
        placeholder="Todos os estados"
      />
      <SearchSelect
        label="Cidade"
        options={cityOptions}
        value={locationCity}
        onChange={(val) => onLocationCityChange(String(val))}
        placeholder="Todas as cidades"
      />
      {activeTab === 'estabelecimentos' ? (
        <div className="sm:col-span-2">
          <SearchSelect
            label="Conexão"
            options={CONNECTION_OPTIONS}
            value={connectionStatus}
            onChange={(val) => onConnectionStatusChange(String(val))}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={formLabelClass}>Preço mínimo</label>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="R$ 0"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className={formInputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={formLabelClass}>Preço máximo</label>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="R$ 0"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className={formInputClass}
            />
          </div>
        </>
      )}
    </div>
  </div>
);
