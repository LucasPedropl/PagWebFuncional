import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { formLabelClass, FORM_RADIUS, resolveFormFieldClass } from './formStyles';
import { SelectOption } from './SearchSelect';

interface MultiSearchSelectProps {
  label?: string;
  options: SelectOption[];
  value: Array<string | number>;
  onChange: (value: Array<string | number>) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  roundedClass?: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

const valuesMatch = (a: string | number, b: string | number): boolean =>
  String(a) === String(b);

/** Select pesquisável com múltipla seleção (portal, não corta em Modal). */
export const MultiSearchSelect: React.FC<MultiSearchSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione…',
  error,
  hint,
  className = '',
  disabled = false,
  roundedClass = FORM_RADIUS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.some((v) => valuesMatch(v, opt.value))),
    [options, value],
  );

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280 && rect.top > spaceBelow;
    setPos({
      top: openUp ? rect.top : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleValue = (optionValue: string | number) => {
    const exists = value.some((v) => valuesMatch(v, optionValue));
    if (exists) {
      onChange(value.filter((v) => !valuesMatch(v, optionValue)));
      return;
    }
    onChange([...value, optionValue]);
  };

  const triggerLabel = (() => {
    if (selectedOptions.length === 0) {
      return <span className="text-slate-400">{placeholder}</span>;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0]?.label;
    }
    if (selectedOptions.length <= 2) {
      return selectedOptions.map((o) => o.label).join(', ');
    }
    return `${selectedOptions.length} selecionados`;
  })();

  const triggerClass = `${resolveFormFieldClass({ error: !!error, disabled })} flex items-center justify-between text-left shadow-sm ${
    disabled ? '' : 'cursor-pointer hover:border-slate-400'
  }`;

  const dropdown =
    isOpen && pos
      ? createPortal(
          <div
            ref={dropdownRef}
            className={`fixed z-[200] bg-white border border-slate-200 ${roundedClass} shadow-xl animate-in fade-in zoom-in-95 duration-200`}
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.openUp
                ? { bottom: window.innerHeight - pos.top + 4, top: 'auto' }
                : { top: pos.top }),
            }}
          >
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400 text-slate-900"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button type="button" onClick={() => setSearchTerm('')}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              ) : null}
            </div>
            <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value.some((v) => valuesMatch(v, opt.value));
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => toggleValue(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm ${FORM_RADIUS} transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {opt.icon ? <span>{opt.icon}</span> : null}
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{opt.label}</span>
                          {opt.subLabel ? (
                            <span
                              className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                            >
                              {opt.subLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {isSelected ? <Check className="w-4 h-4" /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  Nenhuma opção encontrada
                </div>
              )}
            </div>
            {value.length > 0 ? (
              <div className="border-t border-slate-100 p-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">{value.length} selecionado(s)</span>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 hover:text-slate-900"
                  onClick={() => onChange([])}
                >
                  Limpar
                </button>
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label ? <label className={formLabelClass}>{label}</label> : null}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={triggerClass}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{triggerLabel}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {dropdown}
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
};
