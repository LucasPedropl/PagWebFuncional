import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface SearchSelectProps {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  error,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white transition-all text-left focus:outline-none focus:ring-2 focus:ring-slate-900 ${
            error ? 'border-red-500 ring-red-200' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'text-gray-900 hover:border-gray-400 shadow-sm'}`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <span>{selectedOption.icon}</span>}
            <span className="truncate">
              {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}>
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      value === opt.value 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon && <span>{opt.icon}</span>}
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{opt.label}</span>
                        {opt.subLabel && (
                          <span className={`text-[10px] ${value === opt.value ? 'text-slate-300' : 'text-gray-500'}`}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === opt.value && <Check className="w-4 h-4" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Nenhuma opção encontrada
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
