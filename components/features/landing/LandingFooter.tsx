import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, Building2 } from 'lucide-react';
import { Button } from '../../ui/Button';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-slate-800 p-2 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight">PagWeb</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              O hub definitivo de assinaturas, serviços e gestão para clientes e estabelecimentos
              parceiros.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Button
              variant="outline"
              onClick={() => navigate('/login?type=client')}
              className="rounded-xl border-slate-700 bg-transparent text-white hover:bg-slate-900 h-11 font-semibold"
            >
              <User className="w-4 h-4 mr-2" />
              Login Cliente
            </Button>
            <Button
              onClick={() => navigate('/login?type=business')}
              className="rounded-xl bg-white text-slate-900 hover:bg-slate-100 h-11 font-semibold"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Login Estabelecimento
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} PagWeb</span>
          <div className="flex items-center gap-5">
            <button type="button" className="hover:text-slate-300 transition-colors">
              Termos de Uso
            </button>
            <button type="button" className="hover:text-slate-300 transition-colors">
              Privacidade
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
