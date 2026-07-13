import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  onSubmit?: (e: React.FormEvent) => void;
  zIndexClass?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  onSubmit,
  zIndexClass = 'z-50'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-6xl'
  };

  const ContentWrapper = onSubmit ? 'form' : 'div';

  return (
    <div className={`fixed inset-0 ${zIndexClass} overflow-y-auto`}>
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Panel */}
        <ContentWrapper 
          onSubmit={onSubmit}
          className={`relative transform overflow-visible rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 w-full ${sizeClasses[size]}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-xl">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body — overflow-visible para dropdowns (SearchSelect) não ficarem cortados */}
          <div className="px-6 py-6 overflow-visible">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              {footer}
            </div>
          )}
        </ContentWrapper>
      </div>
    </div>
  );
};