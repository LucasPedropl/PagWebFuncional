import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  children: React.ReactNode;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, onClear, title = "Filtros", children }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 space-y-6">
        {children}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClear}>Limpar</Button>
          <Button onClick={onApply} className="bg-slate-900 hover:bg-slate-800">Aplicar Filtros</Button>
        </div>
      </div>
    </Modal>
  );
};
