import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Start progress bar animation
    const startTime = Date.now();
    const endTime = startTime + duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percentage = (remaining / duration) * 100;
      
      setProgress(percentage);

      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 10); // Update frequently for smooth animation

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(id), 300); // Wait for exit animation
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleClose();
  };

  return (
    <div 
      onContextMenu={handleContextMenu}
      className={`
        relative w-80 bg-white rounded-lg shadow-lg border-l-4 overflow-hidden mb-3 transition-all duration-300 ease-in-out transform
        ${isClosing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${type === 'success' ? 'border-green-500' : 'border-red-500'}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
        <div 
          className={`h-full transition-all ease-linear ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
};