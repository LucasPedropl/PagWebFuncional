import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, Building2 } from 'lucide-react';
import { Button } from '../../ui/Button';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.25rem] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-2 rounded-xl shadow-lg shadow-slate-900/15 group-hover:scale-105 transition-transform">
            <CreditCard className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">PagWeb</span>
        </button>

        <nav className="hidden lg:flex items-center gap-8">
          <a
            href="#acesso"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Como acessar
          </a>
          <a
            href="#estabelecimentos"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Explorar
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/login?type=client')}
            className="hidden sm:flex rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 h-10 px-4 text-sm font-semibold"
          >
            <User className="w-4 h-4 mr-2" />
            Sou Cliente
          </Button>
          <Button
            onClick={() => navigate('/login?type=business')}
            className="rounded-full bg-slate-900 hover:bg-slate-800 h-10 px-4 sm:px-5 text-sm font-semibold shadow-md shadow-slate-900/15"
          >
            <Building2 className="w-4 h-4 mr-2 hidden sm:block" />
            <span className="sm:hidden">Empresa</span>
            <span className="hidden sm:inline">Sou Estabelecimento</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
