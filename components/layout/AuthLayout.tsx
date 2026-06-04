import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { AuthAudience, getAuthTheme } from '../../utils/authTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  audience: AuthAudience;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  wide?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  audience,
  title,
  subtitle,
  footer,
  wide = false,
}) => {
  const theme = getAuthTheme(audience);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <aside
        className={`relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gradient-to-br ${theme.heroGradient}`}
      >
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl ${theme.glowColor}`} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 rounded-[5px] bg-white/10 backdrop-blur-md border border-white/10 shadow-xl">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">PagWeb</span>
              <span
                className={`ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[5px] bg-white/10 ${theme.accentText}`}
              >
                {theme.label}
              </span>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight max-w-md">
            {theme.heroTitle}
          </h1>
          <p className="mt-4 text-base text-white/70 max-w-sm leading-relaxed">
            {theme.heroSubtitle}
          </p>
        </div>

        <ul className="relative z-10 space-y-5 mt-12">
          {theme.features.map((feature) => (
            <li key={feature.title} className="flex gap-4">
              <div className="w-11 h-11 rounded-[5px] bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <feature.icon className={`w-5 h-5 ${theme.accentText}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative z-10 text-[11px] text-white/40 mt-8">
          © {new Date().getFullYear()} PagWeb — gestão de assinaturas
        </p>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <div className="lg:hidden px-5 pt-6 pb-2 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Início
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[5px] bg-slate-900 shadow-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-900">PagWeb</span>
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[5px] ${theme.badgeClass}`}
            >
              {theme.label}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-[5px] border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
              {children}
            </div>

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
};
