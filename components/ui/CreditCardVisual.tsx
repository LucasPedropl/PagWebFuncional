import React from 'react';

interface CreditCardVisualProps {
  number: string;
  holder: string;
  expiry: string;
  cvv?: string;
  brand?: string;
  isFlipped?: boolean;
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  number,
  holder,
  expiry,
  cvv,
  brand,
  isFlipped = false,
}) => {
  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    if (match) {
      return match.join(' ');
    }
    return '•••• •••• •••• ••••';
  };

  const displayBrand = brand || (number.startsWith('4') ? 'Visa' : number.startsWith('5') ? 'Mastercard' : 'Cartão');

  return (
    <div className="w-[320px] h-[200px] rounded-2xl text-white shadow-xl relative overflow-hidden transition-transform duration-500 transform-gpu mx-auto" style={{ perspective: '1000px' }}>
      <div className={`w-full h-full absolute inset-0 transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* Front */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-500 opacity-10 rounded-full blur-xl"></div>
          
          <div className="flex justify-between items-start z-10">
            <div className="w-12 h-8 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md opacity-80"></div>
            <div className="text-lg font-bold italic opacity-80">{displayBrand}</div>
          </div>
          
          <div className="z-10 mt-4">
            <div className="font-mono text-xl tracking-widest mb-2 shadow-sm">
              {number ? formatNumber(number) : '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest opacity-60">Titular</span>
                <span className="font-medium tracking-wider truncate max-w-[160px] text-sm">
                  {holder || 'NOME DO TITULAR'}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] uppercase tracking-widest opacity-60">Validade</span>
                <span className="font-medium tracking-wider text-sm">
                  {expiry || 'MM/AA'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col justify-center">
          <div className="w-full h-10 bg-black mb-4 mt-4"></div>
          <div className="px-6 flex justify-end items-center">
            <div className="bg-white w-full h-8 rounded flex items-center justify-end px-3 text-black font-mono text-sm italic">
              {cvv || '•••'}
            </div>
          </div>
          <div className="flex-1"></div>
        </div>
        
      </div>
    </div>
  );
};
