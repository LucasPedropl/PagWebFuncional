import React from 'react';
import { usePublicCompanies } from '../hooks/usePublicCompanies';
import { LandingHeader } from '../components/features/landing/LandingHeader';
import { LandingHero } from '../components/features/landing/LandingHero';
import { AccessPathCards } from '../components/features/landing/AccessPathCards';
import { LandingDirectory } from '../components/features/landing/LandingDirectory';
import { LandingFooter } from '../components/features/landing/LandingFooter';

export const Landing: React.FC = () => {
  const { companies, isLoading, error, refresh } = usePublicCompanies();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col selection:bg-blue-500/25">
      <LandingHeader />

      <main className="flex-1">
        <LandingHero establishmentCount={companies.length} />

        <section id="acesso" className="py-16 sm:py-20 bg-white border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AccessPathCards
              title="Ainda não tem conta?"
              subtitle="Cadastre-se em poucos minutos ou entre com suas credenciais."
            />
          </div>
        </section>

        <LandingDirectory
          companies={companies}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
        />
      </main>

      <LandingFooter />
    </div>
  );
};
