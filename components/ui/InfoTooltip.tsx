
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calcula posição centralizada acima do elemento
      setCoords({
        left: rect.left + rect.width / 2,
        top: rect.top - 8 // Um pouco acima do elemento
      });
      setIsVisible(true);
    }
  };

  const handleScroll = () => {
      if (isVisible) setIsVisible(false);
  };

  useEffect(() => {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className="group relative inline-flex ml-1.5 align-middle w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex-shrink-0 items-center justify-center cursor-help transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        <HelpCircle className="w-3 h-3" />
      </div>
      
      {isVisible && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl pointer-events-none max-w-[250px] text-center leading-relaxed animate-fadeIn"
          style={{
            left: coords.left,
            top: coords.top,
            transform: 'translate(-50%, -100%)', // Move para cima e centraliza
          }}
        >
          {text}
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>,
        document.body
      )}
    </>
  );
};
