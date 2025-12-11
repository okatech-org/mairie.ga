import React from 'react';
import { Helmet } from 'react-helmet';
import SemanticSearchDemo from '@/components/iasted/SemanticSearchDemo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimulationBanner } from '@/components/SimulationBanner';

const KnowledgeSearchPage = () => {
  return (
    <>
      <Helmet>
        <title>Recherche Base de Connaissances | iAsted</title>
        <meta name="description" content="Recherche sémantique intelligente dans la base de connaissances municipale iAsted" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <SimulationBanner />
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Base de Connaissances iAsted</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Utilisez la recherche sémantique pour trouver rapidement des informations 
              sur les services municipaux, les démarches administratives et plus encore.
            </p>
          </div>
          
          <SemanticSearchDemo />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default KnowledgeSearchPage;
